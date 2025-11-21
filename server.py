#!/usr/bin/env python3
"""
Velocity Smart-Traffic Testbed Server
Flask + Flask-SocketIO backend for emergency vehicle geofence simulation
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import time
import threading
import logging
import os

# ==============================================================================
# Configuration
# ==============================================================================

# Server configuration
HOST = '0.0.0.0'  # Bind to all interfaces for LAN testing
PORT = int(os.environ.get('PORT', 5000))  # Use environment PORT or default 5000

# Junction configuration (dynamic - updated by device locations)
# In this setup, the laptop's location becomes the junction
JUNCTIONS_CONFIG = {
    "junction1": {
        "name": "Dynamic Junction",
        "lat": 40.7580,  # Default - will be updated by laptop GPS
        "lng": -73.9855,  # Default - will be updated by laptop GPS
        "geofence_radius_m": 1,  # 1 meter for device-to-device proximity
        "last_updated": None
    }
}

# Traffic light timing configuration (milliseconds)
EMERGENCY_DURATION_MS = 5000  # Emergency GREEN duration (3 seconds - quick for testing)
YELLOW_DURATION_MS = 1000  # YELLOW transition duration
TRIGGER_EXTENSION_MS = 2000  # Extension when already GREEN

# Junction cycling configuration
CYCLE_DURATION_MS = 20000  # Total cycle duration (20 seconds)
SIGNAL_GREEN_TIME_MS = 4000  # Each signal gets 4 seconds green
SIGNAL_YELLOW_TIME_MS = 1000  # 1 second yellow transition

# ==============================================================================
# Application Setup
# ==============================================================================

app = Flask(__name__, static_folder='public', static_url_path='')
app.config['SECRET_KEY'] = 'velocity-secret-key-change-in-production'
CORS(app)  # Enable CORS for local testing

# Initialize SocketIO with threading mode (compatible with Python 3.12+)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# ==============================================================================
# In-Memory State
# ==============================================================================

# Junction state: { junctionId: { "state": "RED"|"YELLOW"|"GREEN", "next_reset_ms": timestamp|None, "triggered_by": vehicleId } }
junctions = {}

# Initialize junctions from config with 4-way signals
# Signal directions: North (main/bigger), South, East, West
for junction_id, config in JUNCTIONS_CONFIG.items():
    junctions[junction_id] = {
        "signals": {
            "north": {"state": "RED", "is_main": True},   # Main/bigger signal
            "south": {"state": "RED", "is_main": False},
            "east": {"state": "RED", "is_main": False},
            "west": {"state": "RED", "is_main": False}
        },
        "mode": "auto_cycle",  # auto_cycle or emergency
        "current_cycle_signal": "north",
        "cycle_start_time": None,
        "emergency_active": False,
        "triggered_by": None,
        "lat": config["lat"],
        "lng": config["lng"],
        "geofence_radius_m": config["geofence_radius_m"],
        "name": config["name"]
    }

# Lock for thread-safe state updates
state_lock = threading.Lock()

# Timer references for cleanup
active_timers = {}

# ==============================================================================
# Helper Functions
# ==============================================================================

def current_time_ms():
    """Return current time in milliseconds"""
    return int(time.time() * 1000)


def cancel_timer(junction_id):
    """Cancel any active timer for a junction"""
    if junction_id in active_timers:
        timer = active_timers[junction_id]
        if timer and timer.is_alive():
            timer.cancel()
        del active_timers[junction_id]


def cycle_signals(junction_id):
    """Cycle through signals in sequence: North -> South -> East -> West"""
    with state_lock:
        if junction_id not in junctions:
            return
        
        junction = junctions[junction_id]
        
        # Only cycle if in auto mode (not emergency)
        if junction["mode"] != "auto_cycle":
            return
        
        # Cycle order
        cycle_order = ["north", "south", "east", "west"]
        current_index = cycle_order.index(junction["current_cycle_signal"])
        
        # Move to next signal
        next_index = (current_index + 1) % len(cycle_order)
        next_signal = cycle_order[next_index]
        
        # Set current signal to YELLOW first
        junction["signals"][junction["current_cycle_signal"]]["state"] = "YELLOW"
        
        # Broadcast yellow
        socketio.emit('junction_update', {
            "junctionId": junction_id,
            "signals": junction["signals"],
            "mode": junction["mode"],
            "timestamp": current_time_ms()
        })
        
        # After yellow duration, set to RED and next to GREEN
        def transition_to_next():
            with state_lock:
                # Current goes to RED
                junction["signals"][junction["current_cycle_signal"]]["state"] = "RED"
                
                # Next goes to GREEN
                junction["signals"][next_signal]["state"] = "GREEN"
                junction["current_cycle_signal"] = next_signal
                
                logger.info(f"Junction {junction_id}: {next_signal.upper()} signal is now GREEN")
                
                # Broadcast update
                socketio.emit('junction_update', {
                    "junctionId": junction_id,
                    "signals": junction["signals"],
                    "mode": junction["mode"],
                    "current_signal": next_signal,
                    "timestamp": current_time_ms()
                })
                
                # Schedule next cycle (green time + yellow time)
                timer = threading.Timer(SIGNAL_GREEN_TIME_MS / 1000.0, cycle_signals, args=[junction_id])
                timer.start()
                active_timers[f"{junction_id}_cycle"] = timer
        
        # Schedule transition after yellow
        timer = threading.Timer(SIGNAL_YELLOW_TIME_MS / 1000.0, transition_to_next)
        timer.start()


def start_auto_cycle(junction_id):
    """Start automatic signal cycling for a junction"""
    with state_lock:
        if junction_id not in junctions:
            return
        
        junction = junctions[junction_id]
        junction["mode"] = "auto_cycle"
        junction["emergency_active"] = False
        junction["current_cycle_signal"] = "north"
        
        # Set north to GREEN, others to RED
        junction["signals"]["north"]["state"] = "GREEN"
        junction["signals"]["south"]["state"] = "RED"
        junction["signals"]["east"]["state"] = "RED"
        junction["signals"]["west"]["state"] = "RED"
        
        logger.info(f"Junction {junction_id}: Starting auto cycle mode")
        
        # Broadcast update
        socketio.emit('junction_update', {
            "junctionId": junction_id,
            "signals": junction["signals"],
            "mode": junction["mode"],
            "current_signal": "north",
            "timestamp": current_time_ms()
        })
        
        # Start cycling
        timer = threading.Timer(SIGNAL_GREEN_TIME_MS / 1000.0, cycle_signals, args=[junction_id])
        timer.start()
        active_timers[f"{junction_id}_cycle"] = timer


def emergency_override(junction_id, vehicle_id):
    """Emergency mode: Main (North) signal GREEN, all others RED"""
    with state_lock:
        if junction_id not in junctions:
            return False
        
        junction = junctions[junction_id]
        
        # Cancel auto cycle
        if f"{junction_id}_cycle" in active_timers:
            active_timers[f"{junction_id}_cycle"].cancel()
            del active_timers[f"{junction_id}_cycle"]
        
        # Set mode to emergency
        junction["mode"] = "emergency"
        junction["emergency_active"] = True
        junction["triggered_by"] = vehicle_id
        
        # Main signal (North) to GREEN, all others to RED
        junction["signals"]["north"]["state"] = "GREEN"
        junction["signals"]["south"]["state"] = "RED"
        junction["signals"]["east"]["state"] = "RED"
        junction["signals"]["west"]["state"] = "RED"
        
        logger.info(f"Junction {junction_id}: EMERGENCY MODE - Vehicle {vehicle_id}")
        
        # Broadcast emergency state
        socketio.emit('junction_update', {
            "junctionId": junction_id,
            "signals": junction["signals"],
            "mode": "emergency",
            "triggeredBy": vehicle_id,
            "timestamp": current_time_ms()
        })
        
        # Return to auto cycle after emergency duration
        def end_emergency():
            logger.info(f"Junction {junction_id}: Ending emergency mode, returning to auto cycle")
            start_auto_cycle(junction_id)
        
        timer = threading.Timer(EMERGENCY_DURATION_MS / 1000.0, end_emergency)
        timer.start()
        active_timers[f"{junction_id}_emergency"] = timer
        
        return True


# Removed old set_junction_green function - replaced with emergency_override


# ==============================================================================
# HTTP Routes
# ==============================================================================

@app.route('/')
def index():
    """Serve landing page"""
    return send_from_directory('public', 'index.html')


@app.route('/vehicle.html')
def vehicle():
    """Serve vehicle simulator page"""
    return send_from_directory('public', 'vehicle.html')


@app.route('/signal.html')
def signal():
    """Serve signal visualizer page"""
    return send_from_directory('public', 'signal.html')


@app.route('/status', methods=['GET'])
def get_status():
    """
    GET /status - Return current state of all junctions
    
    Response:
    {
        "timestamp": 1690000000000,
        "junctions": {
            "junction1": {
                "state": "GREEN",
                "next_reset_ms": 1690000005000,
                "triggered_by": "veh123",
                "lat": 40.7580,
                "lng": -73.9855,
                "geofence_radius_m": 50,
                "name": "Main St & 5th Ave"
            }
        }
    }
    """
    with state_lock:
        return jsonify({
            "timestamp": current_time_ms(),
            "junctions": junctions
        })


@app.route('/trigger', methods=['POST'])
def trigger_junction():
    """
    POST /trigger - HTTP fallback to trigger a junction (for testing)
    
    Request body:
    {
        "junctionId": "junction1",
        "vehicleId": "veh123",
        "timestamp": 1690000000000
    }
    
    Response:
    {
        "success": true,
        "junctionId": "junction1",
        "state": "GREEN"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"success": False, "error": "No JSON body provided"}), 400
        
        junction_id = data.get('junctionId')
        vehicle_id = data.get('vehicleId', 'http-unknown')
        
        if not junction_id:
            return jsonify({"success": False, "error": "junctionId required"}), 400
        
        if junction_id not in junctions:
            return jsonify({"success": False, "error": f"Unknown junction: {junction_id}"}), 404
        
        # Trigger emergency mode
        success = emergency_override(junction_id, vehicle_id)
        
        if success:
            return jsonify({
                "success": True,
                "junctionId": junction_id,
                "mode": "emergency",
                "timestamp": current_time_ms()
            })
        else:
            return jsonify({
                "success": False,
                "error": "Failed to set junction to GREEN"
            }), 500
            
    except Exception as e:
        logger.error(f"Error in /trigger: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


# ==============================================================================
# Socket.IO Events
# ==============================================================================

@socketio.on('connect')
def handle_connect():
    """
    Handle client connection
    Send current state snapshot to newly connected client
    """
    logger.info(f"Client connected: {request.sid}")
    
    # Send current state to the newly connected client
    # Make a copy of junctions to avoid serialization issues
    with state_lock:
        junctions_copy = {}
        for jid, jdata in junctions.items():
            junctions_copy[jid] = dict(jdata)  # Create shallow copy
        
        emit('state_snapshot', {
            "timestamp": current_time_ms(),
            "junctions": junctions_copy,
            "success": True
        })
    
    logger.info(f"State snapshot sent to {request.sid}")


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {request.sid}")


@socketio.on('geofence_trigger')
def handle_geofence_trigger(data):
    """
    Handle geofence trigger from vehicle
    
    Expected payload:
    {
        "junctionId": "junction1",
        "vehicleId": "veh123",
        "timestamp": 1690000000000
    }
    """
    try:
        junction_id = data.get('junctionId')
        vehicle_id = data.get('vehicleId')
        timestamp = data.get('timestamp')
        
        logger.info(f"Geofence trigger received: Junction={junction_id}, Vehicle={vehicle_id}, Time={timestamp}")
        
        if not junction_id or not vehicle_id:
            emit('error', {"message": "junctionId and vehicleId required"})
            return
        
        if junction_id not in junctions:
            emit('error', {"message": f"Unknown junction: {junction_id}"})
            return
        
        # Trigger emergency mode
        success = emergency_override(junction_id, vehicle_id)
        
        if success:
            # Send acknowledgment back to triggering vehicle
            emit('trigger_ack', {
                "junctionId": junction_id,
                "vehicleId": vehicle_id,
                "mode": "emergency",
                "timestamp": current_time_ms()
            })
        
    except Exception as e:
        logger.error(f"Error handling geofence_trigger: {str(e)}")
        emit('error', {"message": str(e)})


@socketio.on('manual_override')
def handle_manual_override(data):
    """
    Handle manual override from signal UI
    
    Expected payload:
    {
        "junctionId": "junction1",
        "action": "emergency" | "auto_cycle"
    }
    """
    try:
        junction_id = data.get('junctionId')
        action = data.get('action')
        
        logger.info(f"Manual override: Junction={junction_id}, Action={action}")
        
        if not junction_id or not action:
            emit('error', {"message": "junctionId and action required"})
            return
        
        if junction_id not in junctions:
            emit('error', {"message": f"Unknown junction: {junction_id}"})
            return
        
        if action == "emergency":
            # Trigger emergency mode manually
            emergency_override(junction_id, "manual_override")
        elif action == "auto_cycle":
            # Return to auto cycle
            start_auto_cycle(junction_id)
        else:
            emit('error', {"message": "action must be 'emergency' or 'auto_cycle'"})
            return
        
    except Exception as e:
        logger.error(f"Error handling manual_override: {str(e)}")
        emit('error', {"message": str(e)})


@socketio.on('request_state')
def handle_request_state():
    """Handle explicit state request from client"""
    logger.info(f"State requested by {request.sid}")
    
    # Make a copy to avoid serialization issues
    with state_lock:
        junctions_copy = {}
        for jid, jdata in junctions.items():
            junctions_copy[jid] = dict(jdata)
        
        emit('state_snapshot', {
            "timestamp": current_time_ms(),
            "junctions": junctions_copy,
            "success": True
        })


@socketio.on('ping')
def handle_ping():
    """Handle ping from client to keep connection alive"""
    emit('pong', {"timestamp": current_time_ms()})


@socketio.on('update_junction_location')
def handle_update_junction_location(data):
    """
    Update junction location based on device GPS (laptop becomes the junction)
    
    Expected payload:
    {
        "junctionId": "junction1",
        "lat": 40.7580,
        "lng": -73.9855,
        "deviceType": "signal"
    }
    """
    try:
        junction_id = data.get('junctionId')
        lat = data.get('lat')
        lng = data.get('lng')
        device_type = data.get('deviceType', 'unknown')
        
        if not junction_id or lat is None or lng is None:
            emit('error', {"message": "junctionId, lat, and lng required"})
            return
        
        if junction_id not in junctions:
            emit('error', {"message": f"Unknown junction: {junction_id}"})
            return
        
        with state_lock:
            # Update junction location
            junctions[junction_id]["lat"] = lat
            junctions[junction_id]["lng"] = lng
            junctions[junction_id]["last_updated"] = current_time_ms()
            
            logger.info(f"Junction {junction_id} location updated: {lat}, {lng} (from {device_type})")
        
        # Broadcast updated location to all clients (especially vehicles)
        socketio.emit('junction_location_updated', {
            "junctionId": junction_id,
            "lat": lat,
            "lng": lng,
            "timestamp": current_time_ms()
        })
        
    except Exception as e:
        logger.error(f"Error updating junction location: {str(e)}")
        emit('error', {"message": str(e)})


# ==============================================================================
# Main Entry Point
# ==============================================================================

if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info("Velocity Smart-Traffic Testbed Server")
    logger.info("4-Way Junction with Auto Cycling")
    logger.info("=" * 60)
    logger.info(f"Starting server on {HOST}:{PORT}")
    logger.info(f"Junctions configured: {', '.join(JUNCTIONS_CONFIG.keys())}")
    logger.info("")
    logger.info("Access URLs:")
    logger.info(f"  Vehicle Simulator:  http://{HOST}:{PORT}/vehicle.html")
    logger.info(f"  Junction Dashboard: http://{HOST}:{PORT}/signal.html")
    logger.info(f"  Status API:         http://{HOST}:{PORT}/status")
    logger.info("")
    logger.info("For LAN testing, find your local IP and use:")
    logger.info(f"  http://<your-ip>:{PORT}/vehicle.html")
    logger.info("=" * 60)
    logger.info("")
    logger.info("Starting auto cycle for all junctions...")
    
    # Start auto cycling for all junctions
    for junction_id in junctions.keys():
        start_auto_cycle(junction_id)
        logger.info(f"  ✓ {junction_id} - Auto cycling started (20s cycle)")
    
    logger.info("")
    logger.info("=" * 60)
    
    # Run with SocketIO
    # allow_unsafe_werkzeug=True is fine for development/testing
    # For production on Railway/Zeabur, they use proper WSGI servers
    socketio.run(app, host=HOST, port=PORT, debug=False, allow_unsafe_werkzeug=True)


# Velocity Smart-Traffic Testbed

A minimal, real-time smart traffic system prototype that simulates emergency vehicle geofence detection and automatic traffic signal control. When a mobile device (simulating an emergency vehicle) enters a virtual geofence zone, the traffic light on a connected laptop browser automatically turns GREEN.

## 🎯 Features

- **Real-time Communication**: Uses Socket.IO for instant bidirectional communication between vehicles and signals
- **GPS Geofence Detection**: Automatic trigger when mobile device enters configured radius around junction
- **Manual Testing Mode**: One-tap trigger for easy testing without GPS
- **Visual Traffic Light**: Realistic traffic light widget with RED/YELLOW/GREEN states
- **Manual Override**: Emergency controls to force traffic light states
- **Event Logging**: Comprehensive logging of all system events
- **Statistics Dashboard**: Track triggers, activations, and system uptime
- **Mobile-First Design**: Clean, high-contrast UI optimized for touch devices
- **No Database Required**: All state managed in-memory for simplicity

## 📁 Project Structure

```
velocity-python/
├── requirements.txt          # Python dependencies
├── server.py                 # Flask + Socket.IO backend
├── README.md                 # This file
├── public/                   # Frontend static files
│   ├── vehicle.html          # Mobile vehicle simulator
│   ├── signal.html           # Traffic light visualizer
│   ├── styles.css            # Shared stylesheet
│   └── js/
│       ├── vehicle.js        # Vehicle frontend logic
│       └── signal.js         # Signal frontend logic
└── scripts/
    └── start.sh              # Optional startup script
```

## 🔧 Prerequisites

- **Python**: 3.10 or higher
- **pip**: Python package manager
- **Modern Web Browser**: Chrome, Firefox, Safari, or Edge
- **Wi-Fi Network**: For testing across devices (mobile + laptop)
- **Optional**: GPS-enabled mobile device for Auto mode testing

## 📦 Installation

### 1. Clone or Download

```bash
# If using Git
git clone <repository-url>
cd velocity-python

# Or extract the ZIP file and navigate to the directory
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

**Dependencies installed:**
- `Flask==3.0.0` - Web framework
- `Flask-SocketIO==5.3.5` - Socket.IO integration
- `python-socketio==5.10.0` - Socket.IO client/server
- `eventlet==0.33.3` - Async networking library
- `flask-cors==4.0.0` - CORS support for local testing

### 3. Verify Installation

```bash
python --version  # Should show Python 3.10+
python -c "import flask; import flask_socketio; print('Dependencies OK')"
```

## 🚀 Running the Application

### Start the Server

```bash
python server.py
```

**Expected Output:**
```
============================================================
Velocity Smart-Traffic Testbed Server
============================================================
Starting server on 0.0.0.0:5000
Junctions configured: junction1

Access URLs:
  Vehicle Simulator:  http://0.0.0.0:5000/vehicle.html
  Signal Visualizer:  http://0.0.0.0:5000/signal.html
  Status API:         http://0.0.0.0:5000/status

For LAN testing, find your local IP and use:
  http://<your-ip>:5000/vehicle.html
============================================================
```

The server is now running and accessible on your local network.

### Find Your Local IP Address

#### Windows:
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x or 10.0.x.x)

#### macOS/Linux:
```bash
ifconfig | grep "inet "
# or
ip addr show
```

#### Alternative (All platforms):
Open http://localhost:5000/status in your browser, or:
```bash
python -c "import socket; print(socket.gethostbyname(socket.gethostname()))"
```

### Access the Interfaces

1. **On your laptop/desktop** (Signal Visualizer):
   ```
   http://localhost:5000/signal.html
   ```

2. **On your mobile device** (Vehicle Simulator):
   ```
   http://<your-ip>:5000/vehicle.html
   ```
   Example: `http://192.168.1.100:5000/vehicle.html`

**Important**: Both devices must be on the same Wi-Fi network.

## 🧪 Testing the System

### Manual Acceptance Tests

#### Test 1: Manual Trigger (Basic Functionality)

1. **Setup**:
   - Open `signal.html` on laptop
   - Open `vehicle.html` on mobile phone
   - Verify both show "Connected" status

2. **Execute**:
   - On mobile: Tap **"Send Trigger"** button
   
3. **Expected Results**:
   - ✅ Signal page traffic light turns GREEN immediately
   - ✅ Alert banner shows "Vehicle approaching" message
   - ✅ Signal returns to RED after ~5 seconds (with YELLOW transition)
   - ✅ Both pages log the event
   - ✅ Mobile shows "Trigger Sent Successfully" status

#### Test 2: GPS Geofence Detection (Advanced)

1. **Setup**:
   - Open `vehicle.html` on GPS-enabled mobile device
   - Switch to **"Auto (GPS)"** mode
   - Tap **"Start GPS Tracking"**
   - Grant location permissions when prompted

2. **Configure Test Location** (if needed):
   - Edit `server.py`, lines 21-26:
   ```python
   JUNCTIONS_CONFIG = {
       "junction1": {
           "lat": YOUR_LATITUDE,
           "lng": YOUR_LONGITUDE,
           "geofence_radius_m": 50
       }
   }
   ```
   - Restart server

3. **Execute**:
   - Walk/drive to within 50 meters of configured junction
   
4. **Expected Results**:
   - ✅ Distance display updates in real-time
   - ✅ Status changes to "Inside geofence"
   - ✅ Trigger automatically sent when entering zone
   - ✅ Signal turns GREEN
   - ✅ No duplicate triggers (debounced for 5 seconds)

#### Test 3: Manual Override

1. **Setup**:
   - Open `signal.html` on laptop
   
2. **Execute**:
   - Click **"Force GREEN"** button
   - Wait 3 seconds
   - Click **"Force RED"** button
   
3. **Expected Results**:
   - ✅ Traffic light changes immediately
   - ✅ Alert banner shows "Manual Override" message
   - ✅ Events logged with warning level
   - ✅ Statistics counter increments

#### Test 4: Multiple Triggers (Concurrency)

1. **Setup**:
   - Open `signal.html` on laptop
   - Open multiple `vehicle.html` instances (different devices/browsers)
   
2. **Execute**:
   - Send trigger from first vehicle → Light turns GREEN
   - Before it resets, send trigger from second vehicle
   
3. **Expected Results**:
   - ✅ First trigger sets light to GREEN for 5 seconds
   - ✅ Second trigger extends duration by +2 seconds
   - ✅ Log shows "GREEN extended" message
   - ✅ Total GREEN time = 7 seconds

#### Test 5: Reconnection Handling

1. **Execute**:
   - Open `signal.html`
   - Send trigger from `vehicle.html` to turn light GREEN
   - Refresh `signal.html` page
   
2. **Expected Results**:
   - ✅ Signal page reconnects automatically
   - ✅ Traffic light syncs to current state (GREEN if still active)
   - ✅ Countdown timer shows correct remaining time

### API Testing with curl

#### Get System Status
```bash
curl http://localhost:5000/status
```

**Expected Response:**
```json
{
  "timestamp": 1700000000000,
  "junctions": {
    "junction1": {
      "state": "RED",
      "next_reset_ms": null,
      "triggered_by": null,
      "lat": 40.7580,
      "lng": -73.9855,
      "geofence_radius_m": 50,
      "name": "Main St & 5th Ave"
    }
  }
}
```

#### Trigger Junction via HTTP
```bash
curl -X POST http://localhost:5000/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "junctionId": "junction1",
    "vehicleId": "TEST-001",
    "timestamp": 1700000000000
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "junctionId": "junction1",
  "state": "GREEN",
  "timestamp": 1700000005000
}
```

#### Verify State Changed
```bash
curl http://localhost:5000/status | grep -A 5 junction1
```

### Automated Test Script

Create `test.sh` (Unix) or `test.bat` (Windows):

```bash
#!/bin/bash
echo "Testing Velocity System..."

# Test 1: Check server is running
echo "\n1. Testing /status endpoint..."
curl -s http://localhost:5000/status | grep -q "junction1" && echo "✓ PASS" || echo "✗ FAIL"

# Test 2: Trigger junction
echo "\n2. Testing /trigger endpoint..."
curl -s -X POST http://localhost:5000/trigger \
  -H "Content-Type: application/json" \
  -d '{"junctionId":"junction1","vehicleId":"TEST","timestamp":1700000000000}' \
  | grep -q "success" && echo "✓ PASS" || echo "✗ FAIL"

# Test 3: Verify state changed
echo "\n3. Verifying state change..."
sleep 1
curl -s http://localhost:5000/status | grep -q "GREEN" && echo "✓ PASS" || echo "✗ FAIL"

echo "\nTests complete!"
```

## 🔧 Configuration

### Junction Configuration

Edit `server.py`, lines 18-28:

```python
JUNCTIONS_CONFIG = {
    "junction1": {
        "name": "Main St & 5th Ave",
        "lat": 40.7580,              # Latitude
        "lng": -73.9855,             # Longitude
        "geofence_radius_m": 50      # Radius in meters
    }
}
```

**To add more junctions:**
```python
JUNCTIONS_CONFIG = {
    "junction1": { ... },
    "junction2": {
        "name": "Second Junction",
        "lat": 40.7589,
        "lng": -73.9851,
        "geofence_radius_m": 75
    }
}
```

### Timing Configuration

Edit `server.py`, lines 31-34:

```python
GREEN_DURATION_MS = 5000       # Default GREEN duration (milliseconds)
YELLOW_DURATION_MS = 1000      # YELLOW transition duration
TRIGGER_EXTENSION_MS = 2000    # Extension when already GREEN
```

### Server Configuration

Edit `server.py`, lines 15-16:

```python
HOST = '0.0.0.0'  # Bind to all interfaces (default)
PORT = 5000        # Server port
```

**Note**: Changing `HOST` to `'127.0.0.1'` will make server accessible only on localhost (no LAN access).

## 📡 Network Events Documentation

### Client → Server Events

#### 1. `geofence_trigger`
Sent when vehicle enters geofence zone.

**Payload:**
```javascript
{
  "junctionId": "junction1",      // Junction identifier
  "vehicleId": "AMBULANCE-001",   // Vehicle identifier
  "timestamp": 1700000000000      // Unix timestamp (ms)
}
```

**Server Response:** Broadcasts `signal_change` to all clients

#### 2. `manual_override`
Sent when user manually forces traffic light state.

**Payload:**
```javascript
{
  "junctionId": "junction1",      // Junction identifier
  "state": "GREEN"                // Desired state: "RED" or "GREEN"
}
```

**Server Response:** Broadcasts `signal_change` to all clients

#### 3. `request_state`
Request current state snapshot from server.

**Payload:** None

**Server Response:** Emits `state_snapshot` to requesting client

### Server → Client Events

#### 1. `state_snapshot`
Sent on connection and when requested. Contains full system state.

**Payload:**
```javascript
{
  "timestamp": 1700000000000,
  "junctions": {
    "junction1": {
      "state": "GREEN",
      "next_reset_ms": 1700000005000,
      "triggered_by": "AMBULANCE-001",
      "lat": 40.7580,
      "lng": -73.9855,
      "geofence_radius_m": 50,
      "name": "Main St & 5th Ave"
    }
  }
}
```

#### 2. `signal_change`
Broadcast when any junction state changes.

**Payload:**
```javascript
{
  "junctionId": "junction1",
  "state": "GREEN",               // New state
  "duration": 5000,               // Duration in ms (0 if manual)
  "triggeredBy": "AMBULANCE-001", // Vehicle ID or "manual_override"
  "timestamp": 1700000000000,
  "extended": false               // true if extending existing GREEN
}
```

#### 3. `trigger_ack`
Acknowledgment sent to vehicle that triggered the signal.

**Payload:**
```javascript
{
  "junctionId": "junction1",
  "vehicleId": "AMBULANCE-001",
  "state": "GREEN",
  "timestamp": 1700000000000
}
```

#### 4. `error`
Error message sent to client.

**Payload:**
```javascript
{
  "message": "Error description"
}
```

## 🎨 Behavior & Policies

### Trigger Behavior

1. **Initial Trigger** (Junction is RED/YELLOW):
   - Sets state to GREEN
   - Sets timer for `GREEN_DURATION_MS` (default: 5000ms)
   - Broadcasts `signal_change` to all clients
   - Schedules automatic reset to RED

2. **Subsequent Trigger** (Junction already GREEN):
   - Extends `next_reset_ms` by `TRIGGER_EXTENSION_MS` (default: +2000ms)
   - Broadcasts `signal_change` with `extended: true`
   - Does NOT restart the countdown, only extends it

3. **Automatic Reset**:
   - After GREEN duration expires
   - Transitions to YELLOW for `YELLOW_DURATION_MS` (default: 1000ms)
   - Then transitions to RED
   - Broadcasts each state change

4. **Manual Override**:
   - Cancels any active timers
   - Sets state immediately
   - Broadcasts `signal_change` with `triggeredBy: "manual_override"`
   - State persists until next trigger or override

### GPS Geofence Behavior

1. **Entry Detection**:
   - Calculates Haversine distance every GPS update (~2 seconds)
   - When distance ≤ `geofence_radius_m` AND previous position was outside:
     - Triggers geofence event
     - Sends `geofence_trigger` to server

2. **Debouncing**:
   - After trigger sent, no new triggers for 5 seconds (`geofenceTriggerDebounce`)
   - Prevents duplicate triggers from GPS jitter
   - Resets when vehicle exits and re-enters geofence

3. **Exit Detection**:
   - When distance > `geofence_radius_m` AND previous position was inside:
     - Updates UI to "Outside geofence"
     - Resets entry flag (allows next trigger)

### Concurrency Policy

**Multiple simultaneous triggers:**
- First trigger: Sets GREEN for `GREEN_DURATION_MS`
- Second trigger (while GREEN): Extends by `+TRIGGER_EXTENSION_MS`
- Third trigger (while GREEN): Extends by another `+TRIGGER_EXTENSION_MS`
- etc.

**Example Timeline:**
```
T=0s:  Vehicle A triggers → GREEN until T=5s
T=2s:  Vehicle B triggers → GREEN now until T=7s (extended by +2s)
T=4s:  Vehicle C triggers → GREEN now until T=9s (extended by +2s)
T=9s:  YELLOW → RED
```

This ensures that high-frequency triggers (multiple emergency vehicles) keep the light GREEN longer.

### Reconnection Policy

1. **Client Connects**:
   - Server sends `state_snapshot` with current junction states
   - Client syncs traffic light to current state
   - If junction is GREEN with active timer, countdown resumes

2. **Client Disconnects**:
   - Server continues to maintain state
   - Timers keep running
   - Other connected clients unaffected

3. **Server Restart**:
   - All state lost (in-memory only)
   - All junctions reset to RED
   - Clients automatically reconnect and sync

## 🐛 Troubleshooting

### Server Won't Start

**Problem**: `Address already in use` error

**Solution**:
```bash
# Find process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Unix/Mac:
lsof -i :5000
kill -9 <PID>

# Or change port in server.py
PORT = 5001
```

**Problem**: Import errors

**Solution**:
```bash
pip install --upgrade -r requirements.txt
```

### Connection Issues

**Problem**: Mobile can't connect to server

**Solutions**:
1. Verify both devices on same Wi-Fi network
2. Check firewall isn't blocking port 5000:
   ```bash
   # Windows: Add firewall rule
   netsh advfirewall firewall add rule name="Velocity" dir=in action=allow protocol=TCP localport=5000
   
   # Mac: Allow in System Preferences → Security & Privacy → Firewall
   ```
3. Verify server is binding to `0.0.0.0` (not `127.0.0.1`)
4. Try IP address instead of hostname

**Problem**: Socket.IO connection fails, falls back to HTTP

**Check**: Browser console for CORS errors

**Solution**: Already configured in `server.py` with `cors_allowed_origins="*"`

### GPS Issues

**Problem**: "Location permission denied"

**Solutions**:
1. Grant location permissions in browser settings
2. iOS: Settings → Safari → Location → Ask
3. Android: Site settings → Permissions → Location → Allow
4. Desktop browsers: Click lock icon in address bar → Location → Allow

**Problem**: GPS accuracy is poor (±500m+)

**Solutions**:
1. Move outdoors for better GPS signal
2. Wait 30-60 seconds for GPS to acquire satellites
3. Enable high-accuracy mode in device settings
4. Reduce `geofence_radius_m` for testing (caution: may miss triggers)

**Problem**: "GPS not supported"

**Solutions**:
- Use a device with GPS hardware (most mobile phones)
- Use Manual mode for testing instead

### Map Won't Load

**Problem**: Map shows "Map unavailable"

**Causes**:
- No internet connection (OpenStreetMap requires internet)
- Adblocker blocking tile requests

**Solutions**:
- Check internet connection
- Disable adblocker for this site
- Map is optional; system works without it

### Traffic Light Not Changing

**Problem**: Vehicle trigger sent but signal doesn't change

**Checklist**:
1. ✅ Both devices show "Connected" status?
2. ✅ Check browser console for errors (F12)
3. ✅ Verify event appears in logs on both pages
4. ✅ Try manual override on signal page
5. ✅ Check server console for error messages
6. ✅ Try `/trigger` endpoint with curl
7. ✅ Restart server and refresh both pages

### HTTPS / Geolocation Errors

**Problem**: "Geolocation only works on HTTPS"

**Explanation**: Modern browsers require HTTPS for geolocation API (except on localhost)

**Solutions**:
1. For local testing: Access via `localhost` or `127.0.0.1` instead of IP
2. For LAN testing on newer browsers:
   - Use Manual mode instead
   - Or set up local HTTPS (advanced)
3. For production deployment: Use HTTPS (Let's Encrypt, Cloudflare, etc.)

## 🚀 Deployment Options

### Option 1: Local Network (Development)

Already covered above. Suitable for testing and demos on same Wi-Fi.

### Option 2: Cloud Deployment (Production)

#### Deploy to Heroku

1. Create `Procfile`:
```
web: python server.py
```

2. Deploy:
```bash
heroku create velocity-testbed
git push heroku main
```

#### Deploy to Railway/Render

1. Connect GitHub repository
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `python server.py`
4. Deploy

#### Deploy to AWS/GCP/Azure

Use `eventlet` WSGI server (already configured in `server.py`):
```bash
python server.py  # Production-ready with eventlet
```

### Option 3: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "server.py"]
```

Build and run:
```bash
docker build -t velocity .
docker run -p 5000:5000 velocity
```

Or use the provided `Dockerfile` if included.

## 🔒 Security Notes

**⚠️ This is a prototype for testing only. NOT production-ready.**

**Security Considerations for Production:**
1. Add authentication (API keys, JWT tokens)
2. Validate and sanitize all inputs
3. Rate limiting to prevent abuse
4. Use HTTPS/WSS (secure WebSocket)
5. Restrict CORS to specific origins
6. Add persistent database for audit logs
7. Implement proper session management
8. Add encryption for sensitive data

## 🎓 Educational Notes

### How Geofence Detection Works

The system uses the **Haversine formula** to calculate great-circle distance between two points on Earth:

```javascript
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
}
```

**Accuracy**: ±0.5% error (sufficient for this application)

### Socket.IO vs HTTP Polling

This system uses **Socket.IO** for real-time communication:

**Advantages:**
- ✅ Instant bidirectional communication
- ✅ Automatic reconnection handling
- ✅ Broadcast to multiple clients efficiently
- ✅ Fallback to HTTP long-polling if WebSocket unavailable

**HTTP Alternative:** Available via `/trigger` endpoint for testing, but not recommended for real-time use.

### Why Eventlet?

`eventlet` provides **non-blocking I/O** for Python:
- Handles thousands of concurrent WebSocket connections
- Low memory footprint
- Simple integration with Flask-SocketIO
- Alternative: `gevent` (also supported)

## 📝 Acceptance Test Checklist

- [ ] `pip install -r requirements.txt` completes without errors
- [ ] `python server.py` starts server on port 5000
- [ ] Server binds to `0.0.0.0` (accessible from LAN)
- [ ] Can access `http://localhost:5000/vehicle.html` on host machine
- [ ] Can access `http://<ip>:5000/vehicle.html` from mobile device
- [ ] Both devices show "Connected" status
- [ ] Manual trigger on vehicle page turns signal GREEN
- [ ] Signal page shows alert banner with vehicle ID
- [ ] Signal returns to RED after configured duration
- [ ] Event log shows trigger on both pages
- [ ] GET `/status` returns JSON with junction states
- [ ] POST `/trigger` successfully triggers junction
- [ ] Auto GPS mode requests location permissions
- [ ] GPS mode shows current position and distance
- [ ] Geofence trigger fires when entering radius
- [ ] Manual override buttons work on signal page
- [ ] Statistics counters increment correctly
- [ ] Page refresh reconnects and syncs state
- [ ] Multiple simultaneous triggers extend GREEN duration

## 🤝 Contributing

This is a minimal prototype. Suggestions for improvements:

1. **Persistent Database**: PostgreSQL/MongoDB for state and audit logs
2. **Multi-Junction Support**: UI for managing multiple junctions
3. **Route Planning**: Predict vehicle arrival and pre-emptively turn lights
4. **Analytics Dashboard**: Historical data visualization
5. **Authentication**: Secure vehicle and operator access
6. **Mobile App**: Native iOS/Android apps instead of web
7. **Real Hardware Integration**: Connect to actual traffic signals
8. **ML/AI**: Predict traffic patterns and optimize timing

## 📄 License

This is a prototype for educational and testing purposes.

## 🙋 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review server console logs (`python server.py`)
3. Check browser console logs (F12 → Console tab)
4. Verify network connectivity and firewall settings

## 🔗 Quick Reference

### URLs
- Vehicle Simulator: `http://<ip>:5000/vehicle.html`
- Signal Visualizer: `http://<ip>:5000/signal.html`
- Status API: `http://<ip>:5000/status`

### Key Files to Edit
- Junction config: `server.py` lines 18-28
- Timing config: `server.py` lines 31-34
- Server port: `server.py` lines 15-16

### Default Settings
- Green duration: 5 seconds
- Yellow duration: 1 second
- Extension duration: +2 seconds
- Geofence radius: 50 meters
- GPS debounce: 5 seconds

---

**Built with ❤️ for smart city innovation**



/**
 * Velocity Vehicle Simulator - Frontend Logic
 * Handles manual trigger and GPS-based geofence detection
 */

// ==============================================================================
// Configuration
// ==============================================================================

const CONFIG = {
    // Server connection (auto-detects from current location)
    serverUrl: window.location.origin,
    
    // Junction coordinates (dynamic - updated by laptop location)
    junctions: {
        "junction1": {
            name: "Laptop Device (Junction)",
            lat: 40.7580,  // Will be updated by laptop GPS
            lng: -73.9855,
            geofenceRadius: 1  // 1 meter for device-to-device proximity
        }
    },
    
    // GPS tracking settings
    gpsUpdateInterval: 2000,  // milliseconds
    geofenceTriggerDebounce: 5000,  // Don't re-trigger within 5 seconds
    
    // Map settings
    mapZoom: 16,
    mapTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    mapAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

// ==============================================================================
// State Management
// ==============================================================================

const state = {
    mode: 'manual',  // 'manual' or 'auto'
    connected: false,
    vehicleId: null,
    currentJunction: 'junction1',
    
    // GPS state
    gpsActive: false,
    gpsWatchId: null,
    currentPosition: null,
    lastTriggerTime: 0,
    wasInsideGeofence: false,
    
    // Map state
    map: null,
    vehicleMarker: null,
    junctionMarker: null,
    geofenceCircle: null,
    
    // Socket.IO
    socket: null,
    
    // Keepalive
    pingInterval: null,
    reconnectAttempts: 0
};

// ==============================================================================
// DOM Elements
// ==============================================================================

const elements = {
    // Mode controls
    manualModeBtn: document.getElementById('manualModeBtn'),
    autoModeBtn: document.getElementById('autoModeBtn'),
    manualControls: document.getElementById('manualControls'),
    autoControls: document.getElementById('autoControls'),
    
    // Input fields
    vehicleIdInput: document.getElementById('vehicleIdInput'),
    junctionSelect: document.getElementById('junctionSelect'),
    
    // Status displays
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    distanceDisplay: document.getElementById('distanceDisplay'),
    connectionStatus: document.getElementById('connectionStatus'),
    connectionText: document.getElementById('connectionText'),
    
    // Manual mode
    triggerBtn: document.getElementById('triggerBtn'),
    
    // Auto mode
    gpsStatus: document.getElementById('gpsStatus'),
    geofenceStatus: document.getElementById('geofenceStatus'),
    startGpsBtn: document.getElementById('startGpsBtn'),
    stopGpsBtn: document.getElementById('stopGpsBtn'),
    yourLocation: document.getElementById('yourLocation'),
    junctionLocation: document.getElementById('junctionLocation'),
    
    // Map
    mapContainer: document.getElementById('map'),
    
    // Event log
    eventLog: document.getElementById('eventLog'),
    clearLogBtn: document.getElementById('clearLogBtn')
};

// ==============================================================================
// Utility Functions
// ==============================================================================

/**
 * Calculate Haversine distance between two coordinates
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

/**
 * Generate a random vehicle ID if not provided
 */
function generateVehicleId() {
    const prefix = 'VEH';
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${random}`;
}

/**
 * Get current timestamp in milliseconds
 */
function getCurrentTimestamp() {
    return Date.now();
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
}

/**
 * Add event to log
 */
function addLog(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.innerHTML = `<span class="log-time">${formatTimestamp(getCurrentTimestamp())}</span> ${message}`;
    
    elements.eventLog.insertBefore(logEntry, elements.eventLog.firstChild);
    
    // Keep only last 20 entries
    while (elements.eventLog.children.length > 20) {
        elements.eventLog.removeChild(elements.eventLog.lastChild);
    }
}

/**
 * Update status indicator
 */
function updateStatus(status, text) {
    elements.statusDot.className = `status-dot status-${status}`;
    elements.statusText.textContent = text;
}

/**
 * Update connection status
 */
function updateConnectionStatus(connected) {
    state.connected = connected;
    elements.connectionStatus.className = connected ? 'connected' : 'disconnected';
    elements.connectionText.textContent = connected ? 'Connected' : 'Disconnected';
}

// ==============================================================================
// Socket.IO Functions
// ==============================================================================

/**
 * Initialize Socket.IO connection
 */
function initSocket() {
    state.socket = io(CONFIG.serverUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity
    });
    
    // Connection events
    state.socket.on('connect', () => {
        console.log('Connected to server');
        updateConnectionStatus(true);
        state.reconnectAttempts = 0;
        addLog('✓ Connected to server', 'success');
        updateStatus('connected', 'Connected - Ready');
        
        // Start keepalive ping
        if (state.pingInterval) clearInterval(state.pingInterval);
        state.pingInterval = setInterval(() => {
            if (state.connected) {
                state.socket.emit('ping');
            }
        }, 10000); // Ping every 10 seconds
    });
    
    state.socket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
        updateConnectionStatus(false);
        addLog(`✗ Disconnected: ${reason}`, 'error');
        updateStatus('disconnected', 'Disconnected');
        
        // Clear ping interval
        if (state.pingInterval) {
            clearInterval(state.pingInterval);
            state.pingInterval = null;
        }
    });
    
    state.socket.on('connect_error', (error) => {
        state.reconnectAttempts++;
        console.error('Connection error:', error);
        if (state.reconnectAttempts % 5 === 0) {
            addLog(`Reconnection attempt ${state.reconnectAttempts}...`, 'warning');
        }
    });
    
    state.socket.on('pong', (data) => {
        // Keepalive response
        console.log('Ping OK');
    });
    
    // State snapshot from server
    state.socket.on('state_snapshot', (data) => {
        console.log('Received state snapshot:', data);
        addLog('Received junction states from server', 'info');
    });
    
    // Trigger acknowledgment
    state.socket.on('trigger_ack', (data) => {
        console.log('Trigger acknowledged:', data);
        addLog(`✓ Trigger acknowledged for ${data.junctionId}`, 'success');
        updateStatus('success', 'Trigger Sent Successfully');
        
        // Reset status after 3 seconds
        setTimeout(() => {
            if (state.mode === 'manual') {
                updateStatus('ready', 'Ready to Send');
            }
        }, 3000);
    });
    
    // Signal change broadcast
    state.socket.on('signal_change', (data) => {
        console.log('Signal change:', data);
        const msg = `Traffic light ${data.junctionId}: ${data.state} (triggered by ${data.triggeredBy || 'unknown'})`;
        addLog(msg, 'info');
    });
    
    // Junction location updated by laptop
    state.socket.on('junction_location_updated', (data) => {
        console.log('Junction location updated:', data);
        
        const junctionId = data.junctionId;
        if (CONFIG.junctions[junctionId]) {
            CONFIG.junctions[junctionId].lat = data.lat;
            CONFIG.junctions[junctionId].lng = data.lng;
            
            addLog(`📍 Laptop location updated: ${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`, 'info');
            
            // Update junction location display
            const junction = CONFIG.junctions[state.currentJunction];
            elements.junctionLocation.textContent = `${junction.lat.toFixed(6)}, ${junction.lng.toFixed(6)} (radius: ${junction.geofenceRadius}m)`;
            
            // Update map if available
            if (state.map && state.junctionMarker) {
                state.junctionMarker.setLatLng([data.lat, data.lng]);
                if (state.geofenceCircle) {
                    state.geofenceCircle.setLatLng([data.lat, data.lng]);
                }
            }
            
            // Recheck geofence if GPS is active
            if (state.currentPosition) {
                checkGeofence(state.currentPosition);
            }
        }
    });
    
    // Error handling
    state.socket.on('error', (data) => {
        console.error('Socket error:', data);
        addLog(`✗ Error: ${data.message}`, 'error');
        updateStatus('error', 'Error: ' + data.message);
    });
}

/**
 * Send geofence trigger to server
 */
function sendTrigger() {
    if (!state.connected) {
        addLog('✗ Cannot send trigger: Not connected', 'error');
        updateStatus('error', 'Not Connected');
        return;
    }
    
    const vehicleId = elements.vehicleIdInput.value.trim() || generateVehicleId();
    elements.vehicleIdInput.value = vehicleId;
    state.vehicleId = vehicleId;
    
    const junctionId = elements.junctionSelect.value;
    
    const payload = {
        junctionId: junctionId,
        vehicleId: vehicleId,
        timestamp: getCurrentTimestamp()
    };
    
    console.log('Sending geofence trigger:', payload);
    state.socket.emit('geofence_trigger', payload);
    
    addLog(`→ Sent trigger: ${vehicleId} → ${junctionId}`, 'info');
    updateStatus('sending', 'Sending Trigger...');
    
    // Update last trigger time for debouncing
    state.lastTriggerTime = getCurrentTimestamp();
}

// ==============================================================================
// GPS Functions
// ==============================================================================

/**
 * Check if position is inside geofence and trigger if entering
 */
function checkGeofence(position) {
    const junction = CONFIG.junctions[state.currentJunction];
    if (!junction) return;
    
    const distance = haversineDistance(
        position.coords.latitude,
        position.coords.longitude,
        junction.lat,
        junction.lng
    );
    
    // Update distance display
    elements.distanceDisplay.textContent = `Distance to junction: ${Math.round(distance)}m`;
    
    const insideGeofence = distance <= junction.geofenceRadius;
    
    // Check for geofence entry (transition from outside to inside)
    if (insideGeofence && !state.wasInsideGeofence) {
        // Entering geofence
        const now = getCurrentTimestamp();
        const timeSinceLastTrigger = now - state.lastTriggerTime;
        
        if (timeSinceLastTrigger >= CONFIG.geofenceTriggerDebounce) {
            // Trigger allowed
            addLog(`🎯 Entered geofence zone! Distance: ${Math.round(distance)}m`, 'success');
            elements.geofenceStatus.textContent = '✓ Inside geofence - Triggering!';
            elements.geofenceStatus.className = 'geofence-status inside';
            sendTrigger();
        } else {
            // Debounce - too soon since last trigger
            addLog(`⏱ Inside geofence but debounced (${Math.round(timeSinceLastTrigger/1000)}s since last trigger)`, 'warning');
        }
        
        state.wasInsideGeofence = true;
    } else if (!insideGeofence && state.wasInsideGeofence) {
        // Exiting geofence
        addLog(`↩ Exited geofence zone. Distance: ${Math.round(distance)}m`, 'info');
        elements.geofenceStatus.textContent = 'Outside geofence';
        elements.geofenceStatus.className = 'geofence-status outside';
        state.wasInsideGeofence = false;
    } else if (insideGeofence) {
        // Still inside
        elements.geofenceStatus.textContent = `✓ Inside geofence (${Math.round(distance)}m)`;
        elements.geofenceStatus.className = 'geofence-status inside';
    } else {
        // Still outside
        elements.geofenceStatus.textContent = `Outside geofence (${Math.round(distance)}m)`;
        elements.geofenceStatus.className = 'geofence-status outside';
    }
    
    // Update map if available
    if (state.map && state.vehicleMarker) {
        state.vehicleMarker.setLatLng([position.coords.latitude, position.coords.longitude]);
    }
}

/**
 * Handle GPS position update
 */
function handleGpsPosition(position) {
    state.currentPosition = position;
    
    const lat = position.coords.latitude.toFixed(6);
    const lng = position.coords.longitude.toFixed(6);
    const accuracy = Math.round(position.coords.accuracy);
    
    elements.yourLocation.textContent = `${lat}, ${lng} (±${accuracy}m)`;
    elements.gpsStatus.textContent = `✓ GPS active (accuracy: ±${accuracy}m)`;
    elements.gpsStatus.className = 'gps-status active';
    
    updateStatus('tracking', 'GPS Tracking Active');
    
    // Check geofence
    checkGeofence(position);
}

/**
 * Handle GPS error
 */
function handleGpsError(error) {
    let message = 'GPS Error: ';
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message += 'Location permission denied. Please enable location access in your browser settings.';
            break;
        case error.POSITION_UNAVAILABLE:
            message += 'Location information unavailable. Make sure GPS is enabled.';
            break;
        case error.TIMEOUT:
            message += 'Location request timed out.';
            break;
        default:
            message += 'Unknown error occurred.';
    }
    
    console.error('GPS error:', error);
    elements.gpsStatus.textContent = '✗ ' + message;
    elements.gpsStatus.className = 'gps-status error';
    addLog(message, 'error');
    updateStatus('error', 'GPS Error');
}

/**
 * Start GPS tracking
 */
function startGpsTracking() {
    if (!navigator.geolocation) {
        addLog('✗ Geolocation not supported by this browser', 'error');
        elements.gpsStatus.textContent = '✗ Geolocation not supported';
        return;
    }
    
    addLog('Starting GPS tracking...', 'info');
    elements.gpsStatus.textContent = 'Starting GPS...';
    
    // Request high accuracy GPS
    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };
    
    state.gpsWatchId = navigator.geolocation.watchPosition(
        handleGpsPosition,
        handleGpsError,
        options
    );
    
    state.gpsActive = true;
    elements.startGpsBtn.classList.add('hidden');
    elements.stopGpsBtn.classList.remove('hidden');
}

/**
 * Stop GPS tracking
 */
function stopGpsTracking() {
    if (state.gpsWatchId !== null) {
        navigator.geolocation.clearWatch(state.gpsWatchId);
        state.gpsWatchId = null;
    }
    
    state.gpsActive = false;
    state.wasInsideGeofence = false;
    
    elements.gpsStatus.textContent = 'GPS tracking stopped';
    elements.gpsStatus.className = 'gps-status';
    elements.geofenceStatus.textContent = '';
    elements.startGpsBtn.classList.remove('hidden');
    elements.stopGpsBtn.classList.add('hidden');
    
    addLog('GPS tracking stopped', 'info');
    updateStatus('ready', 'GPS Stopped');
}

// ==============================================================================
// Map Functions
// ==============================================================================

/**
 * Initialize Leaflet map
 */
function initMap() {
    try {
        const junction = CONFIG.junctions[state.currentJunction];
        
        // Initialize map centered on junction
        state.map = L.map('map').setView([junction.lat, junction.lng], CONFIG.mapZoom);
        
        // Add OpenStreetMap tiles
        L.tileLayer(CONFIG.mapTileUrl, {
            attribution: CONFIG.mapAttribution,
            maxZoom: 19
        }).addTo(state.map);
        
        // Add junction marker
        state.junctionMarker = L.marker([junction.lat, junction.lng], {
            title: junction.name
        }).addTo(state.map);
        state.junctionMarker.bindPopup(`<b>${junction.name}</b><br>Junction`);
        
        // Add geofence circle
        state.geofenceCircle = L.circle([junction.lat, junction.lng], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.2,
            radius: junction.geofenceRadius
        }).addTo(state.map);
        
        // Add vehicle marker (initially at junction, will update with GPS)
        state.vehicleMarker = L.marker([junction.lat, junction.lng], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(state.map);
        state.vehicleMarker.bindPopup('<b>Your Vehicle</b>');
        
        // Update junction location display
        elements.junctionLocation.textContent = `${junction.lat.toFixed(6)}, ${junction.lng.toFixed(6)} (radius: ${junction.geofenceRadius}m)`;
        
        addLog('✓ Map initialized', 'info');
    } catch (error) {
        console.error('Map initialization error:', error);
        addLog('✗ Map initialization failed (requires internet)', 'warning');
        elements.mapContainer.innerHTML = '<p class="error-text">Map unavailable (check internet connection)</p>';
    }
}

// ==============================================================================
// Mode Management
// ==============================================================================

/**
 * Switch to manual mode
 */
function switchToManualMode() {
    state.mode = 'manual';
    elements.manualModeBtn.classList.add('active');
    elements.autoModeBtn.classList.remove('active');
    elements.manualControls.classList.remove('hidden');
    elements.autoControls.classList.add('hidden');
    
    // Stop GPS if active
    if (state.gpsActive) {
        stopGpsTracking();
    }
    
    updateStatus('ready', 'Manual Mode - Ready');
    addLog('Switched to Manual mode', 'info');
}

/**
 * Switch to auto GPS mode
 */
function switchToAutoMode() {
    state.mode = 'auto';
    elements.autoModeBtn.classList.add('active');
    elements.manualModeBtn.classList.remove('active');
    elements.autoControls.classList.remove('hidden');
    elements.manualControls.classList.add('hidden');
    
    updateStatus('ready', 'Auto Mode - Ready');
    addLog('Switched to Auto (GPS) mode', 'info');
}

// ==============================================================================
// Event Listeners
// ==============================================================================

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Mode toggle
    elements.manualModeBtn.addEventListener('click', switchToManualMode);
    elements.autoModeBtn.addEventListener('click', switchToAutoMode);
    
    // Manual trigger button
    elements.triggerBtn.addEventListener('click', sendTrigger);
    
    // GPS controls
    elements.startGpsBtn.addEventListener('click', startGpsTracking);
    elements.stopGpsBtn.addEventListener('click', stopGpsTracking);
    
    // Clear log
    elements.clearLogBtn.addEventListener('click', () => {
        elements.eventLog.innerHTML = '';
        addLog('Log cleared', 'info');
    });
    
    // Generate vehicle ID on focus if empty
    elements.vehicleIdInput.addEventListener('focus', () => {
        if (!elements.vehicleIdInput.value.trim()) {
            elements.vehicleIdInput.value = generateVehicleId();
        }
    });
}

// ==============================================================================
// Initialization
// ==============================================================================

/**
 * Initialize the application
 */
function init() {
    console.log('Initializing Velocity Vehicle Simulator...');
    
    // Generate initial vehicle ID
    elements.vehicleIdInput.value = generateVehicleId();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize Socket.IO
    initSocket();
    
    // Initialize map
    initMap();
    
    // Set initial status
    updateStatus('initializing', 'Initializing...');
    
    addLog('🚀 Velocity Vehicle Simulator started', 'success');
    addLog(`Server: ${CONFIG.serverUrl}`, 'info');
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
    addLog('📍 PROXIMITY MODE: Junction = Laptop Location', 'success');
    addLog('🎯 Geofence Radius: 1 meter (device-to-device)', 'info');
    addLog('🚑 Auto-trigger when within 1m of laptop!', 'info');
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
    
    console.log('Initialization complete');
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}



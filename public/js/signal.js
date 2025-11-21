/**
 * Velocity Junction Dashboard - Frontend Logic
 * Handles 4-way traffic signal display with auto cycling
 */

// ==============================================================================
// Configuration
// ==============================================================================

const CONFIG = {
    serverUrl: window.location.origin,
    updateInterval: 100  // milliseconds
};

// ==============================================================================
// State Management
// ==============================================================================

const state = {
    connected: false,
    currentJunction: 'junction1',
    mode: 'auto_cycle',  // auto_cycle or emergency
    signals: {
        north: 'RED',
        south: 'RED',
        east: 'RED',
        west: 'RED'
    },
    currentSignal: 'north',
    socket: null,
    
    // GPS state for laptop location tracking
    gpsActive: false,
    gpsWatchId: null,
    currentPosition: null,
    lastLocationUpdate: 0,
    
    // Keepalive
    pingInterval: null,
    reconnectAttempts: 0
};

// ==============================================================================
// DOM Elements
// ==============================================================================

const elements = {
    // Mode display
    modeBadge: document.getElementById('modeBadge'),
    modeText: document.getElementById('modeText'),
    cycleInfo: document.getElementById('cycleInfo'),
    currentSignal: document.getElementById('currentSignal'),
    
    // Traffic lights
    signalNorth: document.getElementById('signalNorth'),
    signalSouth: document.getElementById('signalSouth'),
    signalEast: document.getElementById('signalEast'),
    signalWest: document.getElementById('signalWest'),
    
    // Alert banner
    alertBanner: document.getElementById('alertBanner'),
    alertText: document.getElementById('alertText'),
    
    // Controls
    triggerEmergencyBtn: document.getElementById('triggerEmergencyBtn'),
    resumeAutoBtn: document.getElementById('resumeAutoBtn'),
    
    // Location settings
    locationStatus: document.getElementById('locationStatus'),
    currentLocation: document.getElementById('currentLocation'),
    useGpsBtn: document.getElementById('useGpsBtn'),
    useManualBtn: document.getElementById('useManualBtn'),
    manualLocationForm: document.getElementById('manualLocationForm'),
    manualLat: document.getElementById('manualLat'),
    manualLng: document.getElementById('manualLng'),
    setLocationBtn: document.getElementById('setLocationBtn'),
    
    // Event log
    eventLog: document.getElementById('eventLog'),
    clearLogBtn: document.getElementById('clearLogBtn'),
    
    // Connection
    connectionStatus: document.getElementById('connectionStatus'),
    connectionText: document.getElementById('connectionText')
};

// ==============================================================================
// Utility Functions
// ==============================================================================

function getCurrentTimestamp() {
    return Date.now();
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
}

function addLog(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.innerHTML = `<span class="log-time">${formatTimestamp(getCurrentTimestamp())}</span> ${message}`;
    
    elements.eventLog.insertBefore(logEntry, elements.eventLog.firstChild);
    
    // Keep only last 30 entries
    while (elements.eventLog.children.length > 30) {
        elements.eventLog.removeChild(elements.eventLog.lastChild);
    }
}

function updateConnectionStatus(connected) {
    state.connected = connected;
    elements.connectionStatus.className = connected ? 'connected' : 'disconnected';
    elements.connectionText.textContent = connected ? 'Connected' : 'Disconnected';
}

// ==============================================================================
// Traffic Light Control
// ==============================================================================

function updateTrafficLight(direction, signalState) {
    const signal = elements[`signal${direction.charAt(0).toUpperCase() + direction.slice(1)}`];
    if (!signal) return;
    
    const lights = signal.querySelectorAll('.light');
    
    // Clear all lights for this signal
    lights.forEach(light => {
        light.classList.remove('active');
    });
    
    // Activate appropriate light
    lights.forEach(light => {
        if (light.classList.contains(signalState.toLowerCase())) {
            light.classList.add('active');
        }
    });
    
    state.signals[direction] = signalState;
}

function updateAllSignals(signals) {
    Object.keys(signals).forEach(direction => {
        updateTrafficLight(direction, signals[direction].state);
    });
}

function showAlert(message) {
    elements.alertText.textContent = message;
    elements.alertBanner.classList.remove('hidden');
}

function hideAlert() {
    elements.alertBanner.classList.add('hidden');
}

function updateMode(mode, currentSignal = null) {
    state.mode = mode;
    
    if (mode === 'emergency') {
        elements.modeBadge.className = 'status-badge emergency-mode';
        elements.modeText.innerHTML = '<strong>🚨 EMERGENCY MODE</strong>';
        elements.modeBadge.querySelector('.badge-icon').textContent = '🚨';
        elements.cycleInfo.innerHTML = '<strong>Main signal GREEN - All others RED</strong>';
        showAlert('Emergency Vehicle Approaching!');
        addLog('🚨 EMERGENCY MODE ACTIVATED', 'warning');
    } else {
        elements.modeBadge.className = 'status-badge auto-mode';
        elements.modeText.textContent = 'Auto Cycle Mode';
        elements.modeBadge.querySelector('.badge-icon').textContent = '🔄';
        elements.cycleInfo.innerHTML = 'Current: <strong id="currentSignal">' + 
            (currentSignal || 'North').toUpperCase() + 
            '</strong> | Cycle: 20s (4s per signal)';
        hideAlert();
        addLog('✓ Auto cycle mode resumed', 'success');
    }
    
    // Update current signal element reference
    elements.currentSignal = document.getElementById('currentSignal');
}

function updateCurrentSignal(signalDirection) {
    state.currentSignal = signalDirection;
    if (elements.currentSignal) {
        elements.currentSignal.textContent = signalDirection.toUpperCase();
    }
}

// ==============================================================================
// Socket.IO Functions
// ==============================================================================

function initSocket() {
    state.socket = io(CONFIG.serverUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity
    });
    
    // Connection events
    state.socket.on('connect', () => {
        console.log('✓ CONNECTED TO SERVER');
        console.log('Socket ID:', state.socket.id);
        updateConnectionStatus(true);
        state.reconnectAttempts = 0;
        addLog('✓ Connected to junction server', 'success');
        addLog(`Socket ID: ${state.socket.id}`, 'info');
        
        // Request current state
        state.socket.emit('request_state');
        
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
        console.log('State snapshot received:', data);
        
        const junction = data.junctions[state.currentJunction];
        if (!junction) return;
        
        // Update all signals
        updateAllSignals(junction.signals);
        
        // Update mode
        updateMode(junction.mode, junction.current_cycle_signal);
        
        if (junction.mode === 'emergency') {
            showAlert(`Emergency Vehicle: ${junction.triggered_by || 'Unknown'}`);
        }
        
        addLog('✓ Synced with server state', 'info');
    });
    
    // Junction update events
    state.socket.on('junction_update', (data) => {
        console.log('🚨 JUNCTION UPDATE RECEIVED:', data);
        console.log('Current junction:', state.currentJunction);
        console.log('Data junction:', data.junctionId);
        console.log('Match:', data.junctionId === state.currentJunction);
        
        if (data.junctionId !== state.currentJunction) {
            console.warn('Junction ID mismatch - ignoring update');
            return;
        }
        
        console.log('✓ Processing junction update');
        
        // Update all signals
        updateAllSignals(data.signals);
        
        // Update mode
        if (data.mode) {
            console.log('Updating mode to:', data.mode);
            updateMode(data.mode, data.current_signal);
            
            if (data.mode === 'emergency') {
                console.log('🚨 EMERGENCY MODE ACTIVATED!');
                showAlert(`🚑 Emergency Vehicle: ${data.triggeredBy || 'Approaching'}`);
                addLog(`🚨 EMERGENCY MODE ACTIVATED by ${data.triggeredBy}`, 'warning');
            }
        }
        
        // Update current signal in cycle
        if (data.current_signal && data.mode === 'auto_cycle') {
            updateCurrentSignal(data.current_signal);
            addLog(`→ ${data.current_signal.toUpperCase()} signal is now GREEN`, 'info');
        }
    });
    
    // Signal change events (legacy support)
    state.socket.on('signal_change', (data) => {
        console.log('Signal change:', data);
        // Handle if needed
    });
    
    // Error handling
    state.socket.on('error', (data) => {
        console.error('Socket error:', data);
        addLog(`✗ Error: ${data.message}`, 'error');
    });
}

function sendManualOverride(action) {
    if (!state.connected) {
        addLog('✗ Cannot send override: Not connected', 'error');
        return;
    }
    
    const payload = {
        junctionId: state.currentJunction,
        action: action  // 'emergency' or 'auto_cycle'
    };
    
    console.log('Sending manual override:', payload);
    state.socket.emit('manual_override', payload);
    
    addLog(`→ Manual override: ${action}`, 'warning');
}

// ==============================================================================
// GPS Location Tracking (Laptop becomes the junction)
// ==============================================================================

function handleGpsPosition(position) {
    state.currentPosition = position;
    
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const accuracy = Math.round(position.coords.accuracy);
    
    console.log('Laptop GPS:', lat, lng, '±' + accuracy + 'm');
    
    // Update display
    updateLocationDisplay(lat, lng, `GPS (±${accuracy}m)`);
    
    // Send location to server (update junction location)
    const now = getCurrentTimestamp();
    if (now - state.lastLocationUpdate > 2000) {  // Update every 2 seconds
        if (state.socket && state.connected) {
            state.socket.emit('update_junction_location', {
                junctionId: state.currentJunction,
                lat: lat,
                lng: lng,
                deviceType: 'signal'
            });
            
            state.lastLocationUpdate = now;
            console.log('📍 Junction location updated:', lat, lng);
            addLog(`📍 Location updated: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, 'success');
        }
    }
}

function updateLocationDisplay(lat, lng, source) {
    elements.currentLocation.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)} (${source})`;
}

function sendManualLocation(lat, lng) {
    if (!state.connected) {
        addLog('✗ Cannot update location: Not connected', 'error');
        return;
    }
    
    if (isNaN(lat) || isNaN(lng)) {
        addLog('✗ Invalid coordinates', 'error');
        return;
    }
    
    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        addLog('✗ Invalid coordinates (lat: -90 to 90, lng: -180 to 180)', 'error');
        return;
    }
    
    // Update display
    updateLocationDisplay(lat, lng, 'Manual');
    
    // Send to server
    state.socket.emit('update_junction_location', {
        junctionId: state.currentJunction,
        lat: lat,
        lng: lng,
        deviceType: 'signal'
    });
    
    addLog(`✓ Junction location set manually: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, 'success');
    addLog('📱 Mobile devices will now use this location for proximity detection', 'info');
}

function handleGpsError(error) {
    let message = 'GPS Error: ';
    let solution = '';
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message += 'Location permission denied.';
            solution = '💡 Click Allow when browser asks for location, or use Manual trigger mode.';
            break;
        case error.POSITION_UNAVAILABLE:
            message += 'Location information unavailable.';
            solution = '💡 GPS may not work on this device. System will use default location.';
            break;
        case error.TIMEOUT:
            message += 'Location request timed out.';
            solution = '💡 Laptop GPS is often weak/unavailable. System will use default location - Manual trigger still works!';
            break;
        default:
            message += 'Unknown error occurred.';
    }
    
    console.error('GPS error:', error);
    addLog(message, 'warning');
    addLog(solution, 'info');
    addLog('✅ Junction is running! Manual triggers work without GPS.', 'success');
    
    // Stop trying GPS
    stopGpsTracking();
}

function startGpsTracking() {
    if (!navigator.geolocation) {
        addLog('✗ Geolocation not supported by this browser', 'error');
        addLog('💡 System will use default location - Manual trigger still works!', 'info');
        return;
    }
    
    addLog('📍 Starting GPS tracking (this device becomes the junction)...', 'info');
    addLog('⏳ Waiting for GPS lock (may take 30-60 seconds)...', 'info');
    
    const options = {
        enableHighAccuracy: false,  // Changed to false for faster response
        timeout: 30000,  // Increased to 30 seconds
        maximumAge: 60000  // Accept cached position up to 60 seconds old
    };
    
    state.gpsWatchId = navigator.geolocation.watchPosition(
        handleGpsPosition,
        handleGpsError,
        options
    );
    
    state.gpsActive = true;
    addLog('✓ GPS tracking started - Waiting for location...', 'success');
}

function stopGpsTracking() {
    if (state.gpsWatchId !== null) {
        navigator.geolocation.clearWatch(state.gpsWatchId);
        state.gpsWatchId = null;
    }
    
    state.gpsActive = false;
    addLog('GPS tracking stopped', 'info');
}

// ==============================================================================
// Event Listeners
// ==============================================================================

function setupEventListeners() {
    // Emergency trigger
    elements.triggerEmergencyBtn.addEventListener('click', () => {
        sendManualOverride('emergency');
    });
    
    // Resume auto cycle
    elements.resumeAutoBtn.addEventListener('click', () => {
        sendManualOverride('auto_cycle');
    });
    
    // Location controls
    elements.useGpsBtn.addEventListener('click', () => {
        startGpsTracking();
        elements.manualLocationForm.classList.add('hidden');
    });
    
    elements.useManualBtn.addEventListener('click', () => {
        elements.manualLocationForm.classList.toggle('hidden');
    });
    
    elements.setLocationBtn.addEventListener('click', () => {
        const lat = parseFloat(elements.manualLat.value);
        const lng = parseFloat(elements.manualLng.value);
        sendManualLocation(lat, lng);
        elements.manualLocationForm.classList.add('hidden');
    });
    
    // Clear log
    elements.clearLogBtn.addEventListener('click', () => {
        elements.eventLog.innerHTML = '';
        addLog('Log cleared', 'info');
    });
    
    // Click alert to dismiss
    elements.alertBanner.addEventListener('click', hideAlert);
}

// ==============================================================================
// Initialization
// ==============================================================================

function init() {
    console.log('Initializing Velocity Junction Dashboard...');
    
    // Set initial state - all RED
    updateTrafficLight('north', 'RED');
    updateTrafficLight('south', 'RED');
    updateTrafficLight('east', 'RED');
    updateTrafficLight('west', 'RED');
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize Socket.IO
    initSocket();
    
    addLog('🚀 Junction Dashboard started', 'success');
    addLog(`Server: ${CONFIG.serverUrl}`, 'info');
    addLog(`Junction: ${state.currentJunction}`, 'info');
    addLog('Waiting for auto cycle to begin...', 'info');
    
    // Display mode information
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
    addLog('📍 Junction Location Setup Required!', 'success');
    addLog('Choose one:', 'info');
    addLog('  1️⃣ Click "Use My GPS Location" (if GPS available)', 'info');
    addLog('  2️⃣ Click "Enter Location Manually" (recommended for laptops)', 'info');
    addLog('💡 Get coordinates from Google Maps: right-click → coordinates', 'info');
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
    
    // Don't auto-start GPS - let user choose
    addLog('⚠️ Using default NYC location until you set your location', 'warning');
    
    console.log('Initialization complete');
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

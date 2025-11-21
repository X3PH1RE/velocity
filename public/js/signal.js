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
    socket: null
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
    state.socket = io(CONFIG.serverUrl);
    
    // Connection events
    state.socket.on('connect', () => {
        console.log('Connected to server');
        updateConnectionStatus(true);
        addLog('✓ Connected to junction server', 'success');
        
        // Request current state
        state.socket.emit('request_state');
    });
    
    state.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        updateConnectionStatus(false);
        addLog('✗ Disconnected from server', 'error');
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
        console.log('Junction update:', data);
        
        if (data.junctionId !== state.currentJunction) return;
        
        // Update all signals
        updateAllSignals(data.signals);
        
        // Update mode
        if (data.mode) {
            updateMode(data.mode, data.current_signal);
            
            if (data.mode === 'emergency') {
                showAlert(`🚑 Emergency Vehicle: ${data.triggeredBy || 'Approaching'}`);
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
    
    console.log('Initialization complete');
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

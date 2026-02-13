/**
 * Android CallLog Integration Service
 * 
 * This service provides a bridge between the React app and Android's native CallLog API.
 * For a React web app, this will need to be implemented as:
 * 1. A WebView bridge in an Android wrapper app (e.g., React Native, Capacitor, Cordova)
 * 2. OR a background service that posts events to the web app
 * 
 * Implementation paths:
 * - React Native: Use react-native-call-log or custom native module
 * - Capacitor: Create a custom plugin with Android CallLog access
 * - Cordova: Use cordova-plugin-call-log
 * - PWA: Use Web Notification API + manual input (limited Android access)
 */

/**
 * Initialize call log monitoring
 * Sets up listeners for call end events
 * 
 * @param {Function} onCallEnd - Callback when call ends with call metadata
 */
export function initializeCallLogMonitoring(onCallEnd) {
    // Check if running in Android WebView with bridge
    if (window.AndroidCallLogBridge) {
        window.AndroidCallLogBridge.startMonitoring((callData) => {
            onCallEnd(parseCallData(callData));
        });
        return;
    }

    // Check for Capacitor plugin
    if (window.Capacitor && window.Capacitor.Plugins.CallLog) {
        const { CallLog } = window.Capacitor.Plugins;
        CallLog.addListener('callEnded', (callData) => {
            onCallEnd(parseCallData(callData));
        });
        return;
    }

    // Fallback: Manual testing mode (for development)
    if (process.env.NODE_ENV === 'development') {
        console.warn('Android CallLog not available. Using mock data for testing.');
        // Allow triggering test calls via window
        window.triggerTestCall = (mockData) => {
            onCallEnd(parseCallData(mockData || createMockCall()));
        };
    }
}

/**
 * Request Android CallLog permissions
 * @returns {Promise<boolean>} Permission granted
 */
export async function requestCallLogPermissions() {
    if (window.AndroidCallLogBridge) {
        return window.AndroidCallLogBridge.requestPermissions();
    }

    if (window.Capacitor && window.Capacitor.Plugins.CallLog) {
        const { CallLog } = window.Capacitor.Plugins;
        const result = await CallLog.requestPermissions();
        return result.granted;
    }

    // Fallback for web/development - suppress warning in DEV mode
    if (import.meta.env.DEV) {
        // Silent in development for testing
        return false;
    }
    
    console.warn('Cannot request CallLog permissions in web environment');
    return false;
}

/**
 * Parse call data from Android CallLog format to app format
 * @param {Object} rawCallData - Raw data from Android CallLog
 * @returns {Object} Normalized call data
 */
function parseCallData(rawCallData) {
    return {
        id: rawCallData.id || `call_${Date.now()}`,
        phoneNumber: formatPhoneNumber(rawCallData.number || rawCallData.phoneNumber),
        duration: parseInt(rawCallData.duration) || 0, // seconds
        timestamp: rawCallData.date ? new Date(parseInt(rawCallData.date)).toISOString() : new Date().toISOString(),
        callType: parseCallType(rawCallData.type || rawCallData.callType),
        contactName: rawCallData.name || rawCallData.contactName || null,
        countryCode: rawCallData.countryCode || extractCountryCode(rawCallData.number),
    };
}

/**
 * Parse Android call type to app format
 * Android CallLog types: 1=incoming, 2=outgoing, 3=missed
 */
function parseCallType(type) {
    const typeMap = {
        1: 'incoming',
        2: 'outgoing',
        3: 'incoming', // Treat missed as incoming
        'incoming': 'incoming',
        'outgoing': 'outgoing',
        'missed': 'incoming',
    };
    return typeMap[type] || 'incoming';
}

/**
 * Format phone number for display and search
 */
function formatPhoneNumber(number) {
    if (!number) return '';
    // Remove all non-digit characters
    return number.replace(/[^\d+]/g, '');
}

/**
 * Extract country code from phone number
 * Basic heuristic - can be enhanced with libphonenumber
 */
function extractCountryCode(number) {
    if (!number) return '+91'; // Default to India
    
    const cleaned = number.replace(/[^\d+]/g, '');
    
    if (cleaned.startsWith('+91')) return '+91';
    if (cleaned.startsWith('+1')) return '+1';
    if (cleaned.startsWith('+44')) return '+44';
    if (cleaned.startsWith('+')) {
        const code = cleaned.substring(0, 4); // Max country code length
        return code;
    }
    
    return '+91'; // Default
}

/**
 * Create mock call data for testing
 */
function createMockCall() {
    return {
        id: `mock_${Date.now()}`,
        number: '+919876543210',
        duration: Math.floor(Math.random() * 600) + 30, // 30s - 10min
        date: Date.now(),
        type: Math.random() > 0.5 ? 1 : 2, // Random incoming/outgoing
        name: null,
    };
}

/**
 * Get recent calls from Android CallLog
 * @param {number} limit - Number of recent calls to fetch
 * @returns {Promise<Array>} Recent calls
 */
export async function getRecentCallsFromDevice(limit = 10) {
    if (window.AndroidCallLogBridge) {
        const calls = await window.AndroidCallLogBridge.getRecentCalls(limit);
        return calls.map(parseCallData);
    }

    if (window.Capacitor && window.Capacitor.Plugins.CallLog) {
        const { CallLog } = window.Capacitor.Plugins;
        const result = await CallLog.getRecentCalls({ limit });
        return result.calls.map(parseCallData);
    }

    // Development fallback
    return [];
}

/**
 * Show notification for call logging
 * Uses native notification if available, fallback to browser notification
 */
export function showCallLogNotification(callData) {
    const title = 'Log Call to DCR';
    const body = `${callData.callType === 'incoming' ? '📞' : '📱'} ${callData.phoneNumber} - ${Math.floor(callData.duration / 60)}m ${callData.duration % 60}s`;

    // Try native notification first
    if (window.AndroidCallLogBridge && window.AndroidCallLogBridge.showNotification) {
        window.AndroidCallLogBridge.showNotification(title, body, {
            action: 'OPEN_CALL_LOG_PROMPT',
            callData: JSON.stringify(callData)
        });
        return;
    }

    // Fallback to Web Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body,
            icon: '/logo.png',
            tag: `call-${callData.id}`,
            requireInteraction: true,
            data: callData
        });

        notification.onclick = () => {
            window.focus();
            window.dispatchEvent(new CustomEvent('openCallLogPrompt', { detail: callData }));
            notification.close();
        };
    }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    return Notification.permission === 'granted';
}

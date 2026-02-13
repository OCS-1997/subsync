import api from '@/lib/axiosInstance';

/**
 * Search for customer/contact by phone number
 * Matches against customer contacts and returns best match
 * 
 * @param {string} phoneNumber - Phone number to search (with or without country code)
 * @returns {Promise<{customer: Object|null, contact: Object|null}>}
 */
export async function searchCustomerByPhone(phoneNumber) {
    if (!phoneNumber) {
        return { customer: null, contact: null };
    }

    try {
        // Clean phone number (remove spaces, dashes, parentheses)
        const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');

        // Search in DCR entries and customers
        const response = await api.get('/customers/search-by-phone', {
            params: { phone: cleanNumber }
        });

        if (response.data && response.data.customer) {
            return {
                customer: response.data.customer,
                contact: response.data.contact || null
            };
        }

        return { customer: null, contact: null };
    } catch (err) {
        // 404 means no customer found - this is expected, not an error
        if (err.response && err.response.status === 404) {
            return { customer: null, contact: null };
        }
        
        // Only log actual errors (network issues, 500s, etc.)
        console.error('Phone search error:', err);
        return { customer: null, contact: null };
    }
}

/**
 * Store skipped/missed call for later logging
 * Saves to localStorage "Recent Calls" list
 * 
 * @param {Object} callData - Call metadata from Android CallLog
 */
export function storeRecentCall(callData) {
    try {
        const recentCalls = getRecentCalls();
        
        // Add new call to the beginning
        recentCalls.unshift({
            ...callData,
            skippedAt: new Date().toISOString(),
            logged: false
        });

        // Keep only last 50 calls
        const trimmed = recentCalls.slice(0, 50);

        localStorage.setItem('recentCalls', JSON.stringify(trimmed));
        
        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('recentCallsUpdated'));
    } catch (err) {
        console.error('Failed to store recent call:', err);
    }
}

/**
 * Get all recent/skipped calls
 * @returns {Array<Object>} List of recent calls
 */
export function getRecentCalls() {
    try {
        const stored = localStorage.getItem('recentCalls');
        return stored ? JSON.parse(stored) : [];
    } catch (err) {
        console.error('Failed to retrieve recent calls:', err);
        return [];
    }
}

/**
 * Mark a recent call as logged
 * @param {string} callId - Unique identifier for the call
 */
export function markCallAsLogged(callId) {
    try {
        const recentCalls = getRecentCalls();
        const updated = recentCalls.map(call => 
            call.id === callId ? { ...call, logged: true, loggedAt: new Date().toISOString() } : call
        );
        localStorage.setItem('recentCalls', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('recentCallsUpdated'));
    } catch (err) {
        console.error('Failed to mark call as logged:', err);
    }
}

/**
 * Remove a call from recent calls
 * @param {string} callId - Unique identifier for the call
 */
export function removeRecentCall(callId) {
    try {
        const recentCalls = getRecentCalls();
        const filtered = recentCalls.filter(call => call.id !== callId);
        localStorage.setItem('recentCalls', JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent('recentCallsUpdated'));
    } catch (err) {
        console.error('Failed to remove recent call:', err);
    }
}

/**
 * Clear all recent calls
 */
export function clearRecentCalls() {
    try {
        localStorage.removeItem('recentCalls');
        window.dispatchEvent(new CustomEvent('recentCallsUpdated'));
    } catch (err) {
        console.error('Failed to clear recent calls:', err);
    }
}

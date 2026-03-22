import api from '@/lib/axiosInstance';

/**
 * Search for any entity (customer/vendor/contact) by phone number.
 * Uses the new /resolve-number API which searches across all entity types.
 *
 * @param {string} phoneNumber - Phone number to search
 * @returns {Promise<{customer: Object|null, contact: Object|null}>}
 */
export async function searchCustomerByPhone(phoneNumber) {
    if (!phoneNumber) {
        return { customer: null, contact: null };
    }

    try {
        // Use the unified directory endpoint to search by phone
        const response = await api.get('/directory', {
            params: { search: phoneNumber, limit: 1 }
        });

        const entry = response.data?.entries?.[0];
        if (!entry || entry.entity_type === 'unknown') {
            return { customer: null, contact: null };
        }

        // Adapt to the shape expected by CallLogPrompt
        const customer = {
            customer_id:   entry.id,
            customer_name: entry.name,
            company_name:  entry.company_name,
            entity_type:   entry.entity_type,
        };
        const contact = {
            contact_name:  entry.name,
            phone_number:  entry.phone_number,
            country_code:  '+91',
        };

        return { customer, contact };
    } catch (err) {
        if (err.response?.status === 404) {
            return { customer: null, contact: null };
        }
        console.error('Phone resolve error:', err);
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

import appDB from "../db/subsyncDB.js";
import { getCurrentTime } from "../middlewares/time.js";
import { generateID } from "../middlewares/generateID.js";

// In-memory cache for resolved phone numbers to ensure near-instant caller ID
// Limited to 1000 entries to prevent memory bloat
const resolveCache = new Map();
const MAX_CACHE_SIZE = 1000;

/**
 * Normalize a phone number to last 10 digits.
 * Strips country codes (+91, 91, +1, etc.) and non-numeric characters.
 * @param {string} phone
 * @returns {string} 10-digit normalized number, or '' if invalid
 */
export function normalizePhone(phone) {
    if (!phone || typeof phone !== 'string') return '';

    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, '');

    // Strip Indian country code prefix if followed by 10 digits
    if (digits.startsWith('91') && digits.length === 12) {
        digits = digits.substring(2);
    }
    // Strip leading 1 for US/Canada (11 digits → 10 digits)
    if (digits.startsWith('1') && digits.length === 11) {
        digits = digits.substring(1);
    }

    // Return only last 10 digits (safe catch-all)
    return digits.slice(-10);
}

/**
 * Resolve a phone number to its entity across all tables.
 * Search order: customers → vendors → contacts → unknown
 *
 * @param {string} rawPhone - Raw phone number from the dialer
 * @returns {Promise<{type: string, id: string|null, name: string, company: string|null, phone: string}>}
 */
export async function resolvePhoneNumber(rawPhone) {
    const searchNumber = normalizePhone(rawPhone);

    if (!searchNumber || searchNumber.length < 10) {
        return { type: 'unknown', id: null, name: 'Unknown Number', company: null, phone: rawPhone || 'Unknown' };
    }

    // 1. Check Cache
    if (resolveCache.has(searchNumber)) {
        return resolveCache.get(searchNumber);
    }

    // 2. Search in the centralized phone_directory table
    const [rows] = await appDB.query(
        "SELECT entity_type, entity_id, name, company_name, phone_number FROM phone_directory WHERE normalized_number = ? LIMIT 1",
        [searchNumber]
    );

    let result;
    if (rows.length > 0) {
        const entry = rows[0];
        result = {
            type: entry.entity_type,
            id: entry.entity_id,
            name: entry.name,
            company: entry.company_name,
            phone: entry.phone_number,
        };
    } else {
        result = { type: 'unknown', id: null, name: 'Unknown Number', company: null, phone: rawPhone };
    }

    // 3. Update Cache
    if (resolveCache.size >= MAX_CACHE_SIZE) {
        // Simple eviction: clear oldest (first inserted) entry
        const firstKey = resolveCache.keys().next().value;
        resolveCache.delete(firstKey);
    }
    resolveCache.set(searchNumber, result);

    return result;
}

/**
 * Create a phone-sourced DCR entry.
 * This writes directly into dcr_entries with call_source = 'phone',
 * making it a first-class DCR entry visible in the DCR module.
 *
 * @param {Object} data
 * @param {string} data.phone          - Normalized phone number
 * @param {string} data.name           - Resolved contact/entity name
 * @param {string} data.entity_type    - 'customer'|'vendor'|'contact'|'other_contact'|'unknown'
 * @param {string|null} data.entity_id - ID of the resolved entity
 * @param {string|null} data.company   - Company name (optional)
 * @param {string} data.call_type      - 'incoming'|'outgoing'|'missed'
 * @param {number} data.duration       - Duration in seconds
 * @param {string} data.description    - User-entered call notes
 * @param {string} data.user_id        - The logged-in user's username
 * @returns {Promise<number>} - Inserted row's auto-increment ID
 */
export async function createPhoneDcrEntry(data) {
    const {
        phone,
        name,
        entity_type,
        entity_id,
        company,
        call_type,
        duration,
        description,
        user_id,
    } = data;

    if (!user_id) throw new Error('user_id is required');
    if (!phone)   throw new Error('phone is required');

    // Map Android call type → DCR call type enum
    // Android: 'incoming' | 'outgoing' | 'missed'
    // DCR enum: 'incoming' | 'outgoing' | 'follow-up'
    const dcrCallType = call_type === 'missed' ? 'incoming' : (call_type || 'incoming');

    // Duration in seconds → minutes (round up to 1 if < 60 so DCR min is 0)
    const timeSpentMinutes = duration > 0 ? Math.max(1, Math.round(duration / 60)) : 0;

    const currentTime = getCurrentTime();

    // Try to find a domain_id to link this DCR entry to a customer/domain
    let domainId = null;
    try {
        if (entity_id) {
            let customerId = null;
            if (entity_type === 'customer') {
                customerId = entity_id;
            } else if (entity_type === 'contact' || entity_type === 'other_contact') {
                // Find parent customer if it's a contact
                const [directoryRows] = await appDB.query(
                    "SELECT parent_entity_id FROM phone_directory WHERE entity_type = ? AND entity_id = ? LIMIT 1",
                    [entity_type, entity_id]
                );
                if (directoryRows.length > 0) {
                    customerId = directoryRows[0].parent_entity_id;
                }
            }

            if (customerId) {
                // Find the primary domain for this customer
                const [domainRows] = await appDB.query(
                    "SELECT domain_id FROM domains WHERE customer_id = ? ORDER BY created_at ASC LIMIT 1",
                    [customerId]
                );
                if (domainRows.length > 0) {
                    domainId = domainRows[0].domain_id;
                }
            }
        }
    } catch (err) {
        console.error("Error finding domain for call log:", err);
    }

    const [result] = await appDB.query(
        `INSERT INTO dcr_entries (
            user_id, timestamp, call_type, time_spent_minutes,
            company_name, contact_name, contact_phone_number,
            notes, call_source, contact_id, domain_id,
            call_duration_seconds, created_at, updated_at
        ) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, 'phone', ?, ?, ?, ?, ?)`,
        [
            user_id,
            dcrCallType,
            timeSpentMinutes,
            company || null,
            name || null,
            phone || null,
            description || null,
            (entity_type === 'contact') ? entity_id : null, 
            domainId,
            duration || 0,
            currentTime,
            currentTime,
        ]
    );

    return result.insertId;
}

/**
 * Get phone-sourced DCR entries (call logs) with pagination.
 * These are DCR entries where call_source = 'phone'.
 *
 * @param {Object} opts
 * @returns {Promise<{entries: Array, totalPages: number, totalRecords: number}>}
 */
export async function getPhoneCallLogs({ page = 1, limit = 20, search = '', user_id, isAdmin = false }) {
    const offset = (page - 1) * limit;
    const whereClauses = [`de.call_source = 'phone'`];
    const params = [];

    if (!isAdmin) {
        whereClauses.push('de.user_id = ?');
        params.push(user_id);
    }

    if (search) {
        whereClauses.push(`(
            de.contact_name LIKE ? OR
            de.contact_phone_number LIKE ? OR
            de.company_name LIKE ? OR
            de.notes LIKE ?
        )`);
        const s = `%${search}%`;
        params.push(s, s, s, s);
    }

    const where = `WHERE ${whereClauses.join(' AND ')}`;

    const [[{ total }]] = await appDB.query(
        `SELECT COUNT(*) as total FROM dcr_entries de ${where}`,
        params
    );

    const [entries] = await appDB.query(
        `SELECT
            de.id, de.user_id, u.name as user_name,
            de.timestamp, de.call_type, de.call_source,
            de.time_spent_minutes, de.call_duration_seconds,
            de.contact_phone_number as phone_number,
            NULL as entity_type,
            de.contact_id as entity_id,
            de.contact_name, de.company_name, de.notes, de.created_at
         FROM dcr_entries de
         LEFT JOIN users u ON de.user_id = u.username
         ${where}
         ORDER BY de.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), parseInt(offset)]
    );

    return { entries, totalPages: Math.ceil(total / limit), totalRecords: total };
}

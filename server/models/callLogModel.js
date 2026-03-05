import appDB from "../db/subsyncDB.js";
import { getCurrentTime } from "../middlewares/time.js";
import { generateID } from "../middlewares/generateID.js";

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
        return { type: 'unknown', id: null, name: 'Unknown Number', company: null, phone: rawPhone };
    }

    // ---- 1. Check customers (primary + secondary + other_contacts JSON) ----
    const [customers] = await appDB.query(
        `SELECT customer_id, display_name, first_name, last_name, company_name,
                primary_phone_number, secondary_phone_number, other_contacts
         FROM customers
         WHERE customer_status = 'Active'`
    );

    for (const c of customers) {
        if (normalizePhone(c.primary_phone_number) === searchNumber) {
            return {
                type: 'customer',
                id: c.customer_id,
                name: c.display_name || `${c.first_name || ''} ${c.last_name || ''}`.trim(),
                company: c.company_name || null,
                phone: searchNumber,
            };
        }
        if (c.secondary_phone_number && normalizePhone(c.secondary_phone_number) === searchNumber) {
            return {
                type: 'customer',
                id: c.customer_id,
                name: c.display_name || `${c.first_name || ''} ${c.last_name || ''}`.trim(),
                company: c.company_name || null,
                phone: searchNumber,
            };
        }
        // Check other_contacts JSON array
        if (c.other_contacts) {
            let contacts = [];
            try {
                contacts = typeof c.other_contacts === 'string'
                    ? JSON.parse(c.other_contacts || '[]')
                    : (c.other_contacts || []);
            } catch { contacts = []; }

            for (const oc of contacts) {
                const ocPhone = oc.phone_number || oc.mobile || '';
                if (ocPhone && normalizePhone(ocPhone) === searchNumber) {
                    const ocName = `${oc.first_name || ''} ${oc.last_name || ''}`.trim()
                        || oc.contact_name || '';
                    return {
                        type: 'other_contact',
                        id: c.customer_id,           // belongs to this customer
                        name: ocName || c.display_name,
                        company: c.company_name || null,
                        phone: searchNumber,
                    };
                }
            }
        }
    }

    // ---- 2. Check vendors (primary + secondary + other_contacts JSON) ----
    const [vendors] = await appDB.query(
        `SELECT vendor_id, display_name, first_name, last_name, company_name,
                primary_phone_number, secondary_phone_number, other_contacts
         FROM vendors
         WHERE vendor_status = 'Active'`
    );

    for (const v of vendors) {
        if (normalizePhone(v.primary_phone_number) === searchNumber) {
            return {
                type: 'vendor',
                id: v.vendor_id,
                name: v.display_name || `${v.first_name || ''} ${v.last_name || ''}`.trim(),
                company: v.company_name || null,
                phone: searchNumber,
            };
        }
        if (v.secondary_phone_number && normalizePhone(v.secondary_phone_number) === searchNumber) {
            return {
                type: 'vendor',
                id: v.vendor_id,
                name: v.display_name || `${v.first_name || ''} ${v.last_name || ''}`.trim(),
                company: v.company_name || null,
                phone: searchNumber,
            };
        }
        if (v.other_contacts) {
            let contacts = [];
            try {
                contacts = typeof v.other_contacts === 'string'
                    ? JSON.parse(v.other_contacts || '[]')
                    : (v.other_contacts || []);
            } catch { contacts = []; }

            for (const oc of contacts) {
                const ocPhone = oc.phone_number || oc.mobile || '';
                if (ocPhone && normalizePhone(ocPhone) === searchNumber) {
                    return {
                        type: 'vendor',
                        id: v.vendor_id,
                        name: `${oc.first_name || ''} ${oc.last_name || ''}`.trim() || v.display_name,
                        company: v.company_name || null,
                        phone: searchNumber,
                    };
                }
            }
        }
    }

    // ---- 3. Check contacts table ----
    const [contacts] = await appDB.query(
        `SELECT contact_id, first_name, last_name, company_name, phone_number
         FROM contacts
         WHERE phone_number IS NOT NULL`
    );

    for (const ct of contacts) {
        if (ct.phone_number && normalizePhone(ct.phone_number) === searchNumber) {
            return {
                type: 'contact',
                id: ct.contact_id,
                name: `${ct.first_name || ''} ${ct.last_name || ''}`.trim() || 'Unknown Contact',
                company: ct.company_name || null,
                phone: searchNumber,
            };
        }
    }

    // ---- 4. Unknown ----
    return { type: 'unknown', id: null, name: 'Unknown Number', company: null, phone: searchNumber };
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

    const [result] = await appDB.query(
        `INSERT INTO dcr_entries (
            user_id, timestamp, call_type, time_spent_minutes,
            company_name, contact_name, contact_phone_number,
            notes, call_source, contact_id,
            call_duration_seconds, created_at, updated_at
        ) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, 'phone', ?, ?, ?, ?)`,
        [
            user_id,
            dcrCallType,
            timeSpentMinutes,
            company || null,
            name || null,
            phone || null,
            description || null,
            (entity_type === 'contact') ? entity_id : null, // only set contact_id if it's a contact (FK constraint)
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

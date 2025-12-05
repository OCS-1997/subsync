import appDB from "../db/subsyncDB.js";
import { getCurrentTime } from "../middlewares/time.js";
import { generateID } from "../middlewares/generateID.js";

/**
 * Get week segment (Monday to Saturday) for a given date
 * @param {Date} date - The date to calculate segment for
 * @returns {{start: Date, end: Date}} - Start (Monday) and end (Saturday) dates
 */
export function getWeekSegment(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate days to subtract to get to Monday
    // If Sunday (0), go back 6 days to previous Monday
    // Otherwise, go back (day - 1) days
    const daysToMonday = day === 0 ? 6 : day - 1;

    const monday = new Date(d);
    monday.setDate(d.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);

    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    saturday.setHours(23, 59, 59, 999);

    return { start: monday, end: saturday };
}

/**
 * Format date to MySQL datetime string
 * @param {Date} date
 * @returns {string}
 */
function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Convert HH:MM string to minutes
 * @param {string} timeStr - Format "HH:MM"
 * @returns {number} - Total minutes
 */
export function timeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Convert minutes to HH:MM string
 * @param {number} minutes
 * @returns {string} - Format "HH:MM"
 */
export function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Create a DCR entry
 * @param {Object} dcrData
 * @returns {Promise<number>} - Insert ID
 */
async function createDcrEntry(dcrData) {
    try {
        const {
            user_id,
            timestamp,
            call_type,
            time_spent_minutes,
            domain_id,
            domain_free_text,
            company_name,
            contact_name,
            contact_phone_country_code,
            contact_phone_number,
            contact_email,
            contact_id,
            notes
        } = dcrData;

        if (!user_id || !timestamp || !call_type || time_spent_minutes === undefined) {
            throw new Error("Required fields: user_id, timestamp, call_type, time_spent_minutes");
        }

        const currentTime = getCurrentTime();
        const timestampStr = timestamp instanceof Date ? formatDateTime(timestamp) : timestamp;

        const [result] = await appDB.query(
            `INSERT INTO dcr_entries (
                user_id, timestamp, call_type, time_spent_minutes,
                domain_id, domain_free_text, company_name,
                contact_name, contact_phone_country_code, contact_phone_number, contact_email, contact_id,
                notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user_id, timestampStr, call_type, time_spent_minutes,
                domain_id || null, domain_free_text || null, company_name || null,
                contact_name || null, contact_phone_country_code || null, contact_phone_number || null,
                contact_email || null, contact_id || null,
                notes || null, currentTime, currentTime
            ]
        );

        return result.insertId;
    } catch (error) {
        console.error("Error creating DCR entry:", error);
        throw error;
    }
}

/**
 * Get DCR entries with RBAC filtering
 * @param {Object} options
 * @param {string} options.user_id - Current user ID (for RBAC)
 * @param {boolean} options.isAdmin - Whether user is admin
 * @param {string} options.filterUserId - Optional user filter (admin only)
 * @param {Date} options.startDate - Optional start date
 * @param {Date} options.endDate - Optional end date
 * @param {string} options.search - Optional search term
 * @param {string} options.callType - Optional call type filter
 * @param {string} options.sort - Optional sort field
 * @param {string} options.order - Optional sort order (asc/desc)
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @returns {Promise<{entries: Array, totalPages: number, totalRecords: number}>}
 */
async function getDcrEntries({
    user_id,
    isAdmin = false,
    filterUserId = null,
    startDate = null,
    endDate = null,
    search = null,
    callType = null,
    sort = null,
    order = null,
    page = 1,
    limit = 10
}) {
    try {
        const offset = (page - 1) * limit;
        const whereClauses = [];
        const params = [];

        // RBAC: Non-admin users only see their own entries
        if (!isAdmin) {
            whereClauses.push('de.user_id = ?');
            params.push(user_id);
        } else if (filterUserId) {
            // Admin can filter by specific user
            whereClauses.push('de.user_id = ?');
            params.push(filterUserId);
        }

        // Date filtering
        if (startDate) {
            whereClauses.push('de.timestamp >= ?');
            params.push(formatDateTime(startDate));
        }
        if (endDate) {
            whereClauses.push('de.timestamp <= ?');
            params.push(formatDateTime(endDate));
        }

        // Call type filtering
        if (callType) {
            whereClauses.push('de.call_type = ?');
            params.push(callType);
        }

        // Search filtering
        if (search) {
            whereClauses.push(`(
                d.domain_name LIKE ? OR 
                de.domain_free_text LIKE ? OR 
                de.company_name LIKE ? OR 
                de.contact_name LIKE ? OR 
                de.notes LIKE ?
            )`);
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
        }

        const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Count query
        const [[{ total }]] = await appDB.query(
            `SELECT COUNT(*) as total
             FROM dcr_entries de
             LEFT JOIN domains d ON de.domain_id = d.domain_id
             ${whereClause}`,
            params
        );

        // Determine sort order
        let orderByClause = 'ORDER BY de.timestamp DESC';
        if (sort && order) {
            const validSortFields = {
                'timestamp': 'de.timestamp',
                'user_name': 'u.name',
                'domain_display': 'COALESCE(d.domain_name, de.domain_free_text, de.company_name)',
                'contact_display': 'de.contact_name',
                'call_type': 'de.call_type',
                'time_spent': 'de.time_spent_minutes'
            };
            if (validSortFields[sort]) {
                const sortDirection = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
                orderByClause = `ORDER BY ${validSortFields[sort]} ${sortDirection}`;
            }
        }

        // Data query with user name join
        const [entries] = await appDB.query(
            `SELECT 
                de.id,
                de.user_id,
                u.name as user_name,
                de.timestamp,
                de.call_type,
                de.time_spent_minutes,
                de.domain_id,
                d.domain_name,
                de.domain_free_text,
                de.company_name,
                de.contact_name,
                de.contact_phone_country_code,
                de.contact_phone_number,
                de.contact_email,
                de.contact_id,
                de.notes,
                de.created_at,
                de.updated_at
             FROM dcr_entries de
             LEFT JOIN users u ON de.user_id = u.username
             LEFT JOIN domains d ON de.domain_id = d.domain_id
             ${whereClause}
             ${orderByClause}
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        const totalPages = Math.ceil(total / limit);
        return { entries, totalPages, totalRecords: total };
    } catch (error) {
        console.error("Error fetching DCR entries:", error);
        throw error;
    }
}

/**
 * Get DCR entry by ID with RBAC check
 * @param {number} id
 * @param {string} user_id
 * @param {boolean} isAdmin
 * @returns {Promise<Object|null>}
 */
async function getDcrEntryById(id, user_id, isAdmin = false) {
    try {
        const [rows] = await appDB.query(
            `SELECT 
                de.id,
                de.user_id,
                u.name as user_name,
                de.timestamp,
                de.call_type,
                de.time_spent_minutes,
                de.domain_id,
                d.domain_name,
                de.domain_free_text,
                de.company_name,
                de.contact_name,
                de.contact_phone_country_code,
                de.contact_phone_number,
                de.contact_email,
                de.contact_id,
                de.notes,
                de.created_at,
                de.updated_at
             FROM dcr_entries de
             LEFT JOIN users u ON de.user_id = u.username
             LEFT JOIN domains d ON de.domain_id = d.domain_id
             WHERE de.id = ?`,
            [id]
        );

        if (rows.length === 0) return null;

        const entry = rows[0];

        // RBAC check: non-admin can only access their own entries
        if (!isAdmin && entry.user_id !== user_id) {
            return null;
        }

        return entry;
    } catch (error) {
        console.error("Error fetching DCR entry by ID:", error);
        throw error;
    }
}

/**
 * Update DCR entry with RBAC check
 * @param {number} id
 * @param {Object} dcrData
 * @param {string} user_id
 * @param {boolean} isAdmin
 * @returns {Promise<boolean>}
 */
async function updateDcrEntry(id, dcrData, user_id, isAdmin = false) {
    try {
        // First check if entry exists and user has permission
        const existing = await getDcrEntryById(id, user_id, isAdmin);
        if (!existing) {
            throw new Error("DCR entry not found or access denied");
        }

        const {
            timestamp,
            call_type,
            time_spent_minutes,
            domain_id,
            domain_free_text,
            company_name,
            contact_name,
            contact_phone_country_code,
            contact_phone_number,
            contact_email,
            contact_id,
            notes
        } = dcrData;

        const updateFields = [];
        const params = [];

        if (timestamp !== undefined) {
            updateFields.push('timestamp = ?');
            params.push(timestamp instanceof Date ? formatDateTime(timestamp) : timestamp);
        }
        if (call_type !== undefined) {
            updateFields.push('call_type = ?');
            params.push(call_type);
        }
        if (time_spent_minutes !== undefined) {
            updateFields.push('time_spent_minutes = ?');
            params.push(time_spent_minutes);
        }
        if (domain_id !== undefined) {
            updateFields.push('domain_id = ?');
            params.push(domain_id || null);
        }
        if (domain_free_text !== undefined) {
            updateFields.push('domain_free_text = ?');
            params.push(domain_free_text || null);
        }
        if (company_name !== undefined) {
            updateFields.push('company_name = ?');
            params.push(company_name || null);
        }
        if (contact_name !== undefined) {
            updateFields.push('contact_name = ?');
            params.push(contact_name || null);
        }
        if (contact_phone_country_code !== undefined) {
            updateFields.push('contact_phone_country_code = ?');
            params.push(contact_phone_country_code || null);
        }
        if (contact_phone_number !== undefined) {
            updateFields.push('contact_phone_number = ?');
            params.push(contact_phone_number || null);
        }
        if (contact_email !== undefined) {
            updateFields.push('contact_email = ?');
            params.push(contact_email || null);
        }
        if (contact_id !== undefined) {
            updateFields.push('contact_id = ?');
            params.push(contact_id || null);
        }
        if (notes !== undefined) {
            updateFields.push('notes = ?');
            params.push(notes || null);
        }

        if (updateFields.length === 0) {
            return true; // No changes
        }

        updateFields.push('updated_at = ?');
        params.push(getCurrentTime());
        params.push(id);

        const [result] = await appDB.query(
            `UPDATE dcr_entries SET ${updateFields.join(', ')} WHERE id = ?`,
            params
        );

        return result.affectedRows > 0;
    } catch (error) {
        console.error("Error updating DCR entry:", error);
        throw error;
    }
}

/**
 * Delete DCR entry with RBAC check
 * @param {number} id
 * @param {string} user_id
 * @param {boolean} isAdmin
 * @returns {Promise<boolean>}
 */
async function deleteDcrEntry(id, user_id, isAdmin = false) {
    try {
        // First check if entry exists and user has permission
        const existing = await getDcrEntryById(id, user_id, isAdmin);
        if (!existing) {
            throw new Error("DCR entry not found or access denied");
        }

        const [result] = await appDB.query('DELETE FROM dcr_entries WHERE id = ?', [id]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error("Error deleting DCR entry:", error);
        throw error;
    }
}

/**
 * Get DCR entries for a specific date (for daily email report)
 * @param {Date} date - Date to query (in IST)
 * @returns {Promise<Array>}
 */
async function getDcrEntriesForDate(date) {
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const [entries] = await appDB.query(
            `SELECT 
                de.id,
                de.user_id,
                u.name as user_name,
                de.timestamp,
                de.call_type,
                de.time_spent_minutes,
                de.domain_id,
                d.domain_name,
                de.domain_free_text,
                de.company_name,
                de.contact_name,
                de.contact_phone_country_code,
                de.contact_phone_number,
                de.contact_email,
                de.notes
             FROM dcr_entries de
             LEFT JOIN users u ON de.user_id = u.username
             LEFT JOIN domains d ON de.domain_id = d.domain_id
             WHERE de.timestamp >= ? AND de.timestamp <= ?
             ORDER BY de.timestamp ASC`,
            [formatDateTime(startOfDay), formatDateTime(endOfDay)]
        );

        return entries;
    } catch (error) {
        console.error("Error fetching DCR entries for date:", error);
        throw error;
    }
}

export {
    createDcrEntry,
    getDcrEntries,
    getDcrEntryById,
    updateDcrEntry,
    deleteDcrEntry,
    getDcrEntriesForDate,
};





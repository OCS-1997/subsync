import appDB from "../db/subsyncDB.js";
import { normalizePhone } from "./callLogModel.js";

/**
 * Fetch a single entry from the directory by phone number
 */
export async function getDirectoryEntryByPhone(phoneNumber) {
    const normalized = normalizePhone(phoneNumber);
    if (!normalized) return null;

    const [rows] = await appDB.query(
        "SELECT * FROM phone_directory WHERE normalized_number = ? LIMIT 1",
        [normalized]
    );
    return rows[0] || null;
}

/**
 * Search the directory with pagination
 */
export async function searchDirectory({ search = "", page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const s = `%${search}%`;

    const [entries] = await appDB.query(
        `SELECT * FROM phone_directory 
         WHERE name LIKE ? OR phone_number LIKE ? OR company_name LIKE ? OR email LIKE ?
         ORDER BY name ASC 
         LIMIT ? OFFSET ?`,
        [s, s, s, s, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await appDB.query(
        `SELECT COUNT(*) as total FROM phone_directory 
         WHERE name LIKE ? OR phone_number LIKE ? OR company_name LIKE ? OR email LIKE ?`,
        [s, s, s, s]
    );

    return {
        entries,
        totalPages: Math.ceil(total / limit),
        totalRecords: total
    };
}

/**
 * Bulk insert/upsert directory entries
 * Entries: Array of { entity_type, entity_id, parent_entity_id, name, phone_number, normalized_number, company_name, email, designation }
 */
export async function upsertDirectoryEntries(entries) {
    if (!entries || entries.length === 0) return;

    const query = `
        INSERT INTO phone_directory (
            entity_type, entity_id, parent_entity_id, name, phone_number, 
            normalized_number, company_name, email, designation, last_synced_at
        ) VALUES ?
        ON DUPLICATE KEY UPDATE 
            name = VALUES(name),
            phone_number = VALUES(phone_number),
            normalized_number = VALUES(normalized_number),
            company_name = VALUES(company_name),
            email = VALUES(email),
            designation = VALUES(designation),
            last_synced_at = VALUES(last_synced_at)
    `;

    const values = entries.map(e => [
        e.entity_type,
        e.entity_id,
        e.parent_entity_id || null,
        e.name,
        e.phone_number,
        e.normalized_number,
        e.company_name || null,
        e.email || null,
        e.designation || null,
        new Date()
    ]);

    await appDB.query(query, [values]);
}

/**
 * Delete entries that were not included in the last sync
 * (Optional: but useful for maintaining a clean directory)
 */
export async function cleanupOrphanedEntries(syncStartTime) {
    await appDB.query(
        "DELETE FROM phone_directory WHERE last_synced_at < ?",
        [syncStartTime]
    );
}

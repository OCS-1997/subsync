import appDB from "../db/subsyncDB.js";
import { formatMySQLDate } from "../utils/dateFormatter.js";

/**
 * Get birthdays for today and upcoming (next 7 days)
 * Queries ONLY the birthdays table (single source of truth) - avoids duplicates.
 * The birthdays table is kept in sync automatically by the cron job.
 */
export async function getUpcomingBirthdays() {
    const today = new Date();
    const todayYear = today.getFullYear();

    // Fetch all birthdays from the persisted table (already deduplicated by sync)
    const [rows] = await appDB.query(
        `SELECT b.id,
                b.name,
                b.email,
                b.date_of_birth,
                b.type,
                b.email_send,
                b.include_in_communication,
                b.customer_id,
                b.user_id,
                b.contact_person_index,
                c.company_name
         FROM birthdays b
         LEFT JOIN customers c
             ON b.customer_id COLLATE utf8mb4_unicode_ci = c.customer_id COLLATE utf8mb4_unicode_ci
         ORDER BY b.type, b.name`
    );

    const allBirthdays = [];

    for (const row of rows) {
        if (!row.date_of_birth) continue;

        const dob = new Date(row.date_of_birth);
        const dobMonth = dob.getMonth();
        const dobDay = dob.getDate();

        // Build next birthday date (year-independent)
        let nextBirthday = new Date(todayYear, dobMonth, dobDay);
        // Use start of today for comparison to avoid time-of-day issues
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        if (nextBirthday < startOfToday) {
            nextBirthday = new Date(todayYear + 1, dobMonth, dobDay);
        }

        const daysUntil = Math.round((nextBirthday - startOfToday) / (1000 * 60 * 60 * 24));
        if (daysUntil < 0 || daysUntil > 7) continue;

        const isToday = daysUntil === 0;

        allBirthdays.push({
            id: row.id,
            name: row.name,
            email: row.email,
            date_of_birth: formatMySQLDate(row.date_of_birth),
            type: row.type,
            email_send: row.email_send,
            include_in_communication: row.include_in_communication,
            customer_id: row.customer_id,
            user_id: row.user_id,
            contact_person_index: row.contact_person_index,
            company_name: row.company_name || null,
            birthday_status: isToday ? 'today' : 'upcoming',
            days_until: daysUntil
        });
    }

    // Sort: today first, then by days_until ascending
    allBirthdays.sort((a, b) => a.days_until - b.days_until);

    return {
        today: allBirthdays.filter(b => b.birthday_status === 'today'),
        upcoming: allBirthdays.filter(b => b.birthday_status === 'upcoming')
    };
}

/**
 * Save or update birthday record.
 * Uses explicit lookup + update/insert because the birthdays table may not have a UNIQUE constraint,
 * so ON DUPLICATE KEY UPDATE would be unreliable.
 * Also fixes: contact_person_index = 0 must NOT be coerced to null (0 || null = null in JS).
 */
export async function saveBirthday(birthdayData) {
    const {
        user_id, customer_id, date_of_birth, email, name, type,
        email_send, include_in_communication
    } = birthdayData;

    // Explicitly handle index 0 — do NOT use `|| null` which converts 0 to null
    const contact_person_index = (birthdayData.contact_person_index !== null && birthdayData.contact_person_index !== undefined)
        ? birthdayData.contact_person_index
        : null;

    // Build the lookup query based on type
    let lookupQuery;
    let lookupParams;

    // If an explicit id is provided (edit path), resolve by PK directly \u2014 safest and most precise
    if (birthdayData.id) {
        lookupQuery = `SELECT id FROM birthdays WHERE id = ? LIMIT 1`;
        lookupParams = [birthdayData.id];
    } else if (type === 'user' && user_id) {
        lookupQuery = `SELECT id FROM birthdays WHERE type = 'user' AND user_id = ? LIMIT 1`;
        lookupParams = [user_id];
    } else if (type === 'customer' && customer_id && contact_person_index === null) {
        // Main customer birthday (not a contact person)
        lookupQuery = `SELECT id FROM birthdays WHERE type = 'customer' AND customer_id = ? AND contact_person_index IS NULL LIMIT 1`;
        lookupParams = [customer_id];
    } else if (type === 'contact_person' && customer_id && contact_person_index !== null) {
        lookupQuery = `SELECT id FROM birthdays WHERE type = 'contact_person' AND customer_id = ? AND contact_person_index = ? LIMIT 1`;
        lookupParams = [customer_id, contact_person_index];
    } else {
        // Fallback: match by email + type (for manually-added records without any source links)
        lookupQuery = `SELECT id FROM birthdays WHERE email = ? AND type = ? AND customer_id IS NULL AND user_id IS NULL LIMIT 1`;
        lookupParams = [email, type];
    }

    const [existing] = await appDB.query(lookupQuery, lookupParams);

    if (existing.length > 0) {
        // Update existing record
        await appDB.query(
            `UPDATE birthdays SET
                date_of_birth = ?,
                email = ?,
                name = ?,
                email_send = ?,
                include_in_communication = ?,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                formatMySQLDate(date_of_birth),
                email,
                name,
                email_send ? 1 : 0,
                include_in_communication ? 1 : 0,
                existing[0].id
            ]
        );
        return existing[0].id;
    } else {
        // Insert new record
        const [result] = await appDB.query(
            `INSERT INTO birthdays
                (user_id, customer_id, contact_person_index, date_of_birth, email, name, type, email_send, include_in_communication)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user_id || null,
                customer_id || null,
                contact_person_index,
                formatMySQLDate(date_of_birth),
                email,
                name,
                type,
                email_send ? 1 : 0,
                include_in_communication ? 1 : 0
            ]
        );
        return result.insertId;
    }
}

/**
 * Write a birthday change back to the source table.
 * Called after a user edits a birthday on the Birthdays page so the
 * source record (users / customers / other_contacts JSON) stays in sync.
 *
 * @param {Object} birthdayRecord  – the existing birthday row (must have type, user_id, customer_id, contact_person_index)
 * @param {string} newDateOfBirth  – new date string (YYYY-MM-DD)
 */
export async function updateBirthdaySource(birthdayRecord, newDateOfBirth) {
    const { type, user_id, customer_id, contact_person_index } = birthdayRecord;
    const formatted = formatMySQLDate(newDateOfBirth);

    if (type === 'user' && user_id) {
        // ── Update users.date_of_birth ──
        await appDB.query(
            `UPDATE users SET date_of_birth = ? WHERE username = ?`,
            [formatted, user_id]
        );

    } else if (type === 'customer' && customer_id) {
        // ── Update customers.date_of_birth ──
        await appDB.query(
            `UPDATE customers SET date_of_birth = ? WHERE customer_id = ?`,
            [formatted, customer_id]
        );

    } else if (type === 'contact_person' && customer_id && contact_person_index !== null && contact_person_index !== undefined) {
        // ── Update the birthday field inside the correct other_contacts[index] entry ──
        // MySQL's JSON_SET uses 0-based array path: $[0], $[1], ...
        await appDB.query(
            `UPDATE customers
             SET other_contacts = JSON_SET(
                 other_contacts,
                 CONCAT('$[', ?, '].birthday'),
                 ?
             )
             WHERE customer_id = ?
               AND JSON_LENGTH(other_contacts) > ?`,
            [contact_person_index, formatted, customer_id, contact_person_index]
        );
    }
    // If none of the conditions match (e.g. a fully-manual entry with no source link),
    // we simply skip — there is no source to update.
}

/**
 * Get all birthdays with pagination and filtering
 */
export async function getAllBirthdays({ search = '', type = '', page = 1, limit = 50, sort = 'date_of_birth', order = 'asc' }) {
    const offset = (page - 1) * limit;
    const searchQuery = `%${search}%`;

    let whereConditions = [];
    let queryParams = [];

    if (search) {
        whereConditions.push('(b.name LIKE ? OR b.email LIKE ?)');
        queryParams.push(searchQuery, searchQuery);
    }

    if (type && ['user', 'customer', 'contact_person'].includes(type)) {
        whereConditions.push('b.type = ?');
        queryParams.push(type);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const allowedSortColumns = ['name', 'email', 'date_of_birth', 'type', 'created_at'];
    const sortColumn = allowedSortColumns.includes(sort) ? sort : 'date_of_birth';
    const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const [birthdays] = await appDB.query(
        `SELECT b.*, 
                c.company_name,
                u.name as user_name
         FROM birthdays b
         LEFT JOIN customers c ON b.customer_id COLLATE utf8mb4_unicode_ci = c.customer_id COLLATE utf8mb4_unicode_ci
         LEFT JOIN users u ON b.user_id COLLATE utf8mb4_unicode_ci = u.username COLLATE utf8mb4_unicode_ci
         ${whereClause}
         ORDER BY ${sortColumn} ${sortOrder}
         LIMIT ? OFFSET ?`,
        [...queryParams, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await appDB.query(
        `SELECT COUNT(*) as total FROM birthdays b ${whereClause}`,
        queryParams
    );

    const totalPages = Math.ceil(total / limit);
    return {
        birthdays: birthdays.map(b => ({
            ...b,
            date_of_birth: formatMySQLDate(b.date_of_birth)
        })),
        totalPages,
        totalRecords: total
    };
}

/**
 * Sync birthdays from users, customers, and contact persons tables
 * NOTE: This PRESERVES manually-added birthdays (those with no user_id, customer_id, or contact_person_index
 * referencing a source record, i.e. type = 'manual' or added via the form without linking to a source entity).
 * Only synced records (linked to users, customers, or customer contact persons) are upserted.
 */
export async function syncBirthdays() {
    try {
        // ── Step 0: Deduplicate any rows double-inserted by previous buggy syncs ──
        // For users: keep only MAX(id) per user_id
        await appDB.query(`
            DELETE b1 FROM birthdays b1
            INNER JOIN birthdays b2
                ON b1.type = 'user' AND b2.type = 'user'
                AND b1.user_id = b2.user_id
                AND b1.id < b2.id
        `);
        // For customers (main record): keep only MAX(id) per customer_id where contact_person_index IS NULL
        await appDB.query(`
            DELETE b1 FROM birthdays b1
            INNER JOIN birthdays b2
                ON b1.type = 'customer' AND b2.type = 'customer'
                AND b1.customer_id = b2.customer_id
                AND b1.contact_person_index IS NULL AND b2.contact_person_index IS NULL
                AND b1.id < b2.id
        `);
        // For contact_persons: keep only MAX(id) per (customer_id, contact_person_index)
        await appDB.query(`
            DELETE b1 FROM birthdays b1
            INNER JOIN birthdays b2
                ON b1.type = 'contact_person' AND b2.type = 'contact_person'
                AND b1.customer_id = b2.customer_id
                AND b1.contact_person_index = b2.contact_person_index
                AND b1.id < b2.id
        `);

        // ── Step 1: Sync user birthdays (upsert only - no full DELETE) ──
        const [users] = await appDB.query(
            `SELECT username, name, email, date_of_birth
             FROM users
             WHERE date_of_birth IS NOT NULL`
        );

        // Collect user_ids that have a DOB so we can clean up stale user-type records
        const activeUserIds = users.map(u => u.username);

        // Remove user-type birthday records whose user no longer has a DOB or no longer exists.
        // IMPORTANT: only delete records that are actually LINKED to a user (user_id IS NOT NULL).
        // Manual entries that happen to have type='user' but no real user_id link are left alone.
        if (activeUserIds.length > 0) {
            await appDB.query(
                `DELETE FROM birthdays WHERE type = 'user' AND user_id IS NOT NULL AND user_id NOT IN (${activeUserIds.map(() => '?').join(',')})`,
                activeUserIds
            );
        }
        // If there are no active users with DOBs, we still don't wipe everything —
        // it's safer to let the next sync catch up incrementally.

        for (const user of users) {
            await saveBirthday({
                user_id: user.username,
                customer_id: null,
                contact_person_index: null,
                date_of_birth: user.date_of_birth,
                email: user.email,
                name: user.name,
                type: 'user',
                email_send: true,
                include_in_communication: true
            });
        }

        // Sync customer birthdays (upsert only)
        const [customers] = await appDB.query(
            `SELECT customer_id, 
                    CONCAT(first_name, ' ', last_name) AS name,
                    primary_email AS email,
                    date_of_birth
             FROM customers
             WHERE date_of_birth IS NOT NULL AND customer_status = 'Active'`
        );

        const activeCustomerIds = customers.map(c => c.customer_id);

        // Remove stale customer-type birthday records (no contact_person_index = main customer record).
        // IMPORTANT: only delete records that are LINKED to a customer (customer_id IS NOT NULL).
        if (activeCustomerIds.length > 0) {
            await appDB.query(
                `DELETE FROM birthdays WHERE type = 'customer' AND customer_id IS NOT NULL AND contact_person_index IS NULL AND customer_id NOT IN (${activeCustomerIds.map(() => '?').join(',')})`,
                activeCustomerIds
            );
        }
        // Skip the delete if no active customers — safer than wiping all customer-type records.

        for (const customer of customers) {
            await saveBirthday({
                user_id: null,
                customer_id: customer.customer_id,
                contact_person_index: null,
                date_of_birth: customer.date_of_birth,
                email: customer.email,
                name: customer.name,
                type: 'customer',
                email_send: true,
                include_in_communication: true
            });
        }

        // Sync contact person birthdays (upsert only)
        const [customersWithContacts] = await appDB.query(
            `SELECT customer_id, other_contacts
             FROM customers
             WHERE other_contacts IS NOT NULL 
             AND other_contacts != '[]'
             AND other_contacts != ''
             AND customer_status = 'Active'`
        );

        // Build a set of valid (customer_id, contact_person_index) pairs from source data
        const validContactKeys = new Set();

        for (const customer of customersWithContacts) {
            try {
                const contacts = typeof customer.other_contacts === 'string'
                    ? JSON.parse(customer.other_contacts)
                    : customer.other_contacts;

                if (Array.isArray(contacts)) {
                    for (let index = 0; index < contacts.length; index++) {
                        const contact = contacts[index];
                        // Contact persons with birthday field in other_contacts JSON
                        if (contact.birthday) {
                            validContactKeys.add(`${customer.customer_id}_${index}`);
                            await saveBirthday({
                                user_id: null,
                                customer_id: customer.customer_id,
                                contact_person_index: index,
                                date_of_birth: contact.birthday,
                                email: contact.email,
                                name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
                                type: 'contact_person',
                                email_send: contact.email_send !== false,
                                include_in_communication: contact.include_in_communication !== false
                            });
                        }
                    }
                }
            } catch (error) {
                console.error(`Error syncing contacts for customer ${customer.customer_id}:`, error);
            }
        }

        // Remove stale contact_person-type birthday records that no longer exist in source.
        // CRITICAL: Only consider LINKED records (customer_id IS NOT NULL AND contact_person_index IS NOT NULL).
        // Manually-added entries (no customer_id) must NEVER be deleted by the sync.
        const [existingContactBirthdays] = await appDB.query(
            `SELECT id, customer_id, contact_person_index
             FROM birthdays
             WHERE type = 'contact_person'
               AND customer_id IS NOT NULL
               AND contact_person_index IS NOT NULL`
        );
        for (const record of existingContactBirthdays) {
            const key = `${record.customer_id}_${record.contact_person_index}`;
            if (!validContactKeys.has(key)) {
                await appDB.query(`DELETE FROM birthdays WHERE id = ?`, [record.id]);
            }
        }

        return { success: true, message: 'Birthdays synced successfully' };
    } catch (error) {
        console.error('Error syncing birthdays:', error);
        throw error;
    }
}

/**
 * Delete a birthday record
 */
export async function deleteBirthday(birthdayId) {
    const [result] = await appDB.query(
        'DELETE FROM birthdays WHERE id = ?',
        [birthdayId]
    );
    return result.affectedRows > 0;
}

/**
 * Get birthday by ID
 */
export async function getBirthdayById(birthdayId) {
    const [result] = await appDB.query(
        `SELECT b.*, 
                c.company_name,
                u.name as user_name
         FROM birthdays b
         LEFT JOIN customers c ON b.customer_id COLLATE utf8mb4_unicode_ci = c.customer_id COLLATE utf8mb4_unicode_ci
         LEFT JOIN users u ON b.user_id COLLATE utf8mb4_unicode_ci = u.username COLLATE utf8mb4_unicode_ci
         WHERE b.id = ?`,
        [birthdayId]
    );
    return result[0] ? {
        ...result[0],
        date_of_birth: formatMySQLDate(result[0].date_of_birth)
    } : null;
}


import appDB from '../db/subsyncDB.js';

/**
 * Create a new DCR entry
 * @param {Object} entryData
 * @returns {Promise<Object>}
 */
export async function createDcrEntry(entryData) {
    const {
        user_id,
        timestamp,
        company,
        domain,
        contact_person,
        call_type,
        category,
        contact_number,
        description,
        time_spent_minutes
    } = entryData;

    const [result] = await appDB.query(
        `INSERT INTO dcr_entries 
        (user_id, timestamp, company, domain, contact_person, call_type, category, contact_number, description, time_spent_minutes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, timestamp, company, domain, contact_person, call_type, category, contact_number, description, time_spent_minutes]
    );

    return { id: result.insertId };
}

/**
 * Get DCR entry by ID
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
export async function getDcrEntryById(id) {
    const [rows] = await appDB.query(
        `SELECT d.*, u.name AS user_name, u.username
         FROM dcr_entries d
         JOIN users u ON d.user_id = u.username
         WHERE d.id = ?`,
        [id]
    );
    return rows[0] || null;
}

/**
 * List DCR entries with filters
 * @param {Object} filters
 * @returns {Promise<{dataArray: Array, totalCount: number}>}
 */
export async function getDcrEntries(filters = {}) {
    const {
        user_id,
        start_date,
        end_date,
        category,
        call_type,
        search,
        page = 1,
        limit = 50
    } = filters;

    let query = `
        SELECT d.*, u.name AS user_name, u.username
        FROM dcr_entries d
        JOIN users u ON d.user_id = u.username
        WHERE 1=1
    `;
    let countQuery = `
        SELECT COUNT(*) as totalCount
        FROM dcr_entries d
        WHERE 1=1
    `;
    const params = [];
    const countParams = [];

    if (user_id) {
        query += ` AND d.user_id = ?`;
        countQuery += ` AND d.user_id = ?`;
        params.push(user_id);
        countParams.push(user_id);
    }

    if (start_date) {
        query += ` AND DATE(d.timestamp) >= ?`;
        countQuery += ` AND DATE(d.timestamp) >= ?`;
        params.push(start_date);
        countParams.push(start_date);
    }

    if (end_date) {
        query += ` AND DATE(d.timestamp) <= ?`;
        countQuery += ` AND DATE(d.timestamp) <= ?`;
        params.push(end_date);
        countParams.push(end_date);
    }

    if (category) {
        query += ` AND d.category = ?`;
        countQuery += ` AND d.category = ?`;
        params.push(category);
        countParams.push(category);
    }

    if (call_type) {
        query += ` AND d.call_type = ?`;
        countQuery += ` AND d.call_type = ?`;
        params.push(call_type);
        countParams.push(call_type);
    }

    if (search) {
        query += ` AND (d.company LIKE ? OR d.domain LIKE ? OR d.contact_person LIKE ? OR d.description LIKE ?)`;
        countQuery += ` AND (d.company LIKE ? OR d.domain LIKE ? OR d.contact_person LIKE ? OR d.description LIKE ?)`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY d.timestamp DESC`;

    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await appDB.query(query, params);
    const [[{ totalCount }]] = await appDB.query(countQuery, countParams);

    return { dataArray: rows, totalCount };
}

/**
 * Update DCR entry
 * @param {number} id
 * @param {Object} entryData
 * @returns {Promise<boolean>}
 */
export async function updateDcrEntry(id, entryData) {
    const {
        timestamp,
        company,
        domain,
        contact_person,
        call_type,
        category,
        contact_number,
        description,
        time_spent_minutes
    } = entryData;

    const [result] = await appDB.query(
        `UPDATE dcr_entries 
        SET timestamp = ?, company = ?, domain = ?, contact_person = ?, call_type = ?, 
            category = ?, contact_number = ?, description = ?, time_spent_minutes = ?
        WHERE id = ?`,
        [timestamp, company, domain, contact_person, call_type, category, contact_number, description, time_spent_minutes, id]
    );

    return result.affectedRows > 0;
}

/**
 * Delete DCR entry
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export async function deleteDcrEntry(id) {
    const [result] = await appDB.query(`DELETE FROM dcr_entries WHERE id = ?`, [id]);
    return result.affectedRows > 0;
}

/**
 * Get DCR statistics
 * @param {Object} filters
 * @returns {Promise<Object>}
 */
export async function getDcrStats(filters = {}) {
    const { start_date, end_date, user_id } = filters;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (start_date) {
        whereClause += ` AND DATE(timestamp) >= ?`;
        params.push(start_date);
    }

    if (end_date) {
        whereClause += ` AND DATE(timestamp) <= ?`;
        params.push(end_date);
    }

    if (user_id) {
        whereClause += ` AND user_id = ?`;
        params.push(user_id);
    }

    // Total calls
    const [[{ totalCalls }]] = await appDB.query(
        `SELECT COUNT(*) as totalCalls FROM dcr_entries ${whereClause}`,
        params
    );

    // Total time spent
    const [[{ totalTimeMinutes }]] = await appDB.query(
        `SELECT COALESCE(SUM(time_spent_minutes), 0) as totalTimeMinutes FROM dcr_entries ${whereClause}`,
        params
    );

    // Calls per user
    const [callsPerUser] = await appDB.query(
        `SELECT u.username, u.name AS user_name, 
                COUNT(*) as call_count,
                COALESCE(SUM(d.time_spent_minutes), 0) as total_minutes
         FROM dcr_entries d
         JOIN users u ON d.user_id = u.username
         ${whereClause.replace('WHERE 1=1', 'WHERE 1=1 AND d.user_id = u.username')}
         GROUP BY u.username, u.name
         ORDER BY call_count DESC`,
        params
    );

    // Calls per category
    const [callsPerCategory] = await appDB.query(
        `SELECT category,
                COUNT(*) as call_count,
                COALESCE(SUM(time_spent_minutes), 0) as total_minutes
         FROM dcr_entries
         ${whereClause}
         GROUP BY category
         ORDER BY call_count DESC`,
        params
    );

    // Time per company (yearly)
    const companyWhereClause = whereClause + ` AND company IS NOT NULL AND company != ''`;
    const [timePerCompany] = await appDB.query(
        `SELECT company,
                COUNT(*) as call_count,
                COALESCE(SUM(time_spent_minutes), 0) as total_minutes
         FROM dcr_entries
         ${companyWhereClause}
         GROUP BY company
         ORDER BY total_minutes DESC
         LIMIT 20`,
        params
    );

    // Trending categories (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [trendingCategories] = await appDB.query(
        `SELECT category,
                COUNT(*) as call_count
         FROM dcr_entries
         WHERE DATE(timestamp) >= ?
         GROUP BY category
         ORDER BY call_count DESC
         LIMIT 10`,
        [sevenDaysAgo.toISOString().split('T')[0]]
    );

    return {
        totalCalls,
        totalTimeMinutes,
        totalTimeHours: (totalTimeMinutes / 60).toFixed(2),
        callsPerUser,
        callsPerCategory,
        timePerCompany,
        trendingCategories
    };
}

/**
 * Get entries for daily report
 * @param {string} date - YYYY-MM-DD format
 * @returns {Promise<Array>}
 */
export async function getDcrEntriesForDate(date) {
    const [rows] = await appDB.query(
        `SELECT d.*, u.name AS user_name, u.username
         FROM dcr_entries d
         JOIN users u ON d.user_id = u.username
         WHERE DATE(d.timestamp) = ?
         ORDER BY u.name, d.timestamp`,
        [date]
    );
    return rows;
}

/**
 * Get all categories
 * @returns {Promise<Array>}
 */
export async function getDcrCategories() {
    const [rows] = await appDB.query(`SELECT name FROM dcr_categories ORDER BY name`);
    return rows.map(r => r.name);
}

/**
 * Export DCR entries to CSV format
 * @param {Object} filters
 * @returns {Promise<Array>}
 */
export async function exportDcrEntries(filters = {}) {
    const { start_date, end_date, user_id } = filters;

    let query = `
        SELECT 
            d.timestamp,
            u.name AS user_name,
            d.company,
            d.domain,
            d.contact_person,
            d.call_type,
            d.category,
            d.contact_number,
            d.description,
            d.time_spent_minutes
        FROM dcr_entries d
        JOIN users u ON d.user_id = u.username
        WHERE 1=1
    `;
    const params = [];

    if (start_date) {
        query += ` AND DATE(d.timestamp) >= ?`;
        params.push(start_date);
    }

    if (end_date) {
        query += ` AND DATE(d.timestamp) <= ?`;
        params.push(end_date);
    }

    if (user_id) {
        query += ` AND d.user_id = ?`;
        params.push(user_id);
    }

    query += ` ORDER BY d.timestamp DESC`;

    const [rows] = await appDB.query(query, params);
    return rows;
}


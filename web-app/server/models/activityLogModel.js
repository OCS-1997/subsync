import appDB from "../db/subsyncDB.js";

// Insert a new activity log
async function logActivity({ username, action, resourceType = null, resourceId = null, ipAddress = null, details = null }) {
    try {
        await appDB.query(
            `INSERT INTO activity_logs (username, action, resource_type, resource_id, ip_address, details) VALUES (?, ?, ?, ?, ?, ?)`,
            [username, action, resourceType, resourceId, ipAddress, details ? JSON.stringify(details) : null]
        );
    } catch (error) {
        console.error("Error logging activity:", error);
        // Do not throw, logging should not break main flow
    }
}

// Fetch activity logs with improved filtering and pagination
async function getActivityLogs({ username, action, resourceType, search, dateFrom, dateTo, limit = 20, offset = 0 } = {}) {
    let sql = `SELECT * FROM activity_logs`;
    const params = [];
    const conditions = [];
    
    if (username) {
        conditions.push("username LIKE ?");
        params.push(`%${username}%`);
    }
    if (action) {
        conditions.push("action LIKE ?");
        params.push(`%${action}%`);
    }
    if (resourceType) {
        conditions.push("resource_type LIKE ?");
        params.push(`%${resourceType}%`);
    }
    if (search) {
        conditions.push("(username LIKE ? OR action LIKE ? OR resource_type LIKE ? OR ip_address LIKE ?)");
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (dateFrom) {
        conditions.push("DATE(timestamp) >= ?");
        params.push(dateFrom);
    }
    if (dateTo) {
        conditions.push("DATE(timestamp) <= ?");
        params.push(dateTo);
    }
    
    if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
    }
    sql += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));
    
    const [rows] = await appDB.query(sql, params);
    return rows;
}

// Get total count of activity logs for pagination
async function getActivityLogsCount({ username, action, resourceType, search, dateFrom, dateTo } = {}) {
    let sql = `SELECT COUNT(*) as total FROM activity_logs`;
    const params = [];
    const conditions = [];
    
    if (username) {
        conditions.push("username LIKE ?");
        params.push(`%${username}%`);
    }
    if (action) {
        conditions.push("action LIKE ?");
        params.push(`%${action}%`);
    }
    if (resourceType) {
        conditions.push("resource_type LIKE ?");
        params.push(`%${resourceType}%`);
    }
    if (search) {
        conditions.push("(username LIKE ? OR action LIKE ? OR resource_type LIKE ? OR ip_address LIKE ?)");
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (dateFrom) {
        conditions.push("DATE(timestamp) >= ?");
        params.push(dateFrom);
    }
    if (dateTo) {
        conditions.push("DATE(timestamp) <= ?");
        params.push(dateTo);
    }
    
    if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
    }
    
    const [rows] = await appDB.query(sql, params);
    return rows[0].total;
}

export { logActivity, getActivityLogs, getActivityLogsCount };

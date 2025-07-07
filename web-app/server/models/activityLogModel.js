import appDB from "../db/subsyncDB.js";

// Insert a new activity log
async function logActivity({ username, action, resourceType = null, resourceId = null, details = null }) {
    try {
        await appDB.query(
            `INSERT INTO activity_logs (username, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)`,
            [username, action, resourceType, resourceId, details ? JSON.stringify(details) : null]
        );
    } catch (error) {
        console.error("Error logging activity:", error);
        // Do not throw, logging should not break main flow
    }
}

// Fetch activity logs (optionally filter by username, action, etc.)
async function getActivityLogs({ username, action, limit = 100, offset = 0 } = {}) {
    let sql = `SELECT * FROM activity_logs`;
    const params = [];
    const conditions = [];
    if (username) {
        conditions.push("username = ?");
        params.push(username);
    }
    if (action) {
        conditions.push("action = ?");
        params.push(action);
    }
    if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
    }
    sql += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));
    const [rows] = await appDB.query(sql, params);
    return rows;
}

export { logActivity, getActivityLogs }; 
import appDB from "../db/subsyncDB.js";
import { getCurrentTime } from "../middlewares/time.js";
import { generateID } from "../middlewares/generateID.js";

/**
 * Format DATE object to MySQL date string (YYYY-MM-DD)
 * @param {string|Date|null} dateVal 
 * @returns {string|null}
 */
function formatDateForMySQL(dateVal) {
    if (!dateVal) return null;
    const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
}

// --- Leave Types ---

async function getAllLeaveTypes() {
    const [rows] = await appDB.query("SELECT * FROM leave_types WHERE is_active = 1 ORDER BY name");
    return rows;
}

async function getLeaveTypeById(id) {
    const [rows] = await appDB.query("SELECT * FROM leave_types WHERE id = ?", [id]);
    return rows[0] || null;
}

async function createLeaveType(data) {
    const [result] = await appDB.query(
        "INSERT INTO leave_types (name, code, description, total_days_per_year, is_encashable, max_carry_forward, min_service_months) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [data.name, data.code, data.description, data.total_days_per_year, data.is_encashable, data.max_carry_forward, data.min_service_months]
    );
    return result.insertId;
}

async function updateLeaveType(id, data) {
    const [result] = await appDB.query(
        "UPDATE leave_types SET name = ?, code = ?, description = ?, total_days_per_year = ?, is_encashable = ?, max_carry_forward = ?, min_service_months = ? WHERE id = ?",
        [data.name, data.code, data.description, data.total_days_per_year, data.is_encashable, data.max_carry_forward, data.min_service_months, id]
    );
    return result.affectedRows > 0;
}

async function deleteLeaveType(id) {
    const [result] = await appDB.query("UPDATE leave_types SET is_active = 0 WHERE id = ?", [id]);
    return result.affectedRows > 0;
}

// --- Leave Requests ---

async function createLeaveRequest(data) {
    const requestId = generateID("LVE");
    const currentTime = getCurrentTime();
    
    const [result] = await appDB.query(
        `INSERT INTO leave_requests (
            request_id, user_id, leave_type_id, start_date, end_date, 
            duration_days, half_day_type, reason, status, applied_on
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
        [
            requestId,
            data.user_id,
            data.leave_type_id,
            formatDateForMySQL(data.start_date),
            formatDateForMySQL(data.end_date),
            data.duration_days,
            data.half_day_type || 'none',
            data.reason,
            currentTime
        ]
    );
    
    if (result.affectedRows > 0) return requestId;
    throw new Error("Failed to create leave request");
}

async function updateLeaveStatus(requestId, status, actionedBy, comments = null) {
    const leaveRequest = await getLeaveRequestById(requestId);
    if (!leaveRequest) return false;

    const oldStatus = leaveRequest.status;
    const year = new Date(leaveRequest.start_date).getFullYear();
    const duration = leaveRequest.duration_days;
    const userId = leaveRequest.user_id;
    const leaveTypeId = leaveRequest.leave_type_id;

    const currentTime = getCurrentTime();
    const connection = await appDB.getConnection();
    
    try {
        await connection.beginTransaction();

        // 1. Update the request status
        const [updateResult] = await connection.query(
            `UPDATE leave_requests 
             SET status = ?, actioned_by = ?, actioned_on = ?, comments = ?
             WHERE request_id = ?`,
            [status, actionedBy, currentTime, comments, requestId]
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return false;
        }

        // 2. Adjust balance if necessary
        // Case A: Approving a previously non-approved leaf
        if (status === 'approved' && oldStatus !== 'approved') {
            await connection.query(
                `UPDATE leave_balances 
                 SET used = used + ? 
                 WHERE user_id = ? AND leave_type_id = ? AND year = ?`,
                [duration, userId, leaveTypeId, year]
            );
        }
        // Case B: Moving out of 'approved' status to something else (rejected/cancelled)
        else if (status !== 'approved' && oldStatus === 'approved') {
            await connection.query(
                `UPDATE leave_balances 
                 SET used = used - ? 
                 WHERE user_id = ? AND leave_type_id = ? AND year = ?`,
                [duration, userId, leaveTypeId, year]
            );
        }

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        console.error("Error in updateLeaveStatus transaction:", error);
        throw error;
    } finally {
        connection.release();
    }
}

async function getLeaveRequests(filters = {}) {
    let query = `
        SELECT lr.*, lt.name as leave_type_name, u.name as user_name, au.name as actioned_by_name
        FROM leave_requests lr
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        JOIN users u ON lr.user_id = u.username
        LEFT JOIN users au ON lr.actioned_by = au.username
        WHERE 1=1
    `;
    const params = [];

    if (filters.user_id) {
        query += " AND lr.user_id = ?";
        params.push(filters.user_id);
    }
    if (filters.status) {
        query += " AND lr.status = ?";
        params.push(filters.status);
    }
    if (filters.year) {
        query += " AND YEAR(lr.start_date) = ?";
        params.push(filters.year);
    }

    query += " ORDER BY lr.applied_on DESC";
    
    const [rows] = await appDB.query(query, params);
    return rows;
}

async function countPendingLeaveRequests() {
    const [rows] = await appDB.query("SELECT COUNT(*) as count FROM leave_requests WHERE status = 'pending'");
    return rows[0].count;
}

async function getLeaveRequestById(requestId) {
    const [rows] = await appDB.query(
        `SELECT lr.*, lt.name as leave_type_name, u.name as user_name, au.name as actioned_by_name
         FROM leave_requests lr
         JOIN leave_types lt ON lr.leave_type_id = lt.id
         JOIN users u ON lr.user_id = u.username
         LEFT JOIN users au ON lr.actioned_by = au.username
         WHERE lr.request_id = ?`,
        [requestId]
    );
    return rows[0] || null;
}

// --- Leave Balances ---

async function getUserLeaveBalances(userId, year) {
    const [rows] = await appDB.query(
        `SELECT lb.*, lt.name as leave_type_name, lt.code as leave_type_code
         FROM leave_balances lb
         JOIN leave_types lt ON lb.leave_type_id = lt.id
         WHERE lb.user_id = ? AND lb.year = ?`,
        [userId, year]
    );
    return rows;
}

async function initializeBalancesForUser(userId, year) {
    const leaveTypes = await getAllLeaveTypes();
    const connection = await appDB.getConnection();
    try {
        await connection.beginTransaction();
        for (const type of leaveTypes) {
            await connection.query(
                `INSERT IGNORE INTO leave_balances (user_id, leave_type_id, year, allocated)
                 VALUES (?, ?, ?, ?)`,
                [userId, type.id, year, type.total_days_per_year]
            );
        }
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// --- Holidays ---

async function getAllHolidays(year = null) {
    let query = "SELECT * FROM holidays WHERE is_active = 1";
    const params = [];
    if (year) {
        query += " AND YEAR(holiday_date) = ?";
        params.push(year);
    }
    query += " ORDER BY holiday_date ASC";
    const [rows] = await appDB.query(query, params);
    return rows;
}

async function createHoliday(data) {
    const [result] = await appDB.query(
        "INSERT INTO holidays (name, holiday_date, description, is_optional) VALUES (?, ?, ?, ?)",
        [data.name, formatDateForMySQL(data.holiday_date), data.description, data.is_optional]
    );
    return result.insertId;
}

async function updateHoliday(id, data) {
    const [result] = await appDB.query(
        "UPDATE holidays SET name = ?, holiday_date = ?, description = ?, is_optional = ? WHERE id = ?",
        [data.name, formatDateForMySQL(data.holiday_date), data.description, data.is_optional, id]
    );
    return result.affectedRows > 0;
}

async function deleteHoliday(id) {
    const [result] = await appDB.query("UPDATE holidays SET is_active = 0 WHERE id = ?", [id]);
    return result.affectedRows > 0;
}

export {
    getAllLeaveTypes,
    getLeaveTypeById,
    createLeaveRequest,
    updateLeaveStatus,
    getLeaveRequests,
    getLeaveRequestById,
    getUserLeaveBalances,
    initializeBalancesForUser,
    getAllHolidays,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
    createHoliday,
    updateHoliday,
    deleteHoliday,
    countPendingLeaveRequests
};

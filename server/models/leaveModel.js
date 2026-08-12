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

async function getAllLeaveTypes(includePermission = false, userGender = null) {
    let query = "SELECT * FROM leave_types WHERE is_active = 1";
    if (!includePermission) {
        query += " AND code != 'PERM'";
    }
    if (userGender === 'male') {
        query += " AND code != 'ML'";
    } else if (userGender === 'female') {
        query += " AND code != 'PL'";
    }
    query += " ORDER BY name";
    const [rows] = await appDB.query(query);
    return rows;
}

async function getLeaveTypeById(id) {
    const [rows] = await appDB.query("SELECT * FROM leave_types WHERE id = ?", [id]);
    return rows[0] || null;
}

async function createLeaveType(data) {
    const [result] = await appDB.query(
        "INSERT INTO leave_types (name, code, description, total_days_per_year, unit, is_encashable, max_carry_forward, min_service_months) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [data.name, data.code, data.description, data.total_days_per_year, data.unit || 'days', data.is_encashable, data.max_carry_forward, data.min_service_months]
    );
    return result.insertId;
}

async function updateLeaveType(id, data) {
    const [result] = await appDB.query(
        "UPDATE leave_types SET name = ?, code = ?, description = ?, total_days_per_year = ?, unit = ?, is_encashable = ?, max_carry_forward = ?, min_service_months = ? WHERE id = ?",
        [data.name, data.code, data.description, data.total_days_per_year, data.unit || 'days', data.is_encashable, data.max_carry_forward, data.min_service_months, id]
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
    // Fetch user's gender
    const [userRows] = await appDB.query("SELECT gender FROM users WHERE username = ? LIMIT 1", [userId]);
    const gender = userRows.length ? userRows[0].gender : 'other';

    let query = `
        SELECT lb.*, lt.name as leave_type_name, lt.code as leave_type_code, lt.unit as unit
        FROM leave_balances lb
        JOIN leave_types lt ON lb.leave_type_id = lt.id
        WHERE lb.user_id = ? AND lb.year = ?
    `;
    const params = [userId, year];

    if (gender === 'male') {
        query += " AND lt.code != 'ML'";
    } else if (gender === 'female') {
        query += " AND lt.code != 'PL'";
    }

    const [rows] = await appDB.query(query, params);
    return rows;
}

async function initializeBalancesForUser(userId, year) {
    const leaveTypes = await getAllLeaveTypes(true);
    const permSettings = await getPermissionSettings().catch(() => null);
    const permQuota = permSettings?.yearly_hours_quota ? parseFloat(permSettings.yearly_hours_quota) : 24.00;

    const connection = await appDB.getConnection();
    try {
        await connection.beginTransaction();
        for (const type of leaveTypes) {
            const alloc = type.code === 'PERM' ? permQuota : type.total_days_per_year;
            await connection.query(
                `INSERT IGNORE INTO leave_balances (user_id, leave_type_id, year, allocated)
                 VALUES (?, ?, ?, ?)`,
                [userId, type.id, year, alloc]
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
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    let query = `
        SELECT id, name, description, is_optional, is_active, is_recurring, holiday_date,
        CASE 
            WHEN is_recurring = 1 THEN STR_TO_DATE(CONCAT(?, '-', DATE_FORMAT(holiday_date, '%m-%d')), '%Y-%m-%d')
            ELSE holiday_date
        END as effective_holiday_date
        FROM holidays 
        WHERE is_active = 1
    `;
    const params = [targetYear];
    if (year) {
        query += " AND (YEAR(holiday_date) = ? OR is_recurring = 1)";
        params.push(targetYear);
    }
    query += " ORDER BY effective_holiday_date ASC";
    const [rows] = await appDB.query(query, params);

    return rows.map(r => ({
        ...r,
        holiday_date: r.effective_holiday_date || r.holiday_date
    }));
}

async function createHoliday(data) {
    const [result] = await appDB.query(
        "INSERT INTO holidays (name, holiday_date, description, is_optional, is_recurring) VALUES (?, ?, ?, ?, ?)",
        [data.name, formatDateForMySQL(data.holiday_date), data.description, data.is_optional || 0, data.is_recurring ? 1 : 0]
    );
    return result.insertId;
}

async function updateHoliday(id, data) {
    const [result] = await appDB.query(
        "UPDATE holidays SET name = ?, holiday_date = ?, description = ?, is_optional = ?, is_recurring = ? WHERE id = ?",
        [data.name, formatDateForMySQL(data.holiday_date), data.description, data.is_optional || 0, data.is_recurring ? 1 : 0, id]
    );
    return result.affectedRows > 0;
}

async function copyHolidaysToNextYear(fromYear, toYear) {
    const [sourceHolidays] = await appDB.query(
        "SELECT * FROM holidays WHERE is_active = 1 AND is_recurring = 0 AND YEAR(holiday_date) = ?",
        [fromYear]
    );

    let count = 0;
    for (const hol of sourceHolidays) {
        const d = new Date(hol.holiday_date);
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const newDate = `${toYear}-${m}-${day}`;
        try {
            await appDB.query(
                "INSERT IGNORE INTO holidays (name, holiday_date, description, is_optional, is_recurring) VALUES (?, ?, ?, ?, 0)",
                [hol.name, newDate, hol.description, hol.is_optional]
            );
            count++;
        } catch (e) {
            // Ignore duplicates
        }
    }
    return count;
}

async function deleteHoliday(id) {
    const [result] = await appDB.query("UPDATE holidays SET is_active = 0 WHERE id = ?", [id]);
    return result.affectedRows > 0;
}

// --- Permission Settings ---

async function getPermissionSettings() {
    const [rows] = await appDB.query("SELECT * FROM permission_settings WHERE id = 1");
    if (rows.length > 0) return rows[0];
    return {
        yearly_hours_quota: 24.00,
        monthly_hours_quota: 4.00,
        max_hours_per_request: 2.00,
        max_requests_per_month: 2,
        is_active: 1
    };
}

async function updatePermissionSettings(data) {
    const [result] = await appDB.query(
        `UPDATE permission_settings 
         SET yearly_hours_quota = ?, monthly_hours_quota = ?, max_hours_per_request = ?, max_requests_per_month = ?, is_active = ?
         WHERE id = 1`,
        [data.yearly_hours_quota, data.monthly_hours_quota, data.max_hours_per_request, data.max_requests_per_month, data.is_active ? 1 : 0]
    );
    return result.affectedRows > 0;
}

// --- Admin Employee Allocations & Balance Adjustments ---

async function getAllUserBalances(year) {
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    // Ensure all active users have balance rows for targetYear
    try {
        const [users] = await appDB.query("SELECT username FROM users");
        for (const u of users) {
            const [existing] = await appDB.query(
                "SELECT id FROM leave_balances WHERE user_id = ? AND year = ? LIMIT 1",
                [u.username, targetYear]
            );
            if (existing.length === 0) {
                await initializeBalancesForUser(u.username, targetYear).catch(() => {});
            }
        }
    } catch (e) {
        console.error("Error auto-initializing balances in getAllUserBalances:", e.message);
    }

    const [rows] = await appDB.query(
        `SELECT lb.*, lt.name as leave_type_name, lt.code as leave_type_code, lt.unit as unit, u.name as user_name, u.email as user_email, u.gender as user_gender
         FROM leave_balances lb
         JOIN leave_types lt ON lb.leave_type_id = lt.id
         JOIN users u ON lb.user_id = u.username
         WHERE lb.year = ?
         AND NOT (u.gender = 'male' AND lt.code = 'ML')
         AND NOT (u.gender = 'female' AND lt.code = 'PL')
         ORDER BY u.name ASC, lt.name ASC`,
        [targetYear]
    );
    return rows;
}

async function adjustUserBalance(userId, leaveTypeId, year, deltaAmount) {
    const [result] = await appDB.query(
        `UPDATE leave_balances 
         SET allocated = allocated + ? 
         WHERE user_id = ? AND leave_type_id = ? AND year = ?`,
        [deltaAmount, userId, leaveTypeId, year]
    );
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
    copyHolidaysToNextYear,
    countPendingLeaveRequests,
    getPermissionSettings,
    updatePermissionSettings,
    getAllUserBalances,
    adjustUserBalance
};

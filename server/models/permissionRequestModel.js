import appDB from "../db/subsyncDB.js";
import { getCurrentTime } from "../middlewares/time.js";
import { generateID } from "../middlewares/generateID.js";

async function createPermissionRequest(data) {
    const requestId = generateID("PER");
    const [result] = await appDB.query(
        `INSERT INTO permission_requests (
            request_id, user_id, date, start_time, end_time, 
            duration_minutes, reason, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
            requestId,
            data.user_id,
            data.date,
            data.start_time,
            data.end_time,
            data.duration_minutes,
            data.reason
        ]
    );
    if (result.affectedRows > 0) return requestId;
    throw new Error("Failed to create permission request");
}

async function getPermissionRequests(filters = {}) {
    let query = `
        SELECT pr.*, u.name as user_name, au.name as actioned_by_name
        FROM permission_requests pr
        JOIN users u ON pr.user_id = u.username
        LEFT JOIN users au ON pr.actioned_by = au.username
        WHERE 1=1
    `;
    const params = [];

    if (filters.user_id) {
        query += " AND pr.user_id = ?";
        params.push(filters.user_id);
    }
    if (filters.status) {
        query += " AND pr.status = ?";
        params.push(filters.status);
    }

    query += " ORDER BY pr.created_at DESC";
    const [rows] = await appDB.query(query, params);
    return rows;
}

async function countPendingPermissionRequests() {
    const [rows] = await appDB.query("SELECT COUNT(*) as count FROM permission_requests WHERE status = 'pending'");
    return rows[0].count;
}

async function getPermissionRequestById(requestId) {
    const [rows] = await appDB.query(
        `SELECT pr.*, u.name as user_name, au.name as actioned_by_name
         FROM permission_requests pr
         JOIN users u ON pr.user_id = u.username
         LEFT JOIN users au ON pr.actioned_by = au.username
         WHERE pr.request_id = ?`,
        [requestId]
    );
    return rows[0] || null;
}

async function updatePermissionStatus(requestId, status, actionedBy, comments = null) {
    const permRequest = await getPermissionRequestById(requestId);
    if (!permRequest) return false;

    const oldStatus = permRequest.status;
    const durationHours = permRequest.duration_minutes / 60;
    const userId = permRequest.user_id;
    const year = new Date(permRequest.date).getFullYear();

    const currentTime = getCurrentTime();
    const connection = await appDB.getConnection();
    
    try {
        await connection.beginTransaction();

        // 1. Update the request status
        const [updateResult] = await connection.query(
            `UPDATE permission_requests 
             SET status = ?, actioned_by = ?, actioned_on = ?, comments = ?
             WHERE request_id = ?`,
            [status, actionedBy, currentTime, comments, requestId]
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return false;
        }

        // 2. Adjust balance if there's a 'Permission' leave type
        const [types] = await connection.query("SELECT id FROM leave_types WHERE code = 'PERM' OR name = 'Permission' LIMIT 1");
        
        if (types.length > 0) {
            const leaveTypeId = types[0].id;

            // Case A: Approving
            if (status === 'approved' && oldStatus !== 'approved') {
                await connection.query(
                    `UPDATE leave_balances 
                     SET used = used + ? 
                     WHERE user_id = ? AND leave_type_id = ? AND year = ?`,
                    [durationHours, userId, leaveTypeId, year]
                );
            }
            // Case B: Moving out of approved
            else if (status !== 'approved' && oldStatus === 'approved') {
                await connection.query(
                    `UPDATE leave_balances 
                     SET used = used - ? 
                     WHERE user_id = ? AND leave_type_id = ? AND year = ?`,
                    [durationHours, userId, leaveTypeId, year]
                );
            }
        }

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        console.error("Error in updatePermissionStatus transaction:", error);
        throw error;
    } finally {
        connection.release();
    }
}

export {
    createPermissionRequest,
    getPermissionRequests,
    updatePermissionStatus,
    getPermissionRequestById,
    countPendingPermissionRequests
};

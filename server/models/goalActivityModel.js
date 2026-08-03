import appDB from "../db/subsyncDB.js";
import { logActivity } from "./activityLogModel.js";

export const recordGoalActivity = async ({ goalId, username, action, fieldName = null, oldValue = null, newValue = null, details = null, ipAddress = null }) => {
    try {
        await appDB.query(
            `INSERT INTO goal_activity_logs (goal_id, username, action, field_name, old_value, new_value, details)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [goalId, username, action, fieldName, oldValue ? String(oldValue) : null, newValue ? String(newValue) : null, details ? (typeof details === 'object' ? JSON.stringify(details) : String(details)) : null]
        );

        // Also record in central system activity_logs
        await logActivity({
            username,
            action: `GOAL_${action.toUpperCase().replace(/[^A_Z0-9]/g, '_')}`,
            resourceType: 'goal',
            resourceId: goalId,
            ipAddress,
            details: { fieldName, oldValue, newValue, details }
        });
    } catch (error) {
        console.error("Error logging goal activity:", error);
    }
};

export const getGoalActivityLogs = async (goalId, { limit = 50, offset = 0 } = {}) => {
    const [rows] = await appDB.query(
        `SELECT gal.*, u.name as user_display_name
         FROM goal_activity_logs gal
         LEFT JOIN users u ON gal.username = u.username
         WHERE gal.goal_id = ?
         ORDER BY gal.timestamp DESC
         LIMIT ? OFFSET ?`,
        [goalId, Number(limit), Number(offset)]
    );
    return rows;
};

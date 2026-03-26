import {
    createPermissionRequest,
    getPermissionRequests,
    updatePermissionStatus
} from "../models/permissionRequestModel.js";
import { logActivity } from "../models/activityLogModel.js";

async function applyPermissionController(req, res) {
    try {
        const { date, start_time, end_time, reason } = req.body;
        const userId = req.user.username;

        if (!date || !start_time || !end_time || !reason) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Calculate duration in minutes
        const start = new Date(`${date} ${start_time}`);
        const end = new Date(`${date} ${end_time}`);
        const duration = Math.round((end - start) / (1000 * 60));

        if (duration <= 0) {
            return res.status(400).json({ error: "Invalid duration" });
        }

        const requestId = await createPermissionRequest({
            user_id: userId,
            date,
            start_time,
            end_time,
            duration_minutes: duration,
            reason
        });

        await logActivity({
            username: userId,
            action: 'APPLY_PERMISSION',
            resourceType: 'PermissionRequest',
            resourceId: requestId,
            ipAddress: req.ip,
            details: { date, duration_minutes: duration }
        });

        res.status(201).json({
            message: "Permission request submitted successfully",
            request_id: requestId,
            duration_minutes: duration
        });
    } catch (error) {
        console.error("Error in applyPermissionController:", error);
        res.status(500).json({ error: error.message || "Failed to submit permission request" });
    }
}

async function getMyPermissionsController(req, res) {
    try {
        const userId = req.user.username;
        const permissions = await getPermissionRequests({ user_id: userId, ...req.query });
        res.status(200).json(permissions);
    } catch (error) {
        console.error("Error in getMyPermissionsController:", error);
        res.status(500).json({ error: "Failed to fetch your permission requests" });
    }
}

async function getAllPermissionsController(req, res) {
    try {
        const permissions = await getPermissionRequests(req.query);
        res.status(200).json(permissions);
    } catch (error) {
        console.error("Error in getAllPermissionsController:", error);
        res.status(500).json({ error: "Failed to fetch all permission requests" });
    }
}

async function actionPermissionController(req, res) {
    try {
        const { requestId } = req.params;
        const { status, comments } = req.body;
        const actionedBy = req.user.username;

        const success = await updatePermissionStatus(requestId, status, actionedBy, comments);
        
        if (!success) {
            return res.status(404).json({ error: "Permission request not found" });
        }

        await logActivity({
            username: actionedBy,
            action: `PERMISSION_${status.toUpperCase()}`,
            resourceType: 'PermissionRequest',
            resourceId: requestId,
            ipAddress: req.ip,
            details: { status, comments }
        });

        res.status(200).json({ message: `Permission request ${status} successfully` });
    } catch (error) {
        console.error("Error in actionPermissionController:", error);
        res.status(500).json({ error: "Failed to update permission status" });
    }
}

export {
    applyPermissionController,
    getMyPermissionsController,
    getAllPermissionsController,
    actionPermissionController
};

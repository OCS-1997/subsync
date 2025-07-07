// Controller for admin-only activity log viewing
import { getActivityLogs } from "../models/activityLogModel.js";

// Admin-only: get activity logs
export const getLogs = async (req, res) => {
    if (!req.user || !req.user.role || req.user.role.toLowerCase() !== "admin") {
        return res.status(403).json({ error: "Access denied. Admins only." });
    }
    try {
        const { username, action, limit, offset } = req.query;
        const logs = await getActivityLogs({ username, action, limit, offset });
        res.json({ logs });
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        res.status(500).json({ error: "Failed to fetch activity logs." });
    }
}; 
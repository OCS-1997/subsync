// Controller for admin-only activity log viewing
import { getActivityLogs, getActivityLogsCount } from "../models/activityLogModel.js";

// Admin-only: get activity logs with pagination
export const getLogs = async (req, res) => {
    if (!req.user || !req.user.role || req.user.role.toLowerCase() !== "admin") {
        return res.status(403).json({ error: "Access denied. Admins only." });
    }
    try {
        const { 
            username, 
            action, 
            resourceType, 
            search,
            dateFrom,
            dateTo, 
            page = 1, 
            limit = 20 
        } = req.query;
        
        const offset = (page - 1) * limit;
        const filters = { username, action, resourceType, search, dateFrom, dateTo };
        
        const [logs, total] = await Promise.all([
            getActivityLogs({ ...filters, limit, offset }),
            getActivityLogsCount(filters)
        ]);
        
        const totalPages = Math.ceil(total / limit);
        
        res.json({ 
            logs,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalRecords: total,
                limit: parseInt(limit),
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        });
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        res.status(500).json({ error: "Failed to fetch activity logs." });
    }
};

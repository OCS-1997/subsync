// Controller for permission-gated activity log viewing
import { getActivityLogs, getActivityLogsCount } from "../models/activityLogModel.js";
import { PERMISSIONS } from "../constants/permissions.js";

// Activity log listing
export const getLogs = async (req, res) => {
    if (!req.user || !req.user.permissions?.includes(PERMISSIONS.ACTIVITY_LOGS_VIEW)) {
        return res.status(403).json({ error: "Access denied. Missing permission." });
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

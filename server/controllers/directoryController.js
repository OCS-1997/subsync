import { searchDirectory, getDirectoryEntryByPhone } from "../models/directoryModel.js";
import { syncDirectory } from "../services/directoryService.js";
import { logActivity } from "../models/activityLogModel.js";

/**
 * GET /api/directory
 * Search the phone directory
 */
export async function getDirectoryController(req, res, next) {
    try {
        const { search = "", page = 1, limit = 20, sort, order } = req.query;
        const result = await searchDirectory({ 
            search, 
            page: parseInt(page), 
            limit: parseInt(limit),
            sort,
            order
        });
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/directory/lookup
 * Lookup a single phone number in the directory
 */
export async function lookupNumberController(req, res, next) {
    try {
        const { phone } = req.query;
        if (!phone) {
            return res.status(400).json({ success: false, error: "Phone number is required" });
        }
        const entry = await getDirectoryEntryByPhone(phone);
        res.json({ success: true, data: entry });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/directory/sync
 * Manually trigger a directory sync from source tables
 */
export async function syncDirectoryController(req, res, next) {
    try {
        const result = await syncDirectory();
        
        // Log activity
        if (req.user && req.user.username) {
            await logActivity({ 
                username: req.user.username, 
                action: 'SYNC_DIRECTORY', 
                resourceType: 'Directory', 
                ipAddress: req.ip, 
                details: { timestamp: new Date() } 
            });
        }
        
        res.json({ success: true, ...result });
    } catch (error) {
        console.error("Directory sync error:", error);
        res.status(500).json({ success: false, error: "Failed to synchronize directory" });
    }
}

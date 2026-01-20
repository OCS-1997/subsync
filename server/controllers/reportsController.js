import { getDetailedReports, getEntriesForExport } from "../models/reportsModel.js";

/**
 * Controller to get detailed time tracking reports
 */
async function getDetailedReportsController(req, res) {
    try {
        const userId = req.user.username;
        const hasTeamView = req.user.permissions?.includes('time-tracking.view-team') || 
                            req.user.permissions?.includes('time-tracking.manage');

        const {
            user_id,
            start_date,
            end_date,
            team_id
        } = req.query;

        // If user doesn't have team view permission, force userId to their own
        const filterUserId = hasTeamView ? user_id : userId;

        const reports = await getDetailedReports({
            userId: filterUserId,
            startDate: start_date,
            endDate: end_date,
            teamId: team_id
        });

        res.status(200).json(reports);
    } catch (error) {
        console.error("Error in getDetailedReportsController:", error);
        res.status(500).json({ error: error.message || "Failed to fetch detailed reports" });
    }
}

/**
 * Controller to export time entries
 */
async function exportEntriesController(req, res) {
    try {
        const userId = req.user.username;
        const hasTeamView = req.user.permissions?.includes('time-tracking.view-team') || 
                            req.user.permissions?.includes('time-tracking.manage');

        const {
            user_id,
            start_date,
            end_date,
            customer_id,
            project_id
        } = req.query;

        const filterUserId = hasTeamView ? user_id : userId;

        const entries = await getEntriesForExport({
            userId: filterUserId,
            startDate: start_date,
            endDate: end_date,
            customerId: customer_id,
            projectId: project_id
        });

        res.status(200).json({ entries });
    } catch (error) {
        console.error("Error in exportEntriesController:", error);
        res.status(500).json({ error: error.message || "Failed to export entries" });
    }
}

export {
    getDetailedReportsController,
    exportEntriesController
};

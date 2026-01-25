import {
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    getTimeEntries,
    getTimeEntryById,
    startTimer,
    stopTimer,
    getActiveTimer,
    getTimeEntriesSummary
} from "../models/timeTrackingModel.js";
import { logActivity } from '../models/activityLogModel.js';

/**
 * Controller to create a new time entry
 */
async function createTimeEntryController(req, res) {
    try {
        const userId = req.user.username;
        const entryData = {
            ...req.body,
            user_id: userId
        };

        // Validate required fields
        if (!entryData.start_time || !entryData.activity_type_id || !entryData.title) {
            return res.status(400).json({
                error: "start_time, activity_type_id, and title are required"
            });
        }

        const entryId = await createTimeEntry(entryData);

        await logActivity({
            username: req.user.username,
            action: 'CREATE_TIME_ENTRY',
            resourceType: 'TimeEntry',
            resourceId: entryId,
            ipAddress: req.ip,
            details: { title: entryData.title, duration: entryData.duration_minutes, project_id: entryData.project_id }
        });

        res.status(201).json({
            message: "Time entry created successfully",
            entry_id: entryId
        });
    } catch (error) {
        console.error("Error in createTimeEntryController:", error);
        res.status(500).json({ error: error.message || "Failed to create time entry" });
    }
}

/**
 * Controller to update a time entry
 */
async function updateTimeEntryController(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.username;

        // Verify the entry belongs to the user (unless admin)
        const entry = await getTimeEntryById(id);
        if (!entry) {
            return res.status(404).json({ error: "Time entry not found" });
        }

        if (entry.user_id !== userId && !req.user.permissions?.includes('time-tracking.manage')) {
            return res.status(403).json({ error: "You don't have permission to update this entry" });
        }

        await updateTimeEntry(id, req.body);

        await logActivity({
            username: req.user.username,
            action: 'UPDATE_TIME_ENTRY',
            resourceType: 'TimeEntry',
            resourceId: id,
            ipAddress: req.ip,
            details: { title: req.body.title || entry.title, duration: req.body.duration_minutes }
        });

        res.status(200).json({
            message: "Time entry updated successfully"
        });
    } catch (error) {
        console.error("Error in updateTimeEntryController:", error);
        res.status(500).json({ error: error.message || "Failed to update time entry" });
    }
}

/**
 * Controller to delete a time entry
 */
async function deleteTimeEntryController(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.username;

        // Verify the entry belongs to the user (unless admin)
        const entry = await getTimeEntryById(id);
        if (!entry) {
            return res.status(404).json({ error: "Time entry not found" });
        }

        if (entry.user_id !== userId && !req.user.permissions?.includes('time-tracking.manage')) {
            return res.status(403).json({ error: "You don't have permission to delete this entry" });
        }

        await deleteTimeEntry(id);

        await logActivity({
            username: req.user.username,
            action: 'DELETE_TIME_ENTRY',
            resourceType: 'TimeEntry',
            resourceId: id,
            ipAddress: req.ip,
            details: { title: entry.title }
        });

        res.status(200).json({
            message: "Time entry deleted successfully"
        });
    } catch (error) {
        console.error("Error in deleteTimeEntryController:", error);
        res.status(500).json({ error: error.message || "Failed to delete time entry" });
    }
}

/**
 * Controller to get time entries with filters
 */
async function getTimeEntriesController(req, res) {
    try {
        const userId = req.user.username;
        const hasTeamView = req.user.permissions?.includes('time-tracking.view-team') || 
                            req.user.permissions?.includes('time-tracking.manage');

        const {
            user_id,
            start_date,
            end_date,
            customer_id,
            project_id,
            activity_type_id,
            is_billable,
            page,
            limit,
            sort_by,
            sort_order
        } = req.query;

        // If user doesn't have team view permission, force userId to their own
        const filterUserId = hasTeamView ? user_id : userId;

        const result = await getTimeEntries({
            userId: filterUserId,
            startDate: start_date,
            endDate: end_date,
            customerId: customer_id,
            projectId: project_id,
            activityTypeId: activity_type_id,
            isBillable: is_billable,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 50,
            sortBy: sort_by,
            sortOrder: sort_order
        });

        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getTimeEntriesController:", error);
        res.status(500).json({ error: error.message || "Failed to fetch time entries" });
    }
}

/**
 * Controller to get a single time entry
 */
async function getTimeEntryByIdController(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.username;
        const hasTeamView = req.user.permissions?.includes('time-tracking.view-team') || 
                            req.user.permissions?.includes('time-tracking.manage');

        const entry = await getTimeEntryById(id);

        if (!entry) {
            return res.status(404).json({ error: "Time entry not found" });
        }

        // Check if user has permission to view this entry
        if (entry.user_id !== userId && !hasTeamView) {
            return res.status(403).json({ error: "You don't have permission to view this entry" });
        }

        res.status(200).json(entry);
    } catch (error) {
        console.error("Error in getTimeEntryByIdController:", error);
        res.status(500).json({ error: error.message || "Failed to fetch time entry" });
    }
}

/**
 * Controller to start a timer
 */
async function startTimerController(req, res) {
    try {
        const userId = req.user.username;
        const timerData = {
            ...req.body,
            user_id: userId
        };

        // Validate required fields
        if (!timerData.activity_type_id || !timerData.title) {
            return res.status(400).json({
                error: "activity_type_id and title are required"
            });
        }

        const entryId = await startTimer(userId, timerData);

        await logActivity({
            username: req.user.username,
            action: 'START_TIMER',
            resourceType: 'TimeEntry',
            resourceId: entryId,
            ipAddress: req.ip,
            details: { title: timerData.title, project_id: timerData.project_id }
        });

        res.status(201).json({
            message: "Timer started successfully",
            entry_id: entryId
        });
    } catch (error) {
        console.error("Error in startTimerController:", error);
        res.status(500).json({ error: error.message || "Failed to start timer" });
    }
}

/**
 * Controller to stop a timer
 */
async function stopTimerController(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.username;

        // Verify the timer belongs to the user
        const entry = await getTimeEntryById(id);
        if (!entry) {
            return res.status(404).json({ error: "Timer not found" });
        }

        if (entry.user_id !== userId) {
            return res.status(403).json({ error: "You don't have permission to stop this timer" });
        }

        const result = await stopTimer(id);

        await logActivity({
            username: req.user.username,
            action: 'STOP_TIMER',
            resourceType: 'TimeEntry',
            resourceId: id,
            ipAddress: req.ip,
            details: { title: entry.title, duration: result.duration_minutes }
        });

        res.status(200).json({
            message: "Timer stopped successfully",
            ...result
        });
    } catch (error) {
        console.error("Error in stopTimerController:", error);
        res.status(500).json({ error: error.message || "Failed to stop timer" });
    }
}

/**
 * Controller to get active timer for the current user
 */
async function getActiveTimerController(req, res) {
    try {
        const userId = req.user.username;

        const timer = await getActiveTimer(userId);

        if (!timer) {
            return res.status(200).json({ active_timer: null });
        }

        res.status(200).json({ active_timer: timer });
    } catch (error) {
        console.error("Error in getActiveTimerController:", error);
        res.status(500).json({ error: error.message || "Failed to fetch active timer" });
    }
}

/**
 * Controller to get time tracking reports
 */
async function getTimeReportsController(req, res) {
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

        const summary = await getTimeEntriesSummary({
            userId: filterUserId,
            startDate: start_date,
            endDate: end_date,
            teamId: team_id
        });

        res.status(200).json(summary);
    } catch (error) {
        console.error("Error in getTimeReportsController:", error);
        res.status(500).json({ error: error.message || "Failed to fetch time reports" });
    }
}

export {
    createTimeEntryController,
    updateTimeEntryController,
    deleteTimeEntryController,
    getTimeEntriesController,
    getTimeEntryByIdController,
    startTimerController,
    stopTimerController,
    getActiveTimerController,
    getTimeReportsController
};

import {
    createGoal,
    getGoals,
    getGoalsCount,
    getGoalById,
    updateGoal,
    updateGoalProgress,
    updateGoalStatus,
    deleteGoal,
    addGoalAttachment,
    deleteGoalAttachment,
    addGoalComment,
    getGoalsDashboardStats
} from "../models/goalModel.js";
import { getGoalActivityLogs } from "../models/goalActivityModel.js";
import { generateGoalsExcelReport } from "../services/excelExportService.js";
import { triggerGoalNotification } from "../services/goalNotificationService.js";

export const getGoalsList = async (req, res) => {
    try {
        const {
            quarter, financial_year, category_id, business_impact_id,
            owner, status_id, priority, created_by, dateFrom, dateTo,
            search, sortBy, sortOrder, limit = 20, offset = 0
        } = req.query;

        const goals = await getGoals({
            quarter, financial_year, category_id, business_impact_id,
            owner, status_id, priority, created_by, dateFrom, dateTo,
            search, sortBy, sortOrder, limit, offset
        });

        const total = await getGoalsCount({
            quarter, financial_year, category_id, business_impact_id,
            owner, status_id, priority, created_by, dateFrom, dateTo, search
        });

        return res.status(200).json({
            data: goals,
            total,
            limit: Number(limit),
            offset: Number(offset)
        });
    } catch (error) {
        console.error("Error fetching goals list:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch goals" });
    }
};

export const getSingleGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const goal = await getGoalById(id);
        if (!goal) {
            return res.status(404).json({ error: "Goal not found" });
        }
        return res.status(200).json(goal);
    } catch (error) {
        console.error("Error fetching single goal:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch goal" });
    }
};

export const postGoal = async (req, res) => {
    try {
        const username = req.user.username;
        const ipAddress = req.user.ip;
        const goal_id = await createGoal(req.body, username, ipAddress);

        // Future Ready Notification Trigger
        triggerGoalNotification('GOAL_ASSIGNED', {
            goal_id,
            title: req.body.title,
            owners: req.body.owners,
            created_by: username
        });

        return res.status(201).json({ success: true, goal_id, message: "Goal created successfully" });
    } catch (error) {
        console.error("Error creating goal:", error);
        return res.status(400).json({ error: error.message || "Failed to create goal" });
    }
};

export const putGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const username = req.user.username;
        const ipAddress = req.user.ip;

        await updateGoal(id, req.body, username, ipAddress);

        return res.status(200).json({ success: true, message: "Goal updated successfully" });
    } catch (error) {
        console.error("Error updating goal:", error);
        return res.status(400).json({ error: error.message || "Failed to update goal" });
    }
};

export const patchProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { progress } = req.body;
        const username = req.user.username;
        const ipAddress = req.user.ip;

        if (progress === undefined) {
            return res.status(400).json({ error: "Progress value is required" });
        }

        const result = await updateGoalProgress(id, progress, username, ipAddress);

        // Notification trigger
        triggerGoalNotification('PROGRESS_UPDATED', {
            goal_id: id,
            progress: result.progress,
            updated_by: username
        });

        if (result.progress === 100) {
            triggerGoalNotification('GOAL_COMPLETED', {
                goal_id: id,
                completed_by: username
            });
        }

        return res.status(200).json({ success: true, ...result, message: "Progress updated successfully" });
    } catch (error) {
        console.error("Error updating goal progress:", error);
        return res.status(400).json({ error: error.message || "Failed to update goal progress" });
    }
};

export const patchStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status_id } = req.body;
        const username = req.user.username;
        const ipAddress = req.user.ip;

        if (!status_id) {
            return res.status(400).json({ error: "status_id is required" });
        }

        const result = await updateGoalStatus(id, status_id, username, ipAddress);

        triggerGoalNotification('STATUS_CHANGED', {
            goal_id: id,
            status_id,
            updated_by: username
        });

        return res.status(200).json({ success: true, ...result, message: "Status updated successfully" });
    } catch (error) {
        console.error("Error updating goal status:", error);
        return res.status(400).json({ error: error.message || "Failed to update goal status" });
    }
};

export const removeGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const username = req.user.username;
        const ipAddress = req.user.ip;

        await deleteGoal(id, username, ipAddress);
        return res.status(200).json({ success: true, message: "Goal deleted successfully" });
    } catch (error) {
        console.error("Error deleting goal:", error);
        return res.status(400).json({ error: error.message || "Failed to delete goal" });
    }
};

export const getDashboardStats = async (req, res) => {
    try {
        const { financial_year, quarter } = req.query;
        const stats = await getGoalsDashboardStats({ financial_year, quarter });
        return res.status(200).json(stats);
    } catch (error) {
        console.error("Error fetching goals dashboard stats:", error);
        return res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
};

export const getActivityLogs = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const logs = await getGoalActivityLogs(id, { limit, offset });
        return res.status(200).json(logs);
    } catch (error) {
        console.error("Error fetching goal activity logs:", error);
        return res.status(500).json({ error: "Failed to fetch activity logs" });
    }
};

export const uploadAttachment = async (req, res) => {
    try {
        const { id } = req.params;
        const username = req.user.username;
        const ipAddress = req.user.ip;

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const attachment_id = await addGoalAttachment(id, req.file, username, ipAddress);
        return res.status(201).json({ success: true, attachment_id, message: "Attachment uploaded successfully" });
    } catch (error) {
        console.error("Error uploading goal attachment:", error);
        return res.status(400).json({ error: error.message || "Failed to upload attachment" });
    }
};

export const removeAttachment = async (req, res) => {
    try {
        const { id, attachmentId } = req.params;
        const username = req.user.username;
        const ipAddress = req.user.ip;

        await deleteGoalAttachment(id, attachmentId, username, ipAddress);
        return res.status(200).json({ success: true, message: "Attachment deleted successfully" });
    } catch (error) {
        console.error("Error deleting goal attachment:", error);
        return res.status(400).json({ error: error.message || "Failed to delete attachment" });
    }
};

export const postComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;
        const username = req.user.username;

        const comment_id = await addGoalComment(id, comment, username);
        return res.status(201).json({ success: true, comment_id, message: "Comment added successfully" });
    } catch (error) {
        console.error("Error adding goal comment:", error);
        return res.status(400).json({ error: error.message || "Failed to add comment" });
    }
};

export const exportGoalsReport = async (req, res) => {
    try {
        const {
            quarter, financial_year, category_id, business_impact_id,
            owner, status_id, priority, created_by, search
        } = req.query;

        // Fetch all matching goals for export without pagination limit
        const goals = await getGoals({
            quarter, financial_year, category_id, business_impact_id,
            owner, status_id, priority, created_by, search,
            limit: 5000, offset: 0
        });

        const buffer = await generateGoalsExcelReport(goals);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Goals_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
        return res.send(buffer);
    } catch (error) {
        console.error("Error exporting goals report:", error);
        return res.status(500).json({ error: "Failed to export goals report" });
    }
};

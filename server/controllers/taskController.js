import * as taskService from '../services/taskService.js';
import { sendDailyTaskDigestEmails } from '../services/taskDigestService.js';

export const getTasksController = async (req, res, next) => {
    try {
        const filters = {
            status: req.query.status,
            priority: req.query.priority,
            assignedTo: req.query.assignedTo,
            createdBy: req.query.createdBy,
            dueDate: req.query.dueDate,
            overdue: req.query.overdue,
            category: req.query.category,
            search: req.query.search,
            clientDate: req.query.clientDate,
            tab: req.query.tab,
            page: req.query.page || 1,
            limit: req.query.limit || 50
        };

        const result = await taskService.getTasks(req.user, filters);
        return res.status(200).json({
            success: true,
            data: result.tasks,
            pagination: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getTaskStatsController = async (req, res, next) => {
    try {
        const stats = await taskService.getTaskStats(req.user);
        return res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

export const getTaskAnalyticsController = async (req, res, next) => {
    try {
        const filters = {
            dateRange: req.query.dateRange,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            status: req.query.status,
            priority: req.query.priority,
            category: req.query.category,
            assignedTo: req.query.assignedTo,
            search: req.query.search
        };
        const analytics = await taskService.getTaskAnalytics(req.user, filters);
        return res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error) {
        next(error);
    }
};

export const getManageableUsersController = async (req, res, next) => {
    try {
        const users = await taskService.getManageableUsers(req.user);
        return res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        next(error);
    }
};

export const getTaskByIdController = async (req, res, next) => {
    try {
        const taskId = req.params.id;
        const task = await taskService.getTaskById(req.user, taskId);
        if (!task) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } });
        }
        return res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

export const createTaskController = async (req, res, next) => {
    try {
        const task = await taskService.createTask(req.user, req.body);
        return res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: task
        });
    } catch (error) {
        next(error);
    }
};

export const updateTaskController = async (req, res, next) => {
    try {
        const taskId = req.params.id;
        const task = await taskService.updateTask(req.user, taskId, req.body);
        return res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            data: task
        });
    } catch (error) {
        next(error);
    }
};

export const changeTaskStatusController = async (req, res, next) => {
    try {
        const taskId = req.params.id;
        const { status } = req.body;
        const task = await taskService.changeTaskStatus(req.user, taskId, status);
        return res.status(200).json({
            success: true,
            message: `Task status updated to ${status}`,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

export const reassignTaskController = async (req, res, next) => {
    try {
        const taskId = req.params.id;
        const { assignedTo } = req.body;
        const task = await taskService.reassignTask(req.user, taskId, assignedTo);
        return res.status(200).json({
            success: true,
            message: 'Task reassigned successfully',
            data: task
        });
    } catch (error) {
        next(error);
    }
};

export const deleteTaskController = async (req, res, next) => {
    try {
        const taskId = req.params.id;
        await taskService.deleteTask(req.user, taskId);
        return res.status(200).json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

export const addChecklistController = async (req, res, next) => {
    try {
        const taskId = req.params.id;
        const { title } = req.body;
        const task = await taskService.addChecklistItem(req.user, taskId, title);
        return res.status(201).json({
            success: true,
            message: 'Checklist item added',
            data: task
        });
    } catch (error) {
        next(error);
    }
};

export const updateChecklistController = async (req, res, next) => {
    try {
        const { id: taskId, itemId } = req.params;
        const task = await taskService.updateChecklistItem(req.user, taskId, itemId, req.body);
        return res.status(200).json({
            success: true,
            message: 'Checklist item updated',
            data: task
        });
    } catch (error) {
        next(error);
    }
};

export const deleteChecklistController = async (req, res, next) => {
    try {
        const { id: taskId, itemId } = req.params;
        const task = await taskService.deleteChecklistItem(req.user, taskId, itemId);
        return res.status(200).json({
            success: true,
            message: 'Checklist item deleted',
            data: task
        });
    } catch (error) {
        next(error);
    }
};

export const addCommentController = async (req, res, next) => {
    try {
        const taskId = req.params.id;
        const { content } = req.body;
        const task = await taskService.addComment(req.user, taskId, content);
        return res.status(201).json({
            success: true,
            message: 'Comment added',
            data: task
        });
    } catch (error) {
        next(error);
    }
};

export const uploadTaskAttachmentController = async (req, res, next) => {
    try {
        const taskId = req.params.id;
        const task = await taskService.addAttachment(req.user, taskId, req.file);
        return res.status(201).json({
            success: true,
            message: 'Attachment uploaded successfully',
            data: task
        });
    } catch (error) {
        next(error);
    }
};

export const downloadTaskAttachmentController = async (req, res, next) => {
    try {
        const { id: taskId, attachmentId } = req.params;
        const attachment = await taskService.getAttachmentFile(req.user, taskId, attachmentId);
        if (!attachment) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Attachment not found' } });
        }
        return res.download(attachment.file_path, attachment.file_name);
    } catch (error) {
        next(error);
    }
};

export const deleteTaskAttachmentController = async (req, res, next) => {
    try {
        const { id: taskId, attachmentId } = req.params;
        const task = await taskService.deleteAttachment(req.user, taskId, attachmentId);
        return res.status(200).json({
            success: true,
            message: 'Attachment deleted successfully',
            data: task
        });
    } catch (error) {
        next(error);
    }
};

export const getTaskCategoriesController = async (req, res, next) => {
    try {
        const categories = await taskService.getTaskCategories(req.user);
        return res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
};

export const triggerDailyTaskDigestController = async (req, res, next) => {
    try {
        const result = await sendDailyTaskDigestEmails();
        return res.status(200).json({
            success: true,
            message: 'Daily task digest triggered successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};


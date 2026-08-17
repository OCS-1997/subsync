import appDB from '../db/subsyncDB.js';
import { logActivity } from '../models/activityLogModel.js';
import { sendEmail } from './emailService.js';
import { getUserByUsername } from '../models/userModel.js';
import fs from 'fs';
import path from 'path';

/**
 * Check if the acting user can manage/assign tasks to the target user.
 * Admins & users with tasks.manage_all can manage anyone.
 * Users can always manage themselves.
 * Team Leads can manage users assigned to teams where they are the team lead.
 */
export async function canManageUser(actor, targetUsername) {
    if (!actor || !targetUsername) return false;
    
    // Self management is allowed
    if (actor.username === targetUsername) return true;
    
    // Admin or manage_all bypass
    if (actor.roleKey === 'admin' || actor.permissions?.includes('tasks.manage_all')) return true;
    
    // Manager check: Check if target user belongs to a team led by actor
    const [teamRows] = await appDB.query(
        `SELECT 1 
         FROM user_teams ut
         JOIN teams t ON ut.team_id = t.id
         WHERE ut.user_id = ? AND t.team_lead_username = ? AND t.is_active = 1
         LIMIT 1`,
        [targetUsername, actor.username]
    );
    
    return teamRows.length > 0;
}

/**
 * Get list of usernames that the actor is authorized to manage/assign tasks to.
 */
export async function getManageableUsers(actor) {
    if (!actor) return [];
    
    // Admin or manage_all gets all active users
    if (actor.roleKey === 'admin' || actor.permissions?.includes('tasks.manage_all')) {
        const [users] = await appDB.query(
            `SELECT u.username, u.name, u.email, r.name AS roleName, r.role_key AS roleKey
             FROM users u
             LEFT JOIN roles r ON u.role_id = r.id
             WHERE u.is_active = 1
             ORDER BY u.name ASC`
        );
        return users;
    }
    
    // Team leads get team members + themselves
    const [managedUsers] = await appDB.query(
        `SELECT DISTINCT u.username, u.name, u.email, r.name AS roleName, r.role_key AS roleKey
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         LEFT JOIN user_teams ut ON u.username = ut.user_id
         LEFT JOIN teams t ON ut.team_id = t.id
         WHERE u.is_active = 1 
           AND (u.username = ? OR (t.team_lead_username = ? AND t.is_active = 1))
         ORDER BY u.name ASC`,
        [actor.username, actor.username]
    );
    
    return managedUsers;
}

/**
 * Helper to check task access rights for view/update.
 */
export async function checkTaskAccess(actor, task) {
    if (!actor || !task) return false;
    if (actor.roleKey === 'admin' || actor.permissions?.includes('tasks.view_all') || actor.permissions?.includes('tasks.manage_all')) {
        return true;
    }
    if (task.created_by === actor.username || task.assigned_to === actor.username) {
        return true;
    }
    // Check if task assignee or creator is in actor's managed scope
    const isAssigneeManaged = await canManageUser(actor, task.assigned_to);
    if (isAssigneeManaged) return true;

    const isCreatorManaged = await canManageUser(actor, task.created_by);
    return isCreatorManaged;
}

/**
 * Log task activity in task_activities table.
 */
export async function logTaskActivity(taskId, actorId, action, oldValue = null, newValue = null, metadata = null) {
    try {
        await appDB.query(
            `INSERT INTO task_activities (task_id, actor_id, action, old_value, new_value, metadata)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                taskId,
                actorId,
                action,
                oldValue ? (typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue)) : null,
                newValue ? (typeof newValue === 'string' ? newValue : JSON.stringify(newValue)) : null,
                metadata ? JSON.stringify(metadata) : null
            ]
        );
    } catch (err) {
        console.error('Error logging task activity:', err);
    }
}

/**
 * Send email notification for task assignment/reassignment.
 */
export async function notifyTaskAssignment(task, assigneeUsername, actorName) {
    try {
        const assignee = await getUserByUsername(assigneeUsername);
        if (!assignee || !assignee.email) return;

        const subject = `[OCS365 Task] Assigned: ${task.title}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #2563eb; margin-top: 0;">Task Assigned</h2>
                <p>Hello <strong>${assignee.name || assigneeUsername}</strong>,</p>
                <p><strong>${actorName}</strong> has assigned a task to you in OCS365:</p>
                <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #2563eb; margin: 15px 0;">
                    <h3 style="margin: 0 0 8px 0; color: #1e293b;">${task.title}</h3>
                    <p style="margin: 0 0 5px 0; color: #64748b;">${task.description || 'No description provided.'}</p>
                    <p style="margin: 5px 0 0 0;">
                        <span style="display: inline-block; padding: 2px 8px; font-size: 12px; font-weight: bold; background: #e0f2fe; color: #0369a1; border-radius: 4px; margin-right: 8px;">Priority: ${task.priority}</span>
                        ${task.due_date ? `<span style="font-size: 13px; color: #e11d48;">Due: ${new Date(task.due_date).toLocaleDateString()}</span>` : ''}
                    </p>
                </div>
                <p style="color: #64748b; font-size: 13px;">Log in to OCS365 to view and manage your assigned tasks.</p>
            </div>
        `;

        await sendEmail({
            to: assignee.email,
            subject,
            html
        });
    } catch (err) {
        console.error('Error sending task notification email:', err);
    }
}

/**
 * Fetch tasks with filters, authorization scoping, search, and pagination.
 */
export async function getTasks(actor, filters = {}) {
    const {
        status,
        priority,
        assignedTo,
        createdBy,
        dueDate,
        overdue,
        category,
        search,
        clientDate,
        tab = 'all', // 'my_tasks' | 'assigned_by_me' | 'management' | 'all'
        page = 1,
        limit = 50
    } = filters;

    const offset = (Number(page) - 1) * Number(limit);
    const conditions = [];
    const params = [];

    // Authorization scoping
    const isGlobalViewer = actor.roleKey === 'admin' || actor.permissions?.includes('tasks.view_all') || actor.permissions?.includes('tasks.manage_all');
    
    if (tab === 'my_tasks') {
        conditions.push(`t.assigned_to = ?`);
        params.push(actor.username);
    } else if (tab === 'assigned_by_me') {
        conditions.push(`t.created_by = ?`);
        params.push(actor.username);
    } else if (!isGlobalViewer) {
        // Normal user/manager can only see tasks assigned to self, created by self, or belonging to manageable team members
        const manageableUsers = await getManageableUsers(actor);
        const manageableUsernames = manageableUsers.map(u => u.username);
        
        if (manageableUsernames.length > 0) {
            conditions.push(`(t.assigned_to IN (?) OR t.created_by = ?)`);
            params.push(manageableUsernames, actor.username);
        } else {
            conditions.push(`(t.assigned_to = ? OR t.created_by = ?)`);
            params.push(actor.username, actor.username);
        }
    }

    // Filter by specific status
    if (status && status !== 'ALL') {
        conditions.push(`t.status = ?`);
        params.push(status);
    }

    // Filter by priority
    if (priority && priority !== 'ALL') {
        conditions.push(`t.priority = ?`);
        params.push(priority);
    }

    // Filter by assignedTo
    if (assignedTo && assignedTo !== 'ALL') {
        conditions.push(`t.assigned_to = ?`);
        params.push(assignedTo);
    }

    // Filter by createdBy
    if (createdBy && createdBy !== 'ALL') {
        conditions.push(`t.created_by = ?`);
        params.push(createdBy);
    }

    // Filter by category
    if (category && category !== 'ALL') {
        conditions.push(`t.category = ?`);
        params.push(category);
    }

    // Filter by due date
    if (dueDate) {
        if (dueDate === 'today') {
            if (clientDate) {
                conditions.push(`(DATE(t.due_date) = CURDATE() OR DATE(t.due_date) = DATE(?))`);
                params.push(clientDate);
            } else {
                conditions.push(`DATE(t.due_date) = CURDATE()`);
            }
        } else if (dueDate === 'upcoming') {
            if (clientDate) {
                conditions.push(`DATE(t.due_date) > DATE(?) AND t.status != 'COMPLETED' AND t.status != 'CANCELLED'`);
                params.push(clientDate);
            } else {
                conditions.push(`DATE(t.due_date) > CURDATE() AND t.status != 'COMPLETED' AND t.status != 'CANCELLED'`);
            }
        } else {
            conditions.push(`DATE(t.due_date) = DATE(?)`);
            params.push(dueDate);
        }
    }

    // Filter overdue
    if (overdue === 'true' || overdue === true) {
        conditions.push(`t.due_date IS NOT NULL AND DATE(t.due_date) < CURDATE() AND t.status != 'COMPLETED' AND t.status != 'CANCELLED'`);
    }

    // Free text search
    if (search) {
        conditions.push(`(t.title LIKE ? OR t.description LIKE ? OR t.category LIKE ?)`);
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const [countRows] = await appDB.query(
        `SELECT COUNT(*) as total FROM tasks t ${whereClause}`,
        params
    );
    const total = countRows[0]?.total || 0;

    // Data query with creator/assignee names & checklist count
    const [tasks] = await appDB.query(
        `SELECT 
            t.*,
            u_assignee.name AS assignee_name,
            u_assignee.email AS assignee_email,
            u_creator.name AS creator_name,
            u_creator.email AS creator_email,
            (SELECT COUNT(*) FROM task_checklists tc WHERE tc.task_id = t.id) AS checklist_total,
            (SELECT COUNT(*) FROM task_checklists tc WHERE tc.task_id = t.id AND tc.completed = 1) AS checklist_completed,
            (SELECT COUNT(*) FROM task_comments tcomm WHERE tcomm.task_id = t.id) AS comment_count,
            (SELECT COUNT(*) FROM task_attachments tatt WHERE tatt.task_id = t.id) AS attachment_count
         FROM tasks t
         LEFT JOIN users u_assignee ON t.assigned_to = u_assignee.username
         LEFT JOIN users u_creator ON t.created_by = u_creator.username
         ${whereClause}
         ORDER BY 
           CASE WHEN t.status = 'COMPLETED' OR t.status = 'CANCELLED' THEN 1 ELSE 0 END ASC,
           t.due_date ASC,
           t.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, Number(limit), Number(offset)]
    );

    return {
        tasks,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
    };
}

/**
 * Fetch task KPI summary stats for dashboard.
 */
export async function getTaskStats(actor) {
    const isGlobalViewer = actor.roleKey === 'admin' || actor.permissions?.includes('tasks.view_all') || actor.permissions?.includes('tasks.manage_all');
    let scopeWhere = '';
    const params = [];

    if (!isGlobalViewer) {
        const manageableUsers = await getManageableUsers(actor);
        const manageableUsernames = manageableUsers.map(u => u.username);
        
        if (manageableUsernames.length > 0) {
            scopeWhere = `WHERE (t.assigned_to IN (?) OR t.created_by = ?)`;
            params.push(manageableUsernames, actor.username);
        } else {
            scopeWhere = `WHERE (t.assigned_to = ? OR t.created_by = ?)`;
            params.push(actor.username, actor.username);
        }
    }

    const [rows] = await appDB.query(
        `SELECT 
            COUNT(*) AS total_tasks,
            SUM(CASE WHEN status = 'TODO' THEN 1 ELSE 0 END) AS todo_count,
            SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress_count,
            SUM(CASE WHEN status = 'BLOCKED' THEN 1 ELSE 0 END) AS blocked_count,
            SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count,
            SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_count,
            SUM(CASE WHEN DATE(due_date) = CURDATE() AND status NOT IN ('COMPLETED', 'CANCELLED') THEN 1 ELSE 0 END) AS due_today_count,
            SUM(CASE WHEN assigned_to = ? AND DATE(due_date) = CURDATE() AND status NOT IN ('COMPLETED', 'CANCELLED') THEN 1 ELSE 0 END) AS my_due_today_count,
            SUM(CASE WHEN due_date IS NOT NULL AND DATE(due_date) < CURDATE() AND status NOT IN ('COMPLETED', 'CANCELLED') THEN 1 ELSE 0 END) AS overdue_count,
            SUM(CASE WHEN assigned_to = ? AND due_date IS NOT NULL AND DATE(due_date) < CURDATE() AND status NOT IN ('COMPLETED', 'CANCELLED') THEN 1 ELSE 0 END) AS my_overdue_count,
            SUM(CASE WHEN assigned_to = ? AND status NOT IN ('COMPLETED', 'CANCELLED') THEN 1 ELSE 0 END) AS my_open_tasks
         FROM tasks t
         ${scopeWhere}`,
        [...params, actor.username, actor.username, actor.username]
    );

    const [byAssigneeRows] = await appDB.query(
        `SELECT 
            t.assigned_to AS username,
            COALESCE(u.name, t.assigned_to) AS name,
            u.email AS email,
            COUNT(*) AS total,
            SUM(CASE WHEN t.status = 'TODO' THEN 1 ELSE 0 END) AS todo_count,
            SUM(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress_count,
            SUM(CASE WHEN t.status = 'BLOCKED' THEN 1 ELSE 0 END) AS blocked_count,
            SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count,
            SUM(CASE WHEN t.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_count
         FROM tasks t
         LEFT JOIN users u ON t.assigned_to = u.username
         ${scopeWhere}
         GROUP BY t.assigned_to, u.name, u.email
         ORDER BY total DESC`,
        params
    );

    const baseStats = rows[0] || {
        total_tasks: 0,
        todo_count: 0,
        in_progress_count: 0,
        blocked_count: 0,
        completed_count: 0,
        cancelled_count: 0,
        due_today_count: 0,
        overdue_count: 0,
        my_open_tasks: 0
    };

    return {
        ...baseStats,
        by_assignee: byAssigneeRows || []
    };
}

/**
 * Fetch a single task by ID along with checklists, comments, attachments, and activities.
 */
export async function getTaskById(actor, taskId) {
    const [rows] = await appDB.query(
        `SELECT 
            t.*,
            u_assignee.name AS assignee_name,
            u_assignee.email AS assignee_email,
            u_creator.name AS creator_name,
            u_creator.email AS creator_email
         FROM tasks t
         LEFT JOIN users u_assignee ON t.assigned_to = u_assignee.username
         LEFT JOIN users u_creator ON t.created_by = u_creator.username
         WHERE t.id = ?
         LIMIT 1`,
        [taskId]
    );

    if (!rows.length) return null;
    const task = rows[0];

    const hasAccess = await checkTaskAccess(actor, task);
    if (!hasAccess) {
        const error = new Error('Access denied to task');
        error.status = 403;
        throw error;
    }

    // Fetch Checklists
    const [checklists] = await appDB.query(
        `SELECT tc.*, u.name AS completed_by_name
         FROM task_checklists tc
         LEFT JOIN users u ON tc.completed_by = u.username
         WHERE tc.task_id = ?
         ORDER BY tc.position ASC, tc.created_at ASC`,
        [taskId]
    );

    // Fetch Comments
    const [comments] = await appDB.query(
        `SELECT tcomm.*, u.name AS author_name, u.email AS author_email
         FROM task_comments tcomm
         LEFT JOIN users u ON tcomm.author_id = u.username
         WHERE tcomm.task_id = ?
         ORDER BY tcomm.created_at ASC`,
        [taskId]
    );

    // Fetch Attachments
    const [attachments] = await appDB.query(
        `SELECT tatt.*, u.name AS uploaded_by_name
         FROM task_attachments tatt
         LEFT JOIN users u ON tatt.uploaded_by = u.username
         WHERE tatt.task_id = ?
         ORDER BY tatt.created_at DESC`,
        [taskId]
    );

    // Fetch Activities
    const [activities] = await appDB.query(
        `SELECT tact.*, u.name AS actor_name
         FROM task_activities tact
         LEFT JOIN users u ON tact.actor_id = u.username
         WHERE tact.task_id = ?
         ORDER BY tact.created_at DESC`,
        [taskId]
    );

    task.checklists = checklists;
    task.comments = comments;
    task.attachments = attachments;
    task.activities = activities;

    return task;
}

/**
 * Create a new task.
 */
export async function createTask(actor, data) {
    const { title, description, assignedTo, priority = 'MEDIUM', category = 'General', startDate, dueDate, checklist = [] } = data;

    if (!title || !title.trim()) {
        const error = new Error('Task title is required');
        error.status = 400;
        throw error;
    }

    const targetAssignee = assignedTo || actor.username;

    // Security check: If assigning to someone else, verify permissions and management scope
    if (targetAssignee !== actor.username) {
        if (!actor.permissions?.includes('tasks.create_for_others') && actor.roleKey !== 'admin') {
            const error = new Error('Forbidden: You do not have permission to create tasks for other users');
            error.status = 403;
            throw error;
        }

        const canManage = await canManageUser(actor, targetAssignee);
        if (!canManage) {
            const error = new Error(`Forbidden: Assignee '${targetAssignee}' is outside your management scope`);
            error.status = 403;
            throw error;
        }
    }

    // Validate dates
    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
        const error = new Error('Due date cannot be before start date');
        error.status = 400;
        throw error;
    }

    const [result] = await appDB.query(
        `INSERT INTO tasks (title, description, created_by, assigned_to, status, priority, category, start_date, due_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'TODO', ?, ?, ?, ?, NOW(), NOW())`,
        [
            title.trim(),
            description || null,
            actor.username,
            targetAssignee,
            priority,
            category || 'General',
            startDate || null,
            dueDate || null
        ]
    );

    const taskId = result.insertId;

    // Add initial checklist items if provided
    if (Array.isArray(checklist) && checklist.length > 0) {
        for (let i = 0; i < checklist.length; i++) {
            const item = checklist[i];
            const itemTitle = typeof item === 'string' ? item : item.title;
            if (itemTitle && itemTitle.trim()) {
                await appDB.query(
                    `INSERT INTO task_checklists (task_id, title, position, created_at, updated_at)
                     VALUES (?, ?, ?, NOW(), NOW())`,
                    [taskId, itemTitle.trim(), i]
                );
            }
        }
    }

    // Log Activity
    await logTaskActivity(taskId, actor.username, 'TASK_CREATED', null, { title, assignedTo: targetAssignee, priority });
    await logActivity({
        username: actor.username,
        action: 'TASK_CREATED',
        resourceType: 'Task',
        resourceId: taskId.toString(),
        details: { title, assignedTo: targetAssignee }
    });

    // Notify Assignee if assigned to someone else
    if (targetAssignee !== actor.username) {
        const newTask = await getTaskById(actor, taskId);
        notifyTaskAssignment(newTask, targetAssignee, actor.name || actor.username);
    }

    return getTaskById(actor, taskId);
}

/**
 * Update task fields.
 */
export async function updateTask(actor, taskId, updates) {
    const task = await getTaskById(actor, taskId);
    if (!task) {
        const error = new Error('Task not found');
        error.status = 404;
        throw error;
    }

    const effectiveStartDate = updates.startDate !== undefined ? updates.startDate : task.start_date;
    const effectiveDueDate = updates.dueDate !== undefined ? updates.dueDate : task.due_date;

    if (effectiveStartDate && effectiveDueDate && new Date(effectiveDueDate) < new Date(effectiveStartDate)) {
        const error = new Error('Due date cannot be before start date');
        error.status = 400;
        throw error;
    }

    const fields = [];
    const values = [];

    if (updates.title !== undefined && updates.title.trim()) {
        fields.push('title = ?');
        values.push(updates.title.trim());
        if (updates.title.trim() !== task.title) {
            logTaskActivity(taskId, actor.username, 'TITLE_CHANGED', task.title, updates.title.trim());
        }
    }

    if (updates.description !== undefined) {
        fields.push('description = ?');
        values.push(updates.description);
        if (updates.description !== task.description) {
            logTaskActivity(taskId, actor.username, 'DESCRIPTION_CHANGED', task.description, updates.description);
        }
    }

    if (updates.priority !== undefined && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(updates.priority)) {
        fields.push('priority = ?');
        values.push(updates.priority);
        if (updates.priority !== task.priority) {
            logTaskActivity(taskId, actor.username, 'PRIORITY_CHANGED', task.priority, updates.priority);
        }
    }

    if (updates.category !== undefined) {
        fields.push('category = ?');
        values.push(updates.category);
    }

    if (updates.startDate !== undefined) {
        fields.push('start_date = ?');
        values.push(updates.startDate || null);
    }

    if (updates.dueDate !== undefined) {
        fields.push('due_date = ?');
        values.push(updates.dueDate || null);
        if (updates.dueDate !== task.due_date) {
            logTaskActivity(taskId, actor.username, 'DUE_DATE_CHANGED', task.due_date, updates.dueDate);
        }
    }

    if (updates.assignedTo !== undefined && updates.assignedTo !== task.assigned_to) {
        if (!actor.permissions?.includes('tasks.assign') && actor.roleKey !== 'admin') {
            const error = new Error('Forbidden: You do not have permission to reassign tasks');
            error.status = 403;
            throw error;
        }

        const canManage = await canManageUser(actor, updates.assignedTo);
        if (!canManage) {
            const error = new Error(`Forbidden: Assignee '${updates.assignedTo}' is outside your management scope`);
            error.status = 403;
            throw error;
        }

        fields.push('assigned_to = ?');
        values.push(updates.assignedTo);
        logTaskActivity(taskId, actor.username, 'TASK_REASSIGNED', task.assigned_to, updates.assignedTo);

        // Notify new assignee
        notifyTaskAssignment(task, updates.assignedTo, actor.name || actor.username);
    }

    if (fields.length === 0) return task;

    fields.push('updated_at = NOW()');
    values.push(taskId);

    await appDB.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values);
    return getTaskById(actor, taskId);
}

/**
 * Change task status with validation on allowed status transitions.
 */
export async function changeTaskStatus(actor, taskId, newStatus) {
    const task = await getTaskById(actor, taskId);
    if (!task) {
        const error = new Error('Task not found');
        error.status = 404;
        throw error;
    }

    const validStatuses = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(newStatus)) {
        const error = new Error(`Invalid task status '${newStatus}'`);
        error.status = 400;
        throw error;
    }

    const currentStatus = task.status;

    // Check transition rules
    if (currentStatus === 'COMPLETED' && newStatus !== 'COMPLETED') {
        if (!actor.permissions?.includes('tasks.reopen') && actor.roleKey !== 'admin') {
            const error = new Error('Forbidden: You do not have permission to reopen completed tasks');
            error.status = 403;
            throw error;
        }
    }

    if (newStatus === 'CANCELLED') {
        if (!actor.permissions?.includes('tasks.cancel') && actor.roleKey !== 'admin' && task.created_by !== actor.username) {
            const error = new Error('Forbidden: You do not have permission to cancel this task');
            error.status = 403;
            throw error;
        }
    }

    let completedAt = task.completed_at;
    let completedBy = task.completed_by;

    if (newStatus === 'COMPLETED') {
        completedAt = new Date();
        completedBy = actor.username;
    } else if (currentStatus === 'COMPLETED') {
        completedAt = null;
        completedBy = null;
    }

    await appDB.query(
        `UPDATE tasks 
         SET status = ?, completed_at = ?, completed_by = ?, updated_at = NOW()
         WHERE id = ?`,
        [newStatus, completedAt, completedBy, taskId]
    );

    let actionName = 'STATUS_CHANGED';
    if (newStatus === 'COMPLETED') actionName = 'TASK_COMPLETED';
    if (currentStatus === 'COMPLETED' && newStatus !== 'COMPLETED') actionName = 'TASK_REOPENED';
    if (newStatus === 'CANCELLED') actionName = 'TASK_CANCELLED';

    await logTaskActivity(taskId, actor.username, actionName, currentStatus, newStatus);
    await logActivity({
        username: actor.username,
        action: actionName,
        resourceType: 'Task',
        resourceId: taskId.toString(),
        details: { oldStatus: currentStatus, newStatus }
    });

    return getTaskById(actor, taskId);
}

/**
 * Reassign task to a new user.
 */
export async function reassignTask(actor, taskId, newAssignee) {
    const task = await getTaskById(actor, taskId);
    if (!task) {
        const error = new Error('Task not found');
        error.status = 404;
        throw error;
    }

    if (!newAssignee) {
        const error = new Error('New assignee is required');
        error.status = 400;
        throw error;
    }

    // Permission & Management scope check
    if (!actor.permissions?.includes('tasks.reassign') && !actor.permissions?.includes('tasks.assign') && actor.roleKey !== 'admin') {
        const error = new Error('Forbidden: You do not have permission to reassign tasks');
        error.status = 403;
        throw error;
    }

    const canManage = await canManageUser(actor, newAssignee);
    if (!canManage) {
        const error = new Error(`Forbidden: Target assignee '${newAssignee}' is outside your management scope`);
        error.status = 403;
        throw error;
    }

    const oldAssignee = task.assigned_to;
    await appDB.query(
        `UPDATE tasks SET assigned_to = ?, updated_at = NOW() WHERE id = ?`,
        [newAssignee, taskId]
    );

    await logTaskActivity(taskId, actor.username, 'TASK_REASSIGNED', oldAssignee, newAssignee);
    
    // Notify new assignee
    const updatedTask = await getTaskById(actor, taskId);
    notifyTaskAssignment(updatedTask, newAssignee, actor.name || actor.username);

    return updatedTask;
}

/**
 * Delete a task.
 */
export async function deleteTask(actor, taskId) {
    const task = await getTaskById(actor, taskId);
    if (!task) {
        const error = new Error('Task not found');
        error.status = 404;
        throw error;
    }

    if (!actor.permissions?.includes('tasks.delete') && actor.roleKey !== 'admin' && task.created_by !== actor.username) {
        const error = new Error('Forbidden: You do not have permission to delete this task');
        error.status = 403;
        throw error;
    }

    await appDB.query(`DELETE FROM tasks WHERE id = ?`, [taskId]);
    
    await logActivity({
        username: actor.username,
        action: 'TASK_DELETED',
        resourceType: 'Task',
        resourceId: taskId.toString(),
        details: { title: task.title }
    });

    return true;
}

/**
 * Checklist operations.
 */
export async function addChecklistItem(actor, taskId, title) {
    const task = await getTaskById(actor, taskId);
    if (!task) throw new Error('Task not found');

    if (!title || !title.trim()) throw new Error('Checklist item title is required');

    const [posRows] = await appDB.query(`SELECT MAX(position) as max_pos FROM task_checklists WHERE task_id = ?`, [taskId]);
    const nextPos = (posRows[0]?.max_pos || 0) + 1;

    const [result] = await appDB.query(
        `INSERT INTO task_checklists (task_id, title, position, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW())`,
        [taskId, title.trim(), nextPos]
    );

    await logTaskActivity(taskId, actor.username, 'CHECKLIST_UPDATED', null, `Added item: ${title.trim()}`);
    return getTaskById(actor, taskId);
}

export async function updateChecklistItem(actor, taskId, itemId, updates) {
    const task = await getTaskById(actor, taskId);
    if (!task) throw new Error('Task not found');

    const [items] = await appDB.query(`SELECT * FROM task_checklists WHERE id = ? AND task_id = ?`, [itemId, taskId]);
    if (!items.length) throw new Error('Checklist item not found');

    const item = items[0];
    const fields = [];
    const values = [];

    if (updates.completed !== undefined) {
        const isCompleted = updates.completed ? 1 : 0;
        fields.push('completed = ?');
        values.push(isCompleted);

        fields.push('completed_by = ?');
        values.push(isCompleted ? actor.username : null);

        fields.push('completed_at = ?');
        values.push(isCompleted ? new Date() : null);
    }

    if (updates.title !== undefined && updates.title.trim()) {
        fields.push('title = ?');
        values.push(updates.title.trim());
    }

    if (fields.length > 0) {
        fields.push('updated_at = NOW()');
        values.push(itemId);
        await appDB.query(`UPDATE task_checklists SET ${fields.join(', ')} WHERE id = ?`, values);
        await logTaskActivity(taskId, actor.username, 'CHECKLIST_UPDATED', item.title, updates.completed ? 'Checked' : 'Unchecked');
    }

    return getTaskById(actor, taskId);
}

export async function deleteChecklistItem(actor, taskId, itemId) {
    const task = await getTaskById(actor, taskId);
    if (!task) throw new Error('Task not found');

    await appDB.query(`DELETE FROM task_checklists WHERE id = ? AND task_id = ?`, [itemId, taskId]);
    await logTaskActivity(taskId, actor.username, 'CHECKLIST_UPDATED', null, `Deleted checklist item`);
    return getTaskById(actor, taskId);
}

/**
 * Comments operations.
 */
export async function addComment(actor, taskId, content) {
    const task = await getTaskById(actor, taskId);
    if (!task) throw new Error('Task not found');

    if (!content || !content.trim()) throw new Error('Comment content cannot be empty');

    const [result] = await appDB.query(
        `INSERT INTO task_comments (task_id, author_id, content, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW())`,
        [taskId, actor.username, content.trim()]
    );

    await logTaskActivity(taskId, actor.username, 'COMMENT_ADDED', null, content.trim().substring(0, 50));
    return getTaskById(actor, taskId);
}

/**
 * Attachments operations.
 */
export async function addAttachment(actor, taskId, file) {
    const task = await getTaskById(actor, taskId);
    if (!task) throw new Error('Task not found');

    if (!file) throw new Error('No file uploaded');

    const [result] = await appDB.query(
        `INSERT INTO task_attachments (task_id, uploaded_by, file_name, file_path, file_size, file_type, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [taskId, actor.username, file.originalname, file.path, file.size, file.mimetype]
    );

    await logTaskActivity(taskId, actor.username, 'ATTACHMENT_ADDED', null, file.originalname);
    return getTaskById(actor, taskId);
}

export async function getAttachmentFile(actor, taskId, attachmentId) {
    const task = await getTaskById(actor, taskId);
    if (!task) throw new Error('Task not found');

    const [rows] = await appDB.query(
        `SELECT * FROM task_attachments WHERE id = ? AND task_id = ?`,
        [attachmentId, taskId]
    );

    if (!rows.length) return null;
    return rows[0];
}

export async function deleteAttachment(actor, taskId, attachmentId) {
    const attachment = await getAttachmentFile(actor, taskId, attachmentId);
    if (!attachment) throw new Error('Attachment not found');

    if (attachment.uploaded_by !== actor.username && actor.roleKey !== 'admin' && !actor.permissions?.includes('tasks.delete')) {
        const error = new Error('Forbidden: Cannot delete attachment');
        error.status = 403;
        throw error;
    }

    if (fs.existsSync(attachment.file_path)) {
        try { fs.unlinkSync(attachment.file_path); } catch (e) { console.error('Failed to unlink file:', e); }
    }

    await appDB.query(`DELETE FROM task_attachments WHERE id = ?`, [attachmentId]);
    return getTaskById(actor, taskId);
}

/**
 * Fetch comprehensive task analytics & high-level insights for dashboard.
 */
export async function getTaskAnalytics(actor, filters = {}) {
    const { dateRange = '30d', startDate, endDate, status, priority, category, assignedTo, search } = filters;
    const isGlobalViewer = actor.roleKey === 'admin' || actor.permissions?.includes('tasks.view_analytics') || actor.permissions?.includes('tasks.view_all') || actor.permissions?.includes('tasks.manage_all');
    if (!isGlobalViewer) {
        const error = new Error('Forbidden: Only administrators and authorized managers can view task analytics.');
        error.status = 403;
        throw error;
    }
    
    const conditions = [];
    const params = [];

    // Date range filter
    if (startDate && endDate) {
        conditions.push(`DATE(t.created_at) >= DATE(?) AND DATE(t.created_at) <= DATE(?)`);
        params.push(startDate, endDate);
    } else if (dateRange !== 'all') {
        let dateInterval = 30;
        if (dateRange === '7d') dateInterval = 7;
        else if (dateRange === '30d') dateInterval = 30;
        else if (dateRange === '90d') dateInterval = 90;
        else if (dateRange === 'ytd') dateInterval = 365;

        conditions.push(`t.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`);
        params.push(dateInterval);
    }

    // Status filter
    if (status && status !== 'ALL') {
        conditions.push(`t.status = ?`);
        params.push(status);
    }

    // Priority filter
    if (priority && priority !== 'ALL') {
        conditions.push(`t.priority = ?`);
        params.push(priority);
    }

    // Category filter
    if (category && category !== 'ALL') {
        conditions.push(`t.category = ?`);
        params.push(category);
    }

    // Assignee filter
    if (assignedTo && assignedTo !== 'ALL') {
        conditions.push(`t.assigned_to = ?`);
        params.push(assignedTo);
    }

    // Search filter
    if (search && search.trim()) {
        conditions.push(`(t.title LIKE ? OR t.description LIKE ? OR t.category LIKE ?)`);
        const searchPattern = `%${search.trim()}%`;
        params.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 1. KPI Summary Aggregates
    const [kpiRows] = await appDB.query(
        `SELECT 
            COUNT(*) AS total_tasks,
            SUM(CASE WHEN t.status = 'TODO' THEN 1 ELSE 0 END) AS todo_count,
            SUM(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress_count,
            SUM(CASE WHEN t.status = 'BLOCKED' THEN 1 ELSE 0 END) AS blocked_count,
            SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count,
            SUM(CASE WHEN t.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_count,
            SUM(CASE WHEN t.due_date IS NOT NULL AND DATE(t.due_date) < CURDATE() AND t.status NOT IN ('COMPLETED', 'CANCELLED') THEN 1 ELSE 0 END) AS overdue_count,
            SUM(CASE WHEN t.priority IN ('URGENT', 'HIGH') AND t.status NOT IN ('COMPLETED', 'CANCELLED') THEN 1 ELSE 0 END) AS high_priority_open_count,
            SUM(CASE WHEN t.status = 'COMPLETED' AND (t.due_date IS NULL OR DATE(t.updated_at) <= DATE(t.due_date)) THEN 1 ELSE 0 END) AS on_time_completed_count,
            AVG(CASE WHEN t.status = 'COMPLETED' THEN DATEDIFF(t.updated_at, t.created_at) ELSE NULL END) AS avg_completion_days
         FROM tasks t
         ${whereClause}`,
        params
    );

    const kpi = kpiRows[0] || {};
    const totalTasks = Number(kpi.total_tasks || 0);
    const completedCount = Number(kpi.completed_count || 0);
    const overdueCount = Number(kpi.overdue_count || 0);
    const onTimeCompleted = Number(kpi.on_time_completed_count || 0);

    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
    const overdueRate = totalTasks > 0 ? Math.round((overdueCount / totalTasks) * 100) : 0;
    const onTimeRate = completedCount > 0 ? Math.round((onTimeCompleted / completedCount) * 100) : 100;
    const avgCompletionDays = kpi.avg_completion_days ? Number(Number(kpi.avg_completion_days).toFixed(1)) : 0;

    // 2. Priority Breakdown
    const [priorityRows] = await appDB.query(
        `SELECT 
            t.priority,
            COUNT(*) as count
         FROM tasks t
         ${whereClause}
         GROUP BY t.priority`,
        params
    );

    const priorityBreakdown = {
        URGENT: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
    };
    priorityRows.forEach(row => {
        if (priorityBreakdown.hasOwnProperty(row.priority)) {
            priorityBreakdown[row.priority] = Number(row.count);
        }
    });

    // 3. Category Breakdown
    const [categoryRows] = await appDB.query(
        `SELECT 
            COALESCE(t.category, 'General') AS category,
            COUNT(*) as count
         FROM tasks t
         ${whereClause}
         GROUP BY COALESCE(t.category, 'General')
         ORDER BY count DESC
         LIMIT 8`,
        params
    );

    // 4. Assignee / Team Workload Table
    const [assigneeRows] = await appDB.query(
        `SELECT 
            t.assigned_to AS username,
            COALESCE(u.name, t.assigned_to) AS name,
            COUNT(*) AS total_assigned,
            SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count,
            SUM(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress_count,
            SUM(CASE WHEN t.status = 'TODO' THEN 1 ELSE 0 END) AS todo_count,
            SUM(CASE WHEN t.status = 'BLOCKED' THEN 1 ELSE 0 END) AS blocked_count,
            SUM(CASE WHEN t.due_date IS NOT NULL AND DATE(t.due_date) < CURDATE() AND t.status NOT IN ('COMPLETED', 'CANCELLED') THEN 1 ELSE 0 END) AS overdue_count,
            AVG(CASE WHEN t.status = 'COMPLETED' THEN DATEDIFF(t.updated_at, t.created_at) ELSE NULL END) AS avg_completion_days
         FROM tasks t
         LEFT JOIN users u ON t.assigned_to = u.username
         ${whereClause}
         GROUP BY t.assigned_to, u.name
         ORDER BY total_assigned DESC
         LIMIT 15`,
        params
    );

    const assigneeWorkload = assigneeRows.map(row => {
        const total = Number(row.total_assigned || 0);
        const comp = Number(row.completed_count || 0);
        return {
            username: row.username,
            name: row.name,
            totalAssigned: total,
            completedCount: comp,
            inProgressCount: Number(row.in_progress_count || 0),
            todoCount: Number(row.todo_count || 0),
            blockedCount: Number(row.blocked_count || 0),
            overdueCount: Number(row.overdue_count || 0),
            completionRate: total > 0 ? Math.round((comp / total) * 100) : 0,
            avgCompletionDays: row.avg_completion_days ? Number(Number(row.avg_completion_days).toFixed(1)) : 0
        };
    });

    // 5. Completion & Creation Trend (Daily/Weekly points for last 30 days)
    const [trendRows] = await appDB.query(
        `SELECT 
            DATE_FORMAT(t.created_at, '%Y-%m-%d') AS date_str,
            COUNT(*) AS created_count,
            SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count
         FROM tasks t
         ${whereClause}
         GROUP BY DATE_FORMAT(t.created_at, '%Y-%m-%d')
         ORDER BY date_str ASC
         LIMIT 30`,
        params
    );

    // 6. Overdue / At-Risk Watchlist
    const [overdueWatchlist] = await appDB.query(
        `SELECT 
            t.id,
            t.title,
            t.priority,
            t.status,
            t.due_date,
            t.assigned_to,
            t.created_by,
            u_assignee.name AS assignee_name,
            DATEDIFF(CURDATE(), t.due_date) AS days_overdue
         FROM tasks t
         LEFT JOIN users u_assignee ON t.assigned_to = u_assignee.username
         ${whereClause} AND t.due_date IS NOT NULL AND DATE(t.due_date) < CURDATE() AND t.status NOT IN ('COMPLETED', 'CANCELLED')
         ORDER BY 
           CASE WHEN t.priority = 'URGENT' THEN 0 WHEN t.priority = 'HIGH' THEN 1 ELSE 2 END ASC,
           t.due_date ASC
         LIMIT 10`,
        params
    );

    return {
        kpi: {
            totalTasks,
            todoCount: Number(kpi.todo_count || 0),
            inProgressCount: Number(kpi.in_progress_count || 0),
            blockedCount: Number(kpi.blocked_count || 0),
            completedCount,
            cancelledCount: Number(kpi.cancelled_count || 0),
            overdueCount,
            highPriorityOpenCount: Number(kpi.high_priority_open_count || 0),
            completionRate,
            overdueRate,
            onTimeRate,
            avgCompletionDays
        },
        priorityBreakdown,
        categoryBreakdown: categoryRows,
        assigneeWorkload,
        trendTimeline: trendRows,
        overdueWatchlist
    };
}

/**
 * Fetch all distinct task categories available in the system plus defaults.
 */
export async function getTaskCategories(actor) {
    const [rows] = await appDB.query(
        `SELECT DISTINCT category 
         FROM tasks 
         WHERE category IS NOT NULL AND TRIM(category) != '' 
         ORDER BY category ASC`
    );
    const existing = rows.map(r => r.category ? r.category.trim() : '').filter(Boolean);
    const defaults = ['General', 'Finance', 'CRM', 'Development', 'Marketing', 'Operations', 'HR', 'Sales', 'Support', 'Bug Fix'];
    const merged = Array.from(new Set([...defaults, ...existing]));
    return merged.sort((a, b) => a.localeCompare(b));
}


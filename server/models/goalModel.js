import appDB from "../db/subsyncDB.js";
import { generateID } from "../middlewares/generateID.js";
import { recordGoalActivity } from "./goalActivityModel.js";

/**
 * Check if active goal title already exists within the same financial year
 */
export const checkDuplicateGoalTitle = async (title, financialYear, excludeGoalId = null) => {
    let sql = `SELECT goal_id FROM goals WHERE LOWER(title) = LOWER(?) AND financial_year = ? AND is_deleted = 0`;
    const params = [title.trim(), financialYear];

    if (excludeGoalId) {
        sql += ` AND goal_id != ?`;
        params.push(excludeGoalId);
    }

    const [rows] = await appDB.query(sql, params);
    return rows.length > 0;
};

/**
 * Create Goal
 */
export const createGoal = async (goalData, username, ipAddress = null) => {
    const {
        title,
        description,
        category_id,
        business_impact_id,
        quarter,
        financial_year,
        owners = [],
        target_date,
        status_id,
        progress = 0,
        priority = 'Medium',
        remarks
    } = goalData;

    // Validation
    if (!title || !title.trim()) throw new Error("Goal Title is required");
    if (!category_id) throw new Error("Category is required");
    if (!business_impact_id) throw new Error("Business Impact is required");
    if (!quarter) throw new Error("Quarter is required");
    if (!financial_year) throw new Error("Financial Year is required");
    if (!owners || owners.length === 0) throw new Error("At least one Owner is required");
    if (!target_date) throw new Error("Target Date is required");
    if (progress < 0 || progress > 100) throw new Error("Progress must be between 0 and 100");

    const isDuplicate = await checkDuplicateGoalTitle(title, financial_year);
    if (isDuplicate) {
        throw new Error(`A goal with title "${title.trim()}" already exists in Financial Year ${financial_year}.`);
    }

    const goal_id = generateID("GOAL");
    const initialProgress = Number(progress) || 0;

    const [result] = await appDB.query(
        `INSERT INTO goals (
            goal_id, title, description, category_id, business_impact_id,
            quarter, financial_year, target_date, status_id, progress,
            priority, remarks, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            goal_id, title.trim(), description || null, category_id, business_impact_id,
            quarter, financial_year, target_date, status_id, initialProgress,
            priority, remarks || null, username
        ]
    );

    // Save Owners
    if (Array.isArray(owners) && owners.length > 0) {
        const ownerValues = owners.map(o => [goal_id, o]);
        await appDB.query(`INSERT INTO goal_owners (goal_id, username) VALUES ?`, [ownerValues]);
    }

    // Record Activity
    await recordGoalActivity({
        goalId: goal_id,
        username,
        action: 'Goal Created',
        details: `Goal "${title}" created for FY ${financial_year} ${quarter}`,
        ipAddress
    });

    return goal_id;
};

/**
 * Get Goals with Filtering, Search & Pagination
 */
export const getGoals = async ({
    quarter,
    financial_year,
    category_id,
    business_impact_id,
    owner,
    status_id,
    priority,
    created_by,
    dateFrom,
    dateTo,
    search,
    sortBy = 'target_date',
    sortOrder = 'ASC',
    limit = 20,
    offset = 0
} = {}) => {
    let sql = `
        SELECT 
            g.*,
            gc.name as category_name,
            gbi.name as business_impact_name,
            gs.name as status_name,
            gs.code as status_code,
            gs.badge_color as status_badge_color,
            gs.icon as status_icon,
            gs.is_completed_status,
            u.name as creator_display_name,
            (
                SELECT GROUP_CONCAT(CONCAT(u_own.name, ' (', go.username, ')') SEPARATOR ', ')
                FROM goal_owners go
                LEFT JOIN users u_own ON go.username = u_own.username
                WHERE go.goal_id = g.goal_id
            ) as owners_text,
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT('username', go.username, 'name', COALESCE(u_own.name, go.username))
                )
                FROM goal_owners go
                LEFT JOIN users u_own ON go.username = u_own.username
                WHERE go.goal_id = g.goal_id
            ) as owners_list,
            CASE 
                WHEN g.target_date < CURDATE() AND (gs.is_completed_status = 0 AND gs.code != 'cancelled') THEN 1
                ELSE 0
            END as is_overdue
        FROM goals g
        LEFT JOIN goal_categories gc ON g.category_id = gc.category_id
        LEFT JOIN goal_business_impacts gbi ON g.business_impact_id = gbi.impact_id
        LEFT JOIN goal_statuses gs ON g.status_id = gs.status_id
        LEFT JOIN users u ON g.created_by = u.username
        WHERE g.is_deleted = 0
    `;

    const params = [];

    if (quarter) {
        sql += ` AND g.quarter = ?`;
        params.push(quarter);
    }
    if (financial_year) {
        sql += ` AND g.financial_year = ?`;
        params.push(financial_year);
    }
    if (category_id) {
        sql += ` AND g.category_id = ?`;
        params.push(category_id);
    }
    if (business_impact_id) {
        sql += ` AND g.business_impact_id = ?`;
        params.push(business_impact_id);
    }
    if (status_id) {
        sql += ` AND g.status_id = ?`;
        params.push(status_id);
    }
    if (priority) {
        sql += ` AND g.priority = ?`;
        params.push(priority);
    }
    if (created_by) {
        sql += ` AND g.created_by = ?`;
        params.push(created_by);
    }
    if (dateFrom) {
        sql += ` AND DATE(g.target_date) >= ?`;
        params.push(dateFrom);
    }
    if (dateTo) {
        sql += ` AND DATE(g.target_date) <= ?`;
        params.push(dateTo);
    }

    if (owner) {
        sql += ` AND EXISTS (SELECT 1 FROM goal_owners go_filter WHERE go_filter.goal_id = g.goal_id AND go_filter.username = ?)`;
        params.push(owner);
    }

    if (search) {
        sql += ` AND (g.title LIKE ? OR g.description LIKE ? OR g.remarks LIKE ? OR g.goal_id LIKE ?)`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const allowedSorts = ['target_date', 'progress', 'title', 'created_at', 'priority'];
    const actualSort = allowedSorts.includes(sortBy) ? `g.${sortBy}` : 'g.target_date';
    const actualOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    sql += ` ORDER BY ${actualSort} ${actualOrder} LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [rows] = await appDB.query(sql, params);
    return rows;
};

/**
 * Get Total Count for Pagination
 */
export const getGoalsCount = async (filters = {}) => {
    const {
        quarter, financial_year, category_id, business_impact_id,
        owner, status_id, priority, created_by, dateFrom, dateTo, search
    } = filters;

    let sql = `SELECT COUNT(DISTINCT g.id) as total FROM goals g WHERE g.is_deleted = 0`;
    const params = [];

    if (quarter) { sql += ` AND g.quarter = ?`; params.push(quarter); }
    if (financial_year) { sql += ` AND g.financial_year = ?`; params.push(financial_year); }
    if (category_id) { sql += ` AND g.category_id = ?`; params.push(category_id); }
    if (business_impact_id) { sql += ` AND g.business_impact_id = ?`; params.push(business_impact_id); }
    if (status_id) { sql += ` AND g.status_id = ?`; params.push(status_id); }
    if (priority) { sql += ` AND g.priority = ?`; params.push(priority); }
    if (created_by) { sql += ` AND g.created_by = ?`; params.push(created_by); }
    if (dateFrom) { sql += ` AND DATE(g.target_date) >= ?`; params.push(dateFrom); }
    if (dateTo) { sql += ` AND DATE(g.target_date) <= ?`; params.push(dateTo); }

    if (owner) {
        sql += ` AND EXISTS (SELECT 1 FROM goal_owners go_filter WHERE go_filter.goal_id = g.goal_id AND go_filter.username = ?)`;
        params.push(owner);
    }

    if (search) {
        sql += ` AND (g.title LIKE ? OR g.description LIKE ? OR g.remarks LIKE ? OR g.goal_id LIKE ?)`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const [rows] = await appDB.query(sql, params);
    return rows[0].total;
};

/**
 * Get Goal By ID with Details
 */
export const getGoalById = async (goalId) => {
    const sql = `
        SELECT 
            g.*,
            gc.name as category_name,
            gbi.name as business_impact_name,
            gs.name as status_name,
            gs.code as status_code,
            gs.badge_color as status_badge_color,
            gs.icon as status_icon,
            gs.is_completed_status,
            u.name as creator_display_name,
            CASE 
                WHEN g.target_date < CURDATE() AND (gs.is_completed_status = 0 AND gs.code != 'cancelled') THEN 1
                ELSE 0
            END as is_overdue
        FROM goals g
        LEFT JOIN goal_categories gc ON g.category_id = gc.category_id
        LEFT JOIN goal_business_impacts gbi ON g.business_impact_id = gbi.impact_id
        LEFT JOIN goal_statuses gs ON g.status_id = gs.status_id
        LEFT JOIN users u ON g.created_by = u.username
        WHERE g.goal_id = ? AND g.is_deleted = 0
    `;
    const [rows] = await appDB.query(sql, [goalId]);
    if (!rows[0]) return null;

    const goal = rows[0];

    // Fetch owners
    const [owners] = await appDB.query(
        `SELECT go.username, u.name, u.email
         FROM goal_owners go
         LEFT JOIN users u ON go.username = u.username
         WHERE go.goal_id = ?`,
        [goalId]
    );

    // Fetch attachments
    const [attachments] = await appDB.query(
        `SELECT * FROM goal_attachments WHERE goal_id = ? AND is_deleted = 0 ORDER BY uploaded_at DESC`,
        [goalId]
    );

    // Fetch comments
    const [comments] = await appDB.query(
        `SELECT gc.*, u.name as user_display_name
         FROM goal_comments gc
         LEFT JOIN users u ON gc.username = u.username
         WHERE gc.goal_id = ? AND gc.is_deleted = 0
         ORDER BY gc.created_at ASC`,
        [goalId]
    );

    return {
        ...goal,
        owners,
        attachments,
        comments
    };
};

/**
 * Update Goal
 */
export const updateGoal = async (goalId, goalData, username, ipAddress = null) => {
    const existing = await getGoalById(goalId);
    if (!existing) throw new Error("Goal not found");

    const {
        title,
        description,
        category_id,
        business_impact_id,
        quarter,
        financial_year,
        owners,
        target_date,
        status_id,
        progress,
        priority,
        remarks
    } = goalData;

    if (title && title.trim() !== existing.title) {
        const fyToCheck = financial_year || existing.financial_year;
        const isDuplicate = await checkDuplicateGoalTitle(title, fyToCheck, goalId);
        if (isDuplicate) {
            throw new Error(`A goal with title "${title.trim()}" already exists in Financial Year ${fyToCheck}.`);
        }
    }

    const updates = [];
    const params = [];

    const checkAndUpdate = async (field, newVal, fieldLabel) => {
        if (newVal !== undefined && String(newVal) !== String(existing[field])) {
            updates.push(`${field} = ?`);
            params.push(newVal);

            await recordGoalActivity({
                goalId,
                username,
                action: `${fieldLabel} Changed`,
                fieldName: field,
                oldValue: existing[field],
                newValue: newVal,
                ipAddress
            });
        }
    };

    await checkAndUpdate('title', title ? title.trim() : undefined, 'Title');
    await checkAndUpdate('description', description, 'Description');
    await checkAndUpdate('category_id', category_id, 'Category');
    await checkAndUpdate('business_impact_id', business_impact_id, 'Business Impact');
    await checkAndUpdate('quarter', quarter, 'Quarter');
    await checkAndUpdate('financial_year', financial_year, 'Financial Year');
    await checkAndUpdate('target_date', target_date, 'Target Date');
    await checkAndUpdate('status_id', status_id, 'Status');
    await checkAndUpdate('progress', progress !== undefined ? Number(progress) : undefined, 'Progress');
    await checkAndUpdate('priority', priority, 'Priority');
    await checkAndUpdate('remarks', remarks, 'Remarks');

    if (updates.length > 0) {
        updates.push("updated_by = ?");
        params.push(username);

        params.push(goalId);
        await appDB.query(`UPDATE goals SET ${updates.join(", ")} WHERE goal_id = ? AND is_deleted = 0`, params);
    }

    // Update Owners if provided
    if (owners && Array.isArray(owners)) {
        const currentOwnerUsernames = existing.owners.map(o => o.username).sort().join(',');
        const newOwnerUsernames = owners.sort().join(',');

        if (currentOwnerUsernames !== newOwnerUsernames) {
            await appDB.query(`DELETE FROM goal_owners WHERE goal_id = ?`, [goalId]);
            if (owners.length > 0) {
                const ownerValues = owners.map(o => [goalId, o]);
                await appDB.query(`INSERT INTO goal_owners (goal_id, username) VALUES ?`, [ownerValues]);
            }

            await recordGoalActivity({
                goalId,
                username,
                action: 'Owner Changed',
                fieldName: 'owners',
                oldValue: currentOwnerUsernames,
                newValue: newOwnerUsernames,
                ipAddress
            });
        }
    }

    return true;
};

/**
 * Update Progress
 */
export const updateGoalProgress = async (goalId, progress, username, ipAddress = null) => {
    const existing = await getGoalById(goalId);
    if (!existing) throw new Error("Goal not found");

    const newProgress = Number(progress);
    if (isNaN(newProgress) || newProgress < 0 || newProgress > 100) {
        throw new Error("Progress must be an integer between 0 and 100");
    }

    let status_id = existing.status_id;
    let autoStatusChanged = false;

    // Rule: If progress = 100%, check if completed status exists
    if (newProgress === 100 && !existing.is_completed_status) {
        const [compRows] = await appDB.query(
            `SELECT status_id FROM goal_statuses WHERE is_completed_status = 1 AND is_deleted = 0 LIMIT 1`
        );
        if (compRows[0]) {
            status_id = compRows[0].status_id;
            autoStatusChanged = true;
        }
    }

    await appDB.query(
        `UPDATE goals SET progress = ?, status_id = ?, updated_by = ? WHERE goal_id = ? AND is_deleted = 0`,
        [newProgress, status_id, username, goalId]
    );

    await recordGoalActivity({
        goalId,
        username,
        action: 'Progress Updated',
        fieldName: 'progress',
        oldValue: existing.progress,
        newValue: newProgress,
        details: autoStatusChanged ? `Status automatically updated to Completed` : null,
        ipAddress
    });

    return { progress: newProgress, status_id, autoStatusChanged };
};

/**
 * Update Status
 */
export const updateGoalStatus = async (goalId, statusId, username, ipAddress = null) => {
    const existing = await getGoalById(goalId);
    if (!existing) throw new Error("Goal not found");

    const [statusRows] = await appDB.query(
        `SELECT * FROM goal_statuses WHERE status_id = ? AND is_deleted = 0`,
        [statusId]
    );
    if (!statusRows[0]) throw new Error("Invalid status ID");

    const targetStatus = statusRows[0];
    let newProgress = existing.progress;
    let autoProgressChanged = false;

    // Rule: If status is Completed, auto set progress to 100%
    if (targetStatus.is_completed_status && existing.progress !== 100) {
        newProgress = 100;
        autoProgressChanged = true;
    }

    await appDB.query(
        `UPDATE goals SET status_id = ?, progress = ?, updated_by = ? WHERE goal_id = ? AND is_deleted = 0`,
        [statusId, newProgress, username, goalId]
    );

    await recordGoalActivity({
        goalId,
        username,
        action: 'Status Changed',
        fieldName: 'status_id',
        oldValue: existing.status_name,
        newValue: targetStatus.name,
        details: autoProgressChanged ? `Progress automatically set to 100%` : null,
        ipAddress
    });

    return { status_id: statusId, progress: newProgress, autoProgressChanged };
};

/**
 * Delete Goal (Soft Delete)
 */
export const deleteGoal = async (goalId, username, ipAddress = null) => {
    const existing = await getGoalById(goalId);
    if (!existing) throw new Error("Goal not found");

    await appDB.query(
        `UPDATE goals SET is_deleted = 1, deleted_by = ?, deleted_at = NOW() WHERE goal_id = ?`,
        [username, goalId]
    );

    await recordGoalActivity({
        goalId,
        username,
        action: 'Goal Deleted',
        details: `Goal "${existing.title}" deleted`,
        ipAddress
    });

    return true;
};

/**
 * Attachments Management
 */
export const addGoalAttachment = async (goalId, fileData, username, ipAddress = null) => {
    const attachment_id = generateID("ATT");
    const { filename, originalname, path: filePath, size, mimetype } = fileData;

    await appDB.query(
        `INSERT INTO goal_attachments (
            attachment_id, goal_id, filename, original_name, file_path, file_size, mime_type, uploaded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [attachment_id, goalId, filename, originalname, filePath, size, mimetype, username]
    );

    await recordGoalActivity({
        goalId,
        username,
        action: 'Attachment Added',
        details: `Attachment "${originalname}" uploaded`,
        ipAddress
    });

    return attachment_id;
};

export const deleteGoalAttachment = async (goalId, attachmentId, username, ipAddress = null) => {
    const [rows] = await appDB.query(
        `SELECT * FROM goal_attachments WHERE attachment_id = ? AND goal_id = ? AND is_deleted = 0`,
        [attachmentId, goalId]
    );
    if (!rows[0]) throw new Error("Attachment not found");

    await appDB.query(
        `UPDATE goal_attachments SET is_deleted = 1 WHERE attachment_id = ?`,
        [attachmentId]
    );

    await recordGoalActivity({
        goalId,
        username,
        action: 'Attachment Deleted',
        details: `Attachment "${rows[0].original_name}" removed`,
        ipAddress
    });

    return true;
};

/**
 * Comments Management
 */
export const addGoalComment = async (goalId, commentText, username) => {
    if (!commentText || !commentText.trim()) throw new Error("Comment text cannot be empty");

    const comment_id = generateID("COMM");
    await appDB.query(
        `INSERT INTO goal_comments (comment_id, goal_id, username, comment) VALUES (?, ?, ?, ?)`,
        [comment_id, goalId, username, commentText.trim()]
    );

    return comment_id;
};

/**
 * Dashboard Statistics & Charts Data
 */
export const getGoalsDashboardStats = async (filters = {}) => {
    const { financial_year, quarter } = filters;
    let whereClause = `WHERE g.is_deleted = 0`;
    const params = [];

    if (financial_year) {
        whereClause += ` AND g.financial_year = ?`;
        params.push(financial_year);
    }
    if (quarter) {
        whereClause += ` AND g.quarter = ?`;
        params.push(quarter);
    }

    // 1. Stat cards
    const [summaryRows] = await appDB.query(`
        SELECT 
            COUNT(g.id) as total_goals,
            SUM(CASE WHEN gs.is_completed_status = 1 THEN 1 ELSE 0 END) as completed_goals,
            SUM(CASE WHEN gs.code = 'in_progress' THEN 1 ELSE 0 END) as in_progress_goals,
            SUM(CASE WHEN gs.code = 'at_risk' THEN 1 ELSE 0 END) as at_risk_goals,
            SUM(CASE WHEN g.target_date < CURDATE() AND (gs.is_completed_status = 0 AND gs.code != 'cancelled') THEN 1 ELSE 0 END) as overdue_goals,
            AVG(g.progress) as avg_progress
        FROM goals g
        LEFT JOIN goal_statuses gs ON g.status_id = gs.status_id
        ${whereClause}
    `, params);

    const summary = summaryRows[0] || {
        total_goals: 0,
        completed_goals: 0,
        in_progress_goals: 0,
        at_risk_goals: 0,
        overdue_goals: 0,
        avg_progress: 0
    };

    // 2. Goals by Status Chart
    const [byStatus] = await appDB.query(`
        SELECT 
            COALESCE(gs.name, 'Unknown') as label,
            COALESCE(gs.badge_color, '#64748b') as color,
            COUNT(g.id) as count
        FROM goals g
        LEFT JOIN goal_statuses gs ON g.status_id = gs.status_id
        ${whereClause}
        GROUP BY g.status_id, gs.name, gs.badge_color
    `, params);

    // 3. Goals by Category Chart
    const [byCategory] = await appDB.query(`
        SELECT 
            COALESCE(gc.name, 'Uncategorized') as label,
            COUNT(g.id) as count
        FROM goals g
        LEFT JOIN goal_categories gc ON g.category_id = gc.category_id
        ${whereClause}
        GROUP BY g.category_id, gc.name
        ORDER BY count DESC
    `, params);

    // 4. Goals by Quarter Chart
    const [byQuarter] = await appDB.query(`
        SELECT 
            g.quarter as label,
            COUNT(g.id) as count,
            SUM(CASE WHEN gs.is_completed_status = 1 THEN 1 ELSE 0 END) as completed
        FROM goals g
        LEFT JOIN goal_statuses gs ON g.status_id = gs.status_id
        ${whereClause}
        GROUP BY g.quarter
        ORDER BY g.quarter ASC
    `, params);

    // 5. Goals by Business Impact Chart
    const [byBusinessImpact] = await appDB.query(`
        SELECT 
            COALESCE(gbi.name, 'Unassigned') as label,
            COUNT(g.id) as count
        FROM goals g
        LEFT JOIN goal_business_impacts gbi ON g.business_impact_id = gbi.impact_id
        ${whereClause}
        GROUP BY g.business_impact_id, gbi.name
        ORDER BY count DESC
    `, params);

    // 6. Monthly Completion Trend (created/completed trend)
    const [monthlyTrend] = await appDB.query(`
        SELECT 
            DATE_FORMAT(g.created_at, '%b %Y') as month,
            COUNT(g.id) as total_created,
            SUM(CASE WHEN gs.is_completed_status = 1 THEN 1 ELSE 0 END) as completed
        FROM goals g
        LEFT JOIN goal_statuses gs ON g.status_id = gs.status_id
        ${whereClause}
        GROUP BY DATE_FORMAT(g.created_at, '%Y-%m'), DATE_FORMAT(g.created_at, '%b %Y')
        ORDER BY DATE_FORMAT(g.created_at, '%Y-%m') ASC
        LIMIT 12
    `, params);

    return {
        summary: {
            totalGoals: summary.total_goals || 0,
            completed: summary.completed_goals || 0,
            inProgress: summary.in_progress_goals || 0,
            atRisk: summary.at_risk_goals || 0,
            overdue: summary.overdue_goals || 0,
            completionPercentage: summary.total_goals > 0 ? Math.round(((summary.completed_goals || 0) / summary.total_goals) * 100) : 0,
            avgProgress: Math.round(summary.avg_progress || 0)
        },
        charts: {
            byStatus,
            byCategory,
            byQuarter,
            byBusinessImpact,
            monthlyTrend
        }
    };
};

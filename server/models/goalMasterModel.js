import appDB from "../db/subsyncDB.js";
import { generateID } from "../middlewares/generateID.js";

// ==========================================
// GOAL CATEGORIES
// ==========================================

export const getGoalCategories = async ({ includeInactive = false } = {}) => {
    let sql = `SELECT * FROM goal_categories WHERE is_deleted = 0`;
    if (!includeInactive) {
        sql += ` AND is_active = 1`;
    }
    sql += ` ORDER BY display_order ASC, name ASC`;
    const [rows] = await appDB.query(sql);
    return rows;
};

export const getGoalCategoryById = async (categoryId) => {
    const [rows] = await appDB.query(
        `SELECT * FROM goal_categories WHERE category_id = ? AND is_deleted = 0`,
        [categoryId]
    );
    return rows[0] || null;
};

export const createGoalCategory = async ({ name, description, is_active = 1, display_order = 0 }) => {
    const category_id = generateID("CAT");
    const [result] = await appDB.query(
        `INSERT INTO goal_categories (category_id, name, description, is_active, display_order) VALUES (?, ?, ?, ?, ?)`,
        [category_id, name, description || null, is_active ? 1 : 0, Number(display_order) || 0]
    );
    return category_id;
};

export const updateGoalCategory = async (categoryId, { name, description, is_active, display_order }) => {
    const fields = [];
    const params = [];

    if (name !== undefined) { fields.push("name = ?"); params.push(name); }
    if (description !== undefined) { fields.push("description = ?"); params.push(description); }
    if (is_active !== undefined) { fields.push("is_active = ?"); params.push(is_active ? 1 : 0); }
    if (display_order !== undefined) { fields.push("display_order = ?"); params.push(Number(display_order) || 0); }

    if (fields.length === 0) return false;

    params.push(categoryId);
    const [result] = await appDB.query(
        `UPDATE goal_categories SET ${fields.join(", ")} WHERE category_id = ? AND is_deleted = 0`,
        params
    );
    return result.affectedRows > 0;
};

export const deleteGoalCategory = async (categoryId) => {
    // Prevent deletion if in use by active goals
    const [usage] = await appDB.query(
        `SELECT COUNT(*) as count FROM goals WHERE category_id = ? AND is_deleted = 0`,
        [categoryId]
    );
    if (usage[0].count > 0) {
        throw new Error(`Cannot delete category because it is assigned to ${usage[0].count} active goal(s).`);
    }

    const [result] = await appDB.query(
        `UPDATE goal_categories SET is_deleted = 1, deleted_at = NOW() WHERE category_id = ?`,
        [categoryId]
    );
    return result.affectedRows > 0;
};


// ==========================================
// BUSINESS IMPACTS
// ==========================================

export const getBusinessImpacts = async ({ includeInactive = false } = {}) => {
    let sql = `SELECT * FROM goal_business_impacts WHERE is_deleted = 0`;
    if (!includeInactive) {
        sql += ` AND is_active = 1`;
    }
    sql += ` ORDER BY display_order ASC, name ASC`;
    const [rows] = await appDB.query(sql);
    return rows;
};

export const getBusinessImpactById = async (impactId) => {
    const [rows] = await appDB.query(
        `SELECT * FROM goal_business_impacts WHERE impact_id = ? AND is_deleted = 0`,
        [impactId]
    );
    return rows[0] || null;
};

export const createBusinessImpact = async ({ name, description, is_active = 1, display_order = 0 }) => {
    const impact_id = generateID("IMP");
    const [result] = await appDB.query(
        `INSERT INTO goal_business_impacts (impact_id, name, description, is_active, display_order) VALUES (?, ?, ?, ?, ?)`,
        [impact_id, name, description || null, is_active ? 1 : 0, Number(display_order) || 0]
    );
    return impact_id;
};

export const updateBusinessImpact = async (impactId, { name, description, is_active, display_order }) => {
    const fields = [];
    const params = [];

    if (name !== undefined) { fields.push("name = ?"); params.push(name); }
    if (description !== undefined) { fields.push("description = ?"); params.push(description); }
    if (is_active !== undefined) { fields.push("is_active = ?"); params.push(is_active ? 1 : 0); }
    if (display_order !== undefined) { fields.push("display_order = ?"); params.push(Number(display_order) || 0); }

    if (fields.length === 0) return false;

    params.push(impactId);
    const [result] = await appDB.query(
        `UPDATE goal_business_impacts SET ${fields.join(", ")} WHERE impact_id = ? AND is_deleted = 0`,
        params
    );
    return result.affectedRows > 0;
};

export const deleteBusinessImpact = async (impactId) => {
    // Prevent deletion if in use
    const [usage] = await appDB.query(
        `SELECT COUNT(*) as count FROM goals WHERE business_impact_id = ? AND is_deleted = 0`,
        [impactId]
    );
    if (usage[0].count > 0) {
        throw new Error(`Cannot delete Business Impact because it is assigned to ${usage[0].count} active goal(s).`);
    }

    const [result] = await appDB.query(
        `UPDATE goal_business_impacts SET is_deleted = 1, deleted_at = NOW() WHERE impact_id = ?`,
        [impactId]
    );
    return result.affectedRows > 0;
};


// ==========================================
// GOAL STATUSES
// ==========================================

export const getGoalStatuses = async ({ includeInactive = false } = {}) => {
    let sql = `SELECT * FROM goal_statuses WHERE is_deleted = 0`;
    if (!includeInactive) {
        sql += ` AND is_active = 1`;
    }
    sql += ` ORDER BY display_order ASC, name ASC`;
    const [rows] = await appDB.query(sql);
    return rows;
};

export const getGoalStatusById = async (statusId) => {
    const [rows] = await appDB.query(
        `SELECT * FROM goal_statuses WHERE status_id = ? AND is_deleted = 0`,
        [statusId]
    );
    return rows[0] || null;
};

export const createGoalStatus = async ({ name, code, description, badge_color = '#64748b', icon = 'Circle', is_completed_status = 0, is_active = 1, is_default = 0, display_order = 0 }) => {
    const status_id = generateID("STAT");
    const statusCode = code || name.toLowerCase().replace(/[^a-z0-9]+/g, '_');

    if (is_default) {
        // Clear previous default
        await appDB.query(`UPDATE goal_statuses SET is_default = 0 WHERE is_deleted = 0`);
    }

    const [result] = await appDB.query(
        `INSERT INTO goal_statuses (status_id, name, code, description, badge_color, icon, is_completed_status, is_active, is_default, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [status_id, name, statusCode, description || null, badge_color, icon, is_completed_status ? 1 : 0, is_active ? 1 : 0, is_default ? 1 : 0, Number(display_order) || 0]
    );
    return status_id;
};

export const updateGoalStatus = async (statusId, { name, code, description, badge_color, icon, is_completed_status, is_active, is_default, display_order }) => {
    const fields = [];
    const params = [];

    if (is_default) {
        await appDB.query(`UPDATE goal_statuses SET is_default = 0 WHERE is_deleted = 0`);
    }

    if (name !== undefined) { fields.push("name = ?"); params.push(name); }
    if (code !== undefined) { fields.push("code = ?"); params.push(code); }
    if (description !== undefined) { fields.push("description = ?"); params.push(description); }
    if (badge_color !== undefined) { fields.push("badge_color = ?"); params.push(badge_color); }
    if (icon !== undefined) { fields.push("icon = ?"); params.push(icon); }
    if (is_completed_status !== undefined) { fields.push("is_completed_status = ?"); params.push(is_completed_status ? 1 : 0); }
    if (is_active !== undefined) { fields.push("is_active = ?"); params.push(is_active ? 1 : 0); }
    if (is_default !== undefined) { fields.push("is_default = ?"); params.push(is_default ? 1 : 0); }
    if (display_order !== undefined) { fields.push("display_order = ?"); params.push(Number(display_order) || 0); }

    if (fields.length === 0) return false;

    params.push(statusId);
    const [result] = await appDB.query(
        `UPDATE goal_statuses SET ${fields.join(", ")} WHERE status_id = ? AND is_deleted = 0`,
        params
    );
    return result.affectedRows > 0;
};

export const deleteGoalStatus = async (statusId) => {
    // Prevent deletion if in use
    const [usage] = await appDB.query(
        `SELECT COUNT(*) as count FROM goals WHERE status_id = ? AND is_deleted = 0`,
        [statusId]
    );
    if (usage[0].count > 0) {
        throw new Error(`Cannot delete Status because it is assigned to ${usage[0].count} active goal(s).`);
    }

    const [result] = await appDB.query(
        `UPDATE goal_statuses SET is_deleted = 1, deleted_at = NOW() WHERE status_id = ?`,
        [statusId]
    );
    return result.affectedRows > 0;
};

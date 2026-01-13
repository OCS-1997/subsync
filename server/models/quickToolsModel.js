import appDB from '../db/subsyncDB.js';

/**
 * Get all tools available to a specific role
 * @param {string} roleKey - Role key (admin, manager, sales, support, viewer)
 * @returns {Promise<Array>}
 */
export async function getToolsForRole(roleKey) {
    const [rows] = await appDB.query(
        `SELECT tool_id, name, url_template, icon, roles_allowed, is_active, sort_order, created_at, updated_at
         FROM quick_tools
         WHERE is_active = 1
         AND JSON_CONTAINS(roles_allowed, ?)
         ORDER BY sort_order ASC, name ASC`,
        [JSON.stringify(roleKey)]
    );
    return rows;
}

/**
 * Get all tools (admin only)
 * @returns {Promise<Array>}
 */
export async function getAllTools() {
    const [rows] = await appDB.query(
        `SELECT tool_id, name, url_template, icon, roles_allowed, is_active, sort_order, created_at, updated_at
         FROM quick_tools
         ORDER BY sort_order ASC, name ASC`
    );
    return rows;
}

/**
 * Get tool by ID
 * @param {number} toolId
 * @returns {Promise<Object|null>}
 */
export async function getToolById(toolId) {
    const [rows] = await appDB.query(
        `SELECT tool_id, name, url_template, icon, roles_allowed, is_active, sort_order, created_at, updated_at
         FROM quick_tools
         WHERE tool_id = ?`,
        [toolId]
    );
    return rows[0] || null;
}

/**
 * Create a new tool
 * @param {Object} toolData
 * @returns {Promise<Object>}
 */
export async function createTool(toolData) {
    const {
        name,
        url_template,
        icon,
        roles_allowed,
        is_active = 1,
        sort_order = 0
    } = toolData;

    const [result] = await appDB.query(
        `INSERT INTO quick_tools (name, url_template, icon, roles_allowed, is_active, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, url_template, icon, JSON.stringify(roles_allowed), is_active, sort_order]
    );

    return { tool_id: result.insertId };
}

/**
 * Update a tool
 * @param {number} toolId
 * @param {Object} toolData
 * @returns {Promise<boolean>}
 */
export async function updateTool(toolId, toolData) {
    const {
        name,
        url_template,
        icon,
        roles_allowed,
        is_active,
        sort_order
    } = toolData;

    const [result] = await appDB.query(
        `UPDATE quick_tools
         SET name = ?, url_template = ?, icon = ?, roles_allowed = ?, is_active = ?, sort_order = ?
         WHERE tool_id = ?`,
        [name, url_template, icon, JSON.stringify(roles_allowed), is_active, sort_order, toolId]
    );

    return result.affectedRows > 0;
}

/**
 * Delete a tool
 * @param {number} toolId
 * @returns {Promise<boolean>}
 */
export async function deleteTool(toolId) {
    const [result] = await appDB.query(
        `DELETE FROM quick_tools WHERE tool_id = ?`,
        [toolId]
    );
    return result.affectedRows > 0;
}


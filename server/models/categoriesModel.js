import appDB from "../db/subsyncDB.js";
import { getCurrentTime } from "../middlewares/time.js";

/**
 * Create a new activity type/category
 * @param {Object} category - Category data
 * @returns {Promise<number>} - Category ID
 */
async function createCategory(category) {
    try {
        const currentTime = getCurrentTime();

        const [result] = await appDB.query(
            `INSERT INTO time_activity_types (
                type_name, type_code, description, color, icon,
                is_billable_default, is_active, display_order, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                category.type_name,
                category.type_code,
                category.description || null,
                category.color || '#6b7280',
                category.icon || 'Clock',
                category.is_billable_default !== undefined ? category.is_billable_default : false,
                category.is_active !== undefined ? category.is_active : true,
                category.display_order || 0,
                currentTime
            ]
        );

        if (result.affectedRows > 0) {
            return result.insertId;
        } else {
            throw new Error("Failed to create category");
        }
    } catch (error) {
        console.error("Error creating category:", error);
        throw error;
    }
}

/**
 * Update an existing category
 * @param {number} categoryId - Category ID
 * @param {Object} data - Updated data
 * @returns {Promise<Object>}
 */
async function updateCategory(categoryId, data) {
    try {
        const [result] = await appDB.query(
            `UPDATE time_activity_types SET
                type_name = COALESCE(?, type_name),
                type_code = COALESCE(?, type_code),
                description = COALESCE(?, description),
                color = COALESCE(?, color),
                icon = COALESCE(?, icon),
                is_billable_default = COALESCE(?, is_billable_default),
                is_active = COALESCE(?, is_active),
                display_order = COALESCE(?, display_order)
            WHERE id = ?`,
            [
                data.type_name,
                data.type_code,
                data.description,
                data.color,
                data.icon,
                data.is_billable_default,
                data.is_active,
                data.display_order,
                categoryId
            ]
        );

        if (result.affectedRows === 0) {
            throw new Error("Category not found or no changes made");
        }

        return result;
    } catch (error) {
        console.error("Error updating category:", error);
        throw error;
    }
}

/**
 * Delete a category (soft delete by marking inactive)
 * @param {number} categoryId - Category ID
 * @returns {Promise<Object>}
 */
async function deleteCategory(categoryId) {
    try {
        const [result] = await appDB.query(
            `UPDATE time_activity_types SET is_active = FALSE WHERE id = ?`,
            [categoryId]
        );

        if (result.affectedRows === 0) {
            throw new Error("Category not found");
        }

        return result;
    } catch (error) {
        console.error("Error deleting category:", error);
        throw error;
    }
}

/**
 * Get all categories with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>}
 */
async function getAllCategories({ search = "", isActive }) {
    try {
        const searchQuery = `%${search}%`;
        
        let whereConditions = [];
        let params = [];

        if (search) {
            whereConditions.push('(type_name LIKE ? OR type_code LIKE ? OR description LIKE ?)');
            params.push(searchQuery, searchQuery, searchQuery);
        }

        if (isActive !== undefined) {
            whereConditions.push('is_active = ?');
            params.push(isActive);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        const [categories] = await appDB.query(
            `SELECT 
                at.*,
                COUNT(DISTINCT te.id) as total_entries,
                SUM(te.duration_minutes) as total_minutes
             FROM time_activity_types at
             LEFT JOIN time_entries te ON at.id = te.activity_type_id AND te.deleted_at IS NULL
             ${whereClause}
             GROUP BY at.id
             ORDER BY at.display_order ASC, at.type_name ASC`,
            params
        );

        return categories;
    } catch (error) {
        console.error("Error fetching categories:", error);
        throw error;
    }
}

/**
 * Get a single category by ID
 * @param {number} categoryId - Category ID
 * @returns {Promise<Object|null>}
 */
async function getCategoryById(categoryId) {
    try {
        const [categories] = await appDB.query(
            `SELECT 
                at.*,
                COUNT(DISTINCT te.id) as total_entries,
                SUM(te.duration_minutes) as total_minutes
             FROM time_activity_types at
             LEFT JOIN time_entries te ON at.id = te.activity_type_id AND te.deleted_at IS NULL
             WHERE at.id = ?
             GROUP BY at.id`,
            [categoryId]
        );

        return categories[0] || null;
    } catch (error) {
        console.error("Error fetching category by ID:", error);
        throw error;
    }
}

/**
 * Get category statistics
 * @param {number} categoryId - Category ID
 * @returns {Promise<Object>}
 */
async function getCategoryStats(categoryId) {
    try {
        const [[stats]] = await appDB.query(
            `SELECT 
                COUNT(DISTINCT te.id) as total_entries,
                COUNT(DISTINCT te.user_id) as unique_users,
                SUM(te.duration_minutes) as total_minutes,
                SUM(CASE WHEN te.is_billable = TRUE THEN te.duration_minutes ELSE 0 END) as billable_minutes,
                SUM(CASE WHEN te.is_billable = FALSE THEN te.duration_minutes ELSE 0 END) as non_billable_minutes,
                MIN(te.start_time) as first_entry_date,
                MAX(te.start_time) as last_entry_date
             FROM time_entries te
             WHERE te.activity_type_id = ? AND te.deleted_at IS NULL AND te.end_time IS NOT NULL`,
            [categoryId]
        );

        return stats;
    } catch (error) {
        console.error("Error fetching category stats:", error);
        throw error;
    }
}

export {
    createCategory,
    updateCategory,
    deleteCategory,
    getAllCategories,
    getCategoryById,
    getCategoryStats
};

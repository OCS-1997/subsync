import appDB from "../db/subsyncDB.js";
import { getCurrentTime } from "../middlewares/time.js";

/**
 * Create a new project
 * @param {Object} project - Project data
 * @returns {Promise<number>} - Project ID
 */
async function createProject(project) {
    try {
        const currentTime = getCurrentTime();

        const [result] = await appDB.query(
            `INSERT INTO time_projects (
                project_name, project_code, customer_id, team_id, description,
                color, estimated_hours, is_active, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                project.project_name,
                (project.project_code === '' || project.project_code === undefined) ? null : project.project_code,
                (project.customer_id === '' || project.customer_id === undefined) ? null : project.customer_id,
                (project.team_id === '' || project.team_id === undefined) ? null : project.team_id,
                (project.description === '' || project.description === undefined) ? null : project.description,
                project.color || '#3b82f6',
                (project.estimated_hours === '' || project.estimated_hours === undefined) ? null : project.estimated_hours,
                project.is_active !== undefined ? project.is_active : true,
                project.created_by,
                currentTime,
                currentTime
            ]
        );

        if (result.affectedRows > 0) {
            return result.insertId;
        } else {
            throw new Error("Failed to create project");
        }
    } catch (error) {
        console.error("Error creating project:", error);
        throw error;
    }
}

/**
 * Update an existing project
 * @param {number} projectId - Project ID
 * @param {Object} data - Updated data
 * @returns {Promise<Object>}
 */
async function updateProject(projectId, data) {
    try {
        const currentTime = getCurrentTime();

        // Sanitize data: convert empty strings to null for optional fields
        const projectName = data.project_name || null;
        const projectCode = (data.project_code === '' || data.project_code === undefined) ? null : data.project_code;
        const customerId = (data.customer_id === '' || data.customer_id === undefined) ? null : data.customer_id;
        const teamId = (data.team_id === '' || data.team_id === undefined) ? null : data.team_id;
        const description = (data.description === '' || data.description === undefined) ? null : data.description;
        const color = data.color || null;
        const estimatedHours = (data.estimated_hours === '' || data.estimated_hours === undefined) ? null : data.estimated_hours;
        const isActive = data.is_active !== undefined ? data.is_active : null;

        const [result] = await appDB.query(
            `UPDATE time_projects SET
                project_name = COALESCE(?, project_name),
                project_code = ?,
                customer_id = ?,
                team_id = ?,
                description = ?,
                color = COALESCE(?, color),
                estimated_hours = ?,
                is_active = COALESCE(?, is_active),
                updated_at = ?
            WHERE id = ?`,
            [
                projectName,
                projectCode,
                customerId,
                teamId,
                description,
                color,
                estimatedHours,
                isActive,
                currentTime,
                projectId
            ]
        );

        if (result.affectedRows === 0) {
            throw new Error("Project not found or no changes made");
        }

        return result;
    } catch (error) {
        console.error("Error updating project:", error);
        throw error;
    }
}

/**
 * Delete a project (soft delete by marking inactive)
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>}
 */
async function deleteProject(projectId) {
    try {
        const currentTime = getCurrentTime();

        const [result] = await appDB.query(
            `UPDATE time_projects SET is_active = FALSE, updated_at = ? WHERE id = ?`,
            [currentTime, projectId]
        );

        if (result.affectedRows === 0) {
            throw new Error("Project not found");
        }

        return result;
    } catch (error) {
        console.error("Error deleting project:", error);
        throw error;
    }
}

/**
 * Get all projects with filters and pagination
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
async function getAllProjects({ search = "", customerId, isActive, page = 1, limit = 50 }) {
    try {
        const offset = (page - 1) * limit;
        const searchQuery = `%${search}%`;
        
        let whereConditions = [];
        let params = [];

        if (search) {
            whereConditions.push('(p.project_name LIKE ? OR p.project_code LIKE ? OR p.description LIKE ?)');
            params.push(searchQuery, searchQuery, searchQuery);
        }

        if (customerId) {
            whereConditions.push('p.customer_id = ?');
            params.push(customerId);
        }

        if (isActive !== undefined) {
            whereConditions.push('p.is_active = ?');
            params.push(isActive);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        const [projects] = await appDB.query(
            `SELECT 
                p.*,
                c.display_name as customer_name,
                t.team_name,
                u.name as creator_first_name,
                '' as creator_last_name,
                COUNT(DISTINCT te.id) as total_entries,
                SUM(te.duration_minutes) as total_minutes
             FROM time_projects p
             LEFT JOIN customers c ON p.customer_id = c.customer_id
             LEFT JOIN teams t ON p.team_id = t.id
             LEFT JOIN users u ON p.created_by = u.username
             LEFT JOIN time_entries te ON p.id = te.project_id AND te.deleted_at IS NULL
             ${whereClause}
             GROUP BY p.id
             ORDER BY p.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        const [[{ total }]] = await appDB.query(
            `SELECT COUNT(*) as total FROM time_projects p ${whereClause}`,
            params
        );

        const totalPages = Math.ceil(total / limit);

        return { projects, totalPages, totalRecords: total };
    } catch (error) {
        console.error("Error fetching projects:", error);
        throw error;
    }
}

/**
 * Get a single project by ID
 * @param {number} projectId - Project ID
 * @returns {Promise<Object|null>}
 */
async function getProjectById(projectId) {
    try {
        const [projects] = await appDB.query(
            `SELECT 
                p.*,
                c.display_name as customer_name,
                t.team_name,
                u.name as creator_first_name,
                '' as creator_last_name,
                COUNT(DISTINCT te.id) as total_entries,
                SUM(te.duration_minutes) as total_minutes
             FROM time_projects p
             LEFT JOIN customers c ON p.customer_id = c.customer_id
             LEFT JOIN teams t ON p.team_id = t.id
             LEFT JOIN users u ON p.created_by = u.username
             LEFT JOIN time_entries te ON p.id = te.project_id AND te.deleted_at IS NULL
             WHERE p.id = ?
             GROUP BY p.id`,
            [projectId]
        );

        return projects[0] || null;
    } catch (error) {
        console.error("Error fetching project by ID:", error);
        throw error;
    }
}

/**
 * Get project statistics
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>}
 */
async function getProjectStats(projectId) {
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
             WHERE te.project_id = ? AND te.deleted_at IS NULL AND te.end_time IS NOT NULL`,
            [projectId]
        );

        return stats;
    } catch (error) {
        console.error("Error fetching project stats:", error);
        throw error;
    }
}

export {
    createProject,
    updateProject,
    deleteProject,
    getAllProjects,
    getProjectById,
    getProjectStats
};

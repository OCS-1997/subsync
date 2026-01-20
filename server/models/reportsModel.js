import appDB from "../db/subsyncDB.js";

/**
 * Get detailed time reports with breakdowns
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
async function getDetailedReports({ userId, startDate, endDate, teamId }) {
    try {
        let whereConditions = ['te.deleted_at IS NULL', 'te.end_time IS NOT NULL'];
        let params = [];

        if (userId) {
            whereConditions.push('te.user_id = ?');
            params.push(userId);
        }

        if (teamId) {
            whereConditions.push('te.team_id = ?');
            params.push(teamId);
        }

        if (startDate) {
            whereConditions.push('te.start_time >= ?');
            params.push(startDate);
        }

        if (endDate) {
            whereConditions.push('te.start_time <= ?');
            params.push(endDate);
        }

        const whereClause = whereConditions.join(' AND ');

        // Overall summary
        const [[summary]] = await appDB.query(
            `SELECT 
                COUNT(*) as total_entries,
                SUM(duration_minutes) as total_minutes,
                SUM(CASE WHEN is_billable = TRUE THEN duration_minutes ELSE 0 END) as billable_minutes,
                SUM(CASE WHEN is_billable = FALSE THEN duration_minutes ELSE 0 END) as non_billable_minutes,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT customer_id) as unique_customers,
                COUNT(DISTINCT project_id) as unique_projects
             FROM time_entries te
             WHERE ${whereClause}`,
            params
        );

        // Breakdown by project
        const [byProject] = await appDB.query(
            `SELECT 
                p.id,
                p.project_name,
                p.color,
                c.display_name as customer_name,
                SUM(te.duration_minutes) as total_minutes,
                SUM(CASE WHEN te.is_billable = TRUE THEN te.duration_minutes ELSE 0 END) as billable_minutes,
                COUNT(te.id) as entry_count
             FROM time_entries te
             LEFT JOIN time_projects p ON te.project_id = p.id
             LEFT JOIN customers c ON p.customer_id = c.customer_id
             WHERE ${whereClause} AND te.project_id IS NOT NULL
             GROUP BY p.id, p.project_name, p.color, c.display_name
             ORDER BY total_minutes DESC
             LIMIT 20`,
            params
        );

        // Breakdown by customer
        const [byCustomer] = await appDB.query(
            `SELECT 
                c.customer_id,
                c.display_name as customer_name,
                SUM(te.duration_minutes) as total_minutes,
                SUM(CASE WHEN te.is_billable = TRUE THEN te.duration_minutes ELSE 0 END) as billable_minutes,
                COUNT(te.id) as entry_count
             FROM time_entries te
             LEFT JOIN customers c ON te.customer_id = c.customer_id
             WHERE ${whereClause} AND te.customer_id IS NOT NULL
             GROUP BY c.customer_id, c.display_name
             ORDER BY total_minutes DESC
             LIMIT 20`,
            params
        );

        // Breakdown by activity type
        const [byActivity] = await appDB.query(
            `SELECT 
                at.id,
                at.type_name,
                at.color,
                SUM(te.duration_minutes) as total_minutes,
                SUM(CASE WHEN te.is_billable = TRUE THEN te.duration_minutes ELSE 0 END) as billable_minutes,
                COUNT(te.id) as entry_count
             FROM time_entries te
             LEFT JOIN time_activity_types at ON te.activity_type_id = at.id
             WHERE ${whereClause}
             GROUP BY at.id, at.type_name, at.color
             ORDER BY total_minutes DESC`,
            params
        );

        // Daily breakdown (for trends)
        const [dailyTrend] = await appDB.query(
            `SELECT 
                DATE(te.start_time) as date,
                SUM(te.duration_minutes) as total_minutes,
                SUM(CASE WHEN te.is_billable = TRUE THEN te.duration_minutes ELSE 0 END) as billable_minutes,
                COUNT(te.id) as entry_count
             FROM time_entries te
             WHERE ${whereClause}
             GROUP BY DATE(te.start_time)
             ORDER BY date ASC`,
            params
        );

        // Top users (if viewing team data)
        let topUsers = [];
        if (!userId || teamId) {
            const [users] = await appDB.query(
                `SELECT 
                    u.username,
                    u.name as first_name,
                    '' as last_name,
                    SUM(te.duration_minutes) as total_minutes,
                    SUM(CASE WHEN te.is_billable = TRUE THEN te.duration_minutes ELSE 0 END) as billable_minutes,
                    COUNT(te.id) as entry_count
                 FROM time_entries te
                 LEFT JOIN users u ON te.user_id = u.username
                 WHERE ${whereClause}
                 GROUP BY u.username, u.name
                 ORDER BY total_minutes DESC
                 LIMIT 10`,
                params
            );
            topUsers = users;
        }

        return {
            summary,
            byProject,
            byCustomer,
            byActivity,
            dailyTrend,
            topUsers
        };
    } catch (error) {
        console.error("Error fetching detailed reports:", error);
        throw error;
    }
}

/**
 * Get time entries grouped for export
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>}
 */
async function getEntriesForExport({ userId, startDate, endDate, customerId, projectId }) {
    try {
        let whereConditions = ['te.deleted_at IS NULL', 'te.end_time IS NOT NULL'];
        let params = [];

        if (userId) {
            whereConditions.push('te.user_id = ?');
            params.push(userId);
        }

        if (startDate) {
            whereConditions.push('te.start_time >= ?');
            params.push(startDate);
        }

        if (endDate) {
            whereConditions.push('te.start_time <= ?');
            params.push(endDate);
        }

        if (customerId) {
            whereConditions.push('te.customer_id = ?');
            params.push(customerId);
        }

        if (projectId) {
            whereConditions.push('te.project_id = ?');
            params.push(projectId);
        }

        const whereClause = whereConditions.join(' AND ');

        const [entries] = await appDB.query(
            `SELECT 
                te.entry_id,
                te.start_time,
                te.end_time,
                te.duration_minutes,
                te.title,
                te.description,
                te.is_billable,
                u.name as first_name,
                '' as last_name,
                c.display_name as customer_name,
                p.project_name,
                at.type_name as activity_type
             FROM time_entries te
             LEFT JOIN users u ON te.user_id = u.username
             LEFT JOIN customers c ON te.customer_id = c.customer_id
             LEFT JOIN time_projects p ON te.project_id = p.id
             LEFT JOIN time_activity_types at ON te.activity_type_id = at.id
             WHERE ${whereClause}
             ORDER BY te.start_time DESC`,
            params
        );

        return entries;
    } catch (error) {
        console.error("Error fetching entries for export:", error);
        throw error;
    }
}

export {
    getDetailedReports,
    getEntriesForExport
};

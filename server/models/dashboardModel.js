import appDB from "../db/subsyncDB.js";

/**
 * Get renewals with filters
 * @param {Object} filters - { filterType: 'today'|'expired'|'current'|'custom', startDate?, endDate? }
 */
export async function getRenewalsWithFilters(filters = {}) {
    const { filterType = 'today', startDate, endDate } = filters;
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    let whereClause = 'WHERE s.archived_at IS NULL';
    const params = [];

    switch (filterType) {
        case 'today':
            whereClause += ` AND DATE(s.end_date) = DATE(?)`;
            params.push(now);
            break;
        case 'expired':
            whereClause += ` AND s.end_date < ?`;
            params.push(now);
            break;
        case 'current':
            // Current month
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            whereClause += ` AND s.end_date >= ? AND s.end_date <= ?`;
            params.push(monthStart, monthEnd);
            break;
        case 'custom':
            if (startDate && endDate) {
                const customStart = new Date(startDate);
                customStart.setHours(0, 0, 0, 0);
                const customEnd = new Date(endDate);
                customEnd.setHours(23, 59, 59, 999);
                whereClause += ` AND s.end_date >= ? AND s.end_date <= ?`;
                params.push(customStart, customEnd);
            }
            break;
    }

    const [subscriptions] = await appDB.query(
        `SELECT s.sub_id, s.domain_name, s.end_date, s.start_date, s.status, s.total,
                c.display_name AS customer_name, c.customer_id,
                DATEDIFF(s.end_date, ?) AS days_left,
                CASE 
                    WHEN s.end_date < ? THEN 'expired'
                    WHEN DATE(s.end_date) = DATE(?) THEN 'today'
                    WHEN s.end_date <= DATE_ADD(?, INTERVAL 7 DAY) THEN 'soon'
                    ELSE 'upcoming'
                END AS renewal_status,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'service_name', si.service_name,
                            'quantity', si.quantity,
                            'rate', si.rate,
                            'amount', si.amount
                        )
                    )
                    FROM subscription_items si
                    WHERE si.sub_id = s.sub_id
                ) AS services
         FROM subscriptions s
         JOIN customers c ON s.customer_id = c.customer_id
         ${whereClause}
         ORDER BY s.end_date ASC`,
        [now, now, now, now, ...params]
    );

    // Parse the services JSON for each subscription
    return subscriptions.map(sub => ({
        ...sub,
        services: sub.services ? (typeof sub.services === 'string' ? JSON.parse(sub.services) : sub.services) : []
    }));
}

/**
 * Get expired services with date filter
 * @param {Object} filters - { startDate?, endDate? }
 */
export async function getExpiredServices(filters = {}) {
    const { startDate, endDate } = filters;
    const now = new Date();

    let whereClause = 'WHERE s.archived_at IS NULL AND s.end_date < ?';
    const whereParams = [now];

    if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        whereClause += ` AND s.end_date >= ?`;
        whereParams.push(start);
    }

    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause += ` AND s.end_date <= ?`;
        whereParams.push(end);
    }

    // DATEDIFF needs now as first param, then WHERE clause params
    const queryParams = [now, ...whereParams];

    const [subscriptions] = await appDB.query(
        `SELECT s.sub_id, s.domain_name, s.end_date, s.start_date,
                c.display_name AS customer_name, c.customer_id,
                DATEDIFF(?, s.end_date) AS days_expired
         FROM subscriptions s
         JOIN customers c ON s.customer_id = c.customer_id
         ${whereClause}
         ORDER BY s.end_date DESC`,
        queryParams
    );

    return subscriptions;
}

/**
 * Get expiring today count
 */
export async function getExpiringTodayCount() {
    const now = new Date();
    const [result] = await appDB.query(
        `SELECT COUNT(*) as count
         FROM subscriptions s
         WHERE s.archived_at IS NULL
         AND DATE(s.end_date) = DATE(?)`,
        [now]
    );
    return result[0]?.count || 0;
}

/**
 * Get dashboard stats for Overview tab
 */
export async function getDashboardStats() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Helper to safely query and return 0 on errors (e.g., missing tables)
    const safeQuery = async (query, params = []) => {
        try {
            const [result] = await appDB.query(query, params);
            return result;
        } catch (err) {
            console.warn('Dashboard stats query failed:', err.message);
            return [{ count: 0, revenue: 0 }];
        }
    };

    // Get all stats in parallel
    const [
        customers,
        activeSubscriptions,
        expiredSubscriptions,
        monthlyRevenue,
        todayDCRs,
        openOpportunities,
        kbArticles
    ] = await Promise.all([
        // Total customers
        safeQuery('SELECT COUNT(*) as count FROM customers'),
        // Active subscriptions
        safeQuery('SELECT COUNT(*) as count FROM subscriptions WHERE archived_at IS NULL AND end_date >= ?', [now]),
        // Expired subscriptions
        safeQuery('SELECT COUNT(*) as count FROM subscriptions WHERE archived_at IS NULL AND end_date < ?', [now]),
        // Monthly revenue (sum of subscription totals that are active this month)
        safeQuery(`
            SELECT COALESCE(SUM(total), 0) as revenue 
            FROM subscriptions 
            WHERE archived_at IS NULL 
            AND start_date <= ? 
            AND end_date >= ?
        `, [monthEnd, monthStart]),
        // Today's DCRs
        safeQuery('SELECT COUNT(*) as count FROM dcr_entries WHERE DATE(timestamp) = DATE(?)', [now]),
        // Open opportunities (not Won or Lost based on status_name)
        safeQuery(`
            SELECT COUNT(*) as count 
            FROM opportunities o 
            JOIN opportunity_statuses s ON o.status_id = s.id 
            WHERE o.is_deleted = 0 
            AND s.status_name NOT IN ('Won', 'Lost', 'Closed Won', 'Closed Lost')
        `),
        // KB Articles (may not exist)
        safeQuery('SELECT COUNT(*) as count FROM knowledge_articles WHERE is_published = 1')
    ]);

    return {
        totalCustomers: customers[0]?.count || 0,
        activeSubscriptions: activeSubscriptions[0]?.count || 0,
        expiredCount: expiredSubscriptions[0]?.count || 0,
        monthlyRevenue: parseFloat(monthlyRevenue[0]?.revenue) || 0,
        todayDCRs: todayDCRs[0]?.count || 0,
        openOpportunities: openOpportunities[0]?.count || 0,
        kbArticles: kbArticles[0]?.count || 0
    };
}

/**
 * Get monthly revenue trend for last 6 months
 */
export async function getMonthlyRevenueTrend() {
    const now = new Date();
    const months = [];

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            year: date.getFullYear(),
            month: date.getMonth(),
            monthStart: new Date(date.getFullYear(), date.getMonth(), 1),
            monthEnd: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999),
            label: date.toLocaleDateString('en-US', { month: 'short' })
        });
    }

    // Query revenue for each month
    const revenueData = await Promise.all(
        months.map(async (m) => {
            try {
                const [result] = await appDB.query(`
                    SELECT COALESCE(SUM(total), 0) as revenue
                    FROM subscriptions
                    WHERE archived_at IS NULL
                    AND start_date <= ?
                    AND end_date >= ?
                `, [m.monthEnd, m.monthStart]);

                return {
                    month: m.label,
                    revenue: parseFloat(result[0]?.revenue) || 0,
                    year: m.year,
                    monthIndex: m.month
                };
            } catch (err) {
                console.warn('Revenue query failed for month:', m.label, err.message);
                return { month: m.label, revenue: 0, year: m.year, monthIndex: m.month };
            }
        })
    );

    // Calculate month-over-month change
    const currentMonth = revenueData[5]?.revenue || 0;
    const lastMonth = revenueData[4]?.revenue || 0;
    const percentChange = lastMonth > 0
        ? Math.round(((currentMonth - lastMonth) / lastMonth) * 100 * 10) / 10
        : 0;

    return {
        trend: revenueData,
        currentMonth,
        lastMonth,
        percentChange,
        isPositive: percentChange >= 0
    };
}

/**
 * Get all dashboard tabs
 */
export async function getAllDashboardTabs() {
    const [tabs] = await appDB.query(
        `SELECT tab_key, name, description, icon, tab_order, is_enabled
         FROM dashboard_tabs
         WHERE is_enabled = 1
         ORDER BY tab_order ASC`
    );
    return tabs;
}

/**
 * Get visible tabs for a role
 */
export async function getVisibleTabs(roleId) {
    if (!roleId) return [];
    const [tabs] = await appDB.query(
        `SELECT t.tab_key, t.name, t.description, t.icon, t.tab_order
         FROM dashboard_tabs t
         JOIN dashboard_tab_role_permissions tp ON t.tab_key = tp.tab_key
         WHERE tp.role_id = ? AND tp.is_visible = 1 AND t.is_enabled = 1
         ORDER BY t.tab_order ASC`,
        [roleId]
    );
    return tabs;
}

/**
 * Get all dashboard widgets
 */
export async function getAllDashboardWidgets() {
    const [widgets] = await appDB.query(
        `SELECT widget_key, tab_key, name, description, is_enabled, widget_order
         FROM dashboard_widgets
         ORDER BY widget_order ASC`
    );
    return widgets;
}

/**
 * Get visible widgets for a role
 */
export async function getVisibleWidgets(roleId) {
    if (!roleId) return [];
    const [widgets] = await appDB.query(
        `SELECT w.widget_key, w.name, w.description
         FROM dashboard_widgets w
         JOIN dashboard_widget_role_permissions wp ON w.widget_key = wp.widget_key
         WHERE wp.role_id = ? AND wp.is_visible = 1 AND w.is_enabled = 1
         ORDER BY w.widget_order ASC`,
        [roleId]
    );
    return widgets.map(w => w.widget_key);
}

/**
 * Get dashboard config for a user (tabs + widgets they can see)
 */
export async function getDashboardConfig(roleId) {
    const [tabs, widgets] = await Promise.all([
        getVisibleTabs(roleId),
        getVisibleWidgets(roleId)
    ]);
    return { tabs, widgets };
}

/**
 * Get tab permissions for a role (for admin UI)
 */
export async function getTabPermissionsForRole(roleId) {
    const [permissions] = await appDB.query(
        `SELECT t.tab_key, t.name, t.description, t.icon,
                COALESCE(tp.is_visible, 0) as is_visible
         FROM dashboard_tabs t
         LEFT JOIN dashboard_tab_role_permissions tp 
           ON t.tab_key = tp.tab_key AND tp.role_id = ?
         WHERE t.is_enabled = 1
         ORDER BY t.tab_order ASC`,
        [roleId]
    );
    return permissions;
}

/**
 * Get widget permissions for a role (for admin UI)
 */
export async function getWidgetPermissionsForRole(roleId) {
    const [permissions] = await appDB.query(
        `SELECT w.widget_key, w.tab_key, w.name, w.description,
                COALESCE(wp.is_visible, 0) as is_visible
         FROM dashboard_widgets w
         LEFT JOIN dashboard_widget_role_permissions wp 
           ON w.widget_key = wp.widget_key AND wp.role_id = ?
         WHERE w.is_enabled = 1
         ORDER BY w.widget_order ASC`,
        [roleId]
    );
    return permissions;
}

/**
 * Update tab permissions for a role
 * @param {number} roleId 
 * @param {Array<{tabKey: string, isVisible: boolean}>} tabPermissions 
 */
export async function setTabPermissionsForRole(roleId, tabPermissions) {
    const conn = await appDB.getConnection();
    try {
        await conn.beginTransaction();

        // Delete existing permissions for this role
        await conn.query(
            'DELETE FROM dashboard_tab_role_permissions WHERE role_id = ?',
            [roleId]
        );

        // Insert new permissions
        if (tabPermissions.length > 0) {
            const values = tabPermissions.map(p => [roleId, p.tabKey, p.isVisible ? 1 : 0]);
            await conn.query(
                `INSERT INTO dashboard_tab_role_permissions (role_id, tab_key, is_visible)
                 VALUES ?`,
                [values]
            );
        }

        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

/**
 * Update widget permissions for a role
 * @param {number} roleId 
 * @param {Array<{widgetKey: string, isVisible: boolean}>} widgetPermissions 
 */
export async function setWidgetPermissionsForRole(roleId, widgetPermissions) {
    const conn = await appDB.getConnection();
    try {
        await conn.beginTransaction();

        // Delete existing permissions for this role
        await conn.query(
            'DELETE FROM dashboard_widget_role_permissions WHERE role_id = ?',
            [roleId]
        );

        // Insert new permissions
        if (widgetPermissions.length > 0) {
            const values = widgetPermissions.map(p => [roleId, p.widgetKey, p.isVisible ? 1 : 0]);
            await conn.query(
                `INSERT INTO dashboard_widget_role_permissions (role_id, widget_key, is_visible)
                 VALUES ?`,
                [values]
            );
        }

        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

/**
 * ============================================
 * TIME TRACKING ANALYTICS FUNCTIONS
 * ============================================
 */

/**
 * Get user's time tracking statistics
 * @param {string} userId - Username of the user
 * @param {string} period - 'today' | 'week' | 'month'
 */
export async function getUserTimeStats(userId, period = 'today') {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
        case 'today':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'week':
            // Start of current week (Monday)
            const dayOfWeek = now.getDay();
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            startDate = new Date(now);
            startDate.setDate(now.getDate() + diff);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
        default:
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
    }

    try {
        // Get total time tracked
        const [totalStats] = await appDB.query(`
            SELECT 
                COALESCE(SUM(duration_minutes), 0) as total_minutes,
                COUNT(*) as entry_count,
                SUM(CASE WHEN is_billable = 1 THEN duration_minutes ELSE 0 END) as billable_minutes
            FROM time_entries
            WHERE user_id = ?
            AND deleted_at IS NULL
            AND start_time >= ?
            AND start_time <= ?
            AND end_time IS NOT NULL
        `, [userId, startDate, endDate]);

        // Get active timer if any
        const [activeTimer] = await appDB.query(`
            SELECT 
                id, entry_id, title, start_time, activity_type_id,
                TIMESTAMPDIFF(MINUTE, start_time, NOW()) as elapsed_minutes
            FROM time_entries
            WHERE user_id = ?
            AND is_timer_running = 1
            AND deleted_at IS NULL
            LIMIT 1
        `, [userId]);

        // Get activity breakdown
        const [activityBreakdown] = await appDB.query(`
            SELECT 
                tat.type_name,
                tat.color,
                tat.icon,
                COALESCE(SUM(te.duration_minutes), 0) as total_minutes,
                COUNT(te.id) as entry_count
            FROM time_activity_types tat
            LEFT JOIN time_entries te ON tat.id = te.activity_type_id 
                AND te.user_id = ?
                AND te.deleted_at IS NULL
                AND te.start_time >= ?
                AND te.start_time <= ?
                AND te.end_time IS NOT NULL
            WHERE tat.is_active = 1
            GROUP BY tat.id, tat.type_name, tat.color, tat.icon
            HAVING total_minutes > 0
            ORDER BY total_minutes DESC
        `, [userId, startDate, endDate]);

        // Get project breakdown
        const [projectBreakdown] = await appDB.query(`
            SELECT 
                p.project_name,
                p.color,
                COALESCE(SUM(te.duration_minutes), 0) as total_minutes
            FROM time_projects p
            JOIN time_entries te ON p.id = te.project_id
            WHERE te.user_id = ?
            AND te.deleted_at IS NULL
            AND te.start_time >= ?
            AND te.start_time <= ?
            AND te.end_time IS NOT NULL
            GROUP BY p.id, p.project_name, p.color
            HAVING total_minutes > 0
            ORDER BY total_minutes DESC
        `, [userId, startDate, endDate]);

        // Get customer breakdown
        const [customerBreakdown] = await appDB.query(`
            SELECT 
                c.display_name as customer_name,
                COALESCE(SUM(te.duration_minutes), 0) as total_minutes
            FROM customers c
            JOIN time_entries te ON c.customer_id = te.customer_id
            WHERE te.user_id = ?
            AND te.deleted_at IS NULL
            AND te.start_time >= ?
            AND te.start_time <= ?
            AND te.end_time IS NOT NULL
            GROUP BY c.customer_id, c.display_name
            HAVING total_minutes > 0
            ORDER BY total_minutes DESC
        `, [userId, startDate, endDate]);

        return {
            period,
            startDate,
            endDate,
            totalMinutes: parseInt(totalStats[0]?.total_minutes) || 0,
            totalHours: parseFloat((totalStats[0]?.total_minutes / 60).toFixed(2)) || 0,
            entryCount: parseInt(totalStats[0]?.entry_count) || 0,
            billableMinutes: parseInt(totalStats[0]?.billable_minutes) || 0,
            billableHours: parseFloat((totalStats[0]?.billable_minutes / 60).toFixed(2)) || 0,
            activeTimer: activeTimer.length > 0 ? {
                ...activeTimer[0],
                elapsedMinutes: parseInt(activeTimer[0].elapsed_minutes)
            } : null,
            activityBreakdown: activityBreakdown.map(a => ({
                typeName: a.type_name,
                color: a.color,
                icon: a.icon,
                totalMinutes: parseInt(a.total_minutes),
                totalHours: parseFloat((a.total_minutes / 60).toFixed(2)),
                entryCount: parseInt(a.entry_count),
                percentage: totalStats[0]?.total_minutes > 0 
                    ? parseFloat(((a.total_minutes / totalStats[0].total_minutes) * 100).toFixed(1))
                    : 0
            })),
            projectBreakdown: projectBreakdown.map(p => ({
                projectName: p.project_name,
                color: p.color,
                totalMinutes: parseInt(p.total_minutes),
                totalHours: parseFloat((p.total_minutes / 60).toFixed(2))
            })),
            customerBreakdown: customerBreakdown.map(c => ({
                customerName: c.customer_name,
                totalMinutes: parseInt(c.total_minutes),
                totalHours: parseFloat((c.total_minutes / 60).toFixed(2))
            }))
        };
    } catch (error) {
        console.error('Error fetching user time stats:', error);
        throw error;
    }
}

/**
 * Get system-wide time tracking statistics (Admin only)
 * @param {string} period - 'today' | 'week' | 'month'
 */
export async function getSystemTimeStats(period = 'today') {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
        case 'today':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'week':
            const dayOfWeek = now.getDay();
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            startDate = new Date(now);
            startDate.setDate(now.getDate() + diff);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
        default:
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
    }

    try {
        // Get overall system stats
        const [overallStats] = await appDB.query(`
            SELECT 
                COALESCE(SUM(duration_minutes), 0) as total_minutes,
                COUNT(*) as entry_count,
                COUNT(DISTINCT user_id) as active_users,
                AVG(duration_minutes) as avg_entry_minutes,
                SUM(CASE WHEN is_billable = 1 THEN duration_minutes ELSE 0 END) as billable_minutes
            FROM time_entries
            WHERE deleted_at IS NULL
            AND start_time >= ?
            AND start_time <= ?
            AND end_time IS NOT NULL
        `, [startDate, endDate]);

        // Get activity type breakdown
        const [activityBreakdown] = await appDB.query(`
            SELECT 
                tat.type_name,
                tat.color,
                tat.icon,
                COALESCE(SUM(te.duration_minutes), 0) as total_minutes,
                COUNT(te.id) as entry_count,
                COUNT(DISTINCT te.user_id) as user_count
            FROM time_activity_types tat
            LEFT JOIN time_entries te ON tat.id = te.activity_type_id 
                AND te.deleted_at IS NULL
                AND te.start_time >= ?
                AND te.start_time <= ?
                AND te.end_time IS NOT NULL
            WHERE tat.is_active = 1
            GROUP BY tat.id, tat.type_name, tat.color, tat.icon
            HAVING total_minutes > 0
            ORDER BY total_minutes DESC
        `, [startDate, endDate]);

        // Get project breakdown (System)
        const [projectBreakdown] = await appDB.query(`
            SELECT 
                p.project_name,
                p.color,
                COALESCE(SUM(te.duration_minutes), 0) as total_minutes,
                COUNT(DISTINCT te.user_id) as user_count
            FROM time_projects p
            JOIN time_entries te ON p.id = te.project_id
            WHERE te.deleted_at IS NULL
            AND te.start_time >= ?
            AND te.start_time <= ?
            AND te.end_time IS NOT NULL
            GROUP BY p.id, p.project_name, p.color
            HAVING total_minutes > 0
            ORDER BY total_minutes DESC
        `, [startDate, endDate]);

        // Get customer breakdown (System)
        const [customerBreakdown] = await appDB.query(`
            SELECT 
                c.display_name as customer_name,
                COALESCE(SUM(te.duration_minutes), 0) as total_minutes,
                COUNT(DISTINCT te.user_id) as user_count
            FROM customers c
            JOIN time_entries te ON c.customer_id = te.customer_id
            WHERE te.deleted_at IS NULL
            AND te.start_time >= ?
            AND te.start_time <= ?
            AND te.end_time IS NOT NULL
            GROUP BY c.customer_id, c.display_name
            HAVING total_minutes > 0
            ORDER BY total_minutes DESC
        `, [startDate, endDate]);

        // Get top performers
        const [topPerformers] = await appDB.query(`
            SELECT 
                te.user_id,
                u.name as full_name,
                u.email,
                SUM(te.duration_minutes) as total_minutes,
                COUNT(te.id) as entry_count,
                AVG(te.duration_minutes) as avg_entry_minutes
            FROM time_entries te
            JOIN users u ON te.user_id = u.username
            WHERE te.deleted_at IS NULL
            AND te.start_time >= ?
            AND te.start_time <= ?
            AND te.end_time IS NOT NULL
            GROUP BY te.user_id, u.name, u.email
            ORDER BY total_minutes DESC
            LIMIT 10
        `, [startDate, endDate]);

        // Get team breakdown (if teams exist)
        const [teamBreakdown] = await appDB.query(`
            SELECT 
                t.id as team_id,
                t.team_name as team_name,
                COALESCE(SUM(te.duration_minutes), 0) as total_minutes,
                COUNT(DISTINCT te.user_id) as active_users,
                COUNT(te.id) as entry_count
            FROM teams t
            LEFT JOIN time_entries te ON t.id = te.team_id 
                AND te.deleted_at IS NULL
                AND te.start_time >= ?
                AND te.start_time <= ?
                AND te.end_time IS NOT NULL
            GROUP BY t.id, t.team_name
            HAVING total_minutes > 0
            ORDER BY total_minutes DESC
        `, [startDate, endDate]);

        const totalMinutes = parseInt(overallStats[0]?.total_minutes) || 0;
        const activeUsers = parseInt(overallStats[0]?.active_users) || 1;

        return {
            period,
            startDate,
            endDate,
            overall: {
                totalMinutes,
                totalHours: parseFloat((totalMinutes / 60).toFixed(2)),
                entryCount: parseInt(overallStats[0]?.entry_count) || 0,
                activeUsers,
                avgMinutesPerUser: parseFloat((totalMinutes / activeUsers).toFixed(2)),
                avgHoursPerUser: parseFloat((totalMinutes / activeUsers / 60).toFixed(2)),
                avgEntryMinutes: parseFloat(overallStats[0]?.avg_entry_minutes || 0).toFixed(2),
                billableMinutes: parseInt(overallStats[0]?.billable_minutes) || 0,
                billableHours: parseFloat((overallStats[0]?.billable_minutes / 60).toFixed(2))
            },
            activityBreakdown: activityBreakdown.map(a => ({
                typeName: a.type_name,
                color: a.color,
                icon: a.icon,
                totalMinutes: parseInt(a.total_minutes),
                totalHours: parseFloat((a.total_minutes / 60).toFixed(2)),
                entryCount: parseInt(a.entry_count),
                userCount: parseInt(a.user_count),
                percentage: totalMinutes > 0 
                    ? parseFloat(((a.total_minutes / totalMinutes) * 100).toFixed(1))
                    : 0
            })),
            topPerformers: topPerformers.map(p => ({
                userId: p.user_id,
                fullName: p.full_name,
                email: p.email,
                totalMinutes: parseInt(p.total_minutes),
                totalHours: parseFloat((p.total_minutes / 60).toFixed(2)),
                entryCount: parseInt(p.entry_count),
                avgEntryMinutes: parseFloat(p.avg_entry_minutes).toFixed(2)
            })),
            teamBreakdown: teamBreakdown.map(t => ({
                teamId: t.team_id,
                teamName: t.team_name,
                totalMinutes: parseInt(t.total_minutes),
                totalHours: parseFloat((t.total_minutes / 60).toFixed(2)),
                activeUsers: parseInt(t.active_users),
                entryCount: parseInt(t.entry_count),
                avgMinutesPerUser: parseFloat((t.total_minutes / t.active_users).toFixed(2))
            })),
            projectBreakdown: projectBreakdown.map(p => ({
                projectName: p.project_name,
                color: p.color,
                totalMinutes: parseInt(p.total_minutes),
                totalHours: parseFloat((p.total_minutes / 60).toFixed(2)),
                userCount: parseInt(p.user_count)
            })),
            customerBreakdown: customerBreakdown.map(c => ({
                customerName: c.customer_name,
                totalMinutes: parseInt(c.total_minutes),
                totalHours: parseFloat((c.total_minutes / 60).toFixed(2)),
                userCount: parseInt(c.user_count)
            }))
        };
    } catch (error) {
        console.error('Error fetching system time stats:', error);
        throw error;
    }
}

/**
 * Get productivity trend data for charts
 * @param {string} userId - Username (null for system-wide)
 * @param {number} days - Number of days to fetch (default 7)
 */
export async function getProductivityTrend(userId = null, days = 7) {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    try {
        const whereClause = userId 
            ? 'WHERE te.user_id = ? AND te.deleted_at IS NULL'
            : 'WHERE te.deleted_at IS NULL';
        
        const params = userId ? [userId] : [];

        const [trendData] = await appDB.query(`
            WITH RECURSIVE date_range AS (
                SELECT DATE(?) as date
                UNION ALL
                SELECT DATE_ADD(date, INTERVAL 1 DAY)
                FROM date_range
                WHERE date < DATE(?)
            )
            SELECT 
                dr.date,
                COALESCE(SUM(te.duration_minutes), 0) as total_minutes,
                COUNT(te.id) as entry_count,
                ${userId ? '1' : 'COUNT(DISTINCT te.user_id)'} as user_count
            FROM date_range dr
            LEFT JOIN time_entries te ON DATE(te.start_time) = dr.date
                ${whereClause.replace('WHERE', 'AND')}
                AND te.end_time IS NOT NULL
                AND te.deleted_at IS NULL
            GROUP BY dr.date
            ORDER BY dr.date ASC
        `, [startDate, endDate, ...params]);

        return trendData.map(d => ({
            date: d.date,
            totalMinutes: parseInt(d.total_minutes),
            totalHours: parseFloat((d.total_minutes / 60).toFixed(2)),
            entryCount: parseInt(d.entry_count),
            userCount: parseInt(d.user_count)
        }));
    } catch (error) {
        console.error('Error fetching productivity trend:', error);
        throw error;
    }
}

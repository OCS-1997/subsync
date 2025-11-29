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
        `SELECT s.sub_id, s.domain_name, s.end_date, s.start_date, s.status,
                c.display_name AS customer_name, c.customer_id,
                DATEDIFF(s.end_date, ?) AS days_left,
                CASE 
                    WHEN s.end_date < ? THEN 'expired'
                    WHEN DATE(s.end_date) = DATE(?) THEN 'today'
                    WHEN s.end_date <= DATE_ADD(?, INTERVAL 7 DAY) THEN 'soon'
                    ELSE 'upcoming'
                END AS renewal_status
         FROM subscriptions s
         JOIN customers c ON s.customer_id = c.customer_id
         ${whereClause}
         ORDER BY s.end_date ASC`,
        [now, now, now, now, ...params]
    );

    return subscriptions;
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

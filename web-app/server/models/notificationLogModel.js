import appDB from "../db/subsyncDB.js";

/**
 * Create or update notification log entry
 * @param {Object} logData
 * @param {string} logData.subscription_id
 * @param {string} logData.template_key
 * @param {Date|string} logData.sent_at
 * @param {string} logData.status 'queued'|'sent'|'failed'|'skipped'
 * @param {number|null} logData.user_id
 * @param {string|null} logData.provider_id
 * @param {number} logData.attempt
 * @param {string|null} logData.error
 * @param {string|null} logData.attachment_url
 * @returns {Promise<number>} The ID of the log entry
 */
export async function upsertNotificationLog({
    subscription_id,
    template_key,
    sent_at,
    status = 'queued',
    user_id = null,
    provider_id = null,
    attempt = 0,
    error = null,
    attachment_url = null
}) {
    try {
        const sentAtDate = sent_at instanceof Date ? sent_at : new Date(sent_at);

        const [result] = await appDB.query(`
            INSERT INTO notification_logs (
                subscription_id, template_key, sent_at, status, user_id,
                provider_id, attempt, error, attachment_url
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                status = VALUES(status),
                provider_id = VALUES(provider_id),
                attempt = VALUES(attempt),
                error = VALUES(error),
                attachment_url = VALUES(attachment_url),
                updated_at = CURRENT_TIMESTAMP
        `, [
            subscription_id,
            template_key,
            sentAtDate,
            status,
            user_id,
            provider_id,
            attempt,
            error,
            attachment_url
        ]);

        return result.insertId || result.affectedRows;
    } catch (error) {
        // Handle unique constraint violation gracefully
        if (error.code === 'ER_DUP_ENTRY') {
            // Try to update existing record
            const [updateResult] = await appDB.query(`
                UPDATE notification_logs
                SET status = ?, provider_id = ?, attempt = ?, error = ?, attachment_url = ?, updated_at = CURRENT_TIMESTAMP
                WHERE subscription_id = ? AND template_key = ? AND DATE(sent_at) = DATE(?)
            `, [
                status,
                provider_id,
                attempt,
                error,
                attachment_url,
                subscription_id,
                template_key,
                sentAtDate
            ]);
            return updateResult.affectedRows;
        }
        console.error("Error upserting notification log:", error);
        throw error;
    }
}

/**
 * Check if notification was already sent (idempotency check)
 * @param {string} subscriptionId
 * @param {string} templateKey
 * @param {Date|string} sentAt
 * @returns {Promise<boolean>}
 */
export async function isNotificationSent(subscriptionId, templateKey, sentAt) {
    try {
        const sentAtDate = sentAt instanceof Date ? sentAt : new Date(sentAt);
        const [logs] = await appDB.query(`
            SELECT id, status
            FROM notification_logs
            WHERE subscription_id = ? 
                AND template_key = ? 
                AND DATE(sent_at) = DATE(?)
                AND status = 'sent'
            LIMIT 1
        `, [subscriptionId, templateKey, sentAtDate]);

        return logs.length > 0;
    } catch (error) {
        console.error("Error checking notification sent status:", error);
        throw error;
    }
}

/**
 * Get notification logs with filters
 * @param {Object} filters
 * @param {string} filters.subscription_id
 * @param {string} filters.template_key
 * @param {string} filters.domain_name
 * @param {Date|string} filters.start_date
 * @param {Date|string} filters.end_date
 * @param {string} filters.status
 * @param {number} filters.page
 * @param {number} filters.limit
 * @returns {Promise<{logs: Array, total: number}>}
 */
export async function getNotificationLogs({
    subscription_id = null,
    template_key = null,
    domain_name = null,
    start_date = null,
    end_date = null,
    status = null,
    page = 1,
    limit = 50
} = {}) {
    try {
        const whereClauses = [];
        const params = [];

        if (subscription_id) {
            whereClauses.push(`nl.subscription_id = ?`);
            params.push(subscription_id);
        }
        if (template_key) {
            whereClauses.push(`nl.template_key = ?`);
            params.push(template_key);
        }
        if (domain_name) {
            whereClauses.push(`s.domain_name LIKE ?`);
            params.push(`%${domain_name}%`);
        }
        if (start_date) {
            whereClauses.push(`DATE(nl.sent_at) >= DATE(?)`);
            params.push(start_date);
        }
        if (end_date) {
            whereClauses.push(`DATE(nl.sent_at) <= DATE(?)`);
            params.push(end_date);
        }
        if (status) {
            whereClauses.push(`nl.status = ?`);
            params.push(status);
        }

        const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Count query
        const [countResult] = await appDB.query(`
            SELECT COUNT(*) as total
            FROM notification_logs nl
            LEFT JOIN subscriptions s ON nl.subscription_id = s.sub_id
            ${whereStr}
        `, params);

        const total = countResult[0].total;

        // Data query
        const offset = (page - 1) * limit;
        const [logs] = await appDB.query(`
            SELECT 
                nl.id,
                nl.subscription_id,
                nl.template_key,
                nl.sent_at,
                nl.status,
                nl.provider_id,
                nl.attempt,
                nl.error,
                nl.attachment_url,
                nl.created_at,
                nl.updated_at,
                s.domain_name,
                c.display_name as customer_name
            FROM notification_logs nl
            LEFT JOIN subscriptions s ON nl.subscription_id = s.sub_id
            LEFT JOIN customers c ON s.customer_id = c.customer_id
            ${whereStr}
            ORDER BY nl.sent_at DESC, nl.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        return {
            logs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error("Error fetching notification logs:", error);
        throw error;
    }
}

/**
 * Get notification log by ID
 * @param {number} logId
 * @returns {Promise<Object|null>}
 */
export async function getNotificationLogById(logId) {
    try {
        const [logs] = await appDB.query(`
            SELECT 
                nl.*,
                s.domain_name,
                c.display_name as customer_name
            FROM notification_logs nl
            LEFT JOIN subscriptions s ON nl.subscription_id = s.sub_id
            LEFT JOIN customers c ON s.customer_id = c.customer_id
            WHERE nl.id = ?
        `, [logId]);

        return logs.length > 0 ? logs[0] : null;
    } catch (error) {
        console.error("Error fetching notification log:", error);
        throw error;
    }
}

/**
 * Log failed job to failed_jobs table
 * @param {Object} jobData
 * @param {string} jobData.job_name
 * @param {Object} jobData.payload
 * @param {string} jobData.error
 * @param {number} jobData.attempts
 * @returns {Promise<number>}
 */
export async function logFailedJob({ job_name, payload, error, attempts }) {
    try {
        const [result] = await appDB.query(`
            INSERT INTO failed_jobs (job_name, payload, error, attempts)
            VALUES (?, ?, ?, ?)
        `, [job_name, JSON.stringify(payload), error, attempts]);

        return result.insertId;
    } catch (err) {
        console.error("Error logging failed job:", err);
        throw err;
    }
}


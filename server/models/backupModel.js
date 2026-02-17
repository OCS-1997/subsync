import appDB from '../db/subsyncDB.js';
import { getCurrentTime } from '../middlewares/time.js';

/**
 * Get all backup configurations
 * @param {Object} options
 * @param {number} options.page
 * @param {number} options.limit
 * @param {string} options.search
 * @returns {Promise<{configs: Array, totalPages: number, totalRecords: number}>}
 */
export async function getAllBackupConfigurations({ page = 1, limit = 10, search = null }) {
    try {
        const offset = (page - 1) * limit;
        const whereClauses = [];
        const params = [];

        if (search) {
            whereClauses.push('(name LIKE ? OR description LIKE ?)');
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern);
        }

        const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Count query
        const [[{ total }]] = await appDB.query(
            `SELECT COUNT(*) as total FROM backup_configurations ${whereClause}`,
            params
        );

        // Data query
        const [configs] = await appDB.query(
            `SELECT 
                id, name, description, enabled, schedule_type, schedule_time,
                schedule_day_of_week, schedule_day_of_month, timezone,
                retention_days, max_backups, compression,
                email_on_success, email_on_failure, email_recipients,
                created_by, last_run_at, last_run_status,
                created_at, updated_at
             FROM backup_configurations
             ${whereClause}
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        const totalPages = Math.ceil(total / limit);
        return { configs, totalPages, totalRecords: total };
    } catch (error) {
        console.error('Error fetching backup configurations:', error);
        throw error;
    }
}

/**
 * Get backup configuration by ID
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
export async function getBackupConfigurationById(id) {
    try {
        const [rows] = await appDB.query(
            `SELECT 
                id, name, description, enabled, schedule_type, schedule_time,
                schedule_day_of_week, schedule_day_of_month, timezone,
                retention_days, max_backups, compression,
                email_on_success, email_on_failure, email_recipients,
                created_by, last_run_at, last_run_status,
                created_at, updated_at
             FROM backup_configurations
             WHERE id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('Error fetching backup configuration:', error);
        throw error;
    }
}

/**
 * Create backup configuration
 * @param {Object} configData
 * @returns {Promise<number>} Insert ID
 */
export async function createBackupConfiguration(configData) {
    try {
        const {
            name,
            description,
            enabled = 1,
            schedule_type = 'manual',
            schedule_time = '02:00:00',
            schedule_day_of_week = 0,
            schedule_day_of_month = 1,
            timezone = 'Asia/Kolkata',
            retention_days = 30,
            max_backups = 10,
            compression = 1,
            email_on_success = 0,
            email_on_failure = 1,
            email_recipients = '[]',
            created_by
        } = configData;

        if (!name) {
            throw new Error('Name is required');
        }

        const currentTime = getCurrentTime();
        const recipientsJson = typeof email_recipients === 'string' 
            ? email_recipients 
            : JSON.stringify(email_recipients || []);

        const [result] = await appDB.query(
            `INSERT INTO backup_configurations (
                name, description, enabled, schedule_type, schedule_time,
                schedule_day_of_week, schedule_day_of_month, timezone,
                retention_days, max_backups, compression,
                email_on_success, email_on_failure, email_recipients,
                created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name, description || null, enabled, schedule_type, schedule_time,
                schedule_day_of_week, schedule_day_of_month, timezone,
                retention_days, max_backups, compression,
                email_on_success, email_on_failure, recipientsJson,
                created_by || null, currentTime, currentTime
            ]
        );

        return result.insertId;
    } catch (error) {
        console.error('Error creating backup configuration:', error);
        throw error;
    }
}

/**
 * Update backup configuration
 * @param {number} id
 * @param {Object} configData
 * @returns {Promise<boolean>}
 */
export async function updateBackupConfiguration(id, configData) {
    try {
        const updateFields = [];
        const params = [];

        const allowedFields = [
            'name', 'description', 'enabled', 'schedule_type', 'schedule_time',
            'schedule_day_of_week', 'schedule_day_of_month', 'timezone',
            'retention_days', 'max_backups', 'compression',
            'email_on_success', 'email_on_failure', 'email_recipients'
        ];

        for (const field of allowedFields) {
            if (configData[field] !== undefined) {
                if (field === 'email_recipients') {
                    const value = typeof configData[field] === 'string' 
                        ? configData[field] 
                        : JSON.stringify(configData[field] || []);
                    updateFields.push(`${field} = ?`);
                    params.push(value);
                } else {
                    updateFields.push(`${field} = ?`);
                    params.push(configData[field]);
                }
            }
        }

        if (updateFields.length === 0) {
            return true;
        }

        updateFields.push('updated_at = ?');
        params.push(getCurrentTime());
        params.push(id);

        const [result] = await appDB.query(
            `UPDATE backup_configurations SET ${updateFields.join(', ')} WHERE id = ?`,
            params
        );

        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error updating backup configuration:', error);
        throw error;
    }
}

/**
 * Delete backup configuration
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export async function deleteBackupConfiguration(id) {
    try {
        const [result] = await appDB.query(
            'DELETE FROM backup_configurations WHERE id = ?',
            [id]
        );

        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error deleting backup configuration:', error);
        throw error;
    }
}

/**
 * Get backup history
 * @param {Object} options
 * @param {number} options.configId - Optional filter by config ID
 * @param {number} options.page
 * @param {number} options.limit
 * @param {string} options.status - Optional filter by status
 * @returns {Promise<{history: Array, totalPages: number, totalRecords: number}>}
 */
export async function getBackupHistory({ configId = null, page = 1, limit = 10, status = null }) {
    try {
        const offset = (page - 1) * limit;
        const whereClauses = [];
        const params = [];

        if (configId) {
            whereClauses.push('bh.config_id = ?');
            params.push(configId);
        }

        if (status) {
            whereClauses.push('bh.status = ?');
            params.push(status);
        }

        const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Count query
        const [[{ total }]] = await appDB.query(
            `SELECT COUNT(*) as total 
             FROM backup_history bh
             ${whereClause}`,
            params
        );

        // Data query
        const [history] = await appDB.query(
            `SELECT 
                bh.id, bh.config_id, bc.name as config_name,
                bh.status, bh.file_path, bh.file_size, bh.checksum,
                bh.started_at, bh.completed_at, bh.duration_seconds,
                bh.database_name, bh.table_count,
                bh.error_message, bh.retry_count,
                bh.email_sent, bh.email_sent_at,
                bh.created_at, bh.updated_at
             FROM backup_history bh
             LEFT JOIN backup_configurations bc ON bh.config_id = bc.id
             ${whereClause}
             ORDER BY bh.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        const totalPages = Math.ceil(total / limit);
        return { history, totalPages, totalRecords: total };
    } catch (error) {
        console.error('Error fetching backup history:', error);
        throw error;
    }
}

/**
 * Get backup history entry by ID
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
export async function getBackupHistoryById(id) {
    try {
        const [rows] = await appDB.query(
            `SELECT 
                bh.id, bh.config_id, bc.name as config_name,
                bh.status, bh.file_path, bh.file_size, bh.checksum,
                bh.started_at, bh.completed_at, bh.duration_seconds,
                bh.database_name, bh.table_count,
                bh.error_message, bh.retry_count,
                bh.email_sent, bh.email_sent_at,
                bh.created_at, bh.updated_at
             FROM backup_history bh
             LEFT JOIN backup_configurations bc ON bh.config_id = bc.id
             WHERE bh.id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('Error fetching backup history entry:', error);
        throw error;
    }
}

/**
 * Create backup history entry
 * @param {Object} historyData
 * @returns {Promise<number>} Insert ID
 */
export async function createBackupHistory(historyData) {
    try {
        const {
            config_id,
            status = 'queued',
            file_path = null,
            file_size = 0,
            checksum = null,
            started_at = null,
            completed_at = null,
            duration_seconds = null,
            database_name = null,
            table_count = null,
            error_message = null,
            retry_count = 0
        } = historyData;

        if (!config_id) {
            throw new Error('config_id is required');
        }

        const currentTime = getCurrentTime();

        const [result] = await appDB.query(
            `INSERT INTO backup_history (
                config_id, status, file_path, file_size, checksum,
                started_at, completed_at, duration_seconds,
                database_name, table_count,
                error_message, retry_count,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                config_id, status, file_path, file_size, checksum,
                started_at || currentTime, completed_at, duration_seconds,
                database_name, table_count,
                error_message, retry_count,
                currentTime, currentTime
            ]
        );

        return result.insertId;
    } catch (error) {
        console.error('Error creating backup history:', error);
        throw error;
    }
}

/**
 * Update backup history entry
 * @param {number} id
 * @param {Object} historyData
 * @returns {Promise<boolean>}
 */
export async function updateBackupHistory(id, historyData) {
    try {
        const updateFields = [];
        const params = [];

        const allowedFields = [
            'status', 'file_path', 'file_size', 'checksum',
            'started_at', 'completed_at', 'duration_seconds',
            'database_name', 'table_count',
            'error_message', 'retry_count',
            'email_sent', 'email_sent_at'
        ];

        for (const field of allowedFields) {
            if (historyData[field] !== undefined) {
                updateFields.push(`${field} = ?`);
                params.push(historyData[field]);
            }
        }

        if (updateFields.length === 0) {
            return true;
        }

        updateFields.push('updated_at = ?');
        params.push(getCurrentTime());
        params.push(id);

        const [result] = await appDB.query(
            `UPDATE backup_history SET ${updateFields.join(', ')} WHERE id = ?`,
            params
        );

        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error updating backup history:', error);
        throw error;
    }
}

/**
 * Update backup configuration last run info
 * @param {number} configId
 * @param {string} status
 * @param {string} lastRunAt
 * @returns {Promise<boolean>}
 */
export async function updateBackupConfigLastRun(configId, status, lastRunAt) {
    try {
        const [result] = await appDB.query(
            `UPDATE backup_configurations 
             SET last_run_at = ?, last_run_status = ?, updated_at = ?
             WHERE id = ?`,
            [lastRunAt, status, getCurrentTime(), configId]
        );

        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error updating backup config last run:', error);
        throw error;
    }
}

/**
 * Get enabled backup configurations for scheduling
 * @returns {Promise<Array>}
 */
export async function getEnabledBackupConfigurations() {
    try {
        const [configs] = await appDB.query(
            `SELECT 
                id, name, schedule_type, schedule_time,
                schedule_day_of_week, schedule_day_of_month, timezone
             FROM backup_configurations
             WHERE enabled = 1
             AND schedule_type != 'manual'
             ORDER BY id`
        );

        return configs;
    } catch (error) {
        console.error('Error fetching enabled backup configurations:', error);
        throw error;
    }
}

/**
 * Delete backup history entry
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export async function deleteBackupHistory(id) {
    try {
        const [result] = await appDB.query(
            'DELETE FROM backup_history WHERE id = ?',
            [id]
        );

        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error deleting backup history:', error);
        throw error;
    }
}

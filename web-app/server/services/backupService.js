import { exec } from 'child_process';
import { promisify } from 'util';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { renderEmailTemplate, sendEmail } from './emailService.js';
import {
    createBackupHistory,
    updateBackupHistory,
    updateBackupConfigLastRun,
    getBackupConfigurationById,
    getBackupHistoryById,
    getBackupHistory
} from '../models/backupModel.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backup storage directory (configurable via env, defaults to ./backups)
const BACKUP_DIR = process.env.BACKUP_STORAGE_PATH || path.join(__dirname, '../../backups');
const DB_NAME = process.env.DB_NAME;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;

/**
 * Ensure backup directory exists
 */
async function ensureBackupDirectory() {
    try {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating backup directory:', error);
        throw error;
    }
}

/**
 * Format file size in human-readable format
 * @param {number} bytes
 * @returns {string}
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Calculate SHA-256 checksum of a file
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function calculateChecksum(filePath) {
    try {
        const fileBuffer = await fs.readFile(filePath);
        const hashSum = createHash('sha256');
        hashSum.update(fileBuffer);
        return hashSum.digest('hex');
    } catch (error) {
        console.error('Error calculating checksum:', error);
        throw error;
    }
}

/**
 * Get table count for database
 * @returns {Promise<number>}
 */
async function getTableCount() {
    try {
        const { stdout } = await execAsync(
            `mysql -h ${DB_HOST} -u ${DB_USER} -p${DB_PASS} ${DB_NAME} -e "SHOW TABLES;"`
        );
        // Count the lines (excluding the header)
        const lines = stdout.trim().split('\n');
        return Math.max(0, lines.length - 1); // Subtract header row
    } catch (error) {
        console.error('Error getting table count:', error);
        return 0;
    }
}

/**
 * Execute MySQL backup
 * @param {number} configId
 * @param {string} configName
 * @returns {Promise<{success: boolean, filePath: string|null, error: string|null}>}
 */
async function executeBackup(configId, configName) {
    const historyId = await createBackupHistory({
        config_id: configId,
        status: 'in_progress',
        started_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    });

    try {
        await ensureBackupDirectory();

        // Generate backup filename: backup_<config_name>_<timestamp>.sql[.gz]
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const sanitizedName = configName.replace(/[^a-zA-Z0-9]/g, '_');
        const backupFileName = `backup_${sanitizedName}_${timestamp}.sql`;
        const backupFilePath = path.join(BACKUP_DIR, backupFileName);

        // Build mysqldump command (without compression)
        const mysqldumpCmd = `mysqldump -h ${DB_HOST} -u ${DB_USER} -p${DB_PASS} ${DB_NAME} > ${backupFilePath}`;

        // Execute backup (create uncompressed SQL file first)
        const startTime = Date.now();
        await execAsync(mysqldumpCmd);

        // Compress the backup file using Node.js zlib
        const compression = true; // Always compress for now
        let finalFilePath = backupFilePath;

        if (compression) {
            const gzipFilePath = `${backupFilePath}.gz`;

            // Create gzip stream
            const gzip = createGzip();
            const source = createReadStream(backupFilePath);
            const destination = createWriteStream(gzipFilePath);

            // Compress the file
            await pipeline(source, gzip, destination);

            // Delete the uncompressed file
            await fs.unlink(backupFilePath);

            finalFilePath = gzipFilePath;
        }

        const durationSeconds = Math.floor((Date.now() - startTime) / 1000);

        // Get file stats
        const stats = await fs.stat(finalFilePath);
        const fileSize = stats.size;

        // Calculate checksum
        const checksum = await calculateChecksum(finalFilePath);

        // Get table count
        const tableCount = await getTableCount();

        // Update history
        const relativePath = path.relative(process.cwd(), finalFilePath);
        await updateBackupHistory(historyId, {
            status: 'completed',
            file_path: relativePath,
            file_size: fileSize,
            checksum,
            completed_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
            duration_seconds: durationSeconds,
            database_name: DB_NAME,
            table_count: tableCount
        });

        // Update config last run
        await updateBackupConfigLastRun(configId, 'success', new Date().toISOString().slice(0, 19).replace('T', ' '));

        return {
            success: true,
            historyId,
            filePath: relativePath,
            fileSize,
            checksum,
            durationSeconds,
            tableCount,
            error: null
        };
    } catch (error) {
        console.error('Error executing backup:', error);

        // Update history with error
        await updateBackupHistory(historyId, {
            status: 'failed',
            completed_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
            error_message: error.message || 'Unknown error',
            retry_count: 0
        });

        // Update config last run
        await updateBackupConfigLastRun(configId, 'failed', new Date().toISOString().slice(0, 19).replace('T', ' '));

        return {
            success: false,
            filePath: null,
            error: error.message || 'Unknown error'
        };
    }
}

/**
 * Send backup notification email
 * @param {Object} config
 * @param {Object} history
 * @param {string} templateKey - 'backup_success' or 'backup_failure'
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function sendBackupNotification(config, history, templateKey) {
    try {
        if (!config.email_recipients) {
            return { success: false, error: 'No email recipients configured' };
        }

        const recipients = typeof config.email_recipients === 'string'
            ? JSON.parse(config.email_recipients)
            : config.email_recipients;

        if (!Array.isArray(recipients) || recipients.length === 0) {
            return { success: false, error: 'No email recipients configured' };
        }

        // Build template context
        const context = {
            config_name: config.name,
            database_name: history.database_name || DB_NAME,
            started_at: history.started_at ? new Date(history.started_at).toLocaleString() : 'N/A',
            completed_at: history.completed_at ? new Date(history.completed_at).toLocaleString() : 'N/A',
            duration_seconds: history.duration_seconds || 0,
            file_size_formatted: history.file_size ? formatFileSize(history.file_size) : 'N/A',
            checksum: history.checksum || 'N/A',
            error_message: history.error_message || 'N/A',
            retry_count: history.retry_count || 0,
            restored_at: new Date().toLocaleString(),
            restored_by: 'System' // Could be passed from restore function
        };

        // Render template
        const { subject, html } = await renderEmailTemplate(templateKey, context);

        // Send email
        const result = await sendEmail({
            to: recipients,
            subject,
            html
        });

        // Update history with email status
        if (result.success) {
            await updateBackupHistory(history.id, {
                email_sent: 1,
                email_sent_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            });
        }

        return result;
    } catch (error) {
        console.error('Error sending backup notification:', error);
        return {
            success: false,
            error: error.message || 'Unknown error'
        };
    }
}

/**
 * Trigger backup for a configuration
 * @param {number} configId
 * @returns {Promise<{success: boolean, historyId: number|null, error: string|null}>}
 */
export async function triggerBackup(configId) {
    try {
        const config = await getBackupConfigurationById(configId);
        if (!config) {
            throw new Error('Backup configuration not found');
        }

        if (!config.enabled) {
            throw new Error('Backup configuration is disabled');
        }

        // Execute backup
        const result = await executeBackup(configId, config.name);

        // Get the most recent history entry for this config
        const { history: historyList } = await getBackupHistory({ configId, limit: 1 });
        const history = historyList.length > 0 ? historyList[0] : null;

        // Send notifications if configured
        if (result.success && config.email_on_success && history) {
            await sendBackupNotification(config, history, 'backup_success');
        } else if (!result.success && config.email_on_failure && history) {
            await sendBackupNotification(config, history, 'backup_failure');
        }

        return {
            success: result.success,
            historyId: history?.id || null,
            error: result.error || null
        };
    } catch (error) {
        console.error('Error triggering backup:', error);
        return {
            success: false,
            historyId: null,
            error: error.message || 'Unknown error'
        };
    }
}

/**
 * Restore database from backup file
 * @param {string} filePath - Relative or absolute path to backup file
 * @param {string} restoredBy - Username who initiated restore
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function restoreBackup(filePath, restoredBy) {
    try {
        const fullPath = path.isAbsolute(filePath)
            ? filePath
            : path.join(process.cwd(), filePath);

        // Check if file exists
        await fs.access(fullPath);

        // Determine if file is compressed
        const isCompressed = fullPath.endsWith('.gz');

        let restoreSqlPath = fullPath;

        // If compressed, decompress it first
        if (isCompressed) {
            const decompressedPath = fullPath.replace('.gz', '');

            // Create gunzip stream
            const gunzip = createGunzip();
            const source = createReadStream(fullPath);
            const destination = createWriteStream(decompressedPath);

            // Decompress the file
            await pipeline(source, gunzip, destination);

            restoreSqlPath = decompressedPath;
        }

        // Build restore command
        const restoreCmd = `mysql -h ${DB_HOST} -u ${DB_USER} -p${DB_PASS} ${DB_NAME} < ${restoreSqlPath}`;

        // Execute restore
        await execAsync(restoreCmd);

        // Clean up decompressed file if we created it
        if (isCompressed) {
            await fs.unlink(restoreSqlPath);
        }

        // Send restore notification (optional - could find config by file path)
        // For now, just return success

        return {
            success: true,
            error: null
        };
    } catch (error) {
        console.error('Error restoring backup:', error);
        return {
            success: false,
            error: error.message || 'Unknown error'
        };
    }
}

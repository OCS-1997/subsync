import {
    getAllBackupConfigurations,
    getBackupConfigurationById,
    createBackupConfiguration,
    updateBackupConfiguration,
    deleteBackupConfiguration,
    getBackupHistory as getBackupHistoryModel,
    getBackupHistoryById
} from '../models/backupModel.js';

import {
    triggerBackup,
    restoreBackup,
    updateScheduledBackupJob,
    deleteScheduledBackupJob
} from '../services/backupService.js';
import { backupTasksQueue } from '../queues/queueConfig.js';
import { logActivity } from '../models/activityLogModel.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Get all backup configurations
 */
export const getBackupConfigurations = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;

        const result = await getAllBackupConfigurations({
            page: parseInt(page),
            limit: parseInt(limit),
            search: search || null
        });

        res.status(200).json({
            configs: result.configs,
            totalPages: result.totalPages,
            totalRecords: result.totalRecords,
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Error fetching backup configurations:', error);
        res.status(500).json({ error: 'Failed to fetch backup configurations' });
    }
};

/**
 * Get backup configuration by ID
 */
export const getBackupConfiguration = async (req, res) => {
    try {
        const { id } = req.params;
        const config = await getBackupConfigurationById(parseInt(id));

        if (!config) {
            return res.status(404).json({ error: 'Backup configuration not found' });
        }

        // Parse email_recipients JSON
        if (config.email_recipients) {
            try {
                config.email_recipients = typeof config.email_recipients === 'string'
                    ? JSON.parse(config.email_recipients)
                    : config.email_recipients;
            } catch (e) {
                config.email_recipients = [];
            }
        }

        res.status(200).json({ config });
    } catch (error) {
        console.error('Error fetching backup configuration:', error);
        res.status(500).json({ error: 'Failed to fetch backup configuration' });
    }
};

/**
 * Create backup configuration
 */
export const createBackupConfig = async (req, res) => {
    try {
        const configData = {
            ...req.body,
            created_by: req.user?.username || null
        };

        const id = await createBackupConfiguration(configData);

        // Sync with BullMQ scheduler
        await updateScheduledBackupJob(id);

        // Log activity
        if (req.user && req.user.username) {
            await logActivity({
                username: req.user.username,
                action: 'CREATE_BACKUP_CONFIG',
                resourceType: 'BackupConfiguration',
                resourceId: id.toString(),
                ipAddress: req.ip,
                details: configData
            });
        }

        res.status(201).json({ message: 'Backup configuration created successfully', id });
    } catch (error) {
        console.error('Error creating backup configuration:', error);
        res.status(400).json({ error: error.message || 'Failed to create backup configuration' });
    }
};

/**
 * Update backup configuration
 */
export const updateBackupConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const configData = req.body;

        const success = await updateBackupConfiguration(parseInt(id), configData);

        if (!success) {
            return res.status(404).json({ error: 'Backup configuration not found' });
        }

        // Sync with BullMQ scheduler
        await updateScheduledBackupJob(parseInt(id));

        // Log activity
        if (req.user && req.user.username) {
            await logActivity({
                username: req.user.username,
                action: 'UPDATE_BACKUP_CONFIG',
                resourceType: 'BackupConfiguration',
                resourceId: id,
                ipAddress: req.ip,
                details: configData
            });
        }

        res.status(200).json({ message: 'Backup configuration updated successfully' });
    } catch (error) {
        console.error('Error updating backup configuration:', error);
        res.status(400).json({ error: error.message || 'Failed to update backup configuration' });
    }
};

/**
 * Delete backup configuration
 */
export const deleteBackupConfig = async (req, res) => {
    try {
        const { id } = req.params;

        const success = await deleteBackupConfiguration(parseInt(id));

        if (!success) {
            return res.status(404).json({ error: 'Backup configuration not found' });
        }

        // Remove from BullMQ scheduler
        await deleteScheduledBackupJob(parseInt(id));

        // Log activity
        if (req.user && req.user.username) {
            await logActivity({
                username: req.user.username,
                action: 'DELETE_BACKUP_CONFIG',
                resourceType: 'BackupConfiguration',
                resourceId: id,
                ipAddress: req.ip
            });
        }

        res.status(200).json({ message: 'Backup configuration deleted successfully' });
    } catch (error) {
        console.error('Error deleting backup configuration:', error);
        res.status(500).json({ error: error.message || 'Failed to delete backup configuration' });
    }
};

/**
 * Trigger backup manually
 */
export const triggerBackupManual = async (req, res) => {
    try {
        const { id } = req.params;

        // Result is now just queueing status
        const job = await backupTasksQueue.add(
            `manual-backup-${id}-${Date.now()}`,
            {
                configId: parseInt(id),
                triggeredBy: req.user?.username || 'Unknown'
            }
        );

        // Log activity
        if (req.user && req.user.username) {
            await logActivity({
                username: req.user.username,
                action: 'TRIGGER_BACKUP_QUEUED',
                resourceType: 'BackupConfiguration',
                resourceId: id,
                ipAddress: req.ip,
                details: { jobId: job.id }
            });
        }

        res.status(200).json({
            message: 'Backup has been queued for execution',
            jobId: job.id
        });
    } catch (error) {
        console.error('Error triggering backup:', error);
        res.status(500).json({ error: error.message || 'Failed to trigger backup' });
    }
};

/**
 * Get backup history
 */
export const getBackupHistory = async (req, res) => {
    try {
        const { configId, page = 1, limit = 10, status } = req.query;

        const result = await getBackupHistoryModel({
            configId: configId ? parseInt(configId) : null,
            page: parseInt(page),
            limit: parseInt(limit),
            status: status || null
        });

        res.status(200).json({
            history: result.history,
            totalPages: result.totalPages,
            totalRecords: result.totalRecords,
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Error fetching backup history:', error);
        res.status(500).json({ error: 'Failed to fetch backup history' });
    }
};

/**
 * Get backup history entry by ID
 */
export const getBackupHistoryEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const history = await getBackupHistoryById(parseInt(id));

        if (!history) {
            return res.status(404).json({ error: 'Backup history entry not found' });
        }

        res.status(200).json({ history });
    } catch (error) {
        console.error('Error fetching backup history entry:', error);
        res.status(500).json({ error: 'Failed to fetch backup history entry' });
    }
};

/**
 * Download backup file
 */
export const downloadBackup = async (req, res) => {
    try {
        const { id } = req.params;
        const history = await getBackupHistoryById(parseInt(id));

        if (!history) {
            return res.status(404).json({ error: 'Backup history entry not found' });
        }

        if (!history.file_path) {
            return res.status(404).json({ error: 'Backup file not found' });
        }

        // Resolve file path
        const filePath = path.isAbsolute(history.file_path)
            ? history.file_path
            : path.join(process.cwd(), history.file_path);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ error: 'Backup file not found on disk' });
        }

        // Determine filename for download
        const filename = path.basename(filePath);

        // Set headers
        res.setHeader('Content-Type', 'application/gzip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Stream file
        const fileStream = await fs.readFile(filePath);
        res.send(fileStream);

        // Log activity
        if (req.user && req.user.username) {
            await logActivity({
                username: req.user.username,
                action: 'DOWNLOAD_BACKUP',
                resourceType: 'BackupHistory',
                resourceId: id,
                ipAddress: req.ip
            });
        }
    } catch (error) {
        console.error('Error downloading backup:', error);
        res.status(500).json({ error: error.message || 'Failed to download backup' });
    }
};

/**
 * Restore from backup
 */
export const restoreFromBackup = async (req, res) => {
    try {
        const { id } = req.params;
        const history = await getBackupHistoryById(parseInt(id));

        if (!history) {
            return res.status(404).json({ error: 'Backup history entry not found' });
        }

        if (!history.file_path) {
            return res.status(404).json({ error: 'Backup file not found' });
        }

        if (history.status !== 'completed') {
            return res.status(400).json({ error: 'Cannot restore from incomplete backup' });
        }

        // Restore backup
        const result = await restoreBackup(history.file_path, req.user?.username || 'Unknown');

        if (!result.success) {
            return res.status(500).json({ error: result.error || 'Failed to restore backup' });
        }

        // Log activity (CRITICAL ACTION)
        if (req.user && req.user.username) {
            await logActivity({
                username: req.user.username,
                action: 'RESTORE_BACKUP',
                resourceType: 'BackupHistory',
                resourceId: id,
                ipAddress: req.ip,
                details: { file_path: history.file_path }
            });
        }

        res.status(200).json({ message: 'Database restored successfully from backup' });
    } catch (error) {
        console.error('Error restoring backup:', error);
        res.status(500).json({ error: error.message || 'Failed to restore backup' });
    }
};



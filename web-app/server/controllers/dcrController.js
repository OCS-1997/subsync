import {
    createEntry,
    updateEntry,
    listEntries,
    getEntryById,
    deleteEntry,
    getStats,
    generateAndSendDailyReport,
    convertTimeToMinutes
} from '../services/dcrService.js';
import { exportDcrEntries } from '../models/dcrModel.js';
import { getDcrCategories } from '../models/dcrModel.js';

/**
 * POST /api/dcr
 * Create a new DCR entry
 */
export const createDcrEntryController = async (req, res) => {
    try {
        const entryData = req.body;
        const username = req.user.username;
        const ipAddress = req.user.ip;

        const result = await createEntry(entryData, username, ipAddress);
        res.status(201).json({ message: 'DCR entry created successfully', id: result.id });
    } catch (error) {
        console.error('Error creating DCR entry:', error);
        res.status(500).json({ error: error.message || 'Failed to create DCR entry' });
    }
};

/**
 * GET /api/dcr
 * List DCR entries with filters
 */
export const listDcrEntriesController = async (req, res) => {
    try {
        const filters = {
            user_id: req.query.user_id || (req.user.roleKey !== 'admin' ? req.user.username : null),
            start_date: req.query.start_date,
            end_date: req.query.end_date,
            category: req.query.category,
            call_type: req.query.call_type,
            search: req.query.search,
            page: parseInt(req.query.page || 1, 10),
            limit: parseInt(req.query.limit || 50, 10)
        };

        const result = await listEntries(filters);
        res.json(result);
    } catch (error) {
        console.error('Error fetching DCR entries:', error);
        res.status(500).json({ error: 'Failed to fetch DCR entries' });
    }
};

/**
 * GET /api/dcr/:id
 * Get DCR entry by ID
 */
export const getDcrEntryController = async (req, res) => {
    try {
        const { id } = req.params;
        const entry = await getEntryById(parseInt(id, 10));

        if (!entry) {
            return res.status(404).json({ error: 'DCR entry not found' });
        }

        // Check if user owns this entry (unless admin)
        if (req.user.roleKey !== 'admin' && entry.user_id !== req.user.username) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(entry);
    } catch (error) {
        console.error('Error fetching DCR entry:', error);
        res.status(500).json({ error: 'Failed to fetch DCR entry' });
    }
};

/**
 * PUT /api/dcr/:id
 * Update DCR entry
 */
export const updateDcrEntryController = async (req, res) => {
    try {
        const { id } = req.params;
        const entryData = req.body;
        const username = req.user.username;
        const ipAddress = req.user.ip;

        // Check if entry exists and user has permission
        const existing = await getEntryById(parseInt(id, 10));
        if (!existing) {
            return res.status(404).json({ error: 'DCR entry not found' });
        }

        // Check if user owns this entry (unless admin)
        if (req.user.roleKey !== 'admin' && existing.user_id !== req.user.username) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await updateEntry(parseInt(id, 10), entryData, username, ipAddress);
        res.json({ message: 'DCR entry updated successfully' });
    } catch (error) {
        console.error('Error updating DCR entry:', error);
        res.status(500).json({ error: error.message || 'Failed to update DCR entry' });
    }
};

/**
 * DELETE /api/dcr/:id
 * Delete DCR entry
 */
export const deleteDcrEntryController = async (req, res) => {
    try {
        const { id } = req.params;
        const username = req.user.username;
        const ipAddress = req.user.ip;

        // Check if entry exists and user has permission
        const existing = await getEntryById(parseInt(id, 10));
        if (!existing) {
            return res.status(404).json({ error: 'DCR entry not found' });
        }

        // Check if user owns this entry (unless admin)
        if (req.user.roleKey !== 'admin' && existing.user_id !== req.user.username) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await deleteEntry(parseInt(id, 10), username, ipAddress);
        res.json({ message: 'DCR entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting DCR entry:', error);
        res.status(500).json({ error: error.message || 'Failed to delete DCR entry' });
    }
};

/**
 * GET /api/dcr/stats
 * Get DCR statistics
 */
export const getDcrStatsController = async (req, res) => {
    try {
        const filters = {
            start_date: req.query.start_date,
            end_date: req.query.end_date,
            user_id: req.query.user_id || (req.user.roleKey !== 'admin' ? req.user.username : null)
        };

        const stats = await getStats(filters);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching DCR stats:', error);
        res.status(500).json({ error: 'Failed to fetch DCR stats' });
    }
};

/**
 * GET /api/dcr/export
 * Export DCR entries as CSV
 */
export const exportDcrEntriesController = async (req, res) => {
    try {
        const filters = {
            start_date: req.query.start_date,
            end_date: req.query.end_date,
            user_id: req.query.user_id || (req.user.roleKey !== 'admin' ? req.user.username : null)
        };

        const entries = await exportDcrEntries(filters);

        // Convert to CSV
        const headers = ['Timestamp', 'User', 'Company', 'Domain', 'Contact Person', 'Call Type', 'Category', 'Contact Number', 'Description', 'Time Spent (Minutes)'];
        const csvRows = [
            headers.join(','),
            ...entries.map(entry => [
                entry.timestamp,
                entry.user_name,
                entry.company || '',
                entry.domain || '',
                entry.contact_person || '',
                entry.call_type,
                entry.category,
                entry.contact_number || '',
                (entry.description || '').replace(/"/g, '""'),
                entry.time_spent_minutes
            ].map(field => `"${field}"`).join(','))
        ];

        const csv = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="dcr_export_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting DCR entries:', error);
        res.status(500).json({ error: 'Failed to export DCR entries' });
    }
};

/**
 * POST /api/dcr/send-daily-report
 * Manually trigger daily report
 */
export const sendDailyReportController = async (req, res) => {
    try {
        const date = req.body.date || new Date().toISOString().split('T')[0];
        const result = await generateAndSendDailyReport(date);
        res.json({ message: 'Daily report sent successfully', ...result });
    } catch (error) {
        console.error('Error sending daily report:', error);
        res.status(500).json({ error: error.message || 'Failed to send daily report' });
    }
};

/**
 * GET /api/dcr/categories
 * Get all DCR categories
 */
export const getDcrCategoriesController = async (req, res) => {
    try {
        const categories = await getDcrCategories();
        res.json(categories);
    } catch (error) {
        console.error('Error fetching DCR categories:', error);
        res.status(500).json({ error: 'Failed to fetch DCR categories' });
    }
};


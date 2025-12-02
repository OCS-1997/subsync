import {
    createDcrEntry,
    getDcrEntryById,
    getDcrEntries,
    updateDcrEntry,
    deleteDcrEntry,
    getDcrStats,
    getDcrEntriesForDate,
    exportDcrEntries
} from '../models/dcrModel.js';
import { generateDcrCharts } from '../utils/chartGenerator.js';
import { sendEmail } from './emailService.js';
import { logActivity } from '../models/activityLogModel.js';

// Export logActivity for use
export { logActivity };

/**
 * Convert HH:MM format to minutes
 * @param {string} timeString - Format: "HH:MM"
 * @returns {number} minutes
 */
export function convertTimeToMinutes(timeString) {
    if (!timeString || typeof timeString !== 'string') return 0;
    const parts = timeString.split(':');
    if (parts.length !== 2) return 0;
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
}

/**
 * Convert minutes to HH:MM format
 * @param {number} minutes
 * @returns {string} "HH:MM"
 */
export function convertMinutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Create a new DCR entry
 * @param {Object} entryData
 * @param {string} username
 * @param {string} ipAddress
 * @returns {Promise<Object>}
 */
export async function createEntry(entryData, username, ipAddress) {
    const {
        timestamp,
        company,
        domain,
        contact_person,
        call_type,
        category,
        contact_number,
        description,
        time_spent
    } = entryData;

    // Convert HH:MM to minutes
    const time_spent_minutes = convertTimeToMinutes(time_spent);

    const result = await createDcrEntry({
        user_id: username,
        timestamp: timestamp || new Date().toISOString().slice(0, 19).replace('T', ' '),
        company,
        domain,
        contact_person,
        call_type: call_type || 'Inbound',
        category,
        contact_number,
        description,
        time_spent_minutes
    });

    // Log activity
    await logActivity({
        username,
        action: 'CREATE',
        resourceType: 'dcr_entry',
        resourceId: result.id.toString(),
        ipAddress: ipAddress,
        details: { category, company, domain }
    });

    return result;
}

/**
 * Update DCR entry
 * @param {number} id
 * @param {Object} entryData
 * @param {string} username
 * @param {string} ipAddress
 * @returns {Promise<boolean>}
 */
export async function updateEntry(id, entryData, username, ipAddress) {
    const existing = await getDcrEntryById(id);
    if (!existing) {
        throw new Error('DCR entry not found');
    }

    // Check if user owns this entry (unless admin)
    // This check should be done in controller based on user role

    const {
        timestamp,
        company,
        domain,
        contact_person,
        call_type,
        category,
        contact_number,
        description,
        time_spent
    } = entryData;

    const time_spent_minutes = convertTimeToMinutes(time_spent);

    const result = await updateDcrEntry(id, {
        timestamp,
        company,
        domain,
        contact_person,
        call_type,
        category,
        contact_number,
        description,
        time_spent_minutes
    });

    // Log activity
    await logActivity({
        username,
        action: 'UPDATE',
        resourceType: 'dcr_entry',
        resourceId: id.toString(),
        ipAddress: ipAddress,
        details: { category, company, domain }
    });

    return result;
}

/**
 * List DCR entries
 * @param {Object} filters
 * @returns {Promise<Object>}
 */
export async function listEntries(filters) {
    return await getDcrEntries(filters);
}

/**
 * Get DCR entry by ID
 * @param {number} id
 * @returns {Promise<Object>}
 */
export async function getEntryById(id) {
    return await getDcrEntryById(id);
}

/**
 * Delete DCR entry
 * @param {number} id
 * @param {string} username
 * @param {string} ipAddress
 * @returns {Promise<boolean>}
 */
export async function deleteEntry(id, username, ipAddress) {
    const existing = await getDcrEntryById(id);
    if (!existing) {
        throw new Error('DCR entry not found');
    }

    const result = await deleteDcrEntry(id);

    // Log activity
    await logActivity({
        username,
        action: 'DELETE',
        resourceType: 'dcr_entry',
        resourceId: id.toString(),
        ipAddress: ipAddress,
        details: { category: existing.category, company: existing.company }
    });

    return result;
}

/**
 * Get DCR statistics
 * @param {Object} filters
 * @returns {Promise<Object>}
 */
export async function getStats(filters = {}) {
    return await getDcrStats(filters);
}

/**
 * Generate daily report data for a specific date
 * @param {string} date - YYYY-MM-DD format
 * @returns {Promise<Object>}
 */
export async function generateDailyReportData(date) {
    const entries = await getDcrEntriesForDate(date);
    const stats = await getDcrStats({ start_date: date, end_date: date });

    // Group entries by user
    const entriesByUser = {};
    entries.forEach(entry => {
        if (!entriesByUser[entry.user_id]) {
            entriesByUser[entry.user_id] = {
                user_name: entry.user_name,
                username: entry.username,
                entries: []
            };
        }
        entriesByUser[entry.user_id].entries.push(entry);
    });

    return {
        date,
        entries,
        entriesByUser,
        stats
    };
}

/**
 * Format DCR table HTML for email
 * @param {Object} reportData
 * @returns {string} HTML string
 */
export function formatDcrTableHtml(reportData) {
    const { entriesByUser, stats } = reportData;

    let html = '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 20px 0;">';
    html += '<thead><tr style="background-color: #f0f0f0;">';
    html += '<th>User</th><th>Time</th><th>Company</th><th>Domain</th><th>Contact</th><th>Type</th><th>Category</th><th>Description</th>';
    html += '</tr></thead><tbody>';

    Object.values(entriesByUser).forEach(userGroup => {
        userGroup.entries.forEach(entry => {
            html += '<tr>';
            html += `<td>${entry.user_name}</td>`;
            html += `<td>${convertMinutesToTime(entry.time_spent_minutes)}</td>`;
            html += `<td>${entry.company || '-'}</td>`;
            html += `<td>${entry.domain || '-'}</td>`;
            html += `<td>${entry.contact_person || '-'}</td>`;
            html += `<td>${entry.call_type}</td>`;
            html += `<td>${entry.category}</td>`;
            html += `<td>${(entry.description || '').substring(0, 100)}${entry.description && entry.description.length > 100 ? '...' : ''}</td>`;
            html += '</tr>';
        });
    });

    html += '</tbody></table>';

    // Summary tables
    html += '<h3>Summary by User</h3>';
    html += '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 20px 0;">';
    html += '<thead><tr style="background-color: #f0f0f0;"><th>User</th><th>Calls</th><th>Total Time (Minutes)</th><th>Total Time (Hours)</th></tr></thead><tbody>';
    stats.callsPerUser.forEach(user => {
        html += '<tr>';
        html += `<td>${user.user_name}</td>`;
        html += `<td>${user.call_count}</td>`;
        html += `<td>${user.total_minutes}</td>`;
        html += `<td>${(user.total_minutes / 60).toFixed(2)}</td>`;
        html += '</tr>';
    });
    html += '</tbody></table>';

    html += '<h3>Summary by Category</h3>';
    html += '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 20px 0;">';
    html += '<thead><tr style="background-color: #f0f0f0;"><th>Category</th><th>Calls</th><th>Total Time (Minutes)</th><th>Total Time (Hours)</th></tr></thead><tbody>';
    stats.callsPerCategory.forEach(cat => {
        html += '<tr>';
        html += `<td>${cat.category}</td>`;
        html += `<td>${cat.call_count}</td>`;
        html += `<td>${cat.total_minutes}</td>`;
        html += `<td>${(cat.total_minutes / 60).toFixed(2)}</td>`;
        html += '</tr>';
    });
    html += '</tbody></table>';

    return html;
}

/**
 * Generate and send daily DCR report email
 * @param {string} date - YYYY-MM-DD format
 * @returns {Promise<Object>}
 */
export async function generateAndSendDailyReport(date) {
    try {
        const reportData = await generateDailyReportData(date);
        const stats = reportData.stats;

        // Generate charts
        const charts = await generateDcrCharts(stats);

        // Format HTML email
        const emailHtml = await formatDcrEmailHtml(reportData, stats, charts);

        // Send email
        const adminEmail = process.ADMIN_EMAILS || 'hari@ocsindia.net';
        const result = await sendEmail({
            to: adminEmail,
            subject: `Daily Call Register Report - ${date}`,
            html: emailHtml
        });

        // Log to notification_logs
        const { upsertNotificationLog } = await import('../models/notificationLogModel.js');
        await upsertNotificationLog({
            subscription_id: 'DCR_DAILY_REPORT',
            user_id: null,
            template_key: 'dcr_daily_report',
            sent_at: new Date(),
            status: result.success ? 'sent' : 'failed',
            provider_id: result.providerId,
            error: result.error
        });

        return {
            success: result.success,
            date,
            totalCalls: stats.totalCalls,
            totalTime: stats.totalTimeHours,
            error: result.error
        };
    } catch (error) {
        console.error('Error generating daily DCR report:', error);
        throw error;
    }
}

/**
 * Format complete email HTML with charts
 * @param {Object} reportData
 * @param {Object} stats
 * @param {Object} charts
 * @returns {Promise<string>}
 */
async function formatDcrEmailHtml(reportData, stats, charts) {
    const { date, entriesByUser } = reportData;

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #1f2933; background-color: #f5f7fa; }
            .header { background: linear-gradient(135deg, #1d4ed8, #3b82f6); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .summary-box { background-color: #eef2ff; padding: 15px; margin: 20px 0; border-left: 4px solid #2563eb; border-radius: 4px; }
            .chart-container { text-align: center; margin: 30px 0; }
            .chart-container img { max-width: 100%; height: auto; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; background-color: #ffffff; }
            th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #1d4ed8; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            h1, h2, h3 { color: #1f2937; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Daily Call Register Report</h1>
            <p>Date: ${date}</p>
        </div>
        <div class="content">
            <div class="summary-box">
                <h2>Summary</h2>
                <p><strong>Total Calls:</strong> ${stats.totalCalls}</p>
                <p><strong>Total Time Spent:</strong> ${stats.totalTimeHours} hours (${stats.totalTimeMinutes} minutes)</p>
                <p><strong>Total Users:</strong> ${stats.callsPerUser.length}</p>
            </div>
    `;

    // Charts
    html += '<div class="chart-container">';
    html += `<h3>Time Spent per Category</h3>`;
    html += `<img src="${charts.pieChartTimeCategory}" alt="Time Spent per Category" />`;
    html += '</div>';

    html += '<div class="chart-container">';
    html += `<h3>Number of Calls per Category</h3>`;
    html += `<img src="${charts.barChartCallsCategory}" alt="Calls per Category" />`;
    html += '</div>';

    html += '<div class="chart-container">';
    html += `<h3>Time Spent per User</h3>`;
    html += `<img src="${charts.barChartTimeUser}" alt="Time per User" />`;
    html += '</div>';

    // Detailed table
    html += '<h2>Detailed Call Entries</h2>';
    html += formatDcrTableHtml(reportData);

    html += `
        </div>
    </body>
    </html>
    `;

    return html;
}


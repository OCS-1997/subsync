import appDB from '../db/subsyncDB.js';
import { sendEmail } from './emailService.js';

/**
 * Format date to readable string in IST timezone
 * @param {Date} date 
 * @returns {string}
 */
function formatDateIST(date) {
    return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Kolkata'
    });
}

/**
 * Calculate difference in calendar days between two dates
 * @param {Date|string} dateStr 
 * @param {Date} referenceDate 
 * @returns {number}
 */
function getDaysOverdue(dateStr, referenceDate) {
    if (!dateStr) return 0;
    const dueDate = new Date(dateStr);
    const ref = new Date(referenceDate);

    // Reset times to compare pure dates
    dueDate.setHours(0, 0, 0, 0);
    ref.setHours(0, 0, 0, 0);

    const diffTime = ref.getTime() - dueDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
}

/**
 * Helper to generate priority badge style
 * @param {string} priority 
 * @returns {string}
 */
function getPriorityBadgeHtml(priority) {
    const p = (priority || 'MEDIUM').toUpperCase();
    let bg = '#e2e8f0';
    let color = '#334155';

    if (p === 'URGENT') {
        bg = '#ffe4e6';
        color = '#be123c';
    } else if (p === 'HIGH') {
        bg = '#ffedd5';
        color = '#c2410c';
    } else if (p === 'MEDIUM') {
        bg = '#dbeafe';
        color = '#1d4ed8';
    } else if (p === 'LOW') {
        bg = '#f1f5f9';
        color = '#475569';
    }

    return `<span style="display: inline-block; padding: 3px 9px; font-size: 11px; font-weight: 700; background-color: ${bg}; color: ${color}; border-radius: 12px; text-transform: uppercase;">${p}</span>`;
}

/**
 * Helper to generate status badge style
 * @param {string} status 
 * @returns {string}
 */
function getStatusBadgeHtml(status) {
    const s = (status || 'TODO').toUpperCase();
    let bg = '#f1f5f9';
    let color = '#475569';

    if (s === 'IN_PROGRESS') {
        bg = '#e0e7ff';
        color = '#3730a3';
    } else if (s === 'BLOCKED') {
        bg = '#fef2f2';
        color = '#991b1b';
    } else if (s === 'TODO') {
        bg = '#f3f4f6';
        color = '#374151';
    }

    return `<span style="display: inline-block; padding: 3px 9px; font-size: 11px; font-weight: 600; background-color: ${bg}; color: ${color}; border-radius: 12px;">${s.replace('_', ' ')}</span>`;
}

/**
 * Helper to get the correct frontend base URL (React client app, not backend node port)
 * @returns {string}
 */
export function getFrontendAppUrl() {
    if (process.env.CLIENT_URL) return process.env.CLIENT_URL.replace(/\/$/, '');
    if (process.env.APP_FRONTEND_URL) return process.env.APP_FRONTEND_URL.replace(/\/$/, '');
    
    // In production or when APP_BASE_URL is a custom domain (not local backend port 3000)
    if (process.env.APP_BASE_URL && !process.env.APP_BASE_URL.includes(':3000')) {
        return process.env.APP_BASE_URL.replace(/\/$/, '');
    }
    
    const clientPort = process.env.CLIENT_PORT || 5173;
    return `http://localhost:${clientPort}`;
}

/**
 * Send Daily Task Digest emails to all active users.
 * Runs at 10:00 AM IST daily via scheduled cron job.
 * 
 * @param {Date} [reportDate] - Optional date override (defaults to current date)
 * @returns {Promise<{success: boolean, sent: number, skipped: number, failed: number, errors: Array}>}
 */
export async function sendDailyTaskDigestEmails(reportDate = new Date()) {
    try {
        const appUrl = getFrontendAppUrl();

        // Fetch all active users with valid email address
        const [users] = await appDB.query(
            `SELECT username, name, email 
             FROM users 
             WHERE is_active = 1 AND email IS NOT NULL AND TRIM(email) != ''`
        );

        if (!users || users.length === 0) {
            console.log('[DailyTaskDigest] No active users found for email digest.');
            return { success: true, sent: 0, skipped: 0, failed: 0, errors: [] };
        }

        const results = {
            sent: 0,
            skipped: 0,
            failed: 0,
            errors: []
        };

        const todayStr = formatDateIST(reportDate);

        for (const user of users) {
            try {
                // Fetch assigned incomplete tasks for this user
                const [tasks] = await appDB.query(
                    `SELECT 
                        t.*,
                        u_creator.name AS creator_name
                     FROM tasks t
                     LEFT JOIN users u_creator ON t.created_by = u_creator.username
                     WHERE t.assigned_to = ? 
                       AND t.status NOT IN ('COMPLETED', 'CANCELLED')
                     ORDER BY 
                       CASE 
                         WHEN t.due_date IS NOT NULL AND DATE(t.due_date) < CURDATE() THEN 0
                         WHEN DATE(t.due_date) = CURDATE() THEN 1
                         ELSE 2 
                       END ASC,
                       t.due_date ASC,
                       CASE t.priority 
                         WHEN 'URGENT' THEN 0 
                         WHEN 'HIGH' THEN 1 
                         WHEN 'MEDIUM' THEN 2 
                         WHEN 'LOW' THEN 3 
                       END ASC`,
                    [user.username]
                );

                // Group tasks
                const overdueTasks = [];
                const dueTodayTasks = [];
                const otherActiveTasks = [];

                const todayObj = new Date(reportDate);
                todayObj.setHours(0, 0, 0, 0);

                (tasks || []).forEach(task => {
                    if (task.due_date) {
                        const dueDateObj = new Date(task.due_date);
                        dueDateObj.setHours(0, 0, 0, 0);

                        if (dueDateObj < todayObj) {
                            overdueTasks.push({
                                ...task,
                                daysOverdue: getDaysOverdue(task.due_date, todayObj)
                            });
                        } else if (dueDateObj.getTime() === todayObj.getTime()) {
                            dueTodayTasks.push(task);
                        } else {
                            otherActiveTasks.push(task);
                        }
                    } else {
                        otherActiveTasks.push(task);
                    }
                });

                const totalIncomplete = overdueTasks.length + dueTodayTasks.length + otherActiveTasks.length;

                // Build HTML Content
                const html = generateDigestEmailHtml({
                    userName: user.name || user.username,
                    userUsername: user.username,
                    todayStr,
                    appUrl,
                    totalIncomplete,
                    overdueTasks,
                    dueTodayTasks,
                    otherActiveTasks
                });

                const subject = overdueTasks.length > 0 
                    ? `⚠️ Action Required: ${overdueTasks.length} Overdue Task${overdueTasks.length > 1 ? 's' : ''} - Morning Digest (${todayStr})`
                    : `🌅 OCS365 Task Digest - ${todayStr}`;

                const mailResult = await sendEmail({
                    to: user.email,
                    subject,
                    html
                });

                if (mailResult.success) {
                    results.sent++;
                } else {
                    results.failed++;
                    results.errors.push({ username: user.username, email: user.email, error: mailResult.error });
                }
            } catch (userErr) {
                console.error(`[DailyTaskDigest] Failed to process user ${user.username}:`, userErr);
                results.failed++;
                results.errors.push({ username: user.username, email: user.email, error: userErr.message });
            }
        }

        console.log(`[DailyTaskDigest] Completed daily task digest. Sent: ${results.sent}, Failed: ${results.failed}`);
        return { success: true, ...results };
    } catch (error) {
        console.error('[DailyTaskDigest] Error sending daily task digest emails:', error);
        return { success: false, sent: 0, skipped: 0, failed: 0, errors: [{ error: error.message || 'Unknown error' }] };
    }
}

/**
 * Generate HTML email markup for daily digest
 * @param {Object} params 
 * @returns {string}
 */
function generateDigestEmailHtml({ userName, userUsername, todayStr, appUrl, totalIncomplete, overdueTasks, dueTodayTasks, otherActiveTasks }) {
    const tasksDashboardUrl = userUsername ? `${appUrl}/${userUsername}/dashboard/tasks` : `${appUrl}/dashboard/tasks`;
    const getTaskUrl = (taskId) => userUsername ? `${appUrl}/${userUsername}/dashboard/tasks/${taskId}` : `${appUrl}/dashboard/tasks/${taskId}`;

    // Overdue tasks markup (Highest Priority Emphasis)
    const overdueSectionHtml = overdueTasks.length > 0 ? `
        <div style="margin-bottom: 28px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 2px solid #ef4444; padding-bottom: 8px;">
                <h3 style="margin: 0; color: #dc2626; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                    🚨 Missed / Overdue Tasks (${overdueTasks.length})
                </h3>
                <span style="font-size: 12px; color: #dc2626; font-weight: 600; background: #fef2f2; padding: 2px 8px; border-radius: 4px; border: 1px solid #fca5a5;">Requires Immediate Attention</span>
            </div>
            ${overdueTasks.map(task => {
                const taskUrl = getTaskUrl(task.id);
                const dueDisplay = task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN') : 'N/A';
                return `
                    <div style="background-color: #fff5f5; border-left: 5px solid #ef4444; border-top: 1px solid #fee2e2; border-right: 1px solid #fee2e2; border-bottom: 1px solid #fee2e2; border-radius: 6px; padding: 14px 18px; margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="flex: 1; padding-right: 12px;">
                                <h4 style="margin: 0 0 6px 0; color: #991b1b; font-size: 15px; font-weight: 700;">
                                    <a href="${taskUrl}" style="color: #991b1b; text-decoration: none;">${escapeHtml(task.title)}</a>
                                </h4>
                                ${task.description ? `<p style="margin: 0 0 8px 0; color: #475569; font-size: 13px; line-height: 1.4;">${escapeHtml(task.description.length > 140 ? task.description.substring(0, 140) + '...' : task.description)}</p>` : ''}
                                <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
                                    ${task.category ? `<span style="background: #e2e8f0; color: #334155; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-right: 8px;">${escapeHtml(task.category)}</span>` : ''}
                                    ${task.creator_name ? `<span>Created by <strong>${escapeHtml(task.creator_name)}</strong></span>` : ''}
                                </div>
                            </div>
                            <div style="text-align: right; min-width: 110px;">
                                <div style="margin-bottom: 6px;">${getPriorityBadgeHtml(task.priority)}</div>
                                <div style="font-size: 12px; font-weight: 700; color: #dc2626; background: #fee2e2; padding: 3px 8px; border-radius: 4px; display: inline-block;">
                                    ${task.daysOverdue > 0 ? `${task.daysOverdue} day${task.daysOverdue > 1 ? 's' : ''} overdue` : 'Overdue'}
                                </div>
                                <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Due: ${dueDisplay}</div>
                            </div>
                        </div>
                        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #fca5a5; text-align: right;">
                            <a href="${taskUrl}" target="_blank" style="display: inline-block; font-size: 12px; font-weight: 700; color: #dc2626; text-decoration: none;">
                                View & Complete Task &rarr;
                            </a>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    ` : '';

    // Due Today tasks markup
    const dueTodaySectionHtml = dueTodayTasks.length > 0 ? `
        <div style="margin-bottom: 28px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">
                <h3 style="margin: 0; color: #b45309; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                    📅 Tasks Due Today (${dueTodayTasks.length})
                </h3>
            </div>
            ${dueTodayTasks.map(task => {
                const taskUrl = getTaskUrl(task.id);
                return `
                    <div style="background-color: #fffbeb; border-left: 5px solid #f59e0b; border-top: 1px solid #fef3c7; border-right: 1px solid #fef3c7; border-bottom: 1px solid #fef3c7; border-radius: 6px; padding: 14px 18px; margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="flex: 1; padding-right: 12px;">
                                <h4 style="margin: 0 0 6px 0; color: #78350f; font-size: 15px; font-weight: 700;">
                                    <a href="${taskUrl}" style="color: #78350f; text-decoration: none;">${escapeHtml(task.title)}</a>
                                </h4>
                                ${task.description ? `<p style="margin: 0 0 8px 0; color: #475569; font-size: 13px; line-height: 1.4;">${escapeHtml(task.description.length > 140 ? task.description.substring(0, 140) + '...' : task.description)}</p>` : ''}
                                <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
                                    ${task.category ? `<span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-right: 8px;">${escapeHtml(task.category)}</span>` : ''}
                                    ${task.creator_name ? `<span>Created by <strong>${escapeHtml(task.creator_name)}</strong></span>` : ''}
                                </div>
                            </div>
                            <div style="text-align: right; min-width: 110px;">
                                <div style="margin-bottom: 6px;">${getPriorityBadgeHtml(task.priority)}</div>
                                <div>${getStatusBadgeHtml(task.status)}</div>
                            </div>
                        </div>
                        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #fde68a; text-align: right;">
                            <a href="${taskUrl}" target="_blank" style="display: inline-block; font-size: 12px; font-weight: 700; color: #b45309; text-decoration: none;">
                                View & Complete Task &rarr;
                            </a>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    ` : '';

    // Other Active tasks markup
    const otherActiveSectionHtml = otherActiveTasks.length > 0 ? `
        <div style="margin-bottom: 24px;">
            <div style="margin-bottom: 12px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
                <h3 style="margin: 0; color: #1d4ed8; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                    📋 Active / Upcoming Incomplete Tasks (${otherActiveTasks.length})
                </h3>
            </div>
            ${otherActiveTasks.slice(0, 10).map(task => {
                const taskUrl = getTaskUrl(task.id);
                const dueDisplay = task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN') : 'No Due Date';
                return `
                    <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="margin: 0 0 4px 0; color: #1e293b; font-size: 14px; font-weight: 600;">
                                    <a href="${taskUrl}" style="color: #1e293b; text-decoration: none;">${escapeHtml(task.title)}</a>
                                </h4>
                                <div style="font-size: 12px; color: #64748b;">
                                    Due: <strong>${dueDisplay}</strong> ${task.category ? `&bull; ${escapeHtml(task.category)}` : ''}
                                </div>
                            </div>
                            <div style="text-align: right; display: flex; gap: 6px; align-items: center;">
                                ${getPriorityBadgeHtml(task.priority)}
                                ${getStatusBadgeHtml(task.status)}
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
            ${otherActiveTasks.length > 10 ? `
                <p style="text-align: center; color: #64748b; font-size: 13px; margin-top: 8px;">
                    + ${otherActiveTasks.length - 10} more active tasks. <a href="${tasksDashboardUrl}" style="color: #2563eb; font-weight: 600;">View all on Dashboard &rarr;</a>
                </p>
            ` : ''}
        </div>
    ` : '';

    // If completely caught up with 0 incomplete tasks
    const allCaughtUpHtml = totalIncomplete === 0 ? `
        <div style="text-align: center; background-color: #f0fdf4; border: 2px dashed #22c55e; border-radius: 12px; padding: 32px 20px; margin: 20px 0 30px 0;">
            <div style="font-size: 42px; margin-bottom: 8px;">🎉</div>
            <h3 style="margin: 0 0 6px 0; color: #15803d; font-size: 18px; font-weight: 700;">You're All Caught Up!</h3>
            <p style="margin: 0; color: #166534; font-size: 14px;">You have 0 overdue or pending tasks assigned to you right now. Great job!</p>
        </div>
    ` : '';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OCS365 Daily Task Digest</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; color: #334155;">
    <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); border: 1px solid #cbd5e1;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; padding: 28px 32px; text-align: left; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 4px;">OCS365 Work Management</span>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Morning Task Briefing</h1>
                    <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px;">${todayStr}</p>
                </div>
            </div>
        </div>

        <!-- Greeting & Summary Box -->
        <div style="padding: 24px 32px 10px 32px;">
            <p style="font-size: 16px; color: #1e293b; margin-top: 0; font-weight: 600;">Good morning, ${escapeHtml(userName)}!</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">Here is your daily task summary for today. Please review your pending deliverables below:</p>

            <!-- Stats Bar -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 24px; display: table; width: 100%; box-sizing: border-box;">
                <div style="display: table-cell; text-align: center; border-right: 1px solid #e2e8f0; width: 33.33%;">
                    <div style="font-size: 24px; font-weight: 800; color: ${overdueTasks.length > 0 ? '#ef4444' : '#64748b'};">${overdueTasks.length}</div>
                    <div style="font-size: 11px; font-weight: 700; color: ${overdueTasks.length > 0 ? '#dc2626' : '#64748b'}; text-transform: uppercase; margin-top: 2px;">Overdue</div>
                </div>
                <div style="display: table-cell; text-align: center; border-right: 1px solid #e2e8f0; width: 33.33%;">
                    <div style="font-size: 24px; font-weight: 800; color: ${dueTodayTasks.length > 0 ? '#f59e0b' : '#64748b'};">${dueTodayTasks.length}</div>
                    <div style="font-size: 11px; font-weight: 700; color: ${dueTodayTasks.length > 0 ? '#b45309' : '#64748b'}; text-transform: uppercase; margin-top: 2px;">Due Today</div>
                </div>
                <div style="display: table-cell; text-align: center; width: 33.33%;">
                    <div style="font-size: 24px; font-weight: 800; color: #2563eb;">${totalIncomplete}</div>
                    <div style="font-size: 11px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; margin-top: 2px;">Total Pending</div>
                </div>
            </div>

            ${allCaughtUpHtml}
            ${overdueSectionHtml}
            ${dueTodaySectionHtml}
            ${otherActiveSectionHtml}

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0 24px 0;">
                <a href="${tasksDashboardUrl}" target="_blank" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);">
                    Open Tasks Dashboard &rarr;
                </a>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                This email is automatically generated every morning at 10:00 AM IST by <strong>OCS365 Work Management</strong>.
            </p>
            <p style="margin: 6px 0 0 0; color: #cbd5e1; font-size: 11px;">
                &copy; ${new Date().getFullYear()} Online Consultancy Services (OCS). All rights reserved.
            </p>
        </div>

    </div>
</body>
</html>
    `;
}

/**
 * Basic HTML escaping helper to prevent injection in emails
 * @param {string} str 
 * @returns {string}
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

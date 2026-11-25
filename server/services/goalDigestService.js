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
 * @param {string} statusName 
 * @param {string} badgeColor
 * @returns {string}
 */
function getStatusBadgeHtml(statusName, badgeColor) {
    const name = statusName || 'Active';
    const bg = badgeColor ? `${badgeColor}18` : '#e0e7ff';
    const color = badgeColor || '#3730a3';

    return `<span style="display: inline-block; padding: 3px 9px; font-size: 11px; font-weight: 600; background-color: ${bg}; color: ${color}; border-radius: 12px; border: 1px solid ${color}30;">${name}</span>`;
}

/**
 * Helper to get the correct frontend base URL (React client app, not backend node port)
 * @returns {string}
 */
export function getFrontendAppUrl() {
    if (process.env.CLIENT_URL) return process.env.CLIENT_URL.replace(/\/$/, '');
    if (process.env.APP_FRONTEND_URL) return process.env.APP_FRONTEND_URL.replace(/\/$/, '');
    
    if (process.env.APP_BASE_URL && !process.env.APP_BASE_URL.includes(':3000')) {
        return process.env.APP_BASE_URL.replace(/\/$/, '');
    }
    
    const clientPort = process.env.CLIENT_PORT || 5173;
    return `http://localhost:${clientPort}`;
}

/**
 * Send Daily Goal Reminder emails to all active users.
 * Runs at 10:00 AM IST daily via scheduled cron job (same as daily task digest).
 * 
 * @param {Date} [reportDate] - Optional date override (defaults to current date)
 * @returns {Promise<{success: boolean, sent: number, skipped: number, failed: number, errors: Array}>}
 */
export async function sendDailyGoalReminderEmails(reportDate = new Date()) {
    try {
        const appUrl = getFrontendAppUrl();

        // Fetch all active users with valid email address
        const [users] = await appDB.query(
            `SELECT username, name, email 
             FROM users 
             WHERE is_active = 1 AND email IS NOT NULL AND TRIM(email) != ''`
        );

        if (!users || users.length === 0) {
            console.log('[DailyGoalReminder] No active users found for email reminder.');
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
                // Fetch assigned active/incomplete goals for this user
                const [goals] = await appDB.query(
                    `SELECT 
                        g.goal_id,
                        g.title,
                        g.description,
                        g.category_id,
                        g.business_impact_id,
                        g.quarter,
                        g.financial_year,
                        g.target_date,
                        g.status_id,
                        g.progress,
                        g.priority,
                        g.remarks,
                        gc.name AS category_name,
                        gbi.name AS business_impact_name,
                        gs.name AS status_name,
                        gs.code AS status_code,
                        gs.badge_color AS status_badge_color,
                        gs.is_completed_status,
                        (
                            SELECT GROUP_CONCAT(COALESCE(u_own.name, go2.username) SEPARATOR ', ')
                            FROM goal_owners go2
                            LEFT JOIN users u_own ON go2.username = u_own.username
                            WHERE go2.goal_id = g.goal_id
                        ) AS co_owners
                     FROM goal_owners go
                     JOIN goals g ON go.goal_id = g.goal_id
                     LEFT JOIN goal_categories gc ON g.category_id = gc.category_id
                     LEFT JOIN goal_business_impacts gbi ON g.business_impact_id = gbi.impact_id
                     LEFT JOIN goal_statuses gs ON g.status_id = gs.status_id
                     WHERE go.username = ?
                       AND g.is_deleted = 0
                       AND (gs.is_completed_status = 0 OR gs.is_completed_status IS NULL)
                       AND (gs.code != 'cancelled' OR gs.code IS NULL)
                     ORDER BY 
                       CASE 
                         WHEN g.target_date IS NOT NULL AND DATE(g.target_date) < CURDATE() THEN 0
                         WHEN DATE(g.target_date) = CURDATE() THEN 1
                         ELSE 2 
                       END ASC,
                       g.target_date ASC,
                       CASE UPPER(g.priority)
                         WHEN 'URGENT' THEN 0 
                         WHEN 'HIGH' THEN 1 
                         WHEN 'MEDIUM' THEN 2 
                         WHEN 'LOW' THEN 3 
                         ELSE 4
                       END ASC`,
                    [user.username]
                );

                if (!goals || goals.length === 0) {
                    results.skipped++;
                    continue;
                }

                // Group goals
                const overdueGoals = [];
                const dueTodayGoals = [];
                const activeGoals = [];

                const todayObj = new Date(reportDate);
                todayObj.setHours(0, 0, 0, 0);

                goals.forEach(goal => {
                    if (goal.target_date) {
                        const targetDateObj = new Date(goal.target_date);
                        targetDateObj.setHours(0, 0, 0, 0);

                        if (targetDateObj < todayObj) {
                            overdueGoals.push({
                                ...goal,
                                daysOverdue: getDaysOverdue(goal.target_date, todayObj)
                            });
                        } else if (targetDateObj.getTime() === todayObj.getTime()) {
                            dueTodayGoals.push(goal);
                        } else {
                            activeGoals.push(goal);
                        }
                    } else {
                        activeGoals.push(goal);
                    }
                });

                const totalIncomplete = overdueGoals.length + dueTodayGoals.length + activeGoals.length;

                // Build HTML Content
                const html = generateGoalReminderEmailHtml({
                    userName: user.name || user.username,
                    userUsername: user.username,
                    todayStr,
                    appUrl,
                    totalIncomplete,
                    overdueGoals,
                    dueTodayGoals,
                    activeGoals
                });

                const subject = overdueGoals.length > 0 
                    ? `⚠️ Action Required: ${overdueGoals.length} Overdue Goal${overdueGoals.length > 1 ? 's' : ''} - Morning Reminder (${todayStr})`
                    : `🎯 OCS365 Daily Goal Reminder - ${todayStr}`;

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
                console.error(`[DailyGoalReminder] Failed to process user ${user.username}:`, userErr);
                results.failed++;
                results.errors.push({ username: user.username, email: user.email, error: userErr.message });
            }
        }

        console.log(`[DailyGoalReminder] Completed daily goal reminders. Sent: ${results.sent}, Skipped: ${results.skipped}, Failed: ${results.failed}`);
        return { success: true, ...results };
    } catch (error) {
        console.error('[DailyGoalReminder] Error sending daily goal reminder emails:', error);
        return { success: false, sent: 0, skipped: 0, failed: 0, errors: [{ error: error.message || 'Unknown error' }] };
    }
}

/**
 * Generate HTML email markup for daily goal reminder
 * @param {Object} params 
 * @returns {string}
 */
function generateGoalReminderEmailHtml({ userName, userUsername, todayStr, appUrl, totalIncomplete, overdueGoals, dueTodayGoals, activeGoals }) {
    const goalsDashboardUrl = userUsername ? `${appUrl}/${userUsername}/dashboard/goals` : `${appUrl}/dashboard/goals`;
    const getGoalUrl = (goalId) => userUsername ? `${appUrl}/${userUsername}/dashboard/goals/${goalId}` : `${appUrl}/dashboard/goals/${goalId}`;

    // Overdue goals markup
    const overdueSectionHtml = overdueGoals.length > 0 ? `
        <div style="margin-bottom: 28px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 2px solid #ef4444; padding-bottom: 8px;">
                <h3 style="margin: 0; color: #dc2626; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                    🚨 Overdue Target Goals (${overdueGoals.length})
                </h3>
                <span style="font-size: 12px; color: #dc2626; font-weight: 600; background: #fef2f2; padding: 2px 8px; border-radius: 4px; border: 1px solid #fca5a5;">Requires Immediate Focus</span>
            </div>
            ${overdueGoals.map(goal => {
                const goalUrl = getGoalUrl(goal.goal_id);
                const targetDisplay = goal.target_date ? new Date(goal.target_date).toLocaleDateString('en-IN') : 'N/A';
                const progressNum = Math.min(100, Math.max(0, Number(goal.progress) || 0));
                return `
                <div style="background: #fff; border: 1px solid #fee2e2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 14px 16px; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <a href="${goalUrl}" style="font-size: 14px; font-weight: 600; color: #1e293b; text-decoration: none; line-height: 1.4; display: block; flex: 1; margin-right: 12px;">
                            ${escapeHtml(goal.title)}
                        </a>
                        <div style="white-space: nowrap;">
                            ${getPriorityBadgeHtml(goal.priority)}
                        </div>
                    </div>
                    
                    <!-- Progress Bar -->
                    <div style="margin: 8px 0;">
                        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 3px;">
                            <span>Progress</span>
                            <span style="color: #dc2626; font-weight: 700;">${progressNum}%</span>
                        </div>
                        <div style="width: 100%; height: 6px; background-color: #f1f5f9; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${progressNum}%; height: 100%; background: linear-gradient(90deg, #ef4444, #dc2626); border-radius: 3px;"></div>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #64748b; margin-top: 8px;">
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span style="color: #dc2626; font-weight: 600;">⚠️ ${goal.daysOverdue} day${goal.daysOverdue === 1 ? '' : 's'} overdue</span>
                            <span>•</span>
                            <span>Target: ${targetDisplay}</span>
                            ${goal.quarter ? `<span>•</span><span>${escapeHtml(goal.quarter)} ${escapeHtml(goal.financial_year || '')}</span>` : ''}
                        </div>
                        <a href="${goalUrl}" style="color: #2563eb; text-decoration: none; font-weight: 600; font-size: 12px;">Update Goal &rarr;</a>
                    </div>
                </div>`;
            }).join('')}
        </div>
    ` : '';

    // Due today goals markup
    const dueTodaySectionHtml = dueTodayGoals.length > 0 ? `
        <div style="margin-bottom: 28px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">
                <h3 style="margin: 0; color: #b45309; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                    📌 Target Reached Today (${dueTodayGoals.length})
                </h3>
                <span style="font-size: 12px; color: #b45309; font-weight: 600; background: #fffbeb; padding: 2px 8px; border-radius: 4px; border: 1px solid #fde68a;">Target Due Today</span>
            </div>
            ${dueTodayGoals.map(goal => {
                const goalUrl = getGoalUrl(goal.goal_id);
                const progressNum = Math.min(100, Math.max(0, Number(goal.progress) || 0));
                return `
                <div style="background: #fff; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 14px 16px; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <a href="${goalUrl}" style="font-size: 14px; font-weight: 600; color: #1e293b; text-decoration: none; line-height: 1.4; display: block; flex: 1; margin-right: 12px;">
                            ${escapeHtml(goal.title)}
                        </a>
                        <div style="white-space: nowrap;">
                            ${getPriorityBadgeHtml(goal.priority)}
                        </div>
                    </div>

                    <!-- Progress Bar -->
                    <div style="margin: 8px 0;">
                        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 3px;">
                            <span>Progress</span>
                            <span style="color: #d97706; font-weight: 700;">${progressNum}%</span>
                        </div>
                        <div style="width: 100%; height: 6px; background-color: #f1f5f9; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${progressNum}%; height: 100%; background: linear-gradient(90deg, #f59e0b, #d97706); border-radius: 3px;"></div>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #64748b; margin-top: 8px;">
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span style="color: #b45309; font-weight: 600;">Target Today</span>
                            ${goal.category_name ? `<span>•</span><span>${escapeHtml(goal.category_name)}</span>` : ''}
                            ${goal.quarter ? `<span>•</span><span>${escapeHtml(goal.quarter)} ${escapeHtml(goal.financial_year || '')}</span>` : ''}
                        </div>
                        <a href="${goalUrl}" style="color: #2563eb; text-decoration: none; font-weight: 600; font-size: 12px;">Review & Update &rarr;</a>
                    </div>
                </div>`;
            }).join('')}
        </div>
    ` : '';

    // Active & upcoming goals markup
    const activeSectionHtml = activeGoals.length > 0 ? `
        <div style="margin-bottom: 28px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
                <h3 style="margin: 0; color: #1d4ed8; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                    🎯 Active Goals (${activeGoals.length})
                </h3>
            </div>
            ${activeGoals.map(goal => {
                const goalUrl = getGoalUrl(goal.goal_id);
                const targetDisplay = goal.target_date ? new Date(goal.target_date).toLocaleDateString('en-IN') : 'No target date';
                const progressNum = Math.min(100, Math.max(0, Number(goal.progress) || 0));
                return `
                <div style="background: #fff; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 14px 16px; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <a href="${goalUrl}" style="font-size: 14px; font-weight: 600; color: #1e293b; text-decoration: none; line-height: 1.4; display: block; flex: 1; margin-right: 12px;">
                            ${escapeHtml(goal.title)}
                        </a>
                        <div style="display: flex; gap: 6px; align-items: center; white-space: nowrap;">
                            ${getStatusBadgeHtml(goal.status_name, goal.status_badge_color)}
                            ${getPriorityBadgeHtml(goal.priority)}
                        </div>
                    </div>

                    <!-- Progress Bar -->
                    <div style="margin: 8px 0;">
                        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 3px;">
                            <span>Progress</span>
                            <span style="color: #2563eb; font-weight: 700;">${progressNum}%</span>
                        </div>
                        <div style="width: 100%; height: 6px; background-color: #f1f5f9; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${progressNum}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb); border-radius: 3px;"></div>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #64748b; margin-top: 8px;">
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span>Target: ${targetDisplay}</span>
                            ${goal.category_name ? `<span>•</span><span>${escapeHtml(goal.category_name)}</span>` : ''}
                            ${goal.quarter ? `<span>•</span><span>${escapeHtml(goal.quarter)} ${escapeHtml(goal.financial_year || '')}</span>` : ''}
                        </div>
                        <a href="${goalUrl}" style="color: #2563eb; text-decoration: none; font-weight: 600; font-size: 12px;">View &rarr;</a>
                    </div>
                </div>`;
            }).join('')}
        </div>
    ` : '';

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Goal Reminder</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px; color: #1e293b; line-height: 1.5;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 28px 24px; color: #ffffff;">
                <div style="font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #93c5fd; margin-bottom: 6px;">
                    OCS365 Operations Platform
                </div>
                <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #ffffff;">
                    🎯 Daily Goal Reminder
                </h1>
                <p style="margin: 0; font-size: 13px; color: #bfdbfe;">
                    ${todayStr}
                </p>
            </div>

            <!-- Body -->
            <div style="padding: 24px;">
                <p style="margin-top: 0; margin-bottom: 18px; font-size: 15px; color: #334155;">
                    Good morning <strong>${escapeHtml(userName)}</strong>,
                </p>
                <p style="margin-top: 0; margin-bottom: 24px; font-size: 14px; color: #64748b; line-height: 1.6;">
                    Here is your daily morning summary of active strategic and operational goals. Keeping steady progress every day ensures target success by the quarter end.
                </p>

                <!-- Status Cards -->
                <div style="display: flex; gap: 8px; margin-bottom: 28px;">
                    <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center;">
                        <div style="font-size: 20px; font-weight: 800; color: #1e293b;">${totalIncomplete}</div>
                        <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Active</div>
                    </div>
                    ${overdueGoals.length > 0 ? `
                    <div style="flex: 1; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; text-align: center;">
                        <div style="font-size: 20px; font-weight: 800; color: #dc2626;">${overdueGoals.length}</div>
                        <div style="font-size: 11px; font-weight: 600; color: #b91c1c; text-transform: uppercase;">Overdue</div>
                    </div>` : ''}
                    ${dueTodayGoals.length > 0 ? `
                    <div style="flex: 1; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; text-align: center;">
                        <div style="font-size: 20px; font-weight: 800; color: #d97706;">${dueTodayGoals.length}</div>
                        <div style="font-size: 11px; font-weight: 600; color: #b45309; text-transform: uppercase;">Due Today</div>
                    </div>` : ''}
                </div>

                <!-- Goal Sections -->
                ${overdueSectionHtml}
                ${dueTodaySectionHtml}
                ${activeSectionHtml}

                <!-- CTA Button -->
                <div style="text-align: center; margin-top: 32px; margin-bottom: 12px;">
                    <a href="${goalsDashboardUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
                        Open Goals Dashboard &rarr;
                    </a>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                    This automated daily reminder is sent every morning at 10:00 AM IST to all goal owners.<br>
                    &copy; ${new Date().getFullYear()} OCS BOP • SubSync
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
}

/**
 * Escape HTML special characters
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

import appDB from '../db/subsyncDB.js';
import { sendEmail } from './emailService.js';
import { getFrontendAppUrl } from './taskDigestService.js';

/**
 * Format date to IST string
 * @param {Date} date 
 * @returns {string}
 */
function formatDateIST(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
    });
}

/**
 * Calculate Monday 00:00:00 IST to Saturday 23:59:59 IST date range for a given reference date
 * @param {Date} [referenceDate] 
 * @returns {{ startDate: Date, endDate: Date, startDateStr: string, endDateStr: string }}
 */
export function getMonSatDateRange(referenceDate = new Date()) {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const refIST = new Date(referenceDate.getTime() + IST_OFFSET_MS);

    const year = refIST.getUTCFullYear();
    const month = refIST.getUTCMonth();
    const date = refIST.getUTCDate();
    const dayOfWeek = refIST.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

    // Calculate days since Monday of current week
    const diffToMon = dayOfWeek === 0 ? 6 : (dayOfWeek - 1);

    // Monday 00:00:00 IST in UTC
    const startDate = new Date(Date.UTC(year, month, date - diffToMon, 0, 0, 0, 0) - IST_OFFSET_MS);

    // Saturday 23:59:59.999 IST in UTC
    const endDate = new Date(Date.UTC(year, month, date - diffToMon + 5, 23, 59, 59, 999) - IST_OFFSET_MS);

    return {
        startDate,
        endDate,
        startDateStr: formatDateIST(startDate),
        endDateStr: formatDateIST(endDate)
    };
}

/**
 * Calculate the 4 weekly buckets for the month of referenceDate
 * @param {Date} [referenceDate] 
 * @returns {{ monthName: string, year: number, weeks: Array<{ label: string, periodStr: string, startDate: Date, endDate: Date }> }}
 */
export function getMonthWeeklyBuckets(referenceDate = new Date()) {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const refIST = new Date(referenceDate.getTime() + IST_OFFSET_MS);

    const year = refIST.getUTCFullYear();
    const month = refIST.getUTCMonth(); // 0-indexed
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const monthName = refIST.toLocaleDateString('en-IN', { month: 'long', timeZone: 'Asia/Kolkata' });
    const shortMonth = refIST.toLocaleDateString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' });

    // 4 non-overlapping, contiguous weekly buckets spanning the entire month:
    // Week 1: Day 1 - 7
    // Week 2: Day 8 - 14
    // Week 3: Day 15 - 21
    // Week 4: Day 22 - End of Month (e.g. 30 or 31)
    const buckets = [
        { label: 'WEEK 1', startDay: 1, endDay: 7 },
        { label: 'WEEK 2', startDay: 8, endDay: 14 },
        { label: 'WEEK 3', startDay: 15, endDay: 21 },
        { label: 'WEEK 4', startDay: 22, endDay: lastDayOfMonth }
    ];

    const weeks = buckets.map(b => {
        const startDate = new Date(Date.UTC(year, month, b.startDay, 0, 0, 0, 0) - IST_OFFSET_MS);
        const endDate = new Date(Date.UTC(year, month, b.endDay, 23, 59, 59, 999) - IST_OFFSET_MS);
        return {
            label: b.label,
            periodStr: `${b.startDay} &ndash; ${b.endDay} ${shortMonth}`,
            startDate,
            endDate
        };
    });

    return {
        monthName,
        year,
        weeks
    };
}

/**
 * Priority badge helper for HTML email
 */
function getPriorityBadgeHtml(priority) {
    const p = (priority || 'MEDIUM').toUpperCase();
    let bg = '#f1f5f9';
    let color = '#475569';

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

    return `<span style="display: inline-block; padding: 3px 8px; font-size: 11px; font-weight: 700; background-color: ${bg}; color: ${color}; border-radius: 10px; text-transform: uppercase;">${p}</span>`;
}

/**
 * Status badge helper for HTML email
 */
function getStatusBadgeHtml(status) {
    const s = (status || 'TODO').toUpperCase();
    let bg = '#f1f5f9';
    let color = '#475569';

    if (s === 'COMPLETED') {
        bg = '#dcfce7';
        color = '#15803d';
    } else if (s === 'IN_PROGRESS') {
        bg = '#e0e7ff';
        color = '#3730a3';
    } else if (s === 'BLOCKED') {
        bg = '#fee2e2';
        color = '#b91c1c';
    } else if (s === 'TODO') {
        bg = '#f3f4f6';
        color = '#374151';
    }

    return `<span style="display: inline-block; padding: 3px 8px; font-size: 11px; font-weight: 600; background-color: ${bg}; color: ${color}; border-radius: 10px;">${s.replace('_', ' ')}</span>`;
}

/**
 * Fetch admin user details (email, username, name) from process.env.ADMIN_EMAILS with DB fallback
 */
export async function getAdminUsers() {
    let emailList = [];
    if (process.env.ADMIN_EMAILS) {
        emailList = process.env.ADMIN_EMAILS
            .split(',')
            .map(e => e.split('#')[0].trim())
            .filter(Boolean);
    }

    const adminUsers = [];
    const processedEmails = new Set();

    if (emailList.length > 0) {
        try {
            const [users] = await appDB.query(
                `SELECT username, name, email FROM users WHERE is_active = 1 AND email IN (?)`,
                [emailList]
            );
            const userByEmailMap = new Map(users.map(u => [u.email.toLowerCase(), u]));

            for (const email of emailList) {
                const lower = email.toLowerCase();
                if (processedEmails.has(lower)) continue;
                processedEmails.add(lower);

                const dbUser = userByEmailMap.get(lower);
                adminUsers.push({
                    email,
                    username: dbUser?.username || null,
                    name: dbUser?.name || null
                });
            }
        } catch (err) {
            console.error('[WeeklyTaskReport] Error querying admin users by email list:', err);
            for (const email of emailList) {
                const lower = email.toLowerCase();
                if (!processedEmails.has(lower)) {
                    processedEmails.add(lower);
                    adminUsers.push({ email, username: null, name: null });
                }
            }
        }
    }

    if (adminUsers.length === 0) {
        try {
            const [rows] = await appDB.query(
                `SELECT u.username, u.name, u.email 
                 FROM users u 
                 LEFT JOIN roles r ON u.role_id = r.id 
                 WHERE u.is_active = 1 
                   AND r.role_key = 'admin' 
                   AND u.email IS NOT NULL 
                   AND TRIM(u.email) != ''`
            );
            for (const r of rows) {
                const lower = r.email.trim().toLowerCase();
                if (!processedEmails.has(lower)) {
                    processedEmails.add(lower);
                    adminUsers.push({
                        email: r.email.trim(),
                        username: r.username,
                        name: r.name
                    });
                }
            }
        } catch (err) {
            console.error('[WeeklyTaskReport] Error fetching fallback admin users from DB:', err);
        }
    }

    return adminUsers;
}

/**
 * Generate and send weekly consolidated task report email to admins
 * @param {Date} [referenceDate] 
 * @returns {Promise<{ success: boolean, recipients: string[], metrics: Object }>}
 */
export async function sendWeeklyTaskReportEmail(referenceDate = new Date()) {
    console.log(`[WeeklyTaskReport] Generating report for reference date: ${referenceDate.toISOString()}`);
    const { startDate, endDate, startDateStr, endDateStr } = getMonSatDateRange(referenceDate);

    const adminUsers = await getAdminUsers();
    if (!adminUsers || adminUsers.length === 0) {
        console.warn('[WeeklyTaskReport] No admin emails found. Skipping report email.');
        return { success: false, reason: 'NO_ADMIN_EMAILS', recipients: [] };
    }

    const recipientEmails = adminUsers.map(u => u.email);
    console.log(`[WeeklyTaskReport] Period: ${startDateStr} -> ${endDateStr}`);
    console.log(`[WeeklyTaskReport] Recipients: ${recipientEmails.join(', ')}`);

    try {
        // 0. Monthly Status Breakdown (Week 1 to Week 4)
        const monthConfig = getMonthWeeklyBuckets(referenceDate);
        const monthWeeklyBreakdown = [];
        let monthTotalCreated = 0;
        let monthTotalCompleted = 0;
        let monthTotalOverdue = 0;

        for (const w of monthConfig.weeks) {
            const [[wCreated]] = await appDB.query(
                `SELECT COUNT(*) as count FROM tasks WHERE created_at >= ? AND created_at <= ?`,
                [w.startDate, w.endDate]
            );
            const [[wCompleted]] = await appDB.query(
                `SELECT COUNT(*) as count FROM tasks WHERE status = 'COMPLETED' AND updated_at >= ? AND updated_at <= ?`,
                [w.startDate, w.endDate]
            );
            const [[wOverdue]] = await appDB.query(
                `SELECT COUNT(*) as count FROM tasks 
                 WHERE status NOT IN ('COMPLETED', 'CANCELLED') 
                   AND due_date IS NOT NULL 
                   AND DATE(due_date) < CURDATE() 
                   AND created_at >= ? AND created_at <= ?`,
                [w.startDate, w.endDate]
            );

            const c = Number(wCreated?.count || 0);
            const comp = Number(wCompleted?.count || 0);
            const ov = Number(wOverdue?.count || 0);
            const net = c - comp;

            monthTotalCreated += c;
            monthTotalCompleted += comp;
            monthTotalOverdue += ov;

            monthWeeklyBreakdown.push({
                label: w.label,
                periodStr: w.periodStr,
                created: c,
                completed: comp,
                overdue: ov,
                netChange: net,
                velocity: c > 0 ? Math.round((comp / c) * 100) : (comp > 0 ? 100 : 0)
            });
        }

        const monthVelocity = monthTotalCreated > 0
            ? Math.round((monthTotalCompleted / monthTotalCreated) * 100)
            : (monthTotalCompleted > 0 ? 100 : 0);

        const monthSummary = {
            monthName: monthConfig.monthName,
            year: monthConfig.year,
            weeks: monthWeeklyBreakdown,
            totalCreated: monthTotalCreated,
            totalCompleted: monthTotalCompleted,
            totalOverdue: monthTotalOverdue,
            totalNetChange: monthTotalCreated - monthTotalCompleted,
            velocity: monthVelocity
        };

        // 1. Executive Summary Metrics (Current Mon-Sat Cycle)
        const [[createdRow]] = await appDB.query(
            `SELECT COUNT(*) as count FROM tasks WHERE created_at >= ? AND created_at <= ?`,
            [startDate, endDate]
        );
        const [[completedRow]] = await appDB.query(
            `SELECT COUNT(*) as count FROM tasks WHERE status = 'COMPLETED' AND updated_at >= ? AND updated_at <= ?`,
            [startDate, endDate]
        );
        const [[totalActiveRow]] = await appDB.query(
            `SELECT COUNT(*) as count FROM tasks WHERE status NOT IN ('COMPLETED', 'CANCELLED')`
        );
        const [[overdueRow]] = await appDB.query(
            `SELECT COUNT(*) as count FROM tasks WHERE status NOT IN ('COMPLETED', 'CANCELLED') AND due_date IS NOT NULL AND DATE(due_date) < CURDATE()`
        );
        const [[inProgressRow]] = await appDB.query(
            `SELECT COUNT(*) as count FROM tasks WHERE status = 'IN_PROGRESS'`
        );
        const [[blockedRow]] = await appDB.query(
            `SELECT COUNT(*) as count FROM tasks WHERE status = 'BLOCKED'`
        );

        const createdThisWeek = Number(createdRow?.count || 0);
        const completedThisWeek = Number(completedRow?.count || 0);
        const totalActiveTasks = Number(totalActiveRow?.count || 0);
        const overdueTasksCount = Number(overdueRow?.count || 0);
        const inProgressCount = Number(inProgressRow?.count || 0);
        const blockedTasksCount = Number(blockedRow?.count || 0);

        const weeklyVelocity = createdThisWeek > 0 ? Math.round((completedThisWeek / createdThisWeek) * 100) : (completedThisWeek > 0 ? 100 : 0);

        // 2. Team Member Productivity & Workload Table
        // Total Active strictly equals (In Progress + Todo + Blocked)
        const [assigneeRows] = await appDB.query(
            `SELECT 
                t.assigned_to AS username,
                COALESCE(u.name, t.assigned_to) AS name,
                SUM(CASE WHEN t.status NOT IN ('COMPLETED', 'CANCELLED') THEN 1 ELSE 0 END) AS total_active,
                SUM(CASE WHEN t.status = 'COMPLETED' AND t.updated_at >= ? AND t.updated_at <= ? THEN 1 ELSE 0 END) AS completed_this_week,
                SUM(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress_count,
                SUM(CASE WHEN t.status = 'TODO' THEN 1 ELSE 0 END) AS todo_count,
                SUM(CASE WHEN t.status = 'BLOCKED' THEN 1 ELSE 0 END) AS blocked_count,
                SUM(CASE WHEN t.due_date IS NOT NULL AND DATE(t.due_date) < CURDATE() AND t.status NOT IN ('COMPLETED', 'CANCELLED') THEN 1 ELSE 0 END) AS overdue_count
             FROM tasks t
             LEFT JOIN users u ON t.assigned_to = u.username
             WHERE t.assigned_to IS NOT NULL AND TRIM(t.assigned_to) != ''
             GROUP BY t.assigned_to, u.name
             HAVING total_active > 0 OR completed_this_week > 0
             ORDER BY completed_this_week DESC, total_active DESC
             LIMIT 20`,
            [startDate, endDate]
        );

        // 3. Priority Distribution for Open Tasks
        const [priorityRows] = await appDB.query(
            `SELECT priority, COUNT(*) as count 
             FROM tasks 
             WHERE status NOT IN ('COMPLETED', 'CANCELLED') 
             GROUP BY priority`
        );
        const priorityMap = { URGENT: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
        priorityRows.forEach(r => {
            if (priorityMap.hasOwnProperty(r.priority)) priorityMap[r.priority] = Number(r.count);
        });

        // 4. Critical Attention & Bottlenecks
        // 4a. Blocked Tasks
        const [blockedTasks] = await appDB.query(
            `SELECT t.id, t.title, t.priority, t.assigned_to, COALESCE(u.name, t.assigned_to) as assignee_name, t.updated_at
             FROM tasks t
             LEFT JOIN users u ON t.assigned_to = u.username
             WHERE t.status = 'BLOCKED'
             ORDER BY t.updated_at DESC
             LIMIT 5`
        );

        // 4b. Urgent & High Overdue Tasks
        const [urgentOverdueTasks] = await appDB.query(
            `SELECT t.id, t.title, t.priority, t.due_date, t.assigned_to, COALESCE(u.name, t.assigned_to) as assignee_name, DATEDIFF(CURDATE(), t.due_date) as days_overdue
             FROM tasks t
             LEFT JOIN users u ON t.assigned_to = u.username
             WHERE t.status NOT IN ('COMPLETED', 'CANCELLED')
               AND t.priority IN ('URGENT', 'HIGH')
               AND t.due_date IS NOT NULL 
               AND DATE(t.due_date) < CURDATE()
             ORDER BY t.due_date ASC
             LIMIT 5`
        );

        // 4c. Stagnant Tasks (In progress or Todo with no updates for > 5 days)
        const [stagnantTasks] = await appDB.query(
            `SELECT t.id, t.title, t.status, t.priority, t.assigned_to, COALESCE(u.name, t.assigned_to) as assignee_name, DATEDIFF(NOW(), t.updated_at) as idle_days
             FROM tasks t
             LEFT JOIN users u ON t.assigned_to = u.username
             WHERE t.status IN ('IN_PROGRESS', 'TODO')
               AND t.updated_at < DATE_SUB(NOW(), INTERVAL 5 DAY)
             ORDER BY t.updated_at ASC
             LIMIT 5`
        );

        const baseUrl = getFrontendAppUrl();
        const subject = `[Admin Report] Consolidated Tasks Summary (${monthSummary.monthName} & Week of ${startDateStr} - ${endDateStr})`;
        let lastProviderId = null;

        const currentDayOfMonth = new Date(referenceDate.getTime() + 5.5 * 60 * 60 * 1000).getUTCDate();
        const currentWeekNum = currentDayOfMonth <= 7 ? 1 : (currentDayOfMonth <= 14 ? 2 : (currentDayOfMonth <= 21 ? 3 : 4));

        // Send customized email to each admin with their dynamic username CTA link
        for (const adminUser of adminUsers) {
            const usernameSegment = adminUser.username ? `${adminUser.username}/` : '';
            const ctaUrl = `${baseUrl}/${usernameSegment}dashboard/tasks/analytics`;

            const html = generateWeeklyReportHtml({
                startDateStr,
                endDateStr,
                currentWeekNum,
                monthSummary,
                createdThisWeek,
                completedThisWeek,
                totalActiveTasks,
                overdueTasksCount,
                inProgressCount,
                blockedTasksCount,
                weeklyVelocity,
                assigneeRows,
                priorityMap,
                blockedTasks,
                urgentOverdueTasks,
                stagnantTasks,
                ctaUrl
            });

            const sendRes = await sendEmail({
                to: adminUser.email,
                subject,
                html
            });
            lastProviderId = sendRes.providerId;
        }

        console.log(`[WeeklyTaskReport] Successfully sent report email to ${adminUsers.length} admins.`);
        return {
            success: true,
            recipients: recipientEmails,
            providerId: lastProviderId,
            metrics: {
                createdThisWeek,
                completedThisWeek,
                totalActiveTasks,
                overdueTasksCount,
                blockedTasksCount
            }
        };

    } catch (error) {
        console.error('[WeeklyTaskReport] Error generating weekly task report:', error);
        throw error;
    }
}

/**
 * Construct HTML template for weekly task digest report email
 */
function generateWeeklyReportHtml(data) {
    const {
        startDateStr,
        endDateStr,
        currentWeekNum,
        monthSummary,
        createdThisWeek,
        completedThisWeek,
        totalActiveTasks,
        overdueTasksCount,
        inProgressCount,
        blockedTasksCount,
        weeklyVelocity,
        assigneeRows,
        priorityMap,
        blockedTasks,
        urgentOverdueTasks,
        stagnantTasks,
        ctaUrl
    } = data;

    const monthTitle = monthSummary?.monthName || 'Month Overview';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consolidated Tasks Report - ${monthTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f9; color: #1e293b;">

<table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f4f6f9; padding: 20px 0;">
    <tr>
        <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="680" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e2e8f0;">
                
                <!-- HEADER -->
                <tr>
                    <td style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); padding: 32px 36px; text-align: left;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td>
                                    <span style="display: inline-block; padding: 4px 12px; background-color: rgba(255, 255, 255, 0.15); color: #e0e7ff; font-size: 11px; font-weight: 700; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                                        Subsync Executive Digest
                                    </span>
                                    <h1 style="margin: 4px 0 0 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                                        Consolidated Tasks Summary
                                    </h1>
                                    <p style="margin: 6px 0 0 0; color: #c7d2fe; font-size: 14px; font-weight: 400;">
                                        ${monthTitle} Progression &amp; Current Week (${startDateStr} &ndash; ${endDateStr})
                                    </p>
                                </td>
                                <td align="right" valign="top" style="width: 120px;">
                                    <div style="background-color: rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 10px; text-align: center;">
                                        <span style="display: block; color: #818cf8; font-size: 10px; font-weight: 700; text-transform: uppercase;">Week Resolution</span>
                                        <span style="display: block; color: #ffffff; font-size: 20px; font-weight: 800; margin-top: 2px;">${weeklyVelocity}%</span>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- CONTENT BODY -->
                <tr>
                    <td style="padding: 32px 36px;">

                        <!-- ============================================== -->
                        <!-- 1) MONTH [MONTHNAME] -->
                        <!-- ============================================== -->
                        <div style="margin-bottom: 36px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px;">
                                <tr>
                                    <td>
                                        <h2 style="font-size: 16px; font-weight: 800; color: #1e1b4b; margin: 0;">
                                            1) Month ${monthTitle}
                                        </h2>
                                        <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 700; color: #334155;">
                                            Status for the month
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                                <thead>
                                    <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                                        <th style="padding: 11px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Week</th>
                                        <th style="padding: 11px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Period</th>
                                        <th style="padding: 11px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Created</th>
                                        <th style="padding: 11px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Completed</th>
                                        <th style="padding: 11px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Overdue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${monthSummary && monthSummary.weeks ? monthSummary.weeks.map((w, idx) => {
                                        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                                        return `
                                        <tr style="background-color: ${bg}; border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #1e293b;">
                                                ${w.label}
                                            </td>
                                            <td style="padding: 10px 12px; text-align: center; font-size: 12px; color: #64748b;">
                                                ${w.periodStr}
                                            </td>
                                            <td style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 700; color: #1e293b;">
                                                ${w.created}
                                            </td>
                                            <td style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 700; color: #15803d;">
                                                ${w.completed}
                                            </td>
                                            <td style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 700; color: ${w.overdue > 0 ? '#b91c1c' : '#94a3b8'};">
                                                ${w.overdue > 0 ? `<span style="display: inline-block; padding: 2px 7px; background-color: #fee2e2; border-radius: 6px; color: #b91c1c;">${w.overdue}</span>` : '0'}
                                            </td>
                                        </tr>
                                        `;
                                    }).join('') : ''}
                                    <tr style="background-color: #f1f5f9; border-top: 2px solid #cbd5e1; font-weight: 800;">
                                        <td colspan="2" style="padding: 11px 12px; font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase;">
                                            Total Month (${monthTitle})
                                        </td>
                                        <td style="padding: 11px 12px; text-align: center; font-size: 13px; font-weight: 800; color: #1e293b;">
                                            ${monthSummary?.totalCreated ?? 0}
                                        </td>
                                        <td style="padding: 11px 12px; text-align: center; font-size: 13px; font-weight: 800; color: #15803d;">
                                            ${monthSummary?.totalCompleted ?? 0}
                                        </td>
                                        <td style="padding: 11px 12px; text-align: center; font-size: 13px; font-weight: 800; color: ${(monthSummary?.totalOverdue ?? 0) > 0 ? '#b91c1c' : '#64748b'};">
                                            ${monthSummary?.totalOverdue ?? 0}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- ============================================== -->
                        <!-- 2) WEEK [X] -->
                        <!-- ============================================== -->
                        <div style="margin-bottom: 36px;">
                            <h2 style="font-size: 15px; font-weight: 800; color: #1e1b4b; margin: 0 0 6px 0;">
                                2) Week ${currentWeekNum} (Created: ${createdThisWeek}, Completed: ${completedThisWeek}, Overdue: ${overdueTasksCount})
                            </h2>
                            <h3 style="font-size: 13px; font-weight: 800; color: #312e81; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">
                                TEAM MEMBER WORKLOAD &amp; WEEKLY COMPLETION
                            </h3>

                            <!-- TEAM WORKLOAD TABLE -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                                <thead>
                                    <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                                        <th style="padding: 11px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">TEAM MEMBER</th>
                                        <th style="padding: 11px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">DONE (MON-SAT)</th>
                                        <th style="padding: 11px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">IN PROGRESS</th>
                                        <th style="padding: 11px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">OVERDUE</th>
                                        <th style="padding: 11px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">TOTAL ACTIVE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${assigneeRows && assigneeRows.length > 0 ? assigneeRows.map((row, idx) => {
                                        const bgClass = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                                        return `
                                        <tr style="background-color: ${bgClass}; border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #0f172a;">
                                                ${row.name || row.username}
                                                <span style="display: block; font-size: 10px; color: #64748b; font-weight: 400;">@${row.username}</span>
                                            </td>
                                            <td style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 700; color: #15803d;">
                                                ${row.completed_this_week}
                                            </td>
                                            <td style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 600; color: #4338ca;">
                                                ${row.in_progress_count}
                                            </td>
                                            <td style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 700; color: ${row.overdue_count > 0 ? '#b91c1c' : '#94a3b8'};">
                                                ${row.overdue_count > 0 ? `<span style="display: inline-block; padding: 2px 7px; background-color: #fee2e2; border-radius: 6px; color: #b91c1c;">${row.overdue_count}</span>` : '0'}
                                            </td>
                                            <td style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 800; color: #0f172a;">
                                                ${row.total_active}
                                            </td>
                                        </tr>
                                        `;
                                    }).join('') : `
                                        <tr>
                                            <td colspan="5" style="padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;">No task assignments found for this period.</td>
                                        </tr>
                                    `}
                                </tbody>
                            </table>
                            <p style="margin: 6px 0 0 0; font-size: 11px; color: #64748b; font-style: italic;">
                                * Mathematical Check: <strong>Total Active = In Progress + Pending / Todo + Blocked</strong>. Overdue indicates tasks within active backlog past their deadline.
                            </p>
                        </div>

                        <!-- ============================================== -->
                        <!-- 3) ACTION NEEDED & CRITICAL BOTTLENECKS -->
                        <!-- ============================================== -->
                        ${(blockedTasks.length > 0 || urgentOverdueTasks.length > 0 || stagnantTasks.length > 0) ? `
                            <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
                                <h2 style="margin: 0 0 14px 0; font-size: 14px; font-weight: 800; color: #9f1239; text-transform: uppercase; letter-spacing: 0.5px;">
                                    3) ACTION NEEDED &amp; CRITICAL BOTTLENECKS
                                </h2>

                                ${blockedTasks.length > 0 ? `
                                    <div style="margin-bottom: 14px;">
                                        <span style="font-size: 12px; font-weight: 700; color: #be123c; display: block; margin-bottom: 6px;">🚫 Blocked Tasks (${blockedTasks.length})</span>
                                        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">
                                            ${blockedTasks.map(t => `
                                                <li style="margin-bottom: 4px;">
                                                    <strong>${t.title}</strong> &ndash; Assigned to <em>${t.assignee_name}</em> ${getPriorityBadgeHtml(t.priority)}
                                                </li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                ` : ''}

                                ${urgentOverdueTasks.length > 0 ? `
                                    <div style="margin-bottom: 14px;">
                                        <span style="font-size: 12px; font-weight: 700; color: #be123c; display: block; margin-bottom: 6px;">⏰ Overdue Urgent &amp; High Priority Tasks (${urgentOverdueTasks.length})</span>
                                        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">
                                            ${urgentOverdueTasks.map(t => `
                                                <li style="margin-bottom: 4px;">
                                                    <strong>${t.title}</strong> (${t.days_overdue} days overdue) &ndash; Assigned to <em>${t.assignee_name}</em> ${getPriorityBadgeHtml(t.priority)}
                                                </li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                ` : ''}

                                ${stagnantTasks.length > 0 ? `
                                    <div>
                                        <span style="font-size: 12px; font-weight: 700; color: #be123c; display: block; margin-bottom: 6px;">💤 Stagnant Tasks (No activity &gt; 5 days)</span>
                                        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">
                                            ${stagnantTasks.map(t => `
                                                <li style="margin-bottom: 4px;">
                                                    <strong>${t.title}</strong> (Idle ${t.idle_days} days) &ndash; Assigned to <em>${t.assignee_name}</em> ${getStatusBadgeHtml(t.status)}
                                                </li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                            </div>
                        ` : `
                            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 32px; text-align: center;">
                                <span style="font-size: 13px; font-weight: 700; color: #15803d;">
                                    ✅ No critical bottlenecks or blocked tasks detected. Operations are progressing on schedule!
                                </span>
                            </div>
                        `}

                        <!-- CALL TO ACTION BUTTON -->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td align="center" style="padding-top: 10px;">
                                    <a href="${ctaUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: #4338ca; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(67, 56, 202, 0.2);">
                                        Open Subsync Tasks Analytics &rarr;
                                    </a>
                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                    <td style="background-color: #f8fafc; padding: 20px 36px; border-top: 1px solid #e2e8f0; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                            This is an automated consolidated report generated by Subsync Business Operations System.<br>
                            Sent every Saturday at 6:00 PM IST to Admins.
                        </p>
                    </td>
                </tr>

            </table>
        </td>
    </tr>
</table>

</body>
</html>
    `;
}

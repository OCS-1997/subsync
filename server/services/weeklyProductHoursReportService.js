import appDB from '../db/subsyncDB.js';
import { sendEmail } from './emailService.js';
import { getFrontendAppUrl } from './taskDigestService.js';
import { getAdminUsers } from './weeklyTaskReportService.js';

/**
 * Format date to IST string
 * @param {Date} date 
 * @returns {string}
 */
export function formatDateIST(date) {
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
 * Format minutes into clean decimal hours (e.g. 14.5 hrs)
 * @param {number} minutes 
 * @returns {string}
 */
export function formatHours(minutes) {
    const mins = Number(minutes || 0);
    if (mins <= 0) return '0.0 hrs';
    const hours = mins / 60;
    return `${hours.toFixed(1)} hrs`;
}

/**
 * Format minutes into human-readable hours and minutes (e.g. 14h 30m)
 * @param {number} minutes 
 * @returns {string}
 */
export function formatHoursAndMins(minutes) {
    const mins = Math.round(Number(minutes || 0));
    if (mins <= 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

/**
 * Calculate Monday 00:00:00 IST to Saturday 23:59:59 IST date range for a given reference date
 * @param {Date} [referenceDate] 
 * @returns {{ startDate: Date, endDate: Date, startDateStr: string, endDateStr: string, days: Array<{ dayName: string, dateStr: string, dateUTC: string, start: Date, end: Date }> }}
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

    // Generate individual 6 days (Mon to Sat)
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const days = dayNames.map((name, i) => {
        const dStart = new Date(Date.UTC(year, month, date - diffToMon + i, 0, 0, 0, 0) - IST_OFFSET_MS);
        const dEnd = new Date(Date.UTC(year, month, date - diffToMon + i, 23, 59, 59, 999) - IST_OFFSET_MS);
        const dIST = new Date(dStart.getTime() + IST_OFFSET_MS);
        const dateStr = dIST.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' });
        const dateUTC = `${dIST.getUTCFullYear()}-${String(dIST.getUTCMonth() + 1).padStart(2, '0')}-${String(dIST.getUTCDate()).padStart(2, '0')}`;
        return {
            dayName: name,
            dateStr,
            dateUTC,
            start: dStart,
            end: dEnd
        };
    });

    return {
        startDate,
        endDate,
        startDateStr: formatDateIST(startDate),
        endDateStr: formatDateIST(endDate),
        days
    };
}

/**
 * Fetch all active team members with email addresses
 * @returns {Promise<Array<{ username: string, name: string, email: string }>>}
 */
export async function getTeamMemberUsers() {
    try {
        const [users] = await appDB.query(
            `SELECT username, name, email 
             FROM users 
             WHERE is_active = 1 
               AND email IS NOT NULL 
               AND TRIM(email) != ''
             ORDER BY name ASC`
        );
        return users;
    } catch (err) {
        console.error('[WeeklyProductHoursReport] Error fetching team members:', err);
        return [];
    }
}

export const sendWeeklyProductHoursReportEmail = sendWeeklyProductHoursReports;

/**
 * Generate and send Weekly Productive Hours reports:
 * 1) Individual weekly email to respective team members about their time
 * 2) Overall consolidated weekly email to admins
 * 
 * @param {Date} [referenceDate] 
 * @returns {Promise<{ success: boolean, memberRecipients: string[], adminRecipients: string[] }>}
 */
export async function sendWeeklyProductHoursReports(referenceDate = new Date()) {
    console.log(`[WeeklyProductHoursReport] Starting weekly report generation for: ${referenceDate.toISOString()}`);
    const { startDate, endDate, startDateStr, endDateStr, days } = getMonSatDateRange(referenceDate);

    const teamMembers = await getTeamMemberUsers();
    const adminUsers = await getAdminUsers();

    if (!teamMembers || teamMembers.length === 0) {
        console.warn('[WeeklyProductHoursReport] No team members found. Skipping.');
        return { success: false, reason: 'NO_TEAM_MEMBERS' };
    }

    const baseUrl = getFrontendAppUrl();
    const memberRecipients = [];
    const adminRecipients = [];

    // =========================================================================
    // PART 1: SEND INDIVIDUAL REPORT TO EACH TEAM MEMBER ABOUT THEIR TIME
    // =========================================================================
    for (const member of teamMembers) {
        try {
            // 1. User overall weekly stats
            const [[userMetrics]] = await appDB.query(
                `SELECT 
                    COALESCE(SUM(te.duration_minutes), 0) as total_minutes,
                    COALESCE(SUM(CASE WHEN te.is_billable = TRUE THEN te.duration_minutes ELSE 0 END), 0) as billable_minutes,
                    COALESCE(SUM(CASE WHEN te.is_billable = FALSE THEN te.duration_minutes ELSE 0 END), 0) as non_billable_minutes,
                    COUNT(DISTINCT DATE(te.start_time)) as active_days,
                    COUNT(te.id) as entry_count
                 FROM time_entries te
                 WHERE te.user_id = ?
                   AND te.deleted_at IS NULL 
                   AND te.end_time IS NOT NULL
                   AND te.start_time >= ? AND te.start_time <= ?`,
                [member.username, startDate, endDate]
            );

            const userTotalMins = Number(userMetrics?.total_minutes || 0);
            const userBillableMins = Number(userMetrics?.billable_minutes || 0);
            const userNonBillableMins = Number(userMetrics?.non_billable_minutes || 0);
            const userActiveDays = Number(userMetrics?.active_days || 0);
            const userEntriesCount = Number(userMetrics?.entry_count || 0);
            const userUtilization = userTotalMins > 0 ? Math.round((userBillableMins / userTotalMins) * 100) : 0;
            const userDailyAvgMins = userActiveDays > 0 ? Math.round(userTotalMins / userActiveDays) : 0;

            // 2. User daily breakdown (Mon - Sat)
            const userDailyBreakdown = [];
            for (const d of days) {
                const [[dRow]] = await appDB.query(
                    `SELECT 
                        COALESCE(SUM(te.duration_minutes), 0) as total_minutes,
                        COALESCE(SUM(CASE WHEN te.is_billable = TRUE THEN te.duration_minutes ELSE 0 END), 0) as billable_minutes,
                        COUNT(te.id) as count
                     FROM time_entries te
                     WHERE te.user_id = ?
                       AND te.deleted_at IS NULL 
                       AND te.end_time IS NOT NULL
                       AND te.start_time >= ? AND te.start_time <= ?`,
                    [member.username, d.start, d.end]
                );
                const dm = Number(dRow?.total_minutes || 0);
                const dbm = Number(dRow?.billable_minutes || 0);
                userDailyBreakdown.push({
                    dayName: d.dayName,
                    dateStr: d.dateStr,
                    totalMins: dm,
                    totalHoursStr: formatHours(dm),
                    billableHoursStr: formatHours(dbm),
                    entryCount: Number(dRow?.count || 0)
                });
            }

            // 3. User products / projects breakdown
            const [userProducts] = await appDB.query(
                `SELECT 
                    COALESCE(p.id, 0) as project_id,
                    COALESCE(p.project_name, 'General Operations / Internal Work') as project_name,
                    COALESCE(p.project_code, 'INTERNAL') as project_code,
                    COALESCE(p.color, '#3b82f6') as color,
                    COALESCE(SUM(te.duration_minutes), 0) as total_minutes,
                    COALESCE(SUM(CASE WHEN te.is_billable = TRUE THEN te.duration_minutes ELSE 0 END), 0) as billable_minutes
                 FROM time_entries te
                 LEFT JOIN time_projects p ON te.project_id = p.id
                 WHERE te.user_id = ?
                   AND te.deleted_at IS NULL 
                   AND te.end_time IS NOT NULL
                   AND te.start_time >= ? AND te.start_time <= ?
                 GROUP BY p.id, p.project_name, p.project_code, p.color
                 HAVING total_minutes > 0
                 ORDER BY total_minutes DESC`,
                [member.username, startDate, endDate]
            );

            const userProductStats = userProducts.map(p => {
                const pm = Number(p.total_minutes || 0);
                const pbm = Number(p.billable_minutes || 0);
                const share = userTotalMins > 0 ? Math.round((pm / userTotalMins) * 100) : 0;
                const billablePct = pm > 0 ? Math.round((pbm / pm) * 100) : 0;
                return {
                    name: p.project_name,
                    code: p.project_code,
                    color: p.color,
                    hoursStr: formatHours(pm),
                    hoursDetailed: formatHoursAndMins(pm),
                    share,
                    billablePct
                };
            });

            // 4. User activity categories
            const [userActivities] = await appDB.query(
                `SELECT 
                    COALESCE(tat.type_name, 'Other Operations') as type_name,
                    COALESCE(tat.color, '#64748b') as color,
                    COALESCE(SUM(te.duration_minutes), 0) as total_minutes
                 FROM time_entries te
                 LEFT JOIN time_activity_types tat ON te.activity_type_id = tat.id
                 WHERE te.user_id = ?
                   AND te.deleted_at IS NULL 
                   AND te.end_time IS NOT NULL
                   AND te.start_time >= ? AND te.start_time <= ?
                 GROUP BY tat.id, tat.type_name, tat.color
                 HAVING total_minutes > 0
                 ORDER BY total_minutes DESC`,
                [member.username, startDate, endDate]
            );

            const userActivityStats = userActivities.map(a => {
                const am = Number(a.total_minutes || 0);
                const share = userTotalMins > 0 ? Math.round((am / userTotalMins) * 100) : 0;
                return {
                    name: a.type_name,
                    color: a.color,
                    hoursStr: formatHours(am),
                    share
                };
            });

            const usernameSegment = member.username ? `${member.username}/` : '';
            const ctaUrl = `${baseUrl}/${usernameSegment}dashboard/time-tracking`;

            const memberHtml = generateUserWeeklyHoursHtml({
                userName: member.name || member.username,
                startDateStr,
                endDateStr,
                userTotalMins,
                userBillableMins,
                userNonBillableMins,
                userActiveDays,
                userUtilization,
                userDailyAvgMins,
                userEntriesCount,
                userDailyBreakdown,
                userProductStats,
                userActivityStats,
                ctaUrl
            });

            const subject = `Your Weekly Productive Hours Report (${startDateStr} - ${endDateStr})`;
            await sendEmail({
                to: member.email,
                subject,
                html: memberHtml
            });

            memberRecipients.push(member.email);
        } catch (err) {
            console.error(`[WeeklyProductHoursReport] Failed to send weekly report to ${member.email}:`, err);
        }
    }

    // =========================================================================
    // PART 2: SEND OVERALL CONSOLIDATED REPORT TO ADMINS
    // =========================================================================
    if (adminUsers && adminUsers.length > 0) {
        try {
            // 1. Team-wide KPI metrics
            const [[teamMetrics]] = await appDB.query(
                `SELECT 
                    COALESCE(SUM(te.duration_minutes), 0) as total_minutes,
                    COALESCE(SUM(CASE WHEN te.is_billable = TRUE THEN te.duration_minutes ELSE 0 END), 0) as billable_minutes,
                    COALESCE(SUM(CASE WHEN te.is_billable = FALSE THEN te.duration_minutes ELSE 0 END), 0) as non_billable_minutes,
                    COUNT(DISTINCT te.user_id) as active_members,
                    COUNT(DISTINCT te.project_id) as active_products,
                    COUNT(te.id) as entry_count
                 FROM time_entries te
                 WHERE te.deleted_at IS NULL 
                   AND te.end_time IS NOT NULL
                   AND te.start_time >= ? AND te.start_time <= ?`,
                [startDate, endDate]
            );

            const teamTotalMins = Number(teamMetrics?.total_minutes || 0);
            const teamBillableMins = Number(teamMetrics?.billable_minutes || 0);
            const teamNonBillableMins = Number(teamMetrics?.non_billable_minutes || 0);
            const teamActiveMembers = Number(teamMetrics?.active_members || 0);
            const teamActiveProducts = Number(teamMetrics?.active_projects || 0);
            const teamUtilization = teamTotalMins > 0 ? Math.round((teamBillableMins / teamTotalMins) * 100) : 0;

            // 2. Team members workload breakdown
            const [memberRows] = await appDB.query(
                `SELECT 
                    u.username,
                    COALESCE(u.name, u.username) as name,
                    u.email,
                    COALESCE(SUM(te.duration_minutes), 0) as week_minutes,
                    COALESCE(SUM(CASE WHEN te.is_billable = TRUE THEN te.duration_minutes ELSE 0 END), 0) as week_billable_minutes,
                    COUNT(DISTINCT DATE(te.start_time)) as active_days
                 FROM users u
                 LEFT JOIN time_entries te ON u.username = te.user_id 
                      AND te.deleted_at IS NULL 
                      AND te.end_time IS NOT NULL
                      AND te.start_time >= ? AND te.start_time <= ?
                 WHERE u.is_active = 1
                 GROUP BY u.username, u.name, u.email
                 ORDER BY week_minutes DESC`,
                [startDate, endDate]
            );

            const teamMemberStats = [];
            for (const m of memberRows) {
                const wm = Number(m.week_minutes || 0);
                const wbm = Number(m.week_billable_minutes || 0);
                const activeDays = Number(m.active_days || 0);
                const billablePercent = wm > 0 ? Math.round((wbm / wm) * 100) : 0;
                const dailyAvg = activeDays > 0 ? Math.round(wm / activeDays) : 0;

                // Top product for this member this week
                let topProduct = 'General / Internal';
                const [tpRows] = await appDB.query(
                    `SELECT COALESCE(p.project_name, 'General Operations') as project_name, SUM(te.duration_minutes) as mins
                     FROM time_entries te
                     LEFT JOIN time_projects p ON te.project_id = p.id
                     WHERE te.user_id = ? 
                       AND te.deleted_at IS NULL 
                       AND te.end_time IS NOT NULL
                       AND te.start_time >= ? AND te.start_time <= ?
                     GROUP BY p.project_name
                     ORDER BY mins DESC
                     LIMIT 1`,
                    [m.username, startDate, endDate]
                );
                if (tpRows.length > 0 && tpRows[0].project_name) {
                    topProduct = tpRows[0].project_name;
                }

                teamMemberStats.push({
                    username: m.username,
                    name: m.name,
                    weekHoursStr: formatHours(wm),
                    billablePercent,
                    dailyAvgStr: formatHours(dailyAvg),
                    topProduct
                });
            }

            // 3. Product effort distribution
            const [productRows] = await appDB.query(
                `SELECT 
                    COALESCE(p.id, 0) as project_id,
                    COALESCE(p.project_name, 'General Operations / Internal Work') as project_name,
                    COALESCE(p.project_code, 'INTERNAL') as project_code,
                    COALESCE(p.color, '#6366f1') as color,
                    COALESCE(SUM(te.duration_minutes), 0) as week_minutes,
                    COALESCE(SUM(CASE WHEN te.is_billable = TRUE THEN te.duration_minutes ELSE 0 END), 0) as week_billable_minutes,
                    COUNT(DISTINCT te.user_id) as contributors_count
                 FROM time_entries te
                 LEFT JOIN time_projects p ON te.project_id = p.id
                 WHERE te.deleted_at IS NULL 
                   AND te.end_time IS NOT NULL
                   AND te.start_time >= ? AND te.start_time <= ?
                 GROUP BY p.id, p.project_name, p.project_code, p.color
                 HAVING week_minutes > 0
                 ORDER BY week_minutes DESC`,
                [startDate, endDate]
            );

            const teamProductStats = productRows.map(p => {
                const wm = Number(p.week_minutes || 0);
                const wbm = Number(p.week_billable_minutes || 0);
                const billablePct = wm > 0 ? Math.round((wbm / wm) * 100) : 0;
                return {
                    name: p.project_name,
                    code: p.project_code,
                    color: p.color,
                    hoursStr: formatHours(wm),
                    billablePct,
                    contributorsCount: Number(p.contributors_count || 0)
                };
            });

            // 4. Send to each admin
            for (const admin of adminUsers) {
                const usernameSegment = admin.username ? `${admin.username}/` : '';
                const ctaUrl = `${baseUrl}/${usernameSegment}dashboard/time-tracking`;

                const adminHtml = generateAdminWeeklyHoursHtml({
                    startDateStr,
                    endDateStr,
                    teamTotalMins,
                    teamBillableMins,
                    teamNonBillableMins,
                    teamActiveMembers,
                    teamActiveProducts,
                    teamUtilization,
                    teamMemberStats,
                    teamProductStats,
                    ctaUrl
                });

                const subject = `[Admin Digest] Consolidated Weekly Productive Hours Report (${startDateStr} - ${endDateStr})`;
                await sendEmail({
                    to: admin.email,
                    subject,
                    html: adminHtml
                });

                adminRecipients.push(admin.email);
            }
        } catch (err) {
            console.error('[WeeklyProductHoursReport] Failed to send admin consolidated report:', err);
        }
    }

    console.log(`[WeeklyProductHoursReport] Completed. Sent to ${memberRecipients.length} team members and ${adminRecipients.length} admins.`);
    return {
        success: true,
        memberRecipients,
        adminRecipients
    };
}

// =========================================================================
// HTML TEMPLATE: INDIVIDUAL USER WEEKLY REPORT
// =========================================================================
function generateUserWeeklyHoursHtml(data) {
    const {
        userName,
        startDateStr,
        endDateStr,
        userTotalMins,
        userBillableMins,
        userNonBillableMins,
        userActiveDays,
        userUtilization,
        userDailyAvgMins,
        userDailyBreakdown,
        userProductStats,
        userActivityStats,
        ctaUrl
    } = data;

    const totalHoursStr = formatHours(userTotalMins);
    const billableHoursStr = formatHours(userBillableMins);
    const dailyAvgStr = formatHours(userDailyAvgMins);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Weekly Productive Hours Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f9; color: #1e293b;">

<table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f4f6f9; padding: 20px 0;">
    <tr>
        <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="660" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                
                <!-- HEADER -->
                <tr>
                    <td style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); padding: 28px 32px; text-align: left;">
                        <span style="display: inline-block; padding: 4px 12px; background-color: rgba(255, 255, 255, 0.15); color: #e0e7ff; font-size: 11px; font-weight: 700; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                            Personal Weekly Summary
                        </span>
                        <h1 style="margin: 4px 0 0 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                            Your Weekly Productive Hours Report
                        </h1>
                        <p style="margin: 6px 0 0 0; color: #c7d2fe; font-size: 13px;">
                            Monday &ndash; Saturday (${startDateStr} &ndash; ${endDateStr})
                        </p>
                    </td>
                </tr>

                <!-- GREETING -->
                <tr>
                    <td style="padding: 24px 32px 12px 32px;">
                        <p style="margin: 0; font-size: 14px; color: #334155;">
                            Hello <strong>${userName}</strong>, here is your individual productive hours report summarizing the time you logged across products and activities this week.
                        </p>
                    </td>
                </tr>

                <!-- KPI METRICS CARDS -->
                <tr>
                    <td style="padding: 12px 32px 24px 32px;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td width="32%" valign="top" style="padding-right: 8px;">
                                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 14px;">
                                        <span style="display: block; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Time Logged</span>
                                        <span style="display: block; font-size: 22px; font-weight: 800; color: #1e293b; margin-top: 4px;">${totalHoursStr}</span>
                                        <span style="display: block; font-size: 11px; color: #64748b; margin-top: 2px;">Over ${userActiveDays} active days</span>
                                    </div>
                                </td>
                                <td width="32%" valign="top" style="padding: 0 4px;">
                                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #22c55e; border-radius: 8px; padding: 14px;">
                                        <span style="display: block; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Billable Hours</span>
                                        <span style="display: block; font-size: 22px; font-weight: 800; color: #15803d; margin-top: 4px;">${billableHoursStr}</span>
                                        <span style="display: block; font-size: 11px; color: #15803d; margin-top: 2px;">${userUtilization}% utilization</span>
                                    </div>
                                </td>
                                <td width="32%" valign="top" style="padding-left: 8px;">
                                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #8b5cf6; border-radius: 8px; padding: 14px;">
                                        <span style="display: block; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Daily Average</span>
                                        <span style="display: block; font-size: 22px; font-weight: 800; color: #6b21a8; margin-top: 4px;">${dailyAvgStr}</span>
                                        <span style="display: block; font-size: 11px; color: #6b21a8; margin-top: 2px;">Per active day</span>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- 1. DAILY BREAKDOWN (MON-SAT) -->
                <tr>
                    <td style="padding: 0 32px 28px 32px;">
                        <h3 style="font-size: 13px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px 0;">
                            Daily Breakdown (Monday &ndash; Saturday)
                        </h3>
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                            <thead>
                                <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                                    <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Day</th>
                                    <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Date</th>
                                    <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Tracked Hours</th>
                                    <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Billable</th>
                                    <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Logs</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${userDailyBreakdown.map((d, idx) => {
                                    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                                    const isLogged = d.totalMins > 0;
                                    return `
                                    <tr style="background-color: ${bg}; border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 9px 12px; font-size: 12px; font-weight: 700; color: ${isLogged ? '#0f172a' : '#94a3b8'};">
                                            ${d.dayName}
                                        </td>
                                        <td style="padding: 9px 12px; text-align: center; font-size: 12px; color: #64748b;">
                                            ${d.dateStr}
                                        </td>
                                        <td style="padding: 9px 12px; text-align: center; font-size: 12px; font-weight: 700; color: ${isLogged ? '#1e293b' : '#94a3b8'};">
                                            ${d.totalHoursStr}
                                        </td>
                                        <td style="padding: 9px 12px; text-align: center; font-size: 12px; font-weight: 600; color: ${isLogged ? '#15803d' : '#94a3b8'};">
                                            ${d.billableHoursStr}
                                        </td>
                                        <td style="padding: 9px 12px; text-align: center; font-size: 12px; color: #64748b;">
                                            ${d.entryCount > 0 ? `${d.entryCount} entries` : '-'}
                                        </td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </td>
                </tr>

                <!-- 2. PRODUCTS / PROJECTS WORKED ON -->
                <tr>
                    <td style="padding: 0 32px 28px 32px;">
                        <h3 style="font-size: 13px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px 0;">
                            Products &amp; Projects Worked On
                        </h3>
                        ${userProductStats.length > 0 ? `
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                            <thead>
                                <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                                    <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Product / Project</th>
                                    <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Code</th>
                                    <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Time Spent</th>
                                    <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Share of Week</th>
                                    <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Billable %</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${userProductStats.map((p, idx) => {
                                    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                                    return `
                                    <tr style="background-color: ${bg}; border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 9px 12px; font-size: 12px; font-weight: 600; color: #0f172a;">
                                            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${p.color || '#3b82f6'}; margin-right: 6px;"></span>
                                            ${p.name}
                                        </td>
                                        <td style="padding: 9px 12px; text-align: center; font-size: 11px; font-family: monospace; color: #64748b;">
                                            ${p.code}
                                        </td>
                                        <td style="padding: 9px 12px; text-align: center; font-size: 12px; font-weight: 700; color: #1e293b;">
                                            ${p.hoursStr}
                                        </td>
                                        <td style="padding: 9px 12px; text-align: center; font-size: 12px; font-weight: 600; color: #4338ca;">
                                            ${p.share}%
                                        </td>
                                        <td style="padding: 9px 12px; text-align: center; font-size: 12px; font-weight: 700; color: ${p.billablePct >= 60 ? '#15803d' : '#64748b'};">
                                            ${p.billablePct}%
                                        </td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                        ` : `
                            <p style="margin: 0; font-size: 12px; color: #94a3b8; font-style: italic;">No specific project logs recorded this week.</p>
                        `}
                    </td>
                </tr>

                <!-- 3. ACTIVITY BREAKDOWN -->
                ${userActivityStats.length > 0 ? `
                <tr>
                    <td style="padding: 0 32px 28px 32px;">
                        <h3 style="font-size: 13px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px 0;">
                            Activity Allocation
                        </h3>
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                ${userActivityStats.slice(0, 3).map(act => `
                                    <td style="padding: 4px 6px; width: 33%; vertical-align: top;">
                                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
                                            <span style="display: block; font-size: 11px; font-weight: 600; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: ${act.color || '#3b82f6'}; margin-right: 4px;"></span>
                                                ${act.name}
                                            </span>
                                            <span style="display: block; font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 4px;">
                                                ${act.hoursStr}
                                            </span>
                                            <span style="display: block; font-size: 10px; color: #64748b; margin-top: 2px;">
                                                ${act.share}% of your time
                                            </span>
                                        </div>
                                    </td>
                                `).join('')}
                            </tr>
                        </table>
                    </td>
                </tr>
                ` : ''}

                <!-- CALL TO ACTION -->
                <tr>
                    <td align="center" style="padding: 0 32px 32px 32px;">
                        <a href="${ctaUrl}" target="_blank" style="display: inline-block; padding: 12px 26px; background-color: #4338ca; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 8px;">
                            View Your Time Tracking Logs &rarr;
                        </a>
                    </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                    <td style="background-color: #f8fafc; padding: 18px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                        <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                            This is your automated individual weekly productive hours report.<br>
                            Sent every Saturday at 6:30 PM IST by Subsync Platform.
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

// =========================================================================
// HTML TEMPLATE: ADMIN CONSOLIDATED WEEKLY REPORT
// =========================================================================
function generateAdminWeeklyHoursHtml(data) {
    const {
        startDateStr,
        endDateStr,
        teamTotalMins,
        teamBillableMins,
        teamActiveMembers,
        teamActiveProducts,
        teamUtilization,
        teamMemberStats,
        teamProductStats,
        ctaUrl
    } = data;

    const teamTotalHoursStr = formatHours(teamTotalMins);
    const teamBillableHoursStr = formatHours(teamBillableMins);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consolidated Weekly Productive Hours Report (Admin)</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f9; color: #1e293b;">

<table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f4f6f9; padding: 20px 0;">
    <tr>
        <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="680" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                
                <!-- HEADER -->
                <tr>
                    <td style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); padding: 30px 36px; text-align: left;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td>
                                    <span style="display: inline-block; padding: 4px 12px; background-color: rgba(255, 255, 255, 0.15); color: #e0e7ff; font-size: 11px; font-weight: 700; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                                        Executive Admin Digest
                                    </span>
                                    <h1 style="margin: 4px 0 0 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                                        Consolidated Weekly Productive Hours
                                    </h1>
                                    <p style="margin: 6px 0 0 0; color: #c7d2fe; font-size: 13px;">
                                        Monday &ndash; Saturday (${startDateStr} &ndash; ${endDateStr})
                                    </p>
                                </td>
                                <td align="right" valign="top" style="width: 130px;">
                                    <div style="background-color: rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 10px; text-align: center;">
                                        <span style="display: block; color: #818cf8; font-size: 10px; font-weight: 700; text-transform: uppercase;">Team Utilization</span>
                                        <span style="display: block; color: #ffffff; font-size: 20px; font-weight: 800; margin-top: 2px;">${teamUtilization}%</span>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- CONTENT BODY -->
                <tr>
                    <td style="padding: 28px 36px;">

                        <!-- KPI SUMMARY CARDS -->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                            <tr>
                                <td width="32%" valign="top" style="padding-right: 8px;">
                                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 14px;">
                                        <span style="display: block; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Team Hours</span>
                                        <span style="display: block; font-size: 22px; font-weight: 800; color: #1e293b; margin-top: 4px;">${teamTotalHoursStr}</span>
                                        <span style="display: block; font-size: 11px; color: #64748b; margin-top: 2px;">Mon-Sat cumulative</span>
                                    </div>
                                </td>
                                <td width="32%" valign="top" style="padding: 0 4px;">
                                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #22c55e; border-radius: 8px; padding: 14px;">
                                        <span style="display: block; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Billable Hours</span>
                                        <span style="display: block; font-size: 22px; font-weight: 800; color: #15803d; margin-top: 4px;">${teamBillableHoursStr}</span>
                                        <span style="display: block; font-size: 11px; color: #15803d; margin-top: 2px;">${teamUtilization}% billable rate</span>
                                    </div>
                                </td>
                                <td width="32%" valign="top" style="padding-left: 8px;">
                                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #8b5cf6; border-radius: 8px; padding: 14px;">
                                        <span style="display: block; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Active Engagement</span>
                                        <span style="display: block; font-size: 22px; font-weight: 800; color: #6b21a8; margin-top: 4px;">${teamActiveMembers} Members</span>
                                        <span style="display: block; font-size: 11px; color: #6b21a8; margin-top: 2px;">${teamActiveProducts} active products</span>
                                    </div>
                                </td>
                            </tr>
                        </table>

                        <!-- 1. TEAM MEMBER WORKLOAD TABLE -->
                        <div style="margin-bottom: 32px;">
                            <h3 style="font-size: 13px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px 0;">
                                Team Member Workload &amp; Contributions
                            </h3>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                                <thead>
                                    <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                                        <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Team Member</th>
                                        <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Tracked Hours</th>
                                        <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Top Product Focus</th>
                                        <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Billable %</th>
                                        <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Daily Avg</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${teamMemberStats.map((m, idx) => {
                                        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                                        return `
                                        <tr style="background-color: ${bg}; border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 9px 12px; font-size: 12px; font-weight: 600; color: #0f172a;">
                                                ${m.name}
                                                <span style="display: block; font-size: 10px; color: #64748b; font-weight: 400;">@${m.username}</span>
                                            </td>
                                            <td style="padding: 9px 12px; text-align: center; font-size: 12px; font-weight: 700; color: #1e293b;">
                                                ${m.weekHoursStr}
                                            </td>
                                            <td style="padding: 9px 12px; font-size: 12px; color: #334155;">
                                                ${m.topProduct}
                                            </td>
                                            <td style="padding: 9px 12px; text-align: center; font-size: 12px; font-weight: 700; color: ${m.billablePercent >= 60 ? '#15803d' : '#64748b'};">
                                                ${m.billablePercent}%
                                            </td>
                                            <td style="padding: 9px 12px; text-align: center; font-size: 12px; color: #64748b;">
                                                ${m.dailyAvgStr}
                                            </td>
                                        </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>

                        <!-- 2. PRODUCT EFFORT DISTRIBUTION -->
                        <div style="margin-bottom: 32px;">
                            <h3 style="font-size: 13px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px 0;">
                                Product Effort Distribution
                            </h3>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                                <thead>
                                    <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                                        <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Product</th>
                                        <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Code</th>
                                        <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Hours Tracked</th>
                                        <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Billable %</th>
                                        <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Contributors</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${teamProductStats.map((p, idx) => {
                                        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                                        return `
                                        <tr style="background-color: ${bg}; border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 9px 12px; font-size: 12px; font-weight: 600; color: #0f172a;">
                                                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${p.color || '#3b82f6'}; margin-right: 6px;"></span>
                                                ${p.name}
                                            </td>
                                            <td style="padding: 9px 12px; text-align: center; font-size: 11px; font-family: monospace; color: #64748b;">
                                                ${p.code}
                                            </td>
                                            <td style="padding: 9px 12px; text-align: center; font-size: 12px; font-weight: 700; color: #1e293b;">
                                                ${p.hoursStr}
                                            </td>
                                            <td style="padding: 9px 12px; text-align: center; font-size: 12px; font-weight: 700; color: ${p.billablePct >= 60 ? '#15803d' : '#64748b'};">
                                                ${p.billablePct}%
                                            </td>
                                            <td style="padding: 9px 12px; text-align: center; font-size: 12px; color: #64748b;">
                                                ${p.contributorsCount} members
                                            </td>
                                        </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>

                        <!-- CTA BUTTON -->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td align="center" style="padding-top: 10px;">
                                    <a href="${ctaUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: #4338ca; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 8px;">
                                        Open Team Time Tracking Analytics &rarr;
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
                            Sent every Saturday at 6:30 PM IST to Admins.
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

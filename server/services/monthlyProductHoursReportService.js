import appDB from '../db/subsyncDB.js';
import { sendEmail } from './emailService.js';
import { getFrontendAppUrl } from './taskDigestService.js';
import { getAdminUsers } from './weeklyTaskReportService.js';
import { getTeamMemberUsers, formatHours, formatHoursAndMins } from './weeklyProductHoursReportService.js';

/**
 * Calculate the 4 weekly buckets for the month of referenceDate
 * @param {Date} [referenceDate] 
 * @returns {{ monthName: string, year: number, monthStartDate: Date, monthEndDate: Date, weeks: Array<{ label: string, periodStr: string, startDate: Date, endDate: Date }> }}
 */
export function getMonthWeeklyBuckets(referenceDate = new Date()) {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const refIST = new Date(referenceDate.getTime() + IST_OFFSET_MS);

    const year = refIST.getUTCFullYear();
    const month = refIST.getUTCMonth(); // 0-indexed
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const monthName = refIST.toLocaleDateString('en-IN', { month: 'long', timeZone: 'Asia/Kolkata' });
    const shortMonth = refIST.toLocaleDateString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' });

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

    const monthStartDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0) - IST_OFFSET_MS);
    const monthEndDate = new Date(Date.UTC(year, month, lastDayOfMonth, 23, 59, 59, 999) - IST_OFFSET_MS);

    return {
        monthName,
        year,
        monthStartDate,
        monthEndDate,
        weeks
    };
}

/**
 * Generate and send Monthly Productive Hours reports:
 * 1) Individual monthly email to respective team members about their month's time
 * 2) Overall consolidated monthly email to admins
 * 
 * @param {Date} [referenceDate] 
 * @returns {Promise<{ success: boolean, memberRecipients: string[], adminRecipients: string[] }>}
 */
export async function sendMonthlyProductHoursReports(referenceDate = new Date()) {
    console.log(`[MonthlyProductHoursReport] Starting monthly report generation for: ${referenceDate.toISOString()}`);
    const monthConfig = getMonthWeeklyBuckets(referenceDate);

    const teamMembers = await getTeamMemberUsers();
    const adminUsers = await getAdminUsers();

    if (!teamMembers || teamMembers.length === 0) {
        console.warn('[MonthlyProductHoursReport] No team members found. Skipping.');
        return { success: false, reason: 'NO_TEAM_MEMBERS' };
    }

    const baseUrl = getFrontendAppUrl();
    const memberRecipients = [];
    const adminRecipients = [];

    // =========================================================================
    // PART 1: SEND INDIVIDUAL MONTHLY REPORT TO EACH TEAM MEMBER
    // =========================================================================
    for (const member of teamMembers) {
        try {
            // 1. User overall month stats
            const [[userMonthMetrics]] = await appDB.query(
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
                [member.username, monthConfig.monthStartDate, monthConfig.monthEndDate]
            );

            const userTotalMins = Number(userMonthMetrics?.total_minutes || 0);
            const userBillableMins = Number(userMonthMetrics?.billable_minutes || 0);
            const userNonBillableMins = Number(userMonthMetrics?.non_billable_minutes || 0);
            const userActiveDays = Number(userMonthMetrics?.active_days || 0);
            const userEntriesCount = Number(userMonthMetrics?.entry_count || 0);
            const userUtilization = userTotalMins > 0 ? Math.round((userBillableMins / userTotalMins) * 100) : 0;
            const userDailyAvgMins = userActiveDays > 0 ? Math.round(userTotalMins / userActiveDays) : 0;

            // 2. User weekly progression (Weeks 1 to 4)
            const userWeeklyProgression = [];
            for (const w of monthConfig.weeks) {
                const [[wRow]] = await appDB.query(
                    `SELECT 
                        COALESCE(SUM(te.duration_minutes), 0) as total_minutes,
                        COALESCE(SUM(CASE WHEN te.is_billable = TRUE THEN te.duration_minutes ELSE 0 END), 0) as billable_minutes,
                        COUNT(te.id) as entry_count
                     FROM time_entries te
                     WHERE te.user_id = ?
                       AND te.deleted_at IS NULL 
                       AND te.end_time IS NOT NULL
                       AND te.start_time >= ? AND te.start_time <= ?`,
                    [member.username, w.startDate, w.endDate]
                );

                const wm = Number(wRow?.total_minutes || 0);
                const wbm = Number(wRow?.billable_minutes || 0);
                const util = wm > 0 ? Math.round((wbm / wm) * 100) : 0;

                userWeeklyProgression.push({
                    label: w.label,
                    periodStr: w.periodStr,
                    totalMins: wm,
                    totalHoursStr: formatHours(wm),
                    billableHoursStr: formatHours(wbm),
                    utilization: util,
                    entryCount: Number(wRow?.entry_count || 0)
                });
            }

            // 3. User products for the month
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
                [member.username, monthConfig.monthStartDate, monthConfig.monthEndDate]
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

            // 4. User activity categories for the month
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
                [member.username, monthConfig.monthStartDate, monthConfig.monthEndDate]
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

            const memberHtml = generateUserMonthlyHoursHtml({
                userName: member.name || member.username,
                monthName: monthConfig.monthName,
                year: monthConfig.year,
                userTotalMins,
                userBillableMins,
                userNonBillableMins,
                userActiveDays,
                userUtilization,
                userDailyAvgMins,
                userWeeklyProgression,
                userProductStats,
                userActivityStats,
                ctaUrl
            });

            const subject = `Your Monthly Productive Hours Report - ${monthConfig.monthName} ${monthConfig.year}`;
            await sendEmail({
                to: member.email,
                subject,
                html: memberHtml
            });

            memberRecipients.push(member.email);
        } catch (err) {
            console.error(`[MonthlyProductHoursReport] Failed to send monthly report to ${member.email}:`, err);
        }
    }

    // =========================================================================
    // PART 2: SEND OVERALL CONSOLIDATED MONTHLY REPORT TO ADMINS
    // =========================================================================
    if (adminUsers && adminUsers.length > 0) {
        try {
            // 1. Team-wide Month KPI metrics
            const [[teamMonthMetrics]] = await appDB.query(
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
                [monthConfig.monthStartDate, monthConfig.monthEndDate]
            );

            const teamTotalMins = Number(teamMonthMetrics?.total_minutes || 0);
            const teamBillableMins = Number(teamMonthMetrics?.billable_minutes || 0);
            const teamNonBillableMins = Number(teamMonthMetrics?.non_billable_minutes || 0);
            const teamActiveMembers = Number(teamMonthMetrics?.active_members || 0);
            const teamActiveProducts = Number(teamMonthMetrics?.active_products || 0);
            const teamUtilization = teamTotalMins > 0 ? Math.round((teamBillableMins / teamTotalMins) * 100) : 0;

            // 2. Team weekly progression (Weeks 1 to 4 + Total Month)
            const teamWeeklyProgression = [];
            for (const w of monthConfig.weeks) {
                const [[wRow]] = await appDB.query(
                    `SELECT 
                        COALESCE(SUM(te.duration_minutes), 0) as total_minutes,
                        COALESCE(SUM(CASE WHEN te.is_billable = TRUE THEN te.duration_minutes ELSE 0 END), 0) as billable_minutes,
                        COALESCE(SUM(CASE WHEN te.is_billable = FALSE THEN te.duration_minutes ELSE 0 END), 0) as non_billable_minutes,
                        COUNT(DISTINCT te.user_id) as active_members
                     FROM time_entries te
                     WHERE te.deleted_at IS NULL 
                       AND te.end_time IS NOT NULL
                       AND te.start_time >= ? AND te.start_time <= ?`,
                    [w.startDate, w.endDate]
                );

                const tot = Number(wRow?.total_minutes || 0);
                const bill = Number(wRow?.billable_minutes || 0);
                const nonBill = Number(wRow?.non_billable_minutes || 0);
                const util = tot > 0 ? Math.round((bill / tot) * 100) : 0;

                teamWeeklyProgression.push({
                    label: w.label,
                    periodStr: w.periodStr,
                    totalHoursStr: formatHours(tot),
                    billableHoursStr: formatHours(bill),
                    nonBillableHoursStr: formatHours(nonBill),
                    activeMembers: Number(wRow?.active_members || 0),
                    utilization: util
                });
            }

            // 3. Team Member Workload Table for Month
            const [memberRows] = await appDB.query(
                `SELECT 
                    u.username,
                    COALESCE(u.name, u.username) as name,
                    COALESCE(SUM(te.duration_minutes), 0) as month_minutes,
                    COALESCE(SUM(CASE WHEN te.is_billable = TRUE THEN te.duration_minutes ELSE 0 END), 0) as month_billable_minutes,
                    COUNT(DISTINCT DATE(te.start_time)) as active_days
                 FROM users u
                 LEFT JOIN time_entries te ON u.username = te.user_id 
                      AND te.deleted_at IS NULL 
                      AND te.end_time IS NOT NULL
                      AND te.start_time >= ? AND te.start_time <= ?
                 WHERE u.is_active = 1
                 GROUP BY u.username, u.name
                 ORDER BY month_minutes DESC`,
                [monthConfig.monthStartDate, monthConfig.monthEndDate]
            );

            const teamMemberStats = [];
            for (const m of memberRows) {
                const mm = Number(m.month_minutes || 0);
                const mbm = Number(m.month_billable_minutes || 0);
                const activeDays = Number(m.active_days || 0);
                const billablePercent = mm > 0 ? Math.round((mbm / mm) * 100) : 0;
                const dailyAvg = activeDays > 0 ? Math.round(mm / activeDays) : 0;

                // Top product for the month
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
                    [m.username, monthConfig.monthStartDate, monthConfig.monthEndDate]
                );
                if (tpRows.length > 0 && tpRows[0].project_name) {
                    topProduct = tpRows[0].project_name;
                }

                teamMemberStats.push({
                    username: m.username,
                    name: m.name,
                    monthHoursStr: formatHours(mm),
                    billablePercent,
                    dailyAvgStr: formatHours(dailyAvg),
                    activeDays,
                    topProduct
                });
            }

            // 4. Products Distribution for Month
            const [productRows] = await appDB.query(
                `SELECT 
                    COALESCE(p.id, 0) as project_id,
                    COALESCE(p.project_name, 'General Operations / Internal Work') as project_name,
                    COALESCE(p.project_code, 'INTERNAL') as project_code,
                    COALESCE(p.color, '#6366f1') as color,
                    COALESCE(SUM(te.duration_minutes), 0) as month_minutes,
                    COALESCE(SUM(CASE WHEN te.is_billable = TRUE THEN te.duration_minutes ELSE 0 END), 0) as month_billable_minutes,
                    COUNT(DISTINCT te.user_id) as contributors_count
                 FROM time_entries te
                 LEFT JOIN time_projects p ON te.project_id = p.id
                 WHERE te.deleted_at IS NULL 
                   AND te.end_time IS NOT NULL
                   AND te.start_time >= ? AND te.start_time <= ?
                 GROUP BY p.id, p.project_name, p.project_code, p.color
                 HAVING month_minutes > 0
                 ORDER BY month_minutes DESC`,
                [monthConfig.monthStartDate, monthConfig.monthEndDate]
            );

            const teamProductStats = productRows.map(p => {
                const mm = Number(p.month_minutes || 0);
                const mbm = Number(p.month_billable_minutes || 0);
                const billablePct = mm > 0 ? Math.round((mbm / mm) * 100) : 0;
                return {
                    name: p.project_name,
                    code: p.project_code,
                    color: p.color,
                    hoursStr: formatHours(mm),
                    billablePct,
                    contributorsCount: Number(p.contributors_count || 0)
                };
            });

            // 5. Send to each admin
            for (const admin of adminUsers) {
                const usernameSegment = admin.username ? `${admin.username}/` : '';
                const ctaUrl = `${baseUrl}/${usernameSegment}dashboard/time-tracking`;

                const adminHtml = generateAdminMonthlyHoursHtml({
                    monthName: monthConfig.monthName,
                    year: monthConfig.year,
                    teamTotalMins,
                    teamBillableMins,
                    teamNonBillableMins,
                    teamActiveMembers,
                    teamActiveProducts,
                    teamUtilization,
                    teamWeeklyProgression,
                    teamMemberStats,
                    teamProductStats,
                    ctaUrl
                });

                const subject = `[Admin Digest] Consolidated Monthly Productive Hours Report - ${monthConfig.monthName} ${monthConfig.year}`;
                await sendEmail({
                    to: admin.email,
                    subject,
                    html: adminHtml
                });

                adminRecipients.push(admin.email);
            }
        } catch (err) {
            console.error('[MonthlyProductHoursReport] Failed to send admin monthly report:', err);
        }
    }

    console.log(`[MonthlyProductHoursReport] Completed. Sent to ${memberRecipients.length} team members and ${adminRecipients.length} admins.`);
    return {
        success: true,
        memberRecipients,
        adminRecipients
    };
}

// =========================================================================
// HTML TEMPLATE: INDIVIDUAL USER MONTHLY REPORT
// =========================================================================
function generateUserMonthlyHoursHtml(data) {
    const {
        userName,
        monthName,
        year,
        userTotalMins,
        userBillableMins,
        userNonBillableMins,
        userActiveDays,
        userUtilization,
        userDailyAvgMins,
        userWeeklyProgression,
        userProductStats,
        userActivityStats,
        ctaUrl
    } = data;

    const totalHoursStr = formatHours(userTotalMins);
    const billableHoursStr = formatHours(userBillableMins);
    const nonBillableHoursStr = formatHours(userNonBillableMins);
    const dailyAvgStr = formatHours(userDailyAvgMins);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Monthly Productive Hours Report - ${monthName} ${year}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f9; color: #1e293b;">

<table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f4f6f9; padding: 20px 0;">
    <tr>
        <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="660" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                
                <!-- HEADER -->
                <tr>
                    <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); padding: 28px 32px; text-align: left;">
                        <span style="display: inline-block; padding: 4px 12px; background-color: rgba(255, 255, 255, 0.15); color: #e2e8f0; font-size: 11px; font-weight: 700; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                            Personal Monthly Consolidation
                        </span>
                        <h1 style="margin: 4px 0 0 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                            Your Monthly Productive Hours Report
                        </h1>
                        <p style="margin: 6px 0 0 0; color: #cbd5e1; font-size: 13px;">
                            Full Month Overview &ndash; ${monthName} ${year}
                        </p>
                    </td>
                </tr>

                <!-- GREETING -->
                <tr>
                    <td style="padding: 24px 32px 12px 32px;">
                        <p style="margin: 0; font-size: 14px; color: #334155;">
                            Hello <strong>${userName}</strong>, here is your consolidated monthly productive hours summary for <strong>${monthName} ${year}</strong>.
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
                                        <span style="display: block; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Month Time</span>
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
                                        <span style="display: block; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Daily Avg Logged</span>
                                        <span style="display: block; font-size: 22px; font-weight: 800; color: #6b21a8; margin-top: 4px;">${dailyAvgStr}</span>
                                        <span style="display: block; font-size: 11px; color: #6b21a8; margin-top: 2px;">Per working day</span>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- 1. WEEKLY PROGRESSION TABLE -->
                <tr>
                    <td style="padding: 0 32px 28px 32px;">
                        <h3 style="font-size: 13px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px 0;">
                            Weekly Progression in ${monthName}
                        </h3>
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                            <thead>
                                <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                                    <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Week</th>
                                    <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Period</th>
                                    <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Hours Tracked</th>
                                    <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Billable</th>
                                    <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Utilization</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${userWeeklyProgression.map((w, idx) => {
                                    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                                    return `
                                    <tr style="background-color: ${bg}; border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 9px 12px; font-size: 12px; font-weight: 700; color: #1e293b;">
                                            ${w.label}
                                        </td>
                                        <td style="padding: 9px 12px; text-align: center; font-size: 12px; color: #64748b;">
                                            ${w.periodStr}
                                        </td>
                                        <td style="padding: 9px 12px; text-align: center; font-size: 12px; font-weight: 700; color: #1e293b;">
                                            ${w.totalHoursStr}
                                        </td>
                                        <td style="padding: 9px 12px; text-align: center; font-size: 12px; font-weight: 600; color: #15803d;">
                                            ${w.billableHoursStr}
                                        </td>
                                        <td style="padding: 9px 12px; text-align: center; font-size: 12px; font-weight: 700; color: #4338ca;">
                                            ${w.utilization}%
                                        </td>
                                    </tr>
                                    `;
                                }).join('')}
                                <tr style="background-color: #f1f5f9; border-top: 2px solid #cbd5e1; font-weight: 800;">
                                    <td colspan="2" style="padding: 10px 12px; font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase;">
                                        Month Total (${monthName})
                                    </td>
                                    <td style="padding: 10px 12px; text-align: center; font-size: 13px; font-weight: 800; color: #1e293b;">
                                        ${totalHoursStr}
                                    </td>
                                    <td style="padding: 10px 12px; text-align: center; font-size: 13px; font-weight: 800; color: #15803d;">
                                        ${billableHoursStr}
                                    </td>
                                    <td style="padding: 10px 12px; text-align: center; font-size: 13px; font-weight: 800; color: #4338ca;">
                                        ${userUtilization}%
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>

                <!-- 2. PRODUCTS WORKED ON THIS MONTH -->
                <tr>
                    <td style="padding: 0 32px 28px 32px;">
                        <h3 style="font-size: 13px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px 0;">
                            Products &amp; Projects Breakdown for the Month
                        </h3>
                        ${userProductStats.length > 0 ? `
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                            <thead>
                                <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                                    <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Product / Project</th>
                                    <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Code</th>
                                    <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Time Logged</th>
                                    <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Share of Month</th>
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
                            <p style="margin: 0; font-size: 12px; color: #94a3b8; font-style: italic;">No specific project logs recorded for this month.</p>
                        `}
                    </td>
                </tr>

                <!-- CALL TO ACTION -->
                <tr>
                    <td align="center" style="padding: 0 32px 32px 32px;">
                        <a href="${ctaUrl}" target="_blank" style="display: inline-block; padding: 12px 26px; background-color: #4338ca; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 8px;">
                            Open Time Tracking Dashboard &rarr;
                        </a>
                    </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                    <td style="background-color: #f8fafc; padding: 18px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                        <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                            This is your automated individual monthly productive hours report.<br>
                            Sent every month by Subsync Platform.
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
// HTML TEMPLATE: ADMIN CONSOLIDATED MONTHLY REPORT
// =========================================================================
function generateAdminMonthlyHoursHtml(data) {
    const {
        monthName,
        year,
        teamTotalMins,
        teamBillableMins,
        teamActiveMembers,
        teamActiveProducts,
        teamUtilization,
        teamWeeklyProgression,
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
    <title>Consolidated Monthly Productive Hours Report (Admin)</title>
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
                                        Consolidated Monthly Productive Hours
                                    </h1>
                                    <p style="margin: 6px 0 0 0; color: #c7d2fe; font-size: 13px;">
                                        Month Progression &ndash; ${monthName} ${year}
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
                                        <span style="display: block; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Month Total Hours</span>
                                        <span style="display: block; font-size: 22px; font-weight: 800; color: #1e293b; margin-top: 4px;">${teamTotalHoursStr}</span>
                                        <span style="display: block; font-size: 11px; color: #64748b; margin-top: 2px;">Across entire team</span>
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
                                        <span style="display: block; font-size: 11px; color: #6b21a8; margin-top: 2px;">On ${teamActiveProducts} active products</span>
                                    </div>
                                </td>
                            </tr>
                        </table>

                        <!-- 1. WEEKLY PROGRESSION FOR THE MONTH -->
                        <div style="margin-bottom: 32px;">
                            <h3 style="font-size: 13px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px 0;">
                                Weekly Throughput Progression (${monthName})
                            </h3>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                                <thead>
                                    <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                                        <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Week</th>
                                        <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Period</th>
                                        <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Total Tracked</th>
                                        <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Billable</th>
                                        <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Non-Billable</th>
                                        <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Active Members</th>
                                        <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Utilization</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${teamWeeklyProgression.map((w, idx) => {
                                        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                                        return `
                                        <tr style="background-color: ${bg}; border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 9px 12px; font-size: 12px; font-weight: 700; color: #1e293b;">
                                                ${w.label}
                                            </td>
                                            <td style="padding: 9px 12px; text-align: center; font-size: 12px; color: #64748b;">
                                                ${w.periodStr}
                                            </td>
                                            <td style="padding: 9px 12px; text-align: center; font-size: 12px; font-weight: 700; color: #1e293b;">
                                                ${w.totalHoursStr}
                                            </td>
                                            <td style="padding: 9px 12px; text-align: center; font-size: 12px; font-weight: 700; color: #15803d;">
                                                ${w.billableHoursStr}
                                            </td>
                                            <td style="padding: 9px 12px; text-align: center; font-size: 12px; color: #64748b;">
                                                ${w.nonBillableHoursStr}
                                            </td>
                                            <td style="padding: 9px 12px; text-align: center; font-size: 12px; color: #1e293b;">
                                                ${w.activeMembers} members
                                            </td>
                                            <td style="padding: 9px 12px; text-align: center; font-size: 12px; font-weight: 700; color: #4338ca;">
                                                ${w.utilization}%
                                            </td>
                                        </tr>
                                        `;
                                    }).join('')}
                                    <tr style="background-color: #f1f5f9; border-top: 2px solid #cbd5e1; font-weight: 800;">
                                        <td colspan="2" style="padding: 10px 12px; font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase;">
                                            Month Total (${monthName})
                                        </td>
                                        <td style="padding: 10px 12px; text-align: center; font-size: 13px; font-weight: 800; color: #1e293b;">
                                            ${teamTotalHoursStr}
                                        </td>
                                        <td style="padding: 10px 12px; text-align: center; font-size: 13px; font-weight: 800; color: #15803d;">
                                            ${teamBillableHoursStr}
                                        </td>
                                        <td style="padding: 10px 12px; text-align: center; font-size: 13px; font-weight: 800; color: #64748b;">
                                            ${formatHours(data.teamNonBillableMins)}
                                        </td>
                                        <td style="padding: 10px 12px; text-align: center; font-size: 13px; font-weight: 800; color: #0f172a;">
                                            ${teamActiveMembers} members
                                        </td>
                                        <td style="padding: 10px 12px; text-align: center; font-size: 13px; font-weight: 800; color: #4338ca;">
                                            ${teamUtilization}%
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- 2. TEAM MEMBER WORKLOAD TABLE -->
                        <div style="margin-bottom: 32px;">
                            <h3 style="font-size: 13px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px 0;">
                                Team Member Workload &amp; Monthly Summary
                            </h3>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                                <thead>
                                    <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                                        <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Team Member</th>
                                        <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Month Hours</th>
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
                                                ${m.monthHoursStr}
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

                        <!-- 3. PRODUCT EFFORT DISTRIBUTION -->
                        <div style="margin-bottom: 32px;">
                            <h3 style="font-size: 13px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px 0;">
                                Product Effort Distribution (${monthName})
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
                                        Open Team Time Tracking Dashboard &rarr;
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
                            This is an automated consolidated monthly report generated by Subsync Business Operations Platform.<br>
                            Sent every month to Admins.
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

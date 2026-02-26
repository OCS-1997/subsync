import { getUsersWithTimeEntries, getTimeEntries } from "../models/timeTrackingModel.js";
import { getAllUsers } from "../models/userModel.js";
import { sendEmail } from "./emailService.js";
import { generateBarChart, generatePieChart } from "../utils/chartGenerator.js";
import { minutesToTime } from "../models/dcrModel.js";

/**
 * Format date to readable string
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
    return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Kolkata'
    });
}

/**
 * Generate and send daily time tracking reports to individual users
 * @param {Date} reportDate - Date to generate report for (defaults to today, report covers previous day)
 * @returns {Promise<void>}
 */
export async function sendDailyTimeTrackingReports(reportDate = new Date()) {
    console.log(`Starting daily time tracking reports generation for date: ${reportDate.toISOString()}`);

    // Calculate start and end of the PREVIOUS day (UTC)
    // If run at 00:00 UTC on 2023-10-27, we want report for 2023-10-26
    const targetDate = new Date(reportDate);
    targetDate.setUTCDate(targetDate.getUTCDate() - 1);

    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    console.log(`Report range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    try {
        // 1. Get ALL active users
        const allUsers = await getAllUsers();
        const activeUsers = allUsers.filter(u => u.isActive);
        console.log(`Found ${activeUsers.length} active users to check.`);

        // 2. Process each user
        for (const user of activeUsers) {
            try {
                // Adapter: getAllUsers returns 'username', report expects 'user_id'
                const userForReport = { ...user, user_id: user.username };
                await processUserReport(userForReport, startOfDay, endOfDay, targetDate);
            } catch (err) {
                console.error(`Error processing report for user ${user.name} (${user.username}):`, err);
            }
        }
        console.log("Daily time tracking reports completed.");

    } catch (error) {
        console.error("Error in sendDailyTimeTrackingReports:", error);
    }
}

/**
 * Process report for a single user
 */
async function processUserReport(user, startDate, endDate, reportDate) {
    // Fetch entries
    const { entries } = await getTimeEntries({
        userId: user.user_id,
        startDate: startDate,
        endDate: endDate,
        limit: 1000 // Ensure we get all entries
    });

    if (!entries || entries.length === 0) {
        console.log(`No entries found for user ${user.name}. Sending missing time reminder.`);
        await sendNoTimeLoggedEmail(user, reportDate);
        return;
    }

    // Calculate stats
    let totalMinutes = 0;
    let billableMinutes = 0;
    const projectStats = {};

    entries.forEach(entry => {
        const duration = entry.duration_minutes || 0;
        totalMinutes += duration;

        if (entry.is_billable) {
            billableMinutes += duration;
        }

        const projectName = entry.project_name || 'No Project';
        if (!projectStats[projectName]) {
            projectStats[projectName] = 0;
        }
        projectStats[projectName] += duration;
    });

    const nonBillableMinutes = totalMinutes - billableMinutes;

    // Generate Charts
    const charts = await generateCharts(billableMinutes, nonBillableMinutes, projectStats);

    // Generate HTML
    const html = generateEmailHTML({
        user,
        reportDate,
        entries,
        totalMinutes,
        billableMinutes,
        nonBillableMinutes,
        charts
    });

    // Send Email
    const subject = `Your Daily Time Tracking Report - ${formatDate(reportDate)}`;

    const result = await sendEmail({
        to: user.email,
        subject,
        html,
        attachments: charts.attachments || []
    });

    if (result.success) {
        console.log(`Report sent to ${user.email}`);
    } else {
        console.error(`Failed to send report to ${user.email}: ${result.error}`);
    }
}

async function generateCharts(billable, nonBillable, projectStats) {
    try {
        const billableChartId = 'billable-chart';
        const projectChartId = 'project-chart';

        // Pie Chart: Billable vs Non-Billable
        const billableChartBase64 = await generatePieChart({
            labels: ['Billable', 'Non-Billable'],
            datasets: [{
                data: [billable, nonBillable],
                backgroundColor: ['#10b981', '#6b7280']
            }]
        }, 'Billable Status');

        const billableChartContent = billableChartBase64.replace(/^data:image\/png;base64,/, '');

        // Bar Chart: Projects
        const sortedProjects = Object.entries(projectStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const projectChartBase64 = await generateBarChart({
            labels: sortedProjects.map(p => p[0]),
            datasets: [{
                label: 'Minutes',
                data: sortedProjects.map(p => p[1]),
                backgroundColor: '#3b82f6'
            }]
        }, 'Time by Project');

        const projectChartContent = projectChartBase64.replace(/^data:image\/png;base64,/, '');

        return {
            billableChart: `cid:${billableChartId}`,
            projectChart: `cid:${projectChartId}`,
            attachments: [
                {
                    filename: 'billable_chart.png',
                    content: billableChartContent,
                    encoding: 'base64',
                    type: 'image/png',
                    disposition: 'inline',
                    cid: billableChartId
                },
                {
                    filename: 'project_chart.png',
                    content: projectChartContent,
                    encoding: 'base64',
                    type: 'image/png',
                    disposition: 'inline',
                    cid: projectChartId
                }
            ]
        };
    } catch (error) {
        console.error("Error generating charts:", error);
        return { attachments: [] };
    }
}

function generateEmailHTML(data) {
    const {
        user,
        reportDate,
        entries,
        totalMinutes,
        billableMinutes,
        nonBillableMinutes,
        charts
    } = data;

    const dateStr = formatDate(reportDate);
    const totalTimeStr = minutesToTime(totalMinutes);
    const billableStr = minutesToTime(billableMinutes);
    const nonBillableStr = minutesToTime(nonBillableMinutes);

    // Generate table rows
    const entryRows = entries.map((entry, index) => {
        const timeStr = minutesToTime(entry.duration_minutes || 0);
        // Display time in user friendly format, assuming stored times are somewhat localized or we just show raw
        // Since we don't know user timezone here easily, we rely on server time or just format nicely.
        // Assuming dates are UTC in DB, converting to 'en-IN' (IST) as per other reports seems consistent.
        const startTime = new Date(entry.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
        const endTime = entry.end_time ? new Date(entry.end_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : 'Running';

        return `
            <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${entry.project_name || '-'}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    <div style="font-weight: bold; color: #1f2937;">${entry.title}</div>
                    ${entry.description ? `<div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${entry.description}</div>` : ''}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                    ${entry.activity_type_name ? `<span style="background-color: ${entry.activity_color || '#e5e7eb'}; padding: 2px 8px; border-radius: 9999px; font-size: 12px;">${entry.activity_type_name}</span>` : '-'}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${startTime} - ${endTime}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${timeStr}</td>
            </tr>
        `;
    }).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Time Tracking Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; color: #1f2937;">
    <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); margin-top: 20px; margin-bottom: 20px;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 30px 40px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">Daily Time Report</h1>
            <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">${dateStr}</p>
        </div>

        <!-- Greeting -->
        <div style="padding: 30px 40px 10px;">
            <p style="font-size: 16px; margin: 0;">Hello <strong>${user.name}</strong>,</p>
            <p style="color: #4b5563; margin-top: 5px;">Here is a summary of your time tracking activity for yesterday.</p>
        </div>

        <!-- Key Stats Cards -->
        <div style="padding: 0 40px; display: flex; flex-wrap: wrap; gap: 20px; justify-content: space-between; margin-bottom: 30px;">
            <div style="flex: 1; min-width: 140px; background-color: #eff6ff; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #bfdbfe;">
                <div style="color: #3b82f6; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Total Time</div>
                <div style="font-size: 28px; font-weight: 700; color: #1e40af; margin-top: 5px;">${totalTimeStr}</div>
            </div>
            <div style="flex: 1; min-width: 140px; background-color: #ecfdf5; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #a7f3d0;">
                <div style="color: #10b981; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Billable</div>
                <div style="font-size: 28px; font-weight: 700; color: #065f46; margin-top: 5px;">${billableStr}</div>
            </div>
            <div style="flex: 1; min-width: 140px; background-color: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #e5e7eb;">
                <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Non-Billable</div>
                <div style="font-size: 28px; font-weight: 700; color: #374151; margin-top: 5px;">${nonBillableStr}</div>
            </div>
        </div>

        <!-- Charts Section -->
        <div style="padding: 0 40px; display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 30px;">
            ${charts.billableChart ? `
            <div style="flex: 1; min-width: 300px; text-align: center;">
                <h3 style="font-size: 16px; color: #374151; margin-bottom: 15px;">Billable Distribution</h3>
                <img src="${charts.billableChart}" alt="Billable Chart" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #f3f4f6;" />
            </div>
            ` : ''}

            ${charts.projectChart ? `
            <div style="flex: 1; min-width: 300px; text-align: center;">
                <h3 style="font-size: 16px; color: #374151; margin-bottom: 15px;">Top Projects</h3>
                <img src="${charts.projectChart}" alt="Project Chart" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #f3f4f6;" />
            </div>
            ` : ''}
        </div>

        <!-- Detailed Log Table -->
        <div style="padding: 0 40px 40px;">
            <h3 style="font-size: 18px; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px;">Activity Log</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                    <tr style="background-color: #f9fafb; color: #4b5563;">
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600;">Project</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600;">Task / Description</th>
                        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb; font-weight: 600;">Activity</th>
                        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb; font-weight: 600;">Time Range</th>
                        <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; font-weight: 600;">Duration</th>
                    </tr>
                </thead>
                <tbody>
                    ${entryRows}
                </tbody>
            </table>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
            <p style="margin: 0;">This is an automated report from Subsync.</p>
            <p style="margin: 5px 0 0;">&copy; ${new Date().getFullYear()} Subsync Solutions.</p>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Send email to users with no time entries
 */
async function sendNoTimeLoggedEmail(user, reportDate) {
    const dateStr = formatDate(reportDate);
    const subject = `Action Required: No Time Logged for ${dateStr}`;
    
    // In development, prefer the client port. In production, use the configured base URL.
    const clientPort = process.env.CLIENT_PORT || 5173;
    const appUrl = process.env.NODE_ENV === 'production' 
        ? (process.env.APP_BASE_URL || `http://localhost:${clientPort}`)
        : `http://localhost:${clientPort}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Missing Time Entries</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; color: #1f2937;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); margin-top: 40px; margin-bottom: 40px;">
        
        <!-- Header -->
    <div style="background-color: #dc2626; padding: 20px 40px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 600;">Action Required: Time Entry Missing</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px;">
        <p style="font-size: 16px; margin: 0;">Hello <strong>${user.name}</strong>,</p>
        
        <p style="color: #4b5563; margin-top: 20px; line-height: 1.6;">
            Our records indicate that no time entries have been submitted for <strong>${dateStr}</strong>.
        </p>

        <p style="color: #4b5563; margin-top: 20px; line-height: 1.6;">
            Timely and accurate time logging is a mandatory compliance requirement. Failure to maintain updated records may result in administrative escalation, impact on project reporting, and potential restrictions on system access.
        </p>

        <p style="color: #4b5563; margin-top: 20px; line-height: 1.6;">
            You are required to update your time entries immediately to avoid further action.
        </p>

        <p style="color: #4b5563; margin-top: 20px; line-height: 1.6;">
            Continued non-compliance will be formally reviewed.
        </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
        <p style="margin: 0;">This is an automated notification from Subsync. No further reminders may be issued.</p>
    </div>
    </div>
    </body>
</html>
    `;

    const result = await sendEmail({
        to: user.email,
        subject,
        html
    });

    if (result.success) {
        //console.log(`Missing time reminder sent to ${user.email}`);
    } else {
        console.error(`Failed to send reminder to ${user.email}: ${result.error}`);
    }
}


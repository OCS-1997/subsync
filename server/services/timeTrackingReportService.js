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

    // Calculate the TARGET date for the report (the day BEFORE reportDate)
    // If run at 12:00 IST on March 8th, we want the report for March 7th.
    // We explicitly calculate this relative to IST to ensure consistency.
    const targetDate = new Date(reportDate);
    // Subtract 1 day
    targetDate.setDate(targetDate.getDate() - 1);

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Generating report for: ${formatDate(targetDate)}`);
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
                // Pass the target date so sub-functions can handle the reporting date consistently
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
async function processUserReport(user, startDate, endDate, targetDate) {
    // Fetch entries
    const { entries } = await getTimeEntries({
        userId: user.user_id,
        startDate: startDate,
        endDate: endDate,
        limit: 1000 // Ensure we get all entries
    });

    if (!entries || entries.length === 0) {
        // Skip missing time reminder on Sundays
        const targetDate = new Date(startDate);
        if (targetDate.getDay() === 0) { // 0 is Sunday
            console.log(`No entries found for user ${user.name} on Sunday. Skipping reminder.`);
            return;
        }

        console.log(`No entries found for user ${user.name}. Sending missing time reminder.`);
        await sendNoTimeLoggedEmail(user, targetDate);
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
    const charts = await generateCharts(projectStats);

    // Generate HTML
    const html = generateEmailHTML({
        user,
        targetDate,
        entries,
        totalMinutes,
        billableMinutes,
        nonBillableMinutes,
        charts
    });

    // Send Email
    const subject = `Your Daily Time Tracking Report - ${formatDate(targetDate)}`;

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

async function generateCharts(projectStats) {
    try {
        const projectChartId = 'project-chart';

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
            projectChart: `cid:${projectChartId}`,
            attachments: [
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
        targetDate,
        entries,
        totalMinutes,
        billableMinutes,
        nonBillableMinutes,
        charts
    } = data;

    const dateStr = formatDate(targetDate);
    const totalTimeStr = minutesToTime(totalMinutes);

    // Generate table rows
    const entryRows = entries.map((entry, index) => {
        const timeStr = minutesToTime(entry.duration_minutes || 0);
        const startTime = new Date(entry.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
        const endTime = entry.end_time ? new Date(entry.end_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) : 'Running';

        return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 16px 20px; font-weight: 500; color: #334155; width: 20%; word-break: break-word;">${entry.project_name || '-'}</td>
                <td style="padding: 16px 20px; width: 35%; word-break: break-word;">
                    <div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">${entry.title}</div>
                    ${entry.description ? `<div style="font-size: 13px; color: #64748b; line-height: 1.4;">${entry.description}</div>` : ''}
                </td>
                <td style="padding: 16px 20px; text-align: center; width: 15%;">
                    ${entry.activity_type_name ? `<span style="background-color: ${entry.activity_color || '#f1f5f9'}; color: #334155; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; display: inline-block; white-space: nowrap;">${entry.activity_type_name}</span>` : '-'}
                </td>
                <td style="padding: 16px 20px; text-align: center; color: #475569; font-size: 14px; white-space: nowrap; width: 20%;">${startTime} - ${endTime}</td>
                <td style="padding: 16px 20px; text-align: right; font-weight: 600; color: #0f172a; white-space: nowrap; width: 10%;">${timeStr}</td>
            </tr>
        `;
    }).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Activity Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; line-height: 1.6;">
    <div style="max-width: 700px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px; text-align: center; color: white;">
            <div style="display: inline-block; padding: 10px 20px; background: rgba(255,255,255,0.1); border-radius: 999px; margin-bottom: 16px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Daily Activity Report</div>
            <h1 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">Summary for ${dateStr}</h1>
        </div>

        <!-- Greeting -->
        <div style="padding: 40px 40px 20px;">
            <p style="font-size: 18px; margin: 0; color: #0f172a;">Hello <strong>${user.name}</strong>,</p>
            <p style="color: #64748b; margin-top: 8px; font-size: 16px;">Here's your comprehensive time tracking summary for yesterday.</p>
        </div>

        <!-- Hero Stat Section -->
        <div style="padding: 0 40px; margin-bottom: 40px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 16px; padding: 40px 32px; text-align: center; color: white; box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.3);">
                <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; opacity: 0.9; margin-bottom: 12px;">Total Time Logged</div>
                <div style="font-size: 64px; font-weight: 900; line-height: 1;">${totalTimeStr}</div>
            </div>
        </div>

        <!-- Charts Section -->
        ${charts.projectChart ? `
        <div style="padding: 0 40px; margin-bottom: 40px;">
            <h3 style="font-size: 20px; color: #0f172a; margin-bottom: 24px; font-weight: 700; display: flex; align-items: center;">
                Project Breakdown
            </h3>
            <div style="background: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
                <h4 style="font-size: 14px; color: #64748b; margin-bottom: 20px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Time by Project</h4>
                <img src="${charts.projectChart}" alt="Project Chart" style="max-width: 100%; height: auto; border-radius: 8px;" />
            </div>
        </div>
        ` : ''}

        <!-- Detailed Activity Log -->
        <div style="padding: 0 40px 40px;">
            <h3 style="font-size: 20px; color: #0f172a; margin-bottom: 24px; font-weight: 700;">Activity Details</h3>
            <div style="border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #f8fafc;">
                            <th style="padding: 20px; text-align: left; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px; width: 20%;">Project</th>
                            <th style="padding: 20px; text-align: left; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px; width: 35%;">Task Snapshot</th>
                            <th style="padding: 20px; text-align: center; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px; width: 15%;">Activity</th>
                            <th style="padding: 20px; text-align: center; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px; width: 20%;">Time</th>
                            <th style="padding: 20px; text-align: right; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px; width: 10%;">Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${entryRows}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 40px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 15px; color: #475569; font-weight: 500;">Efficiency through transparency.</p>
            <p style="margin: 8px 0 0; font-size: 13px; color: #94a3b8;">This is an automated report from <strong>Subsync</strong></p>
            <div style="margin-top: 24px; border-top: 1px solid #e2e8f0; pt: 24px;">
                <p style="margin: 24px 0 0; font-size: 12px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px;">&copy; ${new Date().getFullYear()} Online Consultancy Services (OCS)</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Send email to users with no time entries
 */
async function sendNoTimeLoggedEmail(user, targetDate) {
    const dateStr = formatDate(targetDate);
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
            Just a quick reminder that your timesheet for <strong>${dateStr}</strong> is pending. Please update it by the earliest, if you were on leave feel free to mark the date accordingly.
        </p>

        <p style="color: #4b5563; margin-top: 20px; line-height: 1.6;">
            Timely updates help maintain accurate project tracking and reporting.
        </p>

        <p style="color: #4b5563; margin-top: 20px; line-height: 1.6;">
            Thank you for your cooperation.
        </p>

        
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
        <p style="margin: 0;">This is an automated notification from Subsync RMS. No further reminders may be issued.</p>
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


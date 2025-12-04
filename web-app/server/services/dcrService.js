import { getDcrEntriesForDate, minutesToTime } from "../models/dcrModel.js";
import { sendEmail } from "./emailService.js";
import { generateBarChart, generatePieChart } from "../utils/chartGenerator.js";

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
        day: 'numeric'
    });
}

/**
 * Format time to HH:MM
 * @param {Date} date
 * @returns {string}
 */
function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Generate and send daily DCR email report
 * @param {Date} reportDate - Date to generate report for (defaults to today in IST)
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function sendDailyDcrReportEmail(reportDate = null) {
    try {
        // Use provided date or get current date in IST
        const istDate = reportDate || new Date();
        
        // Get all DCR entries for the date
        const entries = await getDcrEntriesForDate(istDate);

        // Calculate aggregations
        const totalDcrs = entries.length;
        const totalTimeMinutes = entries.reduce((sum, e) => sum + (e.time_spent_minutes || 0), 0);
        const totalTimeHours = Math.floor(totalTimeMinutes / 60);
        const totalTimeMins = totalTimeMinutes % 60;

        // Get unique users
        const uniqueUsers = [...new Set(entries.map(e => e.user_id))];
        const activeUsersCount = uniqueUsers.length;

        // Per-user breakdown
        const userStats = {};
        entries.forEach(entry => {
            const userId = entry.user_id;
            const userName = entry.user_name || userId;
            
            if (!userStats[userId]) {
                userStats[userId] = {
                    name: userName,
                    count: 0,
                    totalMinutes: 0,
                    inbound: 0,
                    outbound: 0
                };
            }
            
            userStats[userId].count++;
            userStats[userId].totalMinutes += entry.time_spent_minutes || 0;
            
            if (entry.call_type === 'inbound') {
                userStats[userId].inbound++;
            } else {
                userStats[userId].outbound++;
            }
        });

        // Per call type breakdown
        const callTypeStats = {
            inbound: entries.filter(e => e.call_type === 'inbound').length,
            outbound: entries.filter(e => e.call_type === 'outbound').length
        };

        // Generate charts
        const charts = await generateCharts(entries, userStats, callTypeStats);

        // Generate HTML email
        const html = generateEmailHTML({
            reportDate: istDate,
            totalDcrs,
            totalTimeHours,
            totalTimeMins,
            activeUsersCount,
            userStats: Object.values(userStats),
            callTypeStats,
            entries,
            charts
        });

        // Send email
        const recipient = process.env.DCR_DAILY_REPORT_TO || 'hari@ocsindia.net';
        const subject = `Daily DCR Report - ${formatDate(istDate)}`;

        const result = await sendEmail({
            to: recipient,
            subject,
            html
        });

        if (result.success) {
            console.log(`Daily DCR report sent successfully to ${recipient} for ${formatDate(istDate)}`);
            return { success: true, error: null };
        } else {
            console.error(`Failed to send DCR report: ${result.error}`);
            return { success: false, error: result.error };
        }
    } catch (error) {
        console.error("Error generating DCR report:", error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

/**
 * Generate charts for the report
 * @param {Array} entries
 * @param {Object} userStats
 * @param {Object} callTypeStats
 * @returns {Promise<{userChart: string, callTypeChart: string}>}
 */
async function generateCharts(entries, userStats, callTypeStats) {
    try {
        // Chart 1: DCR count per user (bar chart)
        const userLabels = Object.values(userStats).map(u => u.name);
        const userCounts = Object.values(userStats).map(u => u.count);
        const userChart = await generateBarChart({
            labels: userLabels,
            datasets: [{
                label: 'Number of DCRs',
                data: userCounts,
                backgroundColor: '#2563eb'
            }]
        }, 'DCRs per User');

        // Chart 2: Inbound vs Outbound (pie chart)
        const callTypeChart = await generatePieChart({
            labels: ['Inbound', 'Outbound'],
            datasets: [{
                data: [callTypeStats.inbound, callTypeStats.outbound],
                backgroundColor: ['#1d4ed8', '#3b82f6']
            }]
        }, 'Call Type Distribution');

        return { userChart, callTypeChart };
    } catch (error) {
        console.error("Error generating charts:", error);
        return { userChart: null, callTypeChart: null };
    }
}

/**
 * Generate HTML email content
 * @param {Object} data
 * @returns {string}
 */
function generateEmailHTML(data) {
    const {
        reportDate,
        totalDcrs,
        totalTimeHours,
        totalTimeMins,
        activeUsersCount,
        userStats,
        callTypeStats,
        entries,
        charts
    } = data;

    const dateStr = formatDate(reportDate);

    // Generate user summary table rows
    const userRows = userStats.map(user => {
        const timeStr = minutesToTime(user.totalMinutes);
        return `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${user.name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${user.count}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${timeStr}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${user.inbound}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${user.outbound}</td>
            </tr>
        `;
    }).join('');

    // Generate detailed entries table rows
    const entryRows = entries.map(entry => {
        const timeStr = formatTime(new Date(entry.timestamp));
        const domainDisplay = entry.domain_name || entry.domain_free_text || '-';
        const companyDisplay = entry.company_name || '-';
        const contactDisplay = entry.contact_name || '-';
        const contactPhone = entry.contact_phone_number ? `${entry.contact_phone_country_code || ''} ${entry.contact_phone_number}`.trim() : '-';
        const notesDisplay = entry.notes ? (entry.notes.length > 100 ? entry.notes.substring(0, 100) + '...' : entry.notes) : '-';
        
        return `
            <tr style="background-color: ${entries.indexOf(entry) % 2 === 0 ? '#eff6ff' : '#ffffff'};">
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${timeStr}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${entry.user_name || entry.user_id}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${entry.call_type}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${minutesToTime(entry.time_spent_minutes || 0)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${domainDisplay}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${companyDisplay}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${contactDisplay}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${contactPhone}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${notesDisplay}</td>
            </tr>
        `;
    }).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: linear-gradient(135deg, #1e3a8a, #2563eb); color: white; padding: 20px; text-align: center; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .summary-box { background: #dbeafe; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .summary-box h3 { color: #1e3a8a; margin-top: 0; }
        .summary-stats { display: flex; justify-content: space-around; flex-wrap: wrap; }
        .stat-item { text-align: center; margin: 10px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #1e3a8a; }
        .stat-label { font-size: 14px; color: #64748b; }
        .section { margin: 30px 0; }
        .section h2 { color: #1e3a8a; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background-color: #1e3a8a; color: white; padding: 12px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        tr:hover { background-color: #dbeafe !important; }
        .chart-container { text-align: center; margin: 20px 0; }
        .chart-container img { max-width: 100%; height: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Daily DCR Report</h1>
        <p>${dateStr}</p>
    </div>
    
    <div class="container">
        <div class="summary-box">
            <h3>Summary</h3>
            <div class="summary-stats">
                <div class="stat-item">
                    <div class="stat-value">${totalDcrs}</div>
                    <div class="stat-label">Total DCRs</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${totalTimeHours}h ${totalTimeMins}m</div>
                    <div class="stat-label">Total Time Spent</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${activeUsersCount}</div>
                    <div class="stat-label">Active Users</div>
                </div>
            </div>
        </div>

        ${charts.userChart ? `
        <div class="section">
            <h2>DCRs per User</h2>
            <div class="chart-container">
                <img src="${charts.userChart}" alt="DCRs per User" />
            </div>
        </div>
        ` : ''}

        ${charts.callTypeChart ? `
        <div class="section">
            <h2>Call Type Distribution</h2>
            <div class="chart-container">
                <img src="${charts.callTypeChart}" alt="Call Type Distribution" />
            </div>
        </div>
        ` : ''}

        <div class="section">
            <h2>Per-User Summary</h2>
            <table>
                <thead>
                    <tr>
                        <th>User Name</th>
                        <th style="text-align: center;"># of DCRs</th>
                        <th style="text-align: center;">Total Time Spent</th>
                        <th style="text-align: center;"># Inbound</th>
                        <th style="text-align: center;"># Outbound</th>
                    </tr>
                </thead>
                <tbody>
                    ${userRows || '<tr><td colspan="5" style="text-align: center; padding: 20px;">No data available</td></tr>'}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>Detailed DCR Entries</h2>
            <table>
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>User</th>
                        <th>Call Type</th>
                        <th style="text-align: center;">Time Spent</th>
                        <th>Domain</th>
                        <th>Company</th>
                        <th>Contact</th>
                        <th>Contact Phone</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${entryRows || '<tr><td colspan="9" style="text-align: center; padding: 20px;">No DCR entries for this date</td></tr>'}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
    `;
}




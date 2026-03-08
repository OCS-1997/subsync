
import fs from 'fs';
import path from 'path';

// Mock minutesToTime since we can't easily import it without its dependencies
function minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
}

// Mock formatDate
function formatDate(date) {
    return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Kolkata'
    });
}

// The revamped generateEmailHTML function (copy-pasted for testing)
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

    // Display the date for which the report is generated (one day before reportDate)
    const displayDate = new Date(reportDate);
    displayDate.setDate(displayDate.getDate() - 1);
    const dateStr = formatDate(displayDate);
    const totalTimeStr = minutesToTime(totalMinutes);

    // Generate table rows
    const entryRows = entries.map((entry, index) => {
        const timeStr = minutesToTime(entry.duration_minutes || 0);
        const startTime = new Date(entry.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
        const endTime = entry.end_time ? new Date(entry.end_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) : 'Running';

        return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 16px 20px; font-weight: 500; color: #334155;">${entry.project_name || '-'}</td>
                <td style="padding: 16px 20px;">
                    <div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">${entry.title}</div>
                    ${entry.description ? `<div style="font-size: 13px; color: #64748b; line-height: 1.4;">${entry.description}</div>` : ''}
                </td>
                <td style="padding: 16px 20px; text-align: center;">
                    ${entry.activity_type_name ? `<span style="background-color: ${entry.activity_color || '#f1f5f9'}; color: #334155; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">${entry.activity_type_name}</span>` : '-'}
                </td>
                <td style="padding: 16px 20px; text-align: center; color: #475569; font-size: 14px; white-space: nowrap;">${startTime} - ${endTime}</td>
                <td style="padding: 16px 20px; text-align: right; font-weight: 600; color: #0f172a;">${timeStr}</td>
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
                            <th style="padding: 20px; text-align: left; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px;">Project</th>
                            <th style="padding: 20px; text-align: left; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px;">Task Snapshot</th>
                            <th style="padding: 20px; text-align: center; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px;">Activity</th>
                            <th style="padding: 20px; text-align: center; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px;">Time</th>
                            <th style="padding: 20px; text-align: right; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px;">Duration</th>
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

// Mock Data
const mockUser = { name: "John Doe" };
const mockReportDate = new Date(); // Today (Trigger Date)

const mockEntries = [
    {
        project_name: "RMS Subsync",
        title: "Revamping Email Template",
        description: "Modernizing the daily report with glassmorphism and premium aesthetics.",
        activity_type_name: "Development",
        activity_color: "#3b82f6",
        start_time: new Date().setHours(9, 0, 0),
        end_time: new Date().setHours(12, 30, 0),
        duration_minutes: 210
    },
    {
        project_name: "Internal Admin",
        title: "Code Review",
        description: "Reviewing PRs for the authentication module.",
        activity_type_name: "Review",
        activity_color: "#10b981",
        start_time: new Date().setHours(14, 0, 0),
        end_time: new Date().setHours(15, 0, 0),
        duration_minutes: 60
    }
];

const mockCharts = {
    projectChart: "https://via.placeholder.com/600x300?text=Project+Breakdown+Chart"
};

const html = generateEmailHTML({
    user: mockUser,
    reportDate: mockReportDate,
    entries: mockEntries,
    totalMinutes: 270,
    billableMinutes: 210,
    nonBillableMinutes: 60,
    charts: mockCharts
});

fs.writeFileSync('report_preview.html', html);
console.log('Generated report_preview.html');

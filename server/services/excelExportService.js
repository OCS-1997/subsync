import ExcelJS from 'exceljs';
import { generatePieChart, generateBarChart } from '../utils/chartGenerator.js';
import { format } from 'date-fns';

/**
 * Generate Excel Workbook for User Insights
 * @param {Object} data - { insights: Array, dateRangeText: string, companyName: string, includeCharts: boolean }
 * @returns {Promise<Buffer>} Excel file buffer
 */
export async function generateExcelReport({ insights, dateRangeText, companyName = 'Subsync Workspace', includeCharts = true }) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Subsync Enterprise Reports';
    workbook.lastModifiedBy = 'Subsync';
    workbook.created = new Date();
    workbook.modified = new Date();

    // COLOR SCHEME (Corporate Blues)
    const PRIMARY_COLOR = '1E3A8A'; // Dark Blue
    const ACCENT_COLOR = '3B82F6';  // Sky Blue
    const LIGHT_BG = 'F3F4F6';      // Gray-100
    const EXCEL_BORDER = {
        top: { style: 'thin', color: { argb: 'D1D5DB' } },
        left: { style: 'thin', color: { argb: 'D1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
        right: { style: 'thin', color: { argb: 'D1D5DB' } }
    };

    // ----------------------------------------------------
    // SHEET 1: EXECUTIVE SUMMARY
    // ----------------------------------------------------
    const summarySheet = workbook.addWorksheet('Executive Summary');
    summarySheet.views = [{ showGridLines: true }];

    // Title Block
    summarySheet.mergeCells('A1:G1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = 'Operational User Insights Report';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIMARY_COLOR } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    summarySheet.getRow(1).height = 40;

    // Report Details
    summarySheet.getCell('A3').value = 'Organization:';
    summarySheet.getCell('A3').font = { bold: true };
    summarySheet.getCell('B3').value = companyName;

    summarySheet.getCell('A4').value = 'Reporting Period:';
    summarySheet.getCell('A4').font = { bold: true };
    summarySheet.getCell('B4').value = dateRangeText;

    summarySheet.getCell('A5').value = 'Generated At:';
    summarySheet.getCell('A5').font = { bold: true };
    summarySheet.getCell('B5').value = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

    // Aggregate Calculations
    const totalUsers = insights.length;
    const totalHours = insights.reduce((sum, u) => sum + u.totalHours, 0);
    const totalBillableHours = insights.reduce((sum, u) => sum + u.billableHours, 0);
    const avgBillablePercent = totalHours > 0 ? Math.round((totalBillableHours / totalHours) * 100) : 0;
    const avgPerformanceScore = Math.round(insights.reduce((sum, u) => sum + u.performanceScore, 0) / (totalUsers || 1));

    // Stats Cards
    const stats = [
        { label: 'Total Users', val: totalUsers, colStart: 'A', colEnd: 'B' },
        { label: 'Cumulative Hours', val: `${totalHours.toFixed(1)} hrs`, colStart: 'C', colEnd: 'D' },
        { label: 'Billable Utilization', val: `${avgBillablePercent}%`, colStart: 'E', colEnd: 'F' },
        { label: 'Avg Performance Score', val: avgPerformanceScore, colStart: 'G', colEnd: 'G' }
    ];

    stats.forEach((stat, i) => {
        // Label Row
        const labelCell = summarySheet.getCell(`${stat.colStart}7`);
        labelCell.value = stat.label;
        labelCell.font = { size: 9, bold: true, color: { argb: '4B5563' } };
        labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BG } };
        labelCell.alignment = { horizontal: 'center' };
        labelCell.border = EXCEL_BORDER;

        // Value Row
        const valCell = summarySheet.getCell(`${stat.colStart}8`);
        valCell.value = stat.val;
        valCell.font = { size: 14, bold: true, color: { argb: PRIMARY_COLOR } };
        valCell.alignment = { horizontal: 'center', vertical: 'middle' };
        valCell.border = EXCEL_BORDER;

        if (stat.colStart !== stat.colEnd) {
            summarySheet.mergeCells(`${stat.colStart}7:${stat.colEnd}7`);
            summarySheet.mergeCells(`${stat.colStart}8:${stat.colEnd}8`);
        }
    });
    summarySheet.getRow(8).height = 30;

    // ----------------------------------------------------
    // SHEET 2: ALL USERS OVERVIEW
    // ----------------------------------------------------
    const overviewSheet = workbook.addWorksheet('All Users Overview');
    overviewSheet.views = [{ state: 'frozen', ySplit: 2, showGridLines: true }];

    // Section Header
    overviewSheet.mergeCells('A1:H1');
    const sectionCell = overviewSheet.getCell('A1');
    sectionCell.value = 'Consolidated Operational Performance Grid';
    sectionCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFF' } };
    sectionCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACCENT_COLOR } };
    sectionCell.alignment = { horizontal: 'left', vertical: 'middle' };
    overviewSheet.getRow(1).height = 25;

    // Headers
    const headers = ['User Name', 'Email', 'Team / Department', 'Role', 'Total Hours', 'Billable Rate', 'Performance Score', 'Sentiment Trend'];
    overviewSheet.getRow(2).values = headers;
    overviewSheet.getRow(2).height = 22;
    overviewSheet.getRow(2).eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIMARY_COLOR } };
        cell.alignment = { vertical: 'middle' };
        cell.border = EXCEL_BORDER;
    });

    // Populate rows
    insights.forEach((u, i) => {
        const row = overviewSheet.addRow([
            u.name,
            u.email,
            u.department,
            u.role,
            u.totalHours,
            `${u.billablePercent}%`,
            u.performanceScore,
            u.sentiment
        ]);
        row.height = 20;
        row.eachCell((cell, colIndex) => {
            cell.border = EXCEL_BORDER;
            cell.alignment = { vertical: 'middle' };
            // Apply zebra coloring
            if (i % 2 === 1) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BG } };
            }
            // Performance Score color formatting
            if (colIndex === 7) {
                if (cell.value >= 75) {
                    cell.font = { color: { argb: '047857' }, bold: true }; // Emerald green
                } else if (cell.value < 50) {
                    cell.font = { color: { argb: 'B91C1C' }, bold: true }; // Red
                }
            }
        });
    });

    // Enable filtering
    overviewSheet.autoFilter = `A2:H${insights.length + 2}`;

    // Auto-size columns for Sheet 1 & Sheet 2
    [summarySheet, overviewSheet].forEach(sheet => {
        sheet.columns.forEach(column => {
            let maxLen = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                const cellVal = cell.value ? String(cell.value) : '';
                if (cellVal.length > maxLen) maxLen = cellVal.length;
            });
            column.width = Math.max(13, maxLen + 2);
        });
    });

    // ----------------------------------------------------
    // INDIVIDUAL USER WORKSHEETS
    // ----------------------------------------------------
    for (const u of insights) {
        // Create tab named by user (limit to 30 chars for safety)
        const sheetName = u.name.substring(0, 30);
        const uSheet = workbook.addWorksheet(sheetName);
        uSheet.views = [{ showGridLines: true }];

        // Header Title
        uSheet.mergeCells('A1:G1');
        const headerCell = uSheet.getCell('A1');
        headerCell.value = `${u.name} - Individual Insights`;
        headerCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFF' } };
        headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIMARY_COLOR } };
        headerCell.alignment = { horizontal: 'left', vertical: 'middle' };
        uSheet.getRow(1).height = 35;

        // Profile details
        uSheet.getCell('A3').value = 'Email:';
        uSheet.getCell('A3').font = { bold: true };
        uSheet.getCell('B3').value = u.email;

        uSheet.getCell('A4').value = 'Role:';
        uSheet.getCell('A4').font = { bold: true };
        uSheet.getCell('B4').value = u.role;

        uSheet.getCell('A5').value = 'Team/Dept:';
        uSheet.getCell('A5').font = { bold: true };
        uSheet.getCell('B5').value = u.department;

        // Sentiment Card
        uSheet.getCell('D3').value = 'Performance Score:';
        uSheet.getCell('D3').font = { bold: true };
        uSheet.getCell('E3').value = `${u.performanceScore} / 100`;
        uSheet.getCell('E3').font = { bold: true, color: { argb: PRIMARY_COLOR } };

        uSheet.getCell('D4').value = 'Sentiment Trend:';
        uSheet.getCell('D4').font = { bold: true };
        uSheet.getCell('E4').value = u.sentiment;

        uSheet.getCell('D5').value = 'Analysis:';
        uSheet.getCell('D5').font = { bold: true };
        uSheet.getCell('E5').value = u.sentimentDescription;
        uSheet.mergeCells('E5:H5');

        // Metrics Table
        uSheet.getCell('A7').value = 'Operational KPIs';
        uSheet.getCell('A7').font = { bold: true, color: { argb: PRIMARY_COLOR } };
        uSheet.mergeCells('A7:C7');

        const metrics = [
            ['Total Tracked Time', `${u.totalHours} hrs`],
            ['Total Billable Time', `${u.billableHours} hrs`],
            ['Utilization Rate', `${u.billablePercent}%`],
            ['Active Days', `${u.breakdowns.dailyTrend.filter(t => t.total_minutes > 0).length} days`],
            ['Daily Avg Hours', `${u.dailyAvgHours} hrs`],
            ['Total Logs Count', `${u.entryCount} logs`]
        ];

        metrics.forEach((metric, idx) => {
            const rowIdx = 8 + idx;
            uSheet.getCell(`A${rowIdx}`).value = metric[0];
            uSheet.getCell(`A${rowIdx}`).font = { bold: true };
            uSheet.getCell(`A${rowIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BG } };
            uSheet.getCell(`A${rowIdx}`).border = EXCEL_BORDER;

            uSheet.getCell(`B${rowIdx}`).value = metric[1];
            uSheet.getCell(`B${rowIdx}`).border = EXCEL_BORDER;
            uSheet.mergeCells(`B${rowIdx}:C${rowIdx}`);
        });

        // Insights Section (Achievements, Improvements, Recommendations)
        uSheet.getCell('E7').value = 'Qualitative Insights & Guidance';
        uSheet.getCell('E7').font = { bold: true, color: { argb: PRIMARY_COLOR } };
        uSheet.mergeCells('E7:H7');

        let insightRowIdx = 8;
        // Key Achievements
        uSheet.getCell(`E${insightRowIdx}`).value = 'Achievements:';
        uSheet.getCell(`E${insightRowIdx}`).font = { bold: true, color: { argb: '047857' } };
        uSheet.getCell(`F${insightRowIdx}`).value = u.achievements.join(' | ');
        uSheet.mergeCells(`F${insightRowIdx}:H${insightRowIdx}`);

        insightRowIdx++;
        // Improvements
        uSheet.getCell(`E${insightRowIdx}`).value = 'Areas of Improvement:';
        uSheet.getCell(`E${insightRowIdx}`).font = { bold: true, color: { argb: 'B91C1C' } };
        uSheet.getCell(`F${insightRowIdx}`).value = u.improvements.join(' | ');
        uSheet.mergeCells(`F${insightRowIdx}:H${insightRowIdx}`);

        insightRowIdx++;
        // Recommendations
        uSheet.getCell(`E${insightRowIdx}`).value = 'Recommendations:';
        uSheet.getCell(`E${insightRowIdx}`).font = { bold: true, color: { argb: 'D97706' } };
        uSheet.getCell(`F${insightRowIdx}`).value = u.recommendations.join(' | ');
        uSheet.mergeCells(`F${insightRowIdx}:H${insightRowIdx}`);

        // Project Breakdown table
        uSheet.getCell('A15').value = 'Project Breakdown Details';
        uSheet.getCell('A15').font = { bold: true, color: { argb: PRIMARY_COLOR } };
        uSheet.mergeCells('A15:D15');

        const projHeaders = ['Project Name', 'Client/Customer', 'Logged Minutes', 'Hours', 'Billable (hrs)'];
        uSheet.getRow(16).values = projHeaders;
        uSheet.getRow(16).eachCell((cell, cIdx) => {
            cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 9 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACCENT_COLOR } };
            cell.border = EXCEL_BORDER;
        });

        let projRowIdx = 17;
        if (u.breakdowns.byProject.length > 0) {
            u.breakdowns.byProject.forEach(p => {
                uSheet.getRow(projRowIdx).values = [
                    p.project_name,
                    p.customer_name || 'Internal',
                    p.total_minutes,
                    parseFloat((p.total_minutes / 60).toFixed(1)),
                    parseFloat((p.billable_minutes / 60).toFixed(1))
                ];
                uSheet.getRow(projRowIdx).eachCell(cell => { cell.border = EXCEL_BORDER; });
                projRowIdx++;
            });
        } else {
            uSheet.getCell(`A${projRowIdx}`).value = 'No projects logged';
            uSheet.mergeCells(`A${projRowIdx}:E${projRowIdx}`);
            uSheet.getCell(`A${projRowIdx}`).border = EXCEL_BORDER;
            uSheet.getCell(`A${projRowIdx}`).alignment = { horizontal: 'center' };
            projRowIdx++;
        }

        // Detailed Time Entry Logs Table
        const logStartRow = Math.max(projRowIdx + 2, 28);
        uSheet.getCell(`A${logStartRow}`).value = 'Time Tracking Logs Detail';
        uSheet.getCell(`A${logStartRow}`).font = { bold: true, color: { argb: PRIMARY_COLOR } };
        uSheet.mergeCells(`A${logStartRow}:E${logStartRow}`);

        const logsHeaders = ['Date', 'Duration (hrs)', 'Activity Type', 'Client / Customer', 'Project', 'Title', 'Description', 'Billable'];
        const logsHeaderRow = logStartRow + 1;
        uSheet.getRow(logsHeaderRow).values = logsHeaders;
        uSheet.getRow(logsHeaderRow).eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 9 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIMARY_COLOR } };
            cell.border = EXCEL_BORDER;
        });

        let logItemRowIdx = logsHeaderRow + 1;
        if (u.rawLogs && u.rawLogs.length > 0) {
            u.rawLogs.forEach(entry => {
                const durHours = parseFloat((entry.duration_minutes / 60).toFixed(2));
                const entryDate = format(new Date(entry.start_time), 'yyyy-MM-dd HH:mm');
                
                uSheet.getRow(logItemRowIdx).values = [
                    entryDate,
                    durHours,
                    entry.activity_type || 'General',
                    entry.customer_name || 'Internal',
                    entry.project_name || 'Internal',
                    entry.title || '',
                    entry.description || '',
                    entry.is_billable ? 'Billable' : 'Non-Billable'
                ];
                
                uSheet.getRow(logItemRowIdx).eachCell((cell, colIdx) => {
                    cell.border = EXCEL_BORDER;
                    cell.alignment = { vertical: 'middle' };
                    
                    if (colIdx === 8) {
                        cell.font = {
                            bold: true,
                            color: { argb: entry.is_billable ? '047857' : '6B7280' }
                        };
                    }
                });
                logItemRowIdx++;
            });
        } else {
            uSheet.getCell(`A${logItemRowIdx}`).value = 'No detailed logs tracked in this period.';
            uSheet.mergeCells(`A${logItemRowIdx}:H${logItemRowIdx}`);
            uSheet.getCell(`A${logItemRowIdx}`).border = EXCEL_BORDER;
            uSheet.getCell(`A${logItemRowIdx}`).alignment = { horizontal: 'center' };
            logItemRowIdx++;
        }

        // Add visual charts if required and available
        if (includeCharts && u.totalHours > 0) {
            try {
                // Compile pie chart data for Activity
                const activityLabels = u.breakdowns.byActivity.map(a => a.type_name);
                const activityData = u.breakdowns.byActivity.map(a => parseFloat((a.total_minutes / 60).toFixed(1)));
                const activityColors = u.breakdowns.byActivity.map(a => a.color || '#3b82f6');

                if (activityLabels.length > 0) {
                    const chartData = {
                        labels: activityLabels,
                        datasets: [{
                            data: activityData,
                            backgroundColor: activityColors
                        }]
                    };
                    
                    const base64Pie = await generatePieChart(chartData, 'Time Allocation by Activity (hrs)');
                    const imgId = workbook.addImage({
                        base64: base64Pie.split(',')[1],
                        extension: 'png'
                    });
                    
                    // Add image to worksheet
                    uSheet.addImage(imgId, {
                        tl: { col: 4.5, row: 14 },
                        ext: { width: 350, height: 180 }
                    });
                }
            } catch (chartErr) {
                console.error(`Failed to add chart for user ${u.name}:`, chartErr);
            }
        }

        // Column auto-sizing for individual sheets
        uSheet.columns.forEach((column, colIdx) => {
            let maxLen = 0;
            column.eachCell({ includeEmpty: true }, (cell, rowIdx) => {
                // Do not factor merged header row (1) or long text comments in row 8-11 in column sizing
                if (rowIdx === 1 || rowIdx === 5 || (colIdx >= 5 && rowIdx >= 8 && rowIdx <= 11)) return;
                const cellVal = cell.value ? String(cell.value) : '';
                if (cellVal.length > maxLen) maxLen = cellVal.length;
            });
            column.width = Math.max(12, Math.min(35, maxLen + 2));
        });
    }

    // Return the generated excel buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

/**
 * Generate Excel Workbook for Goals Module
 * @param {Array} goals - Array of goal records
 * @returns {Promise<Buffer>} Excel file buffer
 */
export async function generateGoalsExcelReport(goals = []) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Subsync Goals Management';
    workbook.lastModifiedBy = 'Subsync';
    workbook.created = new Date();

    const PRIMARY_COLOR = '1E3A8A';
    const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIMARY_COLOR } };
    const EXCEL_BORDER = {
        top: { style: 'thin', color: { argb: 'D1D5DB' } },
        left: { style: 'thin', color: { argb: 'D1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
        right: { style: 'thin', color: { argb: 'D1D5DB' } }
    };

    const sheet = workbook.addWorksheet('Goals Export');
    sheet.views = [{ state: 'frozen', ySplit: 2, showGridLines: true }];

    // Title Header
    sheet.mergeCells('A1:J1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'Goals Management Report';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = HEADER_FILL;
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 35;

    // Table Column Headers
    const headers = [
        'Goal ID', 'Goal Title', 'Category', 'Business Impact',
        'Quarter', 'Financial Year', 'Owner(s)', 'Target Date',
        'Status', 'Progress (%)', 'Priority'
    ];

    sheet.getRow(2).values = headers;
    sheet.getRow(2).height = 25;
    sheet.getRow(2).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
        cell.fill = HEADER_FILL;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = EXCEL_BORDER;
    });

    // Populate Data
    goals.forEach((goal) => {
        const rowValues = [
            goal.goal_id || '',
            goal.title || '',
            goal.category_name || '',
            goal.business_impact_name || '',
            goal.quarter || '',
            goal.financial_year || '',
            goal.owners_text || '',
            goal.target_date ? format(new Date(goal.target_date), 'dd-MMM-yyyy') : '',
            goal.status_name || '',
            goal.progress !== undefined ? `${goal.progress}%` : '0%',
            goal.priority || 'Medium'
        ];

        const row = sheet.addRow(rowValues);
        row.height = 22;
        row.eachCell((cell) => {
            cell.border = EXCEL_BORDER;
            cell.alignment = { vertical: 'middle' };
        });
    });

    // Auto-fit Column Widths
    sheet.columns.forEach((column) => {
        let maxLen = 12;
        column.eachCell({ includeEmpty: true }, (cell, rowIdx) => {
            if (rowIdx === 1) return;
            const cellVal = cell.value ? String(cell.value) : '';
            if (cellVal.length > maxLen) maxLen = cellVal.length;
        });
        column.width = Math.min(40, maxLen + 3);
    });

    return await workbook.xlsx.writeBuffer();
}


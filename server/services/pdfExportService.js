import PDFDocument from 'pdfkit';
import fs from 'fs';
import { generatePieChart } from '../utils/chartGenerator.js';
import { format } from 'date-fns';

/**
 * Generate PDF Report for User Insights
 * @param {string} destPath - Temporary file destination
 * @param {Object} data - { insights: Array, dateRangeText: string, companyName: string, includeCharts: boolean, orientation: string }
 * @returns {Promise<void>} Resolves when file is written
 */
export function generatePdfReport(destPath, { insights, dateRangeText, companyName = 'Subsync Workspace', includeCharts = true, orientation = 'portrait' }) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                layout: orientation,
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                bufferPages: true
            });

            const stream = fs.createWriteStream(destPath);
            doc.pipe(stream);

            // COLOR PALETTE
            const PRIMARY_COLOR = '#1e3a8a'; // Corporate dark blue
            const ACCENT_COLOR = '#3b82f6';  // Light blue
            const TEXT_DARK = '#1f2937';     // Gray-800
            const TEXT_LIGHT = '#6b7280';    // Gray-500
            const BG_LIGHT = '#f3f4f6';      // Gray-100

            // ----------------------------------------------------
            // PAGE 1: COVER PAGE
            // ----------------------------------------------------
            const pageHeight = doc.page.height;
            const pageWidth = doc.page.width;

            // Background Decorative Shapes
            doc.rect(0, 0, 15, pageHeight).fill(PRIMARY_COLOR);
            doc.rect(15, 0, 8, pageHeight).fill(ACCENT_COLOR);

            // Cover Text
            doc.font('Helvetica-Bold')
               .fillColor(PRIMARY_COLOR)
               .fontSize(32)
               .text('User Insights & Activity Analytics', 60, pageHeight * 0.3);

            doc.fontSize(16)
               .fillColor(TEXT_LIGHT)
               .text('Executive Operational Performance Report', 60, pageHeight * 0.38);

            // Divider Accent Line
            doc.moveTo(60, pageHeight * 0.42)
               .lineTo(pageWidth - 60, pageHeight * 0.42)
               .strokeColor(ACCENT_COLOR)
               .lineWidth(2)
               .stroke();

            // Metadata Blocks
            doc.fontSize(11)
               .fillColor(TEXT_DARK)
               .font('Helvetica-Bold').text('Organization:', 60, pageHeight * 0.55)
               .font('Helvetica').text(companyName, 170, pageHeight * 0.55)
               
               .font('Helvetica-Bold').text('Reporting Period:', 60, pageHeight * 0.59)
               .font('Helvetica').text(dateRangeText, 170, pageHeight * 0.59)

               .font('Helvetica-Bold').text('Scope:', 60, pageHeight * 0.63)
               .font('Helvetica').text(`${insights.length} team members compiled`, 170, pageHeight * 0.63)

               .font('Helvetica-Bold').text('Generated At:', 60, pageHeight * 0.67)
               .font('Helvetica').text(format(new Date(), 'yyyy-MM-dd HH:mm:ss'), 170, pageHeight * 0.67);

            doc.fontSize(10)
               .fillColor(TEXT_LIGHT)
               .text('Confidential - Internal Operations Review Only', 60, pageHeight - 60);

            // ----------------------------------------------------
            // PAGE 2: TABLE OF CONTENTS & EXEC SUMMARY
            // ----------------------------------------------------
            doc.addPage();
            
            // Header
            doc.font('Helvetica-Bold').fillColor(PRIMARY_COLOR).fontSize(18).text('Report Outline & Summary', 40, 40);
            doc.moveTo(40, 60).lineTo(pageWidth - 40, 60).strokeColor(BG_LIGHT).lineWidth(1).stroke();

            // TOC
            doc.fontSize(12).fillColor(TEXT_DARK).text('Table of Contents', 40, 80);
            doc.font('Helvetica').fontSize(10);
            
            let tocY = 105;
            doc.text('1. Executive Summary ............................................................................................', 50, tocY);
            doc.text('Page 2', pageWidth - 80, tocY);
            tocY += 20;

            doc.text('2. Individual User Playbooks ...................................................................................', 50, tocY);
            doc.text('Page 3+', pageWidth - 80, tocY);
            tocY += 25;

            // Executive Summary Content
            const totalHours = insights.reduce((sum, u) => sum + u.totalHours, 0);
            const totalBillable = insights.reduce((sum, u) => sum + u.billableHours, 0);
            const avgBillablePercent = totalHours > 0 ? Math.round((totalBillable / totalHours) * 100) : 0;
            const avgPerformanceScore = Math.round(insights.reduce((sum, u) => sum + u.performanceScore, 0) / (insights.length || 1));

            doc.font('Helvetica-Bold').fontSize(12).fillColor(TEXT_DARK).text('Executive Performance Summary', 40, 200);
            
            // KPI Grid
            const gridWidth = (pageWidth - 100) / 4;
            const kpis = [
                { label: 'Total Members', val: insights.length },
                { label: 'Cumulative Time', val: `${totalHours.toFixed(1)} hrs` },
                { label: 'Utilization Rate', val: `${avgBillablePercent}%` },
                { label: 'Avg Performance', val: `${avgPerformanceScore}/100` }
            ];

            kpis.forEach((kpi, idx) => {
                const kpiX = 40 + idx * (gridWidth + 10);
                doc.rect(kpiX, 230, gridWidth, 60).fillAndStroke(BG_LIGHT, '#e5e7eb');
                doc.font('Helvetica-Bold').fontSize(12).fillColor(PRIMARY_COLOR).text(kpi.val, kpiX + 10, 242, { width: gridWidth - 20, align: 'center' });
                doc.font('Helvetica').fontSize(8).fillColor(TEXT_LIGHT).text(kpi.label, kpiX + 10, 265, { width: gridWidth - 20, align: 'center' });
            });

            // Summary Text
            doc.fontSize(10).fillColor(TEXT_DARK).text('Operations Narrative:', 40, 315, { bold: true });
            doc.font('Helvetica').text(
                `This report details time tracking logs and operational insights for the active period. The team logged a cumulative total of ${totalHours.toFixed(1)} hours, achieving an average billable utilization of ${avgBillablePercent}%. Standardized KPI scores reflect high levels of focus with consistent daily logging records.`,
                40, 335, { width: pageWidth - 80, align: 'justify', lineGap: 3 }
            );

            // ----------------------------------------------------
            // INDIVIDUAL USER SECTIONS (Starts on Page 3)
            // ----------------------------------------------------
            for (const u of insights) {
                doc.addPage();

                // Page Title Header
                doc.font('Helvetica-Bold').fillColor(PRIMARY_COLOR).fontSize(16).text(u.name, 40, 45);
                doc.font('Helvetica').fontSize(10).fillColor(TEXT_LIGHT).text(`${u.role}  |  Department: ${u.department}`, 40, 63);
                doc.moveTo(40, 80).lineTo(doc.page.width - 40, 80).strokeColor(ACCENT_COLOR).lineWidth(1.5).stroke();

                // Key metrics row
                const userKPIs = [
                    { label: 'Hours Tracked', val: `${u.totalHours}h` },
                    { label: 'Utilization', val: `${u.billablePercent}%` },
                    { label: 'Performance', val: `${u.performanceScore}/100` },
                    { label: 'Sentiment', val: u.sentiment }
                ];
                const uGridWidth = (doc.page.width - 100) / 4;
                userKPIs.forEach((kpi, idx) => {
                    const kX = 40 + idx * (uGridWidth + 10);
                    doc.rect(kX, 95, uGridWidth, 45).fillAndStroke(BG_LIGHT, '#e5e7eb');
                    doc.font('Helvetica-Bold').fontSize(11).fillColor(TEXT_DARK).text(kpi.val, kX + 5, 105, { width: uGridWidth - 10, align: 'center' });
                    doc.font('Helvetica').fontSize(7.5).fillColor(TEXT_LIGHT).text(kpi.label, kX + 5, 122, { width: uGridWidth - 10, align: 'center' });
                });

                // Two columns: Left for insights, Right for chart
                const leftWidth = 270;
                const rightWidth = doc.page.width - 110 - leftWidth;

                // Qualitative Insights (Left)
                doc.font('Helvetica-Bold').fontSize(10).fillColor(PRIMARY_COLOR).text('QUALITATIVE INSIGHTS & ANALYSIS', 40, 160);
                
                let curY = 180;
                doc.fontSize(8.5).fillColor(TEXT_DARK);
                
                // Achievements Checklist
                doc.font('Helvetica-Bold').text('Achievements:', 40, curY);
                doc.font('Helvetica');
                u.achievements.forEach(ach => {
                    curY += 13;
                    doc.text(`* ${ach}`, 45, curY, { width: leftWidth - 10 });
                });
                
                curY += 20;
                // Areas of Improvement
                doc.font('Helvetica-Bold').text('Areas of Improvement:', 40, curY);
                doc.font('Helvetica');
                u.improvements.forEach(imp => {
                    curY += 13;
                    doc.text(`* ${imp}`, 45, curY, { width: leftWidth - 10 });
                });

                curY += 20;
                // Recommendations
                doc.font('Helvetica-Bold').text('Recommendations & Actions:', 40, curY);
                doc.font('Helvetica');
                u.recommendations.forEach(rec => {
                    curY += 13;
                    doc.text(`- ${rec}`, 45, curY, { width: leftWidth - 10 });
                });

                // Activity Chart (Right)
                if (includeCharts && u.totalHours > 0) {
                    try {
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

                            const base64Pie = await generatePieChart(chartData, 'Time Distribution by Activity (hrs)');
                            const chartBuffer = Buffer.from(base64Pie.split(',')[1], 'base64');
                            doc.image(chartBuffer, doc.page.width - rightWidth - 40, 160, { width: rightWidth, height: 160 });
                        }
                    } catch (chartErr) {
                        console.error('Failed to embed chart in PDF:', chartErr);
                    }
                }

                // Project Breakdown Table at the bottom
                const tableY = 385;
                doc.font('Helvetica-Bold').fontSize(10).fillColor(PRIMARY_COLOR).text('PROJECT DELIVERABLES SUMMARY', 40, tableY);

                // Table Headers
                const tHeaderY = tableY + 20;
                doc.rect(40, tHeaderY, doc.page.width - 80, 18).fill(PRIMARY_COLOR);
                doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#FFFFFF');
                doc.text('Project Name', 50, tHeaderY + 5, { width: 150 });
                doc.text('Client/Customer', 210, tHeaderY + 5, { width: 120 });
                doc.text('Total Time (hrs)', 340, tHeaderY + 5, { width: 80, align: 'right' });
                doc.text('Billable Time (hrs)', 430, tHeaderY + 5, { width: 80, align: 'right' });

                let trY = tHeaderY + 18;
                doc.font('Helvetica').fontSize(8).fillColor(TEXT_DARK);
                
                if (u.breakdowns.byProject.length > 0) {
                    u.breakdowns.byProject.forEach((p, idx) => {
                        if (idx % 2 === 1) {
                            doc.rect(40, trY, doc.page.width - 80, 16).fill(BG_LIGHT);
                        }
                        doc.fillColor(TEXT_DARK);
                        doc.text(p.project_name, 50, trY + 4, { width: 150 });
                        doc.text(p.customer_name || 'Internal', 210, trY + 4, { width: 120 });
                        doc.text(parseFloat((p.total_minutes / 60).toFixed(1)).toString(), 340, trY + 4, { width: 80, align: 'right' });
                        doc.text(parseFloat((p.billable_minutes / 60).toFixed(1)).toString(), 430, trY + 4, { width: 80, align: 'right' });
                        trY += 16;
                    });
                } else {
                    doc.rect(40, trY, doc.page.width - 80, 16).fill(BG_LIGHT);
                    doc.text('No time entries registered in the active period.', 50, trY + 4, { width: doc.page.width - 100, align: 'center' });
                    trY += 16;
                }

                // Detailed Time Logs Section (Starts on a new page)
                doc.addPage();
                doc.font('Helvetica-Bold').fillColor(PRIMARY_COLOR).fontSize(13).text(`Detailed Time Logs - ${u.name}`, 40, 40);
                doc.moveTo(40, 55).lineTo(doc.page.width - 40, 55).strokeColor(ACCENT_COLOR).lineWidth(1.5).stroke();

                // Table Headers
                let lHeaderY = 70;
                const drawLogsTableHeader = (y) => {
                    doc.rect(40, y, doc.page.width - 80, 18).fill(PRIMARY_COLOR);
                    doc.font('Helvetica-Bold').fontSize(8).fillColor('#FFFFFF');
                    doc.text('Date', 50, y + 5, { width: 85 });
                    doc.text('Activity', 140, y + 5, { width: 70 });
                    doc.text('Client & Project', 215, y + 5, { width: 120 });
                    doc.text('Description', 340, y + 5, { width: 140 });
                    doc.text('Hours', 485, y + 5, { width: 40, align: 'right' });
                    doc.text('Billing', 530, y + 5, { width: 30, align: 'right' });
                };

                drawLogsTableHeader(lHeaderY);
                
                let curLogY = lHeaderY + 18;
                doc.font('Helvetica').fontSize(7.5).fillColor(TEXT_DARK);

                if (u.rawLogs && u.rawLogs.length > 0) {
                    u.rawLogs.forEach((entry, idx) => {
                        if (curLogY > doc.page.height - 70) {
                            doc.addPage();
                            doc.font('Helvetica-Bold').fillColor(PRIMARY_COLOR).fontSize(9).text(`Detailed Time Logs - ${u.name} (Continued)`, 40, 45);
                            doc.moveTo(40, 60).lineTo(doc.page.width - 40, 60).strokeColor(ACCENT_COLOR).lineWidth(1).stroke();
                            
                            lHeaderY = 70;
                            drawLogsTableHeader(lHeaderY);
                            curLogY = lHeaderY + 18;
                            doc.font('Helvetica').fontSize(7.5).fillColor(TEXT_DARK);
                        }

                        if (idx % 2 === 1) {
                            doc.rect(40, curLogY, doc.page.width - 80, 20).fill(BG_LIGHT);
                        }

                        const descText = entry.description ? entry.description.replace(/\n/g, ' ') : (entry.title || '');
                        const truncatedDesc = descText.length > 55 ? descText.substring(0, 52) + '...' : descText;
                        const clientProjText = `${entry.customer_name || 'Internal'} - ${entry.project_name || 'Internal'}`;
                        const entryDate = format(new Date(entry.start_time), 'yyyy-MM-dd HH:mm');
                        const durHours = parseFloat((entry.duration_minutes / 60).toFixed(2));

                        doc.fillColor(TEXT_DARK);
                        doc.text(entryDate, 50, curLogY + 6, { width: 85 });
                        doc.text(entry.activity_type || 'General', 140, curLogY + 6, { width: 70 });
                        doc.text(clientProjText, 215, curLogY + 6, { width: 120, ellipsis: true });
                        doc.text(truncatedDesc, 340, curLogY + 6, { width: 140, ellipsis: true });
                        doc.text(durHours.toString(), 485, curLogY + 6, { width: 40, align: 'right' });
                        doc.text(entry.is_billable ? 'Bill' : 'Int', 530, curLogY + 6, { width: 30, align: 'right' });
                        
                        curLogY += 20;
                    });
                } else {
                    doc.rect(40, curLogY, doc.page.width - 80, 20).fill(BG_LIGHT);
                    doc.text('No detailed logs tracked in this period.', 50, curLogY + 6, { width: doc.page.width - 100, align: 'center' });
                    curLogY += 20;
                }
            }

            // ----------------------------------------------------
            // APPENDIX
            // ----------------------------------------------------
            doc.addPage();
            doc.font('Helvetica-Bold').fillColor(PRIMARY_COLOR).fontSize(14).text('Final Appendix', 40, 40);
            doc.moveTo(40, 55).lineTo(pageWidth - 40, 55).strokeColor(BG_LIGHT).lineWidth(1).stroke();

            doc.font('Helvetica-Bold').fontSize(10).fillColor(TEXT_DARK).text('Glossary & Definitions:', 40, 80);
            doc.font('Helvetica').fontSize(9).fillColor(TEXT_DARK);
            doc.text('- Utilization Rate: Percentage of total tracked hours allocated to client-billable projects.', 50, 100);
            doc.text('- Performance Score: A metric computed by weighting billability index (60%) and logging consistency (40%).', 50, 120);
            doc.text('- Sentiment Trend: Behavioral classification warning of burnout risk or signaling healthy work balance.', 50, 140);

            doc.font('Helvetica-Bold').fontSize(10).text('Export Metadata:', 40, 180);
            doc.font('Helvetica').fontSize(9);
            doc.text(`- Generation System: Subsync reporting engine v2.2.0`, 50, 200);
            doc.text(`- Document Class: PDFKit Document Instance`, 50, 215);
            doc.text(`- Output Filename: ${destPath.split(/[\\/]/).pop()}`, 50, 230);

            // Add page numbers in footer
            const range = doc.bufferedPageRange();
            for (let i = 0; i < range.count; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).fillColor(TEXT_LIGHT).text(
                    `Page ${i + 1} of ${range.count}`,
                    doc.page.width - 80, doc.page.height - 30,
                    { align: 'right' }
                );
                doc.text(
                    'Online Consultancy Services Reporting Module',
                    40, doc.page.height - 30,
                    { align: 'left' }
                );
            }

            doc.end();
            resolve();
        } catch (err) {
            console.error('PDF generation error:', err);
            reject(err);
        }
    });
}

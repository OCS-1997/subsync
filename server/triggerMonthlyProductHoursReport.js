import dotenv from 'dotenv';
import { sendMonthlyProductHoursReports } from './services/monthlyProductHoursReportService.js';

// Load environment variables
dotenv.config();

/**
 * Manually trigger monthly productive hours report:
 * - Individual monthly report of respective users about their time to them
 * - Consolidated overall monthly report to admins
 * 
 * By default, targets the PREVIOUS month (e.g., triggered on Nov 1 -> reports for October).
 * 
 * Usage:
 *   node triggerMonthlyProductHoursReport.js
 *   node triggerMonthlyProductHoursReport.js 2026-11-01
 *   node triggerMonthlyProductHoursReport.js 2026-10-15 --current-month
 */
async function trigger() {
    console.log('--- Manual Trigger: Consolidated Monthly Productive Hours Report ---');
    
    const args = process.argv.slice(2);
    const targetCurrentMonth = args.includes('--current-month') || args.includes('--exact');
    const customDateArg = args.find(a => !a.startsWith('--'));
    const referenceDate = customDateArg ? new Date(customDateArg) : new Date();

    if (isNaN(referenceDate.getTime())) {
        console.error(`Invalid date parameter provided: "${customDateArg}". Expected format YYYY-MM-DD.`);
        process.exit(1);
    }

    const targetPreviousMonth = !targetCurrentMonth;
    console.log(`Trigger Reference date: ${referenceDate.toISOString()}`);
    console.log(`Targeting mode: ${targetPreviousMonth ? 'PREVIOUS COMPLETED MONTH' : 'CURRENT MONTH'}`);

    try {
        const result = await sendMonthlyProductHoursReports(referenceDate, { targetPreviousMonth });
        console.log(`Successfully completed triggering monthly product hours report for: ${result.targetMonth}`);
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Failed to trigger monthly product hours report:', error);
        process.exit(1);
    }
}

trigger();


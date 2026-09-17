import dotenv from 'dotenv';
import { sendMonthlyProductHoursReports } from './services/monthlyProductHoursReportService.js';

// Load environment variables
dotenv.config();

/**
 * Manually trigger monthly productive hours report:
 * - Individual monthly report of respective users about their time to them
 * - Consolidated overall monthly report to admins
 * 
 * Usage:
 *   node triggerMonthlyProductHoursReport.js
 *   node triggerMonthlyProductHoursReport.js 2026-07-04
 */
async function trigger() {
    console.log('--- Manual Trigger: Consolidated Monthly Productive Hours Report ---');
    
    // Allow optional custom date argument: node triggerMonthlyProductHoursReport.js 2026-07-04
    const customDateArg = process.argv[2];
    const referenceDate = customDateArg ? new Date(customDateArg) : new Date();

    if (isNaN(referenceDate.getTime())) {
        console.error(`Invalid date parameter provided: "${customDateArg}". Expected format YYYY-MM-DD.`);
        process.exit(1);
    }

    console.log(`Using reference date: ${referenceDate.toISOString()}`);

    try {
        const result = await sendMonthlyProductHoursReports(referenceDate);
        console.log('Successfully completed triggering monthly product hours report:');
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Failed to trigger monthly product hours report:', error);
        process.exit(1);
    }
}

trigger();

import dotenv from 'dotenv';
import { sendWeeklyProductHoursReportEmail } from './services/weeklyProductHoursReportService.js';

// Load environment variables
dotenv.config();

/**
 * Manually trigger consolidated weekly & monthly product hours report email to all team members.
 * 
 * Usage:
 *   node triggerWeeklyProductHoursReport.js
 *   node triggerWeeklyProductHoursReport.js 2026-07-04
 */
async function trigger() {
    console.log('--- Manual Trigger: Consolidated Weekly & Month Product Hours Report to Team Members ---');
    
    // Allow optional custom date argument from CLI: node triggerWeeklyProductHoursReport.js 2026-07-04
    const customDateArg = process.argv[2];
    const referenceDate = customDateArg ? new Date(customDateArg) : new Date();

    if (isNaN(referenceDate.getTime())) {
        console.error(`Invalid date parameter provided: "${customDateArg}". Expected format YYYY-MM-DD.`);
        process.exit(1);
    }

    console.log(`Using reference date: ${referenceDate.toISOString()}`);

    try {
        const result = await sendWeeklyProductHoursReportEmail(referenceDate);
        console.log('Successfully completed triggering weekly product hours report:');
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Failed to trigger weekly product hours report:', error);
        process.exit(1);
    }
}

trigger();

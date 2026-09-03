import dotenv from 'dotenv';
import { sendWeeklyTaskReportEmail } from './services/weeklyTaskReportService.js';

// Load environment variables
dotenv.config();

/**
 * Manually trigger consolidated weekly tasks report email for testing/manual runs.
 * 
 * Usage: node triggerWeeklyTaskReport.js
 */
async function trigger() {
    console.log('--- Manual Trigger: Consolidated Weekly Tasks Report (Mon - Sat) ---');
    try {
        const result = await sendWeeklyTaskReportEmail(new Date());
        console.log('Successfully completed triggering weekly task report:', result);
        process.exit(0);
    } catch (error) {
        console.error('Failed to trigger weekly task report:', error);
        process.exit(1);
    }
}

trigger();

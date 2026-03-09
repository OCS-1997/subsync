
import dotenv from 'dotenv';
import { sendDailyTimeTrackingReports } from './services/timeTrackingReportService.js';

// Load environment variables
dotenv.config();

/**
 * Manually trigger daily time tracking reports for the PREVIOUS day.
 * 
 * Usage: node triggerDailyReports.js
 */
async function trigger() {
    console.log('--- Manual Trigger: Daily Time Tracking Reports ---');
    try {
        // By default, passing 'new Date()' (Today) will generate reports for Yesterday.
        const today = new Date();
        console.log(`Triggering reports for: ${new Date(today.getTime() - 86400000).toDateString()}`);
        
        await sendDailyTimeTrackingReports(today);
        
        console.log('Successfully completed triggering reports.');
        process.exit(0);
    } catch (error) {
        console.error('Failed to trigger reports:', error);
        process.exit(1);
    }
}

trigger();

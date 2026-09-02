import dotenv from 'dotenv';
import { sendDailyTaskDigestEmails } from './services/taskDigestService.js';

// Load environment variables
dotenv.config();

/**
 * Manually trigger daily task digest emails for testing.
 * 
 * Usage: node triggerDailyTaskDigest.js
 */
async function trigger() {
    console.log('--- Manual Trigger: Daily Task Digest Emails ---');
    try {
        const result = await sendDailyTaskDigestEmails(new Date());
        console.log('Successfully completed triggering task digest emails:', result);
        process.exit(0);
    } catch (error) {
        console.error('Failed to trigger task digest emails:', error);
        process.exit(1);
    }
}

trigger();

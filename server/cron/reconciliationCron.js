import cron from 'node-cron';
import { reconciliationCron } from '../services/reminderService.js';
import { archiveOldSubscriptions } from '../services/reminderService.js';
import { sendTodayBirthdayEmails } from '../services/birthdayService.js';
import { sendDailyDcrReportEmail } from '../services/dcrService.js';

const ARCHIVAL_DELAY_DAYS = parseInt(process.env.ARCHIVAL_DELAY_DAYS || '30', 10);

/**
 * Setup reconciliation cron job
 * Runs daily at 01:00 UTC (06:30 IST)
 */
export function setupReconciliationCron() {
    // Run at 01:00 UTC daily (06:30 IST)
    cron.schedule('0 1 * * *', async () => {
        console.log('Running reconciliation cron job...');
        try {
            const result = await reconciliationCron();
            console.log(JSON.stringify({
                event: 'reconciliation_completed',
                checked: result.checked,
                enqueued: result.enqueued,
                timestamp: new Date().toISOString(),
            }));
        } catch (error) {
            console.error('Error in reconciliation cron:', error);
        }
    }, {
        timezone: 'UTC',
    });

    console.log('Reconciliation cron scheduled for 01:00 UTC daily');
}

/**
 * Setup archival cron job
 * Runs daily at 02:00 UTC (07:30 IST)
 */
export function setupArchivalCron() {
    // Run at 02:00 UTC daily (07:30 IST)
    cron.schedule('0 2 * * *', async () => {
        console.log('Running archival cron job...');
        try {
            const result = await archiveOldSubscriptions(ARCHIVAL_DELAY_DAYS);
            console.log(JSON.stringify({
                event: 'archival_completed',
                archived: result.archived,
                timestamp: new Date().toISOString(),
            }));
        } catch (error) {
            console.error('Error in archival cron:', error);
        }
    }, {
        timezone: 'UTC',
    });

    console.log(`Archival cron scheduled for 02:00 UTC daily (archives subscriptions older than ${ARCHIVAL_DELAY_DAYS} days)`);
}

/**
 * Setup birthday email cron job
 * Runs daily at 09:00 UTC (14:30 IST) to send birthday wishes
 */
export function setupBirthdayCron() {
    // Run at 09:00 UTC daily (14:30 IST)
    cron.schedule('0 9 * * *', async () => {
        console.log('Running birthday email cron job...');
        try {
            const result = await sendTodayBirthdayEmails();
            console.log(JSON.stringify({
                event: 'birthday_emails_sent',
                sent: result.sent,
                failed: result.failed,
                timestamp: new Date().toISOString(),
            }));
            if (result.errors.length > 0) {
                console.error('Birthday email errors:', result.errors);
            }
        } catch (error) {
            console.error('Error in birthday cron:', error);
        }
    }, {
        timezone: 'UTC',
    });

    console.log('Birthday email cron scheduled for 09:00 UTC daily');
}

/**
 * Setup DCR daily email report cron job
 * Runs daily at 13:00 UTC (18:30 IST)
 */
export function setupDcrReportCron() {
    // Run at 13:00 UTC daily (18:30 IST)
    cron.schedule('0 13 * * *', async () => {
        console.log('Running DCR daily report cron job...');
        try {
            const result = await sendDailyDcrReportEmail();
            console.log(JSON.stringify({
                event: 'dcr_daily_report_sent',
                success: result.success,
                error: result.error,
                timestamp: new Date().toISOString(),
            }));
            if (!result.success) {
                console.error('DCR report error:', result.error);
            }
        } catch (error) {
            console.error('Error in DCR report cron:', error);
        }
    }, {
        timezone: 'UTC',
    });

    console.log('DCR daily report cron scheduled for 13:00 UTC daily (18:30 IST)');
}

/**
 * Setup all cron jobs
 */
export function setupCronJobs() {
    setupReconciliationCron();
    setupArchivalCron();
    setupBirthdayCron();
    setupDcrReportCron();
}


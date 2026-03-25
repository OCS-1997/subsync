import appraisalModel from "../models/appraisalModel.js";
import appDB from "../db/subsyncDB.js";
import { sendEmail, renderEmailTemplate } from "./emailService.js";

/**
 * Sends reminders to users who haven't submitted their appraisals for the active period.
 */
export async function sendAppraisalReminders() {
    try {
        const activePeriod = await appraisalModel.getActivePeriod();
        if (!activePeriod) return { success: true, sent: 0, message: "No active appraisal period." };

        const endDate = new Date(activePeriod.end_date);
        const now = new Date();
        const daysToDeadline = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

        // Only remind on specific days: 15, 7, 3, 1 day(s) before deadline
        const reminderDays = [15, 7, 3, 1];
        if (!reminderDays.includes(daysToDeadline)) {
            return { success: true, sent: 0, message: `No reminder scheduled for ${daysToDeadline} days before deadline.` };
        }

        // Get all active users
        const [users] = await appDB.query("SELECT username, email, name FROM users WHERE is_active = 1");
        
        // Get all submissions for this period
        const submissions = await appraisalModel.getAppraisalsByPeriod(activePeriod.id);
        const submittedUsernames = new Set(submissions.filter(s => s.status !== 'Draft').map(s => s.username));

        let sentCount = 0;
        for (const user of users) {
            if (!submittedUsernames.has(user.username)) {
                // Here we would call an email service or notification system
                // console.log(`Sending appraisal reminder to ${user.username} (${user.email})`);
                
                /*
                await sendEmail({
                    to: user.email,
                    subject: `Action Required: Quarterly Self-Appraisal (${activePeriod.quarter} ${activePeriod.year})`,
                    text: `Dear ${user.name},\n\nThis is a reminder to submit your self-appraisal for ${activePeriod.quarter} ${activePeriod.year}. The deadline is ${activePeriod.end_date}.\n\nPlease login to the SubSync portal to complete it.\n\nBest regards,\nManagement`
                });
                */
                sentCount++;
            }
        }

        return { success: true, sent: sentCount, period: `${activePeriod.quarter} ${activePeriod.year}` };
    } catch (error) {
        console.error("Error sending appraisal reminders:", error);
        throw error;
    }
}

/**
 * Triggers activation emails to all active users when an appraisal period is activated.
 * @param {number} periodId 
 */
export async function triggerAppraisalActivationEmails(periodId) {
    try {
        const periods = await appraisalModel.getPeriods();
        const period = periods.find(p => p.id == periodId);
        
        if (!period) {
            console.error(`[APPRAISAL] Period with ID ${periodId} not found for email notification.`);
            return;
        }

        const [users] = await appDB.query("SELECT username, name, email FROM users WHERE is_active = 1 AND email IS NOT NULL AND email != ''");
        
        console.log(`[APPRAISAL] Found ${users.length} active users to notify for period ${period.quarter} ${period.year}.`);

        const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
        const currentYear = new Date().getFullYear();

        for (const user of users) {
            try {
                const appraisalLink = `${baseUrl}/${user.username}/dashboard/appraisals`;
                const { subject, html } = await renderEmailTemplate('appraisal_activated', {
                    name: user.name,
                    quarter: period.quarter,
                    year: period.year,
                    start_date: new Date(period.start_date).toLocaleDateString(),
                    end_date: new Date(period.end_date).toLocaleDateString(),
                    appraisal_link: appraisalLink,
                    current_year: currentYear
                });

                await sendEmail({
                    to: user.email,
                    subject: subject,
                    html: html
                });
                
                // console.log(`[APPRAISAL] Activation email sent to ${user.email}`);
            } catch (err) {
                console.error(`[APPRAISAL] Failed to send activation email to ${user.email}:`, err.message);
            }
        }
    } catch (error) {
        console.error("[APPRAISAL] Error in triggerAppraisalActivationEmails:", error);
    }
}

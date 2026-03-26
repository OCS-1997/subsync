import appraisalModel from "../models/appraisalModel.js";
import appDB from "../db/subsyncDB.js";
import { sendEmail, renderEmailTemplate } from "./emailService.js";
import { getTimeEntriesSummary } from "../models/timeTrackingModel.js";
import { getAllHolidays } from "../models/leaveModel.js";
import { calculateWorkingDays } from "../utils/leaveUtils.js";

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
        
        //console.log(`[APPRAISAL] Found ${users.length} active users to notify for period ${period.quarter} ${period.year}.`);

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

/**
 * Calculates working days, days present and effective hours for a user in a given date range.
 * @param {string} username 
 * @param {string} startDate 
 * @param {string} endDate 
 * @param {string} quarter
 * @param {number} year
 */
export async function calculateUserAppraisalStats(username, startDate, endDate, quarter, year) {
    try {
        // Derive standard quarter boundaries if available
        let calcStart = startDate;
        let calcEnd = endDate;

        if (quarter && year) {
            const mappedQuarter = quarter.toString().toUpperCase();
            if (mappedQuarter === 'Q1') { calcStart = `${year}-01-01`; calcEnd = `${year}-03-31`; }
            else if (mappedQuarter === 'Q2') { calcStart = `${year}-04-01`; calcEnd = `${year}-06-30`; }
            else if (mappedQuarter === 'Q3') { calcStart = `${year}-07-01`; calcEnd = `${year}-09-30`; }
            else if (mappedQuarter === 'Q4') { calcStart = `${year}-10-01`; calcEnd = `${year}-12-31`; }
        }

        // Parse to robust local dates for year detection and clamping
        const parseLocal = (d) => {
            if (d instanceof Date) return d;
            if (typeof d === 'string' && d.includes('-') && !d.includes('T')) {
                const parts = d.split('-').map(Number);
                if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]);
            }
            return new Date(d);
        };

        const start = parseLocal(calcStart);
        const end = parseLocal(calcEnd);
        
        // 1. Working Days (Excluding Sundays and Holidays)
        const holidays = await getAllHolidays(start.getFullYear());
        const holidayDates = holidays.map(h => {
            const d = new Date(h.holiday_date);
            // Construct local date string YYYY-MM-DD to avoid timezone shift
            return d.getFullYear() + '-' + 
                String(d.getMonth() + 1).padStart(2, '0') + '-' + 
                String(d.getDate()).padStart(2, '0');
        });
        
        const workingDays = calculateWorkingDays(calcStart, calcEnd, holidayDates);

        // 2. Days Present (Working Days - Approved Leaves)
        const [leaves] = await appDB.query(
            `SELECT * FROM leave_requests 
             WHERE user_id = ? AND status = 'approved' 
             AND (
                (start_date BETWEEN ? AND ?) OR 
                (end_date BETWEEN ? AND ?) OR 
                (start_date <= ? AND end_date >= ?)
             )`,
            [username, calcStart, calcEnd, calcStart, calcEnd, calcStart, calcEnd]
        );
        
        let totalLeaveDays = 0;
        for (const leave of leaves) {
            // Only count working days of the leave that fall WITHIN the derived quarter period
            const leaveStart = new Date(Math.max(new Date(leave.start_date), start));
            const leaveEnd = new Date(Math.min(new Date(leave.end_date), end));
            
            const daysInRange = calculateWorkingDays(leaveStart, leaveEnd, holidayDates);
            
            // Handle half-days if the half-day falls within the range
            if (leave.half_day_type && leave.half_day_type !== 'none') {
                if (new Date(leave.start_date).toDateString() === new Date(leave.end_date).toDateString()) {
                    totalLeaveDays += 0.5;
                } else {
                    totalLeaveDays += (daysInRange - 0.5);
                }
            } else {
                totalLeaveDays += daysInRange;
            }
        }

        const daysPresent = Math.max(0, workingDays - totalLeaveDays);

        // 3. Effective Hours (from Time Tracking)
        const timeSummary = await getTimeEntriesSummary({
            userId: username,
            startDate: calcStart,
            endDate: calcEnd
        });
        
        const totalMinutes = timeSummary?.total_minutes || 0;
        const effectiveHours = Math.round((totalMinutes / 60) * 10) / 10;

        return {
            working_days: workingDays,
            days_present: daysPresent,
            effective_hours: effectiveHours
        };
    } catch (error) {
        console.error("Error calculating appraisal stats:", error);
        return { working_days: 0, days_present: 0, effective_hours: 0 };
    }
}

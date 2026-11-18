import { sendEmail } from './emailService.js';
import appDB from '../db/subsyncDB.js';
import { getLeaveRequestById, getLeaveTypeById } from '../models/leaveModel.js';
import { getUserByUsername } from '../models/userModel.js';
import { format } from 'date-fns';

const getAppBaseUrl = () => {
    if (process.env.APP_BASE_URL && !process.env.APP_BASE_URL.includes(':3000')) {
        return process.env.APP_BASE_URL.replace(/\/$/, '');
    }
    const clientPort = process.env.CLIENT_PORT || 5173;
    return `http://localhost:${clientPort}`;
};

/**
 * Format a date safely for email displays
 */
const formatDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    try {
        const d = (dateVal instanceof Date) ? dateVal : new Date(dateVal);
        return format(d, 'dd MMM yyyy');
    } catch {
        return String(dateVal);
    }
};

/**
 * Get Admin emails configured in the environment for leave approval notices.
 * Restricted strictly to ADMIN_EMAILS configured in the .env file.
 */
const getApproverEmails = async () => {
    try {
        if (process.env.ADMIN_EMAILS) {
            const cleanAdminEmails = process.env.ADMIN_EMAILS.split('#')[0].trim();
            const emails = cleanAdminEmails
                .split(',')
                .map(e => e.trim())
                .filter(Boolean);
            if (emails.length > 0) {
                return [...new Set(emails)];
            }
        }
        return [];
    } catch (err) {
        console.error("Error parsing ADMIN_EMAILS for approvers:", err);
        return [];
    }
};

/**
 * Helper to build the duration & deduction breakdown HTML block
 */
const renderDurationBreakdownHtml = (details, fallbackDuration, halfDayType, dateRangeText) => {
    const totalDays = details?.totalCalendarDays || Math.max(1, Math.round(fallbackDuration));
    const sundays = details?.sundaysCount || 0;
    const holidays = details?.holidaysCount || 0;
    const holidayList = details?.excludedHolidays || [];
    const netDeducted = details?.workingDays ?? fallbackDuration;

    return `
        <!-- Leave Duration & Deduction Breakdown Card -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
            <div style="margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                <span style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
                    Leave Duration &amp; Balance Deduction Breakdown
                </span>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #334155;">
                <tr>
                    <td style="padding: 5px 0; color: #64748b;">Total Calendar Days in Span:</td>
                    <td style="padding: 5px 0; text-align: right; font-weight: 600; color: #1e293b;">
                        ${totalDays} ${totalDays === 1 ? 'Day' : 'Days'}
                    </td>
                </tr>
                <tr>
                    <td style="padding: 5px 0; color: #64748b;">Sundays (0 days deducted):</td>
                    <td style="padding: 5px 0; text-align: right; font-weight: 700; color: ${sundays > 0 ? '#059669' : '#64748b'};">
                        ${sundays > 0 ? `-${sundays} ${sundays === 1 ? 'Sunday' : 'Sundays'} (Exempt)` : '0 Sundays'}
                    </td>
                </tr>
                <tr>
                    <td style="padding: 5px 0; color: #64748b;">Public Holidays (0 days deducted):</td>
                    <td style="padding: 5px 0; text-align: right; font-weight: 700; color: ${holidays > 0 ? '#059669' : '#64748b'};">
                        ${holidays > 0 ? `-${holidays} ${holidays === 1 ? 'Holiday' : 'Holidays'} (Exempt)` : '0 Holidays'}
                    </td>
                </tr>
                ${holidayList.length > 0 ? `
                <tr>
                    <td colspan="2" style="padding: 6px 0;">
                        <div style="background-color: #ffffff; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 8px 12px; font-size: 11px; color: #475569;">
                            <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">Exempt Public Holidays:</div>
                            ${holidayList.map(h => `<div style="margin-top: 2px;">&bull; <strong>${h.name}</strong> (${formatDate(h.date)}) &mdash; <span style="color: #059669; font-weight: 600;">0 days deducted</span></div>`).join('')}
                        </div>
                    </td>
                </tr>
                ` : ''}
                ${halfDayType && halfDayType !== 'none' ? `
                <tr>
                    <td style="padding: 5px 0; color: #64748b;">Half-Day Session Adjustment:</td>
                    <td style="padding: 5px 0; text-align: right; font-weight: 600; color: #2563eb;">-0.5 Day (${halfDayType === 'first_half' ? 'First Half' : 'Second Half'})</td>
                </tr>
                ` : ''}
                <tr style="border-top: 2px solid #cbd5e1;">
                    <td style="padding: 10px 0 2px 0; font-weight: 800; color: #0f172a; font-size: 13px;">
                        Net Deducted from Leave Balance:
                    </td>
                    <td style="padding: 10px 0 2px 0; text-align: right; font-weight: 900; color: #059669; font-size: 16px;">
                        ${netDeducted} ${netDeducted === 1 ? 'Working Day' : 'Working Days'}
                    </td>
                </tr>
            </table>

            <div style="margin-top: 10px; font-size: 11px; color: #64748b; line-height: 1.4; border-top: 1px dotted #e2e8f0; padding-top: 6px;">
                &#10003; <strong>Policy Confirmation:</strong> Only working days are deducted. Sundays and gazetted public holidays are never deducted from your leave quota.
            </div>
        </div>
    `;
};

/**
 * Send notification when a leave request is submitted:
 * 1. Email to Admin(s) with details and direct approval link
 * 2. Acknowledgement email to the applicant
 */
export async function sendLeaveApplicationNotice({
    requestId,
    userId,
    leaveTypeId,
    startDate,
    endDate,
    duration,
    halfDayType,
    reason,
    durationDetails
}) {
    try {
        const applicant = await getUserByUsername(userId);
        const leaveType = await getLeaveTypeById(leaveTypeId).catch(() => null);
        const leaveTypeName = leaveType?.name || 'Leave';
        const applicantName = applicant?.name || userId;
        const applicantEmail = applicant?.email;

        const baseUrl = getAppBaseUrl();
        // Admin link to approvals tab
        const approvalUrl = `${baseUrl}/admin/dashboard/leaves?tab=approvals`;
        // User link to their leaves history
        const userDashboardUrl = `${baseUrl}/${userId}/dashboard/leaves`;

        const durationText = `${duration} ${duration === 1 ? 'Working Day' : 'Working Days'}${halfDayType && halfDayType !== 'none' ? ` (${halfDayType === 'first_half' ? 'First Half' : 'Second Half'})` : ''}`;
        const dateRangeText = (startDate === endDate) ? formatDate(startDate) : `${formatDate(startDate)} to ${formatDate(endDate)}`;
        const breakdownHtml = renderDurationBreakdownHtml(durationDetails, duration, halfDayType, dateRangeText);

        // --- 1. Notification to Admin ---
        const approverEmails = await getApproverEmails();
        if (approverEmails.length > 0) {
            const adminSubject = `[Leave Request] ${applicantName} applied for ${leaveTypeName} (${duration} ${duration === 1 ? 'Day' : 'Days'} Deducted - Sundays & Holidays Excluded)`;
            const adminHtml = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 28px; color: #ffffff;">
                        <div style="display: inline-block; background-color: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
                            Leave Application Received
                        </div>
                        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                            New Leave Request
                        </h1>
                        <p style="margin: 8px 0 0 0; font-size: 13px; color: #bfdbfe;">
                            ${applicantName} has submitted a new leave application for your review.
                        </p>
                    </div>

                    <!-- Details Body -->
                    <div style="padding: 28px;">
                        <!-- Applicant Banner -->
                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Applicant Information</div>
                            <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 4px;">${applicantName}</div>
                            <div style="font-size: 12px; color: #475569; margin-top: 2px;">Username: <span style="font-family: monospace; font-weight: 600;">${userId}</span> ${applicantEmail ? `&bull; ${applicantEmail}` : ''}</div>
                        </div>

                        <!-- Summary Table -->
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 600; width: 38%;">Leave Category</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 13px; font-weight: 700;">${leaveTypeName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 600;">Dates</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 13px; font-weight: 700;">${dateRangeText}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 600;">Deducted Duration</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #2563eb; font-size: 14px; font-weight: 800;">
                                    ${durationText}
                                    <div style="font-size: 11px; font-weight: 600; color: #059669; margin-top: 3px;">
                                        &#10003; Sundays &amp; Public Holidays excluded from balance
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 600;">Status</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                                    <span style="background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 8px; text-transform: uppercase;">
                                        Pending Review
                                    </span>
                                </td>
                            </tr>
                        </table>

                        <!-- Deduction Breakdown -->
                        ${breakdownHtml}

                        <!-- Reason Block -->
                        <div style="margin-bottom: 28px;">
                            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Reason for Absence</div>
                            <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 14px 16px; border-radius: 4px 8px 8px 4px; font-size: 13px; color: #334155; line-height: 1.6; font-style: italic;">
                                &ldquo;${reason || 'No specific reason provided.'}&rdquo;
                            </div>
                        </div>

                        <!-- CTA Button -->
                        <div style="text-align: center; margin: 32px 0 20px 0;">
                            <a href="${approvalUrl}" target="_blank" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); text-transform: uppercase; letter-spacing: 0.5px;">
                                Review &amp; Approve Request &rarr;
                            </a>
                        </div>

                        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 20px; line-height: 1.5;">
                            Direct URL: <a href="${approvalUrl}" style="color: #2563eb; text-decoration: underline;">${approvalUrl}</a>
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
                        Online Consultancy Services (OCS) &bull; Leave &amp; Attendance Management
                    </div>
                </div>
            `;

            await sendEmail({
                to: approverEmails,
                subject: adminSubject,
                html: adminHtml
            }).catch(e => console.error("Error dispatching leave notice to admin:", e));
        }

        // --- 2. Acknowledgement to Applicant ---
        if (applicantEmail) {
            const userSubject = `Leave Application Submitted: ${leaveTypeName} (${duration} ${duration === 1 ? 'Day' : 'Days'} Deducted - Sundays & Holidays Excluded)`;
            const userHtml = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #047857 0%, #10b981 100%); padding: 32px 28px; color: #ffffff;">
                        <div style="display: inline-block; background-color: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
                            Application Received
                        </div>
                        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                            Leave Application Acknowledged
                        </h1>
                        <p style="margin: 8px 0 0 0; font-size: 13px; color: #d1fae5;">
                            Hi ${applicantName}, your request has been safely received and is pending administrator review.
                        </p>
                    </div>

                    <!-- Details Body -->
                    <div style="padding: 28px;">
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 600; width: 38%;">Leave Category</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 13px; font-weight: 700;">${leaveTypeName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 600;">Dates Requested</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 13px; font-weight: 700;">${dateRangeText}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 600;">Deducted Duration</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                                    <span style="display: inline-block; background-color: #ecfdf5; color: #047857; font-weight: 800; font-size: 14px; padding: 4px 10px; border-radius: 6px; border: 1px solid #a7f3d0;">
                                        ${duration} ${duration === 1 ? 'Working Day' : 'Working Days'}${halfDayType && halfDayType !== 'none' ? ` (${halfDayType === 'first_half' ? 'First Half' : 'Second Half'})` : ''} Deducted
                                    </span>
                                    <div style="font-size: 11px; color: #059669; font-weight: 600; margin-top: 4px;">
                                        &#10003; Sundays &amp; Public Holidays are strictly excluded (0 days deducted)
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 600;">Current Status</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                                    <span style="background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 8px; text-transform: uppercase;">
                                        Pending Approval
                                    </span>
                                </td>
                            </tr>
                        </table>

                        <!-- Deduction Breakdown -->
                        ${breakdownHtml}

                        <div style="text-align: center; margin: 32px 0 20px 0;">
                            <a href="${userDashboardUrl}" target="_blank" style="background-color: #059669; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px;">
                                View Leave Status &rarr;
                            </a>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
                        Online Consultancy Services (OCS) &bull; Automated Notification
                    </div>
                </div>
            `;

            await sendEmail({
                to: applicantEmail,
                subject: userSubject,
                html: userHtml
            }).catch(e => console.error("Error dispatching leave receipt to applicant:", e));
        }
    } catch (error) {
        console.error("Error in sendLeaveApplicationNotice:", error);
    }
}

/**
 * Send notification to the applicant when their leave is approved, rejected, or cancelled
 */
export async function sendLeaveDecisionNotice({
    requestId,
    status,
    actionedBy,
    comments
}) {
    try {
        const leaveRequest = await getLeaveRequestById(requestId);
        if (!leaveRequest) {
            console.warn(`Leave request ${requestId} not found for decision email`);
            return;
        }

        const applicant = await getUserByUsername(leaveRequest.user_id);
        if (!applicant || !applicant.email) {
            console.log(`No email address on file for applicant ${leaveRequest.user_id}`);
            return;
        }

        const approver = await getUserByUsername(actionedBy).catch(() => null);
        const approverName = approver?.name || actionedBy;
        const applicantName = applicant.name || leaveRequest.user_id;

        const baseUrl = getAppBaseUrl();
        const userDashboardUrl = `${baseUrl}/${leaveRequest.user_id}/dashboard/leaves`;

        const isApproved = status === 'approved';
        const isRejected = status === 'rejected';

        const themeGradient = isApproved 
            ? 'linear-gradient(135deg, #065f46 0%, #10b981 100%)' 
            : isRejected 
                ? 'linear-gradient(135deg, #991b1b 0%, #ef4444 100%)' 
                : 'linear-gradient(135deg, #334155 0%, #64748b 100%)';

        const statusBadgeColor = isApproved ? '#d1fae5' : isRejected ? '#fee2e2' : '#f1f5f9';
        const statusTextColor = isApproved ? '#065f46' : isRejected ? '#991b1b' : '#334155';
        const statusLabel = status.toUpperCase();

        const durationText = `${leaveRequest.duration_days} ${parseFloat(leaveRequest.duration_days) === 1 ? 'Working Day' : 'Working Days'}`;
        const dateRangeText = (leaveRequest.start_date === leaveRequest.end_date) 
            ? formatDate(leaveRequest.start_date) 
            : `${formatDate(leaveRequest.start_date)} to ${formatDate(leaveRequest.end_date)}`;

        const subject = `Leave Request ${statusLabel}: ${leaveRequest.leave_type_name} (${durationText})`;
        const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <!-- Header -->
                <div style="background: ${themeGradient}; padding: 32px 28px; color: #ffffff;">
                    <div style="display: inline-block; background-color: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
                        Leave Request ${statusLabel}
                    </div>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                        Your Request Has Been ${status.charAt(0).toUpperCase() + status.slice(1)}
                    </h1>
                    <p style="margin: 8px 0 0 0; font-size: 13px; color: #ffffff; opacity: 0.9;">
                        Actioned by ${approverName}
                    </p>
                </div>

                <!-- Body -->
                <div style="padding: 28px;">
                    <p style="font-size: 14px; color: #334155; margin-top: 0; line-height: 1.6;">
                        Hi <strong>${applicantName}</strong>, your leave request for <strong>${leaveRequest.leave_type_name}</strong> has been <strong>${status}</strong>.
                    </p>

                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 600; width: 38%;">Leave Category</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 13px; font-weight: 700;">${leaveRequest.leave_type_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 600;">Dates</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 13px; font-weight: 700;">${dateRangeText}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 600;">Deducted Duration</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 13px; font-weight: 700;">
                                ${durationText}
                                <div style="font-size: 11px; color: #059669; font-weight: 600; margin-top: 2px;">
                                    &#10003; Sundays &amp; Public Holidays Excluded
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 600;">Decision Status</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                                <span style="background-color: ${statusBadgeColor}; color: ${statusTextColor}; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 8px; text-transform: uppercase;">
                                    ${statusLabel}
                                </span>
                            </td>
                        </tr>
                    </table>

                    ${comments ? `
                        <div style="margin-bottom: 24px;">
                            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Approver Comments</div>
                            <div style="background-color: #f8fafc; border-left: 4px solid ${isApproved ? '#10b981' : '#ef4444'}; padding: 12px 16px; border-radius: 4px 8px 8px 4px; font-size: 13px; color: #334155; line-height: 1.5; font-style: italic;">
                                &ldquo;${comments}&rdquo;
                            </div>
                        </div>
                    ` : ''}

                    <div style="text-align: center; margin: 28px 0 16px 0;">
                        <a href="${userDashboardUrl}" target="_blank" style="background-color: #1e293b; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px;">
                            View in Dashboard &rarr;
                        </a>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
                    Online Consultancy Services (OCS) &bull; Automated Leave Notification
                </div>
            </div>
        `;

        await sendEmail({
            to: applicant.email,
            subject,
            html
        });
    } catch (err) {
        console.error("Error in sendLeaveDecisionNotice:", err);
    }
}

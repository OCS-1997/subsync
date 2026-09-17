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
 * Get all active Admin and Manager emails eligible for leave approval notices
 */
const getApproverEmails = async () => {
    try {
        const [rows] = await appDB.query(`
            SELECT DISTINCT u.email, u.name, u.username
            FROM users u
            LEFT JOIN roles r ON (r.id = u.role_id OR (u.role_id IS NULL AND LOWER(r.role_key) = LOWER(u.role)))
            LEFT JOIN role_permissions rp ON rp.role_id = r.id
            LEFT JOIN permissions p ON p.id = rp.permission_id
            WHERE (u.is_active = 1 OR u.is_active IS NULL)
              AND u.email IS NOT NULL AND u.email != ''
              AND (
                  r.role_key IN ('admin', 'manager') 
                  OR LOWER(u.role) IN ('admin', 'manager')
                  OR p.permission_key = 'leaves.approve'
              )
        `);

        const emails = rows.map(r => r.email.trim()).filter(Boolean);
        if (emails.length === 0 && process.env.SMTP_USER) {
            emails.push(process.env.SMTP_USER.trim());
        }
        return [...new Set(emails)];
    } catch (err) {
        console.error("Error fetching approver emails:", err);
        return process.env.SMTP_USER ? [process.env.SMTP_USER.trim()] : [];
    }
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
    reason
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

        // --- 1. Notification to Admin ---
        const approverEmails = await getApproverEmails();
        if (approverEmails.length > 0) {
            const adminSubject = `[Leave Request] ${applicantName} applied for ${leaveTypeName} (${durationText})`;
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
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 600;">Duration</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #2563eb; font-size: 13px; font-weight: 800;">
                                    ${durationText} <span style="font-size: 11px; font-weight: 600; color: #64748b;">(Sundays & holidays excluded)</span>
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
            const userSubject = `Leave Application Submitted: ${leaveTypeName} (${durationText})`;
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
                            Hi ${applicantName}, your request has been safely received and is pending administrator approval.
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
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 600;">Calculated Duration</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #059669; font-size: 13px; font-weight: 800;">
                                    ${durationText}
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
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 600;">Duration</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 13px; font-weight: 700;">${durationText}</td>
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

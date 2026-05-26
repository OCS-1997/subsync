import { sendEmail } from "../services/emailService.js";
import { getUserByUsername } from "../models/userModel.js";
import { sendDailyDcrReportEmail } from "../services/dcrService.js";
import { sendUserDailyTimeTrackingReport } from "../services/timeTrackingReportService.js";
import appDB from "../db/subsyncDB.js";
import { logActivity } from "../models/activityLogModel.js";

/**
 * Trigger SMTP/SendGrid test email to individual user or custom email address
 */
export const triggerTestEmail = async (req, res) => {
    try {
        const { username, email } = req.body;
        let targetEmail = email;
        let displayName = "Developer Console Recipient";

        if (username) {
            const user = await getUserByUsername(username);
            if (!user) {
                return res.status(404).json({ success: false, message: `User '${username}' not found` });
            }
            targetEmail = user.email;
            displayName = user.name;
        }

        if (!targetEmail) {
            return res.status(400).json({ success: false, message: "Username or email is required" });
        }

        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 40px auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 20px;">
                    <h1 style="color: #1e3a8a; margin: 0; font-size: 24px;">Subsync Mail Connection Test</h1>
                    <span style="background-color: #dbeafe; color: #1e40af; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 9999px; display: inline-block; margin-top: 8px;">Success</span>
                </div>
                <p style="font-size: 16px; color: #1e293b;">Hello <strong>${displayName}</strong>,</p>
                <p style="color: #475569; line-height: 1.6; font-size: 15px;">
                    This email is a diagnostic test triggered from the <strong>Subsync Developer Console</strong>. If you are reading this message, it verifies that the configured mail provider (SMTP or SendGrid) is fully operational.
                </p>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 24px 0;">
                    <h3 style="margin-top: 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Trigger Metadata</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #475569;">
                        <tr>
                            <td style="padding: 4px 0; font-weight: 600; width: 120px;">Triggered By:</td>
                            <td style="padding: 4px 0;">${req.user.name} (${req.user.username})</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; font-weight: 600;">Mail Provider:</td>
                            <td style="padding: 4px 0; text-transform: uppercase;">${process.env.EMAIL_PROVIDER || 'sendgrid'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; font-weight: 600;">Server Time:</td>
                            <td style="padding: 4px 0;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td>
                        </tr>
                    </table>
                </div>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">This is an administrative system test from Subsync RMS.</p>
            </div>
        `;

        const result = await sendEmail({
            to: targetEmail,
            subject: `[Diagnostic] Subsync Mail Configuration Test`,
            html
        });

        if (result.success) {
            await logActivity({
                username: req.user.username,
                action: 'TRIGGER_TEST_EMAIL',
                resourceType: 'DeveloperControl',
                resourceId: targetEmail,
                ipAddress: req.user.ip || req.ip,
                details: { targetEmail, username }
            });
            res.json({ success: true, message: `Test email sent successfully to ${targetEmail}`, providerId: result.providerId });
        } else {
            res.status(500).json({ success: false, message: `Email delivery failed`, error: result.error });
        }
    } catch (error) {
        console.error("Error triggering test email:", error);
        res.status(500).json({ success: false, message: "Error triggering test email", error: error.message });
    }
};

/**
 * Trigger daily DCR report email
 */
export const triggerDcrReport = async (req, res) => {
    try {
        const { date, overrideRecipient } = req.body;
        const targetDate = date ? new Date(date) : new Date();

        const result = await sendDailyDcrReportEmail(targetDate, overrideRecipient);
        if (result.success) {
            await logActivity({
                username: req.user.username,
                action: 'TRIGGER_DCR_REPORT',
                resourceType: 'DeveloperControl',
                resourceId: overrideRecipient || 'default_recipient',
                ipAddress: req.user.ip || req.ip,
                details: { targetDate, overrideRecipient }
            });
            res.json({ success: true, message: `DCR report successfully triggered and dispatched for date: ${targetDate.toDateString()}` });
        } else {
            res.status(500).json({ success: false, message: `DCR report generation failed`, error: result.error });
        }
    } catch (error) {
        console.error("Error triggering DCR report:", error);
        res.status(500).json({ success: false, message: "Error triggering DCR report", error: error.message });
    }
};

/**
 * Trigger daily time tracking report for a specific user
 */
export const triggerTimeTrackingReport = async (req, res) => {
    try {
        const { username, date } = req.body;
        if (!username) {
            return res.status(400).json({ success: false, message: "Username is required" });
        }

        const targetDate = date ? new Date(date) : new Date();

        // sendUserDailyTimeTrackingReport sends email inside service
        await sendUserDailyTimeTrackingReport(username, targetDate);

        await logActivity({
            username: req.user.username,
            action: 'TRIGGER_TIME_TRACKING_REPORT',
            resourceType: 'DeveloperControl',
            resourceId: username,
            ipAddress: req.user.ip || req.ip,
            details: { username, targetDate }
        });

        res.json({ success: true, message: `Daily time tracking report triggered successfully for ${username} for date: ${targetDate.toDateString()}` });
    } catch (error) {
        console.error("Error triggering time tracking report:", error);
        res.status(500).json({ success: false, message: `Time tracking report trigger failed`, error: error.message });
    }
};

/**
 * Fetch environment and database diagnostics info
 */
export const getSystemInfo = async (req, res) => {
    try {
        const startDbTime = Date.now();
        // Query DB connection
        const [dbRows] = await appDB.query("SELECT 1 as connection_status");
        const dbLatency = Date.now() - startDbTime;

        // Fetch counts for summary statistics
        const [[usersCount]] = await appDB.query("SELECT COUNT(*) as count FROM users");
        const [[activeUsersCount]] = await appDB.query("SELECT COUNT(*) as count FROM users WHERE is_active = 1");
        const [[dcrCount]] = await appDB.query("SELECT COUNT(*) as count FROM dcr_entries");

        const mailProvider = process.env.EMAIL_PROVIDER || 'sendgrid';
        let mailConfigDetails = {
            provider: mailProvider,
        };

        if (mailProvider === 'sendgrid') {
            mailConfigDetails.configured = !!process.env.SENDGRID_API_KEY;
            mailConfigDetails.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@ocsindia.net';
        } else if (mailProvider === 'smtp') {
            mailConfigDetails.host = process.env.SMTP_HOST || 'Not Configured';
            mailConfigDetails.port = process.env.SMTP_PORT || 'N/A';
            mailConfigDetails.secure = process.env.SMTP_SECURE === 'true';
            mailConfigDetails.configured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
        }

        res.json({
            success: true,
            data: {
                serverTime: new Date().toISOString(),
                serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                nodeVersion: process.version,
                envMode: process.env.NODE_ENV || 'development',
                port: process.env.NODE_PORT || 3000,
                database: {
                    status: dbRows[0]?.connection_status === 1 ? "Connected" : "Disconnected",
                    latencyMs: dbLatency,
                    stats: {
                        totalUsers: usersCount?.count || 0,
                        activeUsers: activeUsersCount?.count || 0,
                        totalDcrs: dcrCount?.count || 0
                    }
                },
                mail: mailConfigDetails,
            }
        });
    } catch (error) {
        console.error("Error gathering system info:", error);
        res.status(500).json({ success: false, message: "Error gathering system info", error: error.message });
    }
};

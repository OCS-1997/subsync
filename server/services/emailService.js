import Handlebars from 'handlebars';
import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { getEmailTemplateByKey } from '../models/emailTemplateModel.js';
import { getSubscriptionById } from '../models/subscriptionModel.js';
import { getCustomerById } from '../models/customerModel.js';
import appDB from '../db/subsyncDB.js';

// Helper to strip inline comments from environment variables
const cleanEnv = (val, defaultValue = '') => {
    if (val === undefined || val === null) return defaultValue;
    if (typeof val !== 'string') return val;
    return val.split('#')[0].trim();
};

// Initialize email provider based on env
let emailProvider = null;
const EMAIL_PROVIDER = cleanEnv(process.env.EMAIL_PROVIDER, 'sendgrid');

if (EMAIL_PROVIDER === 'sendgrid') {
    const sgApiKey = cleanEnv(process.env.SENDGRID_API_KEY);
    if (sgApiKey) {
        sgMail.setApiKey(sgApiKey);
        emailProvider = 'sendgrid';
    } else {
        console.warn('SENDGRID_API_KEY not set, email sending will fail');
    }
} else if (EMAIL_PROVIDER === 'smtp') {
    emailProvider = 'smtp';
}

/**
 * Default fallback template for renewal confirmation
 */
const DEFAULT_RENEWAL_CONFIRMATION_SUBJECT = '✅ Subscription Renewed Successfully - {{domain_name}}';
const DEFAULT_RENEWAL_CONFIRMATION_BODY = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Renewed</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 24px; text-align: center;">
            <div style="font-size: 36px; margin-bottom: 12px;">✅</div>
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">Subscription Renewed!</h1>
            <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 15px;">Your subscription has been successfully renewed</p>
        </div>
        <div style="padding: 30px 24px;">
            <p style="margin: 0 0 16px; font-size: 15px; color: #333333; line-height: 1.6;">
                Dear {{customer_name}},
            </p>
            <p style="margin: 0 0 20px; font-size: 15px; color: #333333; line-height: 1.6;">
                Great news! Your subscription for <strong>{{domain_name}}</strong> has been successfully renewed on <strong>{{renewal_date}}</strong>.
            </p>
            <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 18px; margin: 20px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 12px; font-size: 13px; color: #6b7280; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Subscription Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Subscription ID:</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #111827; font-weight: bold; text-align: right;">{{subscription_id}}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Domain:</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #111827; font-weight: bold; text-align: right;">{{domain_name}}</td>
                    </tr>
                    {{#if old_end_date}}
                    <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Previous End Date:</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #6b7280; text-decoration: line-through; text-align: right;">{{old_end_date}}</td>
                    </tr>
                    {{/if}}
                    <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">New Expiry Date:</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #10b981; font-weight: bold; text-align: right;">{{end_date}}</td>
                    </tr>
                    <tr style="border-top: 1px solid #e5e7eb;">
                        <td style="padding: 10px 0 0; font-size: 15px; color: #111827; font-weight: bold;">Total Amount:</td>
                        <td style="padding: 10px 0 0; font-size: 16px; color: #10b981; font-weight: bold; text-align: right;">{{currency}} {{total}}</td>
                    </tr>
                </table>
            </div>
            {{#if invoice_html}}
            <div style="margin: 24px 0;">
                {{{invoice_html}}}
            </div>
            {{/if}}
            <p style="margin: 20px 0 16px; font-size: 14px; color: #4b5563; line-height: 1.6;">
                All pending reminder notifications have been cleared, and new reminders have been scheduled based on your updated subscription period.
            </p>
            <p style="margin: 0 0 20px; font-size: 14px; color: #4b5563; line-height: 1.6;">
                Thank you for your continued trust in our services!
            </p>
        </div>
        <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;">
                Need help? Contact us at <a href="mailto:{{support_email}}" style="color: #10b981; text-decoration: none;">{{support_email}}</a>
            </p>
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © {{current_year}} {{company_name}}. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>`;

/**
 * Get subscription items for template rendering
 * @param {string} subscriptionId
 * @returns {Promise<Array>}
 */
export async function getSubscriptionItems(subscriptionId) {
    try {
        const [items] = await appDB.query(`
            SELECT 
                service_name,
                quantity,
                rate,
                tax_percent,
                amount
            FROM subscription_items
            WHERE sub_id = ?
            ORDER BY service_name
        `, [subscriptionId]);

        return items;
    } catch (error) {
        console.error("Error fetching subscription items:", error);
        return [];
    }
}

/**
 * Render a template string with Handlebars and fallback normalization
 * @param {string} str - Template string containing {{var}} or {var}
 * @param {Object} context - Template variables context
 * @param {Object} options - Options (e.g. noEscape)
 * @returns {string}
 */
export function renderTemplateString(str, context = {}, { noEscape = false } = {}) {
    if (!str || typeof str !== 'string') return '';
    try {
        // Normalize single braces {var_name} to {{var_name}} if user didn't type double braces
        // Negative lookbehind and lookahead to ensure not already surrounded by braces
        const normalized = str.replace(/(?<!\{)\{([a-zA-Z0-9_]+)\}(?!\})/g, '{{$1}}');
        const templateFn = Handlebars.compile(normalized, { noEscape });
        return templateFn(context || {});
    } catch (err) {
        console.error('Error rendering template string with Handlebars:', err.message);
        // Resilient fallback: replace basic {{key}} or {key} using regex
        let fallback = str;
        if (context && typeof context === 'object') {
            for (const [k, v] of Object.entries(context)) {
                if (v !== undefined && v !== null && typeof v !== 'object') {
                    const regex = new RegExp(`\\{\\{?\\s*${k}\\s*\\}\\}?`, 'g');
                    fallback = fallback.replace(regex, String(v));
                }
            }
        }
        return fallback;
    }
}

/**
 * Render email template with Handlebars
 * @param {string} templateKey
 * @param {Object} context
 * @returns {Promise<{subject: string, html: string}>}
 */
export async function renderEmailTemplate(templateKey, context) {
    try {
        let template = await getEmailTemplateByKey(templateKey);

        if (!template) {
            if (templateKey === 'renewal_confirmation') {
                template = {
                    subject: DEFAULT_RENEWAL_CONFIRMATION_SUBJECT,
                    body_html: DEFAULT_RENEWAL_CONFIRMATION_BODY,
                    active: 1
                };
            } else {
                throw new Error(`Email template not found: ${templateKey}`);
            }
        }

        if (!template.active) {
            console.warn(`Template ${templateKey} is inactive, using anyway`);
        }

        // Render subject with noEscape: true so HTML entities (like &amp; or &#x27;) don't appear in email subjects
        const subject = renderTemplateString(template.subject, context, { noEscape: true });
        const html = renderTemplateString(template.body_html, context, { noEscape: false });

        return { subject, html };
    } catch (error) {
        console.error(`Error rendering email template ${templateKey}:`, error);
        throw error;
    }
}

/**
 * Build template context from subscription data
 * @param {Object} subscription
 * @param {Object} customer
 * @param {Array} items
 * @param {Date} runAt
 * @returns {Object}
 */
export function buildTemplateContext(subscription, customer, items, runAt) {
    const endDate = subscription.end_date ? new Date(subscription.end_date) : null;
    const startDate = subscription.start_date ? new Date(subscription.start_date) : null;
    const now = runAt || new Date();
    const daysLeft = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

    const currency = subscription.currency || 'INR';
    const subtotal = parseFloat(subscription.subtotal || 0).toFixed(2);
    const taxTotal = parseFloat(subscription.tax_total || 0).toFixed(2);
    const discountValue = parseFloat(subscription.discount_value || 0).toFixed(2);
    const discountType = subscription.discount_type || 'amount';
    const rounding = parseFloat(subscription.rounding || 0).toFixed(2);
    const total = parseFloat(subscription.total || 0).toFixed(2);

    // Generate complete invoice-style HTML
    const invoiceHtml = `
        <div style="max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
            <!-- Header -->
            <div style="text-align: center; padding: 20px; border-bottom: 3px solid #4A90E2;">
                <h1 style="margin: 0; color: #4A90E2; font-size: 28px;">Subscription Invoice</h1>
                <p style="margin: 5px 0 0; color: #666; font-size: 14px;">Subscription ID: <strong>${subscription.sub_id}</strong></p>
            </div>

            <!-- Customer & Subscription Info -->
            <div style="padding: 20px; background-color: #f9f9f9; border-bottom: 1px solid #ddd;">
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 200px; margin-bottom: 10px;">
                        <p style="margin: 0; font-size: 12px; color: #888; text-transform: uppercase;">Customer</p>
                        <p style="margin: 5px 0; font-size: 16px; font-weight: bold;">${customer?.display_name || customer?.first_name || 'Valued Customer'}</p>
                        <p style="margin: 0; font-size: 14px; color: #666;">${customer?.primary_email || ''}</p>
                    </div>
                    <div style="flex: 1; min-width: 200px; margin-bottom: 10px;">
                        <p style="margin: 0; font-size: 12px; color: #888; text-transform: uppercase;">Domain</p>
                        <p style="margin: 5px 0; font-size: 16px; font-weight: bold;">${subscription.domain_name || 'N/A'}</p>
                        <p style="margin: 0; font-size: 12px; color: #888; text-transform: uppercase; margin-top: 10px;">Billing Period</p>
                        <p style="margin: 5px 0; font-size: 14px;">${startDate ? startDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'} → ${endDate ? endDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'}</p>
                    </div>
                </div>
            </div>

            <!-- Line Items -->
            <div style="padding: 20px;">
                <h2 style="margin: 0 0 15px; font-size: 18px; color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">Services</h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background-color: #f5f5f5;">
                            <th style="padding: 12px; text-align: left; border: 1px solid #ddd; font-size: 14px;">Service Name</th>
                            <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-size: 14px; width: 80px;">Qty</th>
                            <th style="padding: 12px; text-align: right; border: 1px solid #ddd; font-size: 14px; width: 120px;">Rate</th>
                            <th style="padding: 12px; text-align: right; border: 1px solid #ddd; font-size: 14px; width: 100px;">Tax %</th>
                            <th style="padding: 12px; text-align: right; border: 1px solid #ddd; font-size: 14px; width: 130px;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items && items.length > 0 ? items.map(item => `
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd; font-size: 14px;">${item.service_name || 'N/A'}</td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 14px;">${parseFloat(item.quantity || 0).toFixed(2)}</td>
                                <td style="padding: 10px; text-align: right; border: 1px solid #ddd; font-size: 14px;">${currency} ${parseFloat(item.rate || 0).toFixed(2)}</td>
                                <td style="padding: 10px; text-align: right; border: 1px solid #ddd; font-size: 14px;">${parseFloat(item.tax_percent || 0).toFixed(2)}%</td>
                                <td style="padding: 10px; text-align: right; border: 1px solid #ddd; font-size: 14px; font-weight: bold;">${currency} ${parseFloat(item.amount || 0).toFixed(2)}</td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="5" style="padding: 20px; text-align: center; border: 1px solid #ddd; color: #999; font-style: italic;">No items</td>
                            </tr>
                        `}
                    </tbody>
                </table>

                <!-- Billing Summary -->
                <div style="margin-left: auto; max-width: 400px; float: right;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 12px; text-align: left; font-size: 14px; border-bottom: 1px solid #eee;">Subtotal:</td>
                            <td style="padding: 8px 12px; text-align: right; font-size: 14px; border-bottom: 1px solid #eee; font-weight: bold;">${currency} ${subtotal}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 12px; text-align: left; font-size: 14px; border-bottom: 1px solid #eee;">Tax Total:</td>
                            <td style="padding: 8px 12px; text-align: right; font-size: 14px; border-bottom: 1px solid #eee; font-weight: bold;">${currency} ${taxTotal}</td>
                        </tr>
                        ${parseFloat(discountValue) > 0 ? `
                        <tr>
                            <td style="padding: 8px 12px; text-align: left; font-size: 14px; border-bottom: 1px solid #eee; color: #e74c3c;">Discount (${discountType === 'percent' ? discountValue + '%' : currency + ' ' + discountValue}):</td>
                            <td style="padding: 8px 12px; text-align: right; font-size: 14px; border-bottom: 1px solid #eee; font-weight: bold; color: #e74c3c;">- ${currency} ${discountValue}</td>
                        </tr>
                        ` : ''}
                        ${parseFloat(rounding) !== 0 ? `
                        <tr>
                            <td style="padding: 8px 12px; text-align: left; font-size: 14px; border-bottom: 1px solid #eee;">Rounding:</td>
                            <td style="padding: 8px 12px; text-align: right; font-size: 14px; border-bottom: 1px solid #eee; font-weight: bold;">${currency} ${rounding}</td>
                        </tr>
                        ` : ''}
                        <tr style="background-color: #4A90E2; color: white;">
                            <td style="padding: 12px; text-align: left; font-size: 16px; font-weight: bold;">Grand Total:</td>
                            <td style="padding: 12px; text-align: right; font-size: 18px; font-weight: bold;">${currency} ${total}</td>
                        </tr>
                    </table>
                </div>
                <div style="clear: both;"></div>
            </div>

            <!-- Notes -->
            ${subscription.notes ? `
            <div style="padding: 20px; background-color: #fffbea; border-left: 4px solid #f59e0b; margin: 20px;">
                <p style="margin: 0; font-size: 12px; color: #92400e; text-transform: uppercase; font-weight: bold;">Notes</p>
                <p style="margin: 5px 0 0; font-size: 14px; color: #78350f;">${subscription.notes}</p>
            </div>
            ` : ''}

            <!-- Terms -->
            ${subscription.terms_and_conditions ? `
            <div style="padding: 20px; background-color: #f9f9f9; border-top: 1px solid #ddd; margin-top: 20px;">
                <p style="margin: 0; font-size: 12px; color: #888; text-transform: uppercase; font-weight: bold;">Terms and Conditions</p>
                <p style="margin: 5px 0 0; font-size: 12px; color: #666; line-height: 1.6;">${subscription.terms_and_conditions}</p>
            </div>
            ` : ''}
        </div>
    `;

    const domainName = subscription.domain_name || (items && items.length > 0 && items[0]?.service_name) || 'N/A';
    const customerName = customer?.display_name || customer?.first_name || 'Valued Customer';
    const subId = subscription.sub_id;
    const formattedStartDate = startDate ? startDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A';
    const formattedEndDate = endDate ? endDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A';
    const daysLeftVal = daysLeft !== null ? daysLeft : 'N/A';
    const companyName = cleanEnv(process.env.COMPANY_NAME, 'Online Consultancy Services (OCS)');
    const supportEmail = cleanEnv(process.env.SUPPORT_EMAIL, 'support@ocsindia.net');

    return {
        customer_name: customerName,
        customer_email: customer?.primary_email || '',
        subscription_id: subId,
        domain_name: domainName,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        days_left: daysLeftVal,
        currency: currency,
        subtotal: subtotal,
        tax_total: taxTotal,
        discount_type: discountType,
        discount_value: discountValue,
        rounding: rounding,
        total: total,
        items: items || [],
        invoice_html: invoiceHtml,
        // Deprecated but kept for backward compatibility
        items_table_html: invoiceHtml,
        renewal_link: `${cleanEnv(process.env.APP_BASE_URL, 'http://localhost')}/subscriptions/${subscription.sub_id}/renew`,
        current_year: new Date().getFullYear(),
        company_name: companyName,
        support_email: supportEmail,
        subscription: subscription,
        customer: customer,

        // Plug-in aliases for flexible subject line and template authoring
        domain: domainName,
        service_name: (items && items.length > 0 && items[0]?.service_name) || domainName,
        client_name: customerName,
        name: customerName,
        sub_id: subId,
        expiry_date: formattedEndDate,
        due_date: formattedEndDate,
        days_remaining: daysLeftVal,
        days: daysLeftVal,
        company: companyName,
        amount: total,
    };
}

/**
 * Send email using configured provider
 * @param {Object} emailData
 * @param {string|Array} emailData.to
 * @param {string} emailData.subject
 * @param {string} emailData.html
 * @param {string|null} emailData.attachment_url - Legacy single attachment URL
 * @param {Array} emailData.attachments - Array of attachment objects { filename, content, type, disposition, content_id (SendGrid) / cid (Nodemailer) }
 * @returns {Promise<{success: boolean, providerId: string|null, error: string|null}>}
 */
export async function sendEmail({ to, subject, html, attachment_url = null, attachments = [] }) {
    if (!emailProvider) {
        throw new Error('Email provider not configured');
    }

    let recipients = [];
    if (Array.isArray(to)) {
        recipients = to.flatMap(t => typeof t === 'string' ? t.split(',') : [t])
            .map(email => typeof email === 'string' ? email.split('#')[0].trim() : email)
            .filter(Boolean);
    } else if (typeof to === 'string') {
        recipients = to.split(',').map(email => email.split('#')[0].trim()).filter(Boolean);
    }

    // Block emails to inactive user accounts
    if (recipients.length > 0) {
        try {
            const [inactiveRows] = await appDB.query(
                `SELECT LOWER(TRIM(email)) AS email FROM users WHERE (is_active = 0 OR is_active IS FALSE) AND email IS NOT NULL AND TRIM(email) != ''`
            );
            if (inactiveRows && inactiveRows.length > 0) {
                const inactiveEmails = new Set(inactiveRows.map(r => r.email).filter(Boolean));
                const originalCount = recipients.length;
                recipients = recipients.filter(email => {
                    const cleanEmail = String(email).toLowerCase().trim();
                    return !inactiveEmails.has(cleanEmail);
                });
                if (recipients.length < originalCount) {
                    console.warn(`[sendEmail] Suppressed email delivery to inactive user account(s): ${originalCount - recipients.length} recipient(s) filtered out.`);
                }
                if (recipients.length === 0) {
                    console.warn(`[sendEmail] Email delivery completely blocked: all recipients belong to inactive accounts.`);
                    return {
                        success: false,
                        blocked: true,
                        error: 'Email delivery blocked: recipient account is inactive',
                        providerId: null
                    };
                }
            }
        } catch (err) {
            console.error('[sendEmail] Error checking inactive users:', err.message);
        }
    }

    try {
        if (emailProvider === 'sendgrid') {
            const sendgridFrom = cleanEnv(process.env.SENDGRID_FROM_EMAIL, 'noreply@ocsindia.net');
            const msg = {
                to: recipients,
                from: {
                    email: sendgridFrom,
                    name: 'Online Consultancy Services (OCS)'
                },
                subject,
                html,
            };

            // Add legacy attachment if provided
            if (attachment_url) {
                // For now, we'll just include the URL in the email body
                msg.html += `<p><a href="${attachment_url}">Download Invoice</a></p>`;
            }

            // Add generic attachments (for inline images etc)
            if (attachments && attachments.length > 0) {
                msg.attachments = attachments;
            }

            const [response] = await sgMail.send(msg);
            return {
                success: true,
                providerId: response.headers['x-message-id'] || null,
                error: null,
            };
        } else if (emailProvider === 'smtp') {
            const smtpHost = cleanEnv(process.env.SMTP_HOST);
            const smtpPort = parseInt(cleanEnv(process.env.SMTP_PORT, '587'), 10);
            const smtpSecure = cleanEnv(process.env.SMTP_SECURE) === 'true';
            const smtpUser = cleanEnv(process.env.SMTP_USER);
            const smtpPass = cleanEnv(process.env.SMTP_PASS);
            const smtpFrom = cleanEnv(process.env.SMTP_FROM || process.env.SMTP_USER);

            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpSecure,
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            const mailOptions = {
                from: `"Online Consultancy Services (OCS)" <${smtpFrom}>`,
                to: recipients.join(', '),
                subject,
                html,
            };

            if (attachment_url) {
                mailOptions.html += `<p><a href="${attachment_url}">Download Invoice</a></p>`;
            }

            // Add generic attachments
            if (attachments && attachments.length > 0) {
                mailOptions.attachments = attachments;
            }

            const info = await transporter.sendMail(mailOptions);
            return {
                success: true,
                providerId: info.messageId || null,
                error: null,
            };
        } else {
            throw new Error(`Unknown email provider: ${EMAIL_PROVIDER}`);
        }
    } catch (error) {
        console.error('Error sending email:', error);

        // Handle specific error cases
        if (error.response) {
            const statusCode = error.response.statusCode || error.response.status;

            // 4xx errors are permanent failures
            if (statusCode >= 400 && statusCode < 500) {
                return {
                    success: false,
                    providerId: null,
                    error: `Permanent failure (${statusCode}): ${error.message}`,
                };
            }

            // 429 is rate limiting
            if (statusCode === 429) {
                const retryAfter = error.response.headers['retry-after'] || 60;
                return {
                    success: false,
                    providerId: null,
                    error: `Rate limited. Retry after ${retryAfter} seconds`,
                };
            }
        }

        return {
            success: false,
            providerId: null,
            error: error.message || 'Unknown error',
        };
    }
}

/**
 * Send reminder email for a subscription
 * @param {string} subscriptionId
 * @param {string} templateKey
 * @param {Date} runAt
 * @param {Object} options
 * @returns {Promise<{success: boolean, providerId: string|null, error: string|null}>}
 */
export async function sendReminderEmail(subscriptionId, templateKey, runAt, options = {}) {
    try {
        // Load subscription and related data
        const subscription = await getSubscriptionById(subscriptionId);
        if (!subscription) {
            throw new Error(`Subscription not found: ${subscriptionId}`);
        }

        // Load customer
        const customer = await getCustomerById(subscription.customer_id);
        if (!customer) {
            throw new Error(`Customer not found: ${subscription.customer_id}`);
        }

        // Load subscription items
        const items = await getSubscriptionItems(subscriptionId);

        // Build template context
        const context = buildTemplateContext(subscription, customer, items, runAt);
        context.renewal_date = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });
        if (options.old_end_date) {
            context.old_end_date = options.old_end_date;
        }

        // Render template
        let { subject, html } = await renderEmailTemplate(templateKey, context);
        if (options.customSubject) {
            subject = options.customSubject;
        }

        // Determine recipient list
        let recipients = [];
        if (options.to) {
            recipients = Array.isArray(options.to) ? options.to : [options.to];
        } else if (subscription.email_list && Array.isArray(subscription.email_list) && subscription.email_list.length > 0) {
            recipients = subscription.email_list;
        } else if (customer.primary_email) {
            recipients = [customer.primary_email];
        } else {
            throw new Error(`No email address found for subscription ${subscriptionId}`);
        }

        // Send email (invoices are embedded in HTML, no PDF attachments)
        const result = await sendEmail({
            to: recipients,
            subject,
            html,
            attachment_url: null, // No PDF attachments - invoice is embedded in email body
        });

        return result;
    } catch (error) {
        console.error(`Error sending reminder email for ${subscriptionId}:`, error);
        return {
            success: false,
            providerId: null,
            error: error.message || 'Unknown error',
        };
    }
}


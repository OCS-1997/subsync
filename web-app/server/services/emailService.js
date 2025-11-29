import Handlebars from 'handlebars';
import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { getEmailTemplateByKey } from '../models/emailTemplateModel.js';
import { getSubscriptionById } from '../models/subscriptionModel.js';
import { getCustomerById } from '../models/customerModel.js';
import appDB from '../db/subsyncDB.js';

// Initialize email provider based on env
let emailProvider = null;
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'sendgrid';

if (EMAIL_PROVIDER === 'sendgrid') {
    if (process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        emailProvider = 'sendgrid';
    } else {
        console.warn('SENDGRID_API_KEY not set, email sending will fail');
    }
} else if (EMAIL_PROVIDER === 'smtp') {
    emailProvider = 'smtp';
}

/**
 * Get subscription items for template rendering
 * @param {string} subscriptionId
 * @returns {Promise<Array>}
 */
async function getSubscriptionItems(subscriptionId) {
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
 * Render email template with Handlebars
 * @param {string} templateKey
 * @param {Object} context
 * @returns {Promise<{subject: string, html: string}>}
 */
export async function renderEmailTemplate(templateKey, context) {
    try {
        const template = await getEmailTemplateByKey(templateKey);
        
        if (!template) {
            throw new Error(`Email template not found: ${templateKey}`);
        }

        if (!template.active) {
            console.warn(`Template ${templateKey} is inactive, using anyway`);
        }

        // Compile Handlebars templates
        const subjectTemplate = Handlebars.compile(template.subject);
        const bodyTemplate = Handlebars.compile(template.body_html);

        const subject = subjectTemplate(context);
        const html = bodyTemplate(context);

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
    const now = runAt || new Date();
    const daysLeft = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

    // Format items as HTML table
    let itemsTableHtml = '';
    if (items && items.length > 0) {
        itemsTableHtml = `
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background-color: #f5f5f5;">
                        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Service</th>
                        <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Quantity</th>
                        <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Rate</th>
                        <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;">${item.service_name || 'N/A'}</td>
                            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${item.quantity || 0}</td>
                            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${subscription.currency || 'INR'} ${item.rate || 0}</td>
                            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${subscription.currency || 'INR'} ${item.amount || 0}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    return {
        customer_name: customer?.display_name || customer?.first_name || 'Valued Customer',
        customer_email: customer?.primary_email || '',
        subscription_id: subscription.sub_id,
        domain_name: subscription.domain_name || 'N/A',
        start_date: subscription.start_date ? new Date(subscription.start_date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A',
        end_date: endDate ? endDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A',
        days_left: daysLeft !== null ? daysLeft : 'N/A',
        currency: subscription.currency || 'INR',
        subtotal: subscription.subtotal || 0,
        tax_total: subscription.tax_total || 0,
        total: subscription.total || 0,
        items: items || [],
        items_table_html: itemsTableHtml,
        renewal_link: `${process.env.APP_BASE_URL || 'http://localhost'}/subscriptions/${subscription.sub_id}/renew`,
        subscription: subscription,
        customer: customer,
    };
}

/**
 * Send email using configured provider
 * @param {Object} emailData
 * @param {string|Array} emailData.to
 * @param {string} emailData.subject
 * @param {string} emailData.html
 * @param {string|null} emailData.attachment_url
 * @returns {Promise<{success: boolean, providerId: string|null, error: string|null}>}
 */
export async function sendEmail({ to, subject, html, attachment_url = null }) {
    if (!emailProvider) {
        throw new Error('Email provider not configured');
    }

    const recipients = Array.isArray(to) ? to : [to];

    try {
        if (emailProvider === 'sendgrid') {
            const msg = {
                to: recipients,
                from: process.env.SENDGRID_FROM_EMAIL || 'noreply@ocsindia.net',
                subject,
                html,
            };

            // Add attachment if provided
            if (attachment_url) {
                // For now, we'll just include the URL in the email body
                // In production, you might want to fetch and attach the file
                msg.html += `<p><a href="${attachment_url}">Download Invoice</a></p>`;
            }

            const [response] = await sgMail.send(msg);
            return {
                success: true,
                providerId: response.headers['x-message-id'] || null,
                error: null,
            };
        } else if (emailProvider === 'smtp') {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587', 10),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            const mailOptions = {
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: recipients.join(', '),
                subject,
                html,
            };

            if (attachment_url) {
                mailOptions.html += `<p><a href="${attachment_url}">Download Invoice</a></p>`;
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

        // Render template
        const { subject, html } = await renderEmailTemplate(templateKey, context);

        // Determine recipient list
        let recipients = [];
        if (subscription.email_list && Array.isArray(subscription.email_list) && subscription.email_list.length > 0) {
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


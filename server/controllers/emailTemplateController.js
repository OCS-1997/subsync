import {
    getEmailTemplates,
    getEmailTemplateById,
    getEmailTemplateByKey,
    upsertEmailTemplate,
    updateEmailTemplate,
    deleteEmailTemplate,
} from '../models/emailTemplateModel.js';
import { renderEmailTemplate, buildTemplateContext } from '../services/emailService.js';
import { getSubscriptionById } from '../models/subscriptionModel.js';
import { getCustomerById } from '../models/customerModel.js';
import { logActivity } from '../models/activityLogModel.js';

/**
 * GET /api/email-templates
 * List all email templates
 */
export const listEmailTemplatesController = async (req, res) => {
    try {
        const { active_only } = req.query;
        const templates = await getEmailTemplates({
            active_only: active_only === 'true',
        });
        res.json(templates);
    } catch (error) {
        console.error('Error fetching email templates:', error);
        res.status(500).json({ error: 'Failed to fetch email templates' });
    }
};

/**
 * GET /api/email-templates/:id
 * Get email template by ID
 */
export const getEmailTemplateController = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await getEmailTemplateById(parseInt(id, 10));
        if (!template) {
            return res.status(404).json({ error: 'Email template not found' });
        }
        res.json(template);
    } catch (error) {
        console.error('Error fetching email template:', error);
        res.status(500).json({ error: 'Failed to fetch email template' });
    }
};

/**
 * POST /api/email-templates
 * Create or update email template
 */
export const upsertEmailTemplateController = async (req, res) => {
    try {
        const { template_key, name, subject, body_html, active } = req.body;

        if (!template_key || !name || !subject || !body_html) {
            return res.status(400).json({
                error: 'template_key, name, subject, and body_html are required',
            });
        }

        const templateId = await upsertEmailTemplate({
            template_key,
            name,
            subject,
            body_html,
            active: active !== false,
        });

        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'UPSERT_EMAIL_TEMPLATE',
                resourceType: 'EmailTemplate',
                resourceId: templateId.toString(),
                ipAddress: req.ip,
                details: { template_key, name },
            });
        }

        res.status(201).json({ message: 'Email template saved', templateId });
    } catch (error) {
        console.error('Error upserting email template:', error);
        res.status(500).json({ error: error.message || 'Failed to save email template' });
    }
};

/**
 * PUT /api/email-templates/:id
 * Update email template
 */
export const updateEmailTemplateController = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, subject, body_html, active } = req.body;

        const existing = await getEmailTemplateById(parseInt(id, 10));
        if (!existing) {
            return res.status(404).json({ error: 'Email template not found' });
        }

        await updateEmailTemplate(parseInt(id, 10), {
            name,
            subject,
            body_html,
            active,
        });

        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'UPDATE_EMAIL_TEMPLATE',
                resourceType: 'EmailTemplate',
                resourceId: id,
                ipAddress: req.ip,
                details: req.body,
            });
        }

        res.json({ message: 'Email template updated' });
    } catch (error) {
        console.error('Error updating email template:', error);
        res.status(500).json({ error: error.message || 'Failed to update email template' });
    }
};

/**
 * DELETE /api/email-templates/:id
 * Delete email template
 */
export const deleteEmailTemplateController = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await getEmailTemplateById(parseInt(id, 10));
        if (!existing) {
            return res.status(404).json({ error: 'Email template not found' });
        }

        await deleteEmailTemplate(parseInt(id, 10));

        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'DELETE_EMAIL_TEMPLATE',
                resourceType: 'EmailTemplate',
                resourceId: id,
                ipAddress: req.ip,
            });
        }

        res.json({ message: 'Email template deleted' });
    } catch (error) {
        console.error('Error deleting email template:', error);
        res.status(500).json({ error: error.message || 'Failed to delete email template' });
    }
};

/**
 * POST /api/email-templates/:id/preview
 * Preview email template with sample data
 */
export const previewEmailTemplateController = async (req, res) => {
    try {
        const { id } = req.params;
        const { subscription_id } = req.body;

        const template = await getEmailTemplateById(parseInt(id, 10));
        if (!template) {
            return res.status(404).json({ error: 'Email template not found' });
        }

        // Use provided subscription or create sample data
        let context;
        if (subscription_id) {
            const subscription = await getSubscriptionById(subscription_id);
            if (!subscription) {
                return res.status(404).json({ error: 'Subscription not found' });
            }
            const customer = await getCustomerById(subscription.customer_id);
            const items = []; // Could fetch items if needed
            context = buildTemplateContext(subscription, customer, items, new Date());
        } else {
            // Sample data
            context = {
                customer_name: 'John Doe',
                customer_email: 'john@example.com',
                subscription_id: 'SUB001',
                domain_name: 'example.com',
                start_date: new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
                end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
                days_left: 30,
                currency: 'INR',
                subtotal: 1000,
                tax_total: 180,
                total: 1180,
                items: [],
                items_table_html: '',
                renewal_link: `${process.env.APP_BASE_URL || 'http://localhost'}/subscriptions/SUB001/renew`,
            };
        }

        const { subject, html } = await renderEmailTemplate(template.template_key, context);

        res.json({ subject, html });
    } catch (error) {
        console.error('Error previewing email template:', error);
        res.status(500).json({ error: error.message || 'Failed to preview email template' });
    }
};


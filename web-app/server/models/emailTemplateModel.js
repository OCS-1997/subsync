import appDB from "../db/subsyncDB.js";

/**
 * Get all email templates
 * @param {Object} filters
 * @param {boolean} filters.active_only
 * @returns {Promise<Array>}
 */
export async function getEmailTemplates({ active_only = false } = {}) {
    try {
        let query = `
            SELECT 
                id,
                template_key,
                name,
                subject,
                body_html,
                active,
                created_at,
                updated_at
            FROM email_templates
        `;

        const params = [];
        if (active_only) {
            query += ` WHERE active = 1`;
        }

        query += ` ORDER BY template_key ASC`;

        const [templates] = await appDB.query(query, params);
        return templates;
    } catch (error) {
        console.error("Error fetching email templates:", error);
        throw error;
    }
}

/**
 * Get email template by key
 * @param {string} templateKey
 * @returns {Promise<Object|null>}
 */
export async function getEmailTemplateByKey(templateKey) {
    try {
        const [templates] = await appDB.query(`
            SELECT 
                id,
                template_key,
                name,
                subject,
                body_html,
                active,
                created_at,
                updated_at
            FROM email_templates
            WHERE template_key = ?
        `, [templateKey]);

        return templates.length > 0 ? templates[0] : null;
    } catch (error) {
        console.error("Error fetching email template:", error);
        throw error;
    }
}

/**
 * Get email template by ID
 * @param {number} templateId
 * @returns {Promise<Object|null>}
 */
export async function getEmailTemplateById(templateId) {
    try {
        const [templates] = await appDB.query(`
            SELECT 
                id,
                template_key,
                name,
                subject,
                body_html,
                active,
                created_at,
                updated_at
            FROM email_templates
            WHERE id = ?
        `, [templateId]);

        return templates.length > 0 ? templates[0] : null;
    } catch (error) {
        console.error("Error fetching email template:", error);
        throw error;
    }
}

/**
 * Create or update email template
 * @param {Object} templateData
 * @param {string} templateData.template_key
 * @param {string} templateData.name
 * @param {string} templateData.subject
 * @param {string} templateData.body_html
 * @param {boolean} templateData.active
 * @returns {Promise<number>} The ID of the template
 */
export async function upsertEmailTemplate({ template_key, name, subject, body_html, active = true }) {
    try {
        const [result] = await appDB.query(`
            INSERT INTO email_templates (template_key, name, subject, body_html, active)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                subject = VALUES(subject),
                body_html = VALUES(body_html),
                active = VALUES(active),
                updated_at = CURRENT_TIMESTAMP
        `, [template_key, name, subject, body_html, active ? 1 : 0]);

        // If insert, return insertId; if update, fetch the ID
        if (result.insertId) {
            return result.insertId;
        } else {
            const template = await getEmailTemplateByKey(template_key);
            return template.id;
        }
    } catch (error) {
        console.error("Error upserting email template:", error);
        throw error;
    }
}

/**
 * Update email template
 * @param {number} templateId
 * @param {Object} templateData
 * @returns {Promise<void>}
 */
export async function updateEmailTemplate(templateId, { name, subject, body_html, active }) {
    try {
        const updates = [];
        const params = [];

        if (name !== undefined) {
            updates.push(`name = ?`);
            params.push(name);
        }
        if (subject !== undefined) {
            updates.push(`subject = ?`);
            params.push(subject);
        }
        if (body_html !== undefined) {
            updates.push(`body_html = ?`);
            params.push(body_html);
        }
        if (active !== undefined) {
            updates.push(`active = ?`);
            params.push(active ? 1 : 0);
        }

        if (updates.length === 0) {
            return;
        }

        params.push(templateId);
        await appDB.query(`
            UPDATE email_templates
            SET ${updates.join(', ')}
            WHERE id = ?
        `, params);
    } catch (error) {
        console.error("Error updating email template:", error);
        throw error;
    }
}

/**
 * Delete email template
 * @param {number} templateId
 * @returns {Promise<void>}
 */
export async function deleteEmailTemplate(templateId) {
    try {
        await appDB.query(`
            DELETE FROM email_templates WHERE id = ?
        `, [templateId]);
    } catch (error) {
        console.error("Error deleting email template:", error);
        throw error;
    }
}


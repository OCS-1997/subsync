import appDB from "../db/subsyncDB.js";

/**
 * APPRAISAL TEMPLATES
 */

async function createTemplate({ name, description, questions }) {
    const [result] = await appDB.query(
        `INSERT INTO appraisal_templates (name, description, questions) VALUES (?, ?, ?)`,
        [name, description, JSON.stringify(questions)]
    );
    return result.insertId;
}

async function getTemplates() {
    const [rows] = await appDB.query(`SELECT * FROM appraisal_templates ORDER BY created_at DESC`);
    return rows.map(row => ({ ...row, questions: typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions }));
}

async function updateTemplate(id, { name, description, questions }) {
    await appDB.query(
        `UPDATE appraisal_templates SET name = ?, description = ?, questions = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [name, description, JSON.stringify(questions), id]
    );
}

async function deleteTemplate(id) {
    await appDB.query(`DELETE FROM appraisal_templates WHERE id = ?`, [id]);
}

async function getTemplateById(id) {
    const [rows] = await appDB.query(`SELECT * FROM appraisal_templates WHERE id = ?`, [id]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return { ...row, questions: typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions };
}

/**
 * APPRAISAL PERIODS
 */

async function createPeriod({ template_id, quarter, year, start_date, end_date, status = 'Planned' }) {
    const [result] = await appDB.query(
        `INSERT INTO appraisal_periods (template_id, quarter, year, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)`,
        [template_id, quarter, year, start_date, end_date, status]
    );
    return result.insertId;
}

async function getPeriods(filters = {}) {
    let sql = `
        SELECT p.*, t.name as template_name 
        FROM appraisal_periods p
        JOIN appraisal_templates t ON p.template_id = t.id
    `;
    const params = [];
    const conditions = [];

    if (filters.status) {
        conditions.push("p.status = ?");
        params.push(filters.status);
    }
    if (filters.year) {
        conditions.push("p.year = ?");
        params.push(filters.year);
    }

    if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
    }
    sql += " ORDER BY p.year DESC, p.quarter DESC";

    const [rows] = await appDB.query(sql, params);
    return rows;
}

async function getActivePeriod() {
    const [rows] = await appDB.query(
        `SELECT p.*, t.questions 
         FROM appraisal_periods p
         JOIN appraisal_templates t ON p.template_id = t.id
         WHERE p.status = 'Active' 
         LIMIT 1`
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return { ...row, questions: typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions };
}

async function updatePeriodStatus(id, status) {
    await appDB.query(`UPDATE appraisal_periods SET status = ? WHERE id = ?`, [status, id]);
}

/**
 * USER APPRAISALS
 */

async function saveUserAppraisal({ period_id, username, responses, status = 'Draft' }) {
    const submitted_at = status === 'Submitted' ? new Date() : null;
    const [result] = await appDB.query(
        `INSERT INTO user_appraisals (period_id, username, responses, status, submitted_at) 
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
            responses = VALUES(responses), 
            status = VALUES(status), 
            submitted_at = VALUES(submitted_at),
            updated_at = CURRENT_TIMESTAMP`,
        [period_id, username, JSON.stringify(responses), status, submitted_at]
    );
    return result.affectedRows > 0;
}

async function getUserAppraisal(username, period_id) {
    const [rows] = await appDB.query(
        `SELECT * FROM user_appraisals WHERE username = ? AND period_id = ?`,
        [username, period_id]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return { ...row, responses: typeof row.responses === 'string' ? JSON.parse(row.responses) : row.responses };
}

async function getAppraisalsByPeriod(period_id) {
    const [rows] = await appDB.query(
        `SELECT a.*, u.name as user_full_name 
         FROM user_appraisals a
         JOIN users u ON a.username = u.username
         WHERE a.period_id = ?`,
        [period_id]
    );
    return rows.map(row => ({ ...row, responses: typeof row.responses === 'string' ? JSON.parse(row.responses) : row.responses }));
}

async function reviewAppraisal({ id, reviewer_username, comments, status = 'Reviewed' }) {
    const reviewer_date = new Date();
    await appDB.query(
        `UPDATE user_appraisals 
         SET reviewed_by = ?, reviewer_comments = ?, status = ?, reviewer_date = ?, reviewer_signature = ?
         WHERE id = ?`,
        [reviewer_username, comments, status, reviewer_date, reviewer_username, id]
    );
}

async function deleteAppraisal(id) {
    await appDB.query(`DELETE FROM user_appraisals WHERE id = ?`, [id]);
}

async function deletePeriod(id) {
    await appDB.query(`DELETE FROM appraisal_periods WHERE id = ?`, [id]);
}

export default {
    createTemplate, getTemplates, getTemplateById, updateTemplate, deleteTemplate,
    createPeriod, getPeriods, getActivePeriod, updatePeriodStatus,
    saveUserAppraisal, getUserAppraisal, getAppraisalsByPeriod, reviewAppraisal,
    deleteAppraisal, deletePeriod
};

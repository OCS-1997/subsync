import appDB from "../db/subsyncDB.js";
import { getCurrentTime } from "../middlewares/time.js";
import { generateID } from "../middlewares/generateID.js";

/**
 * Create a new opportunity
 */
export const createOpportunity = async (opportunityData) => {
    const opportunity_id = generateID("OPP");
    const {
        opportunity_date,
        customer_id,
        customer_details,
        contact_person_id,
        opportunity_type,
        referred_by,
        domain,
        owner,
        product_services,
        last_contacted_at,
        status_id,
        remarks,
        opportunity_value
    } = opportunityData;

    // Validation: For "New" type, require customer_details; for "Existing", require customer_id
    if (opportunity_type === 'New') {
        if (!customer_details || !customer_details.display_name) {
            throw new Error('Customer details with display_name are required for New opportunities');
        }
    } else {
        if (!customer_id) {
            throw new Error('Customer ID is required for Existing opportunities');
        }
    }

    const query = `
        INSERT INTO opportunities (
            opportunity_id, opportunity_date, customer_id, customer_details, contact_person_id,
            opportunity_type, referred_by, domain, owner,
            product_services, last_contacted_at, status_id, remarks, opportunity_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        opportunity_id,
        opportunity_date,
        customer_id || null,
        customer_details ? JSON.stringify(customer_details) : null,
        contact_person_id || null,
        opportunity_type || 'Existing',
        referred_by || null,
        domain || null,
        owner,
        product_services,
        last_contacted_at || null,
        status_id || null,
        remarks || null,
        parseFloat(opportunity_value) || 0
    ];

    await appDB.execute(query, values);
    return opportunity_id;
};

/**
 * Update an existing opportunity
 */
export const updateOpportunity = async (opportunityId, updatedData) => {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updatedData)) {
        if ([
            'opportunity_date', 'customer_id', 'customer_details', 'contact_person_id', 'opportunity_type',
            'referred_by', 'domain', 'owner', 'product_services',
            'last_contacted_at', 'status_id', 'remarks', 'opportunity_value', 'is_deleted'
        ].includes(key)) {
            fields.push(`${key} = ?`);
            
            let finalValue = value;
            if (key === 'customer_details' && value !== null && typeof value === 'object') {
                finalValue = JSON.stringify(value);
            } else if (key === 'opportunity_value') {
                finalValue = parseFloat(value) || 0;
            } else if (value === undefined) {
                finalValue = null;
            }
            
            values.push(finalValue);
        }
    }

    if (fields.length === 0) return false;

    const query = `UPDATE opportunities SET ${fields.join(', ')} WHERE opportunity_id = ?`;
    values.push(opportunityId);

    const [result] = await appDB.query(query, values);
    return result.affectedRows > 0;
};

/**
 * Get all opportunities with filters and pagination
 */
export const getAllOpportunities = async ({
    search = "",
    sort = "opportunity_date",
    order = "desc",
    page = 1,
    limit = 10,
    status = null,
    owner = null,
    customer_id = null
}) => {
    // Validate sort and order to prevent SQL injection since we interpolate them
    const validSortFields = ['opportunity_date', 'opportunity_value', 'customer_name', 'owner', 'status_name'];
    const finalSort = validSortFields.includes(sort) ? sort : 'opportunity_date';
    const finalOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const isAll = limit === 'all';
    const pageNum = isAll ? 1 : (parseInt(page) || 1);
    const limitNum = isAll ? 0 : (parseInt(limit) || 10);
    const offset = isAll ? 0 : (pageNum - 1) * limitNum;

    const values = [];
    let whereClauses = ["o.is_deleted = 0"];

    if (search) {
        whereClauses.push("(c.company_name LIKE ? OR c.display_name LIKE ? OR o.product_services LIKE ? OR o.domain LIKE ?)");
        const searchVal = `%${search}%`;
        values.push(searchVal, searchVal, searchVal, searchVal);
    }

    if (status) {
        whereClauses.push("o.status_id = ?");
        values.push(status);
    }

    if (owner) {
        whereClauses.push("o.owner = ?");
        values.push(owner);
    }

    if (customer_id) {
        whereClauses.push("o.customer_id = ?");
        values.push(customer_id);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Get total count
    const countQuery = `
        SELECT COUNT(*) as total 
        FROM opportunities o
        LEFT JOIN customers c ON o.customer_id = c.customer_id
        ${whereSql}
    `;
    // We use .query here as well for consistency
    const [countRows] = await appDB.query(countQuery, values);
    const totalRecords = countRows[0].total;
    const totalPages = Math.ceil(totalRecords / (isAll ? 1 : limitNum));

    // Get data - Using .query instead of .execute to avoid LIMIT placeholder issues with binary protocol
    const query = `
        SELECT o.*, 
               c.company_name, 
               COALESCE(c.display_name, JSON_UNQUOTE(JSON_EXTRACT(o.customer_details, '$.display_name'))) as customer_name,
               s.status_name, 
               s.status_color, 
               u.name as owner_name
        FROM opportunities o
        LEFT JOIN customers c ON o.customer_id = c.customer_id
        JOIN opportunity_statuses s ON o.status_id = s.id
        LEFT JOIN users u ON o.owner = u.username
        ${whereSql}
        ORDER BY ${finalSort} ${finalOrder}
        ${isAll ? "" : "LIMIT ? OFFSET ?"}
    `;

    const [opportunities] = await appDB.query(query, isAll ? values : [...values, limitNum, offset]);

    // Parse customer_details JSON for each opportunity if it's a string
    opportunities.forEach(opp => {
        if (opp.customer_details && typeof opp.customer_details === 'string') {
            try {
                opp.customer_details = JSON.parse(opp.customer_details);
            } catch (e) {
                console.error('Error parsing customer_details JSON in list:', e);
            }
        }
    });

    return {
        totalRecords,
        totalPages,
        currentPage: pageNum,
        opportunities
    };
};

/**
 * Get single opportunity by ID
 */
export const getOpportunityById = async (opportunityId) => {
    const query = `
        SELECT o.*, 
               c.company_name, 
               COALESCE(c.display_name, JSON_UNQUOTE(JSON_EXTRACT(o.customer_details, '$.display_name'))) as customer_name,
               s.status_name, 
               s.status_color, 
               u.name as owner_name
        FROM opportunities o
        LEFT JOIN customers c ON o.customer_id = c.customer_id
        JOIN opportunity_statuses s ON o.status_id = s.id
        LEFT JOIN users u ON o.owner = u.username
        WHERE o.opportunity_id = ? AND o.is_deleted = 0
    `;
    const [rows] = await appDB.execute(query, [opportunityId]);

    // Parse customer_details JSON if it exists and is a string
    if (rows[0] && rows[0].customer_details && typeof rows[0].customer_details === 'string') {
        try {
            rows[0].customer_details = JSON.parse(rows[0].customer_details);
        } catch (e) {
            console.error('Error parsing customer_details JSON:', e);
        }
    }

    return rows[0] || null;
};

/**
 * Status management
 */
export const getOpportunityStatuses = async () => {
    const query = "SELECT * FROM opportunity_statuses ORDER BY sort_order ASC, status_name ASC";
    const [rows] = await appDB.execute(query);
    return rows;
};

export const createOpportunityStatus = async (statusData) => {
    const { status_name, status_color, description, sort_order } = statusData;
    const query = `
        INSERT INTO opportunity_statuses (status_name, status_color, description, sort_order)
        VALUES (?, ?, ?, ?)
    `;
    const [result] = await appDB.execute(query, [status_name, status_color || '#3b82f6', description || null, sort_order || 0]);
    return result.insertId;
};

export const updateOpportunityStatus = async (statusId, statusData) => {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(statusData)) {
        if (['status_name', 'status_color', 'description', 'sort_order'].includes(key)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
    }

    if (fields.length === 0) return false;

    const query = `UPDATE opportunity_statuses SET ${fields.join(', ')} WHERE id = ?`;
    values.push(statusId);

    const [result] = await appDB.execute(query, values);
    return result.affectedRows > 0;
};

export const deleteOpportunityStatus = async (statusId) => {
    // Check if status is in use
    const checkQuery = "SELECT COUNT(*) as count FROM opportunities WHERE status_id = ? AND is_deleted = 0";
    const [checkResult] = await appDB.execute(checkQuery, [statusId]);

    if (checkResult[0].count > 0) {
        throw new Error("Cannot delete status that is currently in use by opportunities.");
    }

    const query = "DELETE FROM opportunity_statuses WHERE id = ?";
    const [result] = await appDB.execute(query, [statusId]);
    return result.affectedRows > 0;
};

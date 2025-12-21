import appDB from "../db/subsyncDB.js";
import { generateID } from "../middlewares/generateID.js";
import { formatMySQLDate } from "../utils/dateFormatter.js";

/**
 * Generate a unique contact ID
 */
const generateContactId = () => {
    return generateID("CNT");
};

/**
 * Create a new contact
 */
const createContact = async (contactData) => {
    try {
        const {
            contact_id,
            domain_id,
            domain_free_text,
            company_name,
            salutation,
            first_name,
            last_name,
            email,
            country_code,
            phone_number,
            designation,
            date_of_birth,
            is_private,
            created_by,
            notes
        } = contactData;

        const query = `
            INSERT INTO contacts (
                contact_id, domain_id, domain_free_text, company_name,
                salutation, first_name, last_name, email,
                country_code, phone_number, designation, date_of_birth,
                is_private, created_by, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await appDB.query(query, [
            contact_id,
            domain_id,
            domain_free_text,
            company_name,
            salutation,
            first_name,
            last_name,
            email,
            country_code,
            phone_number,
            designation,
            formatMySQLDate(date_of_birth),
            is_private,
            created_by,
            notes
        ]);

        return contact_id;
    } catch (error) {
        console.error("Error creating contact:", error);
        throw error;
    }
};

/**
 * Get all contacts with pagination and search
 * Filters private contacts based on user permissions
 */
const getAllContacts = async ({ page = 1, limit = 20, search = '', username = null, sort = null, order = 'asc' }) => {
    try {
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                c.*,
                d.domain_name
            FROM contacts c
            LEFT JOIN domains d ON c.domain_id = d.domain_id
        `;

        const params = [];
        const conditions = [];

        // Privacy filter: show public contacts OR private contacts created by the user
        if (username) {
            conditions.push('(c.is_private = 0 OR c.created_by = ?)');
            params.push(username);
        } else {
            conditions.push('c.is_private = 0');
        }

        // Search filter
        if (search) {
            conditions.push(`(
                c.first_name LIKE ? OR 
                c.last_name LIKE ? OR 
                c.email LIKE ? OR 
                c.company_name LIKE ? OR
                c.phone_number LIKE ? OR
                c.domain_free_text LIKE ?
            )`);
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        // Sorting - map frontend keys to database columns
        const sortMap = {
            'full_name': 'c.first_name',
            'company_name': 'c.company_name',
            'email': 'c.email',
            'phone': 'c.phone_number',
            'domain': 'd.domain_name'
        };

        const sortColumn = sort && sortMap[sort] ? sortMap[sort] : 'c.created_at';
        const sortDirection = order && (order.toLowerCase() === 'desc' || order.toLowerCase() === 'asc')
            ? order.toUpperCase()
            : 'DESC';

        query += ` ORDER BY ${sortColumn} ${sortDirection} LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [contacts] = await appDB.query(query, params);

        // Get total count with same filters
        let countQuery = `SELECT COUNT(*) as total FROM contacts c`;
        const countParams = [];
        const countConditions = [];

        if (username) {
            countConditions.push('(c.is_private = 0 OR c.created_by = ?)');
            countParams.push(username);
        } else {
            countConditions.push('c.is_private = 0');
        }

        if (search) {
            countConditions.push(`(
                c.first_name LIKE ? OR 
                c.last_name LIKE ? OR 
                c.email LIKE ? OR 
                c.company_name LIKE ? OR
                c.phone_number LIKE ? OR
                c.domain_free_text LIKE ?
            )`);
            const searchPattern = `%${search}%`;
            countParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
        }

        if (countConditions.length > 0) {
            countQuery += ` WHERE ${countConditions.join(' AND ')}`;
        }

        const [countResult] = await appDB.query(countQuery, countParams);
        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limit);

        return {
            contacts: contacts.map(c => ({
                ...c,
                date_of_birth: formatMySQLDate(c.date_of_birth)
            })),
            totalPages,
            totalRecords,
            currentPage: page
        };
    } catch (error) {
        console.error("Error fetching contacts:", error);
        throw error;
    }
};

/**
 * Get a contact by ID
 */
const getContactById = async (contact_id) => {
    try {
        const query = `
            SELECT 
                c.*,
                d.domain_name
            FROM contacts c
            LEFT JOIN domains d ON c.domain_id = d.domain_id
            WHERE c.contact_id = ?
        `;

        const [contacts] = await appDB.query(query, [contact_id]);

        return contacts.length > 0 ? {
            ...contacts[0],
            date_of_birth: formatMySQLDate(contacts[0].date_of_birth)
        } : null;
    } catch (error) {
        console.error("Error fetching contact by ID:", error);
        throw error;
    }
};

/**
 * Update a contact
 */
const updateContact = async (contact_id, updateData) => {
    try {
        const fields = [];
        const values = [];

        Object.keys(updateData).forEach(key => {
            fields.push(`${key} = ?`);
            if (key === 'date_of_birth') {
                values.push(formatMySQLDate(updateData[key]));
            } else {
                values.push(updateData[key]);
            }
        });

        if (fields.length === 0) {
            return false;
        }

        values.push(contact_id);

        const query = `
            UPDATE contacts 
            SET ${fields.join(', ')}
            WHERE contact_id = ?
        `;

        const [result] = await appDB.query(query, values);

        return result.affectedRows > 0;
    } catch (error) {
        console.error("Error updating contact:", error);
        throw error;
    }
};

/**
 * Delete a contact
 */
const deleteContact = async (contact_id) => {
    try {
        const query = `DELETE FROM contacts WHERE contact_id = ?`;
        const [result] = await appDB.query(query, [contact_id]);

        return result.affectedRows > 0;
    } catch (error) {
        console.error("Error deleting contact:", error);
        throw error;
    }
};

export {
    generateContactId,
    createContact,
    getAllContacts,
    getContactById,
    updateContact,
    deleteContact
};




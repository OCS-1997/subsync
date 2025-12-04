import appDB from "../db/subsyncDB.js";
import { getCurrentTime } from "../middlewares/time.js";
import { generateID } from "../middlewares/generateID.js";

/**
 * Create a contact from DCR data
 * @param {Object} contactData
 * @returns {Promise<string>} - Contact ID
 */
async function createContactFromDcr(contactData) {
    try {
        const {
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
            notes
        } = contactData;

        if (!first_name) {
            throw new Error("First name is required");
        }

        const contact_id = generateID("CNT");
        const currentTime = getCurrentTime();

        const [result] = await appDB.query(
            `INSERT INTO contacts (
                contact_id, domain_id, domain_free_text, company_name,
                salutation, first_name, last_name, email,
                country_code, phone_number, designation, notes,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                contact_id,
                domain_id || null,
                domain_free_text || null,
                company_name || null,
                salutation || null,
                first_name,
                last_name || null,
                email || null,
                country_code || '+91',
                phone_number || null,
                designation || null,
                notes || null,
                currentTime,
                currentTime
            ]
        );

        return contact_id;
    } catch (error) {
        console.error("Error creating contact:", error);
        throw error;
    }
}

/**
 * Get contact by ID
 * @param {string} contactId
 * @returns {Promise<Object|null>}
 */
async function getContactById(contactId) {
    try {
        const [rows] = await appDB.query(
            `SELECT * FROM contacts WHERE contact_id = ?`,
            [contactId]
        );

        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("Error fetching contact:", error);
        throw error;
    }
}

export {
    createContactFromDcr,
    getContactById
};



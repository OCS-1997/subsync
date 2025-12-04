import { createContactFromDcr, getContactById } from "../models/contactModel.js";
import { logActivity } from "../models/activityLogModel.js";

/**
 * Create a contact from DCR form data
 */
const createContactFromDcrController = async (req, res) => {
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
        } = req.body;

        if (!first_name) {
            return res.status(400).json({ error: "First name is required" });
        }

        const contactData = {
            domain_id: domain_id || null,
            domain_free_text: domain_free_text || null,
            company_name: company_name || null,
            salutation: salutation || null,
            first_name,
            last_name: last_name || null,
            email: email || null,
            country_code: country_code || '+91',
            phone_number: phone_number || null,
            designation: designation || null,
            notes: notes || null
        };

        const contact_id = await createContactFromDcr(contactData);

        // Log activity
        if (req.user && req.user.username) {
            await logActivity({
                username: req.user.username,
                action: 'CREATE_CONTACT',
                resourceType: 'Contact',
                resourceId: contact_id,
                ipAddress: req.ip,
                details: contactData
            });
        }

        res.status(201).json({
            message: 'Contact created successfully!',
            contact_id
        });
    } catch (error) {
        console.error("Contact creation error:", error);
        res.status(500).json({ error: error.message || "Failed to create contact." });
    }
};

/**
 * Get contact by ID
 */
const getContactByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const contact = await getContactById(id);

        if (!contact) {
            return res.status(404).json({ error: "Contact not found." });
        }

        res.status(200).json({ contact });
    } catch (error) {
        console.error("Error fetching contact:", error);
        res.status(500).json({ error: "Failed to fetch contact." });
    }
};

export {
    createContactFromDcrController,
    getContactByIdController
};



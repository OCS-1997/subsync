import {
    createContact as createContactModel,
    getAllContacts,
    getContactById as getContactByIdModel,
    updateContact as updateContactModel,
    deleteContact as deleteContactModel,
    generateContactId
} from "../models/contactModel.js";
import { logActivity } from "../models/activityLogModel.js";

/**
 * Create a new contact
 */
const createContact = async (req, res) => {
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
            date_of_birth,
            is_private,
            notes
        } = req.body;

        if (!first_name) {
            return res.status(400).json({ error: "First name is required" });
        }

        const contact_id = generateContactId();
        const created_by = req.user?.username || null;

        const contactData = {
            contact_id,
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
            date_of_birth: date_of_birth || null,
            is_private: is_private !== undefined ? is_private : 0,  // Default to public (0)
            created_by,
            notes: notes || null
        };

        await createContactModel(contactData);

        // Log activity
        if (req.user && req.user.username) {
            await logActivity({
                username: req.user.username,
                action: 'CREATE_CONTACT',
                resourceType: 'CONTACT',
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
 * Get all contacts with pagination and search
 * Filters based on privacy settings and current user
 */
const getContacts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            sort = null,
            order = 'asc'
        } = req.query;

        const username = req.user?.username || null;

        const result = await getAllContacts({
            page: parseInt(page),
            limit: parseInt(limit),
            search,
            username,
            sort,
            order
        });

        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching contacts:", error);
        res.status(500).json({ error: "Failed to fetch contacts." });
    }
};

/**
 * Get a single contact by ID
 */
const getContactById = async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await getContactByIdModel(id);

        if (!contact) {
            return res.status(404).json({ error: "Contact not found." });
        }

        res.status(200).json({ contact });
    } catch (error) {
        console.error("Error fetching contact:", error);
        res.status(500).json({ error: "Failed to fetch contact." });
    }
};

/**
 * Update a contact
 */
const updateContact = async (req, res) => {
    try {
        const { id } = req.params;
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
            date_of_birth,
            is_private,
            notes
        } = req.body;

        const updateData = {};

        if (domain_id !== undefined) updateData.domain_id = domain_id;
        if (domain_free_text !== undefined) updateData.domain_free_text = domain_free_text;
        if (company_name !== undefined) updateData.company_name = company_name;
        if (salutation !== undefined) updateData.salutation = salutation;
        if (first_name !== undefined) updateData.first_name = first_name;
        if (last_name !== undefined) updateData.last_name = last_name;
        if (email !== undefined) updateData.email = email;
        if (country_code !== undefined) updateData.country_code = country_code;
        if (phone_number !== undefined) updateData.phone_number = phone_number;
        if (designation !== undefined) updateData.designation = designation;
        if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
        if (is_private !== undefined) updateData.is_private = is_private;
        if (notes !== undefined) updateData.notes = notes;

        const success = await updateContactModel(id, updateData);

        if (!success) {
            return res.status(404).json({ error: "Contact not found." });
        }

        // Log activity
        if (req.user && req.user.username) {
            await logActivity({
                username: req.user.username,
                action: 'UPDATE_CONTACT',
                resourceType: 'CONTACT',
                resourceId: id,
                ipAddress: req.ip,
                details: updateData
            });
        }

        res.status(200).json({ message: "Contact updated successfully!" });
    } catch (error) {
        console.error("Error updating contact:", error);
        res.status(500).json({ error: error.message || "Failed to update contact." });
    }
};

/**
 * Delete a contact
 */
const deleteContact = async (req, res) => {
    try {
        const { id } = req.params;

        const success = await deleteContactModel(id);

        if (!success) {
            return res.status(404).json({ error: "Contact not found." });
        }

        // Log activity
        if (req.user && req.user.username) {
            await logActivity({
                username: req.user.username,
                action: 'DELETE_CONTACT',
                resourceType: 'CONTACT',
                resourceId: id,
                ipAddress: req.ip
            });
        }

        res.status(200).json({ message: "Contact deleted successfully!" });
    } catch (error) {
        console.error("Error deleting contact:", error);
        res.status(500).json({ error: error.message || "Failed to delete contact." });
    }
};

/**
 * Create contact from DCR (existing function - keeping for compatibility)
 */
const createContactFromDcrController = async (req, res) => {
    try {
        const {
            domain_free_text,
            company_name,
            first_name,
            last_name,
            email,
            country_code,
            phone_number,
            notes
        } = req.body;

        if (!domain_free_text || !first_name) {
            return res.status(400).json({ error: "Domain and first name are required" });
        }

        // Import appDB for validation queries
        const appDB = (await import("../db/subsyncDB.js")).default;

        // Check if domain already exists in domains table
        const [existingDomains] = await appDB.query(
            'SELECT domain_id, domain_name, customer_name FROM domains WHERE domain_name = ?',
            [domain_free_text]
        );

        if (existingDomains.length > 0) {
            return res.status(409).json({
                error: "Domain already exists in system",
                message: `The domain "${domain_free_text}" is already registered as a customer domain. Please select it from the Existing Customer dropdown instead.`,
                domain: existingDomains[0]
            });
        }

        // Check if company name already exists in customers table (if provided)
        if (company_name && company_name.trim()) {
            const [existingCustomers] = await appDB.query(
                'SELECT customer_id, company_name, display_name FROM customers WHERE company_name LIKE ? OR display_name LIKE ?',
                [`%${company_name}%`, `%${company_name}%`]
            );

            if (existingCustomers.length > 0) {
                return res.status(409).json({
                    error: "Company already exists in system",
                    message: `A customer with similar company name "${existingCustomers[0].company_name}" already exists. Please verify if this is a duplicate.`,
                    customer: existingCustomers[0]
                });
            }
        }

        // Check if domain_free_text already exists in contacts table
        const [existingContacts] = await appDB.query(
            'SELECT contact_id, domain_free_text, company_name, first_name, last_name FROM contacts WHERE domain_free_text = ?',
            [domain_free_text]
        );

        if (existingContacts.length > 0) {
            return res.status(409).json({
                error: "Domain already exists in contacts",
                message: `The domain "${domain_free_text}" already exists in contacts. This contact will be available for selection in future DCR entries.`,
                contact: existingContacts[0]
            });
        }

        // All validations passed, create the contact
        const contact_id = generateContactId();

        const contactData = {
            contact_id,
            domain_id: null,
            domain_free_text,
            company_name: company_name || null,
            salutation: null,
            first_name,
            last_name: last_name || null,
            email: email || null,
            country_code: country_code || '+91',
            phone_number: phone_number || null,
            designation: null,
            notes: notes || null,
            is_private: 0, // Public by default for DCR contacts
            created_by: req.user?.username || null
        };

        await createContactModel(contactData);

        // Log activity
        if (req.user && req.user.username) {
            await logActivity({
                username: req.user.username,
                action: 'CREATE_CONTACT',
                resourceType: 'Contact',
                resourceId: contact_id,
                ipAddress: req.ip,
                details: { source: 'DCR', domain_free_text, company_name }
            });
        }

        res.status(201).json({
            message: 'Contact created successfully!',
            contact_id,
            contact: contactData
        });
    } catch (error) {
        console.error("Error creating contact from DCR:", error);
        res.status(500).json({ error: error.message || "Failed to create contact." });
    }
};

/**
 * Get contact by ID (existing function - keeping for compatibility)
 */
const getContactByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const contact = await getContactByIdModel(id);

        if (!contact) {
            return res.status(404).json({ error: "Contact not found" });
        }

        res.status(200).json({ contact });
    } catch (error) {
        console.error("Error fetching contact:", error);
        res.status(500).json({ error: "Failed to fetch contact" });
    }
};

export {
    createContact,
    getContacts,
    getContactById,
    updateContact,
    deleteContact,
    createContactFromDcrController,
    getContactByIdController
};




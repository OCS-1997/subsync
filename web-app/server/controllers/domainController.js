import { addDomain, updateDomain, getAllDomains, getDomainById, importDomainData } from "../models/domainModel.js";
import { getCustomerById } from "../models/customerModel.js";
import { logActivity } from "../models/activityLogModel.js";
import appDB from "../db/subsyncDB.js";

/**
 * Controller function for addDomain() to be executed at /create-domain
 */
const createDomain = async (req, res) => {
    try {
        // console.log("Received Data", req.body);
        await addDomain(req.body);
        // Log activity
        if (req.user && req.user.username) {
            await logActivity({ username: req.user.username, action: 'CREATE_DOMAIN', resourceType: 'Domain', ipAddress: req.ip, details: req.body });
        }
        res.status(201).json({ message: 'Domain created successfully!' });
    } catch (error) {
        console.error("Domain creation error:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Controller function for updateDomain() to be executed at /update-domain/:did
 */
const updateDomainDetails = async (req, res) => {
    try {
        // console.log("Request body received:", req.body);
        const { did } = req.params;
        await updateDomain(did, req.body);
        const updatedDomain = await getDomainById(did); // after update
        // Log activity
        if (req.user && req.user.username) {
            await logActivity({ username: req.user.username, action: 'UPDATE_DOMAIN', resourceType: 'Domain', resourceId: did, ipAddress: req.ip, details: req.body });
        }
        res.json(updatedDomain);
    } catch (error) {
        console.error("Domain update error:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Controller function for getAllDomains() to be executed at /all-domains
 */
const fetchAllDomains = async (req, res) => {
    try {
        const { search = "", sort = "domain_name", order = "asc", page = 1, limit = 10 } = req.query;
        const { domains, totalPages, totalRecords } = await getAllDomains({ search, sort, order, page: parseInt(page), limit: parseInt(limit) });
        res.status(200).json({ domains, totalPages, totalRecords });
    } catch (error) {
        console.error("Error fetching domains:", error);
        res.status(500).json({ error: "Failed to fetch domains from the database." });
    }
};

/**
 * Controller function for getAllDomainDetails() to be executed at /all-domain-details
 */
const fetchAllDomainDetails = async (req, res) => {
    try {
        const domains = await getAllDomainDetails();
        res.status(200).json({ domains });
    } catch (error) {
        console.error("Error fetching all domain details:", error);
        res.status(500).json({ error: "Failed to fetch all domain details." });
    }
};

/**
 * Controller function for getDomainById() to be executed at /domain/:did
 */
const domainDetailsByID = async (req, res) => {
    try {
        const domain = await getDomainById(req.params.did);
        if (!domain) {
            return res.status(404).json({ error: "Domain not found." });
        }
        res.status(200).json({ domain });
    } catch (error) {
        console.error("Error fetching domain details:", error);
        res.status(500).json({ error: "Failed to fetch domain details." });
    }
};

/**
 * Controller function for importDomainData() to be executed at /import-domains
 */
const importDomains = async (req, res) => {
    try {
        const { domains } = req.body;
        if (!domains || domains.length === 0) {
            return res.status(400).json({ error: "No domain data provided" });
        }
        await importDomainData(domains);
        res.status(200).json({ message: "Domains imported successfully!" });
    } catch (error) {
        console.error("Error importing domains:", error);
        res.status(500).json({ error: "Failed to import domains." });
    }
};

// No changes needed for ENUM, as backend just forwards values.

/**
 * Get domain details with customer and contacts for DCR form
 */
const getDomainDetailsForDcr = async (req, res) => {
    try {
        const { id } = req.params;
        const domain = await getDomainById(id);

        if (!domain) {
            return res.status(404).json({ error: "Domain not found." });
        }

        // Get customer details
        let customer = null;
        let contacts = [];

        if (domain.customer_id) {
            customer = await getCustomerById(domain.customer_id);

            // Extract contacts from customer's other_contacts JSON field
            if (customer && customer.other_contacts) {
                try {
                    const parsedContacts = typeof customer.other_contacts === 'string'
                        ? JSON.parse(customer.other_contacts)
                        : customer.other_contacts;

                    if (Array.isArray(parsedContacts)) {
                        contacts = parsedContacts.map(contact => ({
                            email: contact.email || '',
                            last_name: contact.last_name || contact.lastName || '',
                            first_name: contact.first_name || contact.firstName || '',
                            salutation: contact.salutation || 'Mr.',
                            designation: contact.designation || '',
                            country_code: contact.country_code || '+91',
                            phone_number: contact.phone_number || contact.phoneNumber || contact.mobile || contact.phone || ''
                        }));
                    }
                } catch (e) {
                    console.error("Error parsing customer contacts:", e);
                }
            }
        }

        res.status(200).json({
            domain_name: domain.domain_name,
            customer_name: domain.customer_name || customer?.display_name || customer?.company_name || '',
            company_name: customer?.company_name || domain.customer_name || '',
            contacts
        });
    } catch (error) {
        console.error("Error fetching domain details for DCR:", error);
        res.status(500).json({ error: "Failed to fetch domain details." });
    }
};

export { createDomain, updateDomainDetails, fetchAllDomains, fetchAllDomainDetails, domainDetailsByID, importDomains, getDomainDetailsForDcr };
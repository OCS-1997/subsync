import {
    createVendor,
    getAllVendors,
    getVendorById,
    updateVendor,
    deleteVendor
} from '../models/vendorModel.js'; // Ensure this path is correct
import { logActivity } from '../models/activityLogModel.js';

// CREATE Vendor
export const createVendorController = async (req, res) => {
    try {
        const vendorData = req.body;

        // Pass the full vendor object to the model for validation and creation
        const result = await createVendor(vendorData);
        // Log activity
        if (req.user && req.user.username) {
            await logActivity({ username: req.user.username, action: 'CREATE_VENDOR', resourceType: 'Vendor', resourceId: result.insertId, ipAddress: req.ip, details: vendorData });
        }
        return res.status(201).json({ message: "Vendor created successfully", vendor_id: result.insertId });
    } catch (error) {
        console.error("Error creating vendor:", error);
        // Return the error message from the model (validation or DB error)
        return res.status(400).json({ error: error.message || "Internal Server Error" });
    }
};

// READ All Vendors
export const getAllVendorsController = async (req, res) => {
    try {
        const { search = "", sort = "display_name", order = "asc", page = 1, limit = 10 } = req.query;
        const { vendors, totalPages, totalRecords } = await getAllVendors({ search, sort, order, page: parseInt(page), limit: parseInt(limit) });
        return res.status(200).json({ vendors, totalPages, totalRecords });
    } catch (error) {
        console.error("Error fetching all vendors:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// READ Vendor by ID
export const getVendorByIdController = async (req, res) => {
    try {
        const { id } = req.params; // Assuming ID comes from URL parameter
        const vendor = await getVendorById(id);

        if (!vendor) {
            return res.status(404).json({ error: "Vendor not found." });
        }

        // Parse JSON fields if they exist
        if (vendor.vendor_address && typeof vendor.vendor_address === 'string') {
            try {
                vendor.vendor_address = JSON.parse(vendor.vendor_address);
            } catch (e) {
                vendor.vendor_address = {};
            }
        }

        if (vendor.other_contacts && typeof vendor.other_contacts === 'string') {
            try {
                vendor.other_contacts = JSON.parse(vendor.other_contacts);
            } catch (e) {
                vendor.other_contacts = [];
            }
        }

        if (vendor.payment_terms && typeof vendor.payment_terms === 'string') {
            try {
                vendor.payment_terms = JSON.parse(vendor.payment_terms);
            } catch (e) {
                vendor.payment_terms = { term_name: "Due on Receipt", days: 0, is_default: true };
            }
        }

        return res.status(200).json(vendor);
    } catch (error) {
        console.error("Error fetching vendor by ID:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// UPDATE Vendor
export const updateVendorController = async (req, res) => {
    try {
        const { id } = req.params;
        const vendorData = req.body;

        const existingVendor = await getVendorById(id);
        if (!existingVendor) {
            return res.status(404).json({ error: "Vendor not found." });
        }

        // Map frontend field names to backend field names
        const mappedData = {
            salutation: vendorData.salutation,
            first_name: vendorData.firstName,
            last_name: vendorData.lastName,
            primary_email: vendorData.email,
            secondary_email: vendorData.secondary_email || "",
            country_code: vendorData.country_code,
            primary_phone_number: vendorData.phoneNumber,
            secondary_phone_number: vendorData.secondaryPhoneNumber,
            vendor_address: vendorData.address,
            company_name: vendorData.companyName,
            display_name: vendorData.displayName,
            gst_in: vendorData.gstin,
            currency_code: vendorData.currencyCode,
            gst_treatment: vendorData.gst_treatment,
            tax_preference: vendorData.tax_preference,
            exemption_reason: vendorData.exemption_reason,
            payment_terms: vendorData.payment_terms,
            notes: vendorData.notes,
            vendor_status: vendorData.vendorStatus,
            other_contacts: vendorData.contactPersons
        };

        const result = await updateVendor(id, mappedData);
        // Log activity
        if (req.user && req.user.username) {
            await logActivity({ username: req.user.username, action: 'UPDATE_VENDOR', resourceType: 'Vendor', resourceId: id, ipAddress: req.ip, details: mappedData });
        }
        if (result.affectedRows === 0) {
            return res.status(200).json({ message: "Vendor found, but no changes applied." });
        }

        return res.status(200).json({ message: "Vendor updated successfully." });
    } catch (error) {
        console.error("Error updating vendor:", error);
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};

// DELETE Vendor
export const deleteVendorController = async (req, res) => {
    try {
        const { id } = req.params;

        const existingVendor = await getVendorById(id);
        if (!existingVendor) {
            return res.status(404).json({ error: "Vendor not found." });
        }

        const result = await deleteVendor(id);
        // Log activity
        if (req.user && req.user.username) {
            await logActivity({ username: req.user.username, action: 'DELETE_VENDOR', resourceType: 'Vendor', ipAddress: req.ip, resourceId: id });
        }
        if (result.affectedRows === 0) {
            // Should theoretically not happen if existingVendor check passed, but good for robustness
            return res.status(404).json({ error: "Vendor not found or already deleted." });
        }

        return res.status(200).json({ message: "Vendor deleted successfully." });
    } catch (error) {
        console.error("Error deleting vendor:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

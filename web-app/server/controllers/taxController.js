import {
    getTaxes, addTax, updateTax, removeTax,
    getDefaultTaxPreference, setDefaultTaxPreference, getTaxById
} from "../models/taxModel.js";
import { logActivity } from "../models/activityLogModel.js";

/**
 * Get all taxes
 */
const getAllTaxes = async (req, res) => {
    try {
        const taxes = await getTaxes();
        res.status(200).json({ taxes });
    } catch (error) {
        console.error("Error in getAllTaxes:", error);
        res.status(500).json({ error: error.message || "Failed to fetch taxes" });
    }
};

/**
 * Get tax by ID
 */
const getTaxByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const tax = await getTaxById(id);
        
        if (!tax) {
            return res.status(404).json({ error: "Tax not found" });
        }
        
        res.status(200).json({ tax });
    } catch (error) {
        console.error("Error in getTaxByIdController:", error);
        res.status(500).json({ error: error.message || "Failed to fetch tax" });
    }
};

/**
 * Create a new tax entry
 */
const createTax = async (req, res) => {
    try {
        const { taxName, taxType, taxRate, description } = req.body;

        // Validation
        if (!taxName || !taxType || taxRate === undefined || taxRate === null) {
            return res.status(400).json({ error: "Missing required fields: taxName, taxType, taxRate" });
        }

        if (isNaN(taxRate) || taxRate < 0) {
            return res.status(400).json({ error: "Tax rate must be a non-negative number" });
        }

        const validTypes = ['CGST', 'SGST', 'IGST', 'SEZ', 'NO_TAX'];
        if (!validTypes.includes(taxType)) {
            return res.status(400).json({ error: "Invalid tax type. Must be one of: CGST, SGST, IGST, SEZ, NO_TAX" });
        }

        const result = await addTax({ taxName, taxType, taxRate, description });

        // Log activity
        if (req.user && req.user.username) {
            await logActivity({ username: req.user.username, action: 'CREATE_TAX', resourceType: 'Tax', details: { taxName, taxType, taxRate, description } });
        }

        res.status(201).json({ 
            message: "Tax added successfully", 
            tax: result 
        });
    } catch (error) {
        console.error("Error in createTax:", error);
        res.status(400).json({ error: error.message || "Failed to add tax" });
    }
};

/**
 * Edit an existing tax entry
 */
const editTax = async (req, res) => {
    try {
        const { id } = req.params;
        const { taxName, taxType, taxRate, description } = req.body;

        // Validation
        if (!taxName || !taxType || taxRate === undefined || taxRate === null) {
            return res.status(400).json({ error: "Missing required fields: taxName, taxType, taxRate" });
        }

        if (isNaN(taxRate) || taxRate < 0) {
            return res.status(400).json({ error: "Tax rate must be a non-negative number" });
        }

        const validTypes = ['CGST', 'SGST', 'IGST', 'SEZ', 'NO_TAX'];
        if (!validTypes.includes(taxType)) {
            return res.status(400).json({ error: "Invalid tax type. Must be one of: CGST, SGST, IGST, SEZ, NO_TAX" });
        }

        const result = await updateTax({ taxId: id, taxName, taxType, taxRate, description });

        // Log activity
        if (req.user && req.user.username) {
            await logActivity({ username: req.user.username, action: 'UPDATE_TAX', resourceType: 'Tax', resourceId: id, details: { taxName, taxType, taxRate, description } });
        }

        res.status(200).json({ 
            message: "Tax updated successfully", 
            tax: result 
        });
    } catch (error) {
        console.error("Error in editTax:", error);
        res.status(400).json({ error: error.message || "Failed to update tax" });
    }
};

/**
 * Delete a tax entry
 */
const deleteTax = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: "Tax ID is required" });
        }

        await removeTax(id);

        // Log activity
        if (req.user && req.user.username) {
            await logActivity({ username: req.user.username, action: 'DELETE_TAX', resourceType: 'Tax', resourceId: id });
        }

        res.status(200).json({ message: "Tax deleted successfully" });
    } catch (error) {
        console.error("Error in deleteTax:", error);
        res.status(400).json({ error: error.message || "Failed to delete tax" });
    }
};

/**
 * Get default tax preference
 */
const getDefaultTaxPref = async (req, res) => {
    console.log("GET /default-tax-preference - Request received");
    try {
        const pref = await getDefaultTaxPreference();
        console.log("Default tax preference:", pref);
        res.status(200).json({ defaultTaxPreference: pref });
    } catch (error) {
        console.error("Error in getDefaultTaxPref:", error);
        res.status(500).json({ error: error.message || "Failed to fetch default tax preference" });
    }
};

/**
 * Set default tax preference
 */
const setDefaultTaxPref = async (req, res) => {
    try {
        const { taxId } = req.body;
        
        if (!taxId) {
            return res.status(400).json({ error: "Tax ID is required" });
        }

        await setDefaultTaxPreference(taxId);
        
        // Get the updated default tax
        const defaultTax = await getDefaultTaxPreference();
        
        res.status(200).json({ 
            message: "Default tax preference updated",
            defaultTaxPreference: defaultTax
        });
    } catch (error) {
        console.error("Error in setDefaultTaxPref:", error);
        res.status(400).json({ error: error.message || "Failed to set default tax preference" });
    }
};

/**
 * Get all active tax rates for GST treatment selection
 */
const getAllActiveTaxRates = async (req, res) => {
    try {
        const taxes = await getTaxes();
        res.status(200).json({ taxes });
    } catch (error) {
        res.status(500).json({ error: error.message || "Failed to fetch tax rates" });
    }
};

export { 
    getAllTaxes, 
    getTaxByIdController,
    createTax, 
    editTax, 
    deleteTax, 
    getDefaultTaxPref, 
    setDefaultTaxPref,
    getAllActiveTaxRates 
};

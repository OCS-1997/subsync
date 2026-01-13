import {
    getTaxes, addTax, updateTax, removeTax,
    getDefaultTaxPreference, setDefaultTaxPreference, getTaxById,
    // tax groups
    getTaxGroups, getTaxGroupById, createTaxGroup, updateTaxGroup, deleteTaxGroup,
    // intra/inter defaults
    getDefaultTaxPreferences, setDefaultTaxPreferences,
    getTaxGroupsWithMembers
} from "../models/taxModel.js";
import { logActivity } from "../models/activityLogModel.js";

/**
 * Get all taxes
 */
const getAllTaxes = async (req, res) => {
    try {
        const includeInactive = (req.query || {}).include === 'inactive' || (req.query || {}).include === 'all';
        const taxes = await getTaxes({ includeInactive });
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
            await logActivity({ username: req.user.username, action: 'CREATE_TAX', resourceType: 'Tax', ipAddress: req.ip, details: { taxName, taxType, taxRate, description } });
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
            await logActivity({ username: req.user.username, action: 'UPDATE_TAX', resourceType: 'Tax', resourceId: id, ipAddress: req.ip, details: { taxName, taxType, taxRate, description } });
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
            await logActivity({ username: req.user.username, action: 'DELETE_TAX', ipAddress: req.ip, resourceType: 'Tax', resourceId: id });
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
    // console.log("GET /default-tax-preference - Request received");
    try {
        const pref = await getDefaultTaxPreference();
        // console.log("Default tax preference:", pref);
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

// -------------------- TAX GROUP CONTROLLERS --------------------
const getAllTaxGroupsController = async (req, res) => {
    try {
        const include = (req.query || {}).include;
        const groups = include === 'members' ? await getTaxGroupsWithMembers() : await getTaxGroups();
        res.status(200).json({ groups });
    } catch (error) {
        console.error("Error in getAllTaxGroupsController:", error);
        res.status(500).json({ error: error.message || "Failed to fetch tax groups" });
    }
};

const getTaxGroupByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const group = await getTaxGroupById(id);
        if (!group) return res.status(404).json({ error: "Tax group not found" });
        res.status(200).json({ group });
    } catch (error) {
        console.error("Error in getTaxGroupByIdController:", error);
        res.status(500).json({ error: error.message || "Failed to fetch tax group" });
    }
};

const createTaxGroupController = async (req, res) => {
    try {
        const { groupName, description, taxIds } = req.body;
        if (!groupName) return res.status(400).json({ error: "Group name is required" });
        const group = await createTaxGroup({ groupName, description, taxIds });
        if (req.user && req.user.username) {
            await logActivity({ username: req.user.username, action: 'CREATE_TAX_GROUP', resourceType: 'TaxGroup', ipAddress: req.ip, resourceId: group.group_id, details: { groupName, taxIds } });
        }
        res.status(201).json({ message: "Tax group created successfully", group });
    } catch (error) {
        console.error("Error in createTaxGroupController:", error);
        res.status(400).json({ error: error.message || "Failed to create tax group" });
    }
};

const updateTaxGroupController = async (req, res) => {
    try {
        const { id } = req.params;
        const { groupName, description, taxIds } = req.body;
        const group = await updateTaxGroup(id, { groupName, description, taxIds });
        if (req.user && req.user.username) {
            await logActivity({ username: req.user.username, action: 'UPDATE_TAX_GROUP', resourceType: 'TaxGroup', resourceId: id, ipAddress: req.ip, details: { groupName, taxIds } });
        }
        res.status(200).json({ message: "Tax group updated successfully", group });
    } catch (error) {
        console.error("Error in updateTaxGroupController:", error);
        res.status(400).json({ error: error.message || "Failed to update tax group" });
    }
};

const deleteTaxGroupController = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteTaxGroup(id);
        if (req.user && req.user.username) {
            await logActivity({ username: req.user.username, action: 'DELETE_TAX_GROUP', resourceType: 'TaxGroup', ipAddress: req.ip, resourceId: id });
        }
        res.status(200).json({ message: "Tax group deleted successfully" });
    } catch (error) {
        console.error("Error in deleteTaxGroupController:", error);
        res.status(400).json({ error: error.message || "Failed to delete tax group" });
    }
};

// -------------------- INTRA/INTER DEFAULTS --------------------
const getDefaultTaxPreferencesController = async (req, res) => {
    try {
        const prefs = await getDefaultTaxPreferences();
        res.status(200).json({ preferences: prefs });
    } catch (error) {
        console.error("Error in getDefaultTaxPreferencesController:", error);
        res.status(500).json({ error: error.message || "Failed to fetch default tax preferences" });
    }
};

const setDefaultTaxPreferencesController = async (req, res) => {
    try {
        const { intra, inter } = req.body;
        await setDefaultTaxPreferences({ intra: intra || null, inter: inter || null });
        const updated = await getDefaultTaxPreferences();
        if (req.user && req.user.username) {
            await logActivity({ username: req.user.username, action: 'SET_DEFAULT_TAX_PREFERENCES', resourceType: 'TaxPreference', ipAddress: req.ip, details: updated });
        }
        res.status(200).json({ message: "Default tax preferences updated", preferences: updated });
    } catch (error) {
        console.error("Error in setDefaultTaxPreferencesController:", error);
        res.status(400).json({ error: error.message || "Failed to set default tax preferences" });
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
    getAllActiveTaxRates,
    // tax groups
    getAllTaxGroupsController,
    getTaxGroupByIdController,
    createTaxGroupController,
    updateTaxGroupController,
    deleteTaxGroupController,
    // intra/inter defaults
    getDefaultTaxPreferencesController,
    setDefaultTaxPreferencesController
};

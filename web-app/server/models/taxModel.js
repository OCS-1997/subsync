import appDB from "../db/subsyncDB.js";
import { getCurrentTime } from "../middlewares/time.js";
import { generateID } from "../middlewares/generateID.js";

// Fetch all taxes
async function getTaxes() {
    try {
        const [rows] = await appDB.query(
            "SELECT * FROM tax_rates WHERE is_active = TRUE ORDER BY created_at DESC"
        );
        return rows;
    } catch (error) {
        console.error("Error fetching taxes:", error);
        throw new Error("Failed to fetch taxes");
    }
}

// Add a new tax
async function addTax({ taxName, taxType, taxRate, description = "" }) {
    if (!taxName || !taxType || taxRate === undefined || taxRate === null) {
        throw new Error("Tax Name, Tax Type, and Tax Rate are required fields.");
    }

    // Validate tax rate
    if (isNaN(taxRate) || taxRate < 0) {
        throw new Error("Tax rate must be a non-negative number.");
    }

    // Validate tax type
    const validTypes = ['CGST', 'SGST', 'IGST', 'SEZ', 'NO_TAX'];
    if (!validTypes.includes(taxType)) {
        throw new Error("Invalid tax type. Must be one of: CGST, SGST, IGST, SEZ, NO_TAX");
    }

    const taxId = generateID("TID");
    const currentTime = getCurrentTime();

    try {
        const query = `
            INSERT INTO tax_rates (tax_id, tax_name, tax_type, tax_rate, description, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [taxId, taxName, taxType, parseFloat(taxRate), description, currentTime, currentTime];
        
        await appDB.execute(query, values);
        
        // Return the newly created tax
        const [newTax] = await appDB.query("SELECT * FROM tax_rates WHERE tax_id = ?", [taxId]);
        return newTax[0];
    } catch (error) {
        console.error("Error adding tax:", error);
        throw new Error("Failed to add tax");
    }
}

// Update a tax
async function updateTax({ taxId, taxName, taxType, taxRate, description = "" }) {
    if (!taxId || !taxName || !taxType || taxRate === undefined || taxRate === null) {
        throw new Error("Tax ID, Tax Name, Tax Type, and Tax Rate are required fields.");
    }

    // Validate tax rate
    if (isNaN(taxRate) || taxRate < 0) {
        throw new Error("Tax rate must be a non-negative number.");
    }

    // Validate tax type
    const validTypes = ['CGST', 'SGST', 'IGST', 'SEZ', 'NO_TAX'];
    if (!validTypes.includes(taxType)) {
        throw new Error("Invalid tax type. Must be one of: CGST, SGST, IGST, SEZ, NO_TAX");
    }

    try {
        // Check if tax exists
        const [existingTax] = await appDB.query("SELECT * FROM tax_rates WHERE tax_id = ?", [taxId]);
        if (!existingTax.length) {
            throw new Error("Tax not found");
        }

        const query = `
            UPDATE tax_rates 
            SET tax_name = ?, tax_type = ?, tax_rate = ?, description = ?, updated_at = ?
            WHERE tax_id = ?
        `;
        
        const values = [taxName, taxType, parseFloat(taxRate), description, getCurrentTime(), taxId];
        
        await appDB.execute(query, values);
        
        // Return the updated tax
        const [updatedTax] = await appDB.query("SELECT * FROM tax_rates WHERE tax_id = ?", [taxId]);
        return updatedTax[0];
    } catch (error) {
        console.error("Error updating tax:", error);
        throw new Error("Failed to update tax");
    }
}

// Remove a tax (soft delete)
async function removeTax(taxId) {
    if (!taxId) {
        throw new Error("Tax ID is required.");
    }

    try {
        // Check if tax exists
        const [existingTax] = await appDB.query("SELECT * FROM tax_rates WHERE tax_id = ?", [taxId]);
        if (!existingTax.length) {
            throw new Error("Tax not found");
        }

        // Check if it's the default tax
        if (existingTax[0].is_default) {
            throw new Error("Cannot delete the default tax. Please set another tax as default first.");
        }

        // Soft delete by setting is_active to false
        await appDB.execute(
            "UPDATE tax_rates SET is_active = FALSE, updated_at = ? WHERE tax_id = ?",
            [getCurrentTime(), taxId]
        );
        
        return true;
    } catch (error) {
        console.error("Error removing tax:", error);
        throw new Error("Failed to remove tax");
    }
}

// Get default tax preference
async function getDefaultTaxPreference() {
    try {
        const [rows] = await appDB.query(
            "SELECT * FROM tax_rates WHERE is_default = TRUE AND is_active = TRUE LIMIT 1"
        );
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("Error fetching default tax preference:", error);
        throw new Error("Failed to fetch default tax preference");
    }
}

// Set default tax preference
async function setDefaultTaxPreference(taxId) {
    if (!taxId) {
        throw new Error("Tax ID is required.");
    }

    try {
        // Check if tax exists and is active
        const [existingTax] = await appDB.query(
            "SELECT * FROM tax_rates WHERE tax_id = ? AND is_active = TRUE",
            [taxId]
        );
        if (!existingTax.length) {
            throw new Error("Tax not found or inactive");
        }

        // Remove current default
        await appDB.execute("UPDATE tax_rates SET is_default = FALSE WHERE is_default = TRUE");
        
        // Set new default
        await appDB.execute(
            "UPDATE tax_rates SET is_default = TRUE, updated_at = ? WHERE tax_id = ?",
            [getCurrentTime(), taxId]
        );
        
        return true;
    } catch (error) {
        console.error("Error setting default tax preference:", error);
        throw new Error("Failed to set default tax preference");
    }
}

// Get tax by ID
async function getTaxById(taxId) {
    try {
        const [rows] = await appDB.query(
            "SELECT * FROM tax_rates WHERE tax_id = ? AND is_active = TRUE",
            [taxId]
        );
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("Error fetching tax by ID:", error);
        throw new Error("Failed to fetch tax");
    }
}

// Get GST settings
async function getGSTSettings() {
    try {
        const [rows] = await appDB.query(
            "SELECT setting_value FROM tax_settings WHERE setting_key = 'gst_settings' LIMIT 1"
        );
        if (!rows.length) {
            return {
                gst_enabled: true,
                gst_threshold: 20000,
                reverse_charge: false
            };
        }
        
        let settings = rows[0].setting_value;
        if (Buffer.isBuffer(settings)) {
            settings = settings.toString("utf8");
        }
        if (typeof settings === "string") {
            settings = JSON.parse(settings);
        }
        
        return settings;
    } catch (error) {
        console.error("Error fetching GST settings:", error);
        throw new Error("Failed to fetch GST settings");
    }
}

// Update GST settings
async function updateGSTSettings(settings) {
    try {
        const currentTime = getCurrentTime();
        
        await appDB.execute(
            `INSERT INTO tax_settings (setting_id, setting_key, setting_value, created_at, updated_at) 
             VALUES (?, 'gst_settings', ?, ?, ?) 
             ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = ?`,
            [
                generateID("SET"),
                JSON.stringify(settings),
                currentTime,
                currentTime,
                JSON.stringify(settings),
                currentTime
            ]
        );
        
        return true;
    } catch (error) {
        console.error("Error updating GST settings:", error);
        throw new Error("Failed to update GST settings");
    }
}

export { 
    getTaxes, 
    addTax, 
    updateTax, 
    removeTax, 
    getDefaultTaxPreference, 
    setDefaultTaxPreference,
    getTaxById,
    getGSTSettings,
    updateGSTSettings
};

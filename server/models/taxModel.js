import appDB from "../db/subsyncDB.js";
import { getCurrentTime } from "../middlewares/time.js";
import { generateID } from "../middlewares/generateID.js";

// Fetch taxes (active by default)
async function getTaxes(options = {}) {
    const includeInactive = !!options.includeInactive;
    try {
        const query = includeInactive
            ? "SELECT * FROM tax_rates ORDER BY created_at DESC"
            : "SELECT * FROM tax_rates WHERE is_active = TRUE ORDER BY created_at DESC";
        const [rows] = await appDB.query(query);
        return rows;
    } catch (error) {
        console.error("Error fetching taxes:", error);
        throw new Error("Failed to fetch taxes");
    }
}

// -------------------- TAX GROUPS --------------------
// Get all tax groups (with optional member aggregation)
async function getTaxGroups() {
    try {
        const [groups] = await appDB.query(
            "SELECT * FROM tax_groups WHERE is_active = TRUE ORDER BY created_at DESC"
        );
        return groups;
    } catch (error) {
        console.error("Error fetching tax groups:", error);
        throw new Error("Failed to fetch tax groups");
    }
}

// Get all tax groups with member taxes included
async function getTaxGroupsWithMembers() {
    try {
        const [groups] = await appDB.query(
            "SELECT * FROM tax_groups WHERE is_active = TRUE ORDER BY created_at DESC"
        );
        if (groups.length === 0) return [];
        const groupIds = groups.map(g => g.group_id);
        const [rows] = await appDB.query(
            `SELECT m.group_id, t.tax_id, t.tax_name, t.tax_type, t.tax_rate
             FROM tax_group_members m
             JOIN tax_rates t ON t.tax_id = m.tax_id AND t.is_active = TRUE
             WHERE m.group_id IN (?)`,
            [groupIds]
        );
        const groupIdToMembers = new Map();
        for (const g of groups) groupIdToMembers.set(g.group_id, []);
        for (const r of rows) {
            groupIdToMembers.get(r.group_id).push({ tax_id: r.tax_id, tax_name: r.tax_name, tax_type: r.tax_type, tax_rate: r.tax_rate });
        }
        return groups.map(g => ({ ...g, members: groupIdToMembers.get(g.group_id) }));
    } catch (error) {
        console.error("Error fetching tax groups with members:", error);
        throw new Error("Failed to fetch tax groups with members");
    }
}

// Get tax group by id with members
async function getTaxGroupById(groupId) {
    try {
        const [groups] = await appDB.query(
            "SELECT * FROM tax_groups WHERE group_id = ? AND is_active = TRUE",
            [groupId]
        );
        if (!groups.length) return null;
        const group = groups[0];
        const [members] = await appDB.query(
            `SELECT m.tax_id, t.tax_name, t.tax_type, t.tax_rate
             FROM tax_group_members m
             JOIN tax_rates t ON t.tax_id = m.tax_id
             WHERE m.group_id = ? AND t.is_active = TRUE`,
            [groupId]
        );
        group.members = members;
        return group;
    } catch (error) {
        console.error("Error fetching tax group by id:", error);
        throw new Error("Failed to fetch tax group");
    }
}

// Create tax group (with member tax_ids array)
async function createTaxGroup({ groupName, description = "", taxIds = [] }) {
    if (!groupName) throw new Error("Group name is required.");
    const groupId = generateID("TGR");
    const now = getCurrentTime();
    const connection = appDB;
    try {
        await connection.execute(
            `INSERT INTO tax_groups (group_id, group_name, description, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)`,
            [groupId, groupName, description, now, now]
        );
        if (Array.isArray(taxIds) && taxIds.length > 0) {
            const values = taxIds.map(tid => [groupId, tid]);
            await connection.query(
                "INSERT IGNORE INTO tax_group_members (group_id, tax_id) VALUES ?",
                [values]
            );
        }
        return await getTaxGroupById(groupId);
    } catch (error) {
        console.error("Error creating tax group:", error);
        throw new Error("Failed to create tax group");
    }
}

// Update tax group (name/description and full member replacement)
async function updateTaxGroup(groupId, { groupName, description = "", taxIds }) {
    if (!groupId) throw new Error("Group ID is required.");
    const now = getCurrentTime();
    try {
        // Ensure exists
        const existing = await getTaxGroupById(groupId);
        if (!existing) throw new Error("Tax group not found");
        if (groupName || description !== undefined) {
            await appDB.execute(
                `UPDATE tax_groups SET group_name = COALESCE(?, group_name), description = COALESCE(?, description), updated_at = ? WHERE group_id = ?`,
                [groupName || null, description, now, groupId]
            );
        }
        if (Array.isArray(taxIds)) {
            // Replace members
            await appDB.execute("DELETE FROM tax_group_members WHERE group_id = ?", [groupId]);
            if (taxIds.length > 0) {
                const values = taxIds.map(tid => [groupId, tid]);
                await appDB.query(
                    "INSERT IGNORE INTO tax_group_members (group_id, tax_id) VALUES ?",
                    [values]
                );
            }
        }
        return await getTaxGroupById(groupId);
    } catch (error) {
        console.error("Error updating tax group:", error);
        throw new Error("Failed to update tax group");
    }
}

// Soft delete tax group
async function deleteTaxGroup(groupId) {
    if (!groupId) throw new Error("Group ID is required.");
    try {
        const [res] = await appDB.execute(
            "UPDATE tax_groups SET is_active = FALSE, updated_at = ? WHERE group_id = ?",
            [getCurrentTime(), groupId]
        );
        return res.affectedRows > 0;
    } catch (error) {
        console.error("Error deleting tax group:", error);
        throw new Error("Failed to delete tax group");
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

// Get default tax preference (legacy single)
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

// Set default tax preference (legacy single)
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

// New: Get default intra/inter state tax preferences
async function getDefaultTaxPreferences() {
    try {
        const [rows] = await appDB.query(
            "SELECT setting_value FROM tax_settings WHERE setting_key = 'default_tax_preference' LIMIT 1"
        );
        if (!rows.length) return { intra: null, inter: null };
        let settings = rows[0].setting_value;
        if (Buffer.isBuffer(settings)) settings = settings.toString("utf8");
        if (typeof settings === "string") settings = JSON.parse(settings);
        return settings;
    } catch (error) {
        console.error("Error fetching default tax preferences:", error);
        throw new Error("Failed to fetch default tax preferences");
    }
}

// New: Set default intra/inter state tax preferences
// preferences: { intra: { kind: 'tax'|'group', id: 'TID..|TGR..' }, inter: { kind, id } }
async function setDefaultTaxPreferences(preferences) {
    try {
        // Optional validation: ensure referenced ids exist
        const validateRef = async (pref) => {
            if (!pref || !pref.kind || !pref.id) return true; // allow nulls
            if (pref.kind === 'tax') {
                const [t] = await appDB.query("SELECT tax_id FROM tax_rates WHERE tax_id = ? AND is_active = TRUE", [pref.id]);
                return t.length > 0;
            }
            if (pref.kind === 'group') {
                const [g] = await appDB.query("SELECT group_id FROM tax_groups WHERE group_id = ? AND is_active = TRUE", [pref.id]);
                return g.length > 0;
            }
            return false;
        };
        if (!(await validateRef(preferences.intra))) throw new Error("Invalid intra-state preference");
        if (!(await validateRef(preferences.inter))) throw new Error("Invalid inter-state preference");

        const now = getCurrentTime();
        await appDB.execute(
            `INSERT INTO tax_settings (setting_id, setting_key, setting_value, created_at, updated_at)
             VALUES (?, 'default_tax_preference', ?, ?, ?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = VALUES(updated_at)`,
            [generateID("SET"), JSON.stringify(preferences), now, now]
        );
        return true;
    } catch (error) {
        console.error("Error setting default tax preferences:", error);
        throw new Error("Failed to set default tax preferences");
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
    updateGSTSettings,
    // tax groups
    getTaxGroups,
    getTaxGroupById,
    createTaxGroup,
    updateTaxGroup,
    deleteTaxGroup,
    getTaxGroupsWithMembers,
    // default intra/inter
    getDefaultTaxPreferences,
    setDefaultTaxPreferences
};

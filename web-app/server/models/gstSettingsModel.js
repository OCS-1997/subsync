import appDB from "../db/subsyncDB.js";

// Fetch GST settings
async function getGSTSettings() {
    try {
        const [rows] = await appDB.query("SELECT * from gst_settings ");
        console.log(rows);
        return rows;
    } catch (error) {
        console.error("Error fetching GST settings:", error.message);
        throw new Error("Database query failed");
    }
}

// Update GST settings
async function updateGSTSettings(newSettings) {
    try {
        const { taxRegistrationNumberLabel, gstin, businessLegalName, businessTradeName, gstRegisteredOn } = newSettings;

        console.log("Updating GST settings with:", newSettings);

        if (!taxRegistrationNumberLabel || !gstin || !businessLegalName || !businessTradeName || !gstRegisteredOn) {
            throw new Error("All fields are required");
        }

        // Check if a row exists
        const [rows] = await appDB.query("SELECT COUNT(*) as count FROM gst_settings");
        if (rows[0].count === 0) {
            // Insert if no row exists
            const insertQuery = `
                INSERT INTO gst_settings 
                (tax_reg_num_label, gst_in, business_legal_name, business_trade_name, gst_reg_date)
                VALUES (?, ?, ?, ?, ?)
            `;
            const values = [taxRegistrationNumberLabel, gstin, businessLegalName, businessTradeName, gstRegisteredOn];
            await appDB.query(insertQuery, values);
            console.log("GST settings inserted successfully");
        } else {
            // Update if row exists
            const updateQuery = `
                UPDATE gst_settings 
                SET 
                    tax_reg_num_label = ?,
                    gst_in = ?,
                    business_legal_name = ?,
                    business_trade_name = ?,
                    gst_reg_date = ?
            `;
            const values = [taxRegistrationNumberLabel, gstin, businessLegalName, businessTradeName, gstRegisteredOn];
            await appDB.query(updateQuery, values);
            console.log("GST settings updated successfully");
        }
    } catch (error) {
        console.error("Error updating GST settings:", error.message);
        throw new Error("Database update failed");
    }
}


export { getGSTSettings, updateGSTSettings };

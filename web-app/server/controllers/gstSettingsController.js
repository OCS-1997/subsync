import { getGSTSettings, updateGSTSettings } from "../models/gstSettingsModel.js";

// Controller to get GST settings
const getGSTSettingsController = async (req, res) => {
    console.log("GET /get-gst-settings - Request received");
    try {
        const settings = await getGSTSettings();
        console.log("GST settings:", settings);
        res.status(200).json({ success: true, settings });
    } catch (error) {
        console.error("Error fetching GST settings:", error.message);
        res.status(500).json({ success: false, error: "Failed to fetch GST settings" });
    }
};

// Controller to update GST settings
const updateGSTSettingsController = async (req, res) => {
    try {
        const { taxRegistrationNumberLabel, gstin, businessLegalName, businessTradeName, gstRegisteredOn } = req.body;
        console.log("Received GST settings update request:", req.body);

        if (!taxRegistrationNumberLabel || !gstin || !businessLegalName || !businessTradeName || !gstRegisteredOn) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const newSettings = {
            taxRegistrationNumberLabel,
            gstin,
            businessLegalName,
            businessTradeName,
            gstRegisteredOn
        };

        await updateGSTSettings(newSettings);

        res.status(200).json({ message: "GST settings updated successfully" });
    } catch (error) {
        console.error("Error updating GST settings:", error.message);
        res.status(500).json({ error: "Failed to update GST settings" });
    }
};

export { getGSTSettingsController, updateGSTSettingsController };

import { UserPreferencesModel } from '../models/userPreferencesModel.js';

export const getPreference = async (req, res) => {
    try {
        const { username, key } = req.params;
        const value = await UserPreferencesModel.getPreference(username, key);
        res.json({ success: true, value });
    } catch (error) {
        console.error('Error fetching preference:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updatePreference = async (req, res) => {
    try {
        const { username, key } = req.params;
        const { value } = req.body;

        await UserPreferencesModel.updatePreference(username, key, value);
        res.json({ success: true, message: 'Preference updated successfully' });
    } catch (error) {
        console.error('Error updating preference:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

import appDB from '../db/subsyncDB.js';

export const UserPreferencesModel = {
    async getPreference(username, key) {
        const [rows] = await appDB.query(
            'SELECT preference_value FROM user_preferences WHERE username = ? AND preference_key = ?',
            [username, key]
        );
        return rows[0] ? rows[0].preference_value : null;
    },

    async updatePreference(username, key, value) {
        // Use upsert logic
        const [result] = await appDB.query(
            `INSERT INTO user_preferences (username, preference_key, preference_value) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE preference_value = VALUES(preference_value)`,
            [username, key, JSON.stringify(value)]
        );
        return result;
    }
};

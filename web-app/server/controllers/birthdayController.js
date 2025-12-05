import {
    getUpcomingBirthdays,
    getAllBirthdays,
    getBirthdayById,
    saveBirthday,
    deleteBirthday,
    syncBirthdays
} from '../models/birthdayModel.js';

/**
 * GET /api/birthdays
 * Get all birthdays with pagination and filtering
 */
export const getAllBirthdaysController = async (req, res) => {
    try {
        const { search, type, page, limit, sort, order } = req.query;
        const result = await getAllBirthdays({
            search,
            type,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 50,
            sort,
            order
        });
        res.json(result);
    } catch (error) {
        console.error('Error fetching birthdays:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch birthdays' });
    }
};

/**
 * GET /api/birthdays/upcoming
 * Get upcoming birthdays (next 7 days)
 */
export const getUpcomingBirthdaysController = async (req, res) => {
    try {
        const birthdays = await getUpcomingBirthdays();
        res.json(birthdays);
    } catch (error) {
        console.error('Error fetching upcoming birthdays:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch upcoming birthdays' });
    }
};

/**
 * GET /api/birthdays/:id
 * Get a single birthday by ID
 */
export const getBirthdayByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const birthday = await getBirthdayById(id);

        if (!birthday) {
            return res.status(404).json({ error: 'Birthday not found' });
        }

        res.json(birthday);
    } catch (error) {
        console.error('Error fetching birthday:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch birthday' });
    }
};

/**
 * POST /api/birthdays
 * Create or update a birthday record
 */
export const saveBirthdayController = async (req, res) => {
    try {
        const birthdayData = req.body;

        // Validate required fields
        if (!birthdayData.name || !birthdayData.email || !birthdayData.date_of_birth || !birthdayData.type) {
            return res.status(400).json({ error: 'Name, email, date of birth, and type are required' });
        }

        // Validate type
        if (!['user', 'customer', 'contact_person'].includes(birthdayData.type)) {
            return res.status(400).json({ error: 'Invalid type. Must be user, customer, or contact_person' });
        }

        const result = await saveBirthday(birthdayData);
        res.status(201).json({
            success: true,
            message: 'Birthday saved successfully',
            id: result
        });
    } catch (error) {
        console.error('Error saving birthday:', error);
        res.status(500).json({ error: error.message || 'Failed to save birthday' });
    }
};

/**
 * DELETE /api/birthdays/:id
 * Delete a birthday record
 */
export const deleteBirthdayController = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await deleteBirthday(id);

        if (!deleted) {
            return res.status(404).json({ error: 'Birthday not found' });
        }

        res.json({ success: true, message: 'Birthday deleted successfully' });
    } catch (error) {
        console.error('Error deleting birthday:', error);
        res.status(500).json({ error: error.message || 'Failed to delete birthday' });
    }
};

/**
 * POST /api/birthdays/sync
 * Sync birthdays from users, customers, and contact persons
 */
export const syncBirthdaysController = async (req, res) => {
    try {
        const result = await syncBirthdays();
        res.json(result);
    } catch (error) {
        console.error('Error syncing birthdays:', error);
        res.status(500).json({ error: error.message || 'Failed to sync birthdays' });
    }
};

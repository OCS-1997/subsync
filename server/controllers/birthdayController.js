import {
    getUpcomingBirthdays,
    getAllBirthdays,
    getBirthdayById,
    saveBirthday,
    updateBirthdaySource,
    deleteBirthday,
    syncBirthdays
} from '../models/birthdayModel.js';
import { sendBirthdayEmail } from '../services/birthdayService.js';

/**
 * POST /api/birthdays/:id/wish
 * Send a manual birthday wish email
 */
export const sendManualBirthdayWishController = async (req, res) => {
    try {
        const { id } = req.params;
        const birthday = await getBirthdayById(id);

        if (!birthday) {
            return res.status(404).json({ error: 'Birthday record not found' });
        }

        const result = await sendBirthdayEmail(birthday);

        if (result.success) {
            res.json({ success: true, message: 'Birthday wish sent successfully' });
        } else {
            res.status(500).json({ error: result.error || 'Failed to send birthday wish' });
        }
    } catch (error) {
        console.error('Error sending manual birthday wish:', error);
        res.status(500).json({ error: error.message || 'Failed to send birthday wish' });
    }
};

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

        const isEdit = !!birthdayData.id;

        // Fetch the EXISTING record first if editing, so we have its source links (user_id, customer_id, index)
        let existingRecord = null;
        if (isEdit) {
            existingRecord = await getBirthdayById(birthdayData.id);
            if (!existingRecord) {
                return res.status(404).json({ error: 'Birthday record not found' });
            }
        }

        const dataToSave = {
            ...birthdayData,
            // user_id should only be set for type='user' records (it's the FK to users table).
            // For customer/contact_person types, user_id is meaningless — leave it null on new records.
            // On edits, always preserve the original user_id from the existing record.
            user_id: isEdit
                ? existingRecord.user_id
                : (birthdayData.type === 'user' ? (birthdayData.user_id || null) : null),
            customer_id: birthdayData.customer_id || (existingRecord?.customer_id) || null,
            contact_person_index: (birthdayData.contact_person_index !== undefined && birthdayData.contact_person_index !== null)
                ? birthdayData.contact_person_index
                : (existingRecord?.contact_person_index ?? null)
        };

        const result = await saveBirthday(dataToSave);

        // ── Write date change back to the source table ──
        if (isEdit && existingRecord) {
            try {
                await updateBirthdaySource(existingRecord, birthdayData.date_of_birth);
            } catch (sourceErr) {
                // Log but don't fail the whole request — the birthdays table is already updated
                console.error('[Birthday] Failed to update source record:', sourceErr.message);
            }
        }

        res.status(201).json({
            success: true,
            message: isEdit ? 'Birthday updated successfully' : 'Birthday saved successfully',
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

/**
 * GET /api/birthdays/search-people?q=search_term
 * Search for people across users, customers, and contact persons
 * Used for autocomplete in birthday form
 */
export const searchPeopleController = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.json({ results: [] });
        }

        const searchTerm = `%${q.trim()}%`;
        const results = [];

        // Import database connection
        const appDB = (await import('../db/subsyncDB.js')).default;

        // 1. Search users table (for user-type birthdays)
        const [users] = await appDB.query(
            `SELECT 
                username as id,
                name,
                email,
                date_of_birth,
                'user' as type,
                NULL as customer_id,
                NULL as contact_person_index,
                NULL as company_name
            FROM users 
            WHERE (name LIKE ? OR email LIKE ?) 
            AND is_active = 1
            LIMIT 10`,
            [searchTerm, searchTerm]
        );
        results.push(...users);

        // 2. Search phone_directory (replaces searching customers + parsing other_contacts)
        // This includes customers, vendors, and all contact persons in one indexed table.
        const [dirEntries] = await appDB.query(
            `SELECT 
                entity_id as id,
                name,
                email,
                NULL as date_of_birth, 
                entity_type as type,
                CASE WHEN entity_type IN ('contact', 'other_contact') THEN parent_entity_id ELSE entity_id END as customer_id,
                NULL as contact_person_index, 
                company_name
            FROM phone_directory
            WHERE name LIKE ? OR phone_number LIKE ? OR email LIKE ?
            LIMIT 20`,
            [searchTerm, searchTerm, searchTerm]
        );

        // Map directory types to birthday types
        const mappedEntries = dirEntries.map(entry => {
            let birthType = 'customer';
            if (entry.type === 'contact' || entry.type === 'other_contact') birthType = 'contact_person';
            
            return {
                ...entry,
                type: birthType
            };
        });

        results.push(...mappedEntries);

        // Limit total results
        res.json({ results: results.slice(0, 30) });
    } catch (error) {
        console.error('Error searching people:', error);
        res.status(500).json({ error: error.message || 'Failed to search people' });
    }
};

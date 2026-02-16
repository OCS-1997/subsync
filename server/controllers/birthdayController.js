import {
    getUpcomingBirthdays,
    getAllBirthdays,
    getBirthdayById,
    saveBirthday,
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

        // user_id represents the logged-in user who is creating/editing this birthday record
        const dataToSave = {
            ...birthdayData,
            user_id: req.user.username, // The authenticated user creating this record
            customer_id: birthdayData.customer_id || null,
            contact_person_index: birthdayData.contact_person_index || null
        };

        const result = await saveBirthday(dataToSave);
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

        // Search users table
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

        // Search customers table  
        const [customers] = await appDB.query(
            `SELECT 
                customer_id as id,
                CONCAT(first_name, ' ', last_name) as name,
                primary_email as email,
                date_of_birth,
                'customer' as type,
                customer_id,
                NULL as contact_person_index,
                company_name
            FROM customers 
            WHERE (display_name LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR primary_email LIKE ?)
            AND customer_status = 'Active'
            LIMIT 10`,
            [searchTerm, searchTerm, searchTerm, searchTerm]
        );  

        //console.log(`[Birthday Search] Found ${customers.length} customers for query "${q}"`);
        results.push(...customers);

        // Search contact persons in customers' other_contacts JSON
        const [customersWithContacts] = await appDB.query(
            `SELECT 
                customer_id,
                company_name,
                other_contacts
            FROM customers 
            WHERE customer_status = 'Active'
            AND other_contacts IS NOT NULL 
            AND other_contacts != ''
            AND other_contacts != '[]'`,
            []
        );

        // Parse other_contacts and search
        for (const customer of customersWithContacts) {
            try {
                const contacts = typeof customer.other_contacts === 'string' 
                    ? JSON.parse(customer.other_contacts) 
                    : customer.other_contacts;

                if (Array.isArray(contacts)) {
                    contacts.forEach((contact, index) => {
                        const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
                        const searchQuery = q.trim().toLowerCase();
                        
                        if (
                            fullName.toLowerCase().includes(searchQuery) ||
                            (contact.email && contact.email.toLowerCase().includes(searchQuery))
                        ) {
                            results.push({
                                id: `${customer.customer_id}_${index}`,
                                name: fullName,
                                email: contact.email || '',
                                date_of_birth: contact.date_of_birth || null,
                                type: 'contact_person',
                                customer_id: customer.customer_id,
                                contact_person_index: index,
                                company_name: customer.customer_name
                            });
                        }
                    });
                }
            } catch (parseError) {
                console.error(`Error parsing other_contacts for customer ${customer.customer_id}:`, parseError);
            }
        }

        // Limit total results
        const limitedResults = results.slice(0, 30);

        res.json({ results: limitedResults });
    } catch (error) {
        console.error('Error searching people:', error);
        res.status(500).json({ error: error.message || 'Failed to search people' });
    }
};

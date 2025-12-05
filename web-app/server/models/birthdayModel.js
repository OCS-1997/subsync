import appDB from "../db/subsyncDB.js";

/**
 * Get birthdays for today and upcoming (next 7 days)
 * Includes users, customers, and contact persons
 */
export async function getUpcomingBirthdays() {
    const today = new Date();
    const todayMonth = today.getMonth() + 1; // 1-12
    const todayDay = today.getDate();
    const todayYear = today.getFullYear();

    // Get user birthdays
    const [allUsers] = await appDB.query(
        `SELECT username, name, email, date_of_birth
         FROM users
         WHERE date_of_birth IS NOT NULL`
    );

    // Get customer birthdays
    const [allCustomers] = await appDB.query(
        `SELECT customer_id, 
                CONCAT(first_name, ' ', last_name) AS name,
                primary_email AS email,
                date_of_birth,
                company_name
         FROM customers
         WHERE date_of_birth IS NOT NULL`
    );

    // Get customers with contact persons who have birthdays
    const [customersWithContacts] = await appDB.query(
        `SELECT customer_id, 
                company_name,
                other_contacts
         FROM customers
         WHERE other_contacts IS NOT NULL 
         AND other_contacts != '[]'
         AND other_contacts != ''`
    );

    // Process contact persons
    const contactPersonBirthdays = [];
    customersWithContacts.forEach(customer => {
        try {
            const contacts = typeof customer.other_contacts === 'string'
                ? JSON.parse(customer.other_contacts)
                : customer.other_contacts;

            if (Array.isArray(contacts)) {
                contacts.forEach((contact, index) => {
                    if (contact.birthday) {
                        contactPersonBirthdays.push({
                            customer_id: customer.customer_id,
                            company_name: customer.company_name,
                            contact_person_index: index,
                            name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
                            email: contact.email,
                            date_of_birth: contact.birthday,
                            designation: contact.designation || '',
                            phone_number: contact.phone_number || ''
                        });
                    }
                });
            }
        } catch (error) {
            console.error(`Error parsing contacts for customer ${customer.customer_id}:`, error);
        }
    });

    // Process birthdays in JavaScript for better date handling
    const processBirthdays = (people, type) => {
        return people.map(person => {
            const dob = new Date(person.date_of_birth);
            const dobMonth = dob.getMonth() + 1;
            const dobDay = dob.getDate();

            // Calculate next birthday
            let nextBirthday = new Date(todayYear, dobMonth - 1, dobDay);
            if (nextBirthday < today) {
                nextBirthday = new Date(todayYear + 1, dobMonth - 1, dobDay);
            }

            const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
            const isToday = daysUntil === 0;

            return {
                ...person,
                type,
                birthday_status: isToday ? 'today' : 'upcoming',
                days_until: daysUntil
            };
        }).filter(b => b.days_until <= 7 && b.days_until >= 0)
            .sort((a, b) => {
                if (a.birthday_status === 'today' && b.birthday_status !== 'today') return -1;
                if (a.birthday_status !== 'today' && b.birthday_status === 'today') return 1;
                return a.days_until - b.days_until;
            });
    };

    const userBirthdays = processBirthdays(allUsers, 'user');
    const customerBirthdays = processBirthdays(allCustomers, 'customer');
    const contactBirthdays = processBirthdays(contactPersonBirthdays, 'contact_person');

    const allBirthdays = [...userBirthdays, ...customerBirthdays, ...contactBirthdays];

    return {
        today: allBirthdays.filter(b => b.birthday_status === 'today'),
        upcoming: allBirthdays.filter(b => b.birthday_status === 'upcoming')
    };
}

/**
 * Save or update birthday record
 */
export async function saveBirthday(birthdayData) {
    const { user_id, customer_id, contact_person_index, date_of_birth, email, name, type, email_send, include_in_communication } = birthdayData;

    const [result] = await appDB.query(
        `INSERT INTO birthdays (user_id, customer_id, contact_person_index, date_of_birth, email, name, type, email_send, include_in_communication)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            date_of_birth = VALUES(date_of_birth),
            email = VALUES(email),
            name = VALUES(name),
            email_send = VALUES(email_send),
            include_in_communication = VALUES(include_in_communication),
            updated_at = CURRENT_TIMESTAMP`,
        [user_id || null, customer_id || null, contact_person_index || null, date_of_birth, email, name, type, email_send ? 1 : 0, include_in_communication ? 1 : 0]
    );

    return result.insertId || result.affectedRows;
}

/**
 * Get all birthdays with pagination and filtering
 */
export async function getAllBirthdays({ search = '', type = '', page = 1, limit = 50, sort = 'date_of_birth', order = 'asc' }) {
    const offset = (page - 1) * limit;
    const searchQuery = `%${search}%`;

    let whereConditions = [];
    let queryParams = [];

    if (search) {
        whereConditions.push('(b.name LIKE ? OR b.email LIKE ?)');
        queryParams.push(searchQuery, searchQuery);
    }

    if (type && ['user', 'customer', 'contact_person'].includes(type)) {
        whereConditions.push('b.type = ?');
        queryParams.push(type);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const allowedSortColumns = ['name', 'email', 'date_of_birth', 'type', 'created_at'];
    const sortColumn = allowedSortColumns.includes(sort) ? sort : 'date_of_birth';
    const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const [birthdays] = await appDB.query(
        `SELECT b.*, 
                c.company_name,
                u.name as user_name
         FROM birthdays b
         LEFT JOIN customers c ON b.customer_id = c.customer_id
         LEFT JOIN users u ON b.user_id = u.username
         ${whereClause}
         ORDER BY ${sortColumn} ${sortOrder}
         LIMIT ? OFFSET ?`,
        [...queryParams, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await appDB.query(
        `SELECT COUNT(*) as total FROM birthdays b ${whereClause}`,
        queryParams
    );

    const totalPages = Math.ceil(total / limit);
    return { birthdays, totalPages, totalRecords: total };
}

/**
 * Sync birthdays from users, customers, and contact persons tables
 */
export async function syncBirthdays() {
    try {
        // Clear existing birthdays
        await appDB.query('DELETE FROM birthdays');

        // Sync user birthdays
        const [users] = await appDB.query(
            `SELECT username, name, email, date_of_birth
             FROM users
             WHERE date_of_birth IS NOT NULL`
        );

        for (const user of users) {
            await saveBirthday({
                user_id: user.username,
                customer_id: null,
                contact_person_index: null,
                date_of_birth: user.date_of_birth,
                email: user.email,
                name: user.name,
                type: 'user',
                email_send: true,
                include_in_communication: true
            });
        }

        // Sync customer birthdays
        const [customers] = await appDB.query(
            `SELECT customer_id, 
                    CONCAT(first_name, ' ', last_name) AS name,
                    primary_email AS email,
                    date_of_birth
             FROM customers
             WHERE date_of_birth IS NOT NULL`
        );

        for (const customer of customers) {
            await saveBirthday({
                user_id: null,
                customer_id: customer.customer_id,
                contact_person_index: null,
                date_of_birth: customer.date_of_birth,
                email: customer.email,
                name: customer.name,
                type: 'customer',
                email_send: true,
                include_in_communication: true
            });
        }

        // Sync contact person birthdays
        const [customersWithContacts] = await appDB.query(
            `SELECT customer_id, other_contacts
             FROM customers
             WHERE other_contacts IS NOT NULL 
             AND other_contacts != '[]'
             AND other_contacts != ''`
        );

        for (const customer of customersWithContacts) {
            try {
                const contacts = typeof customer.other_contacts === 'string'
                    ? JSON.parse(customer.other_contacts)
                    : customer.other_contacts;

                if (Array.isArray(contacts)) {
                    for (let index = 0; index < contacts.length; index++) {
                        const contact = contacts[index];
                        if (contact.birthday) {
                            await saveBirthday({
                                user_id: null,
                                customer_id: customer.customer_id,
                                contact_person_index: index,
                                date_of_birth: contact.birthday,
                                email: contact.email,
                                name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
                                type: 'contact_person',
                                email_send: contact.email_send !== false,
                                include_in_communication: contact.include_in_communication !== false
                            });
                        }
                    }
                }
            } catch (error) {
                console.error(`Error syncing contacts for customer ${customer.customer_id}:`, error);
            }
        }

        return { success: true, message: 'Birthdays synced successfully' };
    } catch (error) {
        console.error('Error syncing birthdays:', error);
        throw error;
    }
}

/**
 * Delete a birthday record
 */
export async function deleteBirthday(birthdayId) {
    const [result] = await appDB.query(
        'DELETE FROM birthdays WHERE id = ?',
        [birthdayId]
    );
    return result.affectedRows > 0;
}

/**
 * Get birthday by ID
 */
export async function getBirthdayById(birthdayId) {
    const [result] = await appDB.query(
        `SELECT b.*, 
                c.company_name,
                u.name as user_name
         FROM birthdays b
         LEFT JOIN customers c ON b.customer_id = c.customer_id
         LEFT JOIN users u ON b.user_id = u.username
         WHERE b.id = ?`,
        [birthdayId]
    );
    return result[0];
}


import appDB from "../db/subsyncDB.js";

/**
 * Get birthdays for today and upcoming (next 7 days)
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
                date_of_birth
         FROM customers
         WHERE date_of_birth IS NOT NULL`
    );

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

    return {
        today: [...userBirthdays, ...customerBirthdays].filter(b => b.birthday_status === 'today'),
        upcoming: [...userBirthdays, ...customerBirthdays].filter(b => b.birthday_status === 'upcoming')
    };
}

/**
 * Save or update birthday record
 */
export async function saveBirthday(birthdayData) {
    const { user_id, customer_id, date_of_birth, email, name, type, email_send, include_in_communication } = birthdayData;

    const [result] = await appDB.query(
        `INSERT INTO birthdays (user_id, customer_id, date_of_birth, email, name, type, email_send, include_in_communication)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            date_of_birth = VALUES(date_of_birth),
            email = VALUES(email),
            name = VALUES(name),
            email_send = VALUES(email_send),
            include_in_communication = VALUES(include_in_communication),
            updated_at = CURRENT_TIMESTAMP`,
        [user_id || null, customer_id || null, date_of_birth, email, name, type, email_send ? 1 : 0, include_in_communication ? 1 : 0]
    );

    return result.insertId || result.affectedRows;
}


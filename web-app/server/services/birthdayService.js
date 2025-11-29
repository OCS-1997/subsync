import { renderEmailTemplate, sendEmail } from './emailService.js';
import { getUpcomingBirthdays } from '../models/birthdayModel.js';
import { getCustomerById } from '../models/customerModel.js';
import appDB from '../db/subsyncDB.js';

/**
 * Send birthday email to a person
 * @param {Object} person - Person object with name, email, type, etc.
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function sendBirthdayEmail(person) {
    try {
        if (!person.email_send) {
            return { success: false, error: 'Email sending disabled for this person' };
        }

        // Build template context
        const context = {
            name: person.name,
            email: person.email,
            isCustomer: person.type === 'customer',
            isUser: person.type === 'user',
            type: person.type
        };

        // Render birthday template
        const { subject, html } = await renderEmailTemplate('birthday_wish', context);

        // Send email
        const result = await sendEmail({
            to: person.email,
            subject,
            html
        });

        return result;
    } catch (error) {
        console.error(`Error sending birthday email to ${person.email}:`, error);
        return {
            success: false,
            error: error.message || 'Unknown error'
        };
    }
}

/**
 * Send birthday emails for today's birthdays
 * @returns {Promise<{sent: number, failed: number, errors: Array}>}
 */
export async function sendTodayBirthdayEmails() {
    try {
        const birthdays = await getUpcomingBirthdays();
        const todayBirthdays = birthdays.today || [];

        const results = {
            sent: 0,
            failed: 0,
            errors: []
        };

        for (const person of todayBirthdays) {
            if (!person.email_send) {
                continue; // Skip if email sending is disabled
            }

            const result = await sendBirthdayEmail(person);

            if (result.success) {
                results.sent++;
            } else {
                results.failed++;
                results.errors.push({
                    name: person.name,
                    email: person.email,
                    error: result.error
                });
            }
        }

        return results;
    } catch (error) {
        console.error('Error sending today\'s birthday emails:', error);
        return {
            sent: 0,
            failed: 0,
            errors: [{ error: error.message || 'Unknown error' }]
        };
    }
}

/**
 * Sync birthdays from users and customers tables to birthdays table
 * This should be called when user/customer data is updated
 */
export async function syncBirthdays() {
    try {
        // Sync user birthdays
        const [users] = await appDB.query(
            `SELECT username, name, email, date_of_birth
             FROM users
             WHERE date_of_birth IS NOT NULL`
        );

        for (const user of users) {
            await appDB.query(
                `INSERT INTO birthdays (user_id, date_of_birth, email, name, type, email_send, include_in_communication)
                 VALUES (?, ?, ?, ?, 'user', 1, 1)
                 ON DUPLICATE KEY UPDATE
                    date_of_birth = VALUES(date_of_birth),
                    email = VALUES(email),
                    name = VALUES(name),
                    updated_at = CURRENT_TIMESTAMP`,
                [user.username, user.date_of_birth, user.email, user.name]
            );
        }

        // Sync customer birthdays
        const [customers] = await appDB.query(
            `SELECT customer_id, CONCAT(first_name, ' ', last_name) AS name, primary_email, date_of_birth
             FROM customers
             WHERE date_of_birth IS NOT NULL`
        );

        for (const customer of customers) {
            await appDB.query(
                `INSERT INTO birthdays (customer_id, date_of_birth, email, name, type, email_send, include_in_communication)
                 VALUES (?, ?, ?, ?, 'customer', 1, 1)
                 ON DUPLICATE KEY UPDATE
                    date_of_birth = VALUES(date_of_birth),
                    email = VALUES(email),
                    name = VALUES(name),
                    updated_at = CURRENT_TIMESTAMP`,
                [customer.customer_id, customer.date_of_birth, customer.primary_email, customer.name]
            );
        }

        return { success: true };
    } catch (error) {
        console.error('Error syncing birthdays:', error);
        throw error;
    }
}


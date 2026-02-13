import appDB from "../db/subsyncDB.js";
import { getCurrentTime } from "../middlewares/time.js";
import { generateID } from "../middlewares/generateID.js";
import { isValidGSTIN, isValidEmail, isValidPhoneNumber, normalizePhoneNumber } from "../middlewares/validations.js";

const sanitizePhoneNumber = (value) => normalizePhoneNumber(value);

const sanitizeContactPersons = (contacts = []) => {
    if (!Array.isArray(contacts)) return [];
    return contacts.map((person = {}) => ({
        ...person,
        phone_number: sanitizePhoneNumber(person.phone_number || person.phoneNumber || ""),
        country_code: person.country_code || "+91",
    }));
};

const normalizeAddressValue = (value) => {
    if (!value) return "";
    if (typeof value === "object") {
        return value.value || value.label || "";
    }
    return String(value);
};

/**
 * Function to add a customer into the database
 * @param   {Object}          customer The object with customer details
 * @returns {Promise<number>}
 */
async function addCustomer(customer) {
    try {
        const normalizedAddress = {
            ...(customer.address || {}),
            country: normalizeAddressValue(customer.address?.country || "IN"),
            state: normalizeAddressValue(customer.address?.state),
        };
        const primaryPhone = sanitizePhoneNumber(customer.phoneNumber);
        const secondaryPhone = sanitizePhoneNumber(customer.secondaryPhoneNumber);
        const contactPersons = sanitizeContactPersons(customer.contactPersons || []);

        // Validate required fields
        if (!customer.salutation || !customer.firstName|| !customer.email || !primaryPhone || !normalizedAddress ||
            !normalizedAddress.state || !customer.companyName || !customer.displayName || !customer.gstin || !customer.currencyCode || !customer.gst_treatment || !customer.tax_preference) {
            throw new Error("All required fields must be provided.");
        }

        if (!isValidGSTIN(customer.gstin)) {
            throw new Error("Invalid GSTIN format.");
        }

        if (!isValidEmail(customer.email)) {
            throw new Error("Invalid email address format.");
        }

        if (customer.secondary_email && !isValidEmail(customer.secondary_email)) {
            throw new Error("Invalid secondary email address format.");
        }

        if (!isValidPhoneNumber(primaryPhone)) {
            throw new Error("Invalid primary phone number format.");
        }

        if (secondaryPhone && !isValidPhoneNumber(secondaryPhone)) {
            throw new Error("Invalid secondary phone number format.");
        }

        // Additional address validation
        if (!normalizedAddress.state || !normalizedAddress.state.trim()) {
            throw new Error("State cannot be empty in the address.");
        }

        // Check for duplicate display_name (case-insensitive)
        const [existing] = await appDB.query(
            "SELECT 1 FROM customers WHERE LOWER(display_name) = LOWER(?) LIMIT 1",
            [customer.displayName]
        );
        if (existing.length > 0) {
            throw new Error("A customer with this name already exists.");
        }

        const currentTime = getCurrentTime();
        const cid = generateID("CID");

        // Serialize JSON fields
        const customerAddress = JSON.stringify(normalizedAddress);
        const otherContacts = JSON.stringify(contactPersons);
        const paymentTerms = JSON.stringify(customer.payment_terms) || JSON.stringify({ term_name: "Due on Receipt", days: 0, is_default: true });

        // Execute SQL query
        const [result] = await appDB.query(
            "INSERT INTO customers (customer_id, salutation, first_name, last_name, primary_email, secondary_email, country_code, primary_phone_number, secondary_phone_number, " +
            "customer_address, other_contacts, company_name, display_name, gst_in, currency_code, gst_treatment, tax_preference, exemption_reason, " +
            "payment_terms, notes, customer_status, created_at, updated_at) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
            [
                cid, customer.salutation, customer.firstName, customer.lastName, customer.email,
                customer.secondary_email || null,
                customer.country_code,
                primaryPhone,
                secondaryPhone || null,
                customerAddress, otherContacts, customer.companyName, customer.displayName, customer.gstin,
                customer.currencyCode, customer.gst_treatment, customer.tax_preference, customer.exemption_reason || "",
                paymentTerms, customer.notes || "", customer.customerStatus, currentTime, currentTime,
            ]
        );

        // Check result
        if (result.affectedRows > 0) {
            return result.insertId;
        } else {
            throw new Error("Failed to add customer. No rows affected.");
        }
    } catch (error) {
        if (error.code === 'ER_BAD_NULL_ERROR') {
            throw new Error("One or more fields cannot be null.");
        } else {
            console.error("Database error:", error);
            throw new Error(error.message || "An unexpected error occurred while adding the customer.");
        }
    }
}


/**
 * Function to edit/update a customer's details in the database
 * @param   {string}     customerId  The ID of the customer, whose details are to be updated
 * @param   {Object}     updatedData The object containing the new customer details
 * @returns {Promise<*>}
 */
async function updateCustomer(customerId, updatedData) {
    const {
        salutation, first_name, last_name, primary_email, secondary_email, country_code, primary_phone_number, secondary_phone_number,
        customer_address, company_name, display_name, gst_in, currency_code, gst_treatment, other_contacts,
        tax_preference, exemption_reason, payment_terms, notes, customer_status
    } = updatedData;

    // console.log("Updated data received:", updatedData);
    const normalizedPrimaryPhone = sanitizePhoneNumber(primary_phone_number);
    const normalizedSecondaryPhone = sanitizePhoneNumber(secondary_phone_number);
    const normalizedAddress = {
        ...(customer_address || {}),
        country: normalizeAddressValue(customer_address?.country),
        state: normalizeAddressValue(customer_address?.state),
    };
    const sanitizedContacts = sanitizeContactPersons(other_contacts || []);

    // Validation
    if (!salutation || !first_name || !primary_email || !normalizedPrimaryPhone || !normalizedAddress ||
        !company_name || !display_name || !gst_in || !currency_code || !gst_treatment || !tax_preference) {
        throw new Error("All required fields must be provided.");
    }

    if (!isValidGSTIN(gst_in)) {
        throw new Error("Invalid GSTIN format.");
    }
    if (!isValidEmail(primary_email)) {
        throw new Error("Invalid email address format.");
    }
    if (secondary_email && !isValidEmail(secondary_email)) {
        throw new Error("Invalid secondary email address format.");
    }
    if (!isValidPhoneNumber(normalizedPrimaryPhone)) {
        throw new Error("Invalid primary phone number format.");
    }
    if (normalizedSecondaryPhone && !isValidPhoneNumber(normalizedSecondaryPhone)) {
        throw new Error("Invalid secondary phone number format.");
    }
    if (!normalizedAddress.state || !normalizedAddress.state.trim()) {
        throw new Error("State cannot be empty in the address.");
    }

    try {
        const currentTime = getCurrentTime();

        // Serialize JSON fields
        const serializedAddress = JSON.stringify(normalizedAddress);
        const serializedContacts = JSON.stringify(sanitizedContacts);
        const serializedPaymentTerms = JSON.stringify(payment_terms) || JSON.stringify({ term_name: "Due on Receipt", days: 0, is_default: true });

        const [result] = await appDB.query(
            `UPDATE customers SET 
                salutation = ?, first_name = ?, last_name = ?, primary_email = ?, secondary_email = ?, country_code = ?,
                primary_phone_number = ?, secondary_phone_number = ?, customer_address = ?, other_contacts = ?,
                company_name = ?, display_name = ?, gst_in = ?, currency_code = ?, gst_treatment = ?,
                tax_preference = ?, exemption_reason = ?, payment_terms = ?, notes = ?, customer_status = ?,
                updated_at = ?
            WHERE customer_id = ?`,
            [
                salutation, first_name, last_name, primary_email, secondary_email || null, country_code,
                normalizedPrimaryPhone, normalizedSecondaryPhone || null, serializedAddress, serializedContacts,
                company_name, display_name, gst_in, currency_code, gst_treatment,
                tax_preference, exemption_reason, serializedPaymentTerms, notes, customer_status,
                currentTime, customerId
            ]
        );

        if (result.affectedRows === 0) {
            throw new Error("Customer not found or no changes made.");
        }

        return result;
    } catch (error) {
        console.error("Error updating customer:", error);
        throw new Error("Failed to update customer details.");
    }
}


/**
 * Function to get all customer details to be displayed
 * @param {string} search The string to be searched in the database
 * @param {string} sort   The field that is to be sorted
 * @param {string} order  The order in which the given field is to be sorted
 * @param {Number} page   The page of data to be displayed
 * @param {Number} limit  The number of data to be displayed in a page
 * @returns {Promise<{totalPages: number, customers: *}>}
 */
const getAllCustomers = async ({ search = "", sort = "updated_at", order = "desc", page = 1, limit = 10 }) => {
    const offset = (page - 1) * limit;
    const searchQuery = `%${search}%`;
    const allowedSortColumns = [
        'customer_id',
        'salutation',
        'first_name',
        'last_name',
        'display_name',
        'company_name',
        'country_code',
        'primary_phone_number',
        'primary_email',
        'gst_treatment',
        'customer_status',
        'created_at',
        'updated_at'
    ];
    const hasValidSort = sort && allowedSortColumns.includes(sort);
    const normalizedSort = hasValidSort ? sort : 'updated_at';
    let normalizedOrder = 'DESC';
    if (hasValidSort && typeof order === 'string') {
        if (order.toLowerCase() === 'asc') normalizedOrder = 'ASC';
        else if (order.toLowerCase() === 'desc') normalizedOrder = 'DESC';
    }

    try {
      const [customers] = await appDB.query(
            `SELECT customer_id, salutation, first_name, last_name, display_name, company_name, country_code, primary_phone_number, primary_email, gst_treatment
             FROM customers 
             WHERE (
                display_name LIKE ? OR
                first_name LIKE ? OR
                last_name LIKE ? OR
                company_name LIKE ? OR
                country_code LIKE ? OR
                primary_phone_number LIKE ? OR
                primary_email LIKE ? OR
                customer_id LIKE ?
            )
             ORDER BY ${normalizedSort} ${normalizedOrder} 
             LIMIT ? OFFSET ?`, 
            [searchQuery, searchQuery, searchQuery, searchQuery, searchQuery, searchQuery, searchQuery, searchQuery, parseInt(limit), parseInt(offset)]
        );

        const [[{ total }]] = await appDB.query(
            `SELECT COUNT(*) as total FROM customers WHERE (
                display_name LIKE ? OR
                first_name LIKE ? OR
                last_name LIKE ? OR
                company_name LIKE ? OR
                country_code LIKE ? OR
                primary_phone_number LIKE ? OR
                customer_id LIKE ?
            )`,
            [searchQuery, searchQuery, searchQuery, searchQuery, searchQuery, searchQuery, searchQuery]
        );

    const totalPages = Math.ceil(total / limit);
    return { customers, totalPages, totalRecords: total };
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }
};


/**
* Function to get all customer details to be displayed
* @returns {Promise<{ customers: *}>}
*/
const getAllCustomersDetails = async () => {
   try {
     const [customers] = await appDB.query("SELECT * FROM customers;");
     return customers;
   } catch (error) {
     console.error("Error fetching all customer Details:", error);
     throw error;
   }
};


/**
 * Fetch a single customer by given ID
 * @param   {string}     customerId The ID of the customer, whose details are to be fetched
 * @returns {Promise<*>}
 */
const getCustomerById = async (customerId) => {
    try {
        const [result] = await appDB.query(
            `SELECT * FROM customers WHERE customer_id = ?`,
            [customerId]
        );
        // console.log(result);
        return result[0];
    } catch (error) {
        console.error("Error fetching customer by ID:", error);
        throw error;
    }
};

/**
 * Import multiple customers in bulk
 * @param {Array} customers - Array of customer objects to be inserted
 */
 const importCustomerData = async (customers) => {
    const query = `
        INSERT INTO customers (salutation, first_name, last_name, primary_email, country_code, primary_phone_number, 
                               customer_address, company_name, display_name, gst_in, currency_code, gst_treatment, 
                               tax_preference, exemption_reason, notes, other_contacts, customer_status) 
        VALUES ?
    `;

    const values = customers.map(customer => [
        customer.salutation,
        customer.first_name,
        customer.last_name,
        customer.primary_email,
        customer.country_code,
        customer.primary_phone_number,
        JSON.stringify(customer.customer_address),
        customer.company_name,
        customer.display_name,
        customer.gst_in,
        customer.currency_code,
        customer.gst_treatment,
        customer.tax_preference,
        customer.exemption_reason,
        customer.notes,
        JSON.stringify(customer.other_contacts),
        customer.customer_status,
    ]);

    await appDB.query(query, [values]);
};


async function appendCustomerContact(customerId, contact) {
    try {
        const [rows] = await appDB.query(`SELECT other_contacts FROM customers WHERE customer_id = ?`, [customerId]);
        if (!rows.length) throw new Error('Customer not found');
        let contacts = [];
        try { contacts = typeof rows[0].other_contacts === 'string' ? JSON.parse(rows[0].other_contacts || '[]') : (rows[0].other_contacts || []); } catch { contacts = []; }
        const toPush = {
            salutation: contact.salutation || '',
            first_name: contact.first_name || contact.firstName || '',
            last_name: contact.last_name || contact.lastName || '',
            email: contact.email,
            mobile: contact.mobile || contact.phone || contact.phoneNumber || '',
            designation: contact.designation || '',
            is_subscriptions_recipient: contact.is_subscriptions_recipient !== false,
            created_at: getCurrentTime()
        };
        if (!toPush.first_name || !toPush.email) {
            throw new Error('Name and email are required');
        }
        contacts.push(toPush);
        await appDB.query(`UPDATE customers SET other_contacts = ? WHERE customer_id = ?`, [JSON.stringify(contacts), customerId]);
        return contacts;
    } catch (e) {
        console.error('appendCustomerContact error:', e);
        throw e;
    }
}

/**
 * Search for customer and contact by phone number
 * Used by CallLog system to auto-match customers
 * @param {string} phoneNumber - Phone number to search
 * @returns {Promise<{customer: Object|null, contact: Object|null}>}
 */
async function searchCustomerByPhone(phoneNumber) {
    try {
        if (!phoneNumber) {
            return { customer: null, contact: null };
        }

        /**
         * Normalize phone number for comparison
         * Strips country codes (+91, 91, etc.) and removes special characters
         * Returns just the core 10-digit number
         */
        function normalizePhone(phone) {
            if (!phone) return '';
            
            // Remove all non-digit characters
            let digits = phone.replace(/\D/g, '');
            
            // Remove leading country codes (91, 1, etc.)
            // For Indian numbers, remove leading 91
            if (digits.startsWith('91') && digits.length > 10) {
                digits = digits.substring(2);
            }
            // For US/Canada, remove leading 1
            if (digits.startsWith('1') && digits.length === 11) {
                digits = digits.substring(1);
            }
            
            // Return last 10 digits (handles any remaining prefixes)
            return digits.slice(-10);
        }

        const searchNumber = normalizePhone(phoneNumber);
        
        if (!searchNumber || searchNumber.length < 10) {
            return { customer: null, contact: null };
        }

        // Search in customers table
        const [customers] = await appDB.query(
            `SELECT 
                customer_id,
                display_name, 
                company_name, 
                first_name,
                last_name,
                primary_phone_number, 
                secondary_phone_number,
                country_code,
                primary_email,
                other_contacts
             FROM customers 
             WHERE customer_status = 'Active'`,
            []
        );

        for (const customer of customers) {
            let matchedContact = null;
            let matchType = null;

            // Check primary phone
            const primaryNormalized = normalizePhone(customer.primary_phone_number);
            if (primaryNormalized === searchNumber) {
                matchType = 'primary';
                matchedContact = {
                    contact_id: null,
                    contact_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.display_name,
                    phone_number: customer.primary_phone_number,
                    email: customer.primary_email,
                    country_code: customer.country_code || '+91'
                };
            }

            // Check secondary phone
            if (!matchedContact && customer.secondary_phone_number) {
                const secondaryNormalized = normalizePhone(customer.secondary_phone_number);
                if (secondaryNormalized === searchNumber) {
                    matchType = 'secondary';
                    matchedContact = {
                        contact_id: null,
                        contact_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.display_name,
                        phone_number: customer.secondary_phone_number,
                        email: customer.primary_email,
                        country_code: customer.country_code || '+91'
                    };
                }
            }

            // Check other_contacts array
            if (!matchedContact && customer.other_contacts) {
                let contacts = [];
                try {
                    contacts = typeof customer.other_contacts === 'string' 
                        ? JSON.parse(customer.other_contacts || '[]') 
                        : (customer.other_contacts || []);
                } catch (e) {
                    contacts = [];
                }

                for (const contact of contacts) {
                    if (contact.phone_number) {
                        const contactNormalized = normalizePhone(contact.phone_number);
                        if (contactNormalized === searchNumber) {
                            matchType = 'other_contact';
                            matchedContact = {
                                contact_id: null,
                                contact_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
                                phone_number: contact.phone_number,
                                email: contact.email || '',
                                country_code: contact.country_code || '+91',
                                designation: contact.designation || ''
                            };
                            break;
                        }
                    }
                }
            }

            // If we found a match, return it
            if (matchedContact) {
                console.log(`Phone match found: ${matchType} for customer ${customer.customer_id}`);
                return {
                    customer: {
                        customer_id: customer.customer_id,
                        customer_name: customer.display_name,
                        company_name: customer.company_name,
                        display_name: customer.display_name
                    },
                    contact: matchedContact
                };
            }
        }

        // No match found
        //console.log(`No customer match found for phone: ${phoneNumber} (normalized: ${searchNumber})`);
        return { customer: null, contact: null };
    } catch (error) {
        console.error('Error searching customer by phone:', error);
        throw error;
    }
}

export { addCustomer, updateCustomer, getAllCustomers, getCustomerById, getAllCustomersDetails, importCustomerData, appendCustomerContact, searchCustomerByPhone };

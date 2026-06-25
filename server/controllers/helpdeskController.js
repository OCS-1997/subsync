import appDB from '../db/subsyncDB.js';

/**
 * Controller to fetch all customers with support for search, status filtering, and pagination.
 */
export const getCustomers = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const status = req.query.status || '';

        let whereClauses = [];
        let params = [];

        // Apply status filter (case insensitive, 'Active' or 'Inactive')
        if (status) {
            whereClauses.push("customer_status = ?");
            params.push(status);
        }

        // Apply search filter (searches by customer_id, primary_email, primary_phone_number, company_name, display_name)
        if (search) {
            whereClauses.push("(customer_id LIKE ? OR primary_email LIKE ? OR primary_phone_number LIKE ? OR company_name LIKE ? OR display_name LIKE ?)");
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
        }

        const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

        // Query customers details matching Helpdesk requirements
        const selectQuery = `
            SELECT 
                customer_id AS customerId,
                primary_email AS primaryEmail,
                secondary_email AS secondaryEmail,
                primary_phone_number AS primaryPhone,
                secondary_phone_number AS secondaryPhone,
                company_name AS companyName,
                display_name AS displayName,
                customer_status AS status
            FROM customers
            ${whereSQL}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [customers] = await appDB.query(selectQuery, [...params, limit, offset]);

        // Get total count for pagination metadata
        const countQuery = `SELECT COUNT(*) as total FROM customers ${whereSQL}`;
        const [[{ total }]] = await appDB.query(countQuery, params);

        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            success: true,
            customers,
            pagination: {
                totalRecords: total,
                totalPages,
                page,
                limit
            }
        });
    } catch (error) {
        console.error('[HelpdeskController] Error in getCustomers:', error);
        return res.status(500).json({ success: false, error: 'Failed to retrieve customers list' });
    }
};

/**
 * Controller to fetch details of a specific customer.
 */
export const getCustomerDetails = async (req, res) => {
    try {
        const { customerId } = req.params;

        const selectQuery = `
            SELECT 
                customer_id AS customerId,
                primary_email AS primaryEmail,
                secondary_email AS secondaryEmail,
                primary_phone_number AS primaryPhone,
                secondary_phone_number AS secondaryPhone,
                company_name AS companyName,
                display_name AS displayName,
                customer_status AS status
            FROM customers
            WHERE customer_id = ?
        `;

        const [rows] = await appDB.query(selectQuery, [customerId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: `Customer with ID ${customerId} not found` });
        }

        return res.status(200).json({
            success: true,
            customer: rows[0]
        });
    } catch (error) {
        console.error('[HelpdeskController] Error in getCustomerDetails:', error);
        return res.status(500).json({ success: false, error: 'Failed to retrieve customer details' });
    }
};

/**
 * Controller to fetch domains owned by a specific customer.
 */
export const getCustomerDomains = async (req, res) => {
    try {
        const { customerId } = req.params;

        // Verify customer exists first
        const [customerCheck] = await appDB.query("SELECT 1 FROM customers WHERE customer_id = ? LIMIT 1", [customerId]);
        if (customerCheck.length === 0) {
            return res.status(404).json({ success: false, error: `Customer with ID ${customerId} not found` });
        }

        const [domains] = await appDB.query(
            "SELECT domain_id AS domainId, customer_id AS customerId, customer_name AS customerName, domain_name AS domainName, registration_date AS registrationDate, registered_with AS registeredWith, mail_service_provider AS mailServiceProvider, domain_status AS status, created_at AS createdAt FROM domains WHERE customer_id = ?",
            [customerId]
        );

        return res.status(200).json({
            success: true,
            domains
        });
    } catch (error) {
        console.error('[HelpdeskController] Error in getCustomerDomains:', error);
        return res.status(500).json({ success: false, error: 'Failed to retrieve customer domains' });
    }
};

/**
 * Controller to fetch subscriptions associated with a customer.
 */
export const getCustomerSubscriptions = async (req, res) => {
    try {
        const { customerId } = req.params;

        // Verify customer exists first
        const [customerCheck] = await appDB.query("SELECT 1 FROM customers WHERE customer_id = ? LIMIT 1", [customerId]);
        if (customerCheck.length === 0) {
            return res.status(404).json({ success: false, error: `Customer with ID ${customerId} not found` });
        }

        const [subscriptions] = await appDB.query(
            "SELECT sub_id AS subscriptionId, customer_id AS customerId, domain_name AS domainName, start_date AS startDate, end_date AS endDate, currency, total, status FROM subscriptions WHERE customer_id = ?",
            [customerId]
        );

        return res.status(200).json({
            success: true,
            subscriptions
        });
    } catch (error) {
        console.error('[HelpdeskController] Error in getCustomerSubscriptions:', error);
        return res.status(500).json({ success: false, error: 'Failed to retrieve customer subscriptions' });
    }
};

/**
 * Controller to fetch unique services consumed by a customer via subscription items.
 */
export const getCustomerServices = async (req, res) => {
    try {
        const { customerId } = req.params;

        // Verify customer exists first
        const [customerCheck] = await appDB.query("SELECT 1 FROM customers WHERE customer_id = ? LIMIT 1", [customerId]);
        if (customerCheck.length === 0) {
            return res.status(404).json({ success: false, error: `Customer with ID ${customerId} not found` });
        }

        // Fetch distinct services from active subscriptions items
        const serviceQuery = `
            SELECT DISTINCT 
                s.service_id AS serviceId,
                s.service_name AS serviceName,
                s.stock_keepers_unit AS SKU,
                s.tax_preference AS taxPreference,
                s.item_group AS itemGroup
            FROM services s
            JOIN subscription_items si ON s.service_id = si.service_id
            JOIN subscriptions sub ON si.sub_id = sub.sub_id
            WHERE sub.customer_id = ?
        `;

        const [services] = await appDB.query(serviceQuery, [customerId]);

        return res.status(200).json({
            success: true,
            services
        });
    } catch (error) {
        console.error('[HelpdeskController] Error in getCustomerServices:', error);
        return res.status(500).json({ success: false, error: 'Failed to retrieve customer services' });
    }
};

/**
 * Controller to fetch consolidated customer summary (Profile, Domains, Subscriptions, Services).
 */
export const getCustomerSummary = async (req, res) => {
    try {
        const { customerId } = req.params;

        // 1. Fetch Profile
        const selectProfile = `
            SELECT 
                customer_id AS customerId,
                primary_email AS primaryEmail,
                secondary_email AS secondaryEmail,
                primary_phone_number AS primaryPhone,
                secondary_phone_number AS secondaryPhone,
                company_name AS companyName,
                display_name AS displayName,
                customer_status AS status
            FROM customers
            WHERE customer_id = ?
        `;
        const [profileRows] = await appDB.query(selectProfile, [customerId]);
        if (profileRows.length === 0) {
            return res.status(404).json({ success: false, error: `Customer with ID ${customerId} not found` });
        }
        const customer = profileRows[0];

        // 2. Fetch Domains
        const [domains] = await appDB.query(
            "SELECT domain_id AS domainId, domain_name AS domainName, domain_status AS status, registration_date AS registrationDate FROM domains WHERE customer_id = ?",
            [customerId]
        );

        // 3. Fetch Subscriptions
        const [subscriptions] = await appDB.query(
            "SELECT sub_id AS subscriptionId, domain_name AS domainName, start_date AS startDate, end_date AS endDate, total, status FROM subscriptions WHERE customer_id = ?",
            [customerId]
        );

        // 4. Fetch Services
        const serviceQuery = `
            SELECT DISTINCT 
                s.service_id AS serviceId,
                s.service_name AS serviceName,
                s.stock_keepers_unit AS SKU
            FROM services s
            JOIN subscription_items si ON s.service_id = si.service_id
            JOIN subscriptions sub ON si.sub_id = sub.sub_id
            WHERE sub.customer_id = ?
        `;
        const [services] = await appDB.query(serviceQuery, [customerId]);

        return res.status(200).json({
            success: true,
            summary: {
                customer,
                domains,
                subscriptions,
                services
            }
        });
    } catch (error) {
        console.error('[HelpdeskController] Error in getCustomerSummary:', error);
        return res.status(500).json({ success: false, error: 'Failed to retrieve customer summary' });
    }
};

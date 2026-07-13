import appDB from '../db/subsyncDB.js';

export const getCrmDomains = async (req, res) => {
    try {
        const { customerId } = req.params;
        const [domains] = await appDB.query(
            "SELECT domain_id AS domainId, customer_id AS customerId, customer_name AS customerName, domain_name AS domainName, registration_date AS registrationDate, registered_with AS registeredWith, mail_service_provider AS mailServiceProvider, domain_status AS status, created_at AS createdAt FROM domains WHERE customer_id = ?",
            [customerId]
        );
        return res.status(200).json({ success: true, domains });
    } catch (error) {
        console.error('[CrmMockController] Error in getCrmDomains:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

export const getCrmServices = async (req, res) => {
    try {
        const { customerId } = req.params;
        // Fetch distinct services consumed by a customer via subscription items
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
        return res.status(200).json({ success: true, services });
    } catch (error) {
        console.error('[CrmMockController] Error in getCrmServices:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

export const getCrmSubscriptions = async (req, res) => {
    try {
        const { customerId } = req.params;
        const [subscriptions] = await appDB.query(
            "SELECT sub_id AS subscriptionId, customer_id AS customerId, domain_name AS domainName, start_date AS startDate, end_date AS endDate, currency, total, status FROM subscriptions WHERE customer_id = ?",
            [customerId]
        );
        return res.status(200).json({ success: true, subscriptions });
    } catch (error) {
        console.error('[CrmMockController] Error in getCrmSubscriptions:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

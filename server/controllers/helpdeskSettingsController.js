import appDB from '../db/subsyncDB.js';
import crypto from 'crypto';

/**
 * Controller to fetch active helpdesk integration settings.
 */
export const getSettings = async (req, res) => {
    try {
        const [rows] = await appDB.query("SELECT helpdesk_url, api_key, webhook_secret, retry_count FROM helpdesk_settings LIMIT 1");
        if (rows.length === 0) {
            return res.status(200).json({
                success: true,
                settings: {
                    helpdesk_url: '',
                    api_key: '',
                    webhook_secret: '',
                    retry_count: 5
                }
            });
        }
        return res.status(200).json({ success: true, settings: rows[0] });
    } catch (error) {
        console.error('[HelpdeskSettingsController] Error in getSettings:', error);
        return res.status(500).json({ success: false, error: 'Failed to retrieve helpdesk settings.' });
    }
};

/**
 * Controller to save/update helpdesk integration settings.
 */
export const updateSettings = async (req, res) => {
    try {
        const { helpdesk_url, api_key, webhook_secret, retry_count } = req.body;

        if (!helpdesk_url || !api_key || !webhook_secret) {
            return res.status(400).json({ success: false, error: 'All configuration fields are required.' });
        }

        const numericRetries = parseInt(retry_count, 10);
        if (isNaN(numericRetries) || numericRetries < 0) {
            return res.status(400).json({ success: false, error: 'Retry count must be a positive number.' });
        }

        // Check if settings already exist
        const [rows] = await appDB.query("SELECT COUNT(*) as count FROM helpdesk_settings");
        if (rows[0].count === 0) {
            // Create fresh row
            await appDB.query(
                "INSERT INTO helpdesk_settings (helpdesk_url, api_key, webhook_secret, retry_count) VALUES (?, ?, ?, ?)",
                [helpdesk_url, api_key, webhook_secret, numericRetries]
            );
        } else {
            // Update existing row
            await appDB.query(
                "UPDATE helpdesk_settings SET helpdesk_url = ?, api_key = ?, webhook_secret = ?, retry_count = ?",
                [helpdesk_url, api_key, webhook_secret, numericRetries]
            );
        }

        return res.status(200).json({ success: true, message: 'Helpdesk settings updated successfully.' });
    } catch (error) {
        console.error('[HelpdeskSettingsController] Error in updateSettings:', error);
        return res.status(500).json({ success: false, error: 'Failed to save helpdesk settings.' });
    }
};

/**
 * Controller to perform a live connection test to a configured/test URL.
 */
export const testConnection = async (req, res) => {
    try {
        const { helpdesk_url, webhook_secret } = req.body;

        if (!helpdesk_url || !webhook_secret) {
            return res.status(400).json({ success: false, error: 'Helpdesk URL and Webhook Secret are required for testing.' });
        }

        const timestamp = Date.now().toString();
        const payload = {
            event: 'connection.test',
            timestamp: new Date().toISOString(),
            message: 'This is a connection test from CRM.'
        };

        const message = `${timestamp}.${JSON.stringify(payload)}`;
        const signature = crypto.createHmac('sha256', webhook_secret)
            .update(message)
            .digest('hex');

        console.log(`[HelpdeskSettingsController] Triggering test POST connection check to ${helpdesk_url}`);

        let responseStatus = null;
        let responseBody = null;

        try {
            const response = await fetch(helpdesk_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Signature': signature,
                    'X-Timestamp': timestamp
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(8000) // 8 seconds timeout
            });

            responseStatus = response.status;
            responseBody = await response.text();

            if (response.ok) {
                return res.status(200).json({
                    success: true,
                    message: `Connection successful! Helpdesk returned status ${responseStatus}.`,
                    details: responseBody.substring(0, 500)
                });
            } else {
                return res.status(400).json({
                    success: false,
                    error: `Connection test failed. Helpdesk returned status ${responseStatus}.`,
                    details: responseBody.substring(0, 500)
                });
            }
        } catch (fetchError) {
            console.error('[HelpdeskSettingsController] Connection test fetch error:', fetchError);
            return res.status(400).json({
                success: false,
                error: `Connection test failed: ${fetchError.message}`
            });
        }
    } catch (error) {
        console.error('[HelpdeskSettingsController] Error in testConnection:', error);
        return res.status(500).json({ success: false, error: 'An error occurred while testing the connection.' });
    }
};

/**
 * Controller to fetch paginated list of webhook events history.
 */
export const getWebhookHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const [events] = await appDB.query(
            "SELECT event_id AS eventId, event_type AS eventType, customer_id AS customerId, delivery_status AS status, attempts, created_at AS createdAt, updated_at AS updatedAt FROM webhook_events ORDER BY created_at DESC LIMIT ? OFFSET ?",
            [limit, offset]
        );

        const [[{ total }]] = await appDB.query("SELECT COUNT(*) as total FROM webhook_events");
        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            success: true,
            events,
            pagination: {
                totalRecords: total,
                totalPages,
                page,
                limit
            }
        });
    } catch (error) {
        console.error('[HelpdeskSettingsController] Error in getWebhookHistory:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch webhook events history.' });
    }
};

/**
 * Controller to fetch retry logs for a specific webhook event.
 */
export const getWebhookEventLogs = async (req, res) => {
    try {
        const { eventId } = req.params;

        const [logs] = await appDB.query(
            "SELECT log_id AS logId, event_id AS eventId, attempt, request_url AS requestUrl, response_status AS responseStatus, response_body AS responseBody, error_message AS errorMessage, delivered_at AS deliveredAt FROM webhook_delivery_logs WHERE event_id = ? ORDER BY attempt ASC",
            [eventId]
        );

        return res.status(200).json({
            success: true,
            logs
        });
    } catch (error) {
        console.error('[HelpdeskSettingsController] Error in getWebhookEventLogs:', error);
        return res.status(500).json({ success: false, error: 'Failed to retrieve event logs.' });
    }
};

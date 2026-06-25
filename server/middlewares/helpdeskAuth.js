import crypto from 'crypto';
import appDB from '../db/subsyncDB.js';

/**
 * Middleware to authenticate requests from the Helpdesk.
 * Supports both API Key (via X-API-Key or Authorization Bearer token)
 * and HMAC-SHA256 Signatures (via X-Signature and X-Timestamp headers).
 */
export async function helpdeskAuth(req, res, next) {
    try {
        const apiKeyHeader = req.headers['x-api-key'] || 
            (req.headers['authorization']?.startsWith('Bearer ') ? req.headers['authorization'].slice(7) : null);
        
        const signatureHeader = req.headers['x-signature'];
        const timestampHeader = req.headers['x-timestamp'];

        // Retrieve configured integration settings from database
        const [settingsRows] = await appDB.query("SELECT api_key, webhook_secret FROM helpdesk_settings LIMIT 1");
        if (settingsRows.length === 0) {
            console.error('[HelpdeskAuth] Integration settings are not configured in CRM database.');
            return res.status(500).json({ success: false, error: 'Helpdesk integration settings are not configured.' });
        }
        
        const { api_key: configuredKey, webhook_secret: configuredSecret } = settingsRows[0];

        // 1. Authenticate using API Key
        if (apiKeyHeader) {
            if (apiKeyHeader === configuredKey) {
                return next();
            }
            console.warn('[HelpdeskAuth] Provided API Key is invalid.');
            return res.status(403).json({ success: false, error: 'Forbidden: Invalid API Key' });
        }

        // 2. Authenticate using HMAC Signature
        if (signatureHeader && timestampHeader) {
            const requestTime = parseInt(timestampHeader, 10);
            const now = Date.now();
            
            // Replay attack prevention: check if timestamp is within 5 minutes threshold
            if (isNaN(requestTime) || Math.abs(now - requestTime) > 5 * 60 * 1000) {
                console.warn(`[HelpdeskAuth] Replay protection check failed. Drift: ${Math.abs(now - requestTime)}ms`);
                return res.status(401).json({ success: false, error: 'Unauthorized: Request timestamp has expired or is invalid' });
            }

            // Construct validation string depending on request method
            // For GET: Method + "." + originalUrl + "." + timestamp
            // For POST: Method + "." + originalUrl + "." + timestamp + "." + JSON.stringify(body)
            let message = `${req.method}.${req.originalUrl}.${timestampHeader}`;
            if (req.method === 'POST') {
                message += `.${JSON.stringify(req.body)}`;
            }

            const computedSignature = crypto.createHmac('sha256', configuredSecret)
                .update(message)
                .digest('hex');

            // Timing-safe comparison to prevent timing side-channel attacks
            const isSignatureValid = crypto.timingSafeEqual(
                Buffer.from(signatureHeader),
                Buffer.from(computedSignature)
            );

            if (isSignatureValid) {
                return next();
            }

            console.warn('[HelpdeskAuth] HMAC signature verification failed.');
            return res.status(401).json({ success: false, error: 'Unauthorized: Invalid signature' });
        }

        // Neither provided
        console.warn('[HelpdeskAuth] Missing authorization headers (API Key or Signature).');
        return res.status(401).json({ success: false, error: 'Unauthorized: API Key or HMAC Signature required' });
    } catch (error) {
        console.error('[HelpdeskAuth] Error during request authentication:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

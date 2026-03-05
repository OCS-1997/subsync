import { resolvePhoneNumber, createPhoneDcrEntry, getPhoneCallLogs, normalizePhone } from "../models/callLogModel.js";

/**
 * POST /api/resolve-number
 * Resolve a phone number to its entity (customer/vendor/contact/unknown).
 * Called by the Android app immediately after a call ends.
 * 
 * Body: { phone_number: "9843012769" }
 */
export async function resolveNumberController(req, res, next) {
    try {
        const { phone_number } = req.body;

        if (!phone_number || typeof phone_number !== 'string') {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_INPUT', message: 'phone_number is required' }
            });
        }

        const normalized = normalizePhone(phone_number);
        if (!normalized || normalized.length < 10) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_PHONE', message: 'Could not normalize the phone number' }
            });
        }

        const resolved = await resolvePhoneNumber(phone_number);

        return res.status(200).json({ success: true, data: resolved });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/log-call
 * Save a phone call as a DCR entry with call_source = 'phone'.
 * 
 * Body:
 * {
 *   phone:       "9843012769",
 *   name:        "Haridas R",
 *   entity_type: "customer",
 *   entity_id:   "CID-001",
 *   company:     "Acme Corp",
 *   call_type:   "incoming" | "outgoing" | "missed",
 *   duration:    120,          (seconds)
 *   description: "Discussed renewal"
 * }
 */
export async function logCallController(req, res, next) {
    try {
        const {
            phone,
            name,
            entity_type,
            entity_id,
            company,
            call_type,
            duration,
            description,
        } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_INPUT', message: 'phone is required' }
            });
        }

        const validCallTypes = ['incoming', 'outgoing', 'missed'];
        if (call_type && !validCallTypes.includes(call_type)) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_CALL_TYPE', message: `call_type must be one of: ${validCallTypes.join(', ')}` }
            });
        }

        const user_id = req.user?.username || req.session?.user?.username;
        if (!user_id) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Session expired' }
            });
        }

        const insertId = await createPhoneDcrEntry({
            phone,
            name: name || 'Unknown Number',
            entity_type: entity_type || 'unknown',
            entity_id: entity_id || null,
            company: company || null,
            call_type: call_type || 'incoming',
            duration: parseInt(duration) || 0,
            description: description || '',
            user_id,
        });

        return res.status(201).json({
            success: true,
            data: { id: insertId, message: 'Call logged as DCR entry successfully' }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/call-logs
 * Get phone-sourced DCR entries, paginated.
 * Query params: page, limit, search
 */
export async function getCallLogsController(req, res, next) {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const user_id = req.user?.username || req.session?.user?.username;
        const isAdmin = req.user?.roleKey === 'admin' || req.session?.user?.role === 'admin' || req.session?.user?.isAdmin;

        const result = await getPhoneCallLogs({
            page: parseInt(page),
            limit: parseInt(limit),
            search,
            user_id,
            isAdmin,
        });

        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
}

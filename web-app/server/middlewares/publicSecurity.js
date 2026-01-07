import {
    generateCSPHeader,
    isSuspiciousRequest,
    validateSlugFormat,
    whitelistResponseFields
} from '../utils/securityHelper.js';
import appDB from '../db/subsyncDB.js';

/**
 * Public Security Middleware
 * Comprehensive security middleware for public KB routes
 */

/**
 * Allowed response fields for public articles
 */
const ALLOWED_PUBLIC_FIELDS = [
    'id',
    'title',
    'slug',
    'content',
    'category_name',
    'author_name',
    'created_at',
    'updated_at',
    'tags',
    'meta_title',
    'meta_description',
    'keywords',
    'total_reads',
    'unique_reads',
    'og_image',
    'canonical_url'
];

/**
 * Set security headers
 */
export function setSecurityHeaders(req, res, next) {
    // Content Security Policy
    res.set('Content-Security-Policy', generateCSPHeader());

    // Prevent clickjacking
    res.set('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.set('X-Content-Type-Options', 'nosniff');

    // XSS Protection
    res.set('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Remove server identification
    res.removeHeader('X-Powered-By');

    // Strict Transport Security (HTTPS only)
    if (req.secure) {
        res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
}

/**
 * CORS middleware for public endpoints
 */
export function configureCORS(req, res, next) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    const origin = req.get('origin');

    // Allow requests without origin (direct browser access)
    if (!origin) {
        return next();
    }

    // Check if origin is allowed
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        res.set('Access-Control-Allow-Origin', origin);
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '86400'); // 24 hours
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(204).send();
    }

    next();
}

/**
 * Validate slug parameter
 */
export function validateSlug(req, res, next) {
    const slug = req.params.slug;

    if (!slug) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Article slug is required'
        });
    }

    if (!validateSlugFormat(slug)) {
        // Log suspicious activity
        logSecurityEvent(
            'SUSPICIOUS_PATTERN',
            'MEDIUM',
            req.ip,
            req.get('user-agent'),
            req.path,
            'Invalid slug format'
        ).catch(err => console.error('Failed to log security event:', err));

        return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid article slug format'
        });
    }

    next();
}

/**
 * Detect and log suspicious requests
 */
export function detectSuspiciousActivity(req, res, next) {
    const suspicion = isSuspiciousRequest(req);

    if (suspicion.isSuspicious) {
        // Log security event
        logSecurityEvent(
            suspicion.reasons.some(r => r.includes('SQL')) ? 'SQL_INJECTION_ATTEMPT' :
                suspicion.reasons.some(r => r.includes('XSS')) ? 'XSS_ATTEMPT' :
                    'SUSPICIOUS_PATTERN',
            'HIGH',
            req.ip,
            req.get('user-agent'),
            req.path,
            suspicion.reasons.join('; ')
        ).catch(err => console.error('Failed to log security event:', err));

        return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid request parameters'
        });
    }

    next();
}

/**
 * Sanitize response data (whitelist fields)
 */
export function sanitizeResponse(data) {
    if (Array.isArray(data)) {
        return data.map(item => whitelistResponseFields(item, ALLOWED_PUBLIC_FIELDS));
    }

    return whitelistResponseFields(data, ALLOWED_PUBLIC_FIELDS);
}

/**
 * Log access to public articles
 */
export async function logPublicAccess(req, res, next) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || '';
    const articleSlug = req.params.slug;

    // Don't block the request, log asynchronously
    setImmediate(async () => {
        try {
            const { hashIP, isBot } = await import('../utils/securityHelper.js');

            await appDB.query(`
                INSERT INTO knowledge_article_access_log
                (article_slug, ip_address, ip_hash, user_agent, request_method, 
                 request_path, query_params, is_bot, accessed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
                articleSlug,
                ipAddress,
                hashIP(ipAddress),
                userAgent,
                req.method,
                req.path,
                JSON.stringify(req.query),
                isBot(userAgent) ? 1 : 0
            ]);
        } catch (error) {
            console.error('Failed to log public access:', error);
        }
    });

    next();
}

/**
 * Error handler for public routes (sanitize error messages)
 */
export function publicErrorHandler(err, req, res, next) {
    // Log the actual error server-side
    console.error('Public route error:', err);

    // Log security event for 500 errors
    if (err.status >= 500) {
        logSecurityEvent(
            'ANOMALY_DETECTED',
            'MEDIUM',
            req.ip,
            req.get('user-agent'),
            req.path,
            'Internal server error on public endpoint'
        ).catch(e => console.error('Failed to log security event:', e));
    }

    // Send sanitized error to client (no stack traces or internal details)
    const status = err.status || 500;
    const message = status === 500
        ? 'An error occurred while processing your request'
        : err.message || 'Bad Request';

    res.status(status).json({
        error: status === 500 ? 'Internal Server Error' : 'Error',
        message: message
    });
}

/**
 * Log security event to database
 */
async function logSecurityEvent(eventType, severity, ipAddress, userAgent, requestPath, description) {
    try {
        await appDB.query(`
            INSERT INTO knowledge_security_events
            (event_type, severity, ip_address, user_agent, request_path, description)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [eventType, severity, ipAddress, userAgent, requestPath, description]);
    } catch (error) {
        console.error('Failed to log security event:', error);
    }
}

/**
 * Combine all public security middleware
 */
export function publicSecurityMiddleware() {
    return [
        setSecurityHeaders,
        configureCORS,
        detectSuspiciousActivity
    ];
}

export default {
    setSecurityHeaders,
    configureCORS,
    validateSlug,
    detectSuspiciousActivity,
    sanitizeResponse,
    logPublicAccess,
    publicErrorHandler,
    publicSecurityMiddleware
};

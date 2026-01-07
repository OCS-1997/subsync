import appDB from '../db/subsyncDB.js';
import { hashIP } from '../utils/securityHelper.js';

/**
 * Rate Limiting Middleware
 * Implements multi-tier rate limiting with exponential backoff and IP blacklist support
 */

// In-memory store for rate limits (use Redis in production for distributed systems)
const rateLimitStore = new Map();
const violationStore = new Map();

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_CONFIG = {
    PUBLIC_ARTICLES: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 100,
        message: 'Too many requests, please try again later'
    },
    PUBLIC_SITEMAP: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 10,
        message: 'Sitemap access rate limit exceeded'
    },
    READ_TRACKING: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10,
        message: 'Too many read tracking requests'
    }
};

/**
 * Check if IP is blacklisted
 * @param {string} ipAddress - IP address to check
 * @returns {Promise<boolean>} - True if blacklisted
 */
async function isBlacklisted(ipAddress) {
    try {
        const [rows] = await appDB.query(`
            SELECT id FROM knowledge_ip_blacklist
            WHERE ip_address = ?
            AND unblocked_at IS NULL
            AND (is_permanent = 1 OR expires_at > NOW())
        `, [ipAddress]);

        return rows.length > 0;
    } catch (error) {
        console.error('Error checking blacklist:', error);
        return false;
    }
}

/**
 * Add IP to blacklist
 * @param {string} ipAddress - IP address to blacklist
 * @param {string} reason - Reason for blacklisting
 * @param {number} duration - Duration in milliseconds (null for permanent)
 */
async function blacklistIP(ipAddress, reason, duration = 24 * 60 * 60 * 1000) {
    try {
        const expiresAt = duration ? new Date(Date.now() + duration) : null;

        await appDB.query(`
            INSERT INTO knowledge_ip_blacklist 
            (ip_address, reason, is_permanent, expires_at)
            VALUES (?, ?, ?, ?)
        `, [ipAddress, reason, duration === null ? 1 : 0, expiresAt]);

        console.log(`IP ${ipAddress} blacklisted: ${reason}`);
    } catch (error) {
        console.error('Error blacklisting IP:', error);
    }
}

/**
 * Log rate limit violation
 * @param {string} ipAddress - IP address
 * @param {string} endpoint - Endpoint accessed
 */
async function logViolation(ipAddress, endpoint) {
    try {
        // Update violation count in database
        await appDB.query(`
            INSERT INTO knowledge_rate_limits 
            (ip_address, endpoint, request_count, violation_count, is_blocked, window_start, window_end)
            VALUES (?, ?, 0, 1, 1, NOW(), DATE_ADD(NOW(), INTERVAL 1 HOUR))
            ON DUPLICATE KEY UPDATE 
            violation_count = violation_count + 1,
            is_blocked = 1,
            last_request_at = NOW()
        `, [ipAddress, endpoint]);

        // Track violations in memory
        const key = `${ipAddress}:violations`;
        const violations = (violationStore.get(key) || 0) + 1;
        violationStore.set(key, violations);

        // Auto-blacklist after threshold
        if (violations >= 5) {
            await blacklistIP(ipAddress, `Exceeded rate limit ${violations} times`, 24 * 60 * 60 * 1000);

            // Log security event
            await appDB.query(`
                INSERT INTO knowledge_security_events
                (event_type, severity, ip_address, description)
                VALUES ('RATE_LIMIT_EXCEEDED', 'HIGH', ?, ?)
            `, [ipAddress, `Auto-blacklisted after ${violations} violations`]);
        }
    } catch (error) {
        console.error('Error logging violation:', error);
    }
}

/**
 * Create rate limiter middleware
 * @param {string} limitType - Type of rate limit (PUBLIC_ARTICLES, PUBLIC_SITEMAP, etc.)
 * @returns {Function} - Express middleware
 */
export function createRateLimiter(limitType = 'PUBLIC_ARTICLES') {
    const config = RATE_LIMIT_CONFIG[limitType] || RATE_LIMIT_CONFIG.PUBLIC_ARTICLES;

    return async (req, res, next) => {
        const ipAddress = req.ip || req.connection.remoteAddress;

        // Check blacklist first
        if (await isBlacklisted(ipAddress)) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'Your IP address has been blocked due to suspicious activity'
            });
        }

        const key = `${ipAddress}:${limitType}`;
        const now = Date.now();

        // Get or create rate limit record
        let record = rateLimitStore.get(key);

        if (!record || now > record.resetTime) {
            // Create new window
            record = {
                count: 0,
                resetTime: now + config.windowMs,
                violations: 0
            };
            rateLimitStore.set(key, record);
        }

        // Increment request count
        record.count++;

        // Check if limit exceeded
        if (record.count > config.maxRequests) {
            record.violations++;

            // Log violation (async, don't block response)
            logViolation(ipAddress, req.path).catch(err =>
                console.error('Failed to log violation:', err)
            );

            // Calculate retry after time
            const retryAfter = Math.ceil((record.resetTime - now) / 1000);

            // Exponential backoff for repeated violations
            const backoffMultiplier = Math.min(record.violations, 5);
            const actualRetryAfter = retryAfter * backoffMultiplier;

            res.set('Retry-After', actualRetryAfter);
            res.set('X-RateLimit-Limit', config.maxRequests);
            res.set('X-RateLimit-Remaining', 0);
            res.set('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

            return res.status(429).json({
                error: 'Too Many Requests',
                message: config.message,
                retryAfter: actualRetryAfter
            });
        }

        // Set rate limit headers
        res.set('X-RateLimit-Limit', config.maxRequests);
        res.set('X-RateLimit-Remaining', config.maxRequests - record.count);
        res.set('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

        next();
    };
}

/**
 * Cleanup expired rate limit records (call periodically)
 */
export function cleanupRateLimits() {
    const now = Date.now();

    for (const [key, record] of rateLimitStore.entries()) {
        if (now > record.resetTime + 60000) { // Keep for 1 minute after reset
            rateLimitStore.delete(key);
        }
    }

    // Cleanup violation store
    for (const [key, violations] of violationStore.entries()) {
        if (violations === 0) {
            violationStore.delete(key);
        }
    }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);

/**
 * Get rate limit status for an IP
 * @param {string} ipAddress - IP address
 * @param {string} limitType - Type of rate limit
 * @returns {Object} - Rate limit status
 */
export function getRateLimitStatus(ipAddress, limitType = 'PUBLIC_ARTICLES') {
    const key = `${ipAddress}:${limitType}`;
    const record = rateLimitStore.get(key);
    const config = RATE_LIMIT_CONFIG[limitType] || RATE_LIMIT_CONFIG.PUBLIC_ARTICLES;

    if (!record) {
        return {
            limit: config.maxRequests,
            remaining: config.maxRequests,
            reset: null
        };
    }

    return {
        limit: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - record.count),
        reset: new Date(record.resetTime),
        violations: record.violations
    };
}

export default {
    createRateLimiter,
    cleanupRateLimits,
    getRateLimitStatus,
    isBlacklisted,
    blacklistIP
};

import crypto from 'crypto';

/**
 * Security Helper Utilities
 * Provides security functions for input validation, sanitization, and threat detection
 */

/**
 * Sanitize and validate article slug
 * @param {string} slug - The slug to sanitize
 * @returns {string} - Sanitized slug
 */
export function sanitizeSlug(slug) {
    if (!slug || typeof slug !== 'string') {
        return '';
    }

    // Convert to lowercase, replace spaces with hyphens, remove special chars
    return slug
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 255);
}

/**
 * Validate slug format
 * @param {string} slug - The slug to validate
 * @returns {boolean} - True if valid
 */
export function validateSlugFormat(slug) {
    if (!slug || typeof slug !== 'string') {
        return false;
    }

    const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    const MAX_SLUG_LENGTH = 255;

    return SLUG_PATTERN.test(slug) && slug.length <= MAX_SLUG_LENGTH;
}

/**
 * Sanitize HTML content (basic XSS prevention)
 * @param {string} content - HTML content to sanitize
 * @returns {string} - Sanitized content
 */
export function sanitizeHTML(content) {
    if (!content || typeof content !== 'string') {
        return '';
    }

    // Remove potentially dangerous tags and attributes
    const dangerous = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
        /<embed\b[^<]*>/gi,
        /on\w+\s*=\s*["'][^"']*["']/gi, // Event handlers
        /javascript:/gi,
        /data:text\/html/gi
    ];

    let sanitized = content;
    dangerous.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '');
    });

    return sanitized;
}

/**
 * Detect potential SQL injection attempts
 * @param {string} input - User input to check
 * @returns {boolean} - True if suspicious
 */
export function detectSQLInjection(input) {
    if (!input || typeof input !== 'string') {
        return false;
    }

    const sqlPatterns = [
        /(\bUNION\b.*\bSELECT\b)/i,
        /(\bSELECT\b.*\bFROM\b)/i,
        /(\bINSERT\b.*\bINTO\b)/i,
        /(\bUPDATE\b.*\bSET\b)/i,
        /(\bDELETE\b.*\bFROM\b)/i,
        /(\bDROP\b.*\bTABLE\b)/i,
        /(\bEXEC\b|\bEXECUTE\b)/i,
        /(--|#|\/\*|\*\/)/,
        /(\bOR\b.*=.*)/i,
        /(\bAND\b.*=.*)/i,
        /(';|";)/,
        /(\bxp_\w+)/i
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Detect potential XSS attempts
 * @param {string} input - User input to check
 * @returns {boolean} - True if suspicious
 */
export function detectXSS(input) {
    if (!input || typeof input !== 'string') {
        return false;
    }

    const xssPatterns = [
        /<script\b/i,
        /<iframe\b/i,
        /<object\b/i,
        /<embed\b/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<img[^>]+src\s*=\s*["']?javascript:/i,
        /data:text\/html/i,
        /<svg\b.*onload/i
    ];

    return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Generate Content Security Policy header
 * @returns {string} - CSP header value
 */
export function generateCSPHeader() {
    const directives = {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'"], // TODO: Remove unsafe-inline in production
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "https:"],
        "connect-src": ["'self'"],
        "font-src": ["'self'"],
        "object-src": ["'none'"],
        "media-src": ["'self'"],
        "frame-src": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"]
    };

    return Object.entries(directives)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ');
}

/**
 * Whitelist response fields (remove sensitive data)
 * @param {Object} data - Response data
 * @param {Array<string>} allowedFields - Allowed field names
 * @returns {Object} - Filtered data
 */
export function whitelistResponseFields(data, allowedFields) {
    if (!data || typeof data !== 'object') {
        return {};
    }

    const filtered = {};
    allowedFields.forEach(field => {
        if (data.hasOwnProperty(field)) {
            filtered[field] = data[field];
        }
    });

    return filtered;
}

/**
 * Hash IP address for privacy-compliant logging
 * @param {string} ipAddress - IP address to hash
 * @param {string} salt - Optional salt (default: daily rotating salt)
 * @returns {string} - Hashed IP
 */
export function hashIP(ipAddress, salt = null) {
    if (!ipAddress) {
        return '';
    }

    // Use daily rotating salt if not provided
    const dailySalt = salt || new Date().toISOString().split('T')[0];

    return crypto
        .createHash('sha256')
        .update(ipAddress + dailySalt)
        .digest('hex');
}

/**
 * Detect if user agent is a bot
 * @param {string} userAgent - User agent string
 * @returns {boolean} - True if bot
 */
export function isBot(userAgent) {
    if (!userAgent || typeof userAgent !== 'string') {
        return false;
    }

    const botPatterns = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i,
        /curl/i,
        /wget/i,
        /python/i,
        /java/i,
        /http/i,
        /googlebot/i,
        /bingbot/i,
        /slurp/i,
        /duckduckbot/i,
        /baiduspider/i,
        /yandexbot/i,
        /facebookexternalhit/i,
        /twitterbot/i,
        /linkedinbot/i,
        /whatsapp/i,
        /telegrambot/i
    ];

    return botPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Detect suspicious request patterns
 * @param {Object} req - Express request object
 * @returns {Object} - { isSuspicious: boolean, reason: string }
 */
export function isSuspiciousRequest(req) {
    const checks = [];

    // Check for SQL injection in query params
    if (req.query) {
        Object.values(req.query).forEach(value => {
            if (typeof value === 'string' && detectSQLInjection(value)) {
                checks.push('SQL injection attempt in query params');
            }
        });
    }

    // Check for XSS in query params
    if (req.query) {
        Object.values(req.query).forEach(value => {
            if (typeof value === 'string' && detectXSS(value)) {
                checks.push('XSS attempt in query params');
            }
        });
    }

    // Check for path traversal
    if (req.path && (req.path.includes('../') || req.path.includes('..\\') || req.path.includes('%2e%2e'))) {
        checks.push('Path traversal attempt');
    }

    // Check for missing or suspicious user agent
    const ua = req.get('user-agent');
    if (!ua || ua.length < 10) {
        checks.push('Missing or suspicious user agent');
    }

    // Check for unusual request methods on public endpoints
    if (req.path.includes('/kb/public/') && !['GET', 'POST'].includes(req.method)) {
        checks.push('Unusual HTTP method on public endpoint');
    }

    return {
        isSuspicious: checks.length > 0,
        reasons: checks
    };
}

/**
 * Generate anonymous session fingerprint
 * @param {Object} req - Express request object
 * @returns {string} - Session fingerprint
 */
export function generateFingerprint(req) {
    const components = [
        req.get('user-agent') || '',
        req.get('accept-language') || '',
        req.get('accept-encoding') || '',
        req.ip || ''
    ];

    return crypto
        .createHash('sha256')
        .update(components.join('|'))
        .digest('hex');
}

/**
 * Validate and sanitize query parameters
 * @param {Object} params - Query parameters
 * @param {Object} schema - Validation schema
 * @returns {Object} - { valid: boolean, sanitized: Object, errors: Array }
 */
export function validateQueryParams(params, schema) {
    const sanitized = {};
    const errors = [];

    Object.keys(schema).forEach(key => {
        const value = params[key];
        const rules = schema[key];

        // Check if required
        if (rules.required && !value) {
            errors.push(`${key} is required`);
            return;
        }

        if (value) {
            // Type validation
            if (rules.type === 'number' && isNaN(Number(value))) {
                errors.push(`${key} must be a number`);
                return;
            }

            // Pattern validation
            if (rules.pattern && !rules.pattern.test(value)) {
                errors.push(`${key} has invalid format`);
                return;
            }

            // Length validation
            if (rules.maxLength && value.length > rules.maxLength) {
                errors.push(`${key} exceeds maximum length`);
                return;
            }

            // Sanitize
            sanitized[key] = rules.sanitize ? rules.sanitize(value) : value;
        }
    });

    return {
        valid: errors.length === 0,
        sanitized,
        errors
    };
}

export default {
    sanitizeSlug,
    validateSlugFormat,
    sanitizeHTML,
    detectSQLInjection,
    detectXSS,
    generateCSPHeader,
    whitelistResponseFields,
    hashIP,
    isBot,
    isSuspiciousRequest,
    generateFingerprint,
    validateQueryParams
};

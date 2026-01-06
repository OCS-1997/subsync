/**
 * Extract the client's IP address from the request object
 * Handles proxy forwarding (X-Forwarded-For header) and direct connections
 * @param {Object} req - Express request object
 * @returns {string|null} - Client IP address or null
 */
export const getClientIp = (req) => {
    // Check for X-Forwarded-For header (used by proxies/load balancers)
    // The first IP in the list is the original client IP
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        const ips = forwardedFor.split(',');
        return ips[0].trim();
    }

    // Fall back to req.ip (direct connection or Express trust proxy setting)
    return req.ip || null;
};

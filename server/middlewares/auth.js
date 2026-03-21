import jwt from 'jsonwebtoken';
import { buildUserContext } from '../services/rbacService.js';

export const isAuthenticated = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: "No token provided" });
        }
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET;
        
        if (!secret) {
            console.error("CRITICAL: JWT_SECRET is not defined in environment variables!".red);
            return res.status(500).json({ error: "Internal Server Error: Auth configuration missing" });
        }

        //console.log(`[AUTH] Verifying token with secret length: ${secret.length}`);
        const decoded = jwt.verify(token, secret);
        const userContext = await buildUserContext(decoded.username);
        if (!userContext) {
            return res.status(401).json({ error: "Invalid user context" });
        }
        userContext.ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
        req.user = userContext;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(403).json({ error: "Invalid or expired token" });
    }
};

export const authorize = (requiredPermissions = [], options = { match: 'all' }) => {
    const normalized = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    return (req, res, next) => {
        if (!normalized.length) {
            return next();
        }
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Admin bypass
        if (req.user.roleKey === 'admin') {
            return next();
        }
        const userPermissions = req.user.permissions || [];
        const hasPermission = options?.match === 'any'
            ? normalized.some((perm) => userPermissions.includes(perm))
            : normalized.every((perm) => userPermissions.includes(perm));
        if (!hasPermission) {
            return res.status(403).json({ error: "Forbidden: insufficient permissions" });
        }
        return next();
    };
};

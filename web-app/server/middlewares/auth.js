import jwt from 'jsonwebtoken';

export const isAuthenticated = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET || "your_secret_key", (err, user) => {
            if (err) return res.status(403).json({ error: "Invalid or expired token" });
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ error: "No token provided" });
    }
};

export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role && req.user.role.toLowerCase() === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admins only.' });
    }
};

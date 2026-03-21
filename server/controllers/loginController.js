import { checkLogin } from '../models/loginModel.js';
import jwt from 'jsonwebtoken';
import { logActivity } from '../models/activityLogModel.js';
import { buildUserContext } from '../services/rbacService.js';

/**
 * Function to be executed when user login details are sent for validation
 * @param   {Request}  req The request received from the client in an endpoint
 * @param   {Response} res The response sent to the client in that endpoint
 * @returns {Promise<*>}
 */
const validateLogin = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await checkLogin(username, password);

        if (user) {
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                console.error("CRITICAL: JWT_SECRET is missing during login!".red);
                throw new Error("JWT_SECRET not configured");
            }
            const token = jwt.sign({ username: user.username, roleId: user.roleId }, secret, { expiresIn: '1d' });
            const authContext = await buildUserContext(user.username);
            const loginTime = new Date().toISOString();
            // Log successful login
            await logActivity({ username: user.username, action: 'LOGIN_SUCCESS', ipAddress: req.ip, details: { loginTime } });
            return res.status(200).json({
                success: true,
                message: "Validation successful.",
                token,
                username: authContext.username,
                name: authContext.name,
                role: authContext.role,
                roleKey: authContext.roleKey,
                permissions: authContext.permissions,
                ip: req.ip,
                loginTime
            });
        }
        else {
            // Log failed login
            await logActivity({ username, action: 'LOGIN_FAILED', ipAddress: req.ip, details: { failureReason: 'Invalid credentials' } });
            return res.status(401).json({ success: false, message: "Invalid username or password." });
        }
    } catch (error) {
        console.error("Error during login validation:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

/**
 * Function to handle user logout and log the activity
 * @param   {Request}  req The request received from the client
 * @param   {Response} res The response sent to the client
 * @returns {Promise<*>}
 */
const logoutUser = async (req, res) => {
    try {
        const username = req.user?.username;
        if (username) {
            const logoutTime = new Date().toISOString();
            // Log logout activity
            await logActivity({ 
                username, 
                action: 'LOGOUT', 
                ipAddress: req.ip, 
                details: { logoutTime }
            });
        }
        res.status(200).json({ success: true, message: "Logout successful." });
    } catch (error) {
        console.error("Error during logout:", error);
        res.status(500).json({ success: false, message: "Internal server error during logout." });
    }
};

export { validateLogin, logoutUser };

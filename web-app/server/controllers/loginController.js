import { checkLogin } from '../models/loginModel.js';
import jwt from 'jsonwebtoken';
import { logActivity } from '../models/activityLogModel.js';

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
            const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
            const loginTime = new Date().toISOString();
            // Log successful login
            await logActivity({ username: user.username, action: 'LOGIN_SUCCESS', ipAddress: req.ip, details: { loginTime } });
            return res.status(200).json({ success: true, message: "Validation successful.", token, username: user.username, name: user.name, role: user.role, ip: req.ip, loginTime });
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

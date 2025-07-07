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
            // Log successful login
            await logActivity({ username: user.username, action: 'LOGIN_SUCCESS', details: { ip: req.ip } });
            return res.status(200).json({ success: true, message: "Validation successful.", token, username: user.username, role: user.role });
        }
        else {
            // Log failed login
            await logActivity({ username, action: 'LOGIN_FAILED', details: { ip: req.ip } });
            return res.status(401).json({ success: false, message: "Invalid username or password." });
        }
    } catch (error) {
        console.error("Error during login validation:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

export { validateLogin };

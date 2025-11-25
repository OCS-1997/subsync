import appDB from "../db/subsyncDB.js";
import bcrypt from "bcrypt";

/**
 * Function to validate user login
 * @param   {string}                 username      The username to be validated
 * @param   {string}                 inputPassword The password input by the user
 * @returns {Promise<number|number>}               The result of validation
 */
async function checkLogin(username, inputPassword) {
    try {
        const [rows] = await appDB.query(
            `SELECT 
                u.username,
                u.name,
                u.email,
                u.password,
                u.is_active AS isActive,
                u.role_id AS roleId,
                r.name AS roleName,
                r.role_key AS roleKey
             FROM users u
             LEFT JOIN roles r ON r.id = u.role_id
             WHERE u.username = ?;`,
            [username]
        );
        if (!rows || rows.length === 0) { return null; }
        const user = rows[0];
        const match = await bcrypt.compare(inputPassword.trim(), user.password.trim());
        if (!match) return null;
        // Remove password before returning
        delete user.password;
        user.role = user.roleName || user.role;
        return user;
    }
    catch (err) {
        console.error("Error during user login:\n", err);
        throw err;
    }
}

export { checkLogin };

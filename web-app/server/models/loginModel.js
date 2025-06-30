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
        const [rows] = await appDB.query("SELECT * FROM users WHERE username = ?;", [username]);
        if (!rows || rows.length === 0) { return null; }
        const user = rows[0];
        const match = await bcrypt.compare(inputPassword.trim(), user.password.trim());
        if (!match) return null;
        // Remove password before returning
        delete user.password;
        return user;
    }
    catch (err) {
        console.error("Error during user login:\n", err);
        throw err;
    }
}

export { checkLogin };
import appDB from "../db/subsyncDB.js";

const getAllUsers = async () => {
    try {
        const [users] = await appDB.query("SELECT * FROM users");
        return users || [];
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
}

const getUserByUsername = async (username) => {
    try {
        const [users] = await appDB.query("SELECT * FROM users WHERE username = ?", [username]);
        return users[0] || null;
    } catch (error) {
        console.error("Error fetching user by username:", error);
        throw error;
    }
};

const createUser = async (user) => {
    try {
        const { username, name, email, password, role, is_active } = user;
        const [result] = await appDB.query(
            `INSERT INTO users (username, name, email, password, role, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [username, name, email, password, role, is_active]
        );
        return result.insertId;
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
};

const updateUser = async (username, user) => {
    try {
        const fields = [];
        const values = [];
        if (user.name !== undefined) { fields.push('name = ?'); values.push(user.name); }
        if (user.email !== undefined) { fields.push('email = ?'); values.push(user.email); }
        if (user.password !== undefined) { fields.push('password = ?'); values.push(user.password); }
        if (user.role !== undefined) { fields.push('role = ?'); values.push(user.role); }
        if (user.is_active !== undefined) { fields.push('is_active = ?'); values.push(user.is_active); }
        fields.push('updated_at = NOW()');
        const sql = `UPDATE users SET ${fields.join(', ')} WHERE username = ?`;
        values.push(username);
        const [result] = await appDB.query(sql, values);
        return result.affectedRows;
    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
};

const deleteUser = async (username) => {
    try {
        const [result] = await appDB.query("DELETE FROM users WHERE username = ?", [username]);
        return result.affectedRows;
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    }
};

export {
    getAllUsers,
    getUserByUsername,
    createUser,
    updateUser,
    deleteUser
};
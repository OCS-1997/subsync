import appDB from "../db/subsyncDB.js";
import { formatMySQLDate } from "../utils/dateFormatter.js";

const userProjection = `
    u.username,
    u.name,
    u.email,
    u.date_of_birth AS dateOfBirth,
    u.role_id AS roleId,
    u.role,
    u.is_active AS isActive,
    u.created_at AS createdAt,
    u.updated_at AS updatedAt,
    r.name AS roleName,
    r.role_key AS roleKey
`;

const mapUserRow = (row = {}) => ({
    username: row.username,
    name: row.name,
    email: row.email,
    date_of_birth: formatMySQLDate(row.dateOfBirth),
    roleId: row.roleId,
    role: row.roleName || row.role || null,
    roleKey: row.roleKey || null,
    is_active: row.isActive === undefined ? undefined : !!row.isActive,
    isActive: row.isActive === undefined ? undefined : !!row.isActive,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
});

const getAllUsers = async () => {
    const [rows] = await appDB.query(
        `SELECT ${userProjection}
         FROM users u
         LEFT JOIN roles r ON r.id = u.role_id
         ORDER BY u.created_at DESC`
    );
    return rows.map(mapUserRow);
};

const getUserByUsername = async (username) => {
    const [rows] = await appDB.query(
        `SELECT ${userProjection}
         FROM users u
         LEFT JOIN roles r ON r.id = u.role_id
         WHERE u.username = ?
         LIMIT 1`,
        [username]
    );
    return rows.length ? mapUserRow(rows[0]) : null;
};

const getUserAuthProfile = async (username) => {
    const [rows] = await appDB.query(
        `SELECT 
            u.username,
            u.name,
            u.email,
            u.date_of_birth AS dateOfBirth,
            u.role_id AS roleId,
            u.role,
            u.is_active AS isActive,
            r.name AS roleName,
            r.role_key AS roleKey
         FROM users u
         LEFT JOIN roles r ON r.id = u.role_id
         WHERE u.username = ?
         LIMIT 1`,
        [username]
    );
    return rows.length ? mapUserRow(rows[0]) : null;
};

const createUser = async ({ username, name, email, password, roleName, roleId, is_active, date_of_birth }) => {
    const [result] = await appDB.query(
        `INSERT INTO users (username, name, email, password, role, role_id, is_active, date_of_birth, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [username, name, email, password, roleName, roleId || null, is_active, formatMySQLDate(date_of_birth)]
    );
    return result.insertId;
};

const updateUser = async (username, user) => {
    const fields = [];
    const values = [];
    if (user.name !== undefined) { fields.push('name = ?'); values.push(user.name); }
    if (user.email !== undefined) { fields.push('email = ?'); values.push(user.email); }
    if (user.password !== undefined) { fields.push('password = ?'); values.push(user.password); }
    if (user.date_of_birth !== undefined) { fields.push('date_of_birth = ?'); values.push(formatMySQLDate(user.date_of_birth)); }
    if (user.roleName !== undefined) { fields.push('role = ?'); values.push(user.roleName); }
    if (user.roleId !== undefined) { fields.push('role_id = ?'); values.push(user.roleId); }
    if (user.is_active !== undefined) { fields.push('is_active = ?'); values.push(user.is_active); }
    fields.push('updated_at = NOW()');
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE username = ?`;
    values.push(username);
    const [result] = await appDB.query(sql, values);
    return result.affectedRows;
};

const deleteUser = async (username) => {
    const [result] = await appDB.query("DELETE FROM users WHERE username = ?", [username]);
    return result.affectedRows;
};

export {
    getAllUsers,
    getUserByUsername,
    getUserAuthProfile,
    createUser,
    updateUser,
    deleteUser
};
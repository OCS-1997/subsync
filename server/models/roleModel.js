import appDB from "../db/subsyncDB.js";

export const getRoles = async () => {
    const [rows] = await appDB.query(
        `SELECT 
            r.id,
            r.role_key AS roleKey,
            r.name,
            r.description,
            r.is_system AS isSystem,
            r.created_at AS createdAt,
            r.updated_at AS updatedAt,
            (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.id) AS permissionCount,
            (SELECT COUNT(*) FROM users u WHERE u.role_id = r.id) AS userCount
        FROM roles r
        ORDER BY r.name`
    );
    return rows;
};

export const getRoleById = async (roleId) => {
    const [rows] = await appDB.query(
        `SELECT id, role_key AS roleKey, name, description, is_system AS isSystem
         FROM roles WHERE id = ?`,
        [roleId]
    );
    return rows[0] || null;
};

export const getRoleByKey = async (roleKey) => {
    const [rows] = await appDB.query(
        `SELECT id, role_key AS roleKey, name, description, is_system AS isSystem
         FROM roles WHERE role_key = ?`,
        [roleKey]
    );
    return rows[0] || null;
};

export const createRole = async ({ roleKey, name, description, isSystem = 0 }) => {
    const normalizedKey = roleKey?.toLowerCase();
    const [result] = await appDB.query(
        `INSERT INTO roles (role_key, name, description, is_system)
         VALUES (?, ?, ?, ?)`,
        [normalizedKey, name, description || null, isSystem]
    );
    return result.insertId;
};

export const updateRole = async (roleId, { roleKey, name, description }) => {
    const updates = [];
    const values = [];
    if (roleKey !== undefined) {
        updates.push('role_key = ?');
        values.push(roleKey.toLowerCase());
    }
    if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
    }
    if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
    }
    if (!updates.length) return 0;
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(roleId);
    const [result] = await appDB.query(
        `UPDATE roles SET ${updates.join(', ')} WHERE id = ?`,
        values
    );
    return result.affectedRows;
};

export const deleteRole = async (roleId) => {
    const [result] = await appDB.query(`DELETE FROM roles WHERE id = ?`, [roleId]);
    return result.affectedRows;
};

export const getRolePermissionsMap = async () => {
    const [rows] = await appDB.query(
        `SELECT rp.role_id AS roleId, p.permission_key AS permissionKey
         FROM role_permissions rp
         JOIN permissions p ON p.id = rp.permission_id`
    );
    return rows;
};

export const replaceRolePermissions = async (roleId, permissionIds = []) => {
    const connection = await appDB.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(`DELETE FROM role_permissions WHERE role_id = ?`, [roleId]);
        if (permissionIds.length) {
            const values = permissionIds.map((permissionId) => [roleId, permissionId]);
            await connection.query(
                `INSERT INTO role_permissions (role_id, permission_id) VALUES ?`,
                [values]
            );
        }
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const getUsersByRole = async (roleId) => {
    const [rows] = await appDB.query(
        `SELECT 
            u.username,
            u.name,
            u.email,
            u.is_active,
            u.created_at AS createdAt
        FROM users u
        WHERE u.role_id = ?
        ORDER BY u.name, u.username`,
        [roleId]
    );
    return rows;
};


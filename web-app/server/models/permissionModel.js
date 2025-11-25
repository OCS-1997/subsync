import appDB from "../db/subsyncDB.js";

export const getAllPermissions = async () => {
    const [permissions] = await appDB.query(
        `SELECT id, permission_key AS permissionKey, resource, action, description
         FROM permissions
         ORDER BY resource, action`
    );
    return permissions;
};

export const getPermissionIdsByKeys = async (permissionKeys = []) => {
    if (!permissionKeys.length) {
        return [];
    }
    const [rows] = await appDB.query(
        `SELECT id, permission_key AS permissionKey
         FROM permissions
         WHERE permission_key IN (?)`,
        [permissionKeys]
    );
    return rows;
};

export const getPermissionsByRoleId = async (roleId) => {
    if (!roleId) return [];
    const [rows] = await appDB.query(
        `SELECT p.permission_key AS permissionKey, p.resource, p.action
         FROM role_permissions rp
         JOIN permissions p ON p.id = rp.permission_id
         WHERE rp.role_id = ?`,
        [roleId]
    );
    return rows;
};


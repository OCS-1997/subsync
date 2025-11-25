import { getPermissionIdsByKeys, getPermissionsByRoleId, getAllPermissions } from "../models/permissionModel.js";
import { createRole, deleteRole, getRoleById, getRoleByKey, getRoles, getRolePermissionsMap, replaceRolePermissions, updateRole } from "../models/roleModel.js";
import { getUserAuthProfile } from "../models/userModel.js";

export const buildUserContext = async (username) => {
    const user = await getUserAuthProfile(username);
    if (!user || user.is_active === false || user.isActive === false) {
        return null;
    }
    const permissions = await getPermissionsByRoleId(user.roleId);
    return {
        username: user.username,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        role: user.role,
        roleKey: user.roleKey,
        isActive: user.isActive,
        permissions: permissions.map((perm) => perm.permissionKey),
    };
};

export const fetchRolesWithDetails = async () => {
    const roles = await getRoles();
    const permissions = await getAllPermissions();
    const rolePermissionMap = await getRolePermissionsMap();
    const permissionsPerRole = roles.map((role) => ({
        ...role,
        permissions: rolePermissionMap
            .filter((entry) => entry.roleId === role.id)
            .map((entry) => entry.permissionKey),
    }));
    return { roles: permissionsPerRole, permissions };
};

export const persistRole = async ({ roleId, roleKey, name, description }) => {
    if (roleId) {
        await updateRole(roleId, { roleKey, name, description });
        return roleId;
    }
    return await createRole({ roleKey, name, description });
};

export const removeRole = async (roleId) => {
    return deleteRole(roleId);
};

export const setRolePermissionsByKeys = async (roleId, permissionKeys = []) => {
    const permissionRows = await getPermissionIdsByKeys(permissionKeys);
    const permissionIds = permissionRows.map((row) => row.id);
    await replaceRolePermissions(roleId, permissionIds);
    return permissionIds.length;
};

export const resolveRoleIdentifier = async ({ roleId, roleKey }) => {
    if (roleId) {
        const role = await getRoleById(roleId);
        if (!role) return null;
        return role;
    }
    if (roleKey) {
        return await getRoleByKey(roleKey);
    }
    return null;
};


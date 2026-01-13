import { getPermissionIdsByKeys, getPermissionsByRoleId, getAllPermissions } from "../models/permissionModel.js";
import { createRole, deleteRole, getRoleById, getRoleByKey, getRoles, getRolePermissionsMap, replaceRolePermissions, updateRole } from "../models/roleModel.js";
import { getUserAuthProfile } from "../models/userModel.js";
import { getUserPermissionOverrides } from "../models/userPermissionOverrideModel.js";

export const buildUserContext = async (username) => {
    const user = await getUserAuthProfile(username);
    if (!user || user.is_active === false || user.isActive === false) {
        return null;
    }

    // Get base permissions from role
    const rolePermissions = await getPermissionsByRoleId(user.roleId);
    const rolePermissionKeys = rolePermissions.map((perm) => perm.permissionKey);

    // Get user-specific permission overrides
    const userOverrides = await getUserPermissionOverrides(username);

    // Apply overrides
    let finalPermissions = [...rolePermissionKeys];

    if (userOverrides && userOverrides.length > 0) {
        userOverrides.forEach(override => {
            const permKey = override.permissionKey;
            const hasFromRole = rolePermissionKeys.includes(permKey);

            if (override.isGranted) {
                // Grant: Add permission if not already present
                if (!finalPermissions.includes(permKey)) {
                    finalPermissions.push(permKey);
                }
            } else {
                // Deny: Remove permission if present
                finalPermissions = finalPermissions.filter(p => p !== permKey);
            }
        });
    }

    return {
        username: user.username,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        role: user.role,
        roleKey: user.roleKey,
        isActive: user.isActive,
        permissions: finalPermissions,
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


import { getAllPermissions } from "../models/permissionModel.js";
import { getRoleById } from "../models/roleModel.js";
import { fetchRolesWithDetails, persistRole, removeRole, setRolePermissionsByKeys } from "../services/rbacService.js";

export const listRolesController = async (req, res) => {
    try {
        const { roles } = await fetchRolesWithDetails();
        res.json(roles);
    } catch (error) {
        console.error("Error fetching roles:", error);
        res.status(500).json({ error: "Failed to fetch roles" });
    }
};

export const createRoleController = async (req, res) => {
    try {
        const { roleKey, name, description } = req.body;
        if (!roleKey || !name) {
            return res.status(400).json({ error: "roleKey and name are required" });
        }
        const roleId = await persistRole({ roleKey, name, description });
        res.status(201).json({ message: "Role created", roleId });
    } catch (error) {
        console.error("Error creating role:", error);
        res.status(500).json({ error: "Failed to create role" });
    }
};

export const updateRoleController = async (req, res) => {
    try {
        const { roleId } = req.params;
        const { roleKey, name, description } = req.body;
        const existing = await getRoleById(roleId);
        if (!existing) {
            return res.status(404).json({ error: "Role not found" });
        }
        await persistRole({ roleId, roleKey, name, description });
        res.json({ message: "Role updated" });
    } catch (error) {
        console.error("Error updating role:", error);
        res.status(500).json({ error: "Failed to update role" });
    }
};

export const deleteRoleController = async (req, res) => {
    try {
        const { roleId } = req.params;
        const existing = await getRoleById(roleId);
        if (!existing) {
            return res.status(404).json({ error: "Role not found" });
        }
        if (existing.isSystem) {
            return res.status(400).json({ error: "System roles cannot be deleted" });
        }
        await removeRole(roleId);
        res.json({ message: "Role deleted" });
    } catch (error) {
        console.error("Error deleting role:", error);
        res.status(500).json({ error: "Failed to delete role" });
    }
};

export const assignPermissionsController = async (req, res) => {
    try {
        const { roleId } = req.params;
        const { permissions = [] } = req.body;
        const role = await getRoleById(roleId);
        if (!role) {
            return res.status(404).json({ error: "Role not found" });
        }
        await setRolePermissionsByKeys(role.id, permissions);
        res.json({ message: "Permissions updated" });
    } catch (error) {
        console.error("Error assigning permissions:", error);
        res.status(500).json({ error: "Failed to assign permissions" });
    }
};

export const listPermissionsController = async (_req, res) => {
    try {
        const permissions = await getAllPermissions();
        res.json(permissions);
    } catch (error) {
        console.error("Error fetching permissions:", error);
        res.status(500).json({ error: "Failed to fetch permissions" });
    }
};


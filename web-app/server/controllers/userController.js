import { getAllUsers, getUserByUsername, createUser, updateUser, deleteUser } from "../models/userModel.js";
import bcrypt from "bcrypt";
import { logActivity } from "../models/activityLogModel.js";
import { resolveRoleIdentifier } from "../services/rbacService.js";
import { PERMISSIONS } from "../constants/permissions.js";

export const getallUsers = async (req, res) => {
    try {
        const users = await getAllUsers();
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getUser = async (req, res) => {
    try {
        const { username } = req.params;
        const isSelfView = req.user.username === username;
        
        // Allow users to view their own profile without USERS_VIEW permission
        if (!isSelfView && !req.user.permissions?.includes(PERMISSIONS.USERS_VIEW) && req.user.roleKey !== 'admin') {
            return res.status(403).json({ message: "Insufficient permission to view other users" });
        }
        
        const user = await getUserByUsername(username);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const createUserController = async (req, res) => {
    try {
        const { username, name, email, password, roleKey, roleId, is_active = true } = req.body;
        if (!username || !name || !email || !password) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        if (!req.user.permissions?.includes(PERMISSIONS.USERS_ASSIGN_ROLES) && req.user.roleKey !== 'admin') {
            return res.status(403).json({ message: "Insufficient permission to assign roles" });
        }
        const role = await resolveRoleIdentifier({ roleId, roleKey });
        if (!role) {
            return res.status(400).json({ message: "Invalid role selection" });
        }
        const existing = await getUserByUsername(username);
        if (existing) {
            return res.status(409).json({ message: "Username already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await createUser({
            username,
            name,
            email,
            password: hashedPassword,
            roleName: role.name,
            roleId: role.id,
            is_active
        });
        if (req.user && req.user.username) {
            await logActivity({
                username: req.user.username,
                action: 'CREATE_USER',
                resourceType: 'User',
                resourceId: username,
                ipAddress: req.ip,
                details: { name, email, role: role.name, is_active }
            });
        }
        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const updateUserController = async (req, res) => {
    try {
        const { username } = req.params;
        const isSelfUpdate = req.user.username === username;
        const user = await getUserByUsername(username);
        if (!user) return res.status(404).json({ message: "User not found" });
        
        const updateData = { ...req.body };
        
        // Allow self-updates for name, email, and password without USERS_UPDATE permission
        // But require permission for role changes or updating other users
        if (updateData.roleKey || updateData.roleId) {
            if (!req.user.permissions?.includes(PERMISSIONS.USERS_ASSIGN_ROLES) && req.user.roleKey !== 'admin') {
                return res.status(403).json({ message: "Insufficient permission to assign roles" });
            }
            const role = await resolveRoleIdentifier({ roleId: updateData.roleId, roleKey: updateData.roleKey });
            if (!role) {
                return res.status(400).json({ message: "Invalid role selection" });
            }
            updateData.roleName = role.name;
            updateData.roleId = role.id;
        }
        
        // For non-self updates, require USERS_UPDATE permission (unless it's just role assignment)
        if (!isSelfUpdate && !updateData.roleKey && !updateData.roleId) {
            if (!req.user.permissions?.includes(PERMISSIONS.USERS_UPDATE) && req.user.roleKey !== 'admin') {
                return res.status(403).json({ message: "Insufficient permission to update other users" });
            }
        }
        
        // For self-updates, only allow name, email, and password
        if (isSelfUpdate) {
            const allowedFields = ['name', 'email', 'password'];
            Object.keys(updateData).forEach(key => {
                if (!allowedFields.includes(key)) {
                    delete updateData[key];
                }
            });
        }
        
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }
        
        await updateUser(username, updateData);
        if (req.user && req.user.username) {
            await logActivity({
                username: req.user.username,
                action: isSelfUpdate ? 'UPDATE_OWN_PROFILE' : 'UPDATE_USER',
                resourceType: 'User',
                resourceId: username,
                ipAddress: req.ip,
                details: Object.keys(updateData).reduce((acc, key) => {
                    if (key !== 'password') acc[key] = updateData[key];
                    return acc;
                }, {})
            });
        }
        res.json({ message: "User updated successfully" });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const deleteUserController = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await getUserByUsername(username);
        if (!user) return res.status(404).json({ message: "User not found" });
        await deleteUser(username);
        // Log activity (admin deletes user)
        if (req.user && req.user.username) {
            await logActivity({ username: req.user.username, action: 'DELETE_USER', resourceType: 'User', ipAddress: req.ip, resourceId: username });
        }
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};




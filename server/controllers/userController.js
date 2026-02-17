import { getAllUsers, getUserByUsername, createUser, updateUser, deleteUser } from "../models/userModel.js";
import bcrypt from "bcrypt";
import { logActivity } from "../models/activityLogModel.js";
import { resolveRoleIdentifier } from "../services/rbacService.js";
import { PERMISSIONS } from "../constants/permissions.js";
import { assignUserToMultipleTeams, removeUserFromAllTeams, getUserTeams } from "../models/teamsModel.js";
import { isValidPassword } from "../middlewares/validations.js";

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
        
        // Fetch teams for the user
        const teams = await getUserTeams(username);
        user.teams = teams.map(t => ({ id: t.id, name: t.team_name, color: t.color }));
        
        res.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const createUserController = async (req, res) => {
    try {
        const { username, name, email, password, roleKey, roleId, is_active = true, date_of_birth } = req.body;
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
        if (!isValidPassword(password)) {
            return res.status(400).json({ message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await createUser({
            username,
            name,
            email,
            password: hashedPassword,
            roleName: role.name,
            roleId: role.id,
            is_active,
            date_of_birth
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

        // Handle team assignments
        if (req.body.teams && Array.from(req.body.teams).length > 0) {
            await assignUserToMultipleTeams(username, req.body.teams, req.user?.username);
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

        // Handle potential username change
        if (updateData.username && updateData.username !== username) {
            // Only Admins or Managers can change usernames
            if (req.user.roleKey !== 'admin' && req.user.roleKey !== 'manager') {
                return res.status(403).json({ message: "Insufficient permission to change username" });
            }
            // Check if new username already exists
            const existing = await getUserByUsername(updateData.username);
            if (existing) {
                return res.status(409).json({ message: "The new username is already taken" });
            }
        }

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

        // For non-self updates, require USERS_UPDATE permission (unless it's just role assignment or username change by admin/manager)
        if (!isSelfUpdate && !updateData.roleKey && !updateData.roleId && !updateData.username) {
            if (!req.user.permissions?.includes(PERMISSIONS.USERS_UPDATE) && req.user.roleKey !== 'admin') {
                return res.status(403).json({ message: "Insufficient permission to update other users" });
            }
        }

        // For self-updates, only allow name, email, password, and date_of_birth
        // Also block self-username change if not admin/manager
        if (isSelfUpdate) {
            const allowedFields = ['name', 'email', 'password', 'date_of_birth'];
            // Admins/Managers can change their own username too? 
            // The prompt says "admins and managers should be able to change username", 
            // which implies they can change ANY username including their own if needed.
            if (req.user.roleKey === 'admin' || req.user.roleKey === 'manager') {
                allowedFields.push('username');
            }

            Object.keys(updateData).forEach(key => {
                if (!allowedFields.includes(key)) {
                    delete updateData[key];
                }
            });
        }

        if (updateData.password) {
            if (!isValidPassword(updateData.password)) {
                return res.status(400).json({ message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character." });
            }
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        await updateUser(username, updateData);

        if (req.user && req.user.username) {
            await logActivity({
                username: req.user.username,
                action: isSelfUpdate ? 'UPDATE_OWN_PROFILE' : 'UPDATE_USER',
                resourceType: 'User',
                resourceId: updateData.username || username,
                ipAddress: req.ip,
                details: Object.keys(updateData).reduce((acc, key) => {
                    if (key !== 'password') acc[key] = updateData[key];
                    return acc;
                }, { originalUsername: username })
            });
        }
        if (updateData.teams !== undefined) {
            await removeUserFromAllTeams(username, req.user?.username);
            if (updateData.teams.length > 0) {
                await assignUserToMultipleTeams(updateData.username || username, updateData.teams, req.user.username);
            }
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




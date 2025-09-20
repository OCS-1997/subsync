import { getAllUsers, getUserByUsername, createUser, updateUser, deleteUser } from "../models/userModel.js";
import bcrypt from "bcrypt";
import { logActivity } from "../models/activityLogModel.js";

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
        const user = await getUserByUsername(req.params.username);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const createUserController = async (req, res) => {
    try {
        const { username, name, email, password, role, is_active } = req.body;
        if (!username || !name || !email || !password || !role) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const existing = await getUserByUsername(username);
        if (existing) {
            return res.status(409).json({ message: "Username already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await createUser({ username, name, email, password: hashedPassword, role, is_active });
        // Log activity (admin creates user)
        if (req.user && req.user.username) {
            await logActivity({ username: req.user.username, action: 'CREATE_USER', resourceType: 'User', resourceId: username, ipAddress: req.ip, details: { name, email, role, is_active } });
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
        const user = await getUserByUsername(username);
        if (!user) return res.status(404).json({ message: "User not found" });
        const updateData = { ...req.body };
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }
        await updateUser(username, updateData);
        // Log activity (admin updates user)
        if (req.user && req.user.username) {
            await logActivity({ username: req.user.username, action: 'UPDATE_USER', resourceType: 'User', resourceId: username, ipAddress: req.ip, details: updateData });
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




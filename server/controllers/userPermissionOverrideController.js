import {
    getUserPermissionOverrides,
    getUserPermissionOverride,
    setUserPermissionOverride,
    removeUserPermissionOverride,
    removeAllUserPermissionOverrides,
    batchSetUserPermissionOverrides,
    getUsersWithOverrides
} from "../models/userPermissionOverrideModel.js";
import { getUserByUsername } from "../models/userModel.js";

/**
 * Get all permission overrides for a specific user
 */
export const getUserOverridesController = async (req, res) => {
    try {
        const { username } = req.params;

        // Verify user exists
        const user = await getUserByUsername(username);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const overrides = await getUserPermissionOverrides(username);
        res.json(overrides);
    } catch (error) {
        console.error("Error fetching user permission overrides:", error);
        res.status(500).json({ error: "Failed to fetch permission overrides" });
    }
};

/**
 * Set a permission override for a user
 */
export const setUserOverrideController = async (req, res) => {
    try {
        const { username } = req.params;
        const { permissionId, isGranted, reason } = req.body;

        if (permissionId === undefined || isGranted === undefined) {
            return res.status(400).json({
                error: "permissionId and isGranted are required"
            });
        }

        // Verify user exists
        const user = await getUserByUsername(username);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const createdBy = req.user?.username;
        await setUserPermissionOverride(username, permissionId, isGranted, reason, createdBy);

        res.json({ message: "Permission override set successfully" });
    } catch (error) {
        console.error("Error setting permission override:", error);
        res.status(500).json({ error: "Failed to set permission override" });
    }
};

/**
 * Remove a specific permission override
 */
export const removeUserOverrideController = async (req, res) => {
    try {
        const { username, permissionId } = req.params;

        // Verify user exists
        const user = await getUserByUsername(username);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        await removeUserPermissionOverride(username, permissionId);
        res.json({ message: "Permission override removed successfully" });
    } catch (error) {
        console.error("Error removing permission override:", error);
        res.status(500).json({ error: "Failed to remove permission override" });
    }
};

/**
 * Remove all permission overrides for a user
 */
export const removeAllUserOverridesController = async (req, res) => {
    try {
        const { username } = req.params;

        // Verify user exists
        const user = await getUserByUsername(username);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        await removeAllUserPermissionOverrides(username);
        res.json({ message: "All permission overrides removed successfully" });
    } catch (error) {
        console.error("Error removing all permission overrides:", error);
        res.status(500).json({ error: "Failed to remove all permission overrides" });
    }
};

/**
 * Batch set permission overrides for a user
 */
export const batchSetUserOverridesController = async (req, res) => {
    try {
        const { username } = req.params;
        const { overrides } = req.body;

        if (!Array.isArray(overrides)) {
            return res.status(400).json({
                error: "overrides must be an array"
            });
        }

        // Verify user exists
        const user = await getUserByUsername(username);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const createdBy = req.user?.username;
        await batchSetUserPermissionOverrides(username, overrides, createdBy);

        res.json({ message: "Permission overrides updated successfully" });
    } catch (error) {
        console.error("Error batch updating permission overrides:", error);
        res.status(500).json({ error: "Failed to update permission overrides" });
    }
};

/**
 * Get all users who have permission overrides
 */
export const getUsersWithOverridesController = async (req, res) => {
    try {
        const users = await getUsersWithOverrides();
        res.json(users);
    } catch (error) {
        console.error("Error fetching users with overrides:", error);
        res.status(500).json({ error: "Failed to fetch users with overrides" });
    }
};

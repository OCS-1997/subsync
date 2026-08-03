import {
    getGoalCategories,
    createGoalCategory,
    updateGoalCategory,
    deleteGoalCategory,
    getBusinessImpacts,
    createBusinessImpact,
    updateBusinessImpact,
    deleteBusinessImpact,
    getGoalStatuses,
    createGoalStatus,
    updateGoalStatus,
    deleteGoalStatus
} from "../models/goalMasterModel.js";

// ==========================================
// CATEGORIES CONTROLLER
// ==========================================

export const getCategories = async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true' || req.query.includeInactive === '1';
        const categories = await getGoalCategories({ includeInactive });
        return res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching goal categories:", error);
        return res.status(500).json({ error: "Failed to fetch goal categories" });
    }
};

export const postCategory = async (req, res) => {
    try {
        const { name, description, is_active, display_order } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Category name is required" });
        }
        const category_id = await createGoalCategory({ name: name.trim(), description, is_active, display_order });
        return res.status(201).json({ success: true, category_id, message: "Goal category created successfully" });
    } catch (error) {
        console.error("Error creating goal category:", error);
        return res.status(500).json({ error: error.message || "Failed to create goal category" });
    }
};

export const putCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, is_active, display_order } = req.body;
        const updated = await updateGoalCategory(id, { name, description, is_active, display_order });
        if (!updated) {
            return res.status(404).json({ error: "Category not found or no changes made" });
        }
        return res.status(200).json({ success: true, message: "Goal category updated successfully" });
    } catch (error) {
        console.error("Error updating goal category:", error);
        return res.status(500).json({ error: error.message || "Failed to update goal category" });
    }
};

export const removeCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteGoalCategory(id);
        return res.status(200).json({ success: true, message: "Goal category deleted successfully" });
    } catch (error) {
        console.error("Error deleting goal category:", error);
        return res.status(400).json({ error: error.message || "Failed to delete goal category" });
    }
};


// ==========================================
// BUSINESS IMPACT CONTROLLER
// ==========================================

export const getImpacts = async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true' || req.query.includeInactive === '1';
        const impacts = await getBusinessImpacts({ includeInactive });
        return res.status(200).json(impacts);
    } catch (error) {
        console.error("Error fetching business impacts:", error);
        return res.status(500).json({ error: "Failed to fetch business impacts" });
    }
};

export const postImpact = async (req, res) => {
    try {
        const { name, description, is_active, display_order } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Business Impact name is required" });
        }
        const impact_id = await createBusinessImpact({ name: name.trim(), description, is_active, display_order });
        return res.status(201).json({ success: true, impact_id, message: "Business impact created successfully" });
    } catch (error) {
        console.error("Error creating business impact:", error);
        return res.status(500).json({ error: error.message || "Failed to create business impact" });
    }
};

export const putImpact = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, is_active, display_order } = req.body;
        const updated = await updateBusinessImpact(id, { name, description, is_active, display_order });
        if (!updated) {
            return res.status(404).json({ error: "Business impact not found or no changes made" });
        }
        return res.status(200).json({ success: true, message: "Business impact updated successfully" });
    } catch (error) {
        console.error("Error updating business impact:", error);
        return res.status(500).json({ error: error.message || "Failed to update business impact" });
    }
};

export const removeImpact = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteBusinessImpact(id);
        return res.status(200).json({ success: true, message: "Business impact deleted successfully" });
    } catch (error) {
        console.error("Error deleting business impact:", error);
        return res.status(400).json({ error: error.message || "Failed to delete business impact" });
    }
};


// ==========================================
// STATUSES CONTROLLER
// ==========================================

export const getStatuses = async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true' || req.query.includeInactive === '1';
        const statuses = await getGoalStatuses({ includeInactive });
        return res.status(200).json(statuses);
    } catch (error) {
        console.error("Error fetching goal statuses:", error);
        return res.status(500).json({ error: "Failed to fetch goal statuses" });
    }
};

export const postStatus = async (req, res) => {
    try {
        const { name, code, description, badge_color, icon, is_completed_status, is_active, is_default, display_order } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Status name is required" });
        }
        const status_id = await createGoalStatus({
            name: name.trim(), code, description, badge_color, icon,
            is_completed_status, is_active, is_default, display_order
        });
        return res.status(201).json({ success: true, status_id, message: "Goal status created successfully" });
    } catch (error) {
        console.error("Error creating goal status:", error);
        return res.status(500).json({ error: error.message || "Failed to create goal status" });
    }
};

export const putStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, description, badge_color, icon, is_completed_status, is_active, is_default, display_order } = req.body;
        const updated = await updateGoalStatus(id, {
            name, code, description, badge_color, icon,
            is_completed_status, is_active, is_default, display_order
        });
        if (!updated) {
            return res.status(404).json({ error: "Goal status not found or no changes made" });
        }
        return res.status(200).json({ success: true, message: "Goal status updated successfully" });
    } catch (error) {
        console.error("Error updating goal status:", error);
        return res.status(500).json({ error: error.message || "Failed to update goal status" });
    }
};

export const removeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteGoalStatus(id);
        return res.status(200).json({ success: true, message: "Goal status deleted successfully" });
    } catch (error) {
        console.error("Error deleting goal status:", error);
        return res.status(400).json({ error: error.message || "Failed to delete goal status" });
    }
};

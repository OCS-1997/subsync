import {
    // Asset Types
    getAllAssetTypes,
    createAssetType,
    updateAssetType,
    deleteAssetType,
    // Categories
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    // Assets
    createAsset,
    getAllAssets,
    getAssetById,
    updateAsset,
    deleteAsset,
    restoreAsset,
    assignAsset,
    unassignAsset,
    // History
    getAssetHistory,
    // Attachments
    addAttachment,
    deleteAttachment,
    // Stats
    getAssetStats
} from '../models/assetModel.js';
import { logActivity } from '../models/activityLogModel.js';

// ==================== ASSET TYPES ====================

export const getAssetTypesController = async (req, res) => {
    try {
        const types = await getAllAssetTypes();
        return res.status(200).json(types);
    } catch (error) {
        console.error("Error fetching asset types:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const createAssetTypeController = async (req, res) => {
    try {
        const result = await createAssetType(req.body);
        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'CREATE_ASSET_TYPE',
                resourceType: 'AssetType',
                resourceId: result.insertId,
                ipAddress: req.ip,
                details: req.body
            });
        }
        return res.status(201).json({ message: "Asset type created", id: result.insertId });
    } catch (error) {
        console.error("Error creating asset type:", error);
        return res.status(400).json({ error: error.message || "Failed to create asset type" });
    }
};

export const updateAssetTypeController = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await updateAssetType(id, req.body);
        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'UPDATE_ASSET_TYPE',
                resourceType: 'AssetType',
                resourceId: id,
                ipAddress: req.ip,
                details: req.body
            });
        }
        return res.status(200).json({ message: "Asset type updated" });
    } catch (error) {
        console.error("Error updating asset type:", error);
        return res.status(400).json({ error: error.message || "Failed to update asset type" });
    }
};

export const deleteAssetTypeController = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteAssetType(id);
        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'DELETE_ASSET_TYPE',
                resourceType: 'AssetType',
                resourceId: id,
                ipAddress: req.ip
            });
        }
        return res.status(200).json({ message: "Asset type deleted" });
    } catch (error) {
        console.error("Error deleting asset type:", error);
        return res.status(400).json({ error: error.message || "Failed to delete asset type" });
    }
};

// ==================== ASSET CATEGORIES ====================

export const getCategoriesController = async (req, res) => {
    try {
        const categories = await getAllCategories();
        return res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const createCategoryController = async (req, res) => {
    try {
        const result = await createCategory(req.body);
        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'CREATE_ASSET_CATEGORY',
                resourceType: 'AssetCategory',
                resourceId: result.insertId,
                ipAddress: req.ip,
                details: req.body
            });
        }
        return res.status(201).json({ message: "Category created", id: result.insertId });
    } catch (error) {
        console.error("Error creating category:", error);
        return res.status(400).json({ error: error.message || "Failed to create category" });
    }
};

export const updateCategoryController = async (req, res) => {
    try {
        const { id } = req.params;
        await updateCategory(id, req.body);
        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'UPDATE_ASSET_CATEGORY',
                resourceType: 'AssetCategory',
                resourceId: id,
                ipAddress: req.ip,
                details: req.body
            });
        }
        return res.status(200).json({ message: "Category updated" });
    } catch (error) {
        console.error("Error updating category:", error);
        return res.status(400).json({ error: error.message || "Failed to update category" });
    }
};

export const deleteCategoryController = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteCategory(id);
        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'DELETE_ASSET_CATEGORY',
                resourceType: 'AssetCategory',
                resourceId: id,
                ipAddress: req.ip
            });
        }
        return res.status(200).json({ message: "Category deleted" });
    } catch (error) {
        console.error("Error deleting category:", error);
        return res.status(400).json({ error: error.message || "Failed to delete category" });
    }
};

// ==================== ASSETS ====================

export const getAllAssetsController = async (req, res) => {
    try {
        const { search, sort, order, page, limit, category_id, type_id, status, assigned_to } = req.query;
        const result = await getAllAssets({
            search,
            sort,
            order,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            category_id,
            type_id,
            status,
            assigned_to
        });
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching assets:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getAssetByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const asset = await getAssetById(id);
        if (!asset) {
            return res.status(404).json({ error: "Asset not found" });
        }
        return res.status(200).json(asset);
    } catch (error) {
        console.error("Error fetching asset:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const createAssetController = async (req, res) => {
    try {
        const result = await createAsset(req.body);
        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'CREATE_ASSET',
                resourceType: 'Asset',
                resourceId: result.asset_id,
                ipAddress: req.ip,
                details: { asset_name: req.body.asset_name }
            });
        }
        return res.status(201).json({ message: "Asset created", asset_id: result.asset_id });
    } catch (error) {
        console.error("Error creating asset:", error);
        return res.status(400).json({ error: error.message || "Failed to create asset" });
    }
};

export const updateAssetController = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await getAssetById(id);
        if (!existing) {
            return res.status(404).json({ error: "Asset not found" });
        }
        await updateAsset(id, req.body);
        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'UPDATE_ASSET',
                resourceType: 'Asset',
                resourceId: id,
                ipAddress: req.ip,
                details: { asset_name: req.body.asset_name }
            });
        }
        return res.status(200).json({ message: "Asset updated" });
    } catch (error) {
        console.error("Error updating asset:", error);
        return res.status(400).json({ error: error.message || "Failed to update asset" });
    }
};

export const deleteAssetController = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await getAssetById(id);
        if (!existing) {
            return res.status(404).json({ error: "Asset not found" });
        }
        await deleteAsset(id, req.user?.username);
        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'DELETE_ASSET',
                resourceType: 'Asset',
                resourceId: id,
                ipAddress: req.ip
            });
        }
        return res.status(200).json({ message: "Asset deleted" });
    } catch (error) {
        console.error("Error deleting asset:", error);
        return res.status(500).json({ error: error.message || "Failed to delete asset" });
    }
};

export const restoreAssetController = async (req, res) => {
    try {
        const { id } = req.params;
        await restoreAsset(id, req.user?.username);
        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'RESTORE_ASSET',
                resourceType: 'Asset',
                resourceId: id,
                ipAddress: req.ip
            });
        }
        return res.status(200).json({ message: "Asset restored" });
    } catch (error) {
        console.error("Error restoring asset:", error);
        return res.status(500).json({ error: error.message || "Failed to restore asset" });
    }
};

export const assignAssetController = async (req, res) => {
    try {
        const { id } = req.params;
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }
        const existing = await getAssetById(id);
        if (!existing) {
            return res.status(404).json({ error: "Asset not found" });
        }
        await assignAsset(id, username, req.user?.username);
        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'ASSIGN_ASSET',
                resourceType: 'Asset',
                resourceId: id,
                ipAddress: req.ip,
                details: { assigned_to: username }
            });
        }
        return res.status(200).json({ message: "Asset assigned successfully" });
    } catch (error) {
        console.error("Error assigning asset:", error);
        return res.status(400).json({ error: error.message || "Failed to assign asset" });
    }
};

export const unassignAssetController = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await getAssetById(id);
        if (!existing) {
            return res.status(404).json({ error: "Asset not found" });
        }
        await unassignAsset(id, req.user?.username);
        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'UNASSIGN_ASSET',
                resourceType: 'Asset',
                resourceId: id,
                ipAddress: req.ip
            });
        }
        return res.status(200).json({ message: "Asset unassigned successfully" });
    } catch (error) {
        console.error("Error unassigning asset:", error);
        return res.status(400).json({ error: error.message || "Failed to unassign asset" });
    }
};

export const getAssetHistoryController = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit } = req.query;
        const history = await getAssetHistory(id, parseInt(limit) || 50);
        return res.status(200).json(history);
    } catch (error) {
        console.error("Error fetching asset history:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// ==================== STATISTICS ====================

export const getAssetStatsController = async (req, res) => {
    try {
        const stats = await getAssetStats();
        return res.status(200).json(stats);
    } catch (error) {
        console.error("Error fetching asset stats:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

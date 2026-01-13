import * as opportunityModel from "../models/opportunityModel.js";
import { logActivity } from "../models/activityLogModel.js";
import { getClientIp } from "../utils/ipHelper.js";

/**
 * Create a new opportunity
 */
export const createOpportunityController = async (req, res) => {
    try {
        const opportunityId = await opportunityModel.createOpportunity(req.body);

        await logActivity({
            username: req.user.username,
            action: "Create Opportunity",
            details: `Created opportunity ${opportunityId} for customer ${req.body.customer_id}`,
            resourceType: "Opportunity",
            resourceId: opportunityId,
            ipAddress: getClientIp(req)
        });

        res.status(201).json({
            success: true,
            message: "Opportunity created successfully",
            opportunity_id: opportunityId
        });
    } catch (error) {
        console.error("Error creating opportunity:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to create opportunity" });
    }
};

/**
 * Update an opportunity
 */
export const updateOpportunityController = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await opportunityModel.updateOpportunity(id, req.body);

        if (!success) {
            return res.status(404).json({ success: false, message: "Opportunity not found or no changes made" });
        }

        await logActivity({
            username: req.user.username,
            action: "Update Opportunity",
            details: `Updated opportunity ${id}`,
            resourceType: "Opportunity",
            resourceId: id,
            ipAddress: getClientIp(req)
        });

        res.status(200).json({ success: true, message: "Opportunity updated successfully" });
    } catch (error) {
        console.error("Error updating opportunity:", error);
        res.status(500).json({ success: false, message: "Failed to update opportunity" });
    }
};

/**
 * Get all opportunities with filtering and pagination
 */
export const getAllOpportunitiesController = async (req, res) => {
    try {
        const filters = {
            search: req.query.search || "",
            sort: req.query.sort || "opportunity_date",
            order: req.query.order || "desc",
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            status: req.query.status || null,
            owner: req.query.owner || null,
            customer_id: req.query.customer_id || null
        };

        const result = await opportunityModel.getAllOpportunities(filters);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        console.error("Error fetching opportunities:", error);
        res.status(500).json({ success: false, message: "Failed to fetch opportunities" });
    }
};

/**
 * Get single opportunity
 */
export const getOpportunityByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const opportunity = await opportunityModel.getOpportunityById(id);

        if (!opportunity) {
            return res.status(404).json({ success: false, message: "Opportunity not found" });
        }

        res.status(200).json({ success: true, opportunity });
    } catch (error) {
        console.error("Error fetching opportunity:", error);
        res.status(500).json({ success: false, message: "Failed to fetch opportunity" });
    }
};

/**
 * Delete (soft delete) an opportunity
 */
export const deleteOpportunityController = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await opportunityModel.updateOpportunity(id, { is_deleted: 1 });

        if (!success) {
            return res.status(404).json({ success: false, message: "Opportunity not found" });
        }

        await logActivity({
            username: req.user.username,
            action: "Delete Opportunity",
            details: `Soft deleted opportunity ${id}`,
            resourceType: "Opportunity",
            resourceId: id,
            ipAddress: getClientIp(req)
        });

        res.status(200).json({ success: true, message: "Opportunity deleted successfully" });
    } catch (error) {
        console.error("Error deleting opportunity:", error);
        res.status(500).json({ success: false, message: "Failed to delete opportunity" });
    }
};

/**
 * Status Controllers
 */
export const getOpportunityStatusesController = async (req, res) => {
    try {
        const statuses = await opportunityModel.getOpportunityStatuses();
        res.status(200).json({ success: true, statuses });
    } catch (error) {
        console.error("Error fetching statuses:", error);
        res.status(500).json({ success: false, message: "Failed to fetch statuses" });
    }
};

export const createStatusController = async (req, res) => {
    try {
        const statusId = await opportunityModel.createOpportunityStatus(req.body);
        res.status(201).json({ success: true, message: "Status created successfully", status_id: statusId });
    } catch (error) {
        console.error("Error creating status:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to create status" });
    }
};

export const updateStatusController = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await opportunityModel.updateOpportunityStatus(id, req.body);
        if (!success) return res.status(404).json({ success: false, message: "Status not found" });
        res.status(200).json({ success: true, message: "Status updated successfully" });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ success: false, message: "Failed to update status" });
    }
};

export const deleteStatusController = async (req, res) => {
    try {
        const { id } = req.params;
        await opportunityModel.deleteOpportunityStatus(id);
        res.status(200).json({ success: true, message: "Status deleted successfully" });
    } catch (error) {
        console.error("Error deleting status:", error);
        res.status(400).json({ success: false, message: error.message || "Failed to delete status" });
    }
};

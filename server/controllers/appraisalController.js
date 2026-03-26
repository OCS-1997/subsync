import appraisalModel from "../models/appraisalModel.js";
import { logActivity } from "../models/activityLogModel.js";
import { triggerAppraisalActivationEmails, calculateUserAppraisalStats } from "../services/appraisalService.js";

/**
 * ADMIN: Template Management
 */

export const getTemplates = async (req, res) => {
    try {
        //console.log("[APPRAISAL] Fetching templates for user:", req.user.username);
        const templates = await appraisalModel.getTemplates();
        //console.log(`[APPRAISAL] Found ${templates.length} templates.`);
        res.status(200).json({ templates });
    } catch (error) {
        console.error("[APPRAISAL] Error fetching templates:", error);
        res.status(500).json({ error: "Failed to fetch appraisal templates." });
    }
};

export const createTemplate = async (req, res) => {
    try {
        const { name, description, questions } = req.body;
        //console.log("[APPRAISAL] Creating template:", { name, questionsCount: questions?.length });

        if (!name || !questions) {
            return res.status(400).json({ error: "Name and questions are required." });
        }
        const id = await appraisalModel.createTemplate({ name, description, questions });
        
        //console.log("[APPRAISAL] Template created with ID:", id);

        await logActivity({
            username: req.user.username,
            action: 'CREATE_APPRAISAL_TEMPLATE',
            resourceType: 'AppraisalTemplate',
            resourceId: id.toString(),
            ipAddress: req.ip,
            details: { name }
        });

        res.status(201).json({ message: "Template created successfully!", id });
    } catch (error) {
        console.error("[APPRAISAL] Error creating template:", error);
        res.status(500).json({ error: "Failed to create appraisal template." });
    }
};

export const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, questions } = req.body;

        if (!name || !questions) {
            return res.status(400).json({ error: "Name and questions are required." });
        }

        await appraisalModel.updateTemplate(id, { name, description, questions });

        await logActivity({
            username: req.user.username,
            action: 'UPDATE_APPRAISAL_TEMPLATE',
            resourceType: 'AppraisalTemplate',
            resourceId: id.toString(),
            ipAddress: req.ip,
            details: { name }
        });

        res.status(200).json({ message: "Template updated successfully!" });
    } catch (error) {
        console.error("[APPRAISAL] Error updating template:", error);
        res.status(500).json({ error: "Failed to update appraisal template." });
    }
};

export const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        await appraisalModel.deleteTemplate(id);

        await logActivity({
            username: req.user.username,
            action: 'DELETE_APPRAISAL_TEMPLATE',
            resourceType: 'AppraisalTemplate',
            resourceId: id.toString(),
            ipAddress: req.ip
        });

        res.status(200).json({ message: "Template deleted successfully." });
    } catch (error) {
        console.error("[APPRAISAL] Error deleting template:", error);
        res.status(500).json({ error: "Failed to delete appraisal template. It may be in use by an appraisal period." });
    }
};

/**
 * ADMIN: Period Management
 */

export const getPeriods = async (req, res) => {
    try {
        const { status, year } = req.query;
        const periods = await appraisalModel.getPeriods({ status, year });
        res.status(200).json({ periods });
    } catch (error) {
        console.error("Error fetching periods:", error);
        res.status(500).json({ error: "Failed to fetch appraisal periods." });
    }
};

export const createPeriod = async (req, res) => {
    try {
        const { template_id, quarter, year, start_date, end_date } = req.body;
        if (!template_id || !quarter || !year || !start_date || !end_date) {
            return res.status(400).json({ error: "All fields are required to start an appraisal period." });
        }
        const id = await appraisalModel.createPeriod({ template_id, quarter, year, start_date, end_date, status: 'Planned' });
        
        res.status(201).json({ message: "Appraisal period planned successfully!", id });
    } catch (error) {
        console.error("Error creating period:", error);
        res.status(500).json({ error: "Failed to create appraisal period." });
    }
};

export const activatePeriod = async (req, res) => {
    try {
        const { id } = req.params;
        // Logic: Only one period can be active at a time? 
        // For simplicity, we just mark this one as active.
        await appraisalModel.updatePeriodStatus(id, 'Active');
        
        await logActivity({
            username: req.user.username,
            action: 'ACTIVATE_APPRAISAL_PERIOD',
            resourceType: 'AppraisalPeriod',
            resourceId: id,
            ipAddress: req.ip
        });

        // Trigger emails in background
        triggerAppraisalActivationEmails(id).catch(err => {
            console.error("[APPRAISAL] Background email trigger failed:", err);
        });

        res.status(200).json({ message: "Appraisal period is now active! Notification emails are being sent." });
    } catch (error) {
        console.error("Error activating period:", error);
        res.status(500).json({ error: "Failed to activate appraisal period." });
    }
};

export const closePeriod = async (req, res) => {
    try {
        const { id } = req.params;
        await appraisalModel.updatePeriodStatus(id, 'Closed');
        res.status(200).json({ message: "Appraisal period closed." });
    } catch (error) {
        console.error("Error closing period:", error);
        res.status(500).json({ error: "Failed to close appraisal period." });
    }
};

/**
 * USER: Appraisal Submission
 */

export const getMyActiveAppraisal = async (req, res) => {
    try {
        const activePeriod = await appraisalModel.getActivePeriod();
        if (!activePeriod) {
            return res.status(200).json({ active: false, message: "No active appraisal period." });
        }

        const stats = await calculateUserAppraisalStats(
            req.user.username, 
            activePeriod.start_date, 
            activePeriod.end_date,
            activePeriod.quarter,
            activePeriod.year
        );

        const myAppraisal = await appraisalModel.getUserAppraisal(req.user.username, activePeriod.id);
        res.status(200).json({ 
            active: true, 
            period: activePeriod, 
            appraisal: myAppraisal,
            autoStats: stats
        });
    } catch (error) {
        console.error("Error fetching active appraisal:", error);
        res.status(500).json({ error: "Failed to fetch active appraisal info." });
    }
};

export const saveMyAppraisal = async (req, res) => {
    try {
        const { period_id, responses, status } = req.body; // status: 'Draft' or 'Submitted'
        if (!period_id || !responses) {
            return res.status(400).json({ error: "Period ID and responses are required." });
        }

        // Check if period is active
        const activePeriod = await appraisalModel.getActivePeriod();
        if (!activePeriod || activePeriod.id !== parseInt(period_id)) {
            return res.status(403).json({ error: "This appraisal period is not active or does not exist." });
        }

        // Backend Validation for Submission
        if (status === 'Submitted') {
            const templateQuestions = activePeriod.questions || [];
            const missingRequired = templateQuestions.find(q => q.required && (!responses[q.id] || responses[q.id].trim() === ""));
            
            if (missingRequired) {
                return res.status(400).json({ error: `Required question missing: ${missingRequired.label}` });
            }
        }

        await appraisalModel.saveUserAppraisal({
            period_id,
            username: req.user.username,
            responses,
            status: status || 'Draft'
        });

        res.status(200).json({ message: status === 'Submitted' ? "Appraisal submitted successfully!" : "Progress saved as draft." });
    } catch (error) {
        console.error("Error saving appraisal:", error);
        res.status(500).json({ error: "Failed to save appraisal." });
    }
};

/**
 * ADMIN: Reviewing Appraisals
 */

export const getTeamAppraisals = async (req, res) => {
    try {
        const { period_id } = req.params;
        const appraisals = await appraisalModel.getAppraisalsByPeriod(period_id);
        res.status(200).json({ appraisals });
    } catch (error) {
        console.error("Error fetching team appraisals:", error);
        res.status(500).json({ error: "Failed to fetch team appraisals." });
    }
};

export const reviewAppraisal = async (req, res) => {
    try {
        const { id } = req.params;
        const { comments, status } = req.body; // status: 'Reviewed'
        
        await appraisalModel.reviewAppraisal({
            id,
            reviewer_username: req.user.username,
            comments,
            status: status || 'Reviewed'
        });

        res.status(200).json({ message: "Review submitted successfully!" });
    } catch (error) {
        console.error("Error reviewing appraisal:", error);
        res.status(500).json({ error: "Failed to submit review." });
    }
};

export const deleteAppraisal = async (req, res) => {
    try {
        const { id } = req.params;
        await appraisalModel.deleteAppraisal(id);
        
        await logActivity({
            username: req.user.username,
            action: 'DELETE_APPRAISAL_SUBMISSION',
            resourceType: 'UserAppraisal',
            resourceId: id,
            ipAddress: req.ip
        });

        res.status(200).json({ message: "Appraisal submission deleted successfully." });
    } catch (error) {
        console.error("Error deleting appraisal:", error);
        res.status(500).json({ error: "Failed to delete appraisal submission." });
    }
};

export const deletePeriod = async (req, res) => {
    try {
        const { id } = req.params;
        await appraisalModel.deletePeriod(id);

        await logActivity({
            username: req.user.username,
            action: 'DELETE_APPRAISAL_PERIOD',
            resourceType: 'AppraisalPeriod',
            resourceId: id,
            ipAddress: req.ip
        });

        res.status(200).json({ message: "Appraisal period deleted successfully." });
    } catch (error) {
        console.error("Error deleting period:", error);
        res.status(500).json({ error: "Failed to delete appraisal period. It may have submissions linked to it." });
    }
};

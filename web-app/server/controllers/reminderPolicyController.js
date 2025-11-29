import {
    getReminderPolicies,
    getReminderPolicyById,
    createReminderPolicy,
    updateReminderPolicy,
    deleteReminderPolicy,
    replacePolicyOffsets,
} from '../models/reminderPolicyModel.js';
import { logActivity } from '../models/activityLogModel.js';

/**
 * GET /api/reminder-policies
 * List all reminder policies
 */
export const listReminderPoliciesController = async (req, res) => {
    try {
        const policies = await getReminderPolicies();
        res.json(policies);
    } catch (error) {
        console.error('Error fetching reminder policies:', error);
        res.status(500).json({ error: 'Failed to fetch reminder policies' });
    }
};

/**
 * GET /api/reminder-policies/:id
 * Get reminder policy by ID
 */
export const getReminderPolicyController = async (req, res) => {
    try {
        const { id } = req.params;
        const policy = await getReminderPolicyById(parseInt(id, 10));
        if (!policy) {
            return res.status(404).json({ error: 'Reminder policy not found' });
        }
        res.json(policy);
    } catch (error) {
        console.error('Error fetching reminder policy:', error);
        res.status(500).json({ error: 'Failed to fetch reminder policy' });
    }
};

/**
 * POST /api/reminder-policies
 * Create a new reminder policy
 */
export const createReminderPolicyController = async (req, res) => {
    try {
        const { name, is_default, offsets } = req.body;
        const userId = req.user?.id || null;

        if (!name) {
            return res.status(400).json({ error: 'Policy name is required' });
        }

        const policyId = await createReminderPolicy({
            name,
            created_by: userId,
            is_default: is_default || false,
        });

        // Add offsets if provided
        if (offsets && Array.isArray(offsets) && offsets.length > 0) {
            await replacePolicyOffsets(policyId, offsets);
        }

        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'CREATE_REMINDER_POLICY',
                resourceType: 'ReminderPolicy',
                resourceId: policyId.toString(),
                ipAddress: req.ip,
                details: { name, is_default },
            });
        }

        res.status(201).json({ message: 'Reminder policy created', policyId });
    } catch (error) {
        console.error('Error creating reminder policy:', error);
        res.status(500).json({ error: error.message || 'Failed to create reminder policy' });
    }
};

/**
 * PUT /api/reminder-policies/:id
 * Update a reminder policy
 */
export const updateReminderPolicyController = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, is_default, offsets } = req.body;

        const existing = await getReminderPolicyById(parseInt(id, 10));
        if (!existing) {
            return res.status(404).json({ error: 'Reminder policy not found' });
        }

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (is_default !== undefined) updates.is_default = is_default;

        if (Object.keys(updates).length > 0) {
            await updateReminderPolicy(parseInt(id, 10), updates);
        }

        // Update offsets if provided
        if (offsets && Array.isArray(offsets)) {
            await replacePolicyOffsets(parseInt(id, 10), offsets);
        }

        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'UPDATE_REMINDER_POLICY',
                resourceType: 'ReminderPolicy',
                resourceId: id,
                ipAddress: req.ip,
                details: req.body,
            });
        }

        res.json({ message: 'Reminder policy updated' });
    } catch (error) {
        console.error('Error updating reminder policy:', error);
        res.status(500).json({ error: error.message || 'Failed to update reminder policy' });
    }
};

/**
 * DELETE /api/reminder-policies/:id
 * Delete a reminder policy
 */
export const deleteReminderPolicyController = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await getReminderPolicyById(parseInt(id, 10));
        if (!existing) {
            return res.status(404).json({ error: 'Reminder policy not found' });
        }

        if (existing.is_default) {
            return res.status(400).json({ error: 'Cannot delete default reminder policy' });
        }

        await deleteReminderPolicy(parseInt(id, 10));

        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'DELETE_REMINDER_POLICY',
                resourceType: 'ReminderPolicy',
                resourceId: id,
                ipAddress: req.ip,
            });
        }

        res.json({ message: 'Reminder policy deleted' });
    } catch (error) {
        console.error('Error deleting reminder policy:', error);
        res.status(500).json({ error: error.message || 'Failed to delete reminder policy' });
    }
};


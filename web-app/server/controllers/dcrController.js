import {
    createDcrEntry,
    getDcrEntries,
    getDcrEntryById,
    updateDcrEntry,
    deleteDcrEntry,
    getWeekSegment,
    timeToMinutes
} from "../models/dcrModel.js";
import { logActivity } from "../models/activityLogModel.js";

const toMySqlDateTime = (value) => {
    const date = value instanceof Date ? value : new Date(value || Date.now());
    if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid timestamp provided for DCR entry.");
    }
    const pad = (num) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

/**
 * Create a new DCR entry
 */
const createDcr = async (req, res) => {
    try {
        const {
            timestamp,
            call_type,
            time_spent, // HH:MM format
            domain_id,
            domain_free_text,
            company_name,
            contact_name,
            contact_phone_country_code,
            contact_phone_number,
            contact_email,
            contact_id,
            notes
        } = req.body;

        // Convert HH:MM to minutes
        const time_spent_minutes = timeToMinutes(time_spent);

        const normalizedTimestamp = toMySqlDateTime(timestamp || new Date());

        const dcrData = {
            user_id: req.user.username,
            timestamp: normalizedTimestamp,
            call_type: call_type || 'inbound',
            time_spent_minutes,
            domain_id: domain_id || null,
            domain_free_text: domain_free_text || null,
            company_name: company_name || null,
            contact_name: contact_name || null,
            contact_phone_country_code: contact_phone_country_code || null,
            contact_phone_number: contact_phone_number || null,
            contact_email: contact_email || null,
            contact_id: contact_id || null,
            notes: notes || null
        };

        const id = await createDcrEntry(dcrData);

        // Log activity
        if (req.user && req.user.username) {
            await logActivity({
                username: req.user.username,
                action: 'CREATE_DCR',
                resourceType: 'DCR',
                resourceId: id.toString(),
                ipAddress: req.ip,
                details: dcrData
            });
        }

        res.status(201).json({ message: 'DCR entry created successfully!', id });
    } catch (error) {
        console.error("DCR creation error:", error);
        res.status(500).json({ error: error.message || "Failed to create DCR entry." });
    }
};

/**
 * Get DCR entries with weekly segment default (Mon-Sat)
 */
const getDcrList = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            userId, // Admin filter
            page = 1,
            limit = 10
        } = req.query;

        const isAdmin = req.user.roleKey === 'admin';
        const currentUserId = req.user.username;

        // If no dates provided, use current week segment (Mon-Sat)
        let start = null;
        let end = null;

        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
        } else {
            const segment = getWeekSegment(new Date());
            start = segment.start;
            end = segment.end;
        }

        // Admin can filter by user, non-admin filter is ignored
        const filterUserId = isAdmin && userId ? userId : null;

        const { entries, totalPages, totalRecords } = await getDcrEntries({
            user_id: currentUserId,
            isAdmin,
            filterUserId,
            startDate: start,
            endDate: end,
            page: parseInt(page),
            limit: parseInt(limit)
        });

        // Convert time_spent_minutes to HH:MM for response
        const formattedEntries = entries.map(entry => ({
            ...entry,
            time_spent: `${Math.floor(entry.time_spent_minutes / 60).toString().padStart(2, '0')}:${(entry.time_spent_minutes % 60).toString().padStart(2, '0')}`
        }));

        res.status(200).json({
            entries: formattedEntries,
            totalPages,
            totalRecords,
            startDate: start.toISOString(),
            endDate: end.toISOString()
        });
    } catch (error) {
        console.error("Error fetching DCR entries:", error);
        res.status(500).json({ error: "Failed to fetch DCR entries." });
    }
};

/**
 * Get week segment metadata
 */
const getWeekMeta = async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        const segment = getWeekSegment(targetDate);

        res.status(200).json({
            start: segment.start.toISOString(),
            end: segment.end.toISOString(),
            startFormatted: segment.start.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
            endFormatted: segment.end.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        });
    } catch (error) {
        console.error("Error getting week meta:", error);
        res.status(500).json({ error: "Failed to get week segment." });
    }
};

/**
 * Get a single DCR entry by ID
 */
const getDcrById = async (req, res) => {
    try {
        const { id } = req.params;
        const isAdmin = req.user.roleKey === 'admin';
        const currentUserId = req.user.username;

        const entry = await getDcrEntryById(parseInt(id), currentUserId, isAdmin);

        if (!entry) {
            return res.status(404).json({ error: "DCR entry not found or access denied." });
        }

        // Convert time_spent_minutes to HH:MM
        entry.time_spent = `${Math.floor(entry.time_spent_minutes / 60).toString().padStart(2, '0')}:${(entry.time_spent_minutes % 60).toString().padStart(2, '0')}`;

        res.status(200).json({ entry });
    } catch (error) {
        console.error("Error fetching DCR entry:", error);
        res.status(500).json({ error: "Failed to fetch DCR entry." });
    }
};

/**
 * Update a DCR entry
 */
const updateDcr = async (req, res) => {
    try {
        const { id } = req.params;
        const isAdmin = req.user.roleKey === 'admin';
        const currentUserId = req.user.username;

        const {
            timestamp,
            call_type,
            time_spent, // HH:MM format
            domain_id,
            domain_free_text,
            company_name,
            contact_name,
            contact_phone_country_code,
            contact_phone_number,
            contact_email,
            contact_id,
            notes
        } = req.body;

        const updateData = {};

        if (timestamp !== undefined) updateData.timestamp = toMySqlDateTime(timestamp);
        if (call_type !== undefined) updateData.call_type = call_type;
        if (time_spent !== undefined) {
            updateData.time_spent_minutes = timeToMinutes(time_spent);
        }
        if (domain_id !== undefined) updateData.domain_id = domain_id;
        if (domain_free_text !== undefined) updateData.domain_free_text = domain_free_text;
        if (company_name !== undefined) updateData.company_name = company_name;
        if (contact_name !== undefined) updateData.contact_name = contact_name;
        if (contact_phone_country_code !== undefined) updateData.contact_phone_country_code = contact_phone_country_code;
        if (contact_phone_number !== undefined) updateData.contact_phone_number = contact_phone_number;
        if (contact_email !== undefined) updateData.contact_email = contact_email;
        if (contact_id !== undefined) updateData.contact_id = contact_id;
        if (notes !== undefined) updateData.notes = notes;

        const success = await updateDcrEntry(parseInt(id), updateData, currentUserId, isAdmin);

        if (!success) {
            return res.status(404).json({ error: "DCR entry not found or access denied." });
        }

        // Log activity
        if (req.user && req.user.username) {
            await logActivity({
                username: req.user.username,
                action: 'UPDATE_DCR',
                resourceType: 'DCR',
                resourceId: id,
                ipAddress: req.ip,
                details: updateData
            });
        }

        res.status(200).json({ message: "DCR entry updated successfully!" });
    } catch (error) {
        console.error("Error updating DCR entry:", error);
        res.status(500).json({ error: error.message || "Failed to update DCR entry." });
    }
};

/**
 * Delete a DCR entry
 */
const deleteDcr = async (req, res) => {
    try {
        const { id } = req.params;
        const isAdmin = req.user.roleKey === 'admin';
        const currentUserId = req.user.username;

        const success = await deleteDcrEntry(parseInt(id), currentUserId, isAdmin);

        if (!success) {
            return res.status(404).json({ error: "DCR entry not found or access denied." });
        }

        // Log activity
        if (req.user && req.user.username) {
            await logActivity({
                username: req.user.username,
                action: 'DELETE_DCR',
                resourceType: 'DCR',
                resourceId: id,
                ipAddress: req.ip
            });
        }

        res.status(200).json({ message: "DCR entry deleted successfully!" });
    } catch (error) {
        console.error("Error deleting DCR entry:", error);
        res.status(500).json({ error: error.message || "Failed to delete DCR entry." });
    }
};

export {
    createDcr,
    getDcrList,
    getDcrById,
    updateDcr,
    deleteDcr,
    getWeekMeta
};



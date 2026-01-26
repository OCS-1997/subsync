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
            notes,
            add_to_customer_contacts // Flag to indicate if contact should be added to customer
        } = req.body;

        // Convert HH:MM to minutes
        const time_spent_minutes = timeToMinutes(time_spent);

        const normalizedTimestamp = toMySqlDateTime(timestamp || new Date());

        const dcrData = {
            user_id: req.user.username,
            timestamp: normalizedTimestamp,
            call_type: call_type || 'incoming',
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

        // If this is an existing customer (has domain_id) with new contact info, add it to customer's other_contacts
        if (domain_id && contact_name && add_to_customer_contacts) {
            try {
                const appDB = (await import("../db/subsyncDB.js")).default;
                const { getDomainById } = await import("../models/domainModel.js");
                const { getCustomerById } = await import("../models/customerModel.js");

                // Get domain to find customer_id
                const domain = await getDomainById(domain_id);
                if (domain && domain.customer_id) {
                    // Get customer
                    const customer = await getCustomerById(domain.customer_id);
                    if (customer) {
                        // Parse existing other_contacts
                        let otherContacts = [];
                        if (customer.other_contacts) {
                            try {
                                otherContacts = typeof customer.other_contacts === 'string'
                                    ? JSON.parse(customer.other_contacts)
                                    : customer.other_contacts;
                            } catch (e) {
                                console.error("Error parsing other_contacts:", e);
                            }
                        }

                        // Split contact_name into first and last name
                        const nameParts = contact_name.trim().split(/\s+/);
                        const newContact = {
                            first_name: nameParts[0] || '',
                            last_name: nameParts.slice(1).join(' ') || '',
                            email: contact_email || '',
                            country_code: contact_phone_country_code || '+91',
                            phone_number: contact_phone_number || '',
                            salutation: 'Mr.',
                            designation: '',
                            email_send: true,
                            include_in_communication: true
                        };

                        // Check if contact already exists (by email or phone)
                        const contactExists = otherContacts.some(c =>
                            (c.email && c.email === contact_email) ||
                            (c.phone_number && c.phone_number === contact_phone_number)
                        );

                        if (!contactExists) {
                            otherContacts.push(newContact);

                            // Update customer's other_contacts
                            await appDB.query(
                                'UPDATE customers SET other_contacts = ?, updated_at = NOW() WHERE customer_id = ?',
                                [JSON.stringify(otherContacts), domain.customer_id]
                            );

                            // console.log(`Added new contact to customer ${domain.customer_id}'s other_contacts`);
                        }
                    }
                }
            } catch (contactError) {
                // Log error but don't fail the DCR creation
                console.error("Error adding contact to customer:", contactError);
            }
        }

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
            search,
            callType,
            sort,
            order,
            page = 1,
            limit = 10
        } = req.query;

        const isAdmin = req.user.roleKey === 'admin';
        const currentUserId = req.user.username;

        // If no dates provided, don't default to week - show all
        let start = startDate ? new Date(startDate) : null;
        let end = endDate ? new Date(endDate) : null;

        // Admin can filter by user, non-admin filter is ignored
        const filterUserId = isAdmin && userId ? userId : null;

        const { entries, totalPages, totalRecords } = await getDcrEntries({
            user_id: currentUserId,
            isAdmin,
            filterUserId,
            startDate: start,
            endDate: end,
            search: search || null,
            callType: callType || null,
            sort: sort || null,
            order: order || null,
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
            currentPage: parseInt(page),
            startDate: start ? start.toISOString() : null,
            endDate: end ? end.toISOString() : null
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

/**
 * Get DCR statistics for dashboard widget
 */
const getDcrStats = async (req, res) => {
    try {
        const isAdmin = req.user.roleKey === 'admin';
        const currentUserId = req.user.username;

        // Get date range (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const { entries } = await getDcrEntries({
            user_id: currentUserId,
            isAdmin,
            filterUserId: isAdmin ? null : currentUserId, // Admin sees all, others see only theirs
            startDate,
            endDate,
            page: 1,
            limit: 1000 // Get all entries for stats
        });

        // Calculate summary stats
        const totalCalls = entries.length;
        const totalMinutes = entries.reduce((sum, entry) => sum + entry.time_spent_minutes, 0);
        const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
        const uniqueContacts = new Set(entries.filter(e => e.contact_name).map(e => e.contact_name)).size;
        const avgPerDay = Math.round(totalCalls / 30 * 10) / 10;

        // Call type distribution
        const callTypes = entries.reduce((acc, entry) => {
            acc[entry.call_type] = (acc[entry.call_type] || 0) + 1;
            return acc;
        }, {});

        const callTypeDistribution = Object.entries(callTypes).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value
        }));

        // Daily activity (last 7 days)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const count = entries.filter(e => e.timestamp.toISOString().split('T')[0] === dateStr).length;
            last7Days.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                calls: count
            });
        }

        // Top domains
        const domainCounts = entries.reduce((acc, entry) => {
            const domain = entry.domain_name || entry.domain_free_text || 'Unknown';
            acc[domain] = (acc[domain] || 0) + 1;
            return acc;
        }, {});

        const topDomains = Object.entries(domainCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([domain, count]) => ({
                domain: domain.length > 20 ? domain.substring(0, 20) + '...' : domain,
                count
            }));

        res.status(200).json({
            summary: {
                totalCalls,
                totalHours,
                avgPerDay,
                uniqueContacts
            },
            callTypeDistribution,
            dailyActivity: last7Days,
            topDomains
        });
    } catch (error) {
        console.error("Error fetching DCR stats:", error);
        res.status(500).json({ error: "Failed to fetch DCR statistics." });
    }
};

/**
 * Get per-user DCR stats for admin dashboard
 */
const getUserDcrStats = async (req, res) => {
    try {
        const isAdmin = req.user.roleKey === 'admin';
        const currentUserId = req.user.username;

        // Get date range (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        // Import appDB
        const appDB = (await import("../db/subsyncDB.js")).default;

        if (isAdmin) {
            // Admin: Get per-user stats
            const [userStats] = await appDB.query(`
                SELECT 
                    de.user_id,
                    u.name as user_name,
                    COUNT(*) as total_calls,
                    SUM(de.time_spent_minutes) as total_minutes,
                    COUNT(DISTINCT DATE(de.timestamp)) as active_days,
                    COUNT(DISTINCT de.contact_name) as unique_contacts
                FROM dcr_entries de
                LEFT JOIN users u ON de.user_id = u.username
                WHERE de.timestamp >= ? AND de.timestamp <= ?
                GROUP BY de.user_id, u.name
                ORDER BY total_calls DESC
            `, [startDate, endDate]);

            // Also get today's stats per user
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            const [todayStats] = await appDB.query(`
                SELECT 
                    de.user_id,
                    COUNT(*) as today_calls,
                    SUM(de.time_spent_minutes) as today_minutes
                FROM dcr_entries de
                WHERE de.timestamp >= ? AND de.timestamp <= ?
                GROUP BY de.user_id
            `, [today, todayEnd]);

            // Merge today stats with overall stats
            const todayMap = new Map(todayStats.map(s => [s.user_id, s]));
            const mergedStats = userStats.map(user => ({
                ...user,
                total_hours: Math.round((user.total_minutes || 0) / 60 * 10) / 10,
                avg_per_day: user.active_days > 0 ? Math.round(user.total_calls / user.active_days * 10) / 10 : 0,
                today_calls: todayMap.get(user.user_id)?.today_calls || 0,
                today_hours: Math.round((todayMap.get(user.user_id)?.today_minutes || 0) / 60 * 10) / 10
            }));

            res.status(200).json({
                isAdmin: true,
                userStats: mergedStats
            });
        } else {
            // Non-admin: Just return their own stats
            const { entries } = await getDcrEntries({
                user_id: currentUserId,
                isAdmin: false,
                filterUserId: currentUserId,
                startDate,
                endDate,
                page: 1,
                limit: 1000
            });

            const totalCalls = entries.length;
            const totalMinutes = entries.reduce((sum, entry) => sum + entry.time_spent_minutes, 0);

            res.status(200).json({
                isAdmin: false,
                userStats: [{
                    user_id: currentUserId,
                    user_name: req.user.name || currentUserId,
                    total_calls: totalCalls,
                    total_hours: Math.round(totalMinutes / 60 * 10) / 10,
                    unique_contacts: new Set(entries.filter(e => e.contact_name).map(e => e.contact_name)).size
                }]
            });
        }
    } catch (error) {
        console.error("Error fetching user DCR stats:", error);
        res.status(500).json({ error: "Failed to fetch user DCR statistics." });
    }
};

/**
 * Get users for DCR filtering (admin only, lightweight)
 */
const getDcrUsers = async (req, res) => {
    try {
        const isAdmin = req.user.roleKey === 'admin';

        if (!isAdmin) {
            return res.status(403).json({ error: "Only admins can view all users" });
        }

        // Import appDB here to avoid circular dependency
        const appDB = (await import("../db/subsyncDB.js")).default;

        const [users] = await appDB.query(
            `SELECT username, name FROM users WHERE is_active = 1 ORDER BY name ASC`
        );

        res.status(200).json({ users });
    } catch (error) {
        console.error("Error fetching DCR users:", error);
        res.status(500).json({ error: "Failed to fetch users." });
    }
};

export {
    createDcr,
    getDcrList,
    getDcrById,
    updateDcr,
    deleteDcr,
    getWeekMeta,
    getDcrStats,
    getUserDcrStats,
    getDcrUsers,
    getDcrDetailedReport
};

/**
 * Get detailed DCR report stats
 */
async function getDcrDetailedReport(req, res) {
    try {
        const { startDate, endDate, userId } = req.query;
        const isAdmin = req.user.roleKey === 'admin';
        const canViewAll = req.user.permissions?.includes('performance_reports.view_all') || req.user.permissions?.includes('dcr.view_all');
        
        let targetUserId = userId;
        if (!isAdmin && !canViewAll) {
            targetUserId = req.user.username;
        }

        const appDB = (await import("../db/subsyncDB.js")).default;
        
        let whereConditions = ["1=1"];
        let params = [];

        if (targetUserId && targetUserId !== 'all') {
            whereConditions.push('de.user_id = ?');
            params.push(targetUserId);
        }

        if (startDate && endDate) {
            whereConditions.push('de.timestamp >= ? AND de.timestamp <= ?');
            params.push(startDate, endDate);
        }

        const whereClause = whereConditions.join(' AND ');

        // Daily trend
        const [dailyTrend] = await appDB.query(`
            SELECT DATE(de.timestamp) as date, COUNT(*) as count, SUM(de.time_spent_minutes) as minutes
            FROM dcr_entries de
            WHERE ${whereClause}
            GROUP BY DATE(de.timestamp)
            ORDER BY date ASC
        `, params);

        // Call type distribution
        const [callTypes] = await appDB.query(`
            SELECT de.call_type as name, COUNT(*) as value
            FROM dcr_entries de
            WHERE ${whereClause}
            GROUP BY de.call_type
        `, params);

        // User breakdown
        const [userBreakdown] = await appDB.query(`
            SELECT u.name, COUNT(*) as calls, SUM(de.time_spent_minutes) as minutes
            FROM dcr_entries de
            JOIN users u ON de.user_id = u.username
            WHERE ${whereClause}
            GROUP BY u.username, u.name
            ORDER BY calls DESC
        `, params);

        // Summary
        const [[summary]] = await appDB.query(`
            SELECT 
                COUNT(*) as total_calls, 
                SUM(de.time_spent_minutes) as total_minutes, 
                COUNT(DISTINCT de.user_id) as active_users,
                COUNT(DISTINCT de.contact_name) as unique_contacts
            FROM dcr_entries de
            WHERE ${whereClause}
        `, params);

        res.status(200).json({ 
            success: true, 
            data: { dailyTrend, callTypes, userBreakdown, summary } 
        });
    } catch (error) {
        console.error("Error in getDcrDetailedReport:", error);
        res.status(500).json({ success: false, error: "Failed to fetch DCR report" });
    }
}



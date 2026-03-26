import {
    getAllLeaveTypes,
    getLeaveTypeById,
    createLeaveRequest,
    updateLeaveStatus,
    getLeaveRequests,
    getLeaveRequestById,
    getUserLeaveBalances,
    initializeBalancesForUser,
    getAllHolidays,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
    createHoliday,
    updateHoliday,
    deleteHoliday,
    countPendingLeaveRequests
} from "../models/leaveModel.js";
import { 
    createPermissionRequest, 
    getPermissionRequests, 
    updatePermissionStatus,
    countPendingPermissionRequests 
} from "../models/permissionRequestModel.js";
import { logActivity } from "../models/activityLogModel.js";
import { calculateWorkingDays } from "../utils/leaveUtils.js";

/**
 * Get all available leave types
 */
async function getLeaveTypesController(req, res) {
    try {
        const types = await getAllLeaveTypes();
        res.status(200).json(types);
    } catch (error) {
        console.error("Error in getLeaveTypesController:", error);
        res.status(500).json({ error: "Failed to fetch leave types" });
    }
}

/**
 * Apply for a new leave
 */
async function applyLeaveController(req, res) {
    try {
        const { leave_type_id, start_date, end_date, half_day_type, reason } = req.body;
        const userId = req.user.username;

        if (!leave_type_id || !start_date || !end_date || !reason) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // 1. Get holidays for the period
        const holidays = await getAllHolidays(new Date(start_date).getFullYear());
        const holidayDates = holidays.map(h => h.holiday_date.toISOString().split('T')[0]);

        // 2. Calculate duration
        let duration = calculateWorkingDays(start_date, end_date, holidayDates);
        
        if (half_day_type && half_day_type !== 'none') {
            // If it's a single day half-leave, duration is 0.5
            if (new Date(start_date).toDateString() === new Date(end_date).toDateString()) {
                duration = 0.5;
            } else {
                // For multi-day, we subtract 0.5 from total working days
                duration -= 0.5;
            }
        }

        if (duration <= 0) {
            return res.status(400).json({ error: "Invalid leave period (no working days found)" });
        }

        // 3. Check leave balance (simplified for now, actual implementation would check if enough days remain)
        const balances = await getUserLeaveBalances(userId, new Date(start_date).getFullYear());
        const typeBalance = balances.find(b => b.leave_type_id === parseInt(leave_type_id));
        
        if (typeBalance && typeBalance.remaining < duration) {
             // Optional: Allow negative balance or strictly restrict? 
             // Industrial standard often allows "Loss of Pay" or restricts.
             // We'll allow it for now but return a warning or just proceed.
        }

        const requestId = await createLeaveRequest({
            user_id: userId,
            leave_type_id,
            start_date,
            end_date,
            duration_days: duration,
            half_day_type,
            reason
        });

        await logActivity({
            username: userId,
            action: 'APPLY_LEAVE',
            resourceType: 'LeaveRequest',
            resourceId: requestId,
            ipAddress: req.ip,
            details: { duration, type_id: leave_type_id }
        });

        res.status(201).json({
            message: "Leave request submitted successfully",
            request_id: requestId,
            duration_days: duration
        });
    } catch (error) {
        console.error("Error in applyLeaveController:", error);
        res.status(500).json({ error: error.message || "Failed to submit leave request" });
    }
}

/**
 * Get leave requests with filters
 */
async function getMyLeavesController(req, res) {
    try {
        const userId = req.user.username;
        const leaves = await getLeaveRequests({ user_id: userId, ...req.query });
        res.status(200).json(leaves);
    } catch (error) {
        console.error("Error in getMyLeavesController:", error);
        res.status(500).json({ error: "Failed to fetch your leave requests" });
    }
}

/**
 * Get all leave requests (Admin/Manager only)
 */
async function getAllLeavesController(req, res) {
    try {
        const leaves = await getLeaveRequests(req.query);
        res.status(200).json(leaves);
    } catch (error) {
        console.error("Error in getAllLeavesController:", error);
        res.status(500).json({ error: "Failed to fetch all leave requests" });
    }
}

/**
 * Update leave status (Approve/Reject)
 */
async function actionLeaveController(req, res) {
    try {
        const { requestId } = req.params;
        const { status, comments } = req.body;
        const actionedBy = req.user.username;

        if (!['approved', 'rejected', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const success = await updateLeaveStatus(requestId, status, actionedBy, comments);
        
        if (!success) {
            return res.status(404).json({ error: "Leave request not found" });
        }

        await logActivity({
            username: actionedBy,
            action: `LEAVE_${status.toUpperCase()}`,
            resourceType: 'LeaveRequest',
            resourceId: requestId,
            ipAddress: req.ip,
            details: { status, comments }
        });

        res.status(200).json({ message: `Leave request ${status} successfully` });
    } catch (error) {
        console.error("Error in actionLeaveController:", error);
        res.status(500).json({ error: "Failed to update leave status" });
    }
}

/**
 * Get leave balances for the user
 */
async function getMyBalancesController(req, res) {
    try {
        const userId = req.user.username;
        const year = req.query.year || new Date().getFullYear();
        
        let balances = await getUserLeaveBalances(userId, year);
        
        if (balances.length === 0) {
            await initializeBalancesForUser(userId, year);
            balances = await getUserLeaveBalances(userId, year);
        }
        
        res.status(200).json(balances);
    } catch (error) {
        console.error("Error in getMyBalancesController:", error);
        res.status(500).json({ error: "Failed to fetch leave balances" });
    }
}

/**
 * Get holidays
 */
async function getHolidaysController(req, res) {
    try {
        const year = req.query.year;
        const holidays = await getAllHolidays(year);
        res.status(200).json(holidays);
    } catch (error) {
        console.error("Error in getHolidaysController:", error);
        res.status(500).json({ error: "Failed to fetch holidays" });
    }
}

/**
 * Admin: Create leave type
 */
async function createLeaveTypeController(req, res) {
    try {
        const id = await createLeaveType(req.body);
        res.status(201).json({ id, message: "Leave type created" });
    } catch (error) {
        res.status(500).json({ error: "Failed to create leave type" });
    }
}

/**
 * Admin: Update leave type
 */
async function updateLeaveTypeController(req, res) {
    try {
        const success = await updateLeaveType(req.params.id, req.body);
        if (!success) return res.status(404).json({ error: "Leave type not found" });
        res.status(200).json({ message: "Leave type updated" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update leave type" });
    }
}

/**
 * Admin: Delete leave type
 */
async function deleteLeaveTypeController(req, res) {
    try {
        await deleteLeaveType(req.params.id);
        res.status(200).json({ message: "Leave type deactivated" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete leave type" });
    }
}

/**
 * Admin: Add holiday
 */
async function createHolidayController(req, res) {
    try {
        const id = await createHoliday(req.body);
        res.status(201).json({ id, message: "Holiday added" });
    } catch (error) {
        res.status(500).json({ error: "Failed to add holiday" });
    }
}

/**
 * Admin: Update holiday
 */
async function updateHolidayController(req, res) {
    try {
        const success = await updateHoliday(req.params.id, req.body);
        if (!success) return res.status(404).json({ error: "Holiday not found" });
        res.status(200).json({ message: "Holiday updated" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update holiday" });
    }
}

/**
 * Admin: Delete holiday
 */
async function deleteHolidayController(req, res) {
    try {
        await deleteHoliday(req.params.id);
        res.status(200).json({ message: "Holiday removed" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete holiday" });
    }
}

/**
 * Get counts of pending requests (Leaves + Permissions)
 */
async function getPendingCountsController(req, res) {
    try {
        const [leaveCount, permissionCount] = await Promise.all([
            countPendingLeaveRequests(),
            countPendingPermissionRequests()
        ]);
        
        res.status(200).json({
            leaves: leaveCount,
            permissions: permissionCount,
            total: leaveCount + permissionCount
        });
    } catch (error) {
        console.error("Error in getPendingCountsController:", error);
        res.status(500).json({ error: "Failed to fetch pending counts" });
    }
}

export {
    getLeaveTypesController,
    applyLeaveController,
    getMyLeavesController,
    getAllLeavesController,
    actionLeaveController,
    getMyBalancesController,
    getHolidaysController,
    createLeaveTypeController,
    updateLeaveTypeController,
    deleteLeaveTypeController,
    createHolidayController,
    updateHolidayController,
    deleteHolidayController,
    getPendingCountsController
};

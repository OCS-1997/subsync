import { getSubscriptions, addSubscription, getSubscriptionById, updateSubscriptionById, deleteSubscriptionById } from "../models/subscriptionModel.js";
import { getSubscriptionHistory, getSubscriptionHistoryCount } from "../models/subscriptionHistoryModel.js";
import { logActivity } from "../models/activityLogModel.js";
import { enqueueReminders, cancelPendingReminderJobs } from "../services/reminderService.js";

// RESTful: POST /subscriptions
const createSubscription = async (req, res) => {
  try {
    const username = req.user?.username || null;
    const ipAddress = req.ip || null;
    const userId = req.user?.id || null;
    const result = await addSubscription(req.body, username, ipAddress);
    
    // Enqueue reminders if subscription has end_date
    try {
      await enqueueReminders(result.subId, userId);
    } catch (reminderError) {
      console.error('Error enqueueing reminders for new subscription:', reminderError);
      // Don't fail the subscription creation if reminder enqueueing fails
    }
    
    if (req.user && req.user.username) {
      await logActivity({ username: req.user.username, action: 'CREATE_SUBSCRIPTION', resourceType: 'Subscription', resourceId: result.subId, ipAddress: req.ip, details: req.body });
    }
    res.status(201).json({ message: "Subscription added successfully!", subId: result.subId });
  } catch (error) {
    res.status(500).json({ error: error.message || "An unexpected error occurred." });
  }
};

// GET /subscriptions
const getSubscriptionsController = async (req, res) => {
  try {
    const { searchType, search, sort, order, page = 1, statusFilter, soonDays, archivedOnly } = req.query;

    const limit = 10;
    const { dataArray, totalCount } = await getSubscriptions({
      searchType,
      search,
      sort,
      order,
      page: parseInt(page, 10),
      limit,
      statusFilter,
      soonDays: soonDays ? parseInt(soonDays, 10) : 30,
      archivedOnly: archivedOnly === 'true'
    });

    const totalPages = Math.ceil((totalCount || 0) / limit);
    res.set('x-total-count', totalCount || 0);

    res.status(200).json({
      dataArray: dataArray || [],
      currentPage: parseInt(page, 10),
      totalPages,
      totalCount: totalCount || 0
    });
  } catch (error) {
    console.error("Error in getSubscriptionsController:", error.message);
    if (error.message.includes("Invalid")) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to retrieve subscriptions. Please try again later." });
  }
};

// GET /subscriptions/:id
const getSubscriptionByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const sub = await getSubscriptionById(id);
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });
    res.status(200).json({ subscription: sub });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
};

// PUT /subscriptions/:id
const updateSubscriptionController = async (req, res) => {
  try {
    const { id } = req.params;
    const username = req.user?.username || null;
    const ipAddress = req.ip || null;
    const userId = req.user?.id || null;
    
    // Check if end_date or reminder_policy_id is being updated
    const needsRequeue = req.body.end_date !== undefined || req.body.reminder_policy_id !== undefined;
    
    if (needsRequeue) {
      // Cancel existing pending jobs
      try {
        await cancelPendingReminderJobs(id);
      } catch (cancelError) {
        console.error('Error cancelling pending reminder jobs:', cancelError);
      }
    }
    
    await updateSubscriptionById(id, req.body, username, ipAddress);
    
    // Re-enqueue reminders if end_date or reminder_policy_id changed
    if (needsRequeue) {
      try {
        await enqueueReminders(id, userId);
      } catch (reminderError) {
        console.error('Error re-enqueueing reminders after update:', reminderError);
        // Don't fail the update if reminder enqueueing fails
      }
    }
    
    if (req.user && req.user.username) {
      await logActivity({ username: req.user.username, action: 'UPDATE_SUBSCRIPTION', resourceType: 'Subscription', resourceId: id, ipAddress: req.ip, details: req.body });
    }
    res.status(200).json({ message: 'Subscription updated successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Update failed' });
  }
};

// DELETE /subscriptions/:id
const deleteSubscriptionController = async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await deleteSubscriptionById(id);
    if (!ok) return res.status(404).json({ error: 'Subscription not found' });
    if (req.user && req.user.username) {
      await logActivity({ username: req.user.username, action: 'DELETE_SUBSCRIPTION', resourceType: 'Subscription', resourceId: id, ipAddress: req.ip });
    }
    res.status(200).json({ message: 'Subscription deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Delete failed' });
  }
};

// Stub endpoint for sending a reminder (email integration to be added later)
const sendReminderController = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user && req.user.username) {
      await logActivity({ username: req.user.username, action: 'REMINDER_SUBSCRIPTION', resourceType: 'Subscription', resourceId: id, ipAddress: req.ip });
    }
    return res.status(200).json({ message: 'Reminder queued successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to queue reminder.' });
  }
};

// GET /subscriptions/:id/history
const getSubscriptionHistoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    const [history, totalCount] = await Promise.all([
      getSubscriptionHistory(id, { limit: parseInt(limit, 10), offset }),
      getSubscriptionHistoryCount(id)
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        history: history || [],
        count: totalCount || 0
      }
    });
  } catch (error) {
    console.error("Error in getSubscriptionHistoryController:", error.message);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch subscription history' 
    });
  }
};

export { 
  getSubscriptionsController, 
  createSubscription, 
  getSubscriptionByIdController, 
  updateSubscriptionController, 
  deleteSubscriptionController, 
  sendReminderController, 
  getSubscriptionHistoryController 
};

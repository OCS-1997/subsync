import { getSubscriptions, addSubscription, getSubscriptionById, updateSubscriptionById, deleteSubscriptionById } from "../models/subscriptionModel.js";
import { logActivity } from "../models/activityLogModel.js";

// RESTful: POST /subscriptions
const createSubscription = async (req, res) => {
  try {
    const result = await addSubscription(req.body);
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
    const { searchType, search, sort, order, page = 1, statusFilter, soonDays } = req.query;

    const limit = 10;
    const { dataArray, totalCount } = await getSubscriptions({
      searchType,
      search,
      sort,
      order,
      page: parseInt(page, 10),
      limit,
      statusFilter,
      soonDays: soonDays ? parseInt(soonDays, 10) : 30
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
    await updateSubscriptionById(id, req.body);
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

export { getSubscriptionsController, createSubscription, getSubscriptionByIdController, updateSubscriptionController, deleteSubscriptionController, sendReminderController };

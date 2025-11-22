import appDB from "../db/subsyncDB.js";
import { getCurrentTime, addDaysToTimestamp } from "../middlewares/time.js";
import { generateID } from "../middlewares/generateID.js";
import { logSubscriptionChanges, compareSubscriptionData } from "./subscriptionHistoryModel.js";

// Helper to compute dynamic status based on dates
function computeStatus(startDate, endDate, soonDays = 30) {
  const now = new Date();
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return { status: "Unknown", daysToExpiry: null };
  const diffMs = end.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) return { status: "Expired", daysToExpiry: days };
  if (days <= soonDays) return { status: "Soon Expiring", daysToExpiry: days };
  return { status: "Active", daysToExpiry: days };
}

async function getSubscriptions({ searchType, search, sort, order, page = 1, limit = 10, statusFilter = null, soonDays = 30 }) {
  try {
    const validSortColumns = [
      "s.sub_id", "s.customer_id", "s.start_date", "s.end_date", "s.status", "s.domain_name",
      "c.display_name", "s.total", "s.updated_at", "s.created_at"
    ];

    if (sort && !validSortColumns.includes(sort)) {
      throw new Error("Invalid sort field");
    }

    // Base with joins for display fields
    let baseQuery = `
      SELECT 
        s.sub_id, s.customer_id, s.start_date, s.end_date, s.status,
        s.domain_name, s.total,
        c.display_name AS customer_name,
        (SELECT COUNT(*) FROM subscription_items si WHERE si.sub_id = s.sub_id) AS items_count,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'service_name', si.service_name,
            'quantity', si.quantity,
            'rate', si.rate
          )
        ) FROM subscription_items si WHERE si.sub_id = s.sub_id) AS items_json
      FROM subscriptions s
      JOIN customers c ON s.customer_id = c.customer_id`;

    // Count query without LIMIT/OFFSET (we'll adjust for statusFilter later)
    let countQuery = `
      SELECT COUNT(*) as totalCount
      FROM subscriptions s
      JOIN customers c ON s.customer_id = c.customer_id`;

    const whereClauses = [];
    const params = [];

    // Support optional searchType on physical columns, otherwise generic search across names/ids
    if (searchType && search) {
      const allowedSearch = {
        "s.sub_id": "s.sub_id",
        "s.customer_id": "s.customer_id",
        "s.start_date": "s.start_date",
        "s.end_date": "s.end_date",
        "s.status": "s.status",
        "s.domain_name": "s.domain_name",
        "c.display_name": "c.display_name"
      };
      const column = allowedSearch[searchType];
      if (!column) throw new Error("Invalid search type field");
      whereClauses.push(`${column} LIKE ?`);
      params.push(`%${search}%`);
    } else if (search) {
      whereClauses.push(`(c.display_name LIKE ? OR s.domain_name LIKE ? OR s.sub_id LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (whereClauses.length) {
      const whereStr = ` WHERE ${whereClauses.join(" AND ")}`;
      baseQuery += whereStr;
      countQuery += whereStr;
    }

    if (sort && order && validSortColumns.includes(sort)) {
      baseQuery += ` ORDER BY ${sort} ${order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}`;
    } else {
      baseQuery += ` ORDER BY s.updated_at DESC, s.start_date DESC`;
    }

    const offset = (page - 1) * limit;
    baseQuery += ` LIMIT ? OFFSET ?`;
    const listParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];

    const [rows] = await appDB.query(baseQuery, listParams);

    // Compute dynamic status and optionally filter
    const enriched = rows.map(r => {
      const { status, daysToExpiry } = computeStatus(r.start_date, r.end_date, soonDays);
      // Parse items_json if present
      let items = [];
      try {
        if (r.items_json) {
          items = typeof r.items_json === 'string' ? JSON.parse(r.items_json) : r.items_json;
        }
      } catch { }
      return { ...r, dynamic_status: status, days_to_expiry: daysToExpiry, items: items || [] };
    });

    let filtered = enriched;
    if (statusFilter) {
      const f = statusFilter.toLowerCase();
      filtered = enriched.filter(r => {
        if (f === 'active') return r.dynamic_status === 'Active';
        if (f === 'expired') return r.dynamic_status === 'Expired';
        if (f === 'soon') return r.dynamic_status === 'Soon Expiring';
        return true;
      });
    }

    // Total count (unfiltered by status), then override if statusFilter applied to reflect filtered total
    const [[{ totalCount }]] = await appDB.query(countQuery, params);
    const resultTotal = statusFilter ? filtered.length : totalCount;

    return { dataArray: filtered, totalCount: resultTotal };
  } catch (error) {
    console.error("Error fetching subscriptions from database:", error.message);
    throw new Error("Database query failed");
  }
}

async function addSubscription(payload, changedBy = null, ipAddress = null) {
  const conn = await appDB.getConnection();
  try {
    await conn.beginTransaction();
    const {
      domain_name,
      customerID,
      startDate,
      endDate,
      never_expires = false,
      repeat_every_value = null,
      repeat_every_unit = null,
      currency = 'INR',
      discount_type = 'amount',
      discount_value = 0,
      rounding = 0,
      notes = '',
      terms_conditions = '',
      email_list = [],
      items = []
    } = payload;

    if (!customerID) throw new Error('Customer ID is required.');
    if (!Array.isArray(items) || items.length === 0) throw new Error('At least one item is required.');

    const currentTime = getCurrentTime();
    const start = startDate || currentTime;
    const end = endDate || addDaysToTimestamp(start, 365);

    // Determine if customer is taxable
    let applyTax = true;
    try {
      const [crow] = await conn.query(`SELECT tax_preference FROM customers WHERE customer_id = ?`, [customerID]);
      const pref = (crow?.[0]?.tax_preference || '').toLowerCase();
      if (pref && pref !== 'taxable') applyTax = false;
    } catch { }

    // Compute totals
    let subtotal = 0, tax_total = 0, grand_total = 0;
    items.forEach(it => {
      const lineSub = Number(it.quantity || 0) * Number(it.rate || 0);
      const lineTax = applyTax ? (lineSub * Number(it.tax_percent || 0)) / 100 : 0;
      subtotal += lineSub;
      tax_total += lineTax;
    });
    let discountAmt = discount_type === 'percent' ? (subtotal * Number(discount_value || 0)) / 100 : Number(discount_value || 0);
    if (!isFinite(discountAmt)) discountAmt = 0;
    grand_total = Math.max(0, subtotal + tax_total - discountAmt + Number(rounding || 0));

    const subId = generateID('SUB');
    const [res] = await conn.query(
      `INSERT INTO subscriptions (
        sub_id, domain_name, customer_id, start_date, end_date, never_expires, repeat_every_value, repeat_every_unit,
        currency, subtotal, tax_total, discount_type, discount_value, rounding, total, notes, terms_and_conditions, email_list, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      [
        subId,
        domain_name || null,
        customerID,
        start,
        end,
        !!never_expires,
        repeat_every_value,
        repeat_every_unit,
        currency,
        subtotal,
        tax_total,
        discount_type,
        discount_value,
        rounding,
        grand_total,
        notes || '',
        terms_conditions || '',
        JSON.stringify(email_list || []),
        currentTime,
        currentTime,
      ]
    );

    // Insert items
    const values = items.map(async (it) => {
      // Optionally fetch service name
      let serviceName = it.service_name || null;
      if (!serviceName && it.service_id) {
        try {
          const [s] = await conn.query('SELECT service_name FROM services WHERE service_id = ?', [it.service_id]);
          if (s.length) serviceName = s[0].service_name;
        } catch { }
      }
      const qty = Number(it.quantity || 0);
      const rate = Number(it.rate || 0);
      const taxP = applyTax ? Number(it.tax_percent || 0) : 0;
      const amount = qty * rate; // store amount excluding tax as per spec
      return [
        subId,
        it.service_id,
        serviceName,
        qty,
        rate,
        taxP,
        amount
      ];
    });
    const resolvedValues = await Promise.all(values);
    await conn.query(
      `INSERT INTO subscription_items (sub_id, service_id, service_name, quantity, rate, tax_percent, amount) VALUES ?`,
      [resolvedValues]
    );

    // Log CREATE event to history (use existing connection to avoid deadlock)
    if (changedBy) {
      const { logFieldChange } = await import('./subscriptionHistoryModel.js');
      await logFieldChange({
        subId,
        changedBy,
        fieldName: null,
        oldValue: null,
        newValue: null,
        changeType: 'CREATE',
        ipAddress,
        conn // Pass existing connection to use same transaction
      });
    }

    await conn.commit();
    return { subId };
  } catch (error) {
    await conn.rollback();
    console.error('Error in addSubscription:', error);
    throw new Error(error.message || 'An unexpected error occurred while adding the subscription.');
  } finally {
    conn.release();
  }
}

async function getSubscriptionById(subId) {
  // Fetch subscription header
  const [rows] = await appDB.query(
    `SELECT s.*, c.display_name AS customer_name
     FROM subscriptions s
     JOIN customers c ON s.customer_id = c.customer_id
     WHERE s.sub_id = ?`,
    [subId]
  );
  if (!rows.length) return null;
  const header = rows[0];

  // Fetch items
  const [items] = await appDB.query(
    `SELECT item_id, service_id, service_name, quantity, rate, tax_percent, amount
     FROM subscription_items WHERE sub_id = ? ORDER BY item_id ASC`,
    [subId]
  );

  // Normalize emails JSON
  try {
    header.email_list = typeof header.email_list === 'string' ? JSON.parse(header.email_list || '[]') : (header.email_list || []);
  } catch {
    header.email_list = [];
  }

  return { ...header, items };
}

async function updateSubscriptionById(subId, payload, changedBy = null, ipAddress = null) {
  const conn = await appDB.getConnection();
  try {
    await conn.beginTransaction();

    // Fetch old data for comparison
    const [oldRows] = await conn.query(
      `SELECT s.*, 
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'service_id', si.service_id,
            'service_name', si.service_name,
            'quantity', si.quantity,
            'rate', si.rate,
            'tax_percent', si.tax_percent
          )
        ) FROM subscription_items si WHERE si.sub_id = s.sub_id) AS items_json
       FROM subscriptions s WHERE s.sub_id = ?`,
      [subId]
    );

    if (!oldRows.length) {
      throw new Error('Subscription not found');
    }

    const oldData = oldRows[0];
    // Parse items from old data
    let oldItems = [];
    try {
      if (oldData.items_json) {
        oldItems = typeof oldData.items_json === 'string' ? JSON.parse(oldData.items_json) : oldData.items_json;
      }
    } catch { }
    oldData.items = oldItems || [];

    // Parse email_list
    try {
      oldData.email_list = typeof oldData.email_list === 'string' ? JSON.parse(oldData.email_list || '[]') : (oldData.email_list || []);
    } catch {
      oldData.email_list = [];
    }

    const {
      domain_name,
      customerID,
      startDate,
      endDate,
      never_expires = false,
      repeat_every_value = null,
      repeat_every_unit = null,
      currency = 'INR',
      discount_type = 'amount',
      discount_value = 0,
      rounding = 0,
      notes = '',
      terms_conditions = '',
      email_list = [],
      items = [],
    } = payload;

    // Determine tax applicability
    let applyTax = true;
    try {
      const [crow] = await conn.query(`SELECT tax_preference FROM customers WHERE customer_id = ?`, [customerID]);
      const pref = (crow?.[0]?.tax_preference || '').toLowerCase();
      if (pref && pref !== 'taxable') applyTax = false;
    } catch { }

    // Recompute totals from items
    let subtotal = 0, tax_total = 0, grand_total = 0;
    items.forEach(it => {
      const lineSub = Number(it.quantity || 0) * Number(it.rate || 0);
      const lineTax = applyTax ? (lineSub * Number(it.tax_percent || 0)) / 100 : 0;
      subtotal += lineSub;
      tax_total += lineTax;
    });
    let discountAmt = discount_type === 'percent' ? (subtotal * Number(discount_value || 0)) / 100 : Number(discount_value || 0);
    if (!isFinite(discountAmt)) discountAmt = 0;
    grand_total = Math.max(0, subtotal + tax_total - discountAmt + Number(rounding || 0));

    // Prepare new data for comparison
    // Preserve status from old data if not provided in payload
    const status = payload.status !== undefined ? payload.status : (oldData.status || 'active');
    
    const newData = {
      domain_name: domain_name || null,
      customer_id: customerID,
      start_date: startDate,
      end_date: endDate || null,
      never_expires: !!never_expires,
      repeat_every_value,
      repeat_every_unit,
      currency,
      subtotal,
      tax_total,
      discount_type,
      discount_value,
      rounding,
      total: grand_total,
      notes: notes || '',
      terms_and_conditions: terms_conditions || '',
      email_list: email_list || [],
      status: status,
      items: items || []
    };

    await conn.query(
      `UPDATE subscriptions SET 
        domain_name=?, customer_id=?, start_date=?, end_date=?, never_expires=?, repeat_every_value=?, repeat_every_unit=?,
        currency=?, subtotal=?, tax_total=?, discount_type=?, discount_value=?, rounding=?, total=?, notes=?, terms_and_conditions=?, email_list=?, updated_at=CURRENT_TIMESTAMP
       WHERE sub_id = ?`,
      [
        newData.domain_name,
        newData.customer_id,
        newData.start_date,
        newData.end_date,
        newData.never_expires,
        newData.repeat_every_value,
        newData.repeat_every_unit,
        newData.currency,
        newData.subtotal,
        newData.tax_total,
        newData.discount_type,
        newData.discount_value,
        newData.rounding,
        newData.total,
        newData.notes,
        newData.terms_and_conditions,
        JSON.stringify(newData.email_list),
        subId,
      ]
    );

    // Replace items
    await conn.query(`DELETE FROM subscription_items WHERE sub_id = ?`, [subId]);
    if (items.length) {
      const values = items.map(it => [
        subId,
        it.service_id,
        it.service_name || null,
        Number(it.quantity || 0),
        Number(it.rate || 0),
        Number(it.tax_percent || 0),
        Number(it.quantity || 0) * Number(it.rate || 0)
      ]);
      await conn.query(
        `INSERT INTO subscription_items (sub_id, service_id, service_name, quantity, rate, tax_percent, amount) VALUES ?`,
        [values]
      );
    }

    // Log changes to history (use existing connection to avoid deadlock)
    if (changedBy) {
      const { compareSubscriptionData, logSubscriptionChanges } = await import('./subscriptionHistoryModel.js');
      const changes = compareSubscriptionData(oldData, newData);
      if (changes.length > 0) {
        await logSubscriptionChanges({
          subId,
          changedBy,
          changes,
          changeType: 'UPDATE',
          ipAddress,
          conn // Pass existing connection to use same transaction
        });
      }
    }

    await conn.commit();
    return true;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function deleteSubscriptionById(subId) {
  const conn = await appDB.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`DELETE FROM subscription_items WHERE sub_id = ?`, [subId]);
    const [res] = await conn.query(`DELETE FROM subscriptions WHERE sub_id = ?`, [subId]);
    await conn.commit();
    return res.affectedRows > 0;
  } catch (e) {
    await conn.rollback();
    throw e;
  }
}

export { getSubscriptions, addSubscription, getSubscriptionById, updateSubscriptionById, deleteSubscriptionById };

import appDB from "../db/subsyncDB.js";

/**
 * Format field value for display in summaries
 */
function formatValueForSummary(value, fieldName) {
  if (value === null || value === undefined || value === '') return null;
  
  // Handle dates
  if (fieldName && (fieldName.includes('date') || fieldName.includes('Date'))) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }
    } catch {}
  }
  
  // Handle booleans
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  // Handle numbers (currency, amounts)
  if (typeof value === 'number' || (!isNaN(value) && !isNaN(parseFloat(value)))) {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (fieldName && (fieldName.includes('total') || fieldName.includes('amount') || fieldName.includes('value') || fieldName.includes('rate'))) {
      return `₹${num.toFixed(2)}`;
    }
    return String(num);
  }
  
  // Handle arrays/objects
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.length === 0 ? 'None' : `${value.length} item(s)`;
    }
    return JSON.stringify(value);
  }
  
  return String(value);
}

/**
 * Generate human-readable change summary
 */
function generateChangeSummary(fieldName, oldValue, newValue) {
  const fieldLabel = fieldName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  
  const oldFormatted = formatValueForSummary(oldValue, fieldName);
  const newFormatted = formatValueForSummary(newValue, fieldName);
  
  if (oldFormatted === null || oldFormatted === '') {
    return `${fieldLabel} set to ${newFormatted}`;
  } else if (newFormatted === null || newFormatted === '') {
    return `${fieldLabel} cleared (was: ${oldFormatted})`;
  } else {
    return `${fieldLabel} changed from ${oldFormatted} to ${newFormatted}`;
  }
}

/**
 * Normalize value for storage (convert to string, handle special types)
 */
function normalizeValueForStorage(value) {
  if (value === null || value === undefined) return null;
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  
  return String(value);
}

/**
 * Log a single field change to subscription history
 * Only logs if oldValue !== newValue
 */
async function logFieldChange({ subId, changedBy, fieldName, oldValue, newValue, changeType = 'UPDATE', ipAddress = null, conn = null }) {
  try {
    // Skip if values are equal
    const oldNormalized = normalizeValueForStorage(oldValue);
    const newNormalized = normalizeValueForStorage(newValue);
    
    if (oldNormalized === newNormalized) {
      return; // No change, skip logging
    }
    
    // Generate human-readable summary
    const summary = generateChangeSummary(fieldName, oldValue, newValue);
    
    const query = conn ? conn.query.bind(conn) : appDB.query.bind(appDB);
    await query(
      `INSERT INTO subscription_history (sub_id, changed_by, change_type, field_name, old_value, new_value, change_summary, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [subId, changedBy, changeType, fieldName, oldNormalized, newNormalized, summary, ipAddress]
    );
  } catch (error) {
    console.error("Error logging subscription field change:", error);
    // Don't throw - logging should not break main flow
  }
}

/**
 * Log multiple field changes in a single transaction
 * Only logs fields that actually changed
 * @param {Object} params - Parameters object
 * @param {string} params.subId - Subscription ID
 * @param {string} params.changedBy - Username who made the change
 * @param {Array} params.changes - Array of change objects with fieldName, oldValue, newValue
 * @param {string} params.changeType - Type of change (CREATE, UPDATE, DELETE)
 * @param {string|null} params.ipAddress - IP address of the user
 * @param {Object|null} params.conn - Optional existing database connection (if provided, won't create new transaction)
 */
async function logSubscriptionChanges({ subId, changedBy, changes, changeType = 'UPDATE', ipAddress = null, conn = null }) {
  if (!changes || changes.length === 0) {
    return; // No changes to log
  }
  
  const useExistingConn = !!conn;
  let connection = conn;
  
  try {
    // Only create new connection if one wasn't provided
    if (!connection) {
      connection = await appDB.getConnection();
      await connection.beginTransaction();
    }
    
    // Log each field change (only if it actually changed)
    for (const { fieldName, oldValue, newValue } of changes) {
      await logFieldChange({ 
        subId, 
        changedBy, 
        fieldName, 
        oldValue, 
        newValue, 
        changeType, 
        ipAddress, 
        conn: connection 
      });
    }
    
    // Only commit if we created the transaction
    if (!useExistingConn) {
      await connection.commit();
    }
  } catch (error) {
    // Only rollback if we created the transaction
    if (!useExistingConn && connection) {
      await connection.rollback();
    }
    console.error("Error logging subscription changes:", error);
    // Don't throw - logging should not break main flow
  } finally {
    // Only release if we created the connection
    if (!useExistingConn && connection) {
      connection.release();
    }
  }
}

/**
 * Get subscription history for a specific subscription
 * Returns clean, normalized data
 */
async function getSubscriptionHistory(subId, { limit = 100, offset = 0 } = {}) {
  try {
    const [rows] = await appDB.query(
      `SELECT 
        history_id,
        sub_id,
        changed_by,
        change_type,
        field_name,
        old_value,
        new_value,
        change_summary,
        ip_address,
        created_at
       FROM subscription_history
       WHERE sub_id = ? AND field_name IS NOT NULL
       ORDER BY created_at DESC, history_id DESC
       LIMIT ? OFFSET ?`,
      [subId, parseInt(limit, 10), parseInt(offset, 10)]
    );
    
    // Normalize and parse values
    const normalized = rows.map(row => {
      let oldVal = row.old_value;
      let newVal = row.new_value;
      
      // Try to parse JSON values
      if (oldVal && (oldVal.startsWith('{') || oldVal.startsWith('['))) {
        try {
          oldVal = JSON.parse(oldVal);
        } catch {}
      }
      if (newVal && (newVal.startsWith('{') || newVal.startsWith('['))) {
        try {
          newVal = JSON.parse(newVal);
        } catch {}
      }
      
      // Convert boolean strings
      if (oldVal === '1' || oldVal === '0') oldVal = oldVal === '1';
      if (newVal === '1' || newVal === '0') newVal = newVal === '1';
      
      return {
        field_name: row.field_name,
        old_value: oldVal,
        new_value: newVal,
        summary: row.change_summary,
        changed_by: row.changed_by,
        ip_address: row.ip_address,
        created_at: row.created_at
      };
    });
    
    return normalized;
  } catch (error) {
    console.error("Error fetching subscription history:", error);
    throw new Error("Failed to fetch subscription history");
  }
}

/**
 * Get total count of history entries for a subscription
 */
async function getSubscriptionHistoryCount(subId) {
  try {
    const [[{ count }]] = await appDB.query(
      `SELECT COUNT(*) as count FROM subscription_history WHERE sub_id = ? AND field_name IS NOT NULL`,
      [subId]
    );
    return count;
  } catch (error) {
    console.error("Error counting subscription history:", error);
    return 0;
  }
}

/**
 * Normalize a value for comparison (handles numbers, dates, nulls)
 */
function normalizeValueForComparison(value, fieldName) {
  if (value === null || value === undefined) return null;
  
  // Handle dates - normalize to ISO string or null
  if (fieldName && (fieldName.includes('date') || fieldName.includes('Date'))) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch {}
    return null;
  }
  
  // Handle numbers - normalize to number type
  if (fieldName && (fieldName.includes('total') || fieldName.includes('amount') || fieldName.includes('value') || fieldName.includes('rate') || fieldName.includes('subtotal') || fieldName.includes('tax') || fieldName === 'rounding' || fieldName === 'discount_value' || fieldName === 'repeat_every_value')) {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (!isNaN(num) && isFinite(num)) {
      return num;
    }
    return 0;
  }
  
  // Handle booleans
  if (typeof value === 'boolean') {
    return value;
  }
  
  // Handle strings - trim whitespace
  if (typeof value === 'string') {
    return value.trim();
  }
  
  return value;
}

/**
 * Compare two subscription objects and return array of ONLY changed fields
 * Extensible: Add new fields to fieldsToTrack array
 */
function compareSubscriptionData(oldData, newData) {
  const changes = [];
  
  // Extensible field list - add new fields here as needed
  const fieldsToTrack = [
    'domain_name', 
    'customer_id', 
    'start_date', 
    'end_date', 
    'never_expires',
    'repeat_every_value', 
    'repeat_every_unit', 
    'billing_cycle_type',
    'currency', 
    'subtotal', 
    'tax_total',
    'discount_type', 
    'discount_value', 
    'rounding', 
    'total', 
    'notes',
    'terms_and_conditions', 
    'email_list', 
    'status'
  ];
  
  for (const field of fieldsToTrack) {
    const oldVal = oldData[field];
    const newVal = newData[field];
    
    // Handle special cases
    if (field === 'never_expires') {
      const oldBool = !!oldVal;
      const newBool = !!newVal;
      if (oldBool !== newBool) {
        changes.push({ fieldName: field, oldValue: oldBool, newValue: newBool });
      }
    } else if (field === 'email_list') {
      // Compare arrays
      const oldArr = Array.isArray(oldVal) ? oldVal : (typeof oldVal === 'string' ? JSON.parse(oldVal || '[]') : []);
      const newArr = Array.isArray(newVal) ? newVal : (typeof newVal === 'string' ? JSON.parse(newVal || '[]') : []);
      const oldStr = JSON.stringify([...oldArr].sort());
      const newStr = JSON.stringify([...newArr].sort());
      if (oldStr !== newStr) {
        changes.push({ fieldName: field, oldValue: oldArr, newValue: newArr });
      }
    } else {
      // Normalize values for proper comparison
      const oldNormalized = normalizeValueForComparison(oldVal, field);
      const newNormalized = normalizeValueForComparison(newVal, field);
      
      // Compare normalized values
      let isDifferent = false;
      
      if (oldNormalized === null && newNormalized === null) {
        isDifferent = false;
      } else if (oldNormalized === null || newNormalized === null) {
        isDifferent = true;
      } else if (typeof oldNormalized === 'number' && typeof newNormalized === 'number') {
        // For numbers, compare with small epsilon to handle floating point precision
        isDifferent = Math.abs(oldNormalized - newNormalized) > 0.01;
      } else if (typeof oldNormalized === 'string' && typeof newNormalized === 'string') {
        isDifferent = oldNormalized !== newNormalized;
      } else {
        // Fallback to string comparison
        isDifferent = String(oldNormalized) !== String(newNormalized);
      }
      
      if (isDifferent) {
        changes.push({ fieldName: field, oldValue: oldVal, newValue: newVal });
      }
    }
  }
  
  // Compare items separately (only if changed)
  const oldItems = Array.isArray(oldData.items) ? oldData.items : [];
  const newItems = Array.isArray(newData.items) ? newData.items : [];
  
  // Normalize items for comparison (remove item_id, sort)
  const normalizeItem = (item) => ({
    service_id: item.service_id || null,
    service_name: item.service_name || null,
    quantity: Number(item.quantity || 0),
    rate: Number(item.rate || 0),
    tax_percent: Number(item.tax_percent || 0)
  });
  
  const oldItemsNormalized = oldItems.map(normalizeItem).sort((a, b) => {
    const aKey = `${a.service_id || ''}-${a.service_name || ''}-${a.quantity}-${a.rate}`;
    const bKey = `${b.service_id || ''}-${b.service_name || ''}-${b.quantity}-${b.rate}`;
    return aKey.localeCompare(bKey);
  });
  
  const newItemsNormalized = newItems.map(normalizeItem).sort((a, b) => {
    const aKey = `${a.service_id || ''}-${a.service_name || ''}-${a.quantity}-${a.rate}`;
    const bKey = `${b.service_id || ''}-${b.service_name || ''}-${b.quantity}-${b.rate}`;
    return aKey.localeCompare(bKey);
  });
  
  const oldItemsStr = JSON.stringify(oldItemsNormalized);
  const newItemsStr = JSON.stringify(newItemsNormalized);
  
  if (oldItemsStr !== newItemsStr) {
    changes.push({ fieldName: 'items', oldValue: oldItems, newValue: newItems });
  }
  
  return changes;
}

export {
  logFieldChange,
  logSubscriptionChanges,
  getSubscriptionHistory,
  getSubscriptionHistoryCount,
  compareSubscriptionData
};

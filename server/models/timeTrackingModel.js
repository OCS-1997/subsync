import appDB from "../db/subsyncDB.js";
import { getCurrentTime } from "../middlewares/time.js";
import { generateID } from "../middlewares/generateID.js";

/**
 * Convert ISO datetime string or Date object to MySQL datetime format
 * @param {string|Date|null} datetime
 * @returns {string|null} MySQL formatted datetime or null
 */
function formatDateTimeForMySQL(datetime) {
  if (!datetime) return null;

  const date = typeof datetime === "string" ? new Date(datetime) : datetime;
  if (isNaN(date.getTime())) return null;

  // Use local time components to match getCurrentTime() format: YYYY-MM-DD HH:MM:SS
  const pad = (num) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Create a new time entry
 * @param {Object} entry - Time entry data
 * @returns {Promise<string>} - Entry ID
 */
async function createTimeEntry(entry) {
  try {
    const entryId = generateID("TID");
    const currentTime = getCurrentTime();

    const [result] = await appDB.query(
      `INSERT INTO time_entries (
                entry_id, user_id, start_time, end_time, duration_minutes,
                is_timer_running, activity_type_id, project_id, customer_id,
                title, description, is_billable, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entryId,
        entry.user_id,
        formatDateTimeForMySQL(entry.start_time),
        formatDateTimeForMySQL(entry.end_time),
        entry.duration_minutes || 0,
        entry.is_timer_running || false,
        entry.activity_type_id,
        entry.project_id || null,
        entry.customer_id || null,
        entry.title,
        entry.description || null,
        entry.is_billable !== undefined ? entry.is_billable : false,
        currentTime,
        currentTime,
      ],
    );

    if (result.affectedRows > 0) {
      return entryId;
    } else {
      throw new Error("Failed to create time entry");
    }
  } catch (error) {
    console.error("Error creating time entry:", error);
    throw error;
  }
}

/**
 * Update an existing time entry
 * @param {string} entryId - Entry ID
 * @param {Object} data - Updated data
 * @returns {Promise<Object>}
 */
async function updateTimeEntry(entryId, data) {
  try {
    const currentTime = getCurrentTime();

    const [result] = await appDB.query(
      `UPDATE time_entries SET
                start_time = COALESCE(?, start_time),
                end_time = COALESCE(?, end_time),
                duration_minutes = COALESCE(?, duration_minutes),
                is_timer_running = COALESCE(?, is_timer_running),
                activity_type_id = COALESCE(?, activity_type_id),
                project_id = COALESCE(NULLIF(?, ''), project_id),
                customer_id = COALESCE(NULLIF(?, ''), customer_id),
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                is_billable = COALESCE(?, is_billable),
                updated_at = ?
            WHERE entry_id = ? AND deleted_at IS NULL`,
      [
        formatDateTimeForMySQL(data.start_time),
        formatDateTimeForMySQL(data.end_time),
        data.duration_minutes !== undefined ? data.duration_minutes : null,
        data.is_timer_running !== undefined ? data.is_timer_running : null,
        data.activity_type_id !== undefined ? data.activity_type_id : null,
        data.project_id !== undefined ? data.project_id : null,
        data.customer_id !== undefined ? data.customer_id : null,
        data.title !== undefined ? data.title : null,
        data.description !== undefined ? data.description : null,
        data.is_billable !== undefined ? data.is_billable : null,
        currentTime,
        entryId,
      ],
    );

    if (result.affectedRows === 0) {
      throw new Error("Time entry not found or no changes made");
    }

    return result;
  } catch (error) {
    console.error("Error updating time entry:", error);
    throw error;
  }
}

/**
 * Soft delete a time entry
 * @param {string} entryId - Entry ID
 * @returns {Promise<Object>}
 */
async function deleteTimeEntry(entryId) {
  try {
    const currentTime = getCurrentTime();

    const [result] = await appDB.query(
      `UPDATE time_entries SET deleted_at = ?, updated_at = ? WHERE entry_id = ? AND deleted_at IS NULL`,
      [currentTime, currentTime, entryId],
    );

    if (result.affectedRows === 0) {
      throw new Error("Time entry not found");
    }

    return result;
  } catch (error) {
    console.error("Error deleting time entry:", error);
    throw error;
  }
}

/**
 * Get time entries with filters and pagination
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
async function getTimeEntries({
  userId,
  teamId,
  startDate,
  endDate,
  customerId,
  projectId,
  activityTypeId,
  isBillable,
  page = 1,
  limit = 50,
  sortBy = "start_time",
  sortOrder = "DESC",
}) {
  try {
    const offset = (page - 1) * limit;

    let whereConditions = ["te.deleted_at IS NULL"];
    let params = [];

    if (userId) {
      whereConditions.push("te.user_id = ?");
      params.push(userId);
    }

    if (teamId) {
      whereConditions.push("te.team_id = ?");
      params.push(teamId);
    }

    if (startDate) {
      whereConditions.push("te.start_time >= ?");
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push("te.start_time <= ?");
      params.push(endDate);
    }

    if (customerId) {
      whereConditions.push("te.customer_id = ?");
      params.push(customerId);
    }

    if (projectId) {
      whereConditions.push("te.project_id = ?");
      params.push(projectId);
    }

    if (activityTypeId) {
      whereConditions.push("te.activity_type_id = ?");
      params.push(activityTypeId);
    }

    if (isBillable !== undefined) {
      whereConditions.push("te.is_billable = ?");
      params.push(isBillable);
    }

    const whereClause = whereConditions.join(" AND ");

    // Safelist for sorting columns to prevent SQL injection
    const allowedSortColumns = [
      "start_time",
      "duration_minutes",
      "title",
      "is_billable",
    ];
    const finalSortBy = allowedSortColumns.includes(sortBy)
      ? `te.${sortBy}`
      : "te.start_time";
    const finalSortOrder = sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const [entries] = await appDB.query(
      `SELECT 
                te.*,
                u.name as user_full_name,
                u.username as user_name,
                c.display_name as customer_name,
                p.project_name,
                at.type_name as activity_type_name,
                at.color as activity_color
             FROM time_entries te
             LEFT JOIN users u ON te.user_id = u.username
             LEFT JOIN customers c ON te.customer_id = c.customer_id
             LEFT JOIN time_projects p ON te.project_id = p.id
             LEFT JOIN time_activity_types at ON te.activity_type_id = at.id
             WHERE ${whereClause}
             ORDER BY ${finalSortBy} ${finalSortOrder}
             LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)],
    );

    const [[{ total }]] = await appDB.query(
      `SELECT COUNT(*) as total FROM time_entries te WHERE ${whereClause}`,
      params,
    );

    const totalPages = Math.ceil(total / limit);

    return {
      entries,
      totalPages,
      totalRecords: total,
      currentPage: parseInt(page),
      limit: parseInt(limit),
    };
  } catch (error) {
    console.error("Error fetching time entries:", error);
    throw error;
  }
}

/**
 * Get a single time entry by ID
 * @param {string} entryId - Entry ID
 * @returns {Promise<Object>}
 */
async function getTimeEntryById(entryId) {
  try {
    const [entries] = await appDB.query(
      `SELECT 
                te.*,
                u.name as user_full_name,
                u.username as user_name,
                c.display_name as customer_name,
                p.project_name,
                at.type_name as activity_type_name,
                at.color as activity_color
             FROM time_entries te
             LEFT JOIN users u ON te.user_id = u.username
             LEFT JOIN customers c ON te.customer_id = c.customer_id
             LEFT JOIN time_projects p ON te.project_id = p.id
             LEFT JOIN time_activity_types at ON te.activity_type_id = at.id
             WHERE te.entry_id = ? AND te.deleted_at IS NULL`,
      [entryId],
    );

    return entries[0] || null;
  } catch (error) {
    console.error("Error fetching time entry by ID:", error);
    throw error;
  }
}

/**
 * Start a timer (create entry with is_timer_running = true)
 * @param {string} userId - User ID
 * @param {Object} entryData - Timer data
 * @returns {Promise<string>} - Entry ID
 */
async function startTimer(userId, entryData) {
  try {
    // Check if user already has an active timer
    const activeTimer = await getActiveTimer(userId);
    if (activeTimer) {
      throw new Error(
        "User already has an active timer. Please stop it first.",
      );
    }

    const entryId = generateID("TID");
    const currentTime = getCurrentTime();

    const [result] = await appDB.query(
      `INSERT INTO time_entries (
                entry_id, user_id, start_time, is_timer_running, last_ping_at,
                activity_type_id, project_id, customer_id, title, description,
                is_billable, created_at, updated_at
            ) VALUES (?, ?, ?, TRUE, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entryId,
        userId,
        entryData.start_time
          ? formatDateTimeForMySQL(entryData.start_time)
          : currentTime,
        currentTime,
        entryData.activity_type_id,
        entryData.project_id || null,
        entryData.customer_id || null,
        entryData.title,
        entryData.description || null,
        entryData.is_billable !== undefined ? entryData.is_billable : false,
        currentTime,
        currentTime,
      ],
    );

    if (result.affectedRows > 0) {
      return entryId;
    } else {
      throw new Error("Failed to start timer");
    }
  } catch (error) {
    console.error("Error starting timer:", error);
    throw error;
  }
}

/**
 * Stop a timer and calculate duration
 * @param {string} entryId - Entry ID
 * @returns {Promise<Object>}
 */
async function stopTimer(entryId) {
  try {
    const currentTime = getCurrentTime();

    // Get the entry first to calculate duration
    const [entries] = await appDB.query(
      `SELECT start_time FROM time_entries WHERE entry_id = ? AND is_timer_running = TRUE AND deleted_at IS NULL`,
      [entryId],
    );

    if (!entries || entries.length === 0) {
      throw new Error("Active timer not found");
    }

    const startTime = new Date(entries[0].start_time);
    const endTime = new Date(currentTime);
    const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

    const [result] = await appDB.query(
      `UPDATE time_entries SET
                end_time = ?,
                duration_minutes = ?,
                is_timer_running = FALSE,
                updated_at = ?
            WHERE entry_id = ? AND deleted_at IS NULL`,
      [currentTime, durationMinutes, currentTime, entryId],
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to stop timer");
    }

    return { entryId, duration_minutes: durationMinutes };
  } catch (error) {
    console.error("Error stopping timer:", error);
    throw error;
  }
}

/**
 * Get active timer for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>}
 */
async function getActiveTimer(userId) {
  try {
    const [timers] = await appDB.query(
      `SELECT 
                te.*,
                c.display_name as customer_name,
                p.project_name,
                at.type_name as activity_type_name,
                at.color as activity_color
             FROM time_entries te
             LEFT JOIN customers c ON te.customer_id = c.customer_id
             LEFT JOIN time_projects p ON te.project_id = p.id
             LEFT JOIN time_activity_types at ON te.activity_type_id = at.id
             WHERE te.user_id = ? AND te.is_timer_running = TRUE AND te.deleted_at IS NULL
             LIMIT 1`,
      [userId],
    );

    return timers[0] || null;
  } catch (error) {
    console.error("Error fetching active timer:", error);
    throw error;
  }
}

/**
 * Get time entries summary for reports
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
async function getTimeEntriesSummary({ userId, startDate, endDate, teamId }) {
  try {
    let whereConditions = ["deleted_at IS NULL", "end_time IS NOT NULL"];
    let params = [];

    if (userId) {
      whereConditions.push("user_id = ?");
      params.push(userId);
    }

    if (teamId) {
      whereConditions.push("team_id = ?");
      params.push(teamId);
    }

    if (startDate) {
      whereConditions.push("start_time >= ?");
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push("start_time <= ?");
      params.push(endDate);
    }

    const whereClause = whereConditions.join(" AND ");

    const [[summary]] = await appDB.query(
      `SELECT 
                COUNT(*) as total_entries,
                SUM(duration_minutes) as total_minutes,
                SUM(CASE WHEN is_billable = TRUE THEN duration_minutes ELSE 0 END) as billable_minutes,
                SUM(CASE WHEN is_billable = FALSE THEN duration_minutes ELSE 0 END) as non_billable_minutes
             FROM time_entries
             WHERE ${whereClause}`,
      params,
    );

    return summary;
  } catch (error) {
    console.error("Error fetching time summary:", error);
    throw error;
  }
}

/**
 * Get users who have time entries in a given date range
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Array>} List of users { user_id, name, email }
 */
async function getUsersWithTimeEntries(startDate, endDate) {
  try {
    const [users] = await appDB.query(
      `SELECT DISTINCT
          te.user_id,
          u.name,
          u.email
       FROM time_entries te
       JOIN users u ON te.user_id = u.username
       WHERE te.start_time >= ? AND te.start_time <= ? AND te.deleted_at IS NULL`,
      [formatDateTimeForMySQL(startDate), formatDateTimeForMySQL(endDate)],
    );
    return users;
  } catch (error) {
    console.error("Error fetching users with time entries:", error);
    throw error;
  }
}

export {
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  getTimeEntries,
  getTimeEntryById,
  startTimer,
  stopTimer,
  getActiveTimer,
  getTimeEntriesSummary,
  getUsersWithTimeEntries,
};

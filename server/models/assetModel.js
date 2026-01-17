import appDB from "../db/subsyncDB.js";
import { getCurrentTime } from "../middlewares/time.js";
import { generateID } from "../middlewares/generateID.js";

// ==================== ASSET TYPES ====================

/**
 * Get all asset types
 */
const getAllAssetTypes = async () => {
    const [rows] = await appDB.query(
        `SELECT * FROM asset_types WHERE is_active = 1 ORDER BY type_name ASC`
    );
    return rows;
};

/**
 * Create a new asset type
 */
const createAssetType = async ({ type_name, description, icon }) => {
    const currentTime = getCurrentTime();
    const [result] = await appDB.execute(
        `INSERT INTO asset_types (type_name, description, icon, is_active, created_at) 
         VALUES (?, ?, ?, 1, ?)`,
        [type_name, description || '', icon || 'Package', currentTime]
    );
    return result;
};

/**
 * Update an asset type
 */
const updateAssetType = async (id, { type_name, description, icon, is_active }) => {
    const [result] = await appDB.execute(
        `UPDATE asset_types SET type_name = ?, description = ?, icon = ?, is_active = ? WHERE id = ?`,
        [type_name, description || '', icon || 'Package', is_active ?? 1, id]
    );
    return result;
};

/**
 * Delete an asset type (soft delete - set inactive)
 */
const deleteAssetType = async (id) => {
    const [result] = await appDB.execute(
        `UPDATE asset_types SET is_active = 0 WHERE id = ?`,
        [id]
    );
    return result;
};

// ==================== ASSET CATEGORIES ====================

/**
 * Get all asset categories
 */
const getAllCategories = async () => {
    const [rows] = await appDB.query(
        `SELECT * FROM asset_categories ORDER BY name ASC`
    );
    return rows;
};

/**
 * Create a new category
 */
const createCategory = async ({ name, description, icon, color }) => {
    const currentTime = getCurrentTime();
    const [result] = await appDB.execute(
        `INSERT INTO asset_categories (name, description, icon, color, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, description || '', icon || 'Folder', color || '#3b82f6', currentTime, currentTime]
    );
    return result;
};

/**
 * Update a category
 */
const updateCategory = async (id, { name, description, icon, color }) => {
    const currentTime = getCurrentTime();
    const [result] = await appDB.execute(
        `UPDATE asset_categories SET name = ?, description = ?, icon = ?, color = ?, updated_at = ? WHERE id = ?`,
        [name, description || '', icon || 'Folder', color || '#3b82f6', currentTime, id]
    );
    return result;
};

/**
 * Delete a category
 */
const deleteCategory = async (id) => {
    // Check if any assets use this category
    const [[{ count }]] = await appDB.query(
        `SELECT COUNT(*) as count FROM assets WHERE category_id = ?`,
        [id]
    );
    if (count > 0) {
        throw new Error(`Cannot delete category: ${count} assets are using it`);
    }
    const [result] = await appDB.execute(
        `DELETE FROM asset_categories WHERE id = ?`,
        [id]
    );
    return result;
};

// ==================== ASSETS ====================

/**
 * Create a new asset
 */
const createAsset = async (asset) => {
    const currentTime = getCurrentTime();
    const assetId = generateID("AST");

    const {
        asset_name, category_id, type_id, serial_number, model, manufacturer,
        purchase_date, purchase_price, warranty_expiry, assigned_to, location,
        status, expected_life_years, salvage_value, depreciation_method, notes, custom_fields
    } = asset;

    // Validation
    if (!asset_name) throw new Error("Asset name is required");
    if (!category_id) throw new Error("Category is required");
    if (!type_id) throw new Error("Asset type is required");

    const query = `
        INSERT INTO assets (
            asset_id, asset_name, category_id, type_id, serial_number, model, manufacturer,
            purchase_date, purchase_price, warranty_expiry, assigned_to, assigned_date, location,
            status, expected_life_years, salvage_value, depreciation_method, notes, custom_fields,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        assetId,
        asset_name,
        category_id,
        type_id,
        serial_number || null,
        model || null,
        manufacturer || null,
        purchase_date || null,
        purchase_price || 0,
        warranty_expiry || null,
        assigned_to || null,
        assigned_to ? currentTime : null,
        location || null,
        status || 'Active',
        expected_life_years || null,
        salvage_value || 0,
        depreciation_method || 'Straight-Line',
        notes || '',
        JSON.stringify(custom_fields || {}),
        currentTime,
        currentTime
    ];

    const [result] = await appDB.execute(query, values);

    // Log creation in history
    await logAssetHistory(assetId, 'created', null, { asset_name, status: status || 'Active' });

    return { ...result, asset_id: assetId };
};

/**
 * Get all assets with pagination and filters
 */
const getAllAssets = async ({
    search = "",
    sort = "updated_at",
    order = "desc",
    page = 1,
    limit = 10,
    category_id = null,
    type_id = null,
    status = null,
    assigned_to = null
} = {}) => {
    const offset = (page - 1) * limit;
    const searchQuery = `%${search}%`;

    const allowedSortColumns = [
        'asset_id', 'asset_name', 'status', 'purchase_date', 'warranty_expiry',
        'purchase_price', 'created_at', 'updated_at', 'serial_number', 'model',
        'category_name', 'type_name', 'assigned_to_name'
    ];
    const validSort = allowedSortColumns.includes(sort) ? sort : 'updated_at';
    const validOrder = ['asc', 'desc'].includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC';

    // Specify table aliases for ambiguous columns if needed
    const sortPrefix = ['asset_id', 'asset_name', 'status', 'purchase_date', 'warranty_expiry', 'purchase_price', 'created_at', 'updated_at', 'serial_number', 'model'].includes(validSort) ? 'a.' : '';

    let whereClause = `WHERE a.deleted_at IS NULL AND (a.asset_name LIKE ? OR a.asset_id LIKE ? OR a.serial_number LIKE ? OR a.model LIKE ?)`;
    const params = [searchQuery, searchQuery, searchQuery, searchQuery];

    if (category_id) {
        whereClause += ` AND a.category_id = ?`;
        params.push(category_id);
    }
    if (type_id) {
        whereClause += ` AND a.type_id = ?`;
        params.push(type_id);
    }
    if (status) {
        whereClause += ` AND a.status = ?`;
        params.push(status);
    }
    if (assigned_to) {
        whereClause += ` AND a.assigned_to = ?`;
        params.push(assigned_to);
    }

    const [assets] = await appDB.query(
        `SELECT a.*, 
                c.name as category_name, c.color as category_color, c.icon as category_icon,
                t.type_name, t.icon as type_icon,
                u.name as assigned_to_name
         FROM assets a
         LEFT JOIN asset_categories c ON a.category_id = c.id
         LEFT JOIN asset_types t ON a.type_id = t.id
         LEFT JOIN users u ON a.assigned_to = u.username
         ${whereClause}
         ORDER BY ${sortPrefix}${validSort} ${validOrder}
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await appDB.query(
        `SELECT COUNT(*) as total FROM assets a ${whereClause}`,
        params
    );

    return {
        assets,
        totalPages: Math.ceil(total / limit),
        totalRecords: total
    };
};

/**
 * Get a single asset by ID with full details
 */
const getAssetById = async (assetId) => {
    const [rows] = await appDB.execute(
        `SELECT a.*, 
                c.name as category_name, c.color as category_color, c.icon as category_icon,
                t.type_name, t.icon as type_icon,
                u.name as assigned_to_name
         FROM assets a
         LEFT JOIN asset_categories c ON a.category_id = c.id
         LEFT JOIN asset_types t ON a.type_id = t.id
         LEFT JOIN users u ON a.assigned_to = u.username
         WHERE a.asset_id = ? AND a.deleted_at IS NULL`,
        [assetId]
    );

    if (rows.length === 0) return null;

    const asset = rows[0];

    // Parse JSON fields
    if (asset.custom_fields && typeof asset.custom_fields === 'string') {
        try { asset.custom_fields = JSON.parse(asset.custom_fields); } catch { asset.custom_fields = {}; }
    }

    // Get attachments
    const [attachments] = await appDB.query(
        `SELECT * FROM asset_attachments WHERE asset_id = ? ORDER BY created_at DESC`,
        [assetId]
    );
    asset.attachments = attachments;

    // Get history
    const [history] = await appDB.query(
        `SELECT h.*, u.name as changed_by_name 
         FROM asset_history h
         LEFT JOIN users u ON h.changed_by = u.username
         WHERE h.asset_id = ? 
         ORDER BY h.created_at DESC 
         LIMIT 20`,
        [assetId]
    );
    asset.history = history.map(h => ({
        ...h,
        details: typeof h.details === 'string' ? JSON.parse(h.details) : h.details
    }));

    return asset;
};

/**
 * Update an asset
 */
const updateAsset = async (assetId, data) => {
    const currentTime = getCurrentTime();

    const {
        asset_name, category_id, type_id, serial_number, model, manufacturer,
        purchase_date, purchase_price, warranty_expiry, location,
        status, expected_life_years, salvage_value, depreciation_method, notes, custom_fields
    } = data;

    const query = `
        UPDATE assets SET
            asset_name = ?, category_id = ?, type_id = ?, serial_number = ?, model = ?, manufacturer = ?,
            purchase_date = ?, purchase_price = ?, warranty_expiry = ?, location = ?,
            status = ?, expected_life_years = ?, salvage_value = ?, depreciation_method = ?, 
            notes = ?, custom_fields = ?, updated_at = ?
        WHERE asset_id = ?
    `;

    const values = [
        asset_name,
        category_id,
        type_id,
        serial_number || null,
        model || null,
        manufacturer || null,
        purchase_date || null,
        purchase_price || 0,
        warranty_expiry || null,
        location || null,
        status || 'Active',
        expected_life_years || null,
        salvage_value || 0,
        depreciation_method || 'Straight-Line',
        notes || '',
        JSON.stringify(custom_fields || {}),
        currentTime,
        assetId
    ];

    const [result] = await appDB.execute(query, values);

    // Log update in history
    await logAssetHistory(assetId, 'updated', null, { fields_updated: Object.keys(data) });

    return result;
};

/**
 * Delete an asset
 */
const deleteAsset = async (assetId, changedBy = null) => {
    const currentTime = getCurrentTime();
    // Soft delete: set deleted_at instead of deleting records
    const [result] = await appDB.execute(
        `UPDATE assets SET deleted_at = ? WHERE asset_id = ?`,
        [currentTime, assetId]
    );
    
    // Log deletion in history
    await logAssetHistory(assetId, 'deleted', changedBy, { soft_delete: true });
    
    return result;
};

/**
 * Restore a soft-deleted asset
 */
const restoreAsset = async (assetId, changedBy = null) => {
    const [result] = await appDB.execute(
        `UPDATE assets SET deleted_at = NULL WHERE asset_id = ?`,
        [assetId]
    );
    
    // Log restoration in history
    await logAssetHistory(assetId, 'restored', changedBy, { action: 'restored' });
    
    return result;
};

/**
 * Assign an asset to a user
 */
const assignAsset = async (assetId, username, changedBy) => {
    const currentTime = getCurrentTime();
    const [result] = await appDB.execute(
        `UPDATE assets SET assigned_to = ?, assigned_date = ?, updated_at = ? WHERE asset_id = ?`,
        [username, currentTime, currentTime, assetId]
    );

    await logAssetHistory(assetId, 'assigned', changedBy, { assigned_to: username });

    return result;
};

/**
 * Unassign an asset
 */
const unassignAsset = async (assetId, changedBy) => {
    const currentTime = getCurrentTime();

    // Get current assignee for history
    const [[asset]] = await appDB.query(`SELECT assigned_to FROM assets WHERE asset_id = ?`, [assetId]);
    const previousAssignee = asset?.assigned_to;

    const [result] = await appDB.execute(
        `UPDATE assets SET assigned_to = NULL, assigned_date = NULL, updated_at = ? WHERE asset_id = ?`,
        [currentTime, assetId]
    );

    await logAssetHistory(assetId, 'unassigned', changedBy, { previous_assignee: previousAssignee });

    return result;
};

// ==================== ASSET HISTORY ====================

/**
 * Log asset history entry
 */
const logAssetHistory = async (assetId, action, changedBy, details = {}) => {
    const currentTime = getCurrentTime();
    await appDB.execute(
        `INSERT INTO asset_history (asset_id, action, changed_by, details, created_at) VALUES (?, ?, ?, ?, ?)`,
        [assetId, action, changedBy, JSON.stringify(details), currentTime]
    );
};

/**
 * Get asset history
 */
const getAssetHistory = async (assetId, limit = 50) => {
    const [rows] = await appDB.query(
        `SELECT h.*, u.name as changed_by_name 
         FROM asset_history h
         LEFT JOIN users u ON h.changed_by = u.username
         WHERE h.asset_id = ? 
         ORDER BY h.created_at DESC 
         LIMIT ?`,
        [assetId, limit]
    );
    return rows.map(h => ({
        ...h,
        details: typeof h.details === 'string' ? JSON.parse(h.details) : h.details
    }));
};

// ==================== ASSET ATTACHMENTS ====================

/**
 * Add attachment to asset
 */
const addAttachment = async (assetId, { file_name, file_path, file_type, file_size, uploaded_by }) => {
    const currentTime = getCurrentTime();
    const [result] = await appDB.execute(
        `INSERT INTO asset_attachments (asset_id, file_name, file_path, file_type, file_size, uploaded_by, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [assetId, file_name, file_path, file_type, file_size, uploaded_by, currentTime]
    );

    await logAssetHistory(assetId, 'attachment_added', uploaded_by, { file_name });

    return result;
};

/**
 * Delete attachment
 */
const deleteAttachment = async (attachmentId, deletedBy) => {
    // Get attachment info for history
    const [[attachment]] = await appDB.query(
        `SELECT asset_id, file_name FROM asset_attachments WHERE id = ?`,
        [attachmentId]
    );
    if (!attachment) throw new Error("Attachment not found");

    const [result] = await appDB.execute(`DELETE FROM asset_attachments WHERE id = ?`, [attachmentId]);

    await logAssetHistory(attachment.asset_id, 'attachment_deleted', deletedBy, { file_name: attachment.file_name });

    return result;
};

// ==================== STATISTICS ====================

/**
 * Get asset statistics for dashboard
 */
const getAssetStats = async () => {
    // Total counts by status
    const [[statusCounts]] = await appDB.query(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) as maintenance,
            SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive,
            SUM(CASE WHEN status = 'Retired' THEN 1 ELSE 0 END) as retired
        FROM assets
    `);

    // Total value
    const [[valueStats]] = await appDB.query(`
        SELECT 
            COALESCE(SUM(purchase_price), 0) as total_value,
            COALESCE(SUM(CASE WHEN status = 'Active' THEN purchase_price ELSE 0 END), 0) as active_value
        FROM assets
    `);

    // Warranty expiring soon (next 30, 60, 90 days)
    const [[warrantyExpiring]] = await appDB.query(`
        SELECT 
            SUM(CASE WHEN warranty_expiry BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as next_30_days,
            SUM(CASE WHEN warranty_expiry BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 60 DAY) THEN 1 ELSE 0 END) as next_60_days,
            SUM(CASE WHEN warranty_expiry BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY) THEN 1 ELSE 0 END) as next_90_days
        FROM assets
        WHERE warranty_expiry IS NOT NULL
    `);

    // By category
    const [byCategory] = await appDB.query(`
        SELECT c.name, c.color, COUNT(a.asset_id) as count, COALESCE(SUM(a.purchase_price), 0) as value
        FROM asset_categories c
        LEFT JOIN assets a ON c.id = a.category_id
        GROUP BY c.id, c.name, c.color
        ORDER BY count DESC
    `);

    // By type
    const [byType] = await appDB.query(`
        SELECT t.type_name, t.icon, COUNT(a.asset_id) as count
        FROM asset_types t
        LEFT JOIN assets a ON t.id = a.type_id
        WHERE t.is_active = 1
        GROUP BY t.id, t.type_name, t.icon
        ORDER BY count DESC
    `);

    // Recent assignments
    const [recentAssignments] = await appDB.query(`
        SELECT a.asset_id, a.asset_name, a.assigned_date, u.name as assigned_to_name
        FROM assets a
        JOIN users u ON a.assigned_to = u.username
        WHERE a.assigned_to IS NOT NULL
        ORDER BY a.assigned_date DESC
        LIMIT 5
    `);

    // Calculate depreciation summary (simple straight-line for now)
    const [[depreciationSummary]] = await appDB.query(`
        SELECT 
            COALESCE(SUM(purchase_price), 0) as original_value,
            COALESCE(SUM(
                CASE 
                    WHEN expected_life_years IS NOT NULL AND expected_life_years > 0 THEN
                        GREATEST(
                            salvage_value,
                            purchase_price - ((purchase_price - COALESCE(salvage_value, 0)) / expected_life_years * 
                                LEAST(TIMESTAMPDIFF(YEAR, purchase_date, CURDATE()), expected_life_years))
                        )
                    ELSE purchase_price
                END
            ), 0) as current_book_value
        FROM assets
        WHERE status = 'Active' AND purchase_date IS NOT NULL
    `);

    return {
        counts: statusCounts,
        value: valueStats,
        warranty_expiring: warrantyExpiring,
        by_category: byCategory,
        by_type: byType,
        recent_assignments: recentAssignments,
        depreciation: depreciationSummary
    };
};

export {
    // Asset Types
    getAllAssetTypes,
    createAssetType,
    updateAssetType,
    deleteAssetType,
    // Categories
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    // Assets
    createAsset,
    getAllAssets,
    getAssetById,
    updateAsset,
    deleteAsset,
    restoreAsset,
    assignAsset,
    unassignAsset,
    // History
    logAssetHistory,
    getAssetHistory,
    // Attachments
    addAttachment,
    deleteAttachment,
    // Stats
    getAssetStats
};

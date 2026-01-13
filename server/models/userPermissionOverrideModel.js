import appDB from "../db/subsyncDB.js";

/**
 * Get all permission overrides for a specific user
 * @param {string} username 
 * @returns {Promise<Array>}
 */
export const getUserPermissionOverrides = async (username) => {
    const [rows] = await appDB.query(
        `SELECT 
            upo.id,
            upo.username,
            upo.permission_id AS permissionId,
            upo.is_granted AS isGranted,
            upo.reason,
            upo.created_by AS createdBy,
            upo.created_at AS createdAt,
            upo.updated_at AS updatedAt,
            p.permission_key AS permissionKey,
            p.resource,
            p.action,
            p.description
        FROM user_permission_overrides upo
        JOIN permissions p ON p.id = upo.permission_id
        WHERE upo.username = ?
        ORDER BY p.resource, p.action`,
        [username]
    );
    return rows;
};

/**
 * Get a specific override by username and permission ID
 * @param {string} username 
 * @param {number} permissionId 
 * @returns {Promise<Object|null>}
 */
export const getUserPermissionOverride = async (username, permissionId) => {
    const [rows] = await appDB.query(
        `SELECT 
            upo.id,
            upo.username,
            upo.permission_id AS permissionId,
            upo.is_granted AS isGranted,
            upo.reason,
            upo.created_by AS createdBy,
            upo.created_at AS createdAt,
            upo.updated_at AS updatedAt
        FROM user_permission_overrides upo
        WHERE upo.username = ? AND upo.permission_id = ?`,
        [username, permissionId]
    );
    return rows[0] || null;
};

/**
 * Set a permission override for a user (grant or deny)
 * @param {string} username 
 * @param {number} permissionId 
 * @param {boolean} isGranted 
 * @param {string} reason 
 * @param {string} createdBy 
 * @returns {Promise<number>} - Override ID
 */
export const setUserPermissionOverride = async (username, permissionId, isGranted, reason = null, createdBy = null) => {
    const [result] = await appDB.query(
        `INSERT INTO user_permission_overrides 
            (username, permission_id, is_granted, reason, created_by)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            is_granted = VALUES(is_granted),
            reason = VALUES(reason),
            created_by = VALUES(created_by),
            updated_at = CURRENT_TIMESTAMP`,
        [username, permissionId, isGranted, reason, createdBy]
    );
    return result.insertId || result.affectedRows;
};

/**
 * Remove a specific permission override
 * @param {string} username 
 * @param {number} permissionId 
 * @returns {Promise<number>} - Affected rows
 */
export const removeUserPermissionOverride = async (username, permissionId) => {
    const [result] = await appDB.query(
        `DELETE FROM user_permission_overrides 
        WHERE username = ? AND permission_id = ?`,
        [username, permissionId]
    );
    return result.affectedRows;
};

/**
 * Remove all permission overrides for a user
 * @param {string} username 
 * @returns {Promise<number>} - Affected rows
 */
export const removeAllUserPermissionOverrides = async (username) => {
    const [result] = await appDB.query(
        `DELETE FROM user_permission_overrides WHERE username = ?`,
        [username]
    );
    return result.affectedRows;
};

/**
 * Batch set permission overrides for a user
 * @param {string} username 
 * @param {Array} overrides - Array of {permissionKey, isGranted, reason}
 * @param {string} createdBy 
 * @returns {Promise<void>}
 */
export const batchSetUserPermissionOverrides = async (username, overrides, createdBy) => {
    const connection = await appDB.getConnection();
    try {
        await connection.beginTransaction();

        // Delete all existing overrides for the user
        await connection.query(
            `DELETE FROM user_permission_overrides WHERE username = ?`,
            [username]
        );

        // Insert new overrides
        if (overrides && overrides.length > 0) {
            // First, get permission IDs from permission keys
            const permissionKeys = overrides.map(o => o.permissionKey);
            const [permissions] = await connection.query(
                `SELECT id, permission_key FROM permissions WHERE permission_key IN (?)`,
                [permissionKeys]
            );

            const permissionMap = {};
            permissions.forEach(p => {
                permissionMap[p.permission_key] = p.id;
            });

            // Prepare insert values
            const values = overrides.map(override => [
                username,
                permissionMap[override.permissionKey],
                override.isGranted,
                override.reason || null,
                createdBy
            ]).filter(v => v[1] !== undefined); // Filter out invalid permission keys

            if (values.length > 0) {
                await connection.query(
                    `INSERT INTO user_permission_overrides 
                        (username, permission_id, is_granted, reason, created_by)
                    VALUES ?`,
                    [values]
                );
            }
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Get all users who have permission overrides
 * @returns {Promise<Array>}
 */
export const getUsersWithOverrides = async () => {
    const [rows] = await appDB.query(
        `SELECT DISTINCT 
            upo.username,
            u.name,
            u.email,
            COUNT(upo.id) as overrideCount
        FROM user_permission_overrides upo
        JOIN users u ON u.username = upo.username
        GROUP BY upo.username, u.name, u.email
        ORDER BY u.name, upo.username`
    );
    return rows;
};

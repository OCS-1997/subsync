import appDB from "../db/subsyncDB.js";

/**
 * Get all reminder policies with their offsets
 * @returns {Promise<Array>}
 */
export async function getReminderPolicies() {
    try {
        const [policies] = await appDB.query(`
            SELECT 
                rp.id,
                rp.name,
                rp.created_by,
                rp.is_default,
                rp.created_at,
                rp.updated_at,
                COALESCE(
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', rpo.id,
                            'days_offset', rpo.days_offset,
                            'template_key', rpo.template_key,
                            'active', rpo.active,
                            'sort_order', rpo.sort_order
                        )
                    ),
                    JSON_ARRAY()
                ) AS offsets
            FROM reminder_policies rp
            LEFT JOIN reminder_policy_offsets rpo ON rp.id = rpo.policy_id
            GROUP BY rp.id, rp.name, rp.created_by, rp.is_default, rp.created_at, rp.updated_at
            ORDER BY rp.is_default DESC, rp.created_at DESC
        `);

        return policies.map(policy => {
            let offsets = [];
            if (policy.offsets) {
                if (typeof policy.offsets === 'string') {
                    try {
                        offsets = JSON.parse(policy.offsets);
                    } catch (e) {
                        console.error("Error parsing offsets JSON:", e);
                    }
                } else {
                    offsets = policy.offsets;
                }
            }
            return {
                ...policy,
                offsets
            };
        });
    } catch (error) {
        console.error("Error fetching reminder policies:", error);
        throw error;
    }
}

/**
 * Get reminder policy by ID with offsets
 * @param {number} policyId
 * @returns {Promise<Object|null>}
 */
export async function getReminderPolicyById(policyId) {
    try {
        const [policies] = await appDB.query(`
            SELECT 
                rp.id,
                rp.name,
                rp.created_by,
                rp.is_default,
                rp.created_at,
                rp.updated_at,
                COALESCE(
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', rpo.id,
                            'days_offset', rpo.days_offset,
                            'template_key', rpo.template_key,
                            'active', rpo.active,
                            'sort_order', rpo.sort_order
                        )
                    ),
                    JSON_ARRAY()
                ) AS offsets
            FROM reminder_policies rp
            LEFT JOIN reminder_policy_offsets rpo ON rp.id = rpo.policy_id
            WHERE rp.id = ?
            GROUP BY rp.id, rp.name, rp.created_by, rp.is_default, rp.created_at, rp.updated_at
        `, [policyId]);

        if (policies.length === 0) return null;

        const policy = policies[0];
        let offsets = [];
        if (policy.offsets) {
            if (typeof policy.offsets === 'string') {
                try {
                    offsets = JSON.parse(policy.offsets);
                } catch (e) {
                    console.error("Error parsing offsets JSON:", e);
                }
            } else {
                offsets = policy.offsets;
            }
        }

        return {
            ...policy,
            offsets
        };
    } catch (error) {
        console.error("Error fetching reminder policy:", error);
        throw error;
    }
}

/**
 * Get default reminder policy
 * @returns {Promise<Object|null>}
 */
export async function getDefaultReminderPolicy() {
    try {
        const [policies] = await appDB.query(`
            SELECT 
                rp.id,
                rp.name,
                rp.created_by,
                rp.is_default,
                rp.created_at,
                rp.updated_at
            FROM reminder_policies rp
            WHERE rp.is_default = 1
            LIMIT 1
        `);

        if (policies.length === 0) return null;

        const policy = policies[0];
        const offsets = await getPolicyOffsets(policy.id);
        return {
            ...policy,
            offsets
        };
    } catch (error) {
        console.error("Error fetching default reminder policy:", error);
        throw error;
    }
}

/**
 * Get offsets for a policy
 * @param {number} policyId
 * @returns {Promise<Array>}
 */
export async function getPolicyOffsets(policyId) {
    try {
        const [offsets] = await appDB.query(`
            SELECT 
                id,
                policy_id,
                days_offset,
                template_key,
                active,
                sort_order
            FROM reminder_policy_offsets
            WHERE policy_id = ?
            ORDER BY sort_order ASC, days_offset ASC
        `, [policyId]);

        return offsets;
    } catch (error) {
        console.error("Error fetching policy offsets:", error);
        throw error;
    }
}

/**
 * Create a reminder policy
 * @param {Object} policyData
 * @param {string} policyData.name
 * @param {number|null} policyData.created_by
 * @param {boolean} policyData.is_default
 * @returns {Promise<number>} The ID of the created policy
 */
export async function createReminderPolicy({ name, created_by = null, is_default = false }) {
    try {
        // If setting as default, unset other defaults
        if (is_default) {
            await appDB.query(`
                UPDATE reminder_policies SET is_default = 0 WHERE is_default = 1
            `);
        }

        const [result] = await appDB.query(`
            INSERT INTO reminder_policies (name, created_by, is_default)
            VALUES (?, ?, ?)
        `, [name, created_by, is_default ? 1 : 0]);

        return result.insertId;
    } catch (error) {
        console.error("Error creating reminder policy:", error);
        throw error;
    }
}

/**
 * Update a reminder policy
 * @param {number} policyId
 * @param {Object} policyData
 * @returns {Promise<void>}
 */
export async function updateReminderPolicy(policyId, { name, is_default = false }) {
    try {
        // If setting as default, unset other defaults
        if (is_default) {
            await appDB.query(`
                UPDATE reminder_policies SET is_default = 0 WHERE is_default = 1 AND id != ?
            `, [policyId]);
        }

        await appDB.query(`
            UPDATE reminder_policies
            SET name = ?, is_default = ?
            WHERE id = ?
        `, [name, is_default ? 1 : 0, policyId]);
    } catch (error) {
        console.error("Error updating reminder policy:", error);
        throw error;
    }
}

/**
 * Delete a reminder policy
 * @param {number} policyId
 * @returns {Promise<void>}
 */
export async function deleteReminderPolicy(policyId) {
    try {
        await appDB.query(`
            DELETE FROM reminder_policies WHERE id = ?
        `, [policyId]);
    } catch (error) {
        console.error("Error deleting reminder policy:", error);
        throw error;
    }
}

/**
 * Replace all offsets for a policy
 * @param {number} policyId
 * @param {Array<Object>} offsets Array of {days_offset, template_key, active, sort_order}
 * @returns {Promise<void>}
 */
export async function replacePolicyOffsets(policyId, offsets) {
    try {
        await appDB.query(`START TRANSACTION`);

        // Delete existing offsets
        await appDB.query(`
            DELETE FROM reminder_policy_offsets WHERE policy_id = ?
        `, [policyId]);

        // Insert new offsets
        if (offsets && offsets.length > 0) {
            const values = offsets.map(offset => [
                policyId,
                offset.days_offset,
                offset.template_key,
                offset.active ? 1 : 0,
                offset.sort_order || 0
            ]);

            await appDB.query(`
                INSERT INTO reminder_policy_offsets (policy_id, days_offset, template_key, active, sort_order)
                VALUES ?
            `, [values]);
        }

        await appDB.query(`COMMIT`);
    } catch (error) {
        await appDB.query(`ROLLBACK`);
        console.error("Error replacing policy offsets:", error);
        throw error;
    }
}

/**
 * Get active offsets for a policy (for scheduling)
 * @param {number} policyId
 * @returns {Promise<Array>}
 */
export async function getActivePolicyOffsets(policyId) {
    try {
        const [offsets] = await appDB.query(`
            SELECT 
                days_offset,
                template_key
            FROM reminder_policy_offsets
            WHERE policy_id = ? AND active = 1
            ORDER BY sort_order ASC, days_offset ASC
        `, [policyId]);

        return offsets;
    } catch (error) {
        console.error("Error fetching active policy offsets:", error);
        throw error;
    }
}


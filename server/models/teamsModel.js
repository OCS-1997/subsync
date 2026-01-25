import appDB from "../db/subsyncDB.js";
import { getCurrentTime } from "../middlewares/time.js";
import { logActivity } from "./activityLogModel.js";

/**
 * Teams Model
 * Manages teams and user-team assignments
 */

// ==================== TEAMS CRUD ====================

/**
 * Create a new team
 * @param {Object} teamData - { team_name, description, team_lead_username, color }
 * @returns {Promise<number>} - team_id
 */
async function createTeam({ team_name, description, team_lead_username, color }) {
    try {
        if (!team_name) {
            throw new Error('Team name is required');
        }

        const currentTime = getCurrentTime();

        const [result] = await appDB.execute(
            `INSERT INTO teams (team_name, description, team_lead_username, color, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                team_name,
                description || null,
                team_lead_username || null,
                color || '#3b82f6',
                currentTime,
                currentTime
            ]
        );

        const teamId = result.insertId;

        // Log Activity
        if (team_lead_username) {
            await logActivity({
                username: team_lead_username,
                action: 'TEAM_CREATED_MODEL',
                resourceType: 'Team',
                resourceId: teamId.toString(),
                details: { team_name }
            });
        }

        return teamId;
    } catch (error) {
        console.error('Error creating team:', error);
        throw error;
    }
}

/**
 * Get all teams
 * @param {boolean} includeInactive - Include inactive teams
 * @returns {Promise<Array>} - List of teams with member counts
 */
async function getAllTeams(includeInactive = false) {
    try {
        const whereClause = includeInactive ? '' : 'WHERE t.is_active = 1';

        const [teams] = await appDB.query(
            `SELECT 
                t.*,
                u.name as team_lead_name
             FROM teams t
             LEFT JOIN users u ON t.team_lead_username = u.username
             ${whereClause}
             ORDER BY t.team_name ASC`
        );

        // Fetch members for all teams in one go (more efficient than loop)
        const [allMembers] = await appDB.query(
            `SELECT 
                ut.team_id,
                ut.user_id as username,
                u.name as user_name,
                u.email
             FROM user_teams ut
             JOIN users u ON ut.user_id = u.username
             ORDER BY u.name ASC`
        );

        // Map members to teams
        const teamsWithMembers = teams.map(team => ({
            ...team,
            members: allMembers.filter(m => m.team_id === team.id),
            member_count: allMembers.filter(m => m.team_id === team.id).length
        }));

        return teamsWithMembers;
    } catch (error) {
        console.error('Error fetching teams:', error);
        throw error;
    }
}

/**
 * Get team by ID with members
 * @param {number} teamId
 * @returns {Promise<Object|null>} - Team with members array
 */
async function getTeamById(teamId) {
    try {
        const [[team]] = await appDB.query(
            `SELECT 
                t.*,
                u.name as team_lead_name
             FROM teams t
             LEFT JOIN users u ON t.team_lead_username = u.username
             WHERE t.id = ?`,
            [teamId]
        );

        if (!team) return null;

        // Get team members
        const [members] = await appDB.query(
            `SELECT 
                ut.user_id,
                u.name as user_name,
                u.email,
                ut.assigned_at,
                ut.assigned_by,
                assigner.name as assigned_by_name
             FROM user_teams ut
             JOIN users u ON ut.user_id = u.username
             LEFT JOIN users assigner ON ut.assigned_by = assigner.username
             WHERE ut.team_id = ?
             ORDER BY u.name ASC`,
            [teamId]
        );

        team.members = members;
        return team;
    } catch (error) {
        console.error('Error fetching team by ID:', error);
        throw error;
    }
}

/**
 * Update team
 * @param {number} teamId
 * @param {Object} updates - { team_name, description, team_lead_username, color, is_active }
 * @returns {Promise<boolean>} - Success
 */
async function updateTeam(teamId, updates) {
    try {
        const { team_name, description, team_lead_username, color, is_active } = updates;

        const updateFields = [];
        const params = [];

        if (team_name !== undefined) {
            updateFields.push('team_name = ?');
            params.push(team_name);
        }
        if (description !== undefined) {
            updateFields.push('description = ?');
            params.push(description);
        }
        if (team_lead_username !== undefined) {
            updateFields.push('team_lead_username = ?');
            params.push(team_lead_username || null);
        }
        if (color !== undefined) {
            updateFields.push('color = ?');
            params.push(color);
        }
        if (is_active !== undefined) {
            updateFields.push('is_active = ?');
            params.push(is_active);
        }

        if (updateFields.length === 0) {
            return true; // No changes
        }

        updateFields.push('updated_at = ?');
        params.push(getCurrentTime());
        params.push(teamId);

        const [result] = await appDB.execute(
            `UPDATE teams SET ${updateFields.join(', ')} WHERE id = ?`,
            params
        );

        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error updating team:', error);
        throw error;
    }
}

/**
 * Delete team (soft delete)
 * @param {number} teamId
 * @returns {Promise<boolean>} - Success
 */
async function deleteTeam(teamId) {
    try {
        const [result] = await appDB.execute(
            'UPDATE teams SET is_active = 0, updated_at = ? WHERE id = ?',
            [getCurrentTime(), teamId]
        );

        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error deleting team:', error);
        throw error;
    }
}

// ==================== USER-TEAM ASSIGNMENTS ====================

/**
 * Assign user to team
 * @param {string} userId - username
 * @param {number} teamId
 * @param {string} assignedBy - username of assigner
 * @returns {Promise<boolean>} - Success
 */
async function assignUserToTeam(userId, teamId, assignedBy = null) {
    try {
        const currentTime = getCurrentTime();

        await appDB.execute(
            `INSERT INTO user_teams (user_id, team_id, assigned_at, assigned_by)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE assigned_at = ?, assigned_by = ?`,
            [userId, teamId, currentTime, assignedBy, currentTime, assignedBy]
        );

        // Log Activity
        if (assignedBy) {
            await logActivity({
                username: assignedBy,
                action: 'TEAM_USER_ASSIGNED',
                resourceType: 'Team',
                resourceId: teamId.toString(),
                details: { assigned_username: userId }
            });
        }

        return true;
    } catch (error) {
        console.error('Error assigning user to team:', error);
        throw error;
    }
}

/**
 * Remove user from team
 * @param {string} userId
 * @param {number} teamId
 * @param {string} removedBy
 * @returns {Promise<boolean>} - Success
 */
async function removeUserFromTeam(userId, teamId, removedBy = null) {
    try {
        const [result] = await appDB.execute(
            'DELETE FROM user_teams WHERE user_id = ? AND team_id = ?',
            [userId, teamId]
        );

        if (result.affectedRows > 0 && removedBy) {
            await logActivity({
                username: removedBy,
                action: 'TEAM_USER_REMOVED',
                resourceType: 'Team',
                resourceId: teamId.toString(),
                details: { removed_username: userId }
            });
        }

        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error removing user from team:', error);
        throw error;
    }
}

/**
 * Get all teams for a user
 * @param {string} userId
 * @returns {Promise<Array>} - List of teams
 */
async function getUserTeams(userId) {
    try {
        const [teams] = await appDB.query(
            `SELECT DISTINCT
                t.*,
                u.name as team_lead_name
             FROM teams t
             LEFT JOIN user_teams ut ON t.id = ut.team_id
             LEFT JOIN users u ON t.team_lead_username = u.username
             WHERE (ut.user_id = ? OR t.team_lead_username = ?)
             ORDER BY t.team_name ASC`,
            [userId, userId]
        );

        if (teams.length === 0) return [];

        // Fetch members for these specific teams
        const teamIds = teams.map(t => t.id);
        const [allMembers] = await appDB.query(
            `SELECT 
                ut.team_id,
                ut.user_id as username,
                u.name as user_name,
                u.email
             FROM user_teams ut
             JOIN users u ON ut.user_id = u.username
             WHERE ut.team_id IN (?)
             ORDER BY u.name ASC`,
            [teamIds]
        );

        // Map members to teams
        return teams.map(team => ({
            ...team,
            members: allMembers.filter(m => m.team_id === team.id)
        }));
    } catch (error) {
        console.error('Error fetching user teams:', error);
        throw error;
    }
}

/**
 * Get all members of a team
 * @param {number} teamId
 * @returns {Promise<Array>} - List of team members
 */
async function getTeamMembers(teamId) {
    try {
        const [members] = await appDB.query(
            `SELECT 
                ut.user_id,
                u.name as user_name,
                u.email,
                u.is_active as user_is_active,
                ut.assigned_at,
                ut.assigned_by,
                assigner.name as assigned_by_name
             FROM user_teams ut
             JOIN users u ON ut.user_id = u.username
             LEFT JOIN users assigner ON ut.assigned_by = assigner.username
             WHERE ut.team_id = ?
             ORDER BY u.name ASC`,
            [teamId]
        );

        return members;
    } catch (error) {
        console.error('Error fetching team members:', error);
        throw error;
    }
}

/**
 * Assign multiple users to a team at once
 * @param {number} teamId
 * @param {Array<string>} userIds - Array of usernames
 * @param {string} assignedBy
 * @returns {Promise<number>} - Number of assignments
 */
async function assignMultipleUsersToTeam(teamId, userIds, assignedBy = null) {
    try {
        if (!userIds || userIds.length === 0) {
            return 0;
        }

        const currentTime = getCurrentTime();
        const values = userIds.map(userId => [userId, teamId, currentTime, assignedBy]);

        const [result] = await appDB.query(
            `INSERT INTO user_teams (user_id, team_id, assigned_at, assigned_by)
             VALUES ?
             ON DUPLICATE KEY UPDATE assigned_at = VALUES(assigned_at), assigned_by = VALUES(assigned_by)`,
            [values]
        );

        const count = result.affectedRows;

        // Log Activity
        if (assignedBy) {
            await logActivity({
                username: assignedBy,
                action: 'TEAM_USERS_ASSIGNED',
                resourceType: 'Team',
                resourceId: teamId.toString(),
                details: { usernames: userIds, count }
            });
        }

        return count;
    } catch (error) {
        console.error('Error assigning multiple users to team:', error);
        throw error;
    }
}

/**
 * Assign a user to multiple teams at once
 * @param {string} userId - username
 * @param {Array<number>} teamIds - Array of team IDs
 * @param {string} assignedBy
 * @returns {Promise<number>} - Number of assignments
 */
async function assignUserToMultipleTeams(userId, teamIds, assignedBy = null) {
    try {
        if (!teamIds || teamIds.length === 0) {
            return 0;
        }

        const currentTime = getCurrentTime();
        const values = teamIds.map(teamId => [userId, teamId, currentTime, assignedBy]);

        const [result] = await appDB.query(
            `INSERT INTO user_teams (user_id, team_id, assigned_at, assigned_by)
             VALUES ?
             ON DUPLICATE KEY UPDATE assigned_at = VALUES(assigned_at), assigned_by = VALUES(assigned_by)`,
            [values]
        );

        const count = result.affectedRows;

        // Log Activity
        if (assignedBy) {
            await logActivity({
                username: assignedBy,
                action: 'TEAM_ASSIGNED_TO_MULTIPLE',
                resourceType: 'User',
                resourceId: userId,
                details: { teamIds, count }
            });
        }

        return count;
    } catch (error) {
        console.error('Error assigning user to multiple teams:', error);
        throw error;
    }
}

/**
 * Remove user from all teams
 * @param {string} userId
 * @param {string} removedBy
 * @returns {Promise<boolean>}
 */
async function removeUserFromAllTeams(userId, removedBy = null) {
    try {
        const [result] = await appDB.execute(
            'DELETE FROM user_teams WHERE user_id = ?',
            [userId]
        );

        if (result.affectedRows > 0 && removedBy) {
            await logActivity({
                username: removedBy,
                action: 'USER_REMOVED_FROM_ALL_TEAMS',
                resourceType: 'User',
                resourceId: userId,
                details: { removed_from_count: result.affectedRows }
            });
        }

        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error removing user from all teams:', error);
        throw error;
    }
}

// ==================== STATISTICS ====================

/**
 * Get team statistics (for admin analytics)
 * @param {number} teamId
 * @returns {Promise<Object>} - Team stats
 */
async function getTeamStats(teamId) {
    try {
        // Basic team info
        const team = await getTeamById(teamId);
        if (!team) return null;

        // Member count already included in team object

        // Additional stats can be added here (time tracking, DCRs, etc.)
        return {
            ...team,
            member_count: team.members.length
        };
    } catch (error) {
        console.error('Error fetching team stats:', error);
        throw error;
    }
}

export {
    // CRUD
    createTeam,
    getAllTeams,
    getTeamById,
    updateTeam,
    deleteTeam,
    // User assignments
    assignUserToTeam,
    removeUserFromTeam,
    getUserTeams,
    getTeamMembers,
    assignMultipleUsersToTeam,
    assignUserToMultipleTeams,
    removeUserFromAllTeams,
    // Stats
    getTeamStats
};

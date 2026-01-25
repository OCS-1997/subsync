import {
    createTeam,
    getAllTeams,
    getTeamById,
    updateTeam,
    deleteTeam,
    assignUserToTeam,
    removeUserFromTeam,
    getUserTeams,
    getTeamMembers,
    assignMultipleUsersToTeam,
    getTeamStats
} from '../models/teamsModel.js';
import { logActivity } from '../models/activityLogModel.js';
import { PERMISSIONS } from '../constants/permissions.js';

/**
 * Teams Controller
 * Handles team management and user-team assignments
 */

// ==================== TEAM CRUD ====================

/**
 * Create a new team
 * POST /teams
 */
export const createTeamController = async (req, res) => {
    try {
        const { team_name, description, team_lead_username, color, members } = req.body;

        if (!team_name) {
            return res.status(400).json({ error: 'Team name is required' });
        }

        const teamId = await createTeam({
            team_name,
            description,
            team_lead_username,
            color
        });

        // Assign initial members if provided
        if (members && Array.isArray(members) && members.length > 0) {
            const assignedBy = req.user.username;
            await assignMultipleUsersToTeam(teamId, members, assignedBy);
        }

        // Log Activity
        await logActivity({
            username: req.user.username,
            action: 'TEAM_CREATED',
            resourceType: 'Team',
            resourceId: teamId.toString(),
            ipAddress: req.ip,
            details: { team_name, team_lead_username }
        });

        return res.status(201).json({
            success: true,
            message: 'Team created successfully',
            teamId
        });
    } catch (error) {
        console.error('Error in createTeamController:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Team name already exists' });
        }
        
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Get all teams
 * GET /teams?includeInactive=false
 */
export const getAllTeamsController = async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const teams = await getAllTeams(includeInactive);

        return res.status(200).json({ teams });
    } catch (error) {
        console.error('Error in getAllTeamsController:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Get team by ID
 * GET /teams/:id
 */
export const getTeamByIdController = async (req, res) => {
    try {
        const teamId = parseInt(req.params.id);

        if (isNaN(teamId)) {
            return res.status(400).json({ error: 'Invalid team ID' });
        }

        const team = await getTeamById(teamId);

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        return res.status(200).json({ team });
    } catch (error) {
        console.error('Error in getTeamByIdController:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Update team
 * PUT /teams/:id
 */
export const updateTeamController = async (req, res) => {
    try {
        const teamId = parseInt(req.params.id);

        if (isNaN(teamId)) {
            return res.status(400).json({ error: 'Invalid team ID' });
        }

        const { team_name, description, team_lead_username, color, is_active } = req.body;

        const success = await updateTeam(teamId, {
            team_name,
            description,
            team_lead_username,
            color,
            is_active
        });

        if (!success) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Log Activity
        await logActivity({
            username: req.user.username,
            action: 'TEAM_UPDATED',
            resourceType: 'Team',
            resourceId: teamId.toString(),
            ipAddress: req.ip,
            details: { team_name, team_lead_username, is_active }
        });

        return res.status(200).json({
            success: true,
            message: 'Team updated successfully'
        });
    } catch (error) {
        console.error('Error in updateTeamController:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Team name already exists' });
        }
        
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Delete team (soft delete)
 * DELETE /teams/:id
 */
export const deleteTeamController = async (req, res) => {
    try {
        const teamId = parseInt(req.params.id);

        if (isNaN(teamId)) {
            return res.status(400).json({ error: 'Invalid team ID' });
        }

        const success = await deleteTeam(teamId);

        if (!success) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Log Activity
        await logActivity({
            username: req.user.username,
            action: 'TEAM_DELETED',
            resourceType: 'Team',
            resourceId: teamId.toString(),
            ipAddress: req.ip
        });

        return res.status(200).json({
            success: true,
            message: 'Team deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteTeamController:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ==================== USER-TEAM ASSIGNMENTS ====================

/**
 * Assign user to team
 * POST /teams/:id/members
 * Body: { username } or { usernames: [...] }
 */
export const assignUserToTeamController = async (req, res) => {
    try {
        const teamId = parseInt(req.params.id);

        if (isNaN(teamId)) {
            return res.status(400).json({ error: 'Invalid team ID' });
        }

        const { username, usernames } = req.body;
        const assignedBy = req.user.username;

        // Handle bulk assignment
        if (usernames && Array.isArray(usernames)) {
            const count = await assignMultipleUsersToTeam(teamId, usernames, assignedBy);
            
            // Log Activity
            await logActivity({
                username: req.user.username,
                action: 'TEAM_USERS_ASSIGNED',
                resourceType: 'Team',
                resourceId: teamId.toString(),
                ipAddress: req.ip,
                details: { usernames, count }
            });

            return res.status(200).json({
                success: true,
                message: `${count} users assigned to team`,
                count
            });
        }

        // Handle single assignment
        if (!username) {
            return res.status(400).json({ error: 'username or usernames is required' });
        }

        await assignUserToTeam(username, teamId, assignedBy);

        // Log Activity
        await logActivity({
            username: req.user.username,
            action: 'TEAM_USER_ASSIGNED',
            resourceType: 'Team',
            resourceId: teamId.toString(),
            ipAddress: req.ip,
            details: { assigned_username: username }
        });

        return res.status(200).json({
            success: true,
            message: 'User assigned to team successfully'
        });
    } catch (error) {
        console.error('Error in assignUserToTeamController:', error);
        
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(404).json({ error: 'Team or user not found' });
        }
        
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Remove user from team
 * DELETE /teams/:id/members/:userId
 */
export const removeUserFromTeamController = async (req, res) => {
    try {
        const teamId = parseInt(req.params.id);
        const userId = req.params.userId;

        if (isNaN(teamId)) {
            return res.status(400).json({ error: 'Invalid team ID' });
        }

        const success = await removeUserFromTeam(userId, teamId, req.user?.username);

        if (!success) {
            return res.status(404).json({ error: 'User not in this team' });
        }

        // Log Activity
        await logActivity({
            username: req.user.username,
            action: 'TEAM_USER_REMOVED',
            resourceType: 'Team',
            resourceId: teamId.toString(),
            ipAddress: req.ip,
            details: { removed_username: userId }
        });

        return res.status(200).json({
            success: true,
            message: 'User removed from team successfully'
        });
    } catch (error) {
        console.error('Error in removeUserFromTeamController:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Get user's teams
 * GET /users/:username/teams
 */
export const getUserTeamsController = async (req, res) => {
    try {
        const username = req.params.username;
        const isSelfView = req.user.username === username;

        // Allow users to view their own teams, or users with TEAMS_VIEW permission to view any user's teams
        if (!isSelfView && !req.user.permissions?.includes(PERMISSIONS.TEAMS_VIEW) && req.user.roleKey !== 'admin') {
            return res.status(403).json({ error: 'Insufficient permission to view other users\' teams' });
        }

        const teams = await getUserTeams(username);
        return res.status(200).json({ teams });
    } catch (error) {
        console.error('Error in getUserTeamsController:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Get team members
 * GET /teams/:id/members
 */
export const getTeamMembersController = async (req, res) => {
    try {
        const teamId = parseInt(req.params.id);

        if (isNaN(teamId)) {
            return res.status(400).json({ error: 'Invalid team ID' });
        }

        const members = await getTeamMembers(teamId);

        return res.status(200).json({ members });
    } catch (error) {
        console.error('Error in getTeamMembersController:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Get team statistics
 * GET /teams/:id/stats
 */
export const getTeamStatsController = async (req, res) => {
    try {
        const teamId = parseInt(req.params.id);

        if (isNaN(teamId)) {
            return res.status(400).json({ error: 'Invalid team ID' });
        }

        const stats = await getTeamStats(teamId);

        if (!stats) {
            return res.status(404).json({ error: 'Team not found' });
        }

        return res.status(200).json({ stats });
    } catch (error) {
        console.error('Error in getTeamStatsController:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

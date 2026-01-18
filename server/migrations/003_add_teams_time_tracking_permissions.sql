-- Migration: Add Teams and Time Tracking Permissions
-- File: 003_add_teams_time_tracking_permissions.sql
-- Run: Execute in MySQL/MariaDB after creating permissions table

-- Insert Teams permissions
INSERT INTO permissions (permission_key, resource, action, description, created_at) VALUES
('teams.view', 'teams', 'view', 'View teams', NOW()),
('teams.manage', 'teams', 'manage', 'Manage teams (create, update, delete, assign users)', NOW())
ON DUPLICATE KEY UPDATE permission_key=permission_key;

-- Insert Time Tracking permissions
INSERT INTO permissions (permission_key, resource, action, description, created_at) VALUES
('time-tracking.view', 'time-tracking', 'view', 'View own time tracking entries', NOW()),
('time-tracking.use', 'time-tracking', 'use', 'Create and manage own time entries and timers', NOW()),
('time-tracking.view-team', 'time-tracking', 'view-team', 'View team time tracking data', NOW()),
('time-tracking.manage', 'time-tracking', 'manage', 'Manage time tracking settings and activity types (admin)', NOW())
ON DUPLICATE KEY UPDATE permission_key=permission_key;

-- Assign permissions to Admin role (role_id = 1, adjust if different)
-- Get permission IDs and assign to admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions WHERE permission_key IN (
    'teams.view',
    'teams.manage',
    'time-tracking.view',
    'time-tracking.use',
    'time-tracking.view-team',
    'time-tracking.manage'
)
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Assign basic permissions to Manager role (role_id = 2, adjust if different)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE permission_key IN (
    'teams.view',
    'teams.manage',
    'time-tracking.view',
    'time-tracking.use',
    'time-tracking.view-team'
)
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Assign basic permissions to Sales/Support roles (role_id = 3,4, adjust if different)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE permission_key IN (
    'teams.view',
    'time-tracking.view',
    'time-tracking.use'
)
ON DUPLICATE KEY UPDATE role_id=role_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE permission_key IN (
    'teams.view',
    'time-tracking.view',
    'time-tracking.use'
)
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Note: The permissions are also defined in server/constants/permissions.js
-- Make sure both are in sync!

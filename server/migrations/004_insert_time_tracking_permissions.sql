-- Add Time Tracking Permissions to permissions table
-- This SQL file adds the necessary permissions for the time tracking module

-- Insert time tracking permissions
INSERT INTO permissions (permission_key, resource, action, description) VALUES
('time-tracking.view', 'time-tracking', 'view', 'View own time tracking entries'),
('time-tracking.use', 'time-tracking', 'use', 'Create and manage own time entries and timers'),
('time-tracking.view-team', 'time-tracking', 'view-team', 'View team time tracking data'),
('time-tracking.manage', 'time-tracking', 'manage', 'Manage time tracking settings and activity types (admin)')
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- Get permission IDs for assignment (you'll need to replace these with actual IDs from your permissions table)
-- Run this query first to get the permission IDs:
-- SELECT id, permission_key FROM permissions WHERE permission_key LIKE 'time-tracking.%';

-- Then manually assign permissions to roles using role_permissions table, or run queries like:
-- Assuming roles: admin=1, manager=2, sales=3, support=4, viewer=5

-- Admin gets all time tracking permissions
-- INSERT INTO role_permissions (role_id, permission_id)
-- SELECT 1, id FROM permissions WHERE permission_key IN (
--     'time-tracking.view', 'time-tracking.use', 'time-tracking.view-team', 'time-tracking.manage'
-- );

-- Manager gets view, use, and view-team
-- INSERT INTO role_permissions (role_id, permission_id)
-- SELECT 2, id FROM permissions WHERE permission_key IN (
--     'time-tracking.view', 'time-tracking.use', 'time-tracking.view-team'
-- );

-- Sales and Support get view and use
-- INSERT INTO role_permissions (role_id, permission_id)
-- SELECT 3, id FROM permissions WHERE permission_key IN (
--     'time-tracking.view', 'time-tracking.use'
-- );

-- INSERT INTO role_permissions (role_id, permission_id)
-- SELECT 4, id FROM permissions WHERE permission_key IN (
--     'time-tracking.view', 'time-tracking.use'
-- );

-- Viewer gets view only
-- INSERT INTO role_permissions (role_id, permission_id)
-- SELECT 5, id FROM permissions WHERE permission_key IN (
--     'time-tracking.view'
-- );

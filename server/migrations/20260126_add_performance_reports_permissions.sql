-- Migration: Add Performance Reports Permissions
-- File: 20260126_add_performance_reports_permissions.sql
-- Run: Execute in MySQL/MariaDB

-- Insert new permissions
INSERT INTO permissions (permission_key, resource, action, description) VALUES
('performance_reports.view', 'performance_reports', 'view', 'View own performance report'),
('performance_reports.view_team', 'performance_reports', 'view_team', 'View team performance reports'),
('performance_reports.view_all', 'performance_reports', 'view_all', 'View all user performance reports')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Assign permissions to roles
-- Admin gets everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p 
WHERE r.role_key = 'admin' AND p.permission_key IN ('performance_reports.view', 'performance_reports.view_team', 'performance_reports.view_all')
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Manager gets view own and view team
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p 
WHERE r.role_key = 'manager' AND p.permission_key IN ('performance_reports.view', 'performance_reports.view_team')
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Sales gets view own
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p 
WHERE r.role_key = 'sales' AND p.permission_key IN ('performance_reports.view')
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Support gets view own
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p 
WHERE r.role_key = 'support' AND p.permission_key IN ('performance_reports.view')
ON DUPLICATE KEY UPDATE role_id = role_id;

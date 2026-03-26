-- Migration: Add Leaves and Permissions RBAC
-- File: 20260325_add_leaves_and_permissions_rbac.sql

START TRANSACTION;

-- 1. Add new permissions
INSERT IGNORE INTO permissions (permission_key, resource, action, description) VALUES
('leaves.view', 'leaves', 'view', 'View leave requests'),
('leaves.apply', 'leaves', 'apply', 'Apply for leave'),
('leaves.approve', 'leaves', 'approve', 'Approve/Reject leave requests'),
('leaves.manage_types', 'leaves', 'manage_types', 'Configure leave types and policy'),
('permissions.apply', 'permissions', 'apply', 'Apply for short permissions'),
('permissions.approve', 'permissions', 'approve', 'Approve/Reject short permissions'),
('holidays.manage', 'holidays', 'manage', 'Manage holiday calendar'),
('leaves.view_all', 'leaves', 'view_all', 'View leave requests of all employees');

-- 2. Assign permissions to Admin (All)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_key = 'admin' AND p.resource IN ('leaves', 'permissions', 'holidays');

-- 3. Assign permissions to Manager
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key IN (
    'leaves.view',
    'leaves.apply',
    'leaves.approve',
    'leaves.view_all',
    'permissions.apply',
    'permissions.approve'
)
WHERE r.role_key = 'manager';

-- 4. Assign permissions to Standard Roles (Sales, Support, Viewer)
-- Note: They can apply for leaves but only view their own (logic handled in controller)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key IN (
    'leaves.view',
    'leaves.apply',
    'permissions.apply'
)
WHERE r.role_key IN ('sales', 'support', 'viewer');

COMMIT;

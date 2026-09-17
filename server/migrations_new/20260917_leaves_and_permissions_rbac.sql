-- Migration: Ensure Leaves and Permissions RBAC in production
-- File: 20260917_leaves_and_permissions_rbac.sql

START TRANSACTION;

-- 1. Add new permissions for leaves and permissions modules
INSERT IGNORE INTO permissions (permission_key, resource, action, description) VALUES
('leaves.view', 'leaves', 'view', 'View leave requests and balances'),
('leaves.apply', 'leaves', 'apply', 'Apply for leaves'),
('leaves.approve', 'leaves', 'approve', 'Approve/Reject leave requests'),
('leaves.manage_types', 'leaves', 'manage_types', 'Configure leave types and policies'),
('permissions.apply', 'permissions', 'apply', 'Apply for short permissions'),
('permissions.approve', 'permissions', 'approve', 'Approve/Reject short permissions'),
('holidays.manage', 'holidays', 'manage', 'Manage holiday calendar'),
('leaves.view_all', 'leaves', 'view_all', 'View leave requests of all employees');

-- 2. Assign all leave & permission rights to Admin role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_key = 'admin' AND p.resource IN ('leaves', 'permissions', 'holidays');

-- 3. Assign manager approval & application rights
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

-- 4. Assign base application & view rights to all standard roles (sales, support, viewer, intern, etc.)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key IN (
    'leaves.view',
    'leaves.apply',
    'permissions.apply'
)
WHERE r.role_key IN ('sales', 'support', 'viewer', 'intern');

COMMIT;

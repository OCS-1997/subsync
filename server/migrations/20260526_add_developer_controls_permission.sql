START TRANSACTION;

-- Insert Developer Controls permission
INSERT INTO permissions (permission_key, resource, action, description) VALUES
('developer_controls.manage', 'developer_controls', 'manage', 'Access developer test controls and system triggers');

-- Assign to Admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key = 'developer_controls.manage'
WHERE r.role_key = 'admin';

COMMIT;

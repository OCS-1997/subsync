START TRANSACTION;

-- Insert DCR permissions
INSERT INTO permissions (permission_key, resource, action, description) VALUES
('dcr.view', 'dcr', 'view', 'View DCR entries'),
('dcr.create', 'dcr', 'create', 'Create DCR entries'),
('dcr.update', 'dcr', 'update', 'Update DCR entries'),
('dcr.delete', 'dcr', 'delete', 'Delete DCR entries');

-- Assign DCR permissions to roles
-- Admin gets all permissions (already handled by admin role having all permissions)
-- Manager gets view, create, update
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key IN ('dcr.view', 'dcr.create', 'dcr.update')
WHERE r.role_key = 'manager';

-- Sales gets view, create, update
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key IN ('dcr.view', 'dcr.create', 'dcr.update')
WHERE r.role_key = 'sales';

-- Support gets view, create
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key IN ('dcr.view', 'dcr.create')
WHERE r.role_key = 'support';

-- Viewer gets view only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key = 'dcr.view'
WHERE r.role_key = 'viewer';

COMMIT;



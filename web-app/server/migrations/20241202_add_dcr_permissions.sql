START TRANSACTION;

-- Insert DCR permissions
INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'dcr.view', 'dcr', 'view', 'View DCR entries'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'dcr.view');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'dcr.create', 'dcr', 'create', 'Create DCR entries'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'dcr.create');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'dcr.update', 'dcr', 'update', 'Update DCR entries'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'dcr.update');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'dcr.delete', 'dcr', 'delete', 'Delete DCR entries'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'dcr.delete');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'dcr.send_report', 'dcr', 'send_report', 'Send DCR daily reports'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'dcr.send_report');

-- Assign DCR permissions to roles
-- Admin gets all permissions (already handled by CROSS JOIN in main migration)

-- Manager permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key IN (
    'dcr.view',
    'dcr.create',
    'dcr.update',
    'dcr.send_report'
)
WHERE r.role_key = 'manager';

-- Sales permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key IN (
    'dcr.view',
    'dcr.create',
    'dcr.update'
)
WHERE r.role_key = 'sales';

-- Support permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key IN (
    'dcr.view',
    'dcr.create',
    'dcr.update'
)
WHERE r.role_key = 'support';

-- Viewer gets view only
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key = 'dcr.view'
WHERE r.role_key = 'viewer';

COMMIT;


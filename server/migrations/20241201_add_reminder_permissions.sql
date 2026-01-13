START TRANSACTION;

-- Add reminder policy permissions
INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'reminder_policies.view', 'reminder_policies', 'view', 'View reminder policies'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'reminder_policies.view');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'reminder_policies.create', 'reminder_policies', 'create', 'Create reminder policies'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'reminder_policies.create');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'reminder_policies.update', 'reminder_policies', 'update', 'Update reminder policies'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'reminder_policies.update');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'reminder_policies.delete', 'reminder_policies', 'delete', 'Delete reminder policies'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'reminder_policies.delete');

-- Add email template permissions
INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'email_templates.view', 'email_templates', 'view', 'View email templates'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'email_templates.view');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'email_templates.create', 'email_templates', 'create', 'Create email templates'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'email_templates.create');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'email_templates.update', 'email_templates', 'update', 'Update email templates'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'email_templates.update');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'email_templates.delete', 'email_templates', 'delete', 'Delete email templates'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'email_templates.delete');

-- Add notification logs permission
INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'notification_logs.view', 'notification_logs', 'view', 'View notification logs'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'notification_logs.view');

-- Assign new permissions to admin role (all permissions)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_key = 'admin'
AND p.permission_key IN (
    'reminder_policies.view', 'reminder_policies.create', 'reminder_policies.update', 'reminder_policies.delete',
    'email_templates.view', 'email_templates.create', 'email_templates.update', 'email_templates.delete',
    'notification_logs.view'
);

-- Assign reminder and notification permissions to manager role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key IN (
    'reminder_policies.view', 'reminder_policies.create', 'reminder_policies.update',
    'email_templates.view', 'email_templates.create', 'email_templates.update',
    'notification_logs.view'
)
WHERE r.role_key = 'manager';

COMMIT;


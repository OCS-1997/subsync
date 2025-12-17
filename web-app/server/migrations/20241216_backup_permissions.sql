-- =============================================
-- Backup System Permissions Migration
-- Created: 2024-12-16
-- Description: Add RBAC permissions for backup system
-- =============================================

-- Add backup permissions
INSERT INTO permissions (permission_key, resource, action, description) VALUES
('backups.view', 'backups', 'view', 'View backup configurations and history'),
('backups.create', 'backups', 'create', 'Create backup configurations'),
('backups.update', 'backups', 'update', 'Update backup configurations'),
('backups.delete', 'backups', 'delete', 'Delete backup configurations'),
('backups.trigger', 'backups', 'trigger', 'Manually trigger backups'),
('backups.restore', 'backups', 'restore', 'Restore from backups (CRITICAL - Admin only)'),
('backups.download', 'backups', 'download', 'Download backup files');

-- Grant all backup permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_key = 'admin'
  AND p.permission_key LIKE 'backups.%';

-- Grant selective permissions to manager role (no restore)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key IN (
    'backups.view',
    'backups.create',
    'backups.update',
    'backups.trigger',
    'backups.download'
)
WHERE r.role_key = 'manager';

-- Grant view-only permission to other roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key = 'backups.view'
WHERE r.role_key IN ('sales', 'support', 'viewer');

-- Success message
SELECT 'Backup permissions added successfully!' as status;
SELECT COUNT(*) as total_backup_permissions FROM permissions WHERE permission_key LIKE 'backups.%';

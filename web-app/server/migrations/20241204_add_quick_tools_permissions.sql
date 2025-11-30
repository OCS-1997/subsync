START TRANSACTION;

-- Add Quick Tools permissions
INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'quick_tools.view', 'quick_tools', 'view', 'View and use quick tools widget'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'quick_tools.view')
UNION ALL
SELECT 'quick_tools.manage', 'quick_tools', 'manage', 'Manage quick tools (admin only)'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'quick_tools.manage');

-- Get permission IDs
SET @view_perm_id = (SELECT id FROM permissions WHERE permission_key = 'quick_tools.view');
SET @manage_perm_id = (SELECT id FROM permissions WHERE permission_key = 'quick_tools.manage');

-- Assign to admin role (all permissions)
SET @admin_role_id = (SELECT id FROM roles WHERE role_key = 'admin');
INSERT INTO role_permissions (role_id, permission_id)
SELECT @admin_role_id, @view_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @admin_role_id AND permission_id = @view_perm_id);
INSERT INTO role_permissions (role_id, permission_id)
SELECT @admin_role_id, @manage_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @admin_role_id AND permission_id = @manage_perm_id);

-- Assign view permission to other roles
SET @manager_role_id = (SELECT id FROM roles WHERE role_key = 'manager');
SET @sales_role_id = (SELECT id FROM roles WHERE role_key = 'sales');
SET @support_role_id = (SELECT id FROM roles WHERE role_key = 'support');
SET @viewer_role_id = (SELECT id FROM roles WHERE role_key = 'viewer');

INSERT INTO role_permissions (role_id, permission_id)
SELECT @manager_role_id, @view_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @manager_role_id AND permission_id = @view_perm_id)
UNION ALL
SELECT @sales_role_id, @view_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @sales_role_id AND permission_id = @view_perm_id)
UNION ALL
SELECT @support_role_id, @view_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @support_role_id AND permission_id = @view_perm_id)
UNION ALL
SELECT @viewer_role_id, @view_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @viewer_role_id AND permission_id = @view_perm_id);

COMMIT;


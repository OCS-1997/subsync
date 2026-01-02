START TRANSACTION;

-- Add Opportunity permissions
INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'opportunities.view', 'opportunities', 'view', 'View opportunities'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'opportunities.view')
UNION ALL
SELECT 'opportunities.create', 'opportunities', 'create', 'Create opportunities'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'opportunities.create')
UNION ALL
SELECT 'opportunities.update', 'opportunities', 'update', 'Update opportunities'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'opportunities.update')
UNION ALL
SELECT 'opportunities.delete', 'opportunities', 'delete', 'Delete opportunities'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'opportunities.delete')
UNION ALL
SELECT 'opportunities.manage_statuses', 'opportunities', 'manage', 'Manage opportunity statuses'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'opportunities.manage_statuses');

-- Get permission IDs
SET @view_perm_id = (SELECT id FROM permissions WHERE permission_key = 'opportunities.view');
SET @create_perm_id = (SELECT id FROM permissions WHERE permission_key = 'opportunities.create');
SET @update_perm_id = (SELECT id FROM permissions WHERE permission_key = 'opportunities.update');
SET @delete_perm_id = (SELECT id FROM permissions WHERE permission_key = 'opportunities.delete');
SET @manage_status_perm_id = (SELECT id FROM permissions WHERE permission_key = 'opportunities.manage_statuses');

-- Get role IDs
SET @admin_role_id = (SELECT id FROM roles WHERE role_key = 'admin');
SET @manager_role_id = (SELECT id FROM roles WHERE role_key = 'manager');
SET @sales_role_id = (SELECT id FROM roles WHERE role_key = 'sales');
SET @support_role_id = (SELECT id FROM roles WHERE role_key = 'support');
SET @viewer_role_id = (SELECT id FROM roles WHERE role_key = 'viewer');

-- Assign all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT @admin_role_id, @view_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @admin_role_id AND permission_id = @view_perm_id)
UNION ALL
SELECT @admin_role_id, @create_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @admin_role_id AND permission_id = @create_perm_id)
UNION ALL
SELECT @admin_role_id, @update_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @admin_role_id AND permission_id = @update_perm_id)
UNION ALL
SELECT @admin_role_id, @delete_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @admin_role_id AND permission_id = @delete_perm_id)
UNION ALL
SELECT @admin_role_id, @manage_status_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @admin_role_id AND permission_id = @manage_status_perm_id);

-- Assign permissions to manager role
INSERT INTO role_permissions (role_id, permission_id)
SELECT @manager_role_id, @view_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @manager_role_id AND permission_id = @view_perm_id)
UNION ALL
SELECT @manager_role_id, @create_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @manager_role_id AND permission_id = @create_perm_id)
UNION ALL
SELECT @manager_role_id, @update_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @manager_role_id AND permission_id = @update_perm_id)
UNION ALL
SELECT @manager_role_id, @manage_status_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @manager_role_id AND permission_id = @manage_status_perm_id);

-- Assign permissions to sales role
INSERT INTO role_permissions (role_id, permission_id)
SELECT @sales_role_id, @view_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @sales_role_id AND permission_id = @view_perm_id)
UNION ALL
SELECT @sales_role_id, @create_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @sales_role_id AND permission_id = @create_perm_id)
UNION ALL
SELECT @sales_role_id, @update_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @sales_role_id AND permission_id = @update_perm_id);

-- Assign view permission to support and viewer roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT @support_role_id, @view_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @support_role_id AND permission_id = @view_perm_id)
UNION ALL
SELECT @viewer_role_id, @view_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @viewer_role_id AND permission_id = @view_perm_id);

COMMIT;

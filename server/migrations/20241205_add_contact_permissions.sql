START TRANSACTION;

-- Add Contact permissions
INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'contacts.view', 'contacts', 'view', 'View contacts'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'contacts.view')
UNION ALL
SELECT 'contacts.create', 'contacts', 'create', 'Create contacts'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'contacts.create')
UNION ALL
SELECT 'contacts.update', 'contacts', 'update', 'Update contacts'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'contacts.update')
UNION ALL
SELECT 'contacts.delete', 'contacts', 'delete', 'Delete contacts'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'contacts.delete');

-- Get permission IDs
SET @view_perm_id = (SELECT id FROM permissions WHERE permission_key = 'contacts.view');
SET @create_perm_id = (SELECT id FROM permissions WHERE permission_key = 'contacts.create');
SET @update_perm_id = (SELECT id FROM permissions WHERE permission_key = 'contacts.update');
SET @delete_perm_id = (SELECT id FROM permissions WHERE permission_key = 'contacts.delete');

-- Get role IDs
SET @admin_role_id = (SELECT id FROM roles WHERE role_key = 'admin');
SET @manager_role_id = (SELECT id FROM roles WHERE role_key = 'manager');
SET @sales_role_id = (SELECT id FROM roles WHERE role_key = 'sales');
SET @support_role_id = (SELECT id FROM roles WHERE role_key = 'support');
SET @viewer_role_id = (SELECT id FROM roles WHERE role_key = 'viewer');

-- Assign all contact permissions to admin role
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
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @admin_role_id AND permission_id = @delete_perm_id);

-- Assign view, create, and update permissions to manager role
INSERT INTO role_permissions (role_id, permission_id)
SELECT @manager_role_id, @view_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @manager_role_id AND permission_id = @view_perm_id)
UNION ALL
SELECT @manager_role_id, @create_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @manager_role_id AND permission_id = @create_perm_id)
UNION ALL
SELECT @manager_role_id, @update_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @manager_role_id AND permission_id = @update_perm_id);

-- Assign view, create, and update permissions to sales role
INSERT INTO role_permissions (role_id, permission_id)
SELECT @sales_role_id, @view_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @sales_role_id AND permission_id = @view_perm_id)
UNION ALL
SELECT @sales_role_id, @create_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @sales_role_id AND permission_id = @create_perm_id)
UNION ALL
SELECT @sales_role_id, @update_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @sales_role_id AND permission_id = @update_perm_id);

-- Assign only view permission to support and viewer roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT @support_role_id, @view_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @support_role_id AND permission_id = @view_perm_id)
UNION ALL
SELECT @viewer_role_id, @view_perm_id
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @viewer_role_id AND permission_id = @view_perm_id);

COMMIT;

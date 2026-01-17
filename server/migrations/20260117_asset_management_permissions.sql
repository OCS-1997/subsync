-- Asset Management Permissions Migration
-- Run this migration to add asset management permissions

START TRANSACTION;

-- =============================================
-- Add Asset permissions to permissions table
-- =============================================
INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'assets.view', 'assets', 'view', 'View assets'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'assets.view')
UNION ALL
SELECT 'assets.create', 'assets', 'create', 'Create assets'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'assets.create')
UNION ALL
SELECT 'assets.update', 'assets', 'update', 'Update assets'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'assets.update')
UNION ALL
SELECT 'assets.delete', 'assets', 'delete', 'Delete assets'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'assets.delete')
UNION ALL
SELECT 'assets.assign', 'assets', 'assign', 'Assign/unassign assets to users'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'assets.assign')
UNION ALL
SELECT 'assets.manage_categories', 'assets', 'manage_categories', 'Manage asset categories and types'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'assets.manage_categories');

-- =============================================
-- Get permission IDs
-- =============================================
SET @view_perm_id = (SELECT id FROM permissions WHERE permission_key = 'assets.view');
SET @create_perm_id = (SELECT id FROM permissions WHERE permission_key = 'assets.create');
SET @update_perm_id = (SELECT id FROM permissions WHERE permission_key = 'assets.update');
SET @delete_perm_id = (SELECT id FROM permissions WHERE permission_key = 'assets.delete');
SET @assign_perm_id = (SELECT id FROM permissions WHERE permission_key = 'assets.assign');
SET @manage_cat_perm_id = (SELECT id FROM permissions WHERE permission_key = 'assets.manage_categories');

-- =============================================
-- Get role IDs
-- =============================================
SET @admin_role_id = (SELECT id FROM roles WHERE role_key = 'admin');
SET @manager_role_id = (SELECT id FROM roles WHERE role_key = 'manager');
SET @sales_role_id = (SELECT id FROM roles WHERE role_key = 'sales');
SET @support_role_id = (SELECT id FROM roles WHERE role_key = 'support');
SET @viewer_role_id = (SELECT id FROM roles WHERE role_key = 'viewer');

-- =============================================
-- Assign ALL permissions to admin role
-- =============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT @admin_role_id, @view_perm_id
WHERE @admin_role_id IS NOT NULL AND @view_perm_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @admin_role_id AND permission_id = @view_perm_id)
UNION ALL
SELECT @admin_role_id, @create_perm_id
WHERE @admin_role_id IS NOT NULL AND @create_perm_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @admin_role_id AND permission_id = @create_perm_id)
UNION ALL
SELECT @admin_role_id, @update_perm_id
WHERE @admin_role_id IS NOT NULL AND @update_perm_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @admin_role_id AND permission_id = @update_perm_id)
UNION ALL
SELECT @admin_role_id, @delete_perm_id
WHERE @admin_role_id IS NOT NULL AND @delete_perm_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @admin_role_id AND permission_id = @delete_perm_id)
UNION ALL
SELECT @admin_role_id, @assign_perm_id
WHERE @admin_role_id IS NOT NULL AND @assign_perm_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @admin_role_id AND permission_id = @assign_perm_id)
UNION ALL
SELECT @admin_role_id, @manage_cat_perm_id
WHERE @admin_role_id IS NOT NULL AND @manage_cat_perm_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @admin_role_id AND permission_id = @manage_cat_perm_id);

-- =============================================
-- Assign permissions to manager role (view, create, update, assign, manage_categories)
-- =============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT @manager_role_id, @view_perm_id
WHERE @manager_role_id IS NOT NULL AND @view_perm_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @manager_role_id AND permission_id = @view_perm_id)
UNION ALL
SELECT @manager_role_id, @create_perm_id
WHERE @manager_role_id IS NOT NULL AND @create_perm_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @manager_role_id AND permission_id = @create_perm_id)
UNION ALL
SELECT @manager_role_id, @update_perm_id
WHERE @manager_role_id IS NOT NULL AND @update_perm_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @manager_role_id AND permission_id = @update_perm_id)
UNION ALL
SELECT @manager_role_id, @assign_perm_id
WHERE @manager_role_id IS NOT NULL AND @assign_perm_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @manager_role_id AND permission_id = @assign_perm_id)
UNION ALL
SELECT @manager_role_id, @manage_cat_perm_id
WHERE @manager_role_id IS NOT NULL AND @manage_cat_perm_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @manager_role_id AND permission_id = @manage_cat_perm_id);

-- =============================================
-- Assign permissions to support role (view, assign)
-- =============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT @support_role_id, @view_perm_id
WHERE @support_role_id IS NOT NULL AND @view_perm_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @support_role_id AND permission_id = @view_perm_id)
UNION ALL
SELECT @support_role_id, @assign_perm_id
WHERE @support_role_id IS NOT NULL AND @assign_perm_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @support_role_id AND permission_id = @assign_perm_id);

-- =============================================
-- Assign view permission to viewer role
-- =============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT @viewer_role_id, @view_perm_id
WHERE @viewer_role_id IS NOT NULL AND @view_perm_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = @viewer_role_id AND permission_id = @view_perm_id);

COMMIT;

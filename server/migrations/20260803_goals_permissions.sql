START TRANSACTION;

-- Add Goal Permissions
INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'goals.view', 'goals', 'view', 'View Goals Module'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'goals.view')
UNION ALL
SELECT 'goals.create', 'goals', 'create', 'Create Goals'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'goals.create')
UNION ALL
SELECT 'goals.edit', 'goals', 'edit', 'Edit Goals'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'goals.edit')
UNION ALL
SELECT 'goals.delete', 'goals', 'delete', 'Delete Goals'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'goals.delete')
UNION ALL
SELECT 'goals.export', 'goals', 'export', 'Export Goals Report'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'goals.export')
UNION ALL
SELECT 'goals.assign', 'goals', 'assign', 'Assign Goal Owners'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'goals.assign')
UNION ALL
SELECT 'goals.change_status', 'goals', 'change_status', 'Change Goal Status & Progress'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'goals.change_status')
UNION ALL
SELECT 'goals.configure_categories', 'goals', 'configure_categories', 'Configure Goal Categories'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'goals.configure_categories')
UNION ALL
SELECT 'goals.configure_status', 'goals', 'configure_status', 'Configure Goal Statuses'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'goals.configure_status')
UNION ALL
SELECT 'goals.configure_business_impact', 'goals', 'configure_business_impact', 'Configure Goal Business Impact'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'goals.configure_business_impact');

-- Assign all permissions to Admin and Manager roles
SET @admin_role_id = (SELECT id FROM roles WHERE role_key = 'admin');
SET @manager_role_id = (SELECT id FROM roles WHERE role_key = 'manager');

-- Grant all permissions to Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT @admin_role_id, p.id
FROM permissions p
WHERE p.permission_key LIKE 'goals.%'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = @admin_role_id AND rp.permission_id = p.id
  );

-- Grant View, Create, Edit, Assign, ChangeStatus, Export to Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT @manager_role_id, p.id
FROM permissions p
WHERE p.permission_key IN ('goals.view', 'goals.create', 'goals.edit', 'goals.assign', 'goals.change_status', 'goals.export')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = @manager_role_id AND rp.permission_id = p.id
  );

COMMIT;

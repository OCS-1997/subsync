START TRANSACTION;

-- Insert Task permissions
INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'tasks.view', 'tasks', 'view', 'View assigned and created tasks'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'tasks.view')
UNION ALL
SELECT 'tasks.view_all', 'tasks', 'view_all', 'View all tasks in the organization'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'tasks.view_all')
UNION ALL
SELECT 'tasks.create', 'tasks', 'create', 'Create personal tasks'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'tasks.create')
UNION ALL
SELECT 'tasks.create_for_others', 'tasks', 'create_for_others', 'Create tasks for managed team members'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'tasks.create_for_others')
UNION ALL
SELECT 'tasks.assign', 'tasks', 'assign', 'Assign tasks to managed team members'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'tasks.assign')
UNION ALL
SELECT 'tasks.reassign', 'tasks', 'reassign', 'Reassign tasks to managed team members'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'tasks.reassign')
UNION ALL
SELECT 'tasks.update', 'tasks', 'update', 'Edit task details, priority, and dates'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'tasks.update')
UNION ALL
SELECT 'tasks.update_assigned', 'tasks', 'update_assigned', 'Update status, checklists, and comments on assigned tasks'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'tasks.update_assigned')
UNION ALL
SELECT 'tasks.delete', 'tasks', 'delete', 'Delete tasks'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'tasks.delete')
UNION ALL
SELECT 'tasks.complete', 'tasks', 'complete', 'Mark assigned tasks as completed'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'tasks.complete')
UNION ALL
SELECT 'tasks.reopen', 'tasks', 'reopen', 'Reopen completed tasks'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'tasks.reopen')
UNION ALL
SELECT 'tasks.cancel', 'tasks', 'cancel', 'Cancel tasks'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'tasks.cancel')
UNION ALL
SELECT 'tasks.comment', 'tasks', 'comment', 'Add comments to tasks'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'tasks.comment')
UNION ALL
SELECT 'tasks.attachments', 'tasks', 'attachments', 'Upload and view task attachments'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'tasks.attachments')
UNION ALL
SELECT 'tasks.manage_all', 'tasks', 'manage_all', 'Manage all organization tasks'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'tasks.manage_all')
UNION ALL
SELECT 'tasks.view_activity', 'tasks', 'view_activity', 'View task audit trail and activity log'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'tasks.view_activity');

-- Map permissions to default roles
SET @admin_role_id = (SELECT id FROM roles WHERE role_key = 'admin');
SET @manager_role_id = (SELECT id FROM roles WHERE role_key = 'manager');

-- Grant all task permissions to Admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT @admin_role_id, p.id
FROM permissions p
WHERE p.permission_key LIKE 'tasks.%'
  AND @admin_role_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = @admin_role_id AND rp.permission_id = p.id
  );

-- Grant Manager permissions (view, create, create_for_others, assign, reassign, update, update_assigned, complete, reopen, cancel, comment, attachments, view_activity)
INSERT INTO role_permissions (role_id, permission_id)
SELECT @manager_role_id, p.id
FROM permissions p
WHERE p.permission_key IN (
    'tasks.view', 'tasks.create', 'tasks.create_for_others', 'tasks.assign', 'tasks.reassign',
    'tasks.update', 'tasks.update_assigned', 'tasks.complete', 'tasks.reopen', 'tasks.cancel',
    'tasks.comment', 'tasks.attachments', 'tasks.view_activity'
  )
  AND @manager_role_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = @manager_role_id AND rp.permission_id = p.id
  );

-- Grant Employee / Viewer basic permissions to all roles that exist (view, create, update_assigned, complete, comment, attachments, view_activity)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.permission_key IN ('tasks.view', 'tasks.create', 'tasks.update_assigned', 'tasks.complete', 'tasks.comment', 'tasks.attachments', 'tasks.view_activity')
  AND r.role_key NOT IN ('admin', 'manager')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

COMMIT;

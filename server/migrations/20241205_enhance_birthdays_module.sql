START TRANSACTION;

-- Enhance birthdays table to support contact persons
-- First, change user_id from BIGINT to VARCHAR to match users.username
ALTER TABLE birthdays
    MODIFY COLUMN user_id VARCHAR(50) NULL,
    ADD COLUMN contact_person_index INT NULL COMMENT 'Index in other_contacts array for contact persons' AFTER customer_id,
    MODIFY COLUMN type ENUM('user', 'customer', 'contact_person') NOT NULL,
    ADD INDEX idx_birthdays_contact_person (customer_id, contact_person_index)
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci
    NOT NULL;

-- Add birthday-related permissions
INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'birthdays.view', 'birthdays', 'view', 'View all birthdays (users, customers, and contact persons)'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'birthdays.view');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'birthdays.manage', 'birthdays', 'manage', 'Add, edit, and delete birthday records'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'birthdays.manage');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'birthdays.sync', 'birthdays', 'sync', 'Sync birthdays from users, customers, and contact persons'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'birthdays.sync');

-- Assign permissions to roles
-- Admin gets all permissions (already has all via the admin role assignment)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_key = 'admin'
AND p.permission_key IN ('birthdays.view', 'birthdays.manage', 'birthdays.sync');

-- Manager gets view and manage
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key IN ('birthdays.view', 'birthdays.manage')
WHERE r.role_key = 'manager';

-- Sales gets view only
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key = 'birthdays.view'
WHERE r.role_key = 'sales';

-- Support gets view only
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key = 'birthdays.view'
WHERE r.role_key = 'support';

-- Viewer gets view only
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key = 'birthdays.view'
WHERE r.role_key = 'viewer';

COMMIT;

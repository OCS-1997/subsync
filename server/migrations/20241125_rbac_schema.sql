START TRANSACTION;

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_key VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    is_system TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    permission_key VARCHAR(100) NOT NULL UNIQUE,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

ALTER TABLE users
    MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'Viewer';

ALTER TABLE users
    ADD COLUMN role_id INT NULL AFTER role;

INSERT INTO roles (role_key, name, description, is_system)
SELECT 'admin', 'Admin', 'Full access administrator role', 1
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_key = 'admin');

INSERT INTO roles (role_key, name, description, is_system)
SELECT 'manager', 'Manager', 'Manages most business objects except security', 1
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_key = 'manager');

INSERT INTO roles (role_key, name, description, is_system)
SELECT 'sales', 'Sales', 'Handles customer acquisition and renewals', 1
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_key = 'sales');

INSERT INTO roles (role_key, name, description, is_system)
SELECT 'support', 'Support', 'Handles subscription support operations', 1
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_key = 'support');

INSERT INTO roles (role_key, name, description, is_system)
SELECT 'viewer', 'Viewer', 'Read-only access', 1
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_key = 'viewer');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'dashboard.view', 'dashboard', 'view', 'Access to dashboard widgets'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'dashboard.view');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'customers.view', 'customers', 'view', 'View customers'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'customers.view');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'customers.create', 'customers', 'create', 'Create customers'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'customers.create');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'customers.update', 'customers', 'update', 'Update customers'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'customers.update');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'customers.delete', 'customers', 'delete', 'Delete customers'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'customers.delete');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'domains.view', 'domains', 'view', 'View domains'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'domains.view');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'domains.create', 'domains', 'create', 'Create domains'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'domains.create');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'domains.update', 'domains', 'update', 'Update domains'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'domains.update');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'domains.delete', 'domains', 'delete', 'Delete domains'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'domains.delete');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'services.view', 'services', 'view', 'View services'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'services.view');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'services.create', 'services', 'create', 'Create services'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'services.create');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'services.update', 'services', 'update', 'Update services'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'services.update');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'services.delete', 'services', 'delete', 'Delete services'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'services.delete');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'vendors.view', 'vendors', 'view', 'View vendors'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'vendors.view');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'vendors.create', 'vendors', 'create', 'Create vendors'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'vendors.create');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'vendors.update', 'vendors', 'update', 'Update vendors'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'vendors.update');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'vendors.delete', 'vendors', 'delete', 'Delete vendors'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'vendors.delete');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'subscriptions.view', 'subscriptions', 'view', 'View subscriptions'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'subscriptions.view');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'subscriptions.create', 'subscriptions', 'create', 'Create subscriptions'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'subscriptions.create');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'subscriptions.update', 'subscriptions', 'update', 'Update subscriptions'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'subscriptions.update');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'subscriptions.delete', 'subscriptions', 'delete', 'Delete subscriptions'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'subscriptions.delete');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'subscriptions.send_reminder', 'subscriptions', 'notify', 'Send renewal reminders'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'subscriptions.send_reminder');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'taxes.view', 'taxes', 'view', 'View tax configurations'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'taxes.view');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'taxes.create', 'taxes', 'create', 'Create tax records'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'taxes.create');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'taxes.update', 'taxes', 'update', 'Update tax records'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'taxes.update');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'taxes.delete', 'taxes', 'delete', 'Delete tax records'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'taxes.delete');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'taxes.configure', 'taxes', 'configure', 'Manage tax preferences'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'taxes.configure');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'users.view', 'users', 'view', 'View users'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'users.view');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'users.create', 'users', 'create', 'Create users'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'users.create');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'users.update', 'users', 'update', 'Update users'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'users.update');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'users.delete', 'users', 'delete', 'Delete users'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'users.delete');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'users.assign_roles', 'users', 'assign', 'Assign roles to users'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'users.assign_roles');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'roles.view', 'roles', 'view', 'View roles'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'roles.view');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'roles.create', 'roles', 'create', 'Create roles'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'roles.create');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'roles.update', 'roles', 'update', 'Update roles'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'roles.update');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'roles.delete', 'roles', 'delete', 'Delete roles'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'roles.delete');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'roles.assign_permissions', 'roles', 'assign', 'Assign permissions to roles'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'roles.assign_permissions');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'activity_logs.view', 'activity_logs', 'view', 'View activity logs'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'activity_logs.view');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'reports.view', 'reports', 'view', 'View reports'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'reports.view');

INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'settings.manage', 'settings', 'manage', 'Manage application settings'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'settings.manage');

-- Assign permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_key = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key IN (
    'dashboard.view',
    'customers.view','customers.create','customers.update',
    'domains.view','domains.create','domains.update',
    'services.view','services.create','services.update',
    'vendors.view','vendors.create','vendors.update',
    'subscriptions.view','subscriptions.create','subscriptions.update','subscriptions.send_reminder',
    'taxes.view','taxes.update','taxes.configure',
    'reports.view',
    'settings.manage'
)
WHERE r.role_key = 'manager';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key IN (
    'dashboard.view',
    'customers.view','customers.create','customers.update',
    'subscriptions.view','subscriptions.create','subscriptions.update','subscriptions.send_reminder',
    'reports.view'
)
WHERE r.role_key = 'sales';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key IN (
    'dashboard.view',
    'customers.view',
    'domains.view',
    'services.view',
    'subscriptions.view','subscriptions.send_reminder'
)
WHERE r.role_key = 'support';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key IN (
    'dashboard.view',
    'customers.view',
    'domains.view',
    'services.view',
    'vendors.view',
    'subscriptions.view',
    'taxes.view',
    'reports.view'
)
WHERE r.role_key = 'viewer';

UPDATE users u
LEFT JOIN roles r ON LOWER(r.name) = LOWER(u.role)
SET u.role_id = r.id
WHERE r.id IS NOT NULL;

UPDATE users u
JOIN roles r ON r.role_key = 'viewer'
SET u.role_id = r.id
WHERE u.role_id IS NULL;

ALTER TABLE users
    ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id)
    REFERENCES roles(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

COMMIT;
    

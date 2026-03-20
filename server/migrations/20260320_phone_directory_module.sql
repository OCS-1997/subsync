-- Create phone_directory table
CREATE TABLE IF NOT EXISTS phone_directory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('customer', 'vendor', 'contact', 'user', 'other_contact') NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    parent_entity_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    normalized_number VARCHAR(10) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255),
    designation VARCHAR(100),
    is_active TINYINT(1) DEFAULT 1,
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (normalized_number),
    INDEX (phone_number),
    UNIQUE KEY unique_entity_phone (entity_type, entity_id, phone_number)
);

-- Add permissions for the Directory module
INSERT IGNORE INTO permissions (permission_key, resource, action, description) VALUES
('directory.view', 'directory', 'view', 'View the centralized phone directory'),
('directory.manage', 'directory', 'manage', 'Manage directory synchronization and settings');

-- Assign permissions to admin and manager by default
-- Assuming role_permissions table exists
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT id, 'directory.view' FROM roles WHERE role_key IN ('admin', 'manager', 'sales', 'support');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT id, 'directory.manage' FROM roles WHERE role_key IN ('admin', 'manager');

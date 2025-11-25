-- Create the database
CREATE DATABASE IF NOT EXISTS ocs_srms;

-- Connect to the subsync database
USE ocs_srms;

-- Create the Customers table
CREATE TABLE customers (
	customer_id VARCHAR(15) PRIMARY KEY,
	salutation ENUM('Mr.', 'Ms.', 'Mrs.', 'Dr.') NOT NULL,
	first_name VARCHAR(100) NOT NULL,
	last_name VARCHAR(100) NOT NULL,
	primary_email VARCHAR(255) NOT NULL,
	secondary_email VARCHAR(255),
	country_code VARCHAR(5) NOT NULL DEFAULT '+91',
	primary_phone_number VARCHAR(15) NOT NULL,
	secondary_phone_number VARCHAR(15),
	
	-- Company Information
	company_name VARCHAR(128) NOT NULL,
	display_name VARCHAR(128) NOT NULL,
	gst_in VARCHAR(15),
	currency_code CHAR(3) NOT NULL DEFAULT 'INR',
	gst_treatment VARCHAR(128) NOT NULL,
	tax_preference ENUM('Taxable', 'Tax Exempt') NOT NULL DEFAULT 'Taxable',
	exemption_reason TEXT,
	
	-- Address and Contacts
	customer_address JSON NOT NULL,
	other_contacts JSON,
	notes TEXT,
	
	-- Payment and Status
	payment_terms JSON NOT NULL,
	customer_status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
	
	-- Timestamps
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	
	-- Indexes
	INDEX idx_company_name (company_name),
	INDEX idx_display_name (display_name),
	INDEX idx_primary_phone (primary_phone_number),
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Payment Terms Table
CREATE TABLE payment_terms (
    term_id INT AUTO_INCREMENT PRIMARY KEY,
    term_name VARCHAR(50) NOT NULL,
    days INT NOT NULL,
    is_default BOOLEAN DEFAULT false,
 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_term_name (term_name)
);

-- Insert default payment terms
INSERT INTO payment_terms (term_name, days, is_default) VALUES
('Net 30', 30, false),
('Net 45', 45, false),
('Net 60', 60, false),
('Due on Receipt', 0, true);

-- Create the Domains Table Associated with Customers
CREATE TABLE IF NOT EXISTS domains (
    domain_id VARCHAR(15) PRIMARY KEY,
    customer_id VARCHAR(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    domain_name VARCHAR(255) UNIQUE NOT NULL,
    registration_date DATE NOT NULL,
    registered_with ENUM('OCS', 'OCS (RC)', 'Direct Customer', 'Winds', 'Others') NOT NULL, -- Added 'OCS (RC)'
    mail_service_provider ENUM('ResellerClub', 'Google Workspace', 'Business Email', 'Microsoft 365', 'Others') NOT NULL DEFAULT 'Others',
    other_provider VARCHAR(255) DEFAULT NULL,
    other_mail_service_details VARCHAR(255) DEFAULT NULL,
    name_server VARCHAR(255),
    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);


CREATE TABLE domain_name_servers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    domain_id VARCHAR(15) NOT NULL,
    name_server VARCHAR(255) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (domain_id) REFERENCES domains(domain_id)
);

CREATE TABLE IF NOT EXISTS services (
	service_id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(255) UNIQUE NOT NULL,
    stock_keepers_unit VARCHAR(50) NOT NULL,
    tax_preference ENUM('Taxable', 'Tax Exempt') NOT NULL DEFAULT 'Taxable',
    item_group VARCHAR(255) NOT NULL,
    sales_info JSON NOT NULL,
    purchase_info JSON NOT NULL,
    preferred_vendor VARCHAR(20) NOT NULL,
    default_tax_rates JSON NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS item_groups (
	item_group_id INT AUTO_INCREMENT PRIMARY KEY,
    item_group_name VARCHAR(255) UNIQUE NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendors (
    vendor_id VARCHAR(20) PRIMARY KEY,
    salutation ENUM('Mr.', 'Ms.', 'Mrs.', 'Dr.') NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    primary_email VARCHAR(100) NOT NULL,
    secondary_email VARCHAR(100),
    country_code VARCHAR(5) NOT NULL DEFAULT '+91',
    primary_phone_number VARCHAR(15) NOT NULL,
    secondary_phone_number VARCHAR(15),
    vendor_address JSON NOT NULL,
    other_contacts JSON,
    company_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    gst_in VARCHAR(15),
    currency_code CHAR(3) NOT NULL DEFAULT 'INR',
    gst_treatment VARCHAR(128) NOT NULL,
    tax_preference ENUM('Taxable', 'Tax Exempt') NOT NULL DEFAULT 'Taxable',
    exemption_reason TEXT,
    payment_terms JSON NOT NULL,
    notes TEXT,
    vendor_status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
); 

ALTER TABLE services
    MODIFY COLUMN preferred_vendor VARCHAR(20),
    ADD CONSTRAINT fk_preferred_vendor
    FOREIGN KEY (preferred_vendor)
    REFERENCES vendors(vendor_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE; 


-- Create new tax_rates table
CREATE TABLE tax_rates (
    tax_id VARCHAR(20) PRIMARY KEY,
    tax_name VARCHAR(100) NOT NULL,
    tax_type ENUM('CGST', 'SGST', 'IGST', 'SEZ', 'NO_TAX') NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default tax rates
INSERT INTO tax_rates (tax_id, tax_name, tax_type, tax_rate, description, is_default) VALUES
('TID001', 'Within State - CGST', 'CGST', 9.00, 'Central Goods and Services Tax for within state transactions', FALSE),
('TID002', 'Within State - SGST', 'SGST', 9.00, 'State Goods and Services Tax for within state transactions', FALSE),
('TID003', 'Outside State - IGST', 'IGST', 18.00, 'Integrated Goods and Services Tax for outside state transactions', TRUE),
('TID004', 'SEZ - Zero Tax', 'SEZ', 0.00, 'Special Economic Zone - Zero tax rate', FALSE),
('TID005', 'International - No Tax', 'NO_TAX', 0.00, 'International transactions - No tax applicable', FALSE);

-- Create tax_settings table for other settings
CREATE TABLE tax_settings (
    setting_id VARCHAR(20) PRIMARY KEY,
    setting_key VARCHAR(50) NOT NULL UNIQUE,
    setting_value JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default GST settings
INSERT INTO tax_settings (setting_id, setting_key, setting_value) VALUES
('SET001', 'gst_settings', '{"gst_enabled": true, "gst_threshold": 20000, "reverse_charge": false}');

-- Tax Groups tables
CREATE TABLE IF NOT EXISTS tax_groups (
    group_id VARCHAR(20) PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tax_group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id VARCHAR(20) NOT NULL,
    tax_id VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES tax_groups(group_id) ON DELETE CASCADE,
    FOREIGN KEY (tax_id) REFERENCES tax_rates(tax_id) ON DELETE RESTRICT,
    UNIQUE KEY uniq_group_member (group_id, tax_id)
);

-- Default tax preferences (intra/inter) stored in tax_settings as JSON
-- Example value: {"intra": {"kind": "tax" | "group", "id": "TID003"}, "inter": {"kind": "tax" | "group", "id": "TGR001"}}

CREATE TABLE gst_settings (
	tax_reg_num_label VARCHAR(10) NOT NULL,
    gst_in VARCHAR(15) NOT NULL,
    business_legal_name VARCHAR(20) NOT NULL,
    business_trade_name VARCHAR(20) NOT NULL,
    gst_reg_date DATE NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create the Users table
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_key VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    is_system TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    permission_key VARCHAR(100) NOT NULL UNIQUE,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE users (
    username VARCHAR(32) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Viewer',
    role_id INT,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Seed roles
INSERT INTO roles (role_key, name, description, is_system) VALUES
('admin', 'Admin', 'Full access administrator role', 1),
('manager', 'Manager', 'Manages most business objects except security', 1),
('sales', 'Sales', 'Handles customer acquisition and renewals', 1),
('support', 'Support', 'Handles service & subscription support operations', 1),
('viewer', 'Viewer', 'Read-only access', 1);

-- Seed permissions
INSERT INTO permissions (permission_key, resource, action, description) VALUES
('dashboard.view', 'dashboard', 'view', 'Access to dashboard widgets'),
('customers.view', 'customers', 'view', 'View customers'),
('customers.create', 'customers', 'create', 'Create customers'),
('customers.update', 'customers', 'update', 'Update customers'),
('customers.delete', 'customers', 'delete', 'Delete customers'),
('domains.view', 'domains', 'view', 'View domains'),
('domains.create', 'domains', 'create', 'Create domains'),
('domains.update', 'domains', 'update', 'Update domains'),
('domains.delete', 'domains', 'delete', 'Delete domains'),
('services.view', 'services', 'view', 'View services'),
('services.create', 'services', 'create', 'Create services'),
('services.update', 'services', 'update', 'Update services'),
('services.delete', 'services', 'delete', 'Delete services'),
('vendors.view', 'vendors', 'view', 'View vendors'),
('vendors.create', 'vendors', 'create', 'Create vendors'),
('vendors.update', 'vendors', 'update', 'Update vendors'),
('vendors.delete', 'vendors', 'delete', 'Delete vendors'),
('subscriptions.view', 'subscriptions', 'view', 'View subscriptions'),
('subscriptions.create', 'subscriptions', 'create', 'Create subscriptions'),
('subscriptions.update', 'subscriptions', 'update', 'Update subscriptions'),
('subscriptions.delete', 'subscriptions', 'delete', 'Delete subscriptions'),
('subscriptions.send_reminder', 'subscriptions', 'notify', 'Send renewal reminders'),
('taxes.view', 'taxes', 'view', 'View tax configurations'),
('taxes.create', 'taxes', 'create', 'Create tax records'),
('taxes.update', 'taxes', 'update', 'Update tax records'),
('taxes.delete', 'taxes', 'delete', 'Delete tax records'),
('taxes.configure', 'taxes', 'configure', 'Manage tax preferences'),
('users.view', 'users', 'view', 'View users'),
('users.create', 'users', 'create', 'Create users'),
('users.update', 'users', 'update', 'Update users'),
('users.delete', 'users', 'delete', 'Delete users'),
('users.assign_roles', 'users', 'assign', 'Assign roles to users'),
('roles.view', 'roles', 'view', 'View roles'),
('roles.create', 'roles', 'create', 'Create roles'),
('roles.update', 'roles', 'update', 'Update roles'),
('roles.delete', 'roles', 'delete', 'Delete roles'),
('roles.assign_permissions', 'roles', 'assign', 'Assign permissions to roles'),
('activity_logs.view', 'activity_logs', 'view', 'View activity logs'),
('reports.view', 'reports', 'view', 'View reports'),
('settings.manage', 'settings', 'manage', 'Manage application settings');

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.role_key = 'admin';

-- Manager permissions
INSERT INTO role_permissions (role_id, permission_id)
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

-- Sales permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key IN (
    'dashboard.view',
    'customers.view','customers.create','customers.update',
    'subscriptions.view','subscriptions.create','subscriptions.update','subscriptions.send_reminder',
    'reports.view'
)
WHERE r.role_key = 'sales';

-- Support permissions
INSERT INTO role_permissions (role_id, permission_id)
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

-- Viewer permissions
INSERT INTO role_permissions (role_id, permission_id)
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

-- Default user data (username: admin, password: admin123)
INSERT INTO users (username, name, password, role, role_id, email, is_active)
VALUES (
    'admin',
    'Admin',
    '$2a$15$4NbEZKOhHJtwE..L2peByOQjdFnt0cRdAkO.xJy2BBlnMhNeo0Amy',
    'Admin',
    (SELECT id FROM roles WHERE role_key = 'admin'),
    'admin123@gmail.com',
    TRUE
);

-- Activity Log Table
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(50),
    ip_address VARCHAR(45),
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

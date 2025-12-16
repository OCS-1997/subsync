-- =============================================
-- SubSync Database Schema - Complete Consolidated Version
-- This file contains all base schema and migrations compiled together
-- Run this file to create a fresh database with all updates applied
-- =============================================

-- Create the database
CREATE DATABASE IF NOT EXISTS ocs_srms;

-- Connect to the subsync database
USE ocs_srms;

-- =============================================
-- BASE SCHEMA: Core Tables
-- =============================================

-- Create the Customers table
CREATE TABLE customers (
	customer_id VARCHAR(15) PRIMARY KEY,
	salutation ENUM('Mr.', 'Ms.', 'Mrs.', 'Dr.') NOT NULL,
	first_name VARCHAR(100) NOT NULL,
	last_name VARCHAR(100) NOT NULL,
	date_of_birth DATE NULL,
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
	INDEX idx_customers_date_of_birth (date_of_birth)
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
    registered_with ENUM('OCS', 'OCS (RC)', 'Direct Customer', 'Winds', 'Others') NOT NULL,
    mail_service_provider ENUM('ResellerClub', 'Google Workspace', 'Business Email', 'Microsoft 365', 'Others') NOT NULL DEFAULT 'Others',
    other_provider VARCHAR(255) DEFAULT NULL,
    other_mail_service_details VARCHAR(255) DEFAULT NULL,
    name_server VARCHAR(255),
    description TEXT,
    domain_status ENUM('Active','Expired') NOT NULL DEFAULT 'Active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE domain_name_servers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    domain_id VARCHAR(15) NOT NULL,
    name_server VARCHAR(255) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (domain_id) REFERENCES domains(domain_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE gst_settings (
	tax_reg_num_label VARCHAR(10) NOT NULL,
    gst_in VARCHAR(15) NOT NULL,
    business_legal_name VARCHAR(20) NOT NULL,
    business_trade_name VARCHAR(20) NOT NULL,
    gst_reg_date DATE NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- RBAC SCHEMA: Roles, Permissions, Users
-- =============================================

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
    date_of_birth DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_date_of_birth (date_of_birth),
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
('settings.manage', 'settings', 'manage', 'Manage application settings'),
('reminder_policies.view', 'reminder_policies', 'view', 'View reminder policies'),
('reminder_policies.create', 'reminder_policies', 'create', 'Create reminder policies'),
('reminder_policies.update', 'reminder_policies', 'update', 'Update reminder policies'),
('reminder_policies.delete', 'reminder_policies', 'delete', 'Delete reminder policies'),
('email_templates.view', 'email_templates', 'view', 'View email templates'),
('email_templates.create', 'email_templates', 'create', 'Create email templates'),
('email_templates.update', 'email_templates', 'update', 'Update email templates'),
('email_templates.delete', 'email_templates', 'delete', 'Delete email templates'),
('notification_logs.view', 'notification_logs', 'view', 'View notification logs'),
('quick_tools.view', 'quick_tools', 'view', 'View and use quick tools widget'),
('quick_tools.manage', 'quick_tools', 'manage', 'Manage quick tools (admin only)'),
('contacts.view', 'contacts', 'view', 'View contacts'),
('contacts.create', 'contacts', 'create', 'Create contacts'),
('contacts.update', 'contacts', 'update', 'Update contacts'),
('contacts.delete', 'contacts', 'delete', 'Delete contacts'),
('dcr.view', 'dcr', 'view', 'View DCR entries'),
('dcr.create', 'dcr', 'create', 'Create DCR entries'),
('dcr.update', 'dcr', 'update', 'Update DCR entries'),
('dcr.delete', 'dcr', 'delete', 'Delete DCR entries'),
('birthdays.view', 'birthdays', 'view', 'View all birthdays (users, customers, and contact persons)'),
('birthdays.manage', 'birthdays', 'manage', 'Add, edit, and delete birthday records'),
('birthdays.sync', 'birthdays', 'sync', 'Sync birthdays from users, customers, and contact persons');

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
    'settings.manage',
    'reminder_policies.view', 'reminder_policies.create', 'reminder_policies.update',
    'email_templates.view', 'email_templates.create', 'email_templates.update',
    'notification_logs.view',
    'quick_tools.view',
    'contacts.view','contacts.create','contacts.update',
    'dcr.view', 'dcr.create', 'dcr.update',
    'birthdays.view', 'birthdays.manage'
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
    'reports.view',
    'quick_tools.view',
    'contacts.view','contacts.create','contacts.update',
    'dcr.view', 'dcr.create', 'dcr.update',
    'birthdays.view'
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
    'subscriptions.view','subscriptions.send_reminder',
    'quick_tools.view',
    'contacts.view',
    'dcr.view', 'dcr.create',
    'birthdays.view'
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
    'reports.view',
    'quick_tools.view',
    'contacts.view',
    'dcr.view',
    'birthdays.view'
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

-- =============================================
-- SUBSCRIPTIONS SCHEMA
-- =============================================

CREATE TABLE subscriptions (
  sub_id VARCHAR(15) NOT NULL PRIMARY KEY,
  customer_id VARCHAR(15) NOT NULL,
  domain_name VARCHAR(255),
  start_date DATETIME NOT NULL,
  end_date DATETIME NULL,
  never_expires TINYINT(1) NOT NULL DEFAULT 0,
  repeat_every_value INT NULL,
  repeat_every_unit ENUM('days','weeks','months','years') NULL,
  billing_cycle_type ENUM('contract','financial_year','calendar_year') NOT NULL DEFAULT 'contract',
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_type ENUM('amount','percent') NOT NULL DEFAULT 'amount',
  discount_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  rounding DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  notes TEXT NULL,
  terms_and_conditions TEXT NULL,
  email_list JSON NULL,
  status ENUM('active','paused','cancelled') NOT NULL DEFAULT 'active',
  reminder_policy_id BIGINT NULL,
  archived_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  
  INDEX idx_subscriptions_customer (customer_id),
  INDEX idx_subscriptions_end_date (end_date),
  INDEX idx_subscriptions_reminder_policy (reminder_policy_id),
  INDEX idx_subscriptions_archived_at (archived_at),

  CONSTRAINT fk_subscriptions_customer
    FOREIGN KEY (customer_id)
    REFERENCES customers(customer_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscription_items (
  item_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sub_id VARCHAR(15) NOT NULL,
  service_id INT NULL,
  service_name VARCHAR(255) NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  rate DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  INDEX idx_items_sub (sub_id),
  INDEX idx_items_service (service_id),
  CONSTRAINT fk_items_subscription
    FOREIGN KEY (sub_id) REFERENCES subscriptions(sub_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_items_service
    FOREIGN KEY (service_id) REFERENCES services(service_id)
    ON DELETE SET NULL ON UPDATE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscription_history (
  history_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sub_id VARCHAR(15) NOT NULL,
  changed_by VARCHAR(255) NULL,
  change_type ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL DEFAULT 'UPDATE',
  field_name VARCHAR(100) NULL,
  old_value TEXT NULL,
  new_value TEXT NULL,
  change_summary TEXT NULL,
  ip_address VARCHAR(45) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_history_sub (sub_id),
  INDEX idx_history_created (created_at),
  INDEX idx_history_changed_by (changed_by),
  
  CONSTRAINT fk_history_subscription
    FOREIGN KEY (sub_id)
    REFERENCES subscriptions(sub_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- REMINDER SYSTEM SCHEMA
-- =============================================

CREATE TABLE IF NOT EXISTS reminder_policies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_by BIGINT NULL,
    is_default TINYINT(1) DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_reminder_policies_default (is_default),
    INDEX idx_reminder_policies_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key for subscriptions reminder_policy_id
ALTER TABLE subscriptions
    ADD CONSTRAINT fk_subscriptions_reminder_policy
        FOREIGN KEY (reminder_policy_id)
        REFERENCES reminder_policies(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS reminder_policy_offsets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    policy_id BIGINT NOT NULL,
    days_offset INT NOT NULL COMMENT 'Negative = before expiry, 0 = on expiry, positive = after',
    template_key VARCHAR(64) NOT NULL,
    active TINYINT(1) DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_policy_offset_template (policy_id, days_offset, template_key),
    INDEX idx_policy_offsets_policy (policy_id),
    INDEX idx_policy_offsets_active (active),
    CONSTRAINT fk_policy_offsets_policy
        FOREIGN KEY (policy_id)
        REFERENCES reminder_policies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    template_key VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    active TINYINT(1) DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email_templates_key (template_key),
    INDEX idx_email_templates_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    subscription_id VARCHAR(50) NULL,
    user_id BIGINT NULL,
    template_key VARCHAR(64) NOT NULL,
    sent_at DATETIME NOT NULL,
    status ENUM('queued', 'sent', 'failed', 'skipped') NOT NULL DEFAULT 'queued',
    provider_id VARCHAR(255) NULL,
    attempt INT DEFAULT 0,
    error TEXT NULL,
    attachment_url TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_notification (subscription_id, template_key, (DATE(sent_at))),
    INDEX idx_notification_logs_subscription (subscription_id),
    INDEX idx_notification_logs_template (template_key),
    INDEX idx_notification_logs_status (status),
    INDEX idx_notification_logs_sent_at (sent_at),
    INDEX idx_notification_logs_user (user_id),
    CONSTRAINT fk_notification_logs_subscription
        FOREIGN KEY (subscription_id)
        REFERENCES subscriptions(sub_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS failed_jobs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_name VARCHAR(255) NOT NULL,
    payload JSON NOT NULL,
    error TEXT NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    last_failed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_failed_jobs_name (job_name),
    INDEX idx_failed_jobs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default reminder policy
INSERT INTO reminder_policies (name, is_default, created_by)
SELECT 'Default Reminder Policy', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM reminder_policies WHERE is_default = 1);

-- Insert default email templates
INSERT INTO email_templates (template_key, name, subject, body_html, active) VALUES
('before_30', '30 Days Before Expiry', 'Your subscription expires in 30 days', 
'<html><body><h2>Subscription Renewal Reminder</h2><p>Dear {{customer_name}},</p><p>Your subscription <strong>{{subscription_id}}</strong> for <strong>{{domain_name}}</strong> will expire in <strong>{{days_left}}</strong> days.</p><p>Expiry Date: {{end_date}}</p><p>Please renew your subscription to avoid service interruption.</p><p>Thank you,<br>Support Team</p></body></html>', 1),
('before_7', '7 Days Before Expiry', 'Your subscription expires in 7 days', 
'<html><body><h2>Urgent: Subscription Renewal Required</h2><p>Dear {{customer_name}},</p><p>Your subscription <strong>{{subscription_id}}</strong> for <strong>{{domain_name}}</strong> will expire in <strong>{{days_left}}</strong> days.</p><p>Expiry Date: {{end_date}}</p><p>Please renew immediately to avoid service interruption.</p><p>Thank you,<br>Support Team</p></body></html>', 1),
('on_expiry', 'On Expiry Date', 'Your subscription has expired', 
'<html><body><h2>Subscription Expired</h2><p>Dear {{customer_name}},</p><p>Your subscription <strong>{{subscription_id}}</strong> for <strong>{{domain_name}}</strong> has expired on {{end_date}}.</p><p>Please renew your subscription immediately to restore service.</p><p>Thank you,<br>Support Team</p></body></html>', 1),
('after_7', '7 Days After Expiry', 'Your subscription expired 7 days ago', 
'<html><body><h2>Action Required: Subscription Expired</h2><p>Dear {{customer_name}},</p><p>Your subscription <strong>{{subscription_id}}</strong> for <strong>{{domain_name}}</strong> expired on {{end_date}}.</p><p>It has been 7 days since expiry. Please renew immediately to restore service.</p><p>Thank you,<br>Support Team</p></body></html>', 1),
('renewal_invoice', 'Renewal Invoice', 'Your renewal invoice is ready', 
'<html><body><h2>Renewal Invoice</h2><p>Dear {{customer_name}},</p><p>Your subscription <strong>{{subscription_id}}</strong> for <strong>{{domain_name}}</strong> has been renewed.</p><p>Total Amount: {{currency}} {{total}}</p><p>Please find the invoice attached.</p><p>Thank you,<br>Support Team</p></body></html>', 1),
('birthday_wish', 'Birthday Wish', 'Happy Birthday {{name}}!', 
'<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 32px;">🎉 Happy Birthday! 🎉</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Dear {{name}},</p>
            <p style="font-size: 16px; margin-bottom: 20px;">
                On this special day, we want to take a moment to celebrate you! 
                {{#if isCustomer}}
                Thank you for being a valued customer and for your continued trust in our services.
                {{else}}
                Thank you for being an integral part of our team and for all your hard work and dedication.
                {{/if}}
            </p>
            <div style="background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="font-size: 24px; font-weight: bold; color: #667eea; margin: 0;">
                    Wishing you a wonderful year ahead filled with joy, success, and happiness!
                </p>
            </div>
            <p style="font-size: 16px; margin-top: 30px;">
                Best regards,<br>
                <strong>The Subsync Team</strong>
            </p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>This is an automated birthday wish from Subsync</p>
        </div>
    </div>
</body>
</html>', 1);

-- Insert default reminder policy offsets
SET @default_policy_id = (SELECT id FROM reminder_policies WHERE is_default = 1 LIMIT 1);

INSERT INTO reminder_policy_offsets (policy_id, days_offset, template_key, active, sort_order) VALUES
(@default_policy_id, -30, 'before_30', 1, 1),
(@default_policy_id, -7, 'before_7', 1, 2),
(@default_policy_id, 0, 'on_expiry', 1, 3),
(@default_policy_id, 7, 'after_7', 1, 4);

-- =============================================
-- BIRTHDAYS & DASHBOARD WIDGETS SCHEMA
-- =============================================

CREATE TABLE IF NOT EXISTS birthdays (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NULL,
    customer_id VARCHAR(15) NULL,
    contact_person_index INT NULL COMMENT 'Index in other_contacts array for contact persons',
    date_of_birth DATE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('user', 'customer', 'contact_person') NOT NULL,
    email_send TINYINT(1) DEFAULT 1,
    include_in_communication TINYINT(1) DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_birthdays_date (date_of_birth),
    INDEX idx_birthdays_user (user_id),
    INDEX idx_birthdays_customer (customer_id),
    INDEX idx_birthdays_type (type),
    INDEX idx_birthdays_contact_person (customer_id, contact_person_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    widget_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_enabled TINYINT(1) DEFAULT 1,
    widget_order INT DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_widgets_key (widget_key),
    INDEX idx_widgets_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dashboard_widget_permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role ENUM('admin', 'manager', 'sales', 'support', 'viewer') NOT NULL,
    widget_key VARCHAR(100) NOT NULL,
    is_visible TINYINT(1) DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_role_widget (role, widget_key),
    INDEX idx_widget_permissions_role (role),
    INDEX idx_widget_permissions_widget (widget_key),
    CONSTRAINT fk_widget_permissions_widget
        FOREIGN KEY (widget_key)
        REFERENCES dashboard_widgets(widget_key)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default widgets
INSERT INTO dashboard_widgets (widget_key, name, description, is_enabled, widget_order) VALUES
('subscription_status', 'Subscription Status', 'Overview of subscription counts by status', 1, 1),
('renewals_timeline', 'Renewals Timeline', 'Upcoming renewals in next 30/60/90 days', 1, 2),
('expiring_soon', 'Expiring Soon', 'Subscriptions expiring within 7 days', 1, 3),
('dcr_summary', 'DCR Summary', 'Today''s call register summary', 1, 4),
('team_dcr', 'Team DCR', 'Team performance metrics for DCR', 1, 5),
('dcr_trends', 'DCR Trends', 'Call trends over last 30 days', 1, 6),
('notification_status', 'Notification Status', 'Email notification success/failure rates', 1, 7),
('queue_health', 'Queue Health', 'BullMQ queue status and health', 1, 8),
('activity_log', 'Activity Log', 'Recent system activity', 1, 9),
('birthdays', 'Birthdays', 'Today and upcoming birthdays', 1, 10),
('quick_actions', 'Quick Actions', 'Role-based quick action buttons', 1, 11)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- Set default widget permissions
INSERT INTO dashboard_widget_permissions (role, widget_key, is_visible) VALUES
-- Manager permissions
('manager', 'subscription_status', 1),
('manager', 'renewals_timeline', 1),
('manager', 'expiring_soon', 1),
('manager', 'dcr_summary', 1),
('manager', 'team_dcr', 1),
('manager', 'notification_status', 1),
('manager', 'birthdays', 1),
('manager', 'quick_actions', 1),
-- Sales permissions
('sales', 'subscription_status', 1),
('sales', 'renewals_timeline', 1),
('sales', 'expiring_soon', 1),
('sales', 'dcr_summary', 1),
('sales', 'dcr_trends', 1),
('sales', 'birthdays', 1),
('sales', 'quick_actions', 1),
-- Support permissions
('support', 'subscription_status', 1),
('support', 'expiring_soon', 1),
('support', 'dcr_summary', 1),
('support', 'dcr_trends', 1),
('support', 'birthdays', 1),
('support', 'quick_actions', 1),
-- Viewer permissions
('viewer', 'subscription_status', 1),
('viewer', 'renewals_timeline', 1),
('viewer', 'expiring_soon', 1),
('viewer', 'birthdays', 1)
ON DUPLICATE KEY UPDATE is_visible = VALUES(is_visible);

-- =============================================
-- QUICK TOOLS SCHEMA
-- =============================================

CREATE TABLE IF NOT EXISTS quick_tools (
    tool_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url_template VARCHAR(500) NOT NULL,
    icon VARCHAR(100) NOT NULL,
    roles_allowed JSON NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_quick_tools_active (is_active),
    INDEX idx_quick_tools_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default tools
INSERT INTO quick_tools (name, url_template, icon, roles_allowed, is_active, sort_order) VALUES
('DNS Checker', 'https://dnschecker.org/#A/{{domain}}', 'fa-globe', JSON_ARRAY('admin', 'manager', 'sales', 'support', 'viewer'), 1, 1),
('Google Toolbox', 'https://toolbox.googleapps.com/apps/dig/#A/{{domain}}', 'fa-google', JSON_ARRAY('admin', 'manager', 'sales', 'support', 'viewer'), 1, 2),
('MXToolbox MX', 'https://mxtoolbox.com/SuperTool.aspx?action=mx:{{domain}}', 'fa-envelope', JSON_ARRAY('admin', 'manager', 'sales', 'support', 'viewer'), 1, 3),
('Whois Lookup', 'https://who.is/whois/{{domain}}', 'fa-search', JSON_ARRAY('admin', 'manager', 'sales', 'support', 'viewer'), 1, 4),
('SSL Labs', 'https://www.ssllabs.com/ssltest/analyze.html?d={{domain}}', 'fa-lock', JSON_ARRAY('admin', 'manager', 'support'), 1, 5);

-- =============================================
-- CONTACTS & DCR SCHEMA
-- =============================================

CREATE TABLE IF NOT EXISTS contacts (
    contact_id VARCHAR(15) PRIMARY KEY,
    domain_id VARCHAR(15) NULL,
    domain_free_text VARCHAR(255) NULL,
    company_name VARCHAR(255) NULL,
    salutation ENUM('Mr.', 'Ms.', 'Mrs.', 'Dr.') NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NULL,
    email VARCHAR(255) NULL,
    country_code VARCHAR(5) DEFAULT '+91',
    phone_number VARCHAR(15) NULL,
    designation VARCHAR(100) NULL,
    notes TEXT NULL,
    date_of_birth DATE DEFAULT NULL COMMENT 'Contact date of birth for birthday reminders',
    is_private TINYINT(1) DEFAULT 0 COMMENT '0 = public (viewable by all), 1 = private (only viewable by creator)',
    created_by VARCHAR(20) DEFAULT NULL COMMENT 'Username of the user who created this contact',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_domain_id (domain_id),
    INDEX idx_email (email),
    INDEX idx_contacts_created_by (created_by),
    INDEX idx_contacts_is_private (is_private),
    INDEX idx_contacts_privacy_filter (is_private, created_by),
    FOREIGN KEY (domain_id) REFERENCES domains(domain_id) ON DELETE SET NULL,
    CONSTRAINT fk_contacts_created_by 
        FOREIGN KEY (created_by) REFERENCES users(username) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dcr_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    timestamp DATETIME NOT NULL,
    call_type ENUM('incoming', 'outgoing', 'follow-up') NOT NULL DEFAULT 'incoming',
    time_spent_minutes INT NOT NULL,
    domain_id VARCHAR(15) NULL,
    domain_free_text VARCHAR(255) NULL,
    company_name VARCHAR(255) NULL,
    contact_name VARCHAR(255) NULL,
    contact_phone_country_code VARCHAR(5) NULL,
    contact_phone_number VARCHAR(15) NULL,
    contact_email VARCHAR(255) NULL,
    contact_id VARCHAR(15) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_domain_id (domain_id),
    INDEX idx_contact_id (contact_id),
    FOREIGN KEY (user_id) REFERENCES users(username) ON DELETE CASCADE,
    FOREIGN KEY (domain_id) REFERENCES domains(domain_id) ON DELETE SET NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(contact_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- ACTIVITY LOGS
-- =============================================

CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(50),
    ip_address VARCHAR(45),
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_activity_logs_ip_address (ip_address),
    INDEX idx_activity_logs_composite (username, action, timestamp)
);

-- =============================================
-- END OF SCHEMA
-- All tables created successfully!
-- =============================================

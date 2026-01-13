START TRANSACTION;

-- Add date_of_birth to customers table
ALTER TABLE customers
    ADD COLUMN date_of_birth DATE NULL AFTER last_name,
    ADD INDEX idx_customers_date_of_birth (date_of_birth);

-- Add date_of_birth to users table
ALTER TABLE users
    ADD COLUMN date_of_birth DATE NULL AFTER email,
    ADD INDEX idx_users_date_of_birth (date_of_birth);

-- Create birthdays table for internal staff
CREATE TABLE IF NOT EXISTS birthdays (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    customer_id VARCHAR(15) NULL,
    date_of_birth DATE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('user', 'customer') NOT NULL,
    email_send TINYINT(1) DEFAULT 1,
    include_in_communication TINYINT(1) DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_birthdays_date (date_of_birth),
    INDEX idx_birthdays_user (user_id),
    INDEX idx_birthdays_customer (customer_id),
    INDEX idx_birthdays_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create dashboard_widgets table
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

-- Create dashboard_widget_permissions table
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

-- Set default permissions: Admin sees all, others see subset
-- Admin gets all widgets (we'll handle this in code, but set defaults for others)
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

COMMIT;


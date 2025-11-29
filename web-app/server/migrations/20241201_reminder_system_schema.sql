START TRANSACTION;

-- Add reminder_policy_id and archived_at to subscriptions table
ALTER TABLE subscriptions
    ADD COLUMN reminder_policy_id BIGINT NULL AFTER status,
    ADD COLUMN archived_at DATETIME NULL AFTER reminder_policy_id,
    ADD INDEX idx_subscriptions_reminder_policy (reminder_policy_id),
    ADD INDEX idx_subscriptions_archived_at (archived_at);

-- Create reminder_policies table
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

-- Add foreign key constraint for reminder_policy_id (after reminder_policies table is created)
ALTER TABLE subscriptions
    ADD CONSTRAINT fk_subscriptions_reminder_policy
        FOREIGN KEY (reminder_policy_id)
        REFERENCES reminder_policies(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;

-- Create reminder_policy_offsets table
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

-- Create email_templates table
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

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    subscription_id VARCHAR(15) NOT NULL,
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

-- Create failed_jobs table for dead-letter logging
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
INSERT INTO email_templates (template_key, name, subject, body_html, active)
SELECT 'before_30', '30 Days Before Expiry', 'Your subscription expires in 30 days', 
'<html><body><h2>Subscription Renewal Reminder</h2><p>Dear {{customer_name}},</p><p>Your subscription <strong>{{subscription_id}}</strong> for <strong>{{domain_name}}</strong> will expire in <strong>{{days_left}}</strong> days.</p><p>Expiry Date: {{end_date}}</p><p>Please renew your subscription to avoid service interruption.</p><p>Thank you,<br>Support Team</p></body></html>', 1
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE template_key = 'before_30');

INSERT INTO email_templates (template_key, name, subject, body_html, active)
SELECT 'before_7', '7 Days Before Expiry', 'Your subscription expires in 7 days', 
'<html><body><h2>Urgent: Subscription Renewal Required</h2><p>Dear {{customer_name}},</p><p>Your subscription <strong>{{subscription_id}}</strong> for <strong>{{domain_name}}</strong> will expire in <strong>{{days_left}}</strong> days.</p><p>Expiry Date: {{end_date}}</p><p>Please renew immediately to avoid service interruption.</p><p>Thank you,<br>Support Team</p></body></html>', 1
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE template_key = 'before_7');

INSERT INTO email_templates (template_key, name, subject, body_html, active)
SELECT 'on_expiry', 'On Expiry Date', 'Your subscription has expired', 
'<html><body><h2>Subscription Expired</h2><p>Dear {{customer_name}},</p><p>Your subscription <strong>{{subscription_id}}</strong> for <strong>{{domain_name}}</strong> has expired on {{end_date}}.</p><p>Please renew your subscription immediately to restore service.</p><p>Thank you,<br>Support Team</p></body></html>', 1
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE template_key = 'on_expiry');

INSERT INTO email_templates (template_key, name, subject, body_html, active)
SELECT 'after_7', '7 Days After Expiry', 'Your subscription expired 7 days ago', 
'<html><body><h2>Action Required: Subscription Expired</h2><p>Dear {{customer_name}},</p><p>Your subscription <strong>{{subscription_id}}</strong> for <strong>{{domain_name}}</strong> expired on {{end_date}}.</p><p>It has been 7 days since expiry. Please renew immediately to restore service.</p><p>Thank you,<br>Support Team</p></body></html>', 1
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE template_key = 'after_7');

INSERT INTO email_templates (template_key, name, subject, body_html, active)
SELECT 'renewal_invoice', 'Renewal Invoice', 'Your renewal invoice is ready', 
'<html><body><h2>Renewal Invoice</h2><p>Dear {{customer_name}},</p><p>Your subscription <strong>{{subscription_id}}</strong> for <strong>{{domain_name}}</strong> has been renewed.</p><p>Total Amount: {{currency}} {{total}}</p><p>Please find the invoice attached.</p><p>Thank you,<br>Support Team</p></body></html>', 1
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE template_key = 'renewal_invoice');

-- Insert default reminder policy offsets
SET @default_policy_id = (SELECT id FROM reminder_policies WHERE is_default = 1 LIMIT 1);

INSERT INTO reminder_policy_offsets (policy_id, days_offset, template_key, active, sort_order)
SELECT @default_policy_id, -30, 'before_30', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM reminder_policy_offsets WHERE policy_id = @default_policy_id AND days_offset = -30);

INSERT INTO reminder_policy_offsets (policy_id, days_offset, template_key, active, sort_order)
SELECT @default_policy_id, -7, 'before_7', 1, 2
WHERE NOT EXISTS (SELECT 1 FROM reminder_policy_offsets WHERE policy_id = @default_policy_id AND days_offset = -7);

INSERT INTO reminder_policy_offsets (policy_id, days_offset, template_key, active, sort_order)
SELECT @default_policy_id, 0, 'on_expiry', 1, 3
WHERE NOT EXISTS (SELECT 1 FROM reminder_policy_offsets WHERE policy_id = @default_policy_id AND days_offset = 0);

INSERT INTO reminder_policy_offsets (policy_id, days_offset, template_key, active, sort_order)
SELECT @default_policy_id, 7, 'after_7', 1, 4
WHERE NOT EXISTS (SELECT 1 FROM reminder_policy_offsets WHERE policy_id = @default_policy_id AND days_offset = 7);

COMMIT;


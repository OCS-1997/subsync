-- =============================================
-- Backup System Schema Migration
-- Created: 2024-12-16
-- Description: Simplified backup system for MySQL database backups
-- =============================================

-- Backup Configurations Table
CREATE TABLE IF NOT EXISTS backup_configurations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Backup is always database type (files/full can be added later)
    enabled TINYINT(1) DEFAULT 1,
    
    -- Simple Scheduling
    schedule_type ENUM('manual', 'daily', 'weekly', 'monthly') NOT NULL DEFAULT 'manual',
    schedule_time TIME DEFAULT '02:00:00' COMMENT 'Time of day to run backup (for daily/weekly/monthly)',
    schedule_day_of_week TINYINT DEFAULT 0 COMMENT '0=Sunday, 1=Monday, etc. (for weekly)',
    schedule_day_of_month TINYINT DEFAULT 1 COMMENT 'Day of month 1-31 (for monthly)',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    
    -- Retention Policy (Simple)
    retention_days INT DEFAULT 30 COMMENT 'Keep backups for X days',
    max_backups INT DEFAULT 10 COMMENT 'Maximum number of backups to keep',
    
    -- Storage is always local (path configured in env)
    compression TINYINT(1) DEFAULT 1,
    
    -- Email Notifications
    email_on_success TINYINT(1) DEFAULT 0,
    email_on_failure TINYINT(1) DEFAULT 1,
    email_recipients JSON COMMENT 'Array of email addresses',
    
    -- Metadata
    created_by VARCHAR(32),
    last_run_at DATETIME NULL,
    last_run_status ENUM('success', 'failed') DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_backup_configs_enabled (enabled),
    INDEX idx_backup_configs_schedule (schedule_type),
    
    CONSTRAINT fk_backup_configs_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(username)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Backup History Table
CREATE TABLE IF NOT EXISTS backup_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_id BIGINT NOT NULL,
    
    -- Execution Details
    status ENUM('queued', 'in_progress', 'completed', 'failed') NOT NULL DEFAULT 'queued',
    
    -- File Information
    file_path TEXT COMMENT 'Relative path to backup file',
    file_size BIGINT DEFAULT 0 COMMENT 'Size in bytes',
    checksum VARCHAR(64) COMMENT 'SHA-256 checksum for integrity',
    
    -- Timing
    started_at DATETIME,
    completed_at DATETIME,
    duration_seconds INT COMMENT 'Backup duration in seconds',
    
    -- Database Info
    database_name VARCHAR(100),
    table_count INT,
    
    -- Error Handling
    error_message TEXT,
    retry_count INT DEFAULT 0,
    
    -- Email Notification
    email_sent TINYINT(1) DEFAULT 0,
    email_sent_at DATETIME,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_backup_history_config (config_id),
    INDEX idx_backup_history_status (status),
    INDEX idx_backup_history_created (created_at),
    
    CONSTRAINT fk_backup_history_config
        FOREIGN KEY (config_id)
        REFERENCES backup_configurations(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert a default backup configuration (disabled by default)
INSERT INTO backup_configurations (
    name, 
    description, 
    enabled, 
    schedule_type, 
    schedule_time,
    retention_days,
    max_backups,
    compression,
    email_on_failure,
    email_recipients
) VALUES (
    'Default Daily Backup',
    'Automated daily database backup at 2:00 AM',
    0,
    'daily',
    '02:00:00',
    30,
    10,
    1,
    1,
    '["info@ocsindia.net"]'
);

-- Success message
SELECT 'Backup system schema created successfully!' as status;

-- =============================================
-- Backup System Schema Migration
-- Created: 2024-12-16
-- Description: Simplified backup system for MySQL database backups
-- =============================================

START TRANSACTION;

SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- Backup Configurations Table
CREATE TABLE backup_configurations (
    id BIGINT NOT NULL AUTO_INCREMENT,

    name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,

    enabled TINYINT(1) DEFAULT 1,

    schedule_type ENUM('manual', 'daily', 'weekly', 'monthly')
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        NOT NULL DEFAULT 'manual',

    schedule_time TIME DEFAULT '02:00:00',
    schedule_day_of_week TINYINT DEFAULT 0,
    schedule_day_of_month TINYINT DEFAULT 1,
    timezone VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Asia/Kolkata',

    retention_days INT DEFAULT 30,
    max_backups INT DEFAULT 10,
    compression TINYINT(1) DEFAULT 1,

    email_on_success TINYINT(1) DEFAULT 0,
    email_on_failure TINYINT(1) DEFAULT 1,
    email_recipients JSON DEFAULT NULL,

    -- 🔑 MUST MATCH users.username EXACTLY
    created_by VARCHAR(32)
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_0900_ai_ci
        DEFAULT NULL,

    last_run_at DATETIME DEFAULT NULL,
    last_run_status ENUM('success', 'failed')
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_backup_configs_enabled (enabled),
    INDEX idx_backup_configs_schedule (schedule_type),
    INDEX idx_backup_configs_created_by (created_by),

    CONSTRAINT fk_backup_configs_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(username)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- Backup History Table
CREATE TABLE IF NOT EXISTS backup_history (
    id BIGINT NOT NULL AUTO_INCREMENT,
    config_id BIGINT NOT NULL,
    
    -- Execution Details
    status ENUM('queued', 'in_progress', 'completed', 'failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'queued',
    
    -- File Information
    file_path TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Relative path to backup file',
    file_size BIGINT DEFAULT 0 COMMENT 'Size in bytes',
    checksum VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'SHA-256 checksum for integrity',
    
    -- Timing
    started_at DATETIME DEFAULT NULL,
    completed_at DATETIME DEFAULT NULL,
    duration_seconds INT DEFAULT NULL COMMENT 'Backup duration in seconds',
    
    -- Database Info
    database_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    table_count INT DEFAULT NULL,
    
    -- Error Handling
    error_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    retry_count INT DEFAULT 0,
    
    -- Email Notification
    email_sent TINYINT(1) DEFAULT 0,
    email_sent_at DATETIME DEFAULT NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
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
)
ON DUPLICATE KEY UPDATE name = name;

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;

COMMIT;

-- Success message
SELECT 'Backup system schema created successfully!' as status;

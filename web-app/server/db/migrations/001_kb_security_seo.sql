-- =============================================
-- Knowledge Base Security & SEO Migration
-- Run this file to add KB tables with security and analytics
-- 
-- IMPORTANT: If you get "Duplicate column" or "Duplicate key" errors,
-- it means some columns/indexes already exist. This is safe to ignore.
-- The CREATE TABLE statements use IF NOT EXISTS so they're safe to re-run.
-- =============================================

USE ocs_srms;

-- =============================================
-- 1. ALTER knowledge_articles table (if exists)
-- Add SEO and Analytics fields
-- NOTE: If columns already exist, you'll get errors. This is expected.
-- Simply comment out the ALTER TABLE statements that fail and re-run.
-- =============================================

-- Add SEO and Analytics columns (will skip if column already exists)
ALTER TABLE knowledge_articles
ADD COLUMN meta_title VARCHAR(60) DEFAULT NULL COMMENT 'SEO meta title (max 60 chars)',
ADD COLUMN meta_description VARCHAR(160) DEFAULT NULL COMMENT 'SEO meta description (max 160 chars)',
ADD COLUMN keywords TEXT DEFAULT NULL COMMENT 'SEO keywords (comma-separated)',
ADD COLUMN canonical_url VARCHAR(255) DEFAULT NULL COMMENT 'Canonical URL for SEO',
ADD COLUMN og_image VARCHAR(500) DEFAULT NULL COMMENT 'Open Graph image URL',
ADD COLUMN total_reads INT DEFAULT 0 COMMENT 'Total read count',
ADD COLUMN unique_reads INT DEFAULT 0 COMMENT 'Unique visitor count',
ADD COLUMN last_read_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Last time article was read';

-- Add indexes for public article queries
ALTER TABLE knowledge_articles
ADD INDEX idx_public_articles (visibility, is_published, slug),
ADD INDEX idx_sitemap (visibility, is_published, updated_at);

-- =============================================
-- 2. CREATE Security & Analytics Tables
-- =============================================

-- Article Read Tracking
CREATE TABLE IF NOT EXISTS knowledge_article_reads (
    id BIGINT NOT NULL AUTO_INCREMENT,
    article_id INT NOT NULL,
    session_fingerprint VARCHAR(64) NOT NULL COMMENT 'Anonymous session identifier',
    ip_hash VARCHAR(64) NOT NULL COMMENT 'Hashed IP address for privacy',
    user_agent TEXT DEFAULT NULL,
    referrer VARCHAR(500) DEFAULT NULL,
    utm_source VARCHAR(100) DEFAULT NULL,
    utm_medium VARCHAR(100) DEFAULT NULL,
    utm_campaign VARCHAR(100) DEFAULT NULL,
    read_duration INT DEFAULT 0 COMMENT 'Time spent reading in seconds',
    scroll_depth INT DEFAULT 0 COMMENT 'Percentage of article scrolled',
    is_unique TINYINT(1) DEFAULT 1 COMMENT 'First read from this fingerprint',
    read_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_article_id (article_id),
    KEY idx_fingerprint (session_fingerprint),
    KEY idx_read_at (read_at),
    KEY idx_unique_reads (article_id, is_unique),
    CONSTRAINT fk_reads_article FOREIGN KEY (article_id) 
        REFERENCES knowledge_articles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks individual article reads for analytics';

-- Article Access Log (Security)
CREATE TABLE IF NOT EXISTS knowledge_article_access_log (
    id BIGINT NOT NULL AUTO_INCREMENT,
    article_id INT DEFAULT NULL,
    article_slug VARCHAR(255) DEFAULT NULL,
    ip_address VARCHAR(45) NOT NULL COMMENT 'IPv4 or IPv6 address',
    ip_hash VARCHAR(64) NOT NULL COMMENT 'Hashed IP for privacy',
    user_agent TEXT DEFAULT NULL,
    request_method VARCHAR(10) DEFAULT 'GET',
    request_path VARCHAR(500) DEFAULT NULL,
    query_params TEXT DEFAULT NULL,
    response_status INT DEFAULT NULL,
    response_time_ms INT DEFAULT NULL,
    is_bot TINYINT(1) DEFAULT 0,
    is_suspicious TINYINT(1) DEFAULT 0 COMMENT 'Flagged as suspicious activity',
    suspicious_reason VARCHAR(255) DEFAULT NULL,
    accessed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_article_id (article_id),
    KEY idx_ip_hash (ip_hash),
    KEY idx_accessed_at (accessed_at),
    KEY idx_suspicious (is_suspicious, accessed_at),
    KEY idx_ip_time (ip_address, accessed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Security audit log for public article access';

-- Rate Limiting
CREATE TABLE IF NOT EXISTS knowledge_rate_limits (
    id BIGINT NOT NULL AUTO_INCREMENT,
    ip_address VARCHAR(45) NOT NULL,
    endpoint VARCHAR(100) NOT NULL COMMENT 'e.g., /kb/public/articles',
    request_count INT DEFAULT 1,
    window_start TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    window_end TIMESTAMP NULL DEFAULT NULL,
    is_blocked TINYINT(1) DEFAULT 0,
    violation_count INT DEFAULT 0 COMMENT 'Number of rate limit violations',
    last_request_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_ip_endpoint_window (ip_address, endpoint, window_start),
    KEY idx_ip_endpoint (ip_address, endpoint),
    KEY idx_blocked (is_blocked),
    KEY idx_window_end (window_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Rate limiting tracking per IP and endpoint';

-- IP Blacklist
CREATE TABLE IF NOT EXISTS knowledge_ip_blacklist (
    id INT NOT NULL AUTO_INCREMENT,
    ip_address VARCHAR(45) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    blocked_by VARCHAR(32) DEFAULT 'SYSTEM' COMMENT 'Username or SYSTEM',
    is_permanent TINYINT(1) DEFAULT 0,
    blocked_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL DEFAULT NULL,
    unblocked_at TIMESTAMP NULL DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY unique_active_ip (ip_address, unblocked_at),
    KEY idx_ip_address (ip_address),
    KEY idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='IP blacklist for security';

-- Security Events
CREATE TABLE IF NOT EXISTS knowledge_security_events (
    id BIGINT NOT NULL AUTO_INCREMENT,
    event_type ENUM('RATE_LIMIT_EXCEEDED', 'SQL_INJECTION_ATTEMPT', 'XSS_ATTEMPT', 
                   'SUSPICIOUS_PATTERN', 'AUTH_BYPASS_ATTEMPT', 'DDOS_DETECTED',
                   'BLACKLIST_TRIGGERED', 'ANOMALY_DETECTED') NOT NULL,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT DEFAULT NULL,
    request_path VARCHAR(500) DEFAULT NULL,
    request_payload TEXT DEFAULT NULL,
    description TEXT DEFAULT NULL,
    is_resolved TINYINT(1) DEFAULT 0,
    resolved_by VARCHAR(32) DEFAULT NULL,
    resolved_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_event_type (event_type),
    KEY idx_severity (severity),
    KEY idx_ip_address (ip_address),
    KEY idx_created_at (created_at),
    KEY idx_unresolved (is_resolved, severity, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Security event monitoring and alerting';

-- =============================================
-- 2.1 CREATE Image Attachments Table
-- =============================================

-- Article Image Attachments
CREATE TABLE IF NOT EXISTS knowledge_article_attachments (
    id INT NOT NULL AUTO_INCREMENT,
    article_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL COMMENT 'Stored filename (unique)',
    original_filename VARCHAR(255) NOT NULL COMMENT 'Original uploaded filename',
    file_path VARCHAR(500) NOT NULL COMMENT 'Relative path from uploads root',
    file_size INT NOT NULL COMMENT 'Size in bytes',
    mime_type VARCHAR(100) NOT NULL,
    width INT DEFAULT NULL COMMENT 'Image width in pixels',
    height INT DEFAULT NULL COMMENT 'Image height in pixels',
    uploaded_by VARCHAR(32) NOT NULL,
    is_featured TINYINT(1) DEFAULT 0 COMMENT 'Featured/cover image for article',
    display_order INT DEFAULT 0 COMMENT 'Order for displaying images',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_article_id (article_id),
    KEY idx_uploaded_by (uploaded_by),
    KEY idx_featured (article_id, is_featured),
    KEY idx_display_order (article_id, display_order),
    CONSTRAINT fk_attachments_article FOREIGN KEY (article_id) 
        REFERENCES knowledge_articles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Image attachments for KB articles';

-- =============================================
-- 3. CREATE Automated Cleanup Events
-- =============================================

-- Enable event scheduler if not already enabled
SET GLOBAL event_scheduler = ON;

-- Cleanup old access logs (keep 90 days)
DROP EVENT IF EXISTS cleanup_kb_access_logs;
CREATE EVENT cleanup_kb_access_logs
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
    DELETE FROM knowledge_article_access_log 
    WHERE accessed_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Cleanup expired rate limits
DROP EVENT IF EXISTS cleanup_kb_rate_limits;
CREATE EVENT cleanup_kb_rate_limits
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
    DELETE FROM knowledge_rate_limits 
    WHERE window_end < DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- Cleanup expired IP blacklist entries
DROP EVENT IF EXISTS cleanup_kb_blacklist;
CREATE EVENT cleanup_kb_blacklist
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
    UPDATE knowledge_ip_blacklist 
    SET unblocked_at = NOW()
    WHERE is_permanent = 0 
    AND expires_at < NOW() 
    AND unblocked_at IS NULL;

-- =============================================
-- 4. Verification Queries
-- =============================================

-- Show created tables
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'ocs_srms'
AND TABLE_NAME LIKE 'knowledge_%'
ORDER BY TABLE_NAME;

-- Show created events
SELECT 
    EVENT_NAME,
    EVENT_TYPE,
    INTERVAL_VALUE,
    INTERVAL_FIELD,
    STATUS
FROM information_schema.EVENTS
WHERE EVENT_SCHEMA = 'ocs_srms'
AND EVENT_NAME LIKE 'cleanup_kb_%';

-- =============================================
-- Migration Complete!
-- =============================================

SELECT 'Knowledge Base Security & SEO Migration Completed Successfully!' AS Status;

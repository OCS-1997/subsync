
import appDB from './db/subsyncDB.js';

import dotenv from 'dotenv';
dotenv.config();

/**
 * Migration Script: Knowledge Base Security & SEO Enhancement
 * 
 * This script adds:
 * - Read tracking and analytics tables
 * - SEO metadata fields to articles
 * - Security monitoring and access control tables
 * - Performance indexes
 */

const runMigration = async () => {
    const connection = await appDB.getConnection();

    try {
        console.log("Starting Knowledge Base Security & SEO Migration...\n");
        await connection.beginTransaction();

        // ============================================================
        // 1. ALTER EXISTING knowledge_articles TABLE
        // ============================================================
        console.log("1. Adding SEO and analytics fields to knowledge_articles...");

        await connection.query(`
            ALTER TABLE knowledge_articles
            ADD COLUMN IF NOT EXISTS meta_title VARCHAR(60) DEFAULT NULL COMMENT 'SEO meta title (max 60 chars)',
            ADD COLUMN IF NOT EXISTS meta_description VARCHAR(160) DEFAULT NULL COMMENT 'SEO meta description (max 160 chars)',
            ADD COLUMN IF NOT EXISTS keywords TEXT DEFAULT NULL COMMENT 'SEO keywords (comma-separated)',
            ADD COLUMN IF NOT EXISTS canonical_url VARCHAR(255) DEFAULT NULL COMMENT 'Canonical URL for SEO',
            ADD COLUMN IF NOT EXISTS og_image VARCHAR(500) DEFAULT NULL COMMENT 'Open Graph image URL',
            ADD COLUMN IF NOT EXISTS total_reads INT DEFAULT 0 COMMENT 'Total read count',
            ADD COLUMN IF NOT EXISTS unique_reads INT DEFAULT 0 COMMENT 'Unique visitor count',
            ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Last time article was read'
        `);
        console.log("   ✓ SEO and analytics fields added\n");

        // ============================================================
        // 2. CREATE knowledge_article_reads TABLE
        // ============================================================
        console.log("2. Creating knowledge_article_reads table...");

        await connection.query(`
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
                FOREIGN KEY (article_id) REFERENCES knowledge_articles(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
            COMMENT='Tracks individual article reads for analytics'
        `);
        console.log("   ✓ knowledge_article_reads table created\n");

        // ============================================================
        // 3. CREATE knowledge_article_access_log TABLE
        // ============================================================
        console.log("3. Creating knowledge_article_access_log table...");

        await connection.query(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
            COMMENT='Security audit log for public article access'
        `);
        console.log("   ✓ knowledge_article_access_log table created\n");

        // ============================================================
        // 4. CREATE knowledge_rate_limits TABLE
        // ============================================================
        console.log("4. Creating knowledge_rate_limits table...");

        await connection.query(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
            COMMENT='Rate limiting tracking per IP and endpoint'
        `);
        console.log("   ✓ knowledge_rate_limits table created\n");

        // ============================================================
        // 5. CREATE knowledge_ip_blacklist TABLE
        // ============================================================
        console.log("5. Creating knowledge_ip_blacklist table...");

        await connection.query(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
            COMMENT='IP blacklist for security'
        `);
        console.log("   ✓ knowledge_ip_blacklist table created\n");

        // ============================================================
        // 6. CREATE knowledge_security_events TABLE
        // ============================================================
        console.log("6. Creating knowledge_security_events table...");

        await connection.query(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
            COMMENT='Security event monitoring and alerting'
        `);
        console.log("   ✓ knowledge_security_events table created\n");

        // ============================================================
        // 7. CREATE INDEXES FOR PERFORMANCE
        // ============================================================
        console.log("7. Creating additional performance indexes...");

        // Index for public article queries
        await connection.query(`
            CREATE INDEX IF NOT EXISTS idx_public_articles 
            ON knowledge_articles(visibility, is_published, slug)
        `);

        // Index for SEO sitemap generation
        await connection.query(`
            CREATE INDEX IF NOT EXISTS idx_sitemap 
            ON knowledge_articles(visibility, is_published, updated_at)
        `);

        console.log("   ✓ Performance indexes created\n");

        // ============================================================
        // 8. CREATE CLEANUP EVENTS (Optional - for automatic cleanup)
        // ============================================================
        console.log("8. Creating automatic cleanup events...");

        // Cleanup old access logs (keep 90 days)
        await connection.query(`
            CREATE EVENT IF NOT EXISTS cleanup_kb_access_logs
            ON SCHEDULE EVERY 1 DAY
            DO
                DELETE FROM knowledge_article_access_log 
                WHERE accessed_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
        `);

        // Cleanup expired rate limits
        await connection.query(`
            CREATE EVENT IF NOT EXISTS cleanup_kb_rate_limits
            ON SCHEDULE EVERY 1 HOUR
            DO
                DELETE FROM knowledge_rate_limits 
                WHERE window_end < DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `);

        // Cleanup expired IP blacklist entries
        await connection.query(`
            CREATE EVENT IF NOT EXISTS cleanup_kb_blacklist
            ON SCHEDULE EVERY 1 HOUR
            DO
                UPDATE knowledge_ip_blacklist 
                SET unblocked_at = NOW()
                WHERE is_permanent = 0 
                AND expires_at < NOW() 
                AND unblocked_at IS NULL
        `);

        console.log("   ✓ Cleanup events created\n");

        await connection.commit();
        console.log("✅ Migration completed successfully!\n");

        // Display summary
        console.log("=".repeat(60));
        console.log("MIGRATION SUMMARY");
        console.log("=".repeat(60));
        console.log("Tables Created/Modified:");
        console.log("  • knowledge_articles (altered - added SEO fields)");
        console.log("  • knowledge_article_reads (new)");
        console.log("  • knowledge_article_access_log (new)");
        console.log("  • knowledge_rate_limits (new)");
        console.log("  • knowledge_ip_blacklist (new)");
        console.log("  • knowledge_security_events (new)");
        console.log("\nIndexes Created:");
        console.log("  • Performance indexes for public queries");
        console.log("  • SEO sitemap generation indexes");
        console.log("\nAutomated Tasks:");
        console.log("  • Access log cleanup (90 days retention)");
        console.log("  • Rate limit cleanup (24 hours)");
        console.log("  • Blacklist expiration cleanup");
        console.log("=".repeat(60));

        process.exit(0);
    } catch (error) {
        await connection.rollback();
        console.error("\n❌ Migration failed:", error);
        console.error("\nStack trace:", error.stack);
        process.exit(1);
    } finally {
        connection.release();
    }
};

// Run migration
runMigration();

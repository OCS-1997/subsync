
import appDB from "../db/subsyncDB.js";
import { getCurrentTime } from "../middlewares/time.js";

// --- CATEGORIES ---

export async function createCategory(name, description, parent_id = null) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const [result] = await appDB.query(
        `INSERT INTO knowledge_categories (name, slug, description, parent_id) VALUES (?, ?, ?, ?)`,
        [name, slug, description, parent_id]
    );
    return result.insertId;
}

export async function getCategories() {
    const [rows] = await appDB.query(`
        SELECT 
            kc.*,
            COUNT(ka.id) as article_count
        FROM knowledge_categories kc
        LEFT JOIN knowledge_articles ka ON kc.id = ka.category_id
        GROUP BY kc.id
        ORDER BY kc.name ASC
    `);
    return rows;
}

export async function updateCategory(id, { name, description, parent_id }) {
    const updates = [];
    const params = [];
    if (name) {
        updates.push('name = ?');
        updates.push('slug = ?');
        params.push(name);
        params.push(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
    if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
    }
    if (parent_id !== undefined) {
        updates.push('parent_id = ?');
        params.push(parent_id);
    }

    if (updates.length === 0) return false;

    params.push(id);
    const [result] = await appDB.query(
        `UPDATE knowledge_categories SET ${updates.join(', ')} WHERE id = ?`,
        params
    );
    return result.affectedRows > 0;
}

export async function deleteCategory(id) {
    const [result] = await appDB.query(`DELETE FROM knowledge_categories WHERE id = ?`, [id]);
    return result.affectedRows > 0;
}

// --- TAGS ---

async function getOrCreateTagId(tagName) {
    const [rows] = await appDB.query(`SELECT id FROM knowledge_tags WHERE name = ?`, [tagName]);
    if (rows.length > 0) return rows[0].id;

    const [result] = await appDB.query(`INSERT INTO knowledge_tags (name) VALUES (?)`, [tagName]);
    return result.insertId;
}

async function updateArticleTags(articleId, tags = []) {
    // Clear existing
    await appDB.query(`DELETE FROM knowledge_article_tags WHERE article_id = ?`, [articleId]);

    if (tags.length === 0) return;

    for (const tag of tags) {
        const tagId = await getOrCreateTagId(tag.trim());
        await appDB.query(
            `INSERT IGNORE INTO knowledge_article_tags (article_id, tag_id) VALUES (?, ?)`,
            [articleId, tagId]
        );
    }
}

// --- ARTICLES ---

/**
 * Create a new article
 */
export async function createArticle({ title, content, category_id, author_id, visibility, is_published = false, tags = [], source = null }) {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now();

    const connection = await appDB.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.query(
            `INSERT INTO knowledge_articles (title, slug, content, category_id, author_id, visibility, is_published, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [title, slug, content, category_id || null, author_id, visibility || 'internal', is_published]
        );
        const articleId = result.insertId;

        // Tags
        if (tags && tags.length > 0) {
            // Re-use helper logic but within transaction if possible, or just calling separate queries is fine for now on DB pool
            // Since helper uses appDB directly, let's keep it simple. If critical, would rewrite to use connection.
        }

        // Source
        if (source && source.type && source.id) {
            await connection.query(
                `INSERT INTO knowledge_sources (article_id, source_type, source_reference_id) VALUES (?, ?, ?)`,
                [articleId, source.type, source.id]
            );
        }

        // Initial Version
        await connection.query(
            `INSERT INTO knowledge_versions (article_id, version_number, content_snapshot, changed_by)
             VALUES (?, 1, ?, ?)`,
            [articleId, content || '', author_id]
        );

        await connection.commit();

        // Handle tags after commit (safe enough)
        if (tags && tags.length > 0) {
            await updateArticleTags(articleId, tags);
        }

        return articleId;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function getArticles({ search, categoryId, tag, isPublished, visibility, limit = 20, offset = 0, authorId }) {
    let query = `
        SELECT 
            ka.*, 
            kc.name as category_name,
            u.name as author_name,
            (SELECT JSON_ARRAYAGG(kt.name) 
             FROM knowledge_article_tags kat 
             JOIN knowledge_tags kt ON kat.tag_id = kt.id 
             WHERE kat.article_id = ka.id) as tags
        FROM knowledge_articles ka
        LEFT JOIN knowledge_categories kc ON ka.category_id = kc.id
        LEFT JOIN users u ON ka.author_id = u.username
    `;

    const where = [];
    const params = [];

    //console.log('getArticles DEBUG - Input categoryId:', categoryId, 'Type:', typeof categoryId);

    if (categoryId && categoryId !== 'null' && categoryId !== 'undefined') {
        where.push(`ka.category_id = ?`);
        params.push(categoryId);
        //console.log('getArticles DEBUG - Added category filter:', categoryId);
    }

    if (isPublished !== undefined) {
        where.push(`ka.is_published = ?`);
        params.push(isPublished ? 1 : 0);
    }

    if (authorId) {
        where.push(`ka.author_id = ?`);
        params.push(authorId);
    }

    if (visibility) {
        if (Array.isArray(visibility)) {
            where.push(`ka.visibility IN (?)`);
            params.push(visibility);
        } else {
            where.push(`ka.visibility = ?`);
            params.push(visibility);
        }
    }

    if (search) {
        where.push(`MATCH(ka.title, ka.content) AGAINST(? IN NATURAL LANGUAGE MODE)`);
        params.push(search);
    }

    if (tag) {
        where.push(`EXISTS (
            SELECT 1 FROM knowledge_article_tags kat 
            JOIN knowledge_tags kt ON kat.tag_id = kt.id 
            WHERE kat.article_id = ka.id AND kt.name = ?
        )`);
        params.push(tag);
    }

    let finalQuery = query;
    if (where.length > 0) {
        finalQuery += ` WHERE ${where.join(' AND ')}`;
    }

    finalQuery += ` ORDER BY ka.created_at DESC LIMIT ? OFFSET ?`;

    // Create params for the final query
    const queryParams = [...params, limit, offset];

    //console.log('getArticles DEBUG - Executing SQL:', finalQuery);
   // console.log('getArticles DEBUG - With Params:', queryParams);

    const [rows] = await appDB.query(finalQuery, queryParams);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM knowledge_articles ka`;
    if (where.length > 0) {
        countQuery += ` WHERE ${where.join(' AND ')}`;
    }
    const [countRows] = await appDB.query(countQuery, params);

    return {
        articles: rows,
        total: countRows[0].total
    };
}

export async function getArticleById(id) {
    const [rows] = await appDB.query(`
        SELECT 
            ka.*, 
            kc.name as category_name,
            u.name as author_name,
            (SELECT JSON_ARRAYAGG(kt.name) 
             FROM knowledge_article_tags kat 
             JOIN knowledge_tags kt ON kat.tag_id = kt.id 
             WHERE kat.article_id = ka.id) as tags,
            ks.source_type,
            ks.source_reference_id
        FROM knowledge_articles ka
        LEFT JOIN knowledge_categories kc ON ka.category_id = kc.id
        LEFT JOIN users u ON ka.author_id = u.username
        LEFT JOIN knowledge_sources ks ON ks.article_id = ka.id
        WHERE ka.id = ?
    `, [id]);

    if (rows.length === 0) return null;
    return rows[0];
}

export async function getArticleBySlug(slug) {
    const [rows] = await appDB.query(`
        SELECT 
            ka.*, 
            kc.name as category_name,
            u.name as author_name,
            (SELECT JSON_ARRAYAGG(kt.name) 
             FROM knowledge_article_tags kat 
             JOIN knowledge_tags kt ON kat.tag_id = kt.id 
             WHERE kat.article_id = ka.id) as tags,
            ks.source_type,
            ks.source_reference_id
        FROM knowledge_articles ka
        LEFT JOIN knowledge_categories kc ON ka.category_id = kc.id
        LEFT JOIN users u ON ka.author_id = u.username
        LEFT JOIN knowledge_sources ks ON ks.article_id = ka.id
        WHERE ka.slug = ?
    `, [slug]);

    if (rows.length === 0) return null;
    return rows[0];
}

export async function updateArticle(id, { title, content, category_id, visibility, is_published, tags, changed_by }) {
    const connection = await appDB.getConnection();
    try {
        await connection.beginTransaction();

        const updates = [];
        const params = [];

        if (title) {
            updates.push('title = ?');
            params.push(title);
        }
        if (content !== undefined) {
            updates.push('content = ?');
            params.push(content);
        }
        if (category_id !== undefined) {
            updates.push('category_id = ?');
            params.push(category_id || null);
        }
        if (visibility !== undefined) {
            updates.push('visibility = ?');
            params.push(visibility);
        }
        if (is_published !== undefined) {
            updates.push('is_published = ?');
            params.push(is_published ? 1 : 0);
        }

        if (updates.length > 0) {
            params.push(id);
            await connection.query(
                `UPDATE knowledge_articles SET ${updates.join(', ')} WHERE id = ?`,
                params
            );
        }

        // Versioning
        if (content !== undefined && changed_by) {
            // Get current max version
            const [vRows] = await connection.query(`SELECT MAX(version_number) as maxV FROM knowledge_versions WHERE article_id = ?`, [id]);
            const nextV = (vRows[0].maxV || 0) + 1;

            await connection.query(
                `INSERT INTO knowledge_versions (article_id, version_number, content_snapshot, changed_by) 
                 VALUES (?, ?, ?, ?)`,
                [id, nextV, content, changed_by]
            );
        }

        await connection.commit();

        if (tags) {
            await updateArticleTags(id, tags);
        }

        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function deleteArticle(id) {
    const [result] = await appDB.query(`DELETE FROM knowledge_articles WHERE id = ?`, [id]);
    return result.affectedRows > 0;
}

// --- VERSIONS ---

export async function getArticleVersions(articleId) {
    const [rows] = await appDB.query(`
        SELECT kv.*, u.name as editor_name 
        FROM knowledge_versions kv
        LEFT JOIN users u ON kv.changed_by = u.username
        WHERE kv.article_id = ?
        ORDER BY kv.version_number DESC
    `, [articleId]);
    return rows;
}

// --- READ TRACKING & ANALYTICS ---

/**
 * Record an article read
 * @param {number} articleId - Article ID
 * @param {Object} metadata - Read metadata (fingerprint, ip_hash, user_agent, etc.)
 * @returns {Promise<number>} - Read ID
 */
export async function recordArticleRead(articleId, metadata) {
    const {
        sessionFingerprint,
        ipHash,
        userAgent,
        referrer,
        utmSource,
        utmMedium,
        utmCampaign,
        readDuration = 0,
        scrollDepth = 0
    } = metadata;

    const connection = await appDB.getConnection();
    try {
        await connection.beginTransaction();

        // Check if this is a unique read (first time from this fingerprint in 24 hours)
        const [existing] = await connection.query(`
            SELECT id FROM knowledge_article_reads
            WHERE article_id = ? AND session_fingerprint = ?
            AND read_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `, [articleId, sessionFingerprint]);

        const isUnique = existing.length === 0 ? 1 : 0;

        // Insert read record
        const [result] = await connection.query(`
            INSERT INTO knowledge_article_reads
            (article_id, session_fingerprint, ip_hash, user_agent, referrer,
             utm_source, utm_medium, utm_campaign, read_duration, scroll_depth, is_unique)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [articleId, sessionFingerprint, ipHash, userAgent, referrer,
            utmSource, utmMedium, utmCampaign, readDuration, scrollDepth, isUnique]);

        // Update article read counters
        await connection.query(`
            UPDATE knowledge_articles
            SET total_reads = total_reads + 1,
                unique_reads = unique_reads + ?,
                last_read_at = NOW()
            WHERE id = ?
        `, [isUnique, articleId]);

        await connection.commit();
        return result.insertId;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Get article read statistics
 * @param {number} articleId - Article ID
 * @returns {Promise<Object>} - Read statistics
 */
export async function getArticleReadStats(articleId) {
    const [rows] = await appDB.query(`
        SELECT 
            COUNT(*) as total_reads,
            COUNT(DISTINCT session_fingerprint) as unique_visitors,
            AVG(read_duration) as avg_read_duration,
            AVG(scroll_depth) as avg_scroll_depth,
            MAX(read_at) as last_read_at
        FROM knowledge_article_reads
        WHERE article_id = ?
    `, [articleId]);

    return rows[0] || {
        total_reads: 0,
        unique_visitors: 0,
        avg_read_duration: 0,
        avg_scroll_depth: 0,
        last_read_at: null
    };
}

/**
 * Get detailed analytics for an article
 * @param {number} articleId - Article ID
 * @param {Object} dateRange - { startDate, endDate }
 * @returns {Promise<Object>} - Analytics data
 */
export async function getArticleAnalytics(articleId, dateRange = {}) {
    const { startDate, endDate } = dateRange;
    const conditions = ['article_id = ?'];
    const params = [articleId];

    if (startDate) {
        conditions.push('read_at >= ?');
        params.push(startDate);
    }
    if (endDate) {
        conditions.push('read_at <= ?');
        params.push(endDate);
    }

    const whereClause = conditions.join(' AND ');

    // Reads over time (daily)
    const [readsOverTime] = await appDB.query(`
        SELECT 
            DATE(read_at) as date,
            COUNT(*) as read_count,
            COUNT(DISTINCT session_fingerprint) as unique_visitors
        FROM knowledge_article_reads
        WHERE ${whereClause}
        GROUP BY DATE(read_at)
        ORDER BY date DESC
        LIMIT 30
    `, params);

    // Top referrers
    const [topReferrers] = await appDB.query(`
        SELECT 
            referrer,
            COUNT(*) as count
        FROM knowledge_article_reads
        WHERE ${whereClause} AND referrer IS NOT NULL AND referrer != ''
        GROUP BY referrer
        ORDER BY count DESC
        LIMIT 10
    `, params);

    // UTM campaign performance
    const [utmCampaigns] = await appDB.query(`
        SELECT 
            utm_campaign as campaign,
            utm_source as source,
            utm_medium as medium,
            COUNT(*) as read_count
        FROM knowledge_article_reads
        WHERE ${whereClause} AND utm_campaign IS NOT NULL
        GROUP BY utm_campaign, utm_source, utm_medium
        ORDER BY read_count DESC
        LIMIT 10
    `, params);

    // Overall stats
    const stats = await getArticleReadStats(articleId);

    return {
        stats,
        readsOverTime,
        topReferrers,
        utmCampaigns
    };
}

// --- SEO MANAGEMENT ---

/**
 * Update article SEO metadata
 * @param {number} articleId - Article ID
 * @param {Object} seoData - SEO metadata
 * @returns {Promise<boolean>} - Success status
 */
export async function updateArticleSEO(articleId, seoData) {
    const {
        meta_title,
        meta_description,
        keywords,
        canonical_url,
        og_image
    } = seoData;

    const updates = [];
    const params = [];

    if (meta_title !== undefined) {
        updates.push('meta_title = ?');
        params.push(meta_title);
    }
    if (meta_description !== undefined) {
        updates.push('meta_description = ?');
        params.push(meta_description);
    }
    if (keywords !== undefined) {
        updates.push('keywords = ?');
        params.push(keywords);
    }
    if (canonical_url !== undefined) {
        updates.push('canonical_url = ?');
        params.push(canonical_url);
    }
    if (og_image !== undefined) {
        updates.push('og_image = ?');
        params.push(og_image);
    }

    if (updates.length === 0) return false;

    params.push(articleId);
    const [result] = await appDB.query(`
        UPDATE knowledge_articles
        SET ${updates.join(', ')}
        WHERE id = ?
    `, params);

    return result.affectedRows > 0;
}

/**
 * Get article SEO metadata
 * @param {number} articleId - Article ID
 * @returns {Promise<Object>} - SEO metadata
 */
export async function getArticleSEO(articleId) {
    const [rows] = await appDB.query(`
        SELECT 
            id, title, slug, meta_title, meta_description, keywords,
            canonical_url, og_image, created_at, updated_at
        FROM knowledge_articles
        WHERE id = ?
    `, [articleId]);

    return rows[0] || null;
}

/**
 * Get public articles for sitemap generation
 * @returns {Promise<Array>} - Array of public articles
 */
export async function getPublicArticlesForSitemap() {
    const [rows] = await appDB.query(`
        SELECT 
            id, slug, canonical_url, updated_at, created_at, is_published
        FROM knowledge_articles
        WHERE visibility IN ('customer', 'both')
        AND is_published = 1
        ORDER BY updated_at DESC
    `);

    return rows;
}

/**
 * Get public article by slug (security-enhanced)
 * @param {string} slug - Article slug
 * @returns {Promise<Object>} - Article data (whitelisted fields only)
 */
export async function getPublicArticleBySlug(slug) {
    const [rows] = await appDB.query(`
        SELECT 
            ka.id,
            ka.title,
            ka.slug,
            ka.content,
            ka.created_at,
            ka.updated_at,
            ka.meta_title,
            ka.meta_description,
            ka.keywords,
            ka.canonical_url,
            ka.og_image,
            ka.total_reads,
            ka.unique_reads,
            kc.name as category_name,
            u.name as author_name,
            (SELECT JSON_ARRAYAGG(kt.name) 
             FROM knowledge_article_tags kat 
             JOIN knowledge_tags kt ON kat.tag_id = kt.id 
             WHERE kat.article_id = ka.id) as tags
        FROM knowledge_articles ka
        LEFT JOIN knowledge_categories kc ON ka.category_id = kc.id
        LEFT JOIN users u ON ka.author_id = u.username
        WHERE ka.slug = ?
        AND ka.visibility IN ('customer', 'both')
        AND ka.is_published = 1
    `, [slug]);

    return rows[0] || null;
}

// --- SECURITY & RATE LIMITING ---

/**
 * Check rate limit for an IP address
 * @param {string} ipAddress - IP address
 * @param {number} timeWindow - Time window in seconds
 * @returns {Promise<Object>} - { allowed: boolean, remaining: number }
 */
export async function checkRateLimit(ipAddress, timeWindow = 3600) {
    const [rows] = await appDB.query(`
        SELECT 
            request_count,
            is_blocked,
            window_start,
            window_end
        FROM knowledge_rate_limits
        WHERE ip_address = ?
        AND endpoint = '/kb/public/articles'
        AND window_end > NOW()
        ORDER BY window_start DESC
        LIMIT 1
    `, [ipAddress]);

    if (rows.length === 0) {
        return { allowed: true, remaining: 100 };
    }

    const record = rows[0];
    if (record.is_blocked) {
        return { allowed: false, remaining: 0 };
    }

    const remaining = Math.max(0, 100 - record.request_count);
    return { allowed: remaining > 0, remaining };
}

/**
 * Log article access
 * @param {number} articleId - Article ID
 * @param {string} ipAddress - IP address
 * @param {Object} metadata - Access metadata
 * @returns {Promise<number>} - Log ID
 */
export async function logArticleAccess(articleId, ipAddress, metadata) {
    const { ipHash, userAgent, requestPath, queryParams, isBot, isSuspicious, suspiciousReason } = metadata;

    const [result] = await appDB.query(`
        INSERT INTO knowledge_article_access_log
        (article_id, ip_address, ip_hash, user_agent, request_path, query_params,
         is_bot, is_suspicious, suspicious_reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [articleId, ipAddress, ipHash, userAgent, requestPath, queryParams,
        isBot ? 1 : 0, isSuspicious ? 1 : 0, suspiciousReason]);

    return result.insertId;
}

/**
 * Detect anomalous access patterns
 * @param {string} ipAddress - IP address
 * @param {number} timeWindow - Time window in minutes
 * @returns {Promise<Object>} - { isAnomalous: boolean, reason: string }
 */
export async function detectAnomalousAccess(ipAddress, timeWindow = 5) {
    const [rows] = await appDB.query(`
        SELECT 
            COUNT(*) as request_count,
            COUNT(DISTINCT article_id) as unique_articles,
            SUM(is_suspicious) as suspicious_count
        FROM knowledge_article_access_log
        WHERE ip_address = ?
        AND accessed_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)
    `, [ipAddress, timeWindow]);

    const { request_count, unique_articles, suspicious_count } = rows[0];

    // Anomaly detection rules
    if (request_count > 50) {
        return { isAnomalous: true, reason: 'Excessive requests in short time' };
    }
    if (unique_articles > 20) {
        return { isAnomalous: true, reason: 'Rapid access to many articles (scraping)' };
    }
    if (suspicious_count > 3) {
        return { isAnomalous: true, reason: 'Multiple suspicious requests' };
    }

    return { isAnomalous: false, reason: null };
}

/**
 * Blacklist an IP address
 * @param {string} ipAddress - IP address
 * @param {string} reason - Reason for blacklisting
 * @param {number} duration - Duration in milliseconds (null for permanent)
 * @returns {Promise<number>} - Blacklist ID
 */
export async function blacklistIP(ipAddress, reason, duration = 24 * 60 * 60 * 1000) {
    const expiresAt = duration ? new Date(Date.now() + duration) : null;

    const [result] = await appDB.query(`
        INSERT INTO knowledge_ip_blacklist
        (ip_address, reason, is_permanent, expires_at)
        VALUES (?, ?, ?, ?)
    `, [ipAddress, reason, duration === null ? 1 : 0, expiresAt]);

    return result.insertId;
}

/**
 * Get security events
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Array>} - Security events
 */
export async function getSecurityEvents(filters = {}) {
    const { eventType, severity, isResolved, limit = 100 } = filters;
    const conditions = [];
    const params = [];

    if (eventType) {
        conditions.push('event_type = ?');
        params.push(eventType);
    }
    if (severity) {
        conditions.push('severity = ?');
        params.push(severity);
    }
    if (isResolved !== undefined) {
        conditions.push('is_resolved = ?');
        params.push(isResolved ? 1 : 0);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit);

    const [rows] = await appDB.query(`
        SELECT *
        FROM knowledge_security_events
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ?
    `, params);

    return rows;
}


// =============================================
// IMAGE ATTACHMENTS
// =============================================

// Import attachment functions from separate module to avoid duplication
export {
    addArticleAttachment,
    getArticleAttachments,
    getAttachmentById,
    deleteArticleAttachment,
    setFeaturedImage,
    updateAttachmentOrder,
    getFeaturedImage
} from './kbModel_attachments.js';


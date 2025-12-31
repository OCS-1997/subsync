
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
export async function createArticle({ title, content, category_id, author_id, is_published = false, tags = [], source = null }) {
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

    if (categoryId) {
        where.push(`ka.category_id = ?`);
        params.push(categoryId);
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

    if (where.length > 0) {
        query += ` WHERE ${where.join(' AND ')}`;
    }

    query += ` ORDER BY ka.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await appDB.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM knowledge_articles ka`;
    if (where.length > 0) {
        // Remove MATCH for count if it's too heavy? Or keep it for accuracy. 
        // Re-construct where/params for count
        countQuery += ` WHERE ${where.join(' AND ')}`;
    }
    const [countRows] = await appDB.query(countQuery, params.slice(0, params.length - 2));

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

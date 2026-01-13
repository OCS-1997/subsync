import appDB from '../db/subsyncDB.js';

// =============================================
// IMAGE ATTACHMENTS
// =============================================

/**
 * Add image attachment to article
 */
export async function addArticleAttachment(articleId, attachmentData) {
    const {
        filename,
        originalFilename,
        filePath,
        fileSize,
        mimeType,
        width,
        height,
        uploadedBy
    } = attachmentData;

    // Get current max display_order
    const [orderResult] = await appDB.query(
        `SELECT COALESCE(MAX(display_order), -1) + 1 as next_order
         FROM knowledge_article_attachments
         WHERE article_id = ?`,
        [articleId]
    );
    const displayOrder = orderResult[0].next_order;

    const [result] = await appDB.query(
        `INSERT INTO knowledge_article_attachments
         (article_id, filename, original_filename, file_path, file_size, mime_type, 
          width, height, uploaded_by, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [articleId, filename, originalFilename, filePath, fileSize, mimeType,
            width, height, uploadedBy, displayOrder]
    );

    return result.insertId;
}

/**
 * Get all attachments for an article
 */
export async function getArticleAttachments(articleId) {
    const [rows] = await appDB.query(
        `SELECT id, article_id, filename, original_filename, file_path, file_size,
                mime_type, width, height, uploaded_by, is_featured, display_order,
                created_at
         FROM knowledge_article_attachments
         WHERE article_id = ?
         ORDER BY display_order ASC, created_at ASC`,
        [articleId]
    );

    return rows;
}

/**
 * Get single attachment by ID
 */
export async function getAttachmentById(attachmentId) {
    const [rows] = await appDB.query(
        `SELECT * FROM knowledge_article_attachments WHERE id = ?`,
        [attachmentId]
    );

    return rows[0] || null;
}

/**
 * Delete article attachment
 */
export async function deleteArticleAttachment(attachmentId) {
    const [result] = await appDB.query(
        `DELETE FROM knowledge_article_attachments WHERE id = ?`,
        [attachmentId]
    );

    return result.affectedRows > 0;
}

/**
 * Set featured image for article
 */
export async function setFeaturedImage(articleId, attachmentId) {
    // First, unset all featured images for this article
    await appDB.query(
        `UPDATE knowledge_article_attachments
         SET is_featured = 0
         WHERE article_id = ?`,
        [articleId]
    );

    // Then set the new featured image
    const [result] = await appDB.query(
        `UPDATE knowledge_article_attachments
         SET is_featured = 1
         WHERE id = ? AND article_id = ?`,
        [attachmentId, articleId]
    );

    return result.affectedRows > 0;
}

/**
 * Update display order of attachments
 */
export async function updateAttachmentOrder(articleId, orderedIds) {
    const connection = await appDB.getConnection();

    try {
        await connection.beginTransaction();

        // Update each attachment's display_order
        for (let i = 0; i < orderedIds.length; i++) {
            await connection.query(
                `UPDATE knowledge_article_attachments
                 SET display_order = ?
                 WHERE id = ? AND article_id = ?`,
                [i, orderedIds[i], articleId]
            );
        }

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Get featured image for article
 */
export async function getFeaturedImage(articleId) {
    const [rows] = await appDB.query(
        `SELECT * FROM knowledge_article_attachments
         WHERE article_id = ? AND is_featured = 1
         LIMIT 1`,
        [articleId]
    );

    return rows[0] || null;
}

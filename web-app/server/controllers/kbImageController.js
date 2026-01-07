import {
    addArticleAttachment,
    getArticleAttachments,
    getAttachmentById,
    deleteArticleAttachment,
    setFeaturedImage,
    updateAttachmentOrder
} from '../models/kbModel.js';
import { getImageDimensions, deleteUploadedFile } from '../middlewares/uploadMiddleware.js';
import { logActivity } from '../models/activityLogModel.js';
import { getClientIp } from '../utils/ipHelper.js';
import path from 'path';

/**
 * Upload article image
 */
export const uploadArticleImageController = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Get image dimensions
        const dimensions = await getImageDimensions(req.file.path);

        // Save attachment to database
        const attachmentId = await addArticleAttachment(id, {
            filename: req.file.filename,
            originalFilename: req.file.originalname,
            filePath: `uploads/kb/images/${req.file.filename}`,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            width: dimensions.width,
            height: dimensions.height,
            uploadedBy: req.user.username
        });

        await logActivity({
            username: req.user.username,
            action: 'UPLOAD_KB_IMAGE',
            resourceType: 'KB_ARTICLE',
            resourceId: id,
            details: { filename: req.file.originalname, attachmentId },
            ipAddress: getClientIp(req)
        });

        res.status(201).json({
            message: 'Image uploaded successfully',
            attachment: {
                id: attachmentId,
                filename: req.file.filename,
                originalFilename: req.file.originalname,
                filePath: `uploads/kb/images/${req.file.filename}`,
                // Return the URL path that can be used directly in the editor
                url: `/api/uploads/kb/images/${req.file.filename}`,
                fileSize: req.file.size,
                ...dimensions
            }
        });
    } catch (error) {
        console.error('Upload image error:', error);
        // Delete uploaded file if database save fails
        if (req.file) {
            deleteUploadedFile(req.file.path);
        }
        res.status(500).json({ error: 'Failed to upload image' });
    }
};

/**
 * Get article images
 */
export const getArticleImagesController = async (req, res) => {
    try {
        const { id } = req.params;
        const images = await getArticleAttachments(id);

        // console.log(`Fetching images for article ${id}:`, images);
        // console.log(`Number of images found: ${images.length}`);

        res.status(200).json({ images });
    } catch (error) {
        console.error('Get images error:', error);
        res.status(500).json({ error: 'Failed to fetch images' });
    }
};

/**
 * Delete article image
 */
export const deleteArticleImageController = async (req, res) => {
    try {
        const { id, imageId } = req.params;

        // Get attachment details first
        const attachment = await getAttachmentById(imageId);
        if (!attachment) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Verify attachment belongs to this article
        if (attachment.article_id !== parseInt(id)) {
            return res.status(403).json({ error: 'Image does not belong to this article' });
        }

        // Delete from database
        const deleted = await deleteArticleAttachment(imageId);
        if (!deleted) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Delete physical file
        const filePath = path.join(process.cwd(), attachment.file_path);
        deleteUploadedFile(filePath);

        await logActivity({
            username: req.user.username,
            action: 'DELETE_KB_IMAGE',
            resourceType: 'KB_ARTICLE',
            resourceId: id,
            details: { filename: attachment.original_filename, imageId },
            ipAddress: getClientIp(req)
        });

        res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
};

/**
 * Set featured image
 */
export const setFeaturedImageController = async (req, res) => {
    try {
        const { id, imageId } = req.params;

        // Verify attachment exists and belongs to article
        const attachment = await getAttachmentById(imageId);
        if (!attachment || attachment.article_id !== parseInt(id)) {
            return res.status(404).json({ error: 'Image not found' });
        }

        const success = await setFeaturedImage(id, imageId);
        if (!success) {
            return res.status(500).json({ error: 'Failed to set featured image' });
        }

        await logActivity({
            username: req.user.username,
            action: 'SET_FEATURED_KB_IMAGE',
            resourceType: 'KB_ARTICLE',
            resourceId: id,
            details: { imageId },
            ipAddress: getClientIp(req)
        });

        res.status(200).json({ message: 'Featured image set successfully' });
    } catch (error) {
        console.error('Set featured image error:', error);
        res.status(500).json({ error: 'Failed to set featured image' });
    }
};

/**
 * Reorder images
 */
export const reorderImagesController = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderedIds } = req.body;

        if (!Array.isArray(orderedIds)) {
            return res.status(400).json({ error: 'orderedIds must be an array' });
        }

        await updateAttachmentOrder(id, orderedIds);

        await logActivity({
            username: req.user.username,
            action: 'REORDER_KB_IMAGES',
            resourceType: 'KB_ARTICLE',
            resourceId: id,
            details: { count: orderedIds.length },
            ipAddress: getClientIp(req)
        });

        res.status(200).json({ message: 'Images reordered successfully' });
    } catch (error) {
        console.error('Reorder images error:', error);
        res.status(500).json({ error: 'Failed to reorder images' });
    }
};

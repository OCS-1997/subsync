import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

// Upload configuration
export const UPLOAD_CONFIG = {
    KB_IMAGES: {
        destination: './uploads/kb/images',
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    }
};

// Ensure upload directory exists
const ensureUploadDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = UPLOAD_CONFIG.KB_IMAGES.destination;
        ensureUploadDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `kb-${uniqueSuffix}${ext}`;
        cb(null, filename);
    }
});

// File filter for validation
const fileFilter = (req, file, cb) => {
    const allowedTypes = UPLOAD_CONFIG.KB_IMAGES.allowedMimeTypes;
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = UPLOAD_CONFIG.KB_IMAGES.allowedExtensions;

    if (allowedTypes.includes(file.mimetype) && allowedExts.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Only ${allowedExts.join(', ')} files are allowed.`), false);
    }
};

// Multer upload middleware
export const uploadKBImage = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: UPLOAD_CONFIG.KB_IMAGES.maxFileSize
    }
});

/**
 * Get image dimensions using sharp
 * @param {string} filePath - Path to image file
 * @returns {Promise<{width: number, height: number}>}
 */
export async function getImageDimensions(filePath) {
    try {
        const metadata = await sharp(filePath).metadata();
        return {
            width: metadata.width,
            height: metadata.height
        };
    } catch (error) {
        console.error('Error getting image dimensions:', error);
        return { width: null, height: null };
    }
}

/**
 * Delete uploaded file
 * @param {string} filePath - Path to file to delete
 */
export function deleteUploadedFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
}

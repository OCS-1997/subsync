
import {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
    createArticle,
    getArticles,
    getArticleById,
    getArticleBySlug,
    updateArticle,
    deleteArticle,
    getArticleVersions
} from "../models/kbModel.js";
import { logActivity } from "../models/activityLogModel.js";
import { getDcrEntryById } from "../models/dcrModel.js";

// --- CATEGORIES ---

export const createCategoryController = async (req, res) => {
    try {
        const { name, description, parent_id } = req.body;
        if (!name) return res.status(400).json({ error: "Category name is required" });

        const id = await createCategory(name, description, parent_id);

        await logActivity({
            username: req.user.username,
            action: 'CREATE_KB_CATEGORY',
            resourceType: 'KB_CATEGORY',
            resourceId: id.toString(),
            details: { name }
        });

        res.status(201).json({ id, message: "Category created" });
    } catch (error) {
        console.error("Create category error:", error);
        res.status(500).json({ error: "Failed to create category" });
    }
};

export const getCategoriesController = async (req, res) => {
    try {
        const categories = await getCategories();
        res.status(200).json({ categories });
    } catch (error) {
        console.error("Get categories error:", error);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
};

export const updateCategoryController = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, parent_id } = req.body;

        const success = await updateCategory(id, { name, description, parent_id });
        if (!success) {
            return res.status(404).json({ error: "Category not found" });
        }

        await logActivity({
            username: req.user.username,
            action: 'UPDATE_KB_CATEGORY',
            resourceType: 'KB_CATEGORY',
            resourceId: id,
            details: { name }
        });

        res.status(200).json({ message: "Category updated" });
    } catch (error) {
        console.error("Update category error:", error);
        res.status(500).json({ error: "Failed to update category" });
    }
};

export const deleteCategoryController = async (req, res) => {
    try {
        const { id } = req.params;

        const success = await deleteCategory(id);
        if (!success) {
            return res.status(404).json({ error: "Category not found" });
        }

        await logActivity({
            username: req.user.username,
            action: 'DELETE_KB_CATEGORY',
            resourceType: 'KB_CATEGORY',
            resourceId: id
        });

        res.status(200).json({ message: "Category deleted" });
    } catch (error) {
        console.error("Delete category error:", error);
        res.status(500).json({ error: "Failed to delete category" });
    }
};

// --- DCR TO KB PROMOTION ---

export const createArticleFromDCRController = async (req, res) => {
    try {
        const { dcrId } = req.params;

        // Fetch DCR entry - getDcrEntryById requires user_id and isAdmin for RBAC
        // We'll pass the current user and check if they have admin permissions
        const hasDeletePermission = req.user.permissions?.includes('dcr.delete');
        const dcr = await getDcrEntryById(dcrId, req.user.username, hasDeletePermission);

        if (!dcr) {
            return res.status(404).json({ error: "DCR entry not found or access denied" });
        }

        // Extract keywords from description for tags
        const extractKeywords = (text) => {
            if (!text) return [];
            const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'was', 'are', 'were'];
            const words = text.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter(word => word.length > 3 && !commonWords.includes(word));

            // Get unique words and limit to 5
            return [...new Set(words)].slice(0, 5);
        };

        // Create article content
        // Note: DCR has 'notes' field which contains the description
        const title = `[DCR] Issue from ${dcr.company_name || dcr.domain_name || 'Customer'}`;
        const content = `
            <h2>Call Details</h2>
            <p><strong>Call Type:</strong> ${dcr.call_type || 'N/A'}</p>
            <p><strong>Date:</strong> ${new Date(dcr.timestamp).toLocaleDateString()}</p>
            ${dcr.company_name ? `<p><strong>Company:</strong> ${dcr.company_name}</p>` : ''}
            ${dcr.domain_name ? `<p><strong>Domain:</strong> ${dcr.domain_name}</p>` : ''}
            ${dcr.contact_name ? `<p><strong>Contact:</strong> ${dcr.contact_name}</p>` : ''}
            
            <h2>Issue Description</h2>
            <p>${dcr.notes || 'No description provided'}</p>
            
            <p><em>This article was created from DCR entry #${dcrId}. Please review and add solution details before publishing.</em></p>
        `;

        // Extract tags from notes
        const tags = extractKeywords(dcr.notes || '');
        tags.push('dcr', 'troubleshooting');
        if (dcr.call_type) {
            tags.push(dcr.call_type.replace('-', '_'));
        }

        // Create draft article
        const articleId = await createArticle({
            title,
            content,
            category_id: null,
            author_id: req.user.username,
            is_published: false, // Draft by default
            tags,
            source: { type: 'DCR', id: dcrId }
        });

        await logActivity({
            username: req.user.username,
            action: 'PROMOTE_DCR_TO_KB',
            resourceType: 'KB_ARTICLE',
            resourceId: articleId.toString(),
            details: { dcr_id: dcrId, title }
        });

        res.status(201).json({
            id: articleId,
            message: "DCR promoted to Knowledge Base as draft article"
        });
    } catch (error) {
        console.error("Promote DCR to KB error:", error);
        res.status(500).json({ error: "Failed to promote DCR to Knowledge Base" });
    }
};

// --- ARTICLES ---

export const createArticleController = async (req, res) => {
    try {
        const { title, content, category_id, visibility, is_published, tags, source } = req.body;

        if (!title) return res.status(400).json({ error: "Title is required" });

        const articleId = await createArticle({
            title,
            content,
            category_id,
            author_id: req.user.username,
            visibility,
            is_published,
            tags,
            source
        });

        await logActivity({
            username: req.user.username,
            action: 'CREATE_KB_ARTICLE',
            resourceType: 'KB_ARTICLE',
            resourceId: articleId.toString(),
            details: { title, source }
        });

        res.status(201).json({ id: articleId, message: "Article created successfully" });
    } catch (error) {
        console.error("Create article error:", error);
        res.status(500).json({ error: "Failed to create article" });
    }
};

export const getArticlesController = async (req, res) => {
    try {
        const { search, categoryId, tag, status, visibility, page = 1, limit = 20 } = req.query;

        const isPublished = status === 'published' ? true : (status === 'draft' ? false : undefined);

        const { articles, total } = await getArticles({
            search,
            categoryId,
            tag,
            isPublished,
            visibility,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
        });

        res.status(200).json({
            articles,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error("Get articles error:", error);
        res.status(500).json({ error: "Failed to fetch articles" });
    }
};

export const getArticleByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const article = await getArticleById(id);

        if (!article) return res.status(404).json({ error: "Article not found" });

        res.status(200).json({ article });

        // Increment view count async? TODO if needed
    } catch (error) {
        console.error("Get article error:", error);
        res.status(500).json({ error: "Failed to fetch article" });
    }
};

export const getArticleBySlugController = async (req, res) => {
    try {
        const { slug } = req.params;
        const article = await getArticleBySlug(slug);

        if (!article) return res.status(404).json({ error: "Article not found" });

        // If user is not logged in, check if article is public
        if (!req.user && article.visibility === 'internal') {
            return res.status(403).json({ error: "Access denied" });
        }

        res.status(200).json({ article });
    } catch (error) {
        console.error("Get article by slug error:", error);
        res.status(500).json({ error: "Failed to fetch article" });
    }
};

export const updateArticleController = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category_id, visibility, is_published, tags } = req.body;

        const success = await updateArticle(id, {
            title,
            content,
            category_id,
            visibility,
            is_published,
            tags,
            changed_by: req.user.username
        });

        if (!success) {
            return res.status(404).json({ error: "Article not found" });
        }

        await logActivity({
            username: req.user.username,
            action: 'UPDATE_KB_ARTICLE',
            resourceType: 'KB_ARTICLE',
            resourceId: id,
            details: { title_updated: !!title, content_updated: !!content }
        });

        res.status(200).json({ message: "Article updated successfully" });
    } catch (error) {
        console.error("Update article error:", error);
        res.status(500).json({ error: "Failed to update article" });
    }
};

export const deleteArticleController = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteArticle(id);

        await logActivity({
            username: req.user.username,
            action: 'DELETE_KB_ARTICLE',
            resourceType: 'KB_ARTICLE',
            resourceId: id
        });

        res.status(200).json({ message: "Article deleted" });
    } catch (error) {
        console.error("Delete article error:", error);
        res.status(500).json({ error: "Failed to delete article" });
    }
};

export const getArticleVersionsController = async (req, res) => {
    try {
        const { id } = req.params;
        const versions = await getArticleVersions(id);
        res.status(200).json({ versions });
    } catch (error) {
        console.error("Get versions error:", error);
        res.status(500).json({ error: "Failed to fetch versions" });
    }
};

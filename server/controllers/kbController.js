
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
    getArticleVersions,
    getAllTags,
    // New imports for security & SEO
    recordArticleRead,
    getArticleAnalytics,
    updateArticleSEO,
    getArticleSEO,
    getPublicArticlesForSitemap,
    getPublicArticleBySlug,
    getSecurityEvents
} from "../models/kbModel.js";
import { logActivity } from "../models/activityLogModel.js";
import { getDcrEntryById } from "../models/dcrModel.js";
import { getClientIp } from "../utils/ipHelper.js";
import { generateMetaTags, generateStructuredData, generateSitemap } from "../utils/seoHelper.js";
import { generateFingerprint, hashIP, isBot } from "../utils/securityHelper.js";

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
            details: { name },
            ipAddress: getClientIp(req)
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
            details: { name },
            ipAddress: getClientIp(req)
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
            resourceId: id,
            ipAddress: getClientIp(req)
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
            details: { dcr_id: dcrId, title },
            ipAddress: getClientIp(req)
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
            details: { title, source },
            ipAddress: getClientIp(req)
        });

        res.status(201).json({ id: articleId, message: "Article created successfully" });
    } catch (error) {
        console.error("Create article error:", error);
        res.status(500).json({ error: "Failed to create article" });
    }
};

export const getArticlesController = async (req, res) => {
    try {
        const {
            search,
            category_id,  // Accept snake_case from frontend
            categoryId,   // Also accept camelCase for backward compatibility
            tag,
            status,
            visibility,
            author,       // Accept author parameter
            date_from,    // Accept date filters
            date_to,
            has_dcr,      // Accept DCR filter
            page = 1,
            limit = 20
        } = req.query;

        // Enforce maximum limit to prevent abuse (server-side validation)
        const safeLimit = Math.min(parseInt(limit) || 20, 100);
        const safePage = Math.max(parseInt(page) || 1, 1);

        // Use category_id if provided, otherwise fall back to categoryId
        const finalCategoryId = category_id || categoryId;

        const isPublished = status === 'published' ? true : (status === 'draft' ? false : undefined);

        // console.log('getArticlesController - Filters:', {
        //     search,
        //     categoryId: finalCategoryId,
        //     tag,
        //     status,
        //     isPublished,
        //     visibility,
        //     author,
        //     page: safePage,
        //     limit: safeLimit
        // });

        const { articles, total } = await getArticles({
            search,
            categoryId: finalCategoryId,  // Pass the resolved category ID
            tag,
            isPublished,
            visibility,
            authorId: author,
            limit: safeLimit,
            offset: (safePage - 1) * safeLimit,
        });

        res.status(200).json({
            articles,
            total,
            totalRecords: total,  // Add totalRecords for frontend compatibility
            totalPages: Math.ceil(total / safeLimit),
            currentPage: safePage,
            limit: safeLimit  // Return the actual limit used
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
            details: { title_updated: !!title, content_updated: !!content },
            ipAddress: getClientIp(req)
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
            resourceId: id,
            ipAddress: getClientIp(req)
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

// --- TAGS ---

/**
 * Get all tags with usage count (optimized endpoint)
 */
export const getAllTagsController = async (req, res) => {
    try {
        const { limit = 100 } = req.query;
        const tags = await getAllTags(limit);
        res.status(200).json({ tags, total: tags.length });
    } catch (error) {
        console.error("Get tags error:", error);
        res.status(500).json({ error: "Failed to fetch tags" });
    }
};

// --- PUBLIC ARTICLE ACCESS (SECURITY-ENHANCED) ---

/**
 * Get public article by slug with SEO metadata
 * This endpoint is public and includes security measures
 */
export const getPublicArticleBySlugController = async (req, res) => {
    try {
        const { slug } = req.params;
        const article = await getPublicArticleBySlug(slug);

        if (!article) {
            return res.status(404).json({ error: "Article not found" });
        }

        // Generate SEO metadata
        const seoMeta = generateMetaTags(article);
        const structuredData = generateStructuredData(article);

        res.status(200).json({
            article,
            seo: seoMeta,
            structuredData
        });
    } catch (error) {
        console.error("Get public article error:", error);
        res.status(500).json({ error: "Failed to fetch article" });
    }
};

// --- READ TRACKING ---

/**
 * Record article read (public endpoint)
 */
export const recordArticleReadController = async (req, res) => {
    try {
        const { slug } = req.params;
        const { readDuration, scrollDepth } = req.body;

        // Get article by slug first
        const article = await getPublicArticleBySlug(slug);
        if (!article) {
            return res.status(404).json({ error: "Article not found" });
        }

        // Extract metadata from request
        const ipAddress = getClientIp(req);
        const userAgent = req.get('user-agent') || '';
        const referrer = req.get('referer') || req.get('referrer') || '';

        // Extract UTM parameters
        const utmSource = req.query.utm_source || null;
        const utmMedium = req.query.utm_medium || null;
        const utmCampaign = req.query.utm_campaign || null;

        // Generate anonymous fingerprint
        const sessionFingerprint = generateFingerprint(req);
        const ipHash = hashIP(ipAddress);

        // Record the read
        await recordArticleRead(article.id, {
            sessionFingerprint,
            ipHash,
            userAgent,
            referrer,
            utmSource,
            utmMedium,
            utmCampaign,
            readDuration: readDuration || 0,
            scrollDepth: scrollDepth || 0
        });

        res.status(200).json({ message: "Read recorded successfully" });
    } catch (error) {
        console.error("Record read error:", error);
        // Don't fail the request if tracking fails
        res.status(200).json({ message: "Read tracking unavailable" });
    }
};

// --- ANALYTICS (ADMIN ONLY) ---

/**
 * Get article analytics
 */
export const getArticleAnalyticsController = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;

        const analytics = await getArticleAnalytics(id, {
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null
        });

        res.status(200).json({ analytics });
    } catch (error) {
        console.error("Get analytics error:", error);
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
};

// --- SEO MANAGEMENT (ADMIN ONLY) ---

/**
 * Update article SEO metadata
 */
export const updateArticleSEOController = async (req, res) => {
    try {
        const { id } = req.params;
        const { meta_title, meta_description, keywords, canonical_url, og_image } = req.body;

        const success = await updateArticleSEO(id, {
            meta_title,
            meta_description,
            keywords,
            canonical_url,
            og_image
        });

        if (!success) {
            return res.status(404).json({ error: "Article not found" });
        }

        await logActivity({
            username: req.user.username,
            action: 'UPDATE_KB_ARTICLE_SEO',
            resourceType: 'KB_ARTICLE',
            resourceId: id,
            details: { meta_title, meta_description },
            ipAddress: getClientIp(req)
        });

        res.status(200).json({ message: "SEO metadata updated successfully" });
    } catch (error) {
        console.error("Update SEO error:", error);
        res.status(500).json({ error: "Failed to update SEO metadata" });
    }
};

/**
 * Get article SEO metadata
 */
export const getArticleSEOController = async (req, res) => {
    try {
        const { id } = req.params;
        const seoData = await getArticleSEO(id);

        if (!seoData) {
            return res.status(404).json({ error: "Article not found" });
        }

        res.status(200).json({ seo: seoData });
    } catch (error) {
        console.error("Get SEO error:", error);
        res.status(500).json({ error: "Failed to fetch SEO metadata" });
    }
};

// --- SITEMAP GENERATION (PUBLIC) ---

/**
 * Generate XML sitemap for public articles
 */
export const generateSitemapController = async (req, res) => {
    try {
        const articles = await getPublicArticlesForSitemap();
        const sitemap = generateSitemap(articles);

        res.set('Content-Type', 'application/xml');
        res.status(200).send(sitemap);
    } catch (error) {
        console.error("Generate sitemap error:", error);
        res.status(500).json({ error: "Failed to generate sitemap" });
    }
};

// --- SECURITY MONITORING (ADMIN ONLY) ---

/**
 * Get security events
 */
export const getSecurityEventsController = async (req, res) => {
    try {
        const { eventType, severity, isResolved, limit } = req.query;

        const events = await getSecurityEvents({
            eventType,
            severity,
            isResolved: isResolved === 'true' ? true : isResolved === 'false' ? false : undefined,
            limit: limit ? parseInt(limit) : 100
        });

        res.status(200).json({ events });
    } catch (error) {
        console.error("Get security events error:", error);
        res.status(500).json({ error: "Failed to fetch security events" });
    }
};

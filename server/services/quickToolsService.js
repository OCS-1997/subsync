import {
    getToolsForRole,
    getAllTools,
    getToolById,
    createTool,
    updateTool,
    deleteTool
} from '../models/quickToolsModel.js';

/**
 * Validate URL template contains {{domain}} placeholder
 * @param {string} urlTemplate
 * @returns {boolean}
 */
export function validateUrlTemplate(urlTemplate) {
    if (!urlTemplate || typeof urlTemplate !== 'string') {
        return false;
    }
    return urlTemplate.includes('{{domain}}');
}

/**
 * Validate roles_allowed array contains only valid roles
 * @param {Array} rolesAllowed
 * @returns {boolean}
 */
export function validateRolesAllowed(rolesAllowed) {
    const validRoles = ['admin', 'manager', 'sales', 'support', 'viewer'];
    if (!Array.isArray(rolesAllowed) || rolesAllowed.length === 0) {
        return false;
    }
    return rolesAllowed.every(role => validRoles.includes(role));
}

/**
 * Replace {{domain}} placeholder in URL template with actual domain
 * @param {string} urlTemplate
 * @param {string} domain
 * @returns {string}
 */
export function replaceDomain(urlTemplate, domain) {
    if (!urlTemplate || !domain) {
        return urlTemplate;
    }
    return urlTemplate.replace(/\{\{domain\}\}/g, encodeURIComponent(domain));
}

/**
 * Validate and sanitize URL (only allow http/https schemes)
 * @param {string} url
 * @returns {boolean}
 */
export function validateUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Get tools for a specific role
 * @param {string} roleKey
 * @returns {Promise<Array>}
 */
export async function getToolsForUserRole(roleKey) {
    return await getToolsForRole(roleKey);
}

/**
 * Get all tools (admin only)
 * @returns {Promise<Array>}
 */
export async function getAllToolsForAdmin() {
    return await getAllTools();
}

/**
 * Get tool by ID
 * @param {number} toolId
 * @returns {Promise<Object|null>}
 */
export async function getTool(toolId) {
    return await getToolById(toolId);
}

/**
 * Create a new tool with validation
 * @param {Object} toolData
 * @returns {Promise<Object>}
 */
export async function createNewTool(toolData) {
    // Validate URL template
    if (!validateUrlTemplate(toolData.url_template)) {
        throw new Error('URL template must include {{domain}} placeholder');
    }

    // Validate roles_allowed
    if (!validateRolesAllowed(toolData.roles_allowed)) {
        throw new Error('roles_allowed must be a non-empty array containing valid roles: admin, manager, sales, support, viewer');
    }

    // Validate URL format (test with example domain)
    const testUrl = replaceDomain(toolData.url_template, 'example.com');
    if (!validateUrl(testUrl)) {
        throw new Error('URL template must result in a valid http:// or https:// URL');
    }

    return await createTool(toolData);
}

/**
 * Update a tool with validation
 * @param {number} toolId
 * @param {Object} toolData
 * @returns {Promise<boolean>}
 */
export async function updateExistingTool(toolId, toolData) {
    // Check if tool exists
    const existing = await getToolById(toolId);
    if (!existing) {
        throw new Error('Tool not found');
    }

    // Validate URL template if provided
    if (toolData.url_template && !validateUrlTemplate(toolData.url_template)) {
        throw new Error('URL template must include {{domain}} placeholder');
    }

    // Validate roles_allowed if provided
    if (toolData.roles_allowed && !validateRolesAllowed(toolData.roles_allowed)) {
        throw new Error('roles_allowed must be a non-empty array containing valid roles: admin, manager, sales, support, viewer');
    }

    // Validate URL format if url_template is being updated
    if (toolData.url_template) {
        const testUrl = replaceDomain(toolData.url_template, 'example.com');
        if (!validateUrl(testUrl)) {
            throw new Error('URL template must result in a valid http:// or https:// URL');
        }
    }

    return await updateTool(toolId, toolData);
}

/**
 * Delete a tool
 * @param {number} toolId
 * @returns {Promise<boolean>}
 */
export async function deleteExistingTool(toolId) {
    const existing = await getToolById(toolId);
    if (!existing) {
        throw new Error('Tool not found');
    }
    return await deleteTool(toolId);
}

/**
 * Preview URL with test domain
 * @param {string} urlTemplate
 * @param {string} testDomain
 * @returns {string}
 */
export function previewUrl(urlTemplate, testDomain = 'example.com') {
    if (!validateUrlTemplate(urlTemplate)) {
        return '';
    }
    return replaceDomain(urlTemplate, testDomain);
}


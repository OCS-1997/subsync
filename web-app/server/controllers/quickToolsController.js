import {
    getToolsForUserRole,
    getAllToolsForAdmin,
    getTool,
    createNewTool,
    updateExistingTool,
    deleteExistingTool,
    previewUrl
} from '../services/quickToolsService.js';

/**
 * GET /api/quick-tools
 * List tools available to current user role
 */
export const listToolsController = async (req, res) => {
    try {
        const roleKey = req.user.roleKey;
        const tools = await getToolsForUserRole(roleKey);
        res.json(tools);
    } catch (error) {
        console.error('Error fetching quick tools:', error);
        res.status(500).json({ error: 'Failed to fetch quick tools' });
    }
};

/**
 * GET /api/quick-tools/all
 * List all tools (admin only)
 */
export const listAllToolsController = async (req, res) => {
    try {
        const tools = await getAllToolsForAdmin();
        res.json(tools);
    } catch (error) {
        console.error('Error fetching all quick tools:', error);
        res.status(500).json({ error: 'Failed to fetch all quick tools' });
    }
};

/**
 * GET /api/quick-tools/:id
 * Get tool by ID
 */
export const getToolController = async (req, res) => {
    try {
        const { id } = req.params;
        const tool = await getTool(parseInt(id, 10));
        if (!tool) {
            return res.status(404).json({ error: 'Tool not found' });
        }
        res.json(tool);
    } catch (error) {
        console.error('Error fetching quick tool:', error);
        res.status(500).json({ error: 'Failed to fetch quick tool' });
    }
};

/**
 * POST /api/quick-tools
 * Create a new tool (admin only)
 */
export const createToolController = async (req, res) => {
    try {
        const toolData = req.body;
        const result = await createNewTool(toolData);
        res.status(201).json({ message: 'Tool created successfully', tool_id: result.tool_id });
    } catch (error) {
        console.error('Error creating quick tool:', error);
        res.status(400).json({ error: error.message || 'Failed to create quick tool' });
    }
};

/**
 * PUT /api/quick-tools/:id
 * Update a tool (admin only)
 */
export const updateToolController = async (req, res) => {
    try {
        const { id } = req.params;
        const toolData = req.body;
        const result = await updateExistingTool(parseInt(id, 10), toolData);
        if (!result) {
            return res.status(404).json({ error: 'Tool not found' });
        }
        res.json({ message: 'Tool updated successfully' });
    } catch (error) {
        console.error('Error updating quick tool:', error);
        res.status(400).json({ error: error.message || 'Failed to update quick tool' });
    }
};

/**
 * DELETE /api/quick-tools/:id
 * Delete a tool (admin only)
 */
export const deleteToolController = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteExistingTool(parseInt(id, 10));
        if (!result) {
            return res.status(404).json({ error: 'Tool not found' });
        }
        res.json({ message: 'Tool deleted successfully' });
    } catch (error) {
        console.error('Error deleting quick tool:', error);
        res.status(400).json({ error: error.message || 'Failed to delete quick tool' });
    }
};

/**
 * POST /api/quick-tools/preview
 * Preview URL with test domain
 */
export const previewUrlController = async (req, res) => {
    try {
        const { url_template, test_domain } = req.body;
        const preview = previewUrl(url_template, test_domain || 'example.com');
        res.json({ preview_url: preview });
    } catch (error) {
        console.error('Error previewing URL:', error);
        res.status(400).json({ error: 'Failed to preview URL' });
    }
};


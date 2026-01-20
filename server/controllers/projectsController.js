import {
    createProject,
    updateProject,
    deleteProject,
    getAllProjects,
    getProjectById,
    getProjectStats
} from "../models/projectsModel.js";

/**
 * Controller to create a new project
 */
async function createProjectController(req, res) {
    try {
        const userId = req.user.username;
        const projectData = {
            ...req.body,
            created_by: userId
        };

        // Validate required fields
        if (!projectData.project_name) {
            return res.status(400).json({
                error: "project_name is required"
            });
        }

        const projectId = await createProject(projectData);

        res.status(201).json({
            message: "Project created successfully",
            project_id: projectId
        });
    } catch (error) {
        console.error("Error in createProjectController:", error);
        res.status(500).json({ error: error.message || "Failed to create project" });
    }
}

/**
 * Controller to update a project
 */
async function updateProjectController(req, res) {
    try {
        const { id } = req.params;

        await updateProject(id, req.body);

        res.status(200).json({
            message: "Project updated successfully"
        });
    } catch (error) {
        console.error("Error in updateProjectController:", error);
        res.status(500).json({ error: error.message || "Failed to update project" });
    }
}

/**
 * Controller to delete a project
 */
async function deleteProjectController(req, res) {
    try {
        const { id } = req.params;

        await deleteProject(id);

        res.status(200).json({
            message: "Project deleted successfully"
        });
    } catch (error) {
        console.error("Error in deleteProjectController:", error);
        res.status(500).json({ error: error.message || "Failed to delete project" });
    }
}

/**
 * Controller to get all projects
 */
async function getAllProjectsController(req, res) {
    try {
        const {
            search,
            customer_id,
            is_active,
            page,
            limit
        } = req.query;

        const result = await getAllProjects({
            search,
            customerId: customer_id,
            isActive: is_active !== undefined ? is_active === 'true' : undefined,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 50
        });

        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getAllProjectsController:", error);
        res.status(500).json({ error: error.message || "Failed to fetch projects" });
    }
}

/**
 * Controller to get a single project
 */
async function getProjectByIdController(req, res) {
    try {
        const { id } = req.params;

        const project = await getProjectById(id);

        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        res.status(200).json(project);
    } catch (error) {
        console.error("Error in getProjectByIdController:", error);
        res.status(500).json({ error: error.message || "Failed to fetch project" });
    }
}

/**
 * Controller to get project statistics
 */
async function getProjectStatsController(req, res) {
    try {
        const { id } = req.params;

        const stats = await getProjectStats(id);

        res.status(200).json(stats);
    } catch (error) {
        console.error("Error in getProjectStatsController:", error);
        res.status(500).json({ error: error.message || "Failed to fetch project stats" });
    }
}

export {
    createProjectController,
    updateProjectController,
    deleteProjectController,
    getAllProjectsController,
    getProjectByIdController,
    getProjectStatsController
};

import {
    createCategory,
    updateCategory,
    deleteCategory,
    getAllCategories,
    getCategoryById,
    getCategoryStats
} from "../models/categoriesModel.js";

/**
 * Controller to create a new activity category
 */
async function createCategoryController(req, res) {
    try {
        const categoryData = req.body;

        // Validate required fields
        if (!categoryData.type_name || !categoryData.type_code) {
            return res.status(400).json({
                error: "type_name and type_code are required"
            });
        }

        const categoryId = await createCategory(categoryData);

        res.status(201).json({
            message: "Category created successfully",
            category_id: categoryId
        });
    } catch (error) {
        console.error("Error in createCategoryController:", error);
        res.status(500).json({ error: error.message || "Failed to create category" });
    }
}

/**
 * Controller to update a category
 */
async function updateCategoryController(req, res) {
    try {
        const { id } = req.params;

        await updateCategory(id, req.body);

        res.status(200).json({
            message: "Category updated successfully"
        });
    } catch (error) {
        console.error("Error in updateCategoryController:", error);
        res.status(500).json({ error: error.message || "Failed to update category" });
    }
}

/**
 * Controller to delete a category
 */
async function deleteCategoryController(req, res) {
    try {
        const { id } = req.params;

        await deleteCategory(id);

        res.status(200).json({
            message: "Category deleted successfully"
        });
    } catch (error) {
        console.error("Error in deleteCategoryController:", error);
        res.status(500).json({ error: error.message || "Failed to delete category" });
    }
}

/**
 * Controller to get all categories
 */
async function getAllCategoriesController(req, res) {
    try {
        const {
            search,
            is_active
        } = req.query;

        const categories = await getAllCategories({
            search,
            isActive: is_active !== undefined ? is_active === 'true' : undefined
        });

        res.status(200).json({ categories });
    } catch (error) {
        console.error("Error in getAllCategoriesController:", error);
        res.status(500).json({ error: error.message || "Failed to fetch categories" });
    }
}

/**
 * Controller to get a single category
 */
async function getCategoryByIdController(req, res) {
    try {
        const { id } = req.params;

        const category = await getCategoryById(id);

        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        res.status(200).json(category);
    } catch (error) {
        console.error("Error in getCategoryByIdController:", error);
        res.status(500).json({ error: error.message || "Failed to fetch category" });
    }
}

/**
 * Controller to get category statistics
 */
async function getCategoryStatsController(req, res) {
    try {
        const { id } = req.params;

        const stats = await getCategoryStats(id);

        res.status(200).json(stats);
    } catch (error) {
        console.error("Error in getCategoryStatsController:", error);
        res.status(500).json({ error: error.message || "Failed to fetch category stats" });
    }
}

export {
    createCategoryController,
    updateCategoryController,
    deleteCategoryController,
    getAllCategoriesController,
    getCategoryByIdController,
    getCategoryStatsController
};

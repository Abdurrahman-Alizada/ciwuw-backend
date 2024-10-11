import express from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryDetails,
  updateCategory,
  deleteCategory,
  searchCategories,
  getSubcategories,
} from "../controllers/categoryController";
import verifyToken from "../middleware/verifyToken";

const router = express.Router();

// Create a new  category
router.post("/create", verifyToken, createCategory);

// Get all categories
router.get("/getAll", getAllCategories);

// Get category details by ID
router.get("/getDetails/:id", verifyToken, getCategoryDetails);

// Update category by ID
router.put("/updateCategory/:id", verifyToken, updateCategory);

// Delete category by ID
router.delete("/deleteCategory/:id", verifyToken, deleteCategory);

// Search categories by name or description
router.get("/search", searchCategories);

// Get subcategories by parent category ID
router.get("/subcategories/:parentId", getSubcategories);

export default router;

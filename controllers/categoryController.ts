import { Request, Response } from "express";
import { CategoryInterface, CategoryModel } from "../models/categoryModel";
import ProductModel from "../models/productModel";

// Create Category
const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryData: CategoryInterface = req.body;

    // Validate that the division field is present and valid
    if (!["Men", "Women", "Children"].includes(categoryData.division)) {
      res.status(400).json({
        message: "Division must be either 'Men', 'Women', or 'Children'",
      });
      return;
    }

    const newCategory = new CategoryModel(categoryData);
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get all categories
const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { searchQuery, division } = req.query;
    const searchPattern = searchQuery
      ? new RegExp(searchQuery as string, "i")
      : null;

    const matchConditions: any = {
      parentCategory: { $exists: false },
    };

    // Add search and division conditions if provided
    if (searchPattern) {
      matchConditions.$or = [
        { categoryName: searchPattern },
        { description: searchPattern },
      ];
    }
    if (division && ["Men", "Women", "Children"].includes(division as string)) {
      matchConditions.division = division;
    }

    const categories = await CategoryModel.aggregate([
      { $match: matchConditions },

      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "parentCategory",
          as: "subcategories",
        },
      },
      {
        $project: {
          _id: 1,
          categoryName: 1,
          description: 1,
          division: 1, // Include division field in the response
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
          subcategories: {
            $cond: {
              if: { $gt: [{ $size: "$subcategories" }, 0] },
              then: "$subcategories",
              else: [],
            },
          },
        },
      },
      { $sort: { categoryName: 1 } },
    ]);

    res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get Category Details by ID
const getCategoryDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await CategoryModel.findById(id).populate(
      "parentCategory"
    );
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update Category
const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const categoryData: CategoryInterface = req.body;

    // Validate the division field
    if (
      categoryData.division &&
      !["Men", "Women", "Children"].includes(categoryData.division)
    ) {
      res.status(400).json({
        message: "Division must be either 'Men', 'Women', or 'Children'",
      });
      return;
    }

    const updatedCategory = await CategoryModel.findByIdAndUpdate(
      id,
      categoryData,
      { new: true }
    );
    if (!updatedCategory) {
      res.status(404).json({ message: "Category not found" });
      return;
    }
    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete Category
const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if the category has products associated with it
    const products = await ProductModel.find({ category: id });
    if (products.length > 0) {
      res.status(400).json({ message: "Cannot delete category with products" });
      return;
    }

    const subCategoryProducts = await ProductModel.find({ subCategory: id });
    if (subCategoryProducts.length > 0) {
      res
        .status(400)
        .json({ message: "Cannot delete subcategory with products" });
      return;
    }

    // Delete category and its subcategories
    const deletedCategory = await CategoryModel.findByIdAndDelete(id);
    await CategoryModel.deleteMany({ parentCategory: id });
    if (!deletedCategory) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    res.json({
      message: "Category and its subcategories deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Search Categories
const searchCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.query;
    const searchPattern = new RegExp(query as string, "i"); // Case-insensitive search

    const categories = await CategoryModel.find({
      $or: [{ categoryName: searchPattern }, { description: searchPattern }],
    }).populate("parentCategory");

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get Subcategories by Parent Category ID
const getSubcategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { parentId } = req.params;
    const subcategories = await CategoryModel.find({
      parentCategory: parentId,
    });
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export {
  createCategory,
  getAllCategories,
  getCategoryDetails,
  updateCategory,
  deleteCategory,
  searchCategories,
  getSubcategories,
};

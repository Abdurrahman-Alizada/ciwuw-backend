// @ts-nocheck
import { Request, Response } from "express";
import ProductModel, { ProductInterface } from "../models/productModel";
import { CategoryInterface, CategoryModel } from "../models/categoryModel";
import { RatingModel } from "../models/ratingModel";
import createLog from "../utils/createLog";
import mongoose from "mongoose";

// Desc: Create a new product
// Route: POST | /product/createProduct
const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const whom: any = req.user;
    let productId: string = "";
    let isUnique = false;

    const generateRandomId = (): string => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };

    while (!isUnique) {
      productId = generateRandomId();
      const existingProduct = await ProductModel.findOne({ productId });
      if (!existingProduct) {
        isUnique = true;
      }
    }

    const newProduct = new ProductModel({
      productId: productId,
      productName: req.body.productName,
      sizes: req.body.sizes,
      shortDescription: req.body.shortDescription,
      longDescription: req.body.longDescription,
      stock: req.body.stock,
      price: req.body.price,
      brand: req.body.brand,
      type: req.body.type,
      images: req.body.images,
      colors: req.body.colors,
      ratingId: req.body.ratingId,
      category: req.body.category,
      subCategory: req.body.subCategory,
      supplier: req.body.supplier,
      discountPrice: req.body.discountPrice,
      admin_private_note: req.body.admin_private_note,
    });

    const savedProduct = await newProduct.save();
    // Create log entry
    await createLog({
      dateTime: new Date(),
      userName: req.user?.username || "System", // Adjust if you have user info in req
      userRole: req.user?.role || "Admin", // Adjust if you have user role in req
      action: `Created product with ID ${savedProduct._id}`,
      logType: "Info",
      whom: {
        username: whom.username,
        email: whom.email,
        role: whom.role,
      },
    });

    res.status(201).json({
      message: "Product created successfully",
      product: savedProduct,
    });
  } catch (error) {
    console.error(error);
    const whom: any = req.user;
    await createLog({
      dateTime: new Date(),
      userName: req.user?.username || "System",
      userRole: req.user?.role || "Admin",
      action: "Failed to create product",
      logType: "Error",
      whom: {
        username: whom.username,
        email: whom.email,
        role: whom.role,
      },
    });
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Desc: Update a product
// Route: PUT | /product/updateProduct/:id
const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const whom: any = req.user;
    const productId: string = req.params.id;
    const updatedProduct: ProductInterface | null =
      await ProductModel.findByIdAndUpdate(productId, req.body, { new: true });
    if (!updatedProduct) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    // Create log entry
    await createLog({
      dateTime: new Date(),
      userName: req.user?.username || "System",
      userRole: req.user?.role || "Admin",
      action: `Updated product with ID ${productId}`,
      logType: "Info",
      whom: {
        username: whom.username,
        email: whom.email,
        role: whom.role,
      },
    });

    res.json(updatedProduct);
  } catch (error) {
    const whom: any = req.user;
    await createLog({
      dateTime: new Date(),
      userName: req.user?.username || "System",
      userRole: req.user?.role || "Admin",
      action: `Failed to update product with ID ${req.params.id}`,
      logType: "Error",
      whom: {
        username: whom.username,
        email: whom.email,
        role: whom.role,
      },
    });
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Desc: Delete a product
// Route: DELETE | /product/deleteProduct/:id
const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const whom: any = req.user;
    const productId: string = req.params.id;
    const deletedProduct: ProductInterface | null =
      await ProductModel.findByIdAndDelete(productId);
    if (!deletedProduct) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    // Create log entry
    await createLog({
      dateTime: new Date(),
      userName: req.user?.username || "System",
      userRole: req.user?.role || "Admin",
      action: `Deleted product with ID ${productId}`,
      logType: "Info",
      whom: {
        username: whom.username,
        email: whom.email,
        role: whom.role,
      },
    });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    const whom: any = req.user;
    await createLog({
      dateTime: new Date(),
      userName: req.user?.username || "System",
      userRole: req.user?.role || "Admin",
      action: `Failed to delete product with ID ${req.params.id}`,
      logType: "Error",
      whom: {
        username: whom.username,
        email: whom.email,
        role: whom.role,
      },
    });
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Desc: Get all listed products
// Route: GET | /product/getAllProducts
const getAllProductsCustomer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page: number = parseInt(req.query.page as string) || 1;
    const pageSize: number = parseInt(req.query.limit as string) || 10;
    const offset: number = (page - 1) * pageSize;

    // Destructure filters from the query
    const {
      brand,
      sizes,
      colors,
      priceLow,
      priceHigh,
      category,
      discountPrice,
      division,
    } = req.query;
    const searchQuery = req?.query?.searchQuery as string;

    // Create search condition for search queries
    const searchCondition = searchQuery
      ? {
          $or: [
            { productId: { $regex: searchQuery, $options: "i" } },
            { productName: { $regex: searchQuery, $options: "i" } },
            { shortDescription: { $regex: searchQuery, $options: "i" } },
            { longDescription: { $regex: searchQuery, $options: "i" } },
          ],
        }
      : {};

    const query: any = { ...searchCondition };

    // Apply other filters to the query
    if (brand) {
      const brandArray = brand.split(",");
      query.brand = { $in: brandArray };
    }

    if (discountPrice) {
      query.discountPrice = { $exists: true, $ne: null };
    }

    if (category) {
      const categoryId = new mongoose.Types.ObjectId(category as string);
      query.$or = [{ category: categoryId }, { subCategory: categoryId }];
    }

    if (sizes) {
      const sizesArray = Array.isArray(sizes)
        ? sizes
        : JSON.parse(sizes as string);
      query.sizes = { $in: sizesArray };
    }

    if (colors) {
      const colorsArray = Array.isArray(colors)
        ? colors
        : JSON.parse(colors as string);
      query.colors = { $in: colorsArray };
    }

    if (priceLow && priceHigh) {
      query.price = { $gte: priceLow, $lte: priceHigh };
    } else if (priceLow) {
      query.price = { $gte: priceLow };
    } else if (priceHigh) {
      query.price = { $lte: priceHigh };
    }

    // Ensure proper population of category and subCategory to access division field
    const products: ProductInterface[] = await ProductModel.find(query)
      .populate({
        path: "category",
        match: division ? { division } : {}, // Filter by division inside category
      })
      .populate({
        path: "subCategory",
        match: division ? { division } : {}, // Filter by division inside subCategory
      })
      .select("-supplier -admin_private_note")
      .skip(offset)
      .limit(pageSize);

    // Filter out products where category or subCategory is not populated (meaning they didn't match the division filter)
    const filteredProducts = products.filter(
      (product) => product.category || product.subCategory
    );

    const totalProducts = filteredProducts.length;
    const totalPages = Math.ceil(totalProducts / pageSize);

    // Send response
    res.status(200).json({
      success: true,
      data: filteredProducts,
      page: {
        totalElements: totalProducts,
        pageNumber: page,
        pageSize,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getAllProductsAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page: number = parseInt(req.query.page as string) || 1;
    const pageSize: number = parseInt(req.query.limit as string) || 10;
    const offset: number = (page - 1) * pageSize;

    // Construct query object based on provided filters
    const {
      brand,
      sizes,
      colors,
      priceLow,
      priceHigh,
      category,
      discountPrice,
    } = req.query;
    const searchQuery = req?.query?.searchQuery as string;
    // Create a search condition
    const searchCondition = searchQuery
      ? {
          $or: [
            { productId: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search
            { productName: { $regex: searchQuery, $options: "i" } },
            { shortDescription: { $regex: searchQuery, $options: "i" } },
            { longDescription: { $regex: searchQuery, $options: "i" } },
            {
              price: isNaN(Number(searchQuery))
                ? undefined
                : Number(searchQuery),
            },
          ],
        }
      : {};
    const query: any = { ...searchCondition };
    if (brand) {
      const brandArray = brand.split(","); // Assuming brands are passed as a comma-separated string
      query.brand = { $in: brandArray };
    }
    if (discountPrice) {
      query.discountPrice = { $exists: true, $ne: null };
    }
    if (category) {
      // query.category = new mongoose.Types.ObjectId(category as string);
      const categoryId = new mongoose.Types.ObjectId(category as string);
      // Check either category or subCategory matches the provided category ID
      query.$or = [{ category: categoryId }, { subCategory: categoryId }];
    }
    if (sizes) {
      // if (sizes) query.sizes = { $in: sizes };

      const sizesArray = Array.isArray(sizes)
        ? sizes
        : JSON.parse(sizes as string);
      query.sizes = { $in: sizesArray };
    }
    if (colors) {
      const colorsArray = Array.isArray(colors)
        ? colors
        : JSON.parse(colors as string);
      query.colors = { $in: colorsArray };
    }
    if (priceLow && priceHigh) {
      query.price = { $gte: priceLow, $lte: priceHigh };
    } else if (priceLow) {
      query.price = { $gte: priceLow };
    } else if (priceHigh) {
      query.price = { $lte: priceHigh };
    }

    // Get total products count based on the query
    const totalProducts = await ProductModel.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / pageSize);

    // Execute the query with pagination and population
    const products: ProductInterface[] = await ProductModel.find(query)
      .populate("category")
      .populate("subCategory")
      .skip(offset)
      .limit(pageSize);

    const pagination = {
      totalElements: totalProducts,
      pageNumber: page,
      pageSize,
    };

    res.status(200).json({
      success: true,
      data: products,
      page: pagination,
    });
  } catch (error) {
    console.error(error);
    await createLog({
      dateTime: new Date(),
      userName: req.user?.username || "System",
      userRole: req.user?.role || "Admin",
      action: "Failed to get all products",
      logType: "Error",
    });
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getAllProductsOfAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page: number = parseInt(req.query.page as string) || 1;
    const pageSize: number = parseInt(req.query.limit as string) || 10;
    const offset: number = (page - 1) * pageSize;

    // Get search parameter from the request query
    const searchQuery = req.query.searchQuery as string;
    const categoryId = req.query.categoryId as string;
    const statusFilter = req.query.status as string;
    const sortBy = req.query.sortBy === "dsc" ? -1 : 1; // Default to ascending if not provided
    const sortField = (req.query.sortField as string) || "productName"; // Default to 'username' if not provided

    // Create a search condition
    const searchCondition = searchQuery
      ? {
          $or: [
            { productId: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search
            { productName: { $regex: searchQuery, $options: "i" } },
            { shortDescription: { $regex: searchQuery, $options: "i" } },
            { brand: { $regex: searchQuery, $options: "i" } },
          ],
        }
      : {};

    // Create a status condition if provided
    const statusCondition = statusFilter ? { status: statusFilter } : {};

    // Create a categoryId condition if provided
    const categoryCondition = categoryId ? { category: categoryId } : {};

    // Combine the search, status, and role conditions
    const queryCondition = {
      ...searchCondition,
      ...statusCondition,
      ...categoryCondition,
    };

    // Get total products count based on the query
    const totalProducts = await ProductModel.countDocuments(queryCondition);
    const totalPages = Math.ceil(totalProducts / pageSize);

    // Execute the query with pagination and population
    const products: ProductInterface[] = await ProductModel.find(queryCondition)
      .sort({ [sortField]: sortBy })
      .populate("category")
      .populate("subCategory")
      .skip(offset)
      .limit(pageSize);

    const pagination = {
      totalElements: totalProducts,
      pageNumber: page,
      pageSize,
      totalPages,
    };

    res.status(200).json({
      success: true,
      data: products,
      page: pagination,
    });
  } catch (error) {
    console.error(error);
    await createLog({
      dateTime: new Date(),
      userName: req.user?.username || "System",
      userRole: req.user?.role || "Admin",
      action: "Failed to get all products",
      logType: "Error",
    });
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Desc: Search products with filters
// Route: GET | /product/searchProducts
const searchProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      brand,
      sizes,
      colors,
      priceLow,
      priceHigh,
      page = 1,
      pageSize = 10,
    } = req.query;

    // Convert page and pageSize to numbers
    const pageNumber: number = parseInt(page as string, 10);
    const size: number = parseInt(pageSize as string, 10);

    // Construct query object based on provided filters
    const query: any = {};
    if (brand) query.brand = brand;
    if (sizes) query.sizes = { $in: sizes };
    if (colors) query.colors = { $in: colors };
    if (priceLow && priceHigh) {
      query.price = { $gte: priceLow, $lte: priceHigh };
    } else if (priceLow) {
      query.price = { $gte: priceLow };
    } else if (priceHigh) {
      query.price = { $lte: priceHigh };
    }

    // Execute the query with pagination and population
    const products: ProductInterface[] = await ProductModel.find(query)
      .populate("category")
      .skip((pageNumber - 1) * size)
      .limit(size);

    const totalProducts = await ProductModel.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / size);

    // Create log entry
    await createLog({
      dateTime: new Date(),
      userName: req.user?.username || "System",
      userRole: req.user?.role || "Admin",
      action: "Searched products",
      logType: "Info",
    });

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        totalElements: totalProducts,
        pageNumber: pageNumber,
        pageSize: size,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    console.error(error);
    await createLog({
      dateTime: new Date(),
      userName: req.user?.username || "System",
      userRole: req.user?.role || "Admin",
      action: "Failed to search products",
      logType: "Error",
    });
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Desc: Shop search
// Route: GET | /product/getTopRatedProductsByCategory
const getTopRatedProductsByCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await CategoryModel.find().lean(); // Get all categories
    const topRatedProductsByCategory: { category: any; products: any[] }[] = [];

    for (const category of categories) {
      const products = await ProductModel.aggregate([
        { $match: { category: category._id } }, // Filter products by category
        {
          $lookup: {
            from: "ratings", // Assuming the name of the ratings collection is 'ratings'
            localField: "_id",
            foreignField: "productIds",
            as: "ratings",
          },
        },
        { $match: { ratings: { $exists: true, $ne: [] } } }, // Filter products with ratings
        { $addFields: { averageRating: { $avg: "$ratings.noOfStars" } } }, // Calculate average rating for each product
        { $sort: { averageRating: -1 } }, // Sort products by average rating in descending order
        { $limit: 5 }, // Limit to 5 products per category
        { $project: { ratings: 0 } }, // Exclude the 'ratings' field from the product details
      ]).exec(); // Execute the aggregation pipeline

      topRatedProductsByCategory.push({ category, products }); // Add category details and top-rated products to the result array
    }

    res.status(200).json(topRatedProductsByCategory); // Send the response with the top-rated products by category
  } catch (error) {
    console.error(error);
    await createLog({
      dateTime: new Date(),
      userName: req.user?.username || "System",
      userRole: req.user?.role || "Admin",
      action: "Failed to get top-rated products by category",
      logType: "Error",
    });
    res
      .status(500)
      .json({ message: "Failed to get top-rated products by category" }); // Handle error
  }
};

// Desc: Get product details
// Route: GET | /product/getProductDetail/:id
const getProductDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const productId: string = req.params.id;

    // Find the product by its ID
    const product: ProductInterface | null = await ProductModel.findById(
      productId
    );

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const rating: any = await RatingModel.aggregate([
      { $match: { productIds: product._id } },
      { $group: { _id: null, averageRating: { $avg: "$noOfStars" } } },
    ]);

    const averageRating = rating[0]?.averageRating;
    res.status(200).json({ ...product.toObject(), averageRating });
  } catch (error) {
    console.error(error);
    await createLog({
      dateTime: new Date(),
      userName: req.user?.username || "System",
      userRole: req.user?.role || "Admin",
      action: `Failed to get details for product with ID ${req.params.id}`,
      logType: "Error",
    });
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Desc: Get all products by category ID
// Route: GET | /products/getProductsByCategoryId/:category
const getAllProductsByCategoryId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { categoryId } = req.params;
    // const categoryId = new mongoose.Types.ObjectId(category as string);
    const products = await ProductModel.find({
      $or: [{ category: categoryId }, { subCategory: categoryId }],
    });

    res.json(products);
  } catch (error) {
    console.error(error);
    await createLog({
      dateTime: new Date(),
      userName: req.user?.username || "System",
      userRole: req.user?.role || "Admin",
      action: `Failed to get products for category with ID ${req.params.category}`,
      logType: "Error",
    });
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Desc: Get all product by category name
// Route: GET | /products/getProductsByCategoryName/:categoryName
const getAllProductsByCategoryName = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { categoryName } = req.params;

    // Find the category by name
    const category = await CategoryModel.findOne({ categoryName });

    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    // Retrieve products by category ID from the database
    const products = await ProductModel.find({ category: category._id });

    res.json(products);
  } catch (error) {
    console.error(error);
    await createLog({
      dateTime: new Date(),
      userName: req.user?.username || "System",
      userRole: req.user?.role || "Admin",
      action: `Failed to get products for category with name ${req.params.categoryName}`,
      logType: "Error",
    });
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get the top-rated products overall with complete product details
const getTopRatedProductsOverall = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Find all products with at least one rating
    const ratedProducts = await ProductModel.aggregate([
      {
        $lookup: {
          from: "ratings", // Assuming the name of the ratings collection is 'ratings'
          localField: "_id",
          foreignField: "productId",
          as: "ratings",
        },
      },
      {
        $match: {
          ratings: { $exists: true, $ne: [] }, // Filter products with at least one rating
        },
      },
      {
        $addFields: {
          averageRating: { $avg: "$ratings.noOfStars" },
        },
      },
      {
        $match: {
          averageRating: { $gt: 3 }, // Filter products with an average rating above 4
        },
      },
      {
        $limit: 10, // Limit the results to 10 products
      },
      {
        $project: {
          ratings: 0, // Exclude the 'ratings' field from the product details
        },
      },
    ]);

    // Return the top-rated products with complete product details (up to 10)
    res.status(200).json(ratedProducts);
  } catch (error) {
    console.error(error);
    await createLog({
      dateTime: new Date(),
      userName: req.user?.username || "System",
      userRole: req.user?.role || "Admin",
      action: "Failed to get top-rated products overall",
      logType: "Error",
    });
    res
      .status(500)
      .json({ message: "Failed to get top-rated products overall" });
  }
};

// Desc: Get all new arrival products
// Route: GET | /products/newArrivals
const getNewArrivalProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // const products = await ProductModel.find({ isNewArrival: true });
    const products = await ProductModel.find()
      .sort({ createdAt: -1 })
      .limit(12);

    res.json(products);
  } catch (error) {
    console.error(error);
    await createLog({
      dateTime: new Date(),
      userName: req.user?.username || "System",
      userRole: req.user?.role || "Admin",
      action: "Failed to get new arrival products",
      logType: "Error",
    });
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Desc: Get all new arrival products on base of categories
// Route: GET | /product/getNewArrivalProductsByCategory
const getNewArrivalProductsByCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const productsByDivision = await ProductModel.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: "$categoryDetails",
      },
      {
        $group: {
          _id: "$categoryDetails.division", // Group by division
          products: { $push: "$$ROOT" }, // Collect products in an array
        },
      },
      {
        $project: {
          _id: 0,
          division: "$_id", // Include division
          products: 1, // Include products array
        },
      },
    ]).exec();

    res.status(200).json({ success: true, data: productsByDivision });
  } catch (error) {
    console.error(error);
    await createLog({
      dateTime: new Date(),
      userName: req.user?.username || "System",
      userRole: req.user?.role || "Admin",
      action: "Failed to get new arrival products by division",
      logType: "Error",
    });
    res
      .status(500)
      .json({ message: "Failed to get new arrival products by division" });
  }
};

export {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsCustomer,
  getAllProductsAdmin,
  getProductDetail,
  searchProducts,
  getTopRatedProductsByCategory,
  getTopRatedProductsOverall,
  getAllProductsByCategoryId,
  getAllProductsByCategoryName,
  getNewArrivalProducts,
  getNewArrivalProductsByCategory,
  getAllProductsOfAdmin,
};

import { Request, Response } from "express";
import mongoose from "mongoose";
import { RatingModel, RatingInterface } from "../models/ratingModel"; // Assuming RatingModel is the Mongoose model for ratings
import OrderModel from "../models/orderModel";
import ProductModel from "../models/productModel";
const ObjectId = mongoose.Types.ObjectId;
// Create a new rating
const createRating = async (req: Request, res: Response): Promise<void> => {
  try {
    const { noOfStars, content, UserDetails, productId, orderId } = req.body;
    const order = await OrderModel.findById(orderId);

    const ratingAvailable: any = await RatingModel.find({
      orderId: orderId,
      "product.product": productId,
      UserDetails: UserDetails,
    });

    if (ratingAvailable.length > 0) {
      res.status(400).json({
        message: "You already submitted review for selected product order",
      });
      return;
    }

    // Check if the product exists
    const isAvailableProduct = await ProductModel.findById(productId);
    if (!isAvailableProduct) {
      res
        .status(404)
        .json({ message: "Product not found for the given product Id" });
    } else {
      const productIdToFilter = new ObjectId(productId); // Replace with the actual productId

      const filteredProduct: any = order?.products?.filter((product) =>
        product.product.equals(productIdToFilter)
      );

      const newRating = await RatingModel.create({
        noOfStars,
        content,
        UserDetails,
        orderId,
        product: {
          product: productId,
          image: filteredProduct[0]?.image,
          name: filteredProduct[0]?.name,
          price: filteredProduct[0]?.price,
          color: filteredProduct[0]?.color,
          size: filteredProduct[0]?.size,
          quantity: filteredProduct[0]?.quantity,
        },
      });
      res.status(201).json({
        success: true,
        data: newRating,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to create rating", error });
  }
};

const getAllRatings = async (req: Request, res: Response): Promise<void> => {
  try {
    const page: number = parseInt(req.query.page as string) || 1;
    const pageSize: number = parseInt(req.query.pageSize as string) || 10;
    const offset: number = (page - 1) * pageSize;

    // Get search parameter from the request query
    const searchQuery = req.query.searchQuery as string;
    const noOfRatingFilter = parseInt(req.query.rating as string) || null;
    // let searchFilter: any = { status: 'under-review' };
    let searchFilter: any = {};
    if (searchQuery) {
      searchFilter = {
        ...searchFilter,
        $or: [
          { content: { $regex: searchQuery, $options: "i" } },
          { "product.name": { $regex: searchQuery, $options: "i" } },

          {
            "userDetails.username": { $regex: searchQuery, $options: "i" },
          },
        ],
      };
    }
    if (noOfRatingFilter) {
      searchFilter.noOfStars = noOfRatingFilter;
    }

    const ratings = await RatingModel.aggregate([
      {
        $lookup: {
          from: "customers", // Collection name for users
          localField: "UserDetails", // Field in RatingModel
          foreignField: "_id", // Field in users collection
          as: "userDetails",
        },
      },

      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $match: searchFilter, // Add the search filter here
      },
      {
        $project: {
          UserDetails: 0,

          "userDetails.password": 0, // Optionally remove the password field
        },
      },
      {
        $skip: offset,
      },
      {
        $limit: pageSize,
      },
    ]);

    const ratings1 = await RatingModel.aggregate([
      {
        $lookup: {
          from: "customers", // Collection name for customers
          localField: "UserDetails", // Field in RatingModel
          foreignField: "_id", // Field in users collection
          as: "userDetails",
        },
      },
      {
        $lookup: {
          from: "products", // Collection name for orders
          localField: "productId", // Field in RatingModel
          foreignField: "_id", // Field in orders collection
          as: "productDetails",
        },
      },

      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: searchFilter, // Add the search filter here
      },
      {
        $project: {
          UserDetails: 0,

          "userDetails.password": 0, // Optionally remove the password field
        },
      },
    ]);

    const totalElements = ratings1.length;
    const totalPages = Math.ceil(totalElements / pageSize);
    const pagination = {
      totalElements,
      pageNumber: page,
      pageSize,
      totalPages,
    };
    // ratings.forEach((rating) => {
    // 	if (
    // 		rating.orderDetails &&
    // 		rating.orderDetails.products &&
    // 		rating.orderDetails.products.length > 0
    // 	) {
    // 		// Convert the products array into a single product object
    // 		rating.orderDetails.product = rating.orderDetails.products[0];
    // 		// Optionally, remove the products array
    // 		delete rating.orderDetails.products;
    // 	}
    // });
    res.status(200).json({
      success: true,
      data: ratings,
      pagination,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch ratings", error });
  }
};

// Update an existing rating
const updateRating = async (req: Request, res: Response): Promise<void> => {
  try {
    const { noOfStars, content, status } = req.body;
    const { id } = req.params;
    const updatedRating = await RatingModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    res.status(200).json(updatedRating);
  } catch (error) {
    res.status(500).json({ message: "Failed to update rating" });
  }
};

// Delete a rating
const deleteRating = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await RatingModel.findByIdAndDelete(id);
    res.status(200).json({ message: "Rating deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete rating" });
  }
};

// Get all ratings for a product
const getRatingsForProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { productId } = req.params;

    // Fetch all ratings for the product
    const ratings = await RatingModel.find({
      "product.product": productId,
      status: "published",
    })
      .select("-productId")
      .populate({ path: "UserDetails", select: "username image" });

    // Calculate average rating in-memory
    let totalStars = 0;
    for (const rating of ratings) {
      totalStars += rating.noOfStars;
    }
    const averageRating = ratings.length > 0 ? totalStars / ratings.length : 0;

    res.status(200).json({ ratings: ratings, averageRating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get ratings for product" });
  }
};

// Get details of a rating
const getRatingDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Find the rating by its ID and populate the UserDetails and productIds fields
    const rating = await RatingModel.findById(id)
      .populate("UserDetails", "username")
      .populate("productId", "images");

    if (rating) {
      // rating.productIds.forEach((product: any) => {
      // 	if (product.images && product.images.length > 0) {
      // 		product.images = product.images[0]; // Keep only the first image as a single value
      // 	} else {
      // 		product.images = null;
      // 	}
      // });
    }

    res.status(200).json(rating);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get rating details" });
  }
};

export {
  createRating,
  updateRating,
  deleteRating,
  getRatingsForProduct,
  getRatingDetails,
  getAllRatings,
};

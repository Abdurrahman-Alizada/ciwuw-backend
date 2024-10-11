import { Request, Response } from "express";
import { PipelineStage } from "mongoose";
import ReturnProductModel, {
  ReturnProductsInterface,
} from "../models/returnProductsModel";
import createLog from "../utils/createLog";
import OrderModel from "../models/orderModel";
import { CustomerModel } from "../models/customerModal";
// Create operation
const createReturnProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { productIds, ...returnProductData }: ReturnProductsInterface =
      req.body;
    const { orderId } = req.body;
    // Find the order by its ID
    const order: any = await OrderModel.findById(orderId);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
    }
    // Iterate over the productIds from the request
    productIds.forEach((productId: string) => {
      // Iterate over the products in the order
      order.products.forEach((product: any) => {
        // Check if the productId matches the product's ID in the order
        if (product.product.toString() === productId) {
          // If it matches, set the returned status to true
          product.returned = true;
        }
      });
    });
    // Save the updated order
    await order.save();

    const newReturnProduct = new ReturnProductModel(returnProductData);
    await newReturnProduct.save();
    res
      .status(201)
      .json({ success: true, message: "Your products return successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllReturnProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page: number = parseInt(req.query.page as string) || 1;
    const pageSize: number = parseInt(req.query.limit as string) || 10;
    const offset: number = (page - 1) * pageSize;

    // Get search parameters from the request query
    const searchQuery = req.query.searchQuery as string;
    const statusQuery = req.query.status as string;

    // Sorting parameters
    const sortBy = req.query.sortBy === "dsc" ? -1 : 1;
    const sortField = (req.query.sortField as string) || "createdAt";

    // Construct the search filter
    let searchFilter: any = {};

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, "i"); // 'i' makes it case-insensitive

      searchFilter = {
        $or: [
          { "orderId.orderId": searchRegex }, // Order ID (from populated order)
          { "userId.username": searchRegex }, // Username (from populated user)
          { "orderId.products.name": searchRegex }, // Product Name (from populated products)
          { returnReason: searchRegex }, // Return Reason
          { status: searchRegex }, // Return Status
          // { 'products.brand': searchRegex }, // Product Brand
          { "orderId.products.price": { $eq: parseFloat(searchQuery) } }, // Product Price (exact match)
        ],
      };
    }

    if (statusQuery) {
      searchFilter.status = new RegExp(`^${statusQuery}$`, "i");
    }

    // Aggregation pipeline
    const returnProductsPipeline: PipelineStage[] = [
      {
        $lookup: {
          from: "orders", // The collection to join with (Order)
          localField: "orderId",
          foreignField: "_id",
          as: "orderId",
        },
      },
      {
        $lookup: {
          from: "customers", // The collection to join with (User)
          localField: "userId",
          foreignField: "_id",
          as: "userId",
        },
      },

      { $unwind: "$orderId" }, // Deconstruct the array to document
      { $unwind: "$userId" }, // Deconstruct the array to document
      { $match: searchFilter }, // Apply the search filter
      {
        $sort: {
          [sortField]: sortBy, // Dynamic sorting based on the field and order
          createdAt: -1, // Secondary sort by creation date (desc)
        },
      },
      { $skip: offset }, // Pagination offset
      { $limit: pageSize }, // Limit the number of documents returned
      {
        $project: {
          orderId: "$orderId.orderId",
          primaryOrderId: "$orderId._id", // Include the order ID
          orderProducts: "$orderId.products",
          refundStatus: "$orderId.status",
          returnReason: 1,
          status: 1,
          returnDate: 1,
          "userId.username": 1,
          "userId.email": 1,
          // 'products.productName': 1,
          // 'products.images': 1,
          // 'products.brand': 1,
          // 'products.price': 1,
        },
      },
    ];

    // Get the filtered, paginated return products
    const returnProducts = await ReturnProductModel.aggregate(
      returnProductsPipeline
    );

    // Get total return products count for pagination
    const totalElements = returnProducts.length;
    const totalPages = Math.ceil(totalElements / pageSize);

    const pagination = {
      totalElements,
      pageNumber: page,
      pageSize,
      totalPages,
    };

    res.status(200).json({
      success: true,
      data: returnProducts,
      page: pagination,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", error: error });
  }
};

// Read operation (Get return product by ID)
const getReturnProductDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const returnProduct = await ReturnProductModel.findById(req.params.id)
      .populate("productIds")
      .populate({
        path: "orderId",
        select: "orderId totalPrice", // Specify the attributes you want to include from the category documents
      })
      .populate({ path: "userId", select: "-password -role" });

    if (!returnProduct) {
      res.status(404).json({ message: "Return product not found" });
      return;
    }
    res.json(returnProduct);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Read operation (Get return product by ID)
const returnProductByCustomerId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const returnProduct = await ReturnProductModel.find({
      userId: req.params.id,
    })
      // .populate('productIds')
      .populate({
        path: "orderId",
        select: "products",
      })
      .populate({ path: "userId" });

    if (!returnProduct) {
      res.status(404).json({ message: "Return product not found" });
      return;
    }
    // const formattedReturnProduct = returnProduct.map((item: any) => {
    // 	const product = item.toObject();
    // 	product.productIds = product.productIds[0]; // Take the first item from the array
    // 	return product;
    // });
    res.json({ success: true, data: returnProduct });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update operation
const updateReturnProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // @ts-ignore
    const whom: any = req.user;
    const { id } = req.params;
    const returnProductData: ReturnProductsInterface = req.body;
    const updatedReturnProduct = await ReturnProductModel.findByIdAndUpdate(
      id,
      returnProductData,
      { new: true }
    );
    const userDetail = await CustomerModel.findById(
      updatedReturnProduct?.userId
    );
    if (!updatedReturnProduct) {
      res.status(404).json({ message: "Return product not found" });
      return;
    }
    await createLog({
      dateTime: new Date(),
      userName: userDetail?.username || "System",
      userRole: userDetail?.role || "Customer",
      action: `Updated the return product with ID ${updatedReturnProduct?._id}`,
      logType: "Info",
      whom: {
        username: whom.username,
        email: whom.email,
        role: whom.role,
      },
    });
    res.json(updatedReturnProduct);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete operation
const deleteReturnProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedReturnProduct = await ReturnProductModel.findByIdAndDelete(id);
    if (!deletedReturnProduct) {
      res.status(404).json({ message: "Return product not found" });
      return;
    }
    res.json({ message: "Return product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export {
  createReturnProduct,
  getAllReturnProducts,
  getReturnProductDetails,
  updateReturnProduct,
  deleteReturnProduct,
  returnProductByCustomerId,
};

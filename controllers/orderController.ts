// @ts-nocheck
import { Request, Response } from "express";
import OrderModel, { OrderInterface } from "../models/orderModel";
import createLog from "../utils/createLog";
import { CustomerModel } from "../models/customerModal";

// Desc: Create a new order
// Route: POST | /order/createOrder
const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const newOrder: OrderInterface = new OrderModel({
      ...req.body,
      // orderId: orderId,
    });
    const savedOrder: OrderInterface = await newOrder.save();
    res
      .status(201)
      .json({ success: true, message: "Order placed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
// Desc: Create a new order
// Route: POST | /order/updateOrder
const updateOrderDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const whom = req.user;
    const { orderId } = req.params;
    const updateData: Partial<OrderInterface> = req.body;

    // Check if the order exists
    const existingOrder = await OrderModel.findById(orderId);
    if (!existingOrder) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    // Update the order details
    const updatedOrder = await OrderModel.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    );
    const userDetail = await CustomerModel.findById(updatedOrder?.UserDetails);
    await createLog({
      dateTime: new Date(),
      userName: userDetail?.username || "System",
      userRole: userDetail?.role || "Customer",
      action: `updated order with ID ${userDetail?._id}`,
      logType: "Info",
      whom: {
        username: whom.username,
        email: whom.email,
        role: whom.role,
      },
    });

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update order details" });
  }
};

const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    // Pagination variables
    const page: number = parseInt(req.query.page as string) || 1;
    const pageSize: number = parseInt(req.query.pageSize as string) || 10;
    const offset: number = (page - 1) * pageSize;
    const searchQuery = req.query.searchQuery as string;
    const statusQuery = req.query.status as string;
    const sortBy = req.query.sortBy === "dsc" ? -1 : 1;
    const sortField = (req.query.sortField as string) || "orderId";

    // Construct the search filter
    let searchFilter: any = {};

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, "i");
      searchFilter = {
        $or: [
          { orderId: searchRegex },
          { "user.username": searchRegex },
          { "products.name": searchRegex },
          { "address.address": searchRegex },
          { "user.phoneNumber": searchRegex },
        ],
      };
    }

    if (statusQuery) {
      searchFilter.status = new RegExp(`^${statusQuery}$`, "i");
    }

    // Aggregation pipeline
    const ordersPipeline = [
      {
        $lookup: {
          from: "customers", // Ensure this is the correct collection name for CustomerModel
          localField: "UserDetails", // Field in OrderModel referencing the user (e.g., user ID)
          foreignField: "_id", // Field in CustomerModel to match (usually _id)
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } }, // Keep orders without a matched user
      { $match: searchFilter },
      {
        $sort: {
          [sortField]: sortBy,
          createdAt: -1,
        },
      },
      { $skip: offset },
      { $limit: pageSize },
      {
        $project: {
          orderId: 1,
          products: 1,
          address: 1,
          "user.username": 1,
          "user.email": 1,
          "user.phoneNumber": 1,
          createdAt: 1,
          status: 1,
          paymentStatus: 1,
          paymentIntentId: 1, // Include paymentIntentId here
          deliveryCharges: 1,
        },
      },
    ];

    // Execute the aggregation pipeline
    const orders = await OrderModel.aggregate(ordersPipeline);

    // Get the total count of orders for pagination
    const totalOrdersPipeline = [
      {
        $lookup: {
          from: "customers",
          localField: "UserDetails",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      { $match: searchFilter },
    ];

    const totalOrdersResult = await OrderModel.aggregate(totalOrdersPipeline);
    const totalOrders = totalOrdersResult.length;
    const totalPages = Math.ceil(totalOrders / pageSize);

    const pagination = {
      totalElements: totalOrders,
      pageNumber: page,
      pageSize,
      totalPages,
    };

    res.status(200).json({
      success: true,
      data: orders,
      page: pagination,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to get all orders", error });
  }
};

const getOrderDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId: string = req.params.id;
    const order: OrderInterface | null = await OrderModel.findById(orderId);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Desc: Get all orders for a specific customer
// Route: GET | /order/getOrdersByCustomer/:customerId
const getOrdersByCustomer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { customerId } = req.params;

    // Validate customer ID (You can add additional checks here if needed)
    if (!customerId) {
      res.status(400).json({ message: "Customer ID is required" });
      return;
    }

    // Find orders by customer ID
    const orders = await OrderModel.find({ UserDetails: customerId })
      .sort({ createdAt: -1 }) // Sort orders by creation date in descending order
      .select("-paymentIntentId") // Exclude paymentIntentId from the response
      .populate("UserDetails", "username email"); // Populate user details with necessary fields
    // .populate('products.product', 'productName price'); // Populate product details with necessary fields

    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    await createLog({
      dateTime: new Date(),
      userName: req.user?.username || "System",
      userRole: req.user?.role || "Customer",
      action: `Failed to get orders for customer with ID ${req.params.customerId}`,
      logType: "Error",
    });
    res.status(500).json({ message: "Failed to get orders for customer" });
  }
};

export {
  createOrder,
  getAllOrders,
  getOrderDetail,
  updateOrderDetails,
  getOrdersByCustomer,
};

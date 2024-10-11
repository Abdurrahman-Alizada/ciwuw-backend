import { Request, Response } from "express";
import createLog from "../utils/createLog";
import {
  createUser,
  loginUser,
  loginAdmin,
  verifyForgotPassToken,
  emailVerif,
  updateUsers,
  deleteUsers,
  forgotPassForCustomer,
  forgotPassForAdmin,
  changePassForAdmin,
  changePassForCustomer,
  resetPassForAdmin,
  resetPassForCustomer,
} from "../services/userService";
import generateToken from "../utils/generateToken";
import OrderModel from "../models/orderModel";
import { CustomerModel } from "../models/customerModal";
import { AdminModel } from "../models/adminModal";

// Register Admin api
const register = async (req: Request, res: Response) => {
  const {
    username,
    firstName,
    lastName,
    phoneNumber,
    email,
    password,
    userType,
  } = req.body;

  try {
    const result = await createUser({
      username,
      firstName,
      lastName,
      phoneNumber,
      email,
      password,
      userType,
    });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const emailVerification = async (req: Request, res: Response) => {
  const { userId, token } = req.body;

  try {
    const result = await emailVerif({
      token,
    });

    if (result.success) {
      const updatedUser = await CustomerModel.findByIdAndUpdate(
        userId,
        { isVerify: true },
        { new: true } // Returns the updated document
      );
      if (updatedUser) {
        res.status(200).json({
          success: true,
          message: "Email verified",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Error while verifying email",
        });
      }
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Login  api
const loginUserHandler = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = await loginUser({
      email,
      password,
    });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const socialLogin = async (req: Request, res: Response) => {
  const { email, username, role } = req.body;
  const password = "somerandomsecretpassword";

  try {
    // Check if user already exists
    let user = await CustomerModel.findOne({ email });

    if (!user) {
      // Create new user if not found
      user = await CustomerModel.create({
        username,
        email,
        password,
        role,
        isVerify: true,
      });
    }

    // Generate token
    const token = generateToken({
      username: user.username,
      email: user.email,
      role: user.role,
    });

    // Respond with user details and token
    res.status(200).json({
      message: "User login successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerify: true,
      },
      token: token,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const loginAdminHandler = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = await loginAdmin({
      email,
      password,
    });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Forgot  sPassword
const forgotPasswordForCustomer = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    // Check if user with the provided email exists
    const user = await CustomerModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const result = await forgotPassForCustomer({
      email,
    });

    if (result?.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const forgotPasswordForAdmin = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    // Check if user with the provided email exists
    const user = await AdminModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const result = await forgotPassForAdmin({
      email,
    });

    if (result?.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Verify token
const tokenVerification = async (req: Request, res: Response) => {
  const { token } = req.params;
  try {
    const result = await verifyForgotPassToken({
      token,
    });

    if (result) {
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } else {
      // Handle case where result is undefined
      res.status(500).json({
        success: false,
        message: "Error occurred while verifying token",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Change password
const changePasswordForAdmin = async (req: Request, res: Response) => {
  const { userId, token, newPassword } = req.body;
  try {
    const isVerify = await emailVerif({
      token,
    });
    let result: any;
    if (isVerify.success) {
      result = await changePassForAdmin({
        userId,
        newPassword,
      });
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } else {
      res.status(500).json({
        success: false,
        message: "Your token is expire or invalid",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Your token is expire or invalid",
    });
  }
};

const changePasswordForCustomer = async (req: Request, res: Response) => {
  const { userId, token, newPassword } = req.body;
  try {
    const isVerify = await emailVerif({
      token,
    });
    let result: any;
    if (isVerify.success) {
      result = await changePassForCustomer({
        userId,
        newPassword,
      });
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } else {
      res.status(500).json({
        success: false,
        message: "Your token is expire or invalid",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Your token is expire or invalid",
    });
  }
};

// reset password
const resetPasswordForAdmin = async (req: Request, res: Response) => {
  const { userId, newPassword } = req.body;
  try {
    const result = await resetPassForAdmin({
      userId,
      newPassword,
    });
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const resetPasswordForCustomer = async (req: Request, res: Response) => {
  const { userId, currentPassword, newPassword } = req.body;
  try {
    const result = await resetPassForCustomer({
      userId,
      currentPassword,
      newPassword,
    });
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Route handler function for adding a user
const addUserByAdmin = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const whom: any = req.user;
    const { username, email, role, password, status, phoneNumber } = req.body;

    if (!username || !email || !role || !password) {
      return res
        .status(400)
        .json({ message: "Please provide username, email, and role" });
    }

    // Check if the email already exists
    const existingUser = await AdminModel.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const newUser = new AdminModel({
      username,
      email,
      role,
      password,
      phoneNumber,
      status,
    });
    await newUser.save();
    await createLog({
      dateTime: new Date(),
      userName: newUser?.username || "System",
      userRole: newUser?.role || "Customer",
      action: `Admin added with ID ${newUser._id}`,
      logType: "Info",
      whom: {
        username: whom.username,
        email: whom.email,
        role: whom.role,
      },
    });
    res
      .status(201)
      .json({ message: "Admin created successfully", user: newUser });
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ message: "Failed to add user" });
  }
};

//getAllUser => Customers
const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page: number = parseInt(req.query.page as string) || 1;
    const pageSize: number = parseInt(req.query.limit as string) || 10;
    const offset: number = (page - 1) * pageSize;

    // Get search parameter from the request query
    const searchQuery = req.query.searchQuery as string;
    const statusFilter = req.query.status as string;
    const sortBy = req.query.sortBy === "dsc" ? -1 : 1; // Default to ascending if not provided
    const sortField = (req.query.sortField as string) || "username"; // Default to 'username' if not provided

    // Create a search condition
    const searchCondition = searchQuery
      ? {
          $or: [
            { username: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search
            { email: { $regex: searchQuery, $options: "i" } },
            { phoneNumber: { $regex: searchQuery, $options: "i" } },
          ],
        }
      : {};

    // Create a status condition if provided
    const statusCondition = statusFilter ? { status: statusFilter } : {};

    // Combine the search, status, and role conditions
    const queryCondition = {
      role: "user",
      ...searchCondition,
      ...statusCondition,
    };

    // Get total count of users
    const totalElements = await CustomerModel.find(queryCondition, {
      password: 0,
    }).countDocuments();
    const totalPages = Math.ceil(totalElements / pageSize);
    // Get users with pagination
    const users = await CustomerModel.find(queryCondition, { password: 0 })
      .skip(offset)
      .limit(pageSize)
      .sort({ [sortField]: sortBy }); // Apply sorting based on query parameters

    const pagination = {
      totalElements,
      pageNumber: page,
      pageSize,
      totalPages,
    };

    res.status(200).json({
      success: true,
      data: users,
      page: pagination,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getAllAdmins = async (req: Request, res: Response) => {
  try {
    const page: number = parseInt(req.query.page as string) || 1;
    const pageSize: number = parseInt(req.query.limit as string) || 10;
    const offset: number = (page - 1) * pageSize;

    // Get search parameter from the request query
    const searchQuery = req.query.searchQuery as string;
    const statusFilter = req.query.status as string;
    const sortBy = req.query.sortBy === "dsc" ? -1 : 1; // Default to ascending if not provided
    const sortField = (req.query.sortField as string) || "username"; // Default to 'username' if not provided

    // Create a search condition
    const searchCondition = searchQuery
      ? {
          $or: [
            { username: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search
            { email: { $regex: searchQuery, $options: "i" } },
            { phoneNumber: { $regex: searchQuery, $options: "i" } },
          ],
        }
      : {};

    // Create a status condition if provided
    const statusCondition = statusFilter ? { status: statusFilter } : {};

    // Combine the search, status, and role conditions
    const queryCondition = {
      role: { $in: ["admin", "superAdmin"] },
      ...searchCondition,
      ...statusCondition,
    };

    // // Get total count of admins
    // const totalElements = await UserModal.find(queryCondition).countDocuments();
    // const totalPages = Math.ceil(totalElements / pageSize);
    // Get admins with pagination
    const admins = await AdminModel.find(queryCondition, { password: 0 })
      .skip(offset)
      .limit(pageSize)
      .sort({ [sortField]: sortBy }); // Apply sorting based on query parameters
    const admins1 = await AdminModel.find(queryCondition, { password: 0 });

    // Get total count of admins
    const totalElements = admins1.length;
    const totalPages = Math.ceil(totalElements / pageSize);

    const pagination = {
      totalElements,
      pageNumber: page,
      pageSize,
      totalPages,
    };

    res.status(200).json({
      success: true,
      data: admins,
      page: pagination,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// updateUser
const updateUser = async (req: Request, res: Response) => {
  try {
    const updateData = req.body;

    const result = await updateUsers({
      id: req.params.id,
      updateData,
      // @ts-ignore
      whom: req.user,
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        Customer: result.customer,
        message: "User updated successfully",
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
      });
    }
  } catch (err) {
    res.status(500).send(err);
  }
};

// delete user
const deleteUser = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const result = await deleteUsers({ id: req.params.id, whom: req.user });

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// get dashboard stats
const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    // Initialize match conditions
    const matchConditions: any = {
      status: "completed",
    };

    // Conditionally add the createdAt filter if startDate and endDate are provided
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      matchConditions.createdAt = { $gte: start, $lte: end };
    }

    // Get total number of customers
    const customerConditions: any = {
      role: { $in: ["user", "customer"] },
    };

    if (startDate && endDate) {
      customerConditions.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const totalCustomers = await CustomerModel.find(
      customerConditions
    ).countDocuments();

    // Get total revenue
    const totalRevenueResult = await OrderModel.aggregate([
      {
        $match: matchConditions,
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    const totalRevenue =
      totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0;

    // Get total number of products sold
    const totalSoldResult = await OrderModel.aggregate([
      {
        $match: matchConditions,
      },
      {
        $unwind: "$products", // Unwind the products array to treat each product as a separate document
      },
      {
        $group: {
          _id: null,
          totalSold: { $sum: "$products.quantity" }, // Sum up all quantities in the products array
        },
      },
    ]);

    const totalSold =
      totalSoldResult.length > 0 ? totalSoldResult[0].totalSold : 0;

    // Initialize match conditions
    const matchConditionsPrevious: any = {
      status: "completed",
    };

    // Conditionally add the createdAt filter if startDate and endDate are provided
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      matchConditionsPrevious.createdAt = { $lte: start };
    }

    // Get total number of customers
    const customerConditionsPrevious: any = {
      role: { $in: ["user", "customer"] },
    };

    if (startDate && endDate) {
      customerConditionsPrevious.createdAt = {
        $lte: new Date(startDate as string),
      };
    }

    const totalCustomersPrevious = await CustomerModel.find(
      customerConditionsPrevious
    ).countDocuments();

    // Get total revenue
    const totalRevenueResultPrevious = await OrderModel.aggregate([
      {
        $match: matchConditionsPrevious,
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    const totalRevenuePrevious =
      totalRevenueResultPrevious.length > 0
        ? totalRevenueResultPrevious[0].totalRevenue
        : 0;

    // Get total number of products sold
    const totalSoldResultPrevious = await OrderModel.aggregate([
      {
        $match: matchConditionsPrevious,
      },
      {
        $unwind: "$products", // Unwind the products array to treat each product as a separate document
      },
      {
        $group: {
          _id: null,
          totalSold: { $sum: "$products.quantity" }, // Sum up all quantities in the products array
        },
      },
    ]);

    const totalSoldPrevious =
      totalSoldResultPrevious.length > 0
        ? totalSoldResultPrevious[0].totalSold
        : 0;

    res.status(200).json({
      success: true,
      message: "Dashboard stats retrieved successfully",
      filteredResult: {
        totalCustomers: totalCustomers,
        totalRevenue: totalRevenue,
        totalSold: totalSold,
      },
      previousDataResult: {
        totalCustomers: totalCustomersPrevious,
        totalRevenue: totalRevenuePrevious,
        totalSold: totalSoldPrevious,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export {
  register,
  loginUserHandler,
  loginAdminHandler,
  forgotPasswordForCustomer,
  forgotPasswordForAdmin,
  tokenVerification,
  getAllUsers,
  getAllAdmins,
  updateUser,
  deleteUser,
  resetPasswordForCustomer,
  resetPasswordForAdmin,
  emailVerification,
  getDashboardStats,
  addUserByAdmin,
  socialLogin,
  changePasswordForAdmin,
  changePasswordForCustomer,
};

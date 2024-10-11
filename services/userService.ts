import generateToken from "../utils/generateToken";
import generateResetToken from "../utils/generateResetToken";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
const fs = require("fs");
const path = require("path");
const configFilePath = path.join(__dirname, "../config/config.json");
import createLog from "../utils/createLog";
import { CustomerModel } from "../models/customerModal";
import { AdminModel } from "../models/adminModal";
import mongoose from "mongoose";
interface resetPassInterface {
  email: string;
  password: string;
}
interface createUserInterface {
  username: string;
  email: string;
  password: string;
  userType: string;
  firstName: string;
  lastName: string;
  phoneNumber: number;
}
interface loginUserInterface {
  email: string;
  password: string;
}

interface loginAdminInterface {
  email: string;
  password: string;
}
interface forgotPassInterface {
  email: string;
}
interface verifyForgotPassTokenInterface {
  token: string;
}
interface VerifyTokenResult {
  success: boolean;
  message: string;
  email: string;
}
interface resetPassInterface {
  email: string;
  password: string;
}
interface emailVerifInterface {
  token: string;
}
interface registerAdminInterface {
  email: string;
}
interface getCustomerByIdInterface {
  id: string;
}
interface deleteCustomerInterface {
  id: string;
  whom: any;
}
const createUser = async ({
  username,
  firstName,
  lastName,
  phoneNumber,
  email,
  password,
  userType,
}: createUserInterface) => {
  try {
    const user = await CustomerModel.findOne({ email });

    if (user) {
      return {
        success: false,
        message: "User already exists with the same email",
      };
    }
    const newUser = await CustomerModel.create({
      username,
      firstName,
      lastName,
      phoneNumber,
      email,
      password,
      role: userType,
    });

    // Generate a reset token
    const resetToken = await generateResetToken({ email });
    // Create a transporter for sending emails
    const transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      auth: {
        user: `${process.env.FROM}`,
        pass: `${process.env.APP_PASSWORD}`,
      },
    });

    // Read the HTML template
    const templatePath = path.join(__dirname, "../templates/verify-email.html");
    let emailTemplate = fs.readFileSync(templatePath, "utf-8");
    // Replace the placeholder with the actual reset URL
    const resetUrl = `${process.env.FRONT_END_URL}/verification?token=${resetToken}&userId=${newUser._id}`;
    emailTemplate = emailTemplate.replace("{{resetUrl}}", resetUrl);

    // Compose the email
    const mailOptions = {
      from: `Verify Your Email ${process.env.FROM}`,
      to: email,
      subject: "Email Verification",
      html: emailTemplate,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: "Check your Email for verification",
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "User registration internal server error",
    };
  }
};

const emailVerif = ({
  token,
}: emailVerifInterface): Promise<VerifyTokenResult> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, `${process.env.SECRETKEY}`, (err, decodedToken: any) => {
      if (err) {
        reject({ success: false, message: "Your token is expire or invalid" });
      } else {
        resolve({
          success: true,
          message: "Email verified",
          email: decodedToken.email,
        });
      }
    });
  });
};

//Register Admin
const registerUser = async ({ email }: registerAdminInterface) => {
  try {
    // Read user data from config.json
    const configData = fs.readFileSync(configFilePath);
    const userDataArray = JSON.parse(configData);

    // Find user information by userId
    const userData = userDataArray.find((user: any) => user.email === email);

    if (!userData) {
      return { success: false, message: "Invalid data in config.json" };
    }

    const existingAdmin = await AdminModel.findOne({ email: userData.email });

    if (existingAdmin) {
      return {
        success: false,
        message: "Admin already register",
      };
    }

    const register_user = await AdminModel.create({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: userData.userType,
    });

    // Remove the registered admin from adminDataArray
    let adminDataArray = userDataArray.filter(
      (user: any) => user.email !== email
    );

    // Write the updated adminDataArray back to config.json
    fs.writeFileSync(configFilePath, JSON.stringify(adminDataArray, null, 2));
    const { password, ...registerUser } = register_user.toObject();
    return {
      success: true,
      message: "User Register successfully",
      registerUser,
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Registration internal server error" };
  }
};

//Login Customer
const loginUser = async ({ email, password }: loginUserInterface) => {
  try {
    const user = await CustomerModel.findOne({ email });

    if (!user) {
      return { success: false, message: "User not found" };
    }
    if (!user?.isVerify) {
      return {
        success: false,
        message: "User account is not verified yet, Please verify Your account",
      };
    }
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Invalid password
      return { success: false, message: "Invalid password" };
    }

    const token = generateToken({
      username: user.username,
      email: user.email,
      role: user.role,
    });

    return {
      success: true,
      user: {
        email: user.email,
        username: user.username,
        token,
        id: user._id,
        role: "user",
      },
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Login internal server error" };
  }
};

//Login Admin
const loginAdmin = async ({ email, password }: loginAdminInterface) => {
  try {
    const user = await AdminModel.findOne({
      email,
      role: { $in: ["admin", "superAdmin"] },
    });

    if (!user) {
      // Admin not found
      return { success: false, message: "Admin not found" };
    }
    if (user?.status !== "active") {
      return { success: false, message: "Admin account is inactive" };
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Invalid password
      return { success: false, message: "Invalid password" };
    }

    const token = generateToken({
      username: user.username,
      email: user.email,
      role: user.role,
    });

    return {
      success: true,
      user: {
        email: user.email,
        username: user.username,
        token,
        id: user._id,
        // role: "admin",
        role: user.role,
      },
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Login internal server error" };
  }
};

const forgotPassForCustomer = async ({ email }: forgotPassInterface) => {
  try {
    // Generate a reset token
    const resetToken = await generateResetToken({ email });
    const userInfo: any = await CustomerModel.find({ email });

    if (!resetToken) {
      return { success: false, message: "Error generating reset token" };
    }

    // Create a transporter for sending emails
    const transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      auth: {
        user: `${process.env.FROM}`,
        pass: `${process.env.APP_PASSWORD}`,
      },
    });

    // Read the HTML template
    const templatePath = path.join(
      __dirname,
      "../templates/reset-password.html"
    );
    let emailTemplate = fs.readFileSync(templatePath, "utf-8");
    // Replace the placeholder with the actual reset URL
    const resetUrl = `${process.env.FRONT_END_URL}/password?token=${resetToken}&userId=${userInfo[0]._id}`;
    emailTemplate = emailTemplate.replace("{{resetUrl}}", resetUrl);

    // Compose the email
    const mailOptions = {
      from: `Reset Your Password ${process.env.FROM}`,
      to: email,
      subject: "Password Reset",
      html: emailTemplate,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    return { success: true, message: "Reset password link sent to your email" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Forgot pass internal server error" };
  }
};

const forgotPassForAdmin = async ({ email }: forgotPassInterface) => {
  try {
    // Generate a reset token
    const resetToken = await generateResetToken({ email });
    const userInfo: any = await AdminModel.find({ email });

    if (!resetToken) {
      return { success: false, message: "Error generating reset token" };
    }

    // Create a transporter for sending emails
    const transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      auth: {
        user: `${process.env.FROM}`,
        pass: `${process.env.APP_PASSWORD}`,
      },
    });

    // Read the HTML template
    const templatePath = path.join(
      __dirname,
      "../templates/reset-password.html"
    );
    let emailTemplate = fs.readFileSync(templatePath, "utf-8");
    // Replace the placeholder with the actual reset URL
    const resetUrl = `${process.env.CLIENT_URL}/password?token=${resetToken}?userId=${userInfo[0]._id}`;
    emailTemplate = emailTemplate.replace("{{resetUrl}}", resetUrl);

    // Compose the email
    const mailOptions = {
      from: `Reset Your Password ${process.env.FROM}`,
      to: email,
      subject: "Password Reset",
      html: emailTemplate,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    return { success: true, message: "Reset password link sent to your email" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Forgot pass internal server error" };
  }
};

const verifyForgotPassToken = ({
  token,
}: verifyForgotPassTokenInterface): Promise<VerifyTokenResult> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, `${process.env.SECRETKEY}`, (err, decodedToken: any) => {
      if (err) {
        reject({ success: false, message: "Invalid or expired token" });
      } else {
        resolve({
          success: true,
          message: "Token verified successfully",
          email: decodedToken.email,
        });
      }
    });
  });
};

const changePassForCustomer = async ({
  userId,
  newPassword,
}: {
  userId: string;
  newPassword: string;
}) => {
  try {
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { success: false, message: "Invalid user ID format" };
    }

    const customer = await CustomerModel.findById(userId);

    if (!customer) {
      return { success: false, message: "User not found" };
    }

    // Update password
    customer.password = newPassword;
    await customer.save();
    await createLog({
      dateTime: new Date(),
      userName: customer?.username || "System",
      userRole: customer?.role || "Customer",
      action: `${customer?.role} update their password with ID ${customer?._id}`,
      logType: "Info",
    });

    return { success: true, message: "Password changed successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Reset pass internal server error" };
  }
};

const changePassForAdmin = async ({
  userId,
  newPassword,
}: {
  userId: string;
  newPassword: string;
}) => {
  try {
    const admin = await AdminModel.findById(userId);

    if (!admin) {
      return { success: false, message: "User not found" };
    }

    // Update password
    admin.password = newPassword;
    await admin.save();
    await createLog({
      dateTime: new Date(),
      userName: admin?.username || "System",
      userRole: admin?.role,
      action: `${admin?.role} update their password with ID ${admin?._id}`,
      logType: "Info",
    });

    return { success: true, message: "Password changed successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Reset pass internal server error" };
  }
};

const resetPassForCustomer = async ({
  userId,
  currentPassword,
  newPassword,
}: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) => {
  try {
    const customer = await CustomerModel.findById(userId);

    if (!customer) {
      return { success: false, message: "User not found" };
    }

    // Verify current password
    const isMatch = await customer.comparePassword(currentPassword); // Assuming comparePassword is a method to compare passwords
    if (!isMatch) {
      return { success: false, message: "Current password is incorrect" };
    }

    // Update password
    customer.password = newPassword;
    await customer.save();

    return { success: true, message: "Password reset successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Reset pass internal server error" };
  }
};

const resetPassForAdmin = async ({
  userId,
  newPassword,
}: {
  userId: string;
  newPassword: string;
}) => {
  try {
    const customer = await AdminModel.findById(userId);

    if (!customer) {
      return { success: false, message: "User not found" };
    }

    // Update password
    customer.password = newPassword;
    await customer.save();

    return { success: true, message: "Password reset successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Reset pass internal server error" };
  }
};

interface updateCustomerInterface {
  id: string;
  updateData: any;
  whom: any;
}
const getAllUsers = async () => {
  try {
    // Retrieve all admins from the database
    const customers = await AdminModel.find({}, { password: 0 });

    return { success: true, customers };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Internal server error" };
  }
};

const updateUsers = async ({
  id,
  updateData,
  whom,
}: updateCustomerInterface) => {
  try {
    const { email } = updateData;

    // Check if the new email already exists in the database
    const existingUser = await AdminModel.findOne({ email });

    if (existingUser && existingUser._id.toString() !== id) {
      return {
        success: false,
        message: "User already exists with this email",
      };
    }
    // Find the admin by ID and update its data
    const updatedUser = await AdminModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedUser) {
      return { success: false, message: "User not found" };
    }

    await createLog({
      dateTime: new Date(),
      userName: updatedUser?.username || "System",
      userRole: updatedUser?.role || "Customer",
      action: `${updatedUser?.role} updated with ID ${updatedUser?._id}`,
      logType: "Info",
      whom: {
        username: whom.username,
        email: whom.email,
        role: whom.role,
      },
    });

    return { success: true, customer: updatedUser };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Internal server error" };
  }
};

const deleteUsers = async ({ id, whom }: deleteCustomerInterface) => {
  try {
    // Find the admin by ID and delete it
    const deleteUser = await AdminModel.findByIdAndDelete(id);

    if (!deleteUser) {
      return { success: false, message: "User not found" };
    }

    await createLog({
      dateTime: new Date(),
      userName: deleteUser?.username || "System",
      userRole: deleteUser?.role || "Customer",
      action: `${deleteUser?.role} deleted with ID ${deleteUser?._id}`,
      logType: "Info",
      whom: {
        username: whom.username,
        email: whom.email,
        role: whom.role,
      },
    });

    return { success: true, message: "User deleted successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Internal server error" };
  }
};

export {
  createUser,
  loginUser,
  loginAdmin,
  forgotPassForCustomer,
  verifyForgotPassToken,
  resetPassForAdmin,
  resetPassForCustomer,
  emailVerif,
  registerUser,
  getAllUsers,
  updateUsers,
  deleteUsers,
  changePassForAdmin,
  changePassForCustomer,
  forgotPassForAdmin,
};

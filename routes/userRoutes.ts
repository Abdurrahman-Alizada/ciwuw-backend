import express from "express";
import verifyToken from "../middleware/verifyToken";
import {
  register,
  loginAdminHandler,
  loginUserHandler,
  tokenVerification,
  getAllUsers,
  updateUser,
  deleteUser,
  emailVerification,
  getDashboardStats,
  addUserByAdmin,
  getAllAdmins,
  socialLogin,
  forgotPasswordForAdmin,
  forgotPasswordForCustomer,
  resetPasswordForCustomer,
  resetPasswordForAdmin,
  changePasswordForAdmin,
  changePasswordForCustomer,
} from "../controllers/userController";
const router = express.Router();
import isAdmin from "../middleware/adminAuth";
import isSuperAdmin from "../middleware/superAdminAuth";

// router.post('/login', login);
router.post("/login/user", loginUserHandler);
router.post("/socialLogin", socialLogin);
router.post("/login/admin", loginAdminHandler);

router.post("/register", register);
router.post("/forgotPassword", forgotPasswordForAdmin);
router.post("/forgotCustomerPassword", forgotPasswordForCustomer);
router.post("/tokenVerification/:token", tokenVerification);
router.post("/resetPassword", verifyToken, resetPasswordForAdmin);
router.post("/resetCustomerPassword", verifyToken, resetPasswordForCustomer);
router.post("/changePassword", changePasswordForAdmin);
router.post("/changeCustomerPassword", changePasswordForCustomer);
router.post("/emailVerification", emailVerification);
// protected route
router.get("/getAllUsers", verifyToken, isAdmin, getAllUsers);
router.get("/getAllAdmins", verifyToken, isSuperAdmin, getAllAdmins);
router.post("/addUserByAdmin", verifyToken, isSuperAdmin, addUserByAdmin);

router.put("/updateUser/:id", verifyToken, isSuperAdmin, updateUser);
router.delete("/deleteUser/:id", verifyToken, isSuperAdmin, deleteUser);
router.get("/getdashboardstats", verifyToken, getDashboardStats);

export default router;

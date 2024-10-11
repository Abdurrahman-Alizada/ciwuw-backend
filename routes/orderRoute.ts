import express from "express";
import verifyToken from "../middleware/verifyToken";
import {
  createOrder,
  getAllOrders,
  getOrderDetail,
  getOrdersByCustomer,
  updateOrderDetails,
} from "../controllers/orderController";
import isAdmin from "../middleware/adminAuth";
const router = express.Router();

router.post("/createOrder", verifyToken, createOrder);
router.put("/updateOrder/:orderId", verifyToken, updateOrderDetails);
router.get("/getAllOrders", verifyToken, getAllOrders);
router.get("/getOrderDetail/:id", verifyToken, getOrderDetail);
router.get("/getOrdersByCustomer/:customerId", getOrdersByCustomer);

export default router;

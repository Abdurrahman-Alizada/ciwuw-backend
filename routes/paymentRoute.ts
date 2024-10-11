import express from "express";
import verifyToken from "../middleware/verifyToken";
import {
  createCustomer,
  StripePayment,
  createCheckoutSession,
  handleStripeWebhook,
  processRefund,
} from "../controllers/paymentController";

const router = express.Router();

router.post("/create-customer", createCustomer);
router.post("/payment", StripePayment);
router.post("/create-checkout-session", createCheckoutSession);
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);
router.post("/refund", verifyToken, processRefund);

// router.post('/create-charges', paymentController.createCharges);

export default router;

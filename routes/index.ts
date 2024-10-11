// routes/index.ts
import express from "express";
import userRoutes from "./userRoutes";
import productRoutes from "./productRoutes";
import orderRoutes from "./orderRoute";
import categoryRoutes from "./categoryRoutes";
import ratingRoutes from "./ratingRoute";
import returnProductsRoutes from "./returnProductRoutes";
import paymentRoutes from "./paymentRoute";
import contactUsRoutes from "./contactUsRoutes";
import logRoutes from "./logRoutes";
import cloudinaryRoutes from "./cloudinaryRoutes";
import analyticsRoutes from "./analyticsRoutes";
import deliveryChargesRoutes from "./deliveryChargesRoutes";
import cartRoutes from "./cartRoutes";
import cron from "node-cron";
import axios from "axios";
const router = express.Router();
// Schedule the cron job to run each after five day
// cron.schedule('0 0 */5 * *', async () => {
// Schedule the cron job to run every day at midnight
// cron.schedule("0 0 * * *", async () => {
// Schedule the cron job after every minute
cron.schedule("*/5 * * * *", async () => {
  try {
    console.log("Running daily cart check...");

    // Call the checkCart API using axios
    const data = await axios.get(`${process.env.BACKEND_URL}/cart/checkCart`);

    // console.log('Cart checked', data.data);
  } catch (error) {
    console.error("Error in cron job:", error);
  }
});

// Mount user routes under '/user'
router.use("/user", userRoutes);
router.use("/deliverCharges", deliveryChargesRoutes);
router.use("/product", productRoutes);
router.use("/returnProduct", returnProductsRoutes);
router.use("/order", orderRoutes);
router.use("/category", categoryRoutes);
router.use("/rating", ratingRoutes);
router.use("/payment", paymentRoutes);
router.use("/contactUs", contactUsRoutes);
router.use("/log", logRoutes);
router.use("/api/cloudinary", cloudinaryRoutes);
router.use("/api", analyticsRoutes);
router.use("/cart", cartRoutes);

export default router;

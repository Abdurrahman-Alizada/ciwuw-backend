import express from "express";
import { getAllAnalyticsData } from "../controllers/analyticsController";
import verifyToken from "../middleware/verifyToken";

const router = express.Router();

router.get("/analytics", verifyToken, getAllAnalyticsData);

export default router;

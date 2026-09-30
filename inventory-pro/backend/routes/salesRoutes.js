import express from "express";
import { createSale, exportSales } from "../controllers/salesController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/export", protect, exportSales);
router.post("/", protect, createSale);

export default router;

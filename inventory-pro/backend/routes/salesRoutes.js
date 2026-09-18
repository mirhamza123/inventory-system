import express from "express";
import { createSale } from "../controllers/salesController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createSale);

export default router;

import express from "express";
import {
  createTransaction,
  deleteTransaction,
  getStockActivities,
  getTransactions,
  getTotalNetProfit,
} from "../controllers/stockController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profit", protect, getTotalNetProfit);
router.get("/activities", protect, getStockActivities);
router.get("/", protect, getTransactions);
router.post("/", protect, createTransaction);
router.delete("/:id", protect, deleteTransaction);

export default router;

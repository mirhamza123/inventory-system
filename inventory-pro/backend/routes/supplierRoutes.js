import express from "express";
import {
  createSupplier,
  deleteSupplier,
  getSupplierById,
  getSuppliers,
  recordPurchase,
  updateSupplier,
} from "../controllers/supplierController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getSuppliers);
router.get("/:id", protect, getSupplierById);
router.post("/", protect, createSupplier);
router.post("/purchases", protect, recordPurchase);
router.put("/:id", protect, updateSupplier);
router.delete("/:id", protect, deleteSupplier);

export default router;

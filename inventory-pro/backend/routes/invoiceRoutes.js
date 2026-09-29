import express from "express";
import {
  getInvoices,
  importLegacyInvoices,
} from "../controllers/invoiceController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getInvoices);
router.post("/import", protect, importLegacyInvoices);

export default router;

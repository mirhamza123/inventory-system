import express from "express";
import {
  deleteInvoice,
  getInvoices,
  importLegacyInvoices,
} from "../controllers/invoiceController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getInvoices);
router.post("/import", protect, importLegacyInvoices);
router.delete("/:id", protect, deleteInvoice);

export default router;

import express from "express";
import {
  addProduct,
  deleteProduct,
  getProductAlerts,
  getProducts,
  updateProduct,
} from "../controllers/prodController.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/authorizeMiddleware.js";

const router = express.Router();

router.get("/alerts", protect, getProductAlerts);
router.get("/", protect, getProducts);
router.post("/", protect, addProduct);
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, authorize("admin", "manager"), deleteProduct);

export default router;

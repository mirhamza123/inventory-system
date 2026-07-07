import express from "express";
import {
  addProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../controllers/prodController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getProducts);
router.post("/", protect, addProduct);
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct);

export default router;

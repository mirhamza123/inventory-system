import express from "express";
import {
  changePassword,
  loginUser,
  registerUser,
} from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/change-password", protect, changePassword);

export default router;

import express from "express";
import {
  getSettings,
  updateSettings,
} from "../controllers/settingsController.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/authorizeMiddleware.js";

const router = express.Router();

router.get("/", protect, getSettings);
router.put("/", protect, authorize("admin", "manager"), updateSettings);

export default router;

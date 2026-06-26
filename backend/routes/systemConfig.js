import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  getSystemConfig,
  updateSystemConfig,
} from "../controllers/systemConfigController.js";

const router = express.Router();

// Tất cả routes đều yêu cầu authentication
router.use(authenticateToken);

/**
 * GET /api/system-config
 * Lấy cấu hình hệ thống (chỉ admin)
 */
router.get("/", getSystemConfig);

/**
 * PUT /api/system-config
 * Cập nhật cấu hình hệ thống (chỉ admin)
 */
router.put("/", updateSystemConfig);

export default router;


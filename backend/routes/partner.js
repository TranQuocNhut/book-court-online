import express from "express";
import {
  createPartnerApplication,
  getAllPartnerApplications,
  approvePartnerApplication,
  rejectPartnerApplication,
} from "../controllers/partnerController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

/**
 * POST /api/partner-applications
 * Tạo đơn đăng ký đối tác (cần đăng nhập)
 */
router.post("/", authenticateToken, createPartnerApplication);

/**
 * GET /api/partner-applications/admin/all
 * Lấy tất cả đơn đăng ký đối tác (chỉ Admin)
 */
router.get("/admin/all", authenticateToken, requireAdmin, getAllPartnerApplications);

/**
 * PUT /api/partner-applications/:id/approve
 * Duyệt đơn đăng ký đối tác (chỉ Admin)
 */
router.put("/:id/approve", authenticateToken, requireAdmin, approvePartnerApplication);

/**
 * PUT /api/partner-applications/:id/reject
 * Từ chối đơn đăng ký đối tác (chỉ Admin)
 */
router.put("/:id/reject", authenticateToken, requireAdmin, rejectPartnerApplication);

export default router;


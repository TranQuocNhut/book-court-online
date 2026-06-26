import express from "express";
import mongoose from "mongoose";
import * as analyticsController from "../controllers/analyticsController.js";
import { authenticateToken, authorize } from "../middleware/auth.js";
import Facility from "../models/Facility.js"; // Cần để check ownership

const router = express.Router();

/**
 * Middleware tùy chỉnh: Kiểm tra quyền sở hữu Facility
 * Middleware này sẽ áp dụng cho TẤT CẢ các route trong file này.
 * Nó đảm bảo user là "owner" của facilityId (hoặc là "admin").
 */
const checkFacilityOwnership = async (req, res, next) => {
  try {
    const facilityId = req.query.facilityId;

    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp facilityId",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(facilityId)) {
      return res.status(400).json({
        success: false,
        message: "facilityId không hợp lệ",
      });
    }

    const facility = await Facility.findById(facilityId).select("owner");

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cơ sở",
      });
    }

    // Kiểm tra: Hoặc user là admin, hoặc user là chủ sở hữu
    const isOwner = facility.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập thống kê của cơ sở này",
      });
    }

    // Lưu facilityId đã được xác thực vào request để controller sử dụng
    req.facilityId = facility._id;
    next();
  } catch (error) {
    next(error);
  }
};

// === ĐĂNG KÝ ROUTE ===

// === ADMIN ROUTES ===
// Tất cả routes admin-only (không cần checkFacilityOwnership)

// GET /api/analytics/admin/platform-fee
router.get(
  "/admin/platform-fee",
  authenticateToken,
  authorize("admin"),
  analyticsController.getAdminPlatformFee
);

// GET /api/analytics/admin/dashboard
router.get(
  "/admin/dashboard",
  authenticateToken,
  authorize("admin"),
  analyticsController.getAdminDashboard
);

// GET /api/analytics/admin/revenue?period=month&year=2025
router.get(
  "/admin/revenue",
  authenticateToken,
  authorize("admin"),
  analyticsController.getAdminRevenue
);

// GET /api/analytics/admin/facility-stats
router.get(
  "/admin/facility-stats",
  authenticateToken,
  authorize("admin"),
  analyticsController.getAdminFacilityStats
);

// GET /api/analytics/admin/peak-hours?startDate=xxx&endDate=xxx
router.get(
  "/admin/peak-hours",
  authenticateToken,
  authorize("admin"),
  analyticsController.getAdminPeakHours
);

// GET /api/analytics/admin/top-facilities?startDate=xxx&endDate=xxx&limit=10
router.get(
  "/admin/top-facilities",
  authenticateToken,
  authorize("admin"),
  analyticsController.getAdminTopFacilities
);

// GET /api/analytics/admin/top-owners?startDate=xxx&endDate=xxx&limit=10
router.get(
  "/admin/top-owners",
  authenticateToken,
  authorize("admin"),
  analyticsController.getAdminTopOwners
);

// GET /api/analytics/admin/dashboard-overview?range=Today|7d|30d
router.get(
  "/admin/dashboard-overview",
  authenticateToken,
  authorize("admin"),
  analyticsController.getAdminDashboardOverview
);

// Tất cả các route bên dưới đều yêu cầu:
// 1. Đã đăng nhập (authenticateToken)
// 2. Có vai trò "owner" hoặc "admin" (authorize)
// 3. Phải là chủ sở hữu của facilityId (checkFacilityOwnership)

router.use(
  authenticateToken,
  authorize("owner", "admin"),
  checkFacilityOwnership
);

// GET /api/analytics/owner/dashboard?facilityId=xxx&period=month
router.get("/owner/dashboard", analyticsController.getOwnerDashboard);

// GET /api/analytics/owner/revenue?facilityId=xxx&startDate=xxx&endDate=xxx
router.get("/owner/revenue", analyticsController.getOwnerRevenue);

// GET /api/analytics/owner/bookings?facilityId=xxx&startDate=xxx&endDate=xxx
router.get("/owner/bookings", analyticsController.getOwnerBookings);

// GET /api/analytics/owner/courts?facilityId=xxx
router.get("/owner/courts", analyticsController.getOwnerCourts);

// GET /api/analytics/owner/peak-hours?facilityId=xxx&startDate=xxx&endDate=xxx
router.get("/owner/peak-hours", analyticsController.getOwnerPeakHours);

// GET /api/analytics/owner/loyal-customers?facilityId=xxx
router.get("/owner/loyal-customers", analyticsController.getOwnerLoyalCustomers);

// GET /api/analytics/owner/cancellations?facilityId=xxx&startDate=xxx&endDate=xxx
router.get("/owner/cancellations", analyticsController.getOwnerCancellations);

// GET /api/analytics/owner/today-schedule?facilityId=xxx
router.get("/owner/today-schedule", analyticsController.getOwnerTodaySchedule);

export default router;

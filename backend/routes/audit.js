// routes/audit.js
import express from "express";
import AuditLog from "../models/AuditLog.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Tất cả route đều yêu cầu admin
router.use(authenticateToken, requireAdmin);

/**
 * API: Lấy Audit log (Admin only)
 * GET /api/audit/logs
 * Query params:
 * - page: Số trang (default: 1)
 * - limit: Số lượng mỗi trang (default: 20)
 * - userId: Lọc theo user ID
 * - action: Lọc theo action
 * - search: Tìm kiếm theo user name, email, action, details
 * - startDate: Ngày bắt đầu (YYYY-MM-DD)
 * - endDate: Ngày kết thúc (YYYY-MM-DD)
 */
router.get("/logs", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { userId, action, search, startDate, endDate } = req.query;

    // Build query
    const query = {};

    // Filter by user
    if (userId) {
      query.user = userId;
    }

    // Filter by action
    if (action) {
      query.action = action;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Get logs with pagination
    let logsQuery = AuditLog.find(query)
      .populate("user", "name email role") // Lấy thông tin user
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const logs = await logsQuery;
    const total = await AuditLog.countDocuments(query);

    // Filter by search if provided (client-side filtering for text search)
    let filteredLogs = logs;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLogs = logs.filter((log) => {
        const userName = log.user?.name?.toLowerCase() || "";
        const userEmail = log.user?.email?.toLowerCase() || "";
        const actionStr = log.action?.toLowerCase() || "";
        const detailsStr = JSON.stringify(log.details || {}).toLowerCase();
        const ipAddress = log.ipAddress?.toLowerCase() || "";

        return (
          userName.includes(searchLower) ||
          userEmail.includes(searchLower) ||
          actionStr.includes(searchLower) ||
          detailsStr.includes(searchLower) ||
          ipAddress.includes(searchLower)
        );
      });
    }

    // Format logs for frontend
    const formattedLogs = filteredLogs.map((log) => {
      const createdAt = new Date(log.createdAt);
      return {
        id: log._id.toString(),
        user: log.user?.name || "N/A",
        userEmail: log.user?.email || "",
        userRole: log.user?.role || "",
        action: log.action,
        target: log.details?.targetId || log.details?.facilityId || log.details?.bookingId || "-",
        details: log.details ? JSON.stringify(log.details, null, 2) : "-",
        ip: log.ipAddress || "-",
        date: createdAt.toLocaleDateString("vi-VN"),
        time: createdAt.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: log.createdAt,
        rawDetails: log.details,
      };
    });

    res.json({
      success: true,
      data: {
        logs: formattedLogs,
        pagination: {
          page,
          limit,
          total: search ? filteredLogs.length : total,
          pages: Math.ceil((search ? filteredLogs.length : total) / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

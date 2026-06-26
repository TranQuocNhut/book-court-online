// routes/notification.js
import express from "express";
import Notification from "../models/Notification.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// === MIDDLEWARE TÙY CHỈNH ===

// Middleware kiểm tra quyền sở hữu notification
const checkNotificationOwnership = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông báo",
      });
    }

    // User chỉ có thể xem/sửa notification của chính mình
    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập",
      });
    }

    req.notification = notification;
    next();
  } catch (error) {
    next(error);
  }
};

// === CÁC API ENDPOINTS ===

/**
 * GET /api/notifications
 * Lấy danh sách thông báo của user
 * Query params: type, isRead, page, limit
 */
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Xây dựng filter
    const filter = {
      user: req.user._id,
    };

    // Filter theo type
    if (req.query.type) {
      filter.type = req.query.type;
    }

    // Filter theo isRead
    if (req.query.isRead !== undefined) {
      filter.isRead = req.query.isRead === "true" || req.query.isRead === true;
    }

    // Lấy danh sách notifications
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Đếm tổng số
    const total = await Notification.countDocuments(filter);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notifications/unread-count
 * Lấy số lượng thông báo chưa đọc
 */
router.get("/unread-count", authenticateToken, async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    res.json({
      success: true,
      data: {
        unreadCount: count,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Đánh dấu thông báo là đã đọc
 */
router.patch(
  "/:id/read",
  authenticateToken,
  checkNotificationOwnership,
  async (req, res, next) => {
    try {
      const notification = req.notification;

      if (!notification.isRead) {
        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();
      }

      res.json({
        success: true,
        message: "Đánh dấu đã đọc thành công",
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/notifications/mark-all-read
 * Đánh dấu tất cả thông báo là đã đọc
 */
router.patch("/mark-all-read", authenticateToken, async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      {
        user: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    res.json({
      success: true,
      message: `Đánh dấu ${result.modifiedCount} thông báo là đã đọc`,
      data: {
        updatedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/notifications/:id
 * Xóa thông báo
 */
router.delete(
  "/:id",
  authenticateToken,
  checkNotificationOwnership,
  async (req, res, next) => {
    try {
      await Notification.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: "Xóa thông báo thành công",
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/notifications
 * Xóa tất cả thông báo đã đọc
 * Query params: type (optional - chỉ xóa thông báo đã đọc của type này)
 */
router.delete("/", authenticateToken, async (req, res, next) => {
  try {
    const filter = {
      user: req.user._id,
      isRead: true,
    };

    // Nếu có type trong query, chỉ xóa thông báo của type đó
    if (req.query.type) {
      filter.type = req.query.type;
    }

    const result = await Notification.deleteMany(filter);

    res.json({
      success: true,
      message: `Xóa ${result.deletedCount} thông báo đã đọc thành công`,
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

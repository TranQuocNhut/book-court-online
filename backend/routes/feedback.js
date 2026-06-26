// routes/feedback.js
import express from "express";
import Feedback from "../models/Feedback.js";
import Facility from "../models/Facility.js";
import Booking from "../models/Booking.js";
import {
  authenticateToken,
  requireAdmin,
} from "../middleware/auth.js";
import { createNotification } from "../utils/notificationService.js";

const router = express.Router();

// === PUBLIC ROUTES ===

/**
 * POST /api/feedbacks
 * Tạo phản hồi mới (có thể không cần đăng nhập)
 */
router.post("/", async (req, res, next) => {
  try {
    const {
      senderName,
      senderEmail,
      senderPhone,
      type,
      subject,
      content,
      relatedFacilityId,
      relatedBookingId,
    } = req.body;

    // Validation
    if (!senderName || !senderEmail || !type || !subject || !content) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
    }

    if (!["complaint", "feedback"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Loại phản hồi không hợp lệ",
      });
    }

    // Nếu có user đăng nhập, lấy thông tin từ user
    let senderId = null;
    let senderRole = "customer";
    
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(" ")[1];
        const jwt = await import("jsonwebtoken");
        const { config } = await import("../config/config.js");
        const decoded = jwt.default.verify(token, config.jwt.secret);
        const User = (await import("../models/User.js")).default;
        const user = await User.findById(decoded.userId);
        
        if (user) {
          senderId = user._id;
          senderRole = user.role || "customer";
        }
      } catch (error) {
        // Nếu token không hợp lệ, tiếp tục như anonymous user
      }
    }

    // Kiểm tra relatedFacility và relatedBooking nếu có
    if (relatedFacilityId) {
      const facility = await Facility.findById(relatedFacilityId);
      if (!facility) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy cơ sở",
        });
      }
    }

    if (relatedBookingId) {
      const booking = await Booking.findById(relatedBookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đặt sân",
        });
      }
    }

    // Tạo feedback
    const feedback = new Feedback({
      sender: senderId,
      senderName,
      senderEmail,
      senderPhone,
      senderRole,
      type,
      subject,
      content,
      relatedFacility: relatedFacilityId || null,
      relatedBooking: relatedBookingId || null,
      status: "pending",
    });

    await feedback.save();

    // Populate để trả về đầy đủ thông tin
    await feedback.populate([
      { path: "sender", select: "name email avatar" },
      { path: "relatedFacility", select: "name" },
      { path: "relatedBooking", select: "bookingCode" },
    ]);

    res.status(201).json({
      success: true,
      message: "Gửi phản hồi thành công",
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
});

// === ADMIN ROUTES ===

/**
 * GET /api/feedbacks
 * Lấy danh sách phản hồi (Admin only)
 * Query params: page, limit, type, status, search
 */
router.get("/", authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      search,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = { isDeleted: false };

    if (type && ["complaint", "feedback"].includes(type)) {
      query.type = type;
    }

    if (status && ["pending", "resolved"].includes(status)) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { senderName: { $regex: search, $options: "i" } },
        { senderEmail: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    // Get feedbacks
    const feedbacks = await Feedback.find(query)
      .populate("sender", "name email avatar")
      .populate("relatedFacility", "name")
      .populate("relatedBooking", "bookingCode")
      .populate("resolvedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await Feedback.countDocuments(query);

    // Calculate stats
    const stats = {
      total: await Feedback.countDocuments({ isDeleted: false }),
      pending: await Feedback.countDocuments({
        isDeleted: false,
        status: "pending",
      }),
      resolved: await Feedback.countDocuments({
        isDeleted: false,
        status: "resolved",
      }),
      complaints: await Feedback.countDocuments({
        isDeleted: false,
        type: "complaint",
      }),
      suggestions: await Feedback.countDocuments({
        isDeleted: false,
        type: "feedback",
      }),
    };

    res.json({
      success: true,
      data: {
        feedbacks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/feedbacks/:id
 * Lấy chi tiết phản hồi (Admin only)
 */
router.get("/:id", authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const feedback = await Feedback.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate("sender", "name email avatar")
      .populate("relatedFacility", "name address")
      .populate("relatedBooking", "bookingCode createdAt")
      .populate("resolvedBy", "name email");

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phản hồi",
      });
    }

    res.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/feedbacks/:id/resolve
 * Phản hồi và đánh dấu đã xử lý (Admin only)
 */
router.patch(
  "/:id/resolve",
  authenticateToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { adminResponse } = req.body;

      if (!adminResponse || !adminResponse.trim()) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập phản hồi",
        });
      }

      const feedback = await Feedback.findOne({
        _id: req.params.id,
        isDeleted: false,
      }).populate("sender", "name email");

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy phản hồi",
        });
      }

      feedback.status = "resolved";
      feedback.adminResponse = adminResponse.trim();
      feedback.resolvedAt = new Date();
      feedback.resolvedBy = req.user._id;

      await feedback.save();

      await feedback.populate([
        { path: "sender", select: "name email avatar" },
        { path: "relatedFacility", select: "name" },
        { path: "relatedBooking", select: "bookingCode" },
        { path: "resolvedBy", select: "name email" },
      ]);

      // Gửi notification cho user nếu feedback có sender (user đã đăng nhập)
      if (feedback.sender && feedback.sender._id) {
        try {
          const feedbackTypeLabel = feedback.type === "complaint" ? "khiếu nại" : "góp ý";
          const responsePreview = adminResponse.trim().substring(0, 100);
          const responseText = responsePreview + (adminResponse.trim().length > 100 ? "..." : "");
          
          await createNotification({
            userId: feedback.sender._id.toString(),
            type: "feedback",
            title: `Phản hồi về ${feedbackTypeLabel} của bạn`,
            message: `Admin đã phản hồi về ${feedbackTypeLabel} của bạn: "${feedback.subject}". ${responseText}`,
            metadata: {
              feedbackId: feedback._id.toString(),
              type: feedback.type,
              subject: feedback.subject,
            },
            priority: "normal",
          });
        } catch (notifError) {
          // Log error nhưng không fail request
          console.error("Error sending notification:", notifError);
        }
      }

      res.json({
        success: true,
        message: "Phản hồi đã được cập nhật",
        data: feedback,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/feedbacks/:id
 * Xóa phản hồi (Admin only - soft delete)
 */
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const feedback = await Feedback.findOne({
        _id: req.params.id,
        isDeleted: false,
      });

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy phản hồi",
        });
      }

      feedback.isDeleted = true;
      await feedback.save();

      res.json({
        success: true,
        message: "Xóa phản hồi thành công",
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;


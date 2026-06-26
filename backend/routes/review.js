// routes/review.js
import express from "express";
import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import {
  authenticateToken,
  requireAdmin,
} from "../middleware/auth.js";

const router = express.Router();

// === MIDDLEWARE TÙY CHỈNH ===

// Middleware kiểm tra quyền sở hữu review
const checkReviewOwnership = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá",
      });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập",
      });
    }

    req.review = review;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware kiểm tra quyền owner của facility
const checkFacilityOwner = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id).populate({
      path: "facility",
      select: "owner",
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá",
      });
    }

    if (!review.facility) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cơ sở",
      });
    }

    const facilityOwnerId = review.facility.owner._id
      ? review.facility.owner._id.toString()
      : review.facility.owner.toString();

    if (facilityOwnerId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện hành động này",
      });
    }

    req.review = review;
    next();
  } catch (error) {
    next(error);
  }
};

// === CÁC API ENDPOINTS ===

/**
 * POST /api/reviews
 * Tạo đánh giá cho booking (user)
 */
router.post("/", authenticateToken, async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;

    // Validation
    if (!bookingId || !rating) {
      return res.status(400).json({
        success: false,
        message: "bookingId và rating là bắt buộc",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Điểm đánh giá phải từ 1 đến 5",
      });
    }

    // Kiểm tra booking tồn tại và thuộc về user
    const booking = await Booking.findById(bookingId)
      .populate("facility");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền đánh giá booking này",
      });
    }

    // Kiểm tra điều kiện để cho phép đánh giá:
    // 1. Thanh toán tiền mặt: status = "confirmed" VÀ paymentStatus = "paid"
    // 2. Thanh toán online: paymentStatus = "paid"
    const paymentStatus = booking.paymentStatus || 'pending'
    const paymentMethod = booking.paymentMethod || null
    
    const canReview = 
      (paymentMethod === 'cash' && booking.status === 'confirmed' && paymentStatus === 'paid') ||
      (paymentMethod !== 'cash' && paymentStatus === 'paid')
    
    if (!canReview) {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể đánh giá booking đã thanh toán thành công. Đối với thanh toán tiền mặt, booking phải được owner xác nhận.",
      });
    }

    // Kiểm tra đã có review chưa
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "Booking này đã có đánh giá",
      });
    }

    // Tạo review
    const review = new Review({
      user: req.user._id,
      booking: bookingId,
      facility: booking.facility._id,
      rating,
      comment: comment || "",
    });

    await review.save();

    // Populate để trả về
    await review.populate("user", "name email avatar");
    await review.populate("facility", "name address");

    res.status(201).json({
      success: true,
      message: "Tạo đánh giá thành công",
      data: review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Booking này đã có đánh giá",
      });
    }
    next(error);
  }
});

/**
 * GET /api/reviews/facility/:facilityId
 * Lấy danh sách đánh giá của facility (có filter: rating, page, limit)
 */
router.get("/facility/:facilityId", async (req, res, next) => {
  try {
    const { facilityId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {
      facility: facilityId,
      isDeleted: false,
    };

    if (req.query.rating) {
      const rating = parseInt(req.query.rating);
      if (rating >= 1 && rating <= 5) {
        filter.rating = rating;
      }
    }

    // Get reviews
    const reviews = await Review.find(filter)
      .populate("user", "name email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(filter);

    // Get average rating
    const stats = await Review.getAverageRating(facilityId);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reviews/my-reviews
 * Lấy đánh giá của user hiện tại
 */
router.get("/my-reviews", authenticateToken, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({
      user: req.user._id,
      isDeleted: false,
    })
      .populate("facility", "name address")
      .populate("booking", "_id date timeSlots bookingCode")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({
      user: req.user._id,
      isDeleted: false,
    });

    res.json({
      success: true,
      data: {
        reviews,
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
 * PATCH /api/reviews/:id
 * Cập nhật đánh giá (chỉ user tạo review)
 */
router.patch("/:id", authenticateToken, checkReviewOwnership, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    const review = req.review;

    // Chỉ cho phép cập nhật rating và comment
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Điểm đánh giá phải từ 1 đến 5",
        });
      }
      review.rating = rating;
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    await review.save();

    await review.populate("user", "name email avatar");
    await review.populate("facility", "name address");

    res.json({
      success: true,
      message: "Cập nhật đánh giá thành công",
      data: review,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/reviews/:id
 * Xóa đánh giá (chỉ user tạo review)
 */
router.delete("/:id", authenticateToken, checkReviewOwnership, async (req, res, next) => {
  try {
    const review = req.review;

    // Soft delete
    review.isDeleted = true;
    await review.save();

    res.json({
      success: true,
      message: "Xóa đánh giá thành công",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/reviews/:id/reply
 * Owner trả lời đánh giá
 */
router.post("/:id/reply", authenticateToken, checkFacilityOwner, async (req, res, next) => {
  try {
    const { reply } = req.body;

    if (!reply || reply.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nội dung phản hồi là bắt buộc",
      });
    }

    const review = req.review;

    review.ownerReply = {
      reply: reply.trim(),
      repliedAt: new Date(),
      repliedBy: req.user._id,
    };

    await review.save();

    await review.populate("user", "name email avatar");
    await review.populate("facility", "name address");
    await review.populate("ownerReply.repliedBy", "name email");

    res.json({
      success: true,
      message: "Phản hồi đánh giá thành công",
      data: review,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/reviews/:id/report
 * Báo cáo đánh giá (owner)
 */
router.post("/:id/report", authenticateToken, checkFacilityOwner, async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Lý do báo cáo là bắt buộc",
      });
    }

    const review = req.review;

    // Kiểm tra đã báo cáo chưa
    if (review.report && review.report.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "Đánh giá này đang được xử lý báo cáo",
      });
    }

    review.report = {
      status: "pending",
      reason: reason.trim(),
      reportedAt: new Date(),
      reportedBy: req.user._id,
    };

    await review.save();

    res.json({
      success: true,
      message: "Báo cáo đánh giá thành công. Vui lòng chờ admin xử lý.",
      data: review,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reviews/reports
 * Lấy danh sách báo cáo đánh giá (Admin only)
 * Query params: page, limit, status, search
 */
router.get("/reports", authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query - chỉ lấy reviews có report
    const query = {
      isDeleted: false,
      "report.status": status || "pending", // Mặc định chỉ lấy pending
    };

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query["report.status"] = status;
    }

    if (search) {
      // Search sẽ được thực hiện sau khi populate
      // Tạm thời search trong comment và report.reason
      query.$or = [
        { comment: { $regex: search, $options: "i" } },
        { "report.reason": { $regex: search, $options: "i" } },
      ];
    }

    // Get reviews with reports
    const reviews = await Review.find(query)
      .populate("user", "name email avatar")
      .populate("facility", "name")
      .populate("booking", "bookingCode")
      .populate("report.reportedBy", "name email")
      .populate("report.processedBy", "name email")
      .sort({ "report.reportedAt": -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await Review.countDocuments(query);

    // Calculate stats
    const stats = {
      total: await Review.countDocuments({
        isDeleted: false,
        "report.status": { $exists: true },
      }),
      pending: await Review.countDocuments({
        isDeleted: false,
        "report.status": "pending",
      }),
      approved: await Review.countDocuments({
        isDeleted: false,
        "report.status": "approved",
      }),
      rejected: await Review.countDocuments({
        isDeleted: false,
        "report.status": "rejected",
      }),
    };

    res.json({
      success: true,
      data: {
        reviews,
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
 * PATCH /api/reviews/:id/report-status
 * Admin xử lý báo cáo: approved/rejected
 */
router.patch("/:id/report-status", authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái phải là 'approved' hoặc 'rejected'",
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá",
      });
    }

    if (!review.report || review.report.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Đánh giá này không có báo cáo đang chờ xử lý",
      });
    }

    review.report.status = status;
    review.report.processedAt = new Date();
    review.report.processedBy = req.user._id;

    if (adminNotes) {
      review.report.adminNotes = adminNotes.trim();
    }

    // Nếu approved, xóa review (soft delete)
    if (status === "approved") {
      review.isDeleted = true;
    }

    await review.save();

    res.json({
      success: true,
      message: `Xử lý báo cáo thành công: ${status}`,
      data: review,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

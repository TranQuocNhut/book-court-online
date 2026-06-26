// routes/promotion.js
import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Promotion from "../models/Promotion.js";
import User from "../models/User.js";
import {
  authenticateToken,
  requireAdmin,
} from "../middleware/auth.js";
import { logAudit } from "../utils/auditLogger.js";
import { config } from "../config/config.js";

const router = express.Router();

// === CÁC API ENDPOINTS ===

/**
 * GET /api/promotions
 * Lấy danh sách khuyến mãi (public, có thể filter)
 * Query params: status, facilityId, code, page, limit
 * Nếu user là owner, chỉ trả về các khuyến mãi mà owner đó tạo
 */
router.get("/", async (req, res, next) => {
  try {
    const {
      status,
      facilityId,
      code,
      page = 1,
      limit = 20,
      isActive = false, // Nếu true, chỉ lấy các khuyến mãi đang active (dựa trên ngày tháng)
    } = req.query;

    const query = {};

    // Loại bỏ voucher đổi điểm (chỉ dành cho thành viên)
    query.fromReward = { $ne: true };

    // Nếu user đã đăng nhập và là owner, chỉ lấy các khuyến mãi mà owner đó tạo
    // Admin vẫn thấy tất cả
    try {
      const authHeader = req.headers['authorization'];
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        if (token) {
          try {
            const decoded = jwt.verify(token, config.jwt.secret);
            const user = await User.findById(decoded.userId).select('role').lean();
            
            if (user && user.role === 'owner') {
              // Owner chỉ thấy các khuyến mãi mà họ tạo
              query.createdBy = new mongoose.Types.ObjectId(decoded.userId);
            }
            // Admin và user thường vẫn thấy tất cả (không filter theo createdBy)
          } catch (tokenError) {
            // Token không hợp lệ, bỏ qua (xử lý như public request)
          }
        }
      }
    } catch (authError) {
      // Lỗi khi xác thực, bỏ qua (xử lý như public request)
    }

    // Filter theo status
    if (status) {
      query.status = status;
    }

    // Filter theo code
    if (code) {
      query.code = code.toUpperCase();
    }

    // Filter theo facility
    if (facilityId) {
      query.$or = [
        { isAllFacilities: true },
        { applicableFacilities: mongoose.Types.ObjectId.isValid(facilityId) ? new mongoose.Types.ObjectId(facilityId) : null },
      ];
    }

    // Nếu isActive = true, filter theo ngày tháng
    if (isActive === "true" || isActive === true) {
      const now = new Date();
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
      query.status = { $in: ["active", "pending"] };
      query.$or = [
        { maxUsage: null },
        { $expr: { $lt: ["$usageCount", "$maxUsage"] } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const promotions = await Promotion.find(query)
      .populate("applicableFacilities", "name address")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Promotion.countDocuments(query);

    // Tính toán computedStatus cho mỗi promotion
    const promotionsWithStatus = promotions.map((promo) => {
      const now = new Date();
      const start = new Date(promo.startDate);
      const end = new Date(promo.endDate);

      let computedStatus = promo.status;
      if (promo.status !== "inactive") {
        if (now < start) {
          computedStatus = "pending";
        } else if (now > end || (promo.maxUsage !== null && promo.usageCount >= promo.maxUsage)) {
          computedStatus = "expired";
        } else if (now >= start && now <= end) {
          computedStatus = "active";
        }
      }

      return {
        ...promo,
        computedStatus,
      };
    });

    res.json({
      success: true,
      data: {
        promotions: promotionsWithStatus,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/promotions/:id
 * Lấy chi tiết một khuyến mãi (public)
 */
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
      });
    }

    const promotion = await Promotion.findById(req.params.id)
      .populate("applicableFacilities", "name address")
      .populate("createdBy", "name email")
      .lean();

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khuyến mãi",
      });
    }

    // Tính toán computedStatus
    const now = new Date();
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);

    let computedStatus = promotion.status;
    if (promotion.status !== "inactive") {
      if (now < start) {
        computedStatus = "pending";
      } else if (now > end || (promotion.maxUsage !== null && promotion.usageCount >= promotion.maxUsage)) {
        computedStatus = "expired";
      } else if (now >= start && now <= end) {
        computedStatus = "active";
      }
    }

    res.json({
      success: true,
      data: {
        ...promotion,
        computedStatus,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/promotions/validate/:code
 * Validate mã khuyến mãi (public)
 * Query params: facilityId (optional), area (optional)
 */
router.get("/validate/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const { facilityId, area } = req.query;

    const promotion = await Promotion.findOne({ code: code.toUpperCase() })
      .populate("applicableFacilities", "name address")
      .lean();

    if (!promotion) {
      return res.json({
        success: true,
        data: {
          valid: false,
          reason: "Mã khuyến mãi không tồn tại",
        },
      });
    }

    // Sử dụng method isValid
    const promoDoc = await Promotion.findById(promotion._id);
    const validation = promoDoc.isValid(facilityId, area);

    res.json({
      success: true,
      data: {
        ...validation,
        promotion: validation.valid ? promotion : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/promotions
 * Tạo khuyến mãi mới (admin only)
 */
router.post("/", authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      applicableFacilities,
      applicableAreas,
      maxUsage,
      image,
    } = req.body;

    // Validation
    if (!code || !name || !discountType || !discountValue || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
    }

    // Kiểm tra code đã tồn tại chưa
    const existingPromo = await Promotion.findOne({ code: code.toUpperCase() });
    if (existingPromo) {
      return res.status(400).json({
        success: false,
        message: "Mã khuyến mãi đã tồn tại",
      });
    }

    // Xử lý applicableFacilities
    let facilitiesArray = [];
    if (applicableFacilities && Array.isArray(applicableFacilities) && applicableFacilities.length > 0) {
      // Nếu có "Tất cả sân" hoặc "all", thì để trống
      if (!applicableFacilities.includes("Tất cả sân") && !applicableFacilities.includes("all")) {
        facilitiesArray = applicableFacilities
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));
      }
    }

    const promotionData = {
      code: code.toUpperCase(),
      name,
      description,
      discountType,
      discountValue: parseFloat(discountValue),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      applicableFacilities: facilitiesArray,
      applicableAreas: applicableAreas && Array.isArray(applicableAreas) ? applicableAreas : [],
      maxUsage: maxUsage ? parseInt(maxUsage) : null,
      createdBy: req.user._id,
      image: image || undefined,
    };

    const promotion = new Promotion(promotionData);
    await promotion.save();

    await logAudit({
      userId: req.user._id,
      action: "CREATE",
      resource: "Promotion",
      resourceId: promotion._id,
      details: {
        code: promotion.code,
        name: promotion.name,
      },
    });

    const populatedPromotion = await Promotion.findById(promotion._id)
      .populate("applicableFacilities", "name address")
      .populate("createdBy", "name email")
      .lean();

    res.status(201).json({
      success: true,
      message: "Tạo khuyến mãi thành công",
      data: populatedPromotion,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Mã khuyến mãi đã tồn tại",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    next(error);
  }
});

/**
 * PUT /api/promotions/:id
 * Cập nhật khuyến mãi (admin only)
 */
router.put("/:id", authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
      });
    }

    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khuyến mãi",
      });
    }

    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      applicableFacilities,
      applicableAreas,
      maxUsage,
      status,
      image,
    } = req.body;

    // Kiểm tra code nếu có thay đổi
    if (code && code.toUpperCase() !== promotion.code) {
      const existingPromo = await Promotion.findOne({ code: code.toUpperCase() });
      if (existingPromo) {
        return res.status(400).json({
          success: false,
          message: "Mã khuyến mãi đã tồn tại",
        });
      }
      promotion.code = code.toUpperCase();
    }

    // Cập nhật các trường
    if (name) promotion.name = name;
    if (description !== undefined) promotion.description = description;
    if (discountType) promotion.discountType = discountType;
    if (discountValue !== undefined) promotion.discountValue = parseFloat(discountValue);
    if (startDate) promotion.startDate = new Date(startDate);
    if (endDate) promotion.endDate = new Date(endDate);
    if (maxUsage !== undefined) promotion.maxUsage = maxUsage ? parseInt(maxUsage) : null;
    if (status) promotion.status = status;
    if (image !== undefined) promotion.image = image;

    // Xử lý applicableFacilities
    if (applicableFacilities !== undefined) {
      if (Array.isArray(applicableFacilities) && applicableFacilities.length > 0) {
        if (!applicableFacilities.includes("Tất cả sân") && !applicableFacilities.includes("all")) {
          promotion.applicableFacilities = applicableFacilities
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id));
        } else {
          promotion.applicableFacilities = [];
        }
      } else {
        promotion.applicableFacilities = [];
      }
    }

    // Xử lý applicableAreas
    if (applicableAreas !== undefined) {
      promotion.applicableAreas = Array.isArray(applicableAreas) ? applicableAreas : [];
    }

    await promotion.save();

    await logAudit({
      userId: req.user._id,
      action: "UPDATE",
      resource: "Promotion",
      resourceId: promotion._id,
      details: {
        code: promotion.code,
        name: promotion.name,
      },
    });

    const populatedPromotion = await Promotion.findById(promotion._id)
      .populate("applicableFacilities", "name address")
      .populate("createdBy", "name email")
      .lean();

    res.json({
      success: true,
      message: "Cập nhật khuyến mãi thành công",
      data: populatedPromotion,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Mã khuyến mãi đã tồn tại",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    next(error);
  }
});

/**
 * DELETE /api/promotions/:id
 * Xóa khuyến mãi (admin only)
 */
router.delete("/:id", authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
      });
    }

    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khuyến mãi",
      });
    }

    await logAudit({
      userId: req.user._id,
      action: "DELETE",
      resource: "Promotion",
      resourceId: promotion._id,
      details: {
        code: promotion.code,
        name: promotion.name,
      },
    });

    await Promotion.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Xóa khuyến mãi thành công",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/promotions/:id/usage
 * Tăng số lần sử dụng (internal, có thể gọi từ booking service)
 */
router.patch("/:id/usage", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
      });
    }

    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khuyến mãi",
      });
    }

    promotion.usageCount = (promotion.usageCount || 0) + 1;
    await promotion.save();

    res.json({
      success: true,
      message: "Cập nhật số lần sử dụng thành công",
      data: {
        usageCount: promotion.usageCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;


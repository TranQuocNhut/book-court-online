// routes/courtType.js
import express from "express";
import CourtType from "../models/CourtType.js";
import Court from "../models/Court.js";
import SportCategory from "../models/SportCategory.js";
import {
  authenticateToken,
  requireAdmin,
} from "../middleware/auth.js";
import asyncHandler from "express-async-handler";
import { logAudit } from "../utils/auditLogger.js";

const router = express.Router();

/**
 * GET /api/court-types
 * Lấy danh sách loại sân (Public - ai cũng xem được)
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, search, sportCategory } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (sportCategory) {
      query.sportCategory = sportCategory;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const courtTypes = await CourtType.find(query)
      .populate("sportCategory", "name")
      .sort({ order: 1, createdAt: -1 })
      .lean();

    // Đếm số sân cho mỗi loại
    const courtTypesWithCount = await Promise.all(
      courtTypes.map(async (courtType) => {
        const courtCount = await Court.countDocuments({
          type: courtType.name,
        });
        return {
          ...courtType,
          courts: courtCount,
        };
      })
    );

    res.json({
      success: true,
      data: courtTypesWithCount,
    });
  })
);

/**
 * GET /api/court-types/:id
 * Chi tiết loại sân (Public)
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const courtType = await CourtType.findById(req.params.id).populate(
      "sportCategory",
      "name"
    );

    if (!courtType) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy loại sân",
      });
    }

    const courtCount = await Court.countDocuments({
      type: courtType.name,
    });

    res.json({
      success: true,
      data: {
        ...courtType.toObject(),
        courts: courtCount,
      },
    });
  })
);

/**
 * POST /api/court-types
 * Tạo loại sân mới (Chỉ Admin)
 */
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { name, sportCategory, description, features, status, order } =
      req.body;

    // Validate sportCategory
    const category = await SportCategory.findById(sportCategory);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh mục thể thao",
      });
    }

    // Kiểm tra tên đã tồn tại chưa
    const existing = await CourtType.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Tên loại sân đã tồn tại",
      });
    }

    const courtType = new CourtType({
      name,
      sportCategory,
      description,
      features: features || [],
      status: status || "active",
      order: order || 0,
    });

    await courtType.save();
    await courtType.populate("sportCategory", "name");

    logAudit("CREATE_COURT_TYPE", req.user._id, req, {
      courtTypeId: courtType._id,
      courtTypeName: courtType.name,
    });

    res.status(201).json({
      success: true,
      message: "Tạo loại sân thành công",
      data: courtType,
    });
  })
);

/**
 * PUT /api/court-types/:id
 * Cập nhật loại sân (Chỉ Admin)
 */
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { name, sportCategory, description, features, status, order } =
      req.body;

    const courtType = await CourtType.findById(req.params.id);

    if (!courtType) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy loại sân",
      });
    }

    // Validate sportCategory nếu có thay đổi
    if (sportCategory) {
      const category = await SportCategory.findById(sportCategory);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy danh mục thể thao",
        });
      }
    }

    // Nếu đổi tên, kiểm tra trùng
    if (name && name !== courtType.name) {
      const existing = await CourtType.findOne({ name });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Tên loại sân đã tồn tại",
        });
      }
    }

    // Cập nhật
    if (name !== undefined) courtType.name = name;
    if (sportCategory !== undefined) courtType.sportCategory = sportCategory;
    if (description !== undefined) courtType.description = description;
    if (features !== undefined) courtType.features = features;
    if (status !== undefined) courtType.status = status;
    if (order !== undefined) courtType.order = order;

    await courtType.save();
    await courtType.populate("sportCategory", "name");

    logAudit("UPDATE_COURT_TYPE", req.user._id, req, {
      courtTypeId: courtType._id,
      courtTypeName: courtType.name,
    });

    res.json({
      success: true,
      message: "Cập nhật loại sân thành công",
      data: courtType,
    });
  })
);

/**
 * DELETE /api/court-types/:id
 * Xóa loại sân (Chỉ Admin)
 */
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const courtType = await CourtType.findById(req.params.id);

    if (!courtType) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy loại sân",
      });
    }

    // Kiểm tra xem có sân nào đang sử dụng loại này không
    const courtCount = await Court.countDocuments({
      type: courtType.name,
    });

    if (courtCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa loại sân. Có ${courtCount} sân đang sử dụng loại này.`,
      });
    }

    await courtType.deleteOne();

    logAudit("DELETE_COURT_TYPE", req.user._id, req, {
      courtTypeId: courtType._id,
      courtTypeName: courtType.name,
    });

    res.json({
      success: true,
      message: "Xóa loại sân thành công",
    });
  })
);

export default router;


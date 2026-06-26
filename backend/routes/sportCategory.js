// routes/sportCategory.js
import express from "express";
import SportCategory from "../models/SportCategory.js";
import Facility from "../models/Facility.js";
import {
  authenticateToken,
  requireAdmin,
} from "../middleware/auth.js";
import asyncHandler from "express-async-handler";
import { logAudit } from "../utils/auditLogger.js";

const router = express.Router();

/**
 * GET /api/sport-categories
 * Lấy danh sách danh mục thể thao (Public - ai cũng xem được)
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, search } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const categories = await SportCategory.find(query)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    // Đếm số cơ sở cho mỗi danh mục
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const facilityCount = await Facility.countDocuments({
          type: category.name,
        });
        return {
          ...category,
          facilities: facilityCount,
        };
      })
    );

    res.json({
      success: true,
      data: categoriesWithCount,
    });
  })
);

/**
 * GET /api/sport-categories/:id
 * Chi tiết danh mục thể thao (Public)
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const category = await SportCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh mục",
      });
    }

    const facilityCount = await Facility.countDocuments({
      type: category.name,
    });

    res.json({
      success: true,
      data: {
        ...category.toObject(),
        facilities: facilityCount,
      },
    });
  })
);

/**
 * POST /api/sport-categories
 * Tạo danh mục thể thao mới (Chỉ Admin)
 */
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { name, description, status, order } = req.body;

    // Kiểm tra tên đã tồn tại chưa
    const existing = await SportCategory.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Tên danh mục đã tồn tại",
      });
    }

    const category = new SportCategory({
      name,
      description,
      status: status || "active",
      order: order || 0,
    });

    await category.save();

    logAudit("CREATE_SPORT_CATEGORY", req.user._id, req, {
      categoryId: category._id,
      categoryName: category.name,
    });

    res.status(201).json({
      success: true,
      message: "Tạo danh mục thành công",
      data: category,
    });
  })
);

/**
 * PUT /api/sport-categories/:id
 * Cập nhật danh mục thể thao (Chỉ Admin)
 */
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { name, description, status, order } = req.body;

    const category = await SportCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh mục",
      });
    }

    // Nếu đổi tên, kiểm tra trùng
    if (name && name !== category.name) {
      const existing = await SportCategory.findOne({ name });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Tên danh mục đã tồn tại",
        });
      }
    }

    // Cập nhật
    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (status !== undefined) category.status = status;
    if (order !== undefined) category.order = order;

    await category.save();

    logAudit("UPDATE_SPORT_CATEGORY", req.user._id, req, {
      categoryId: category._id,
      categoryName: category.name,
    });

    res.json({
      success: true,
      message: "Cập nhật danh mục thành công",
      data: category,
    });
  })
);

/**
 * DELETE /api/sport-categories/:id
 * Xóa danh mục thể thao (Chỉ Admin)
 */
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const category = await SportCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh mục",
      });
    }

    // Kiểm tra xem có cơ sở nào đang sử dụng danh mục này không
    const facilityCount = await Facility.countDocuments({
      type: category.name,
    });

    if (facilityCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa danh mục. Có ${facilityCount} cơ sở đang sử dụng danh mục này.`,
      });
    }

    await category.deleteOne();

    logAudit("DELETE_SPORT_CATEGORY", req.user._id, req, {
      categoryId: category._id,
      categoryName: category.name,
    });

    res.json({
      success: true,
      message: "Xóa danh mục thành công",
    });
  })
);

export default router;


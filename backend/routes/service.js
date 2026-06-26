import express from "express";
import * as serviceController from "../controllers/serviceController.js";
import { authenticateToken, requireOwnerOrAdmin } from "../middleware/auth.js";
import { uploadRewardImage, cloudinaryUtils } from "../config/cloudinary.js";
import Service from "../models/Service.js";

const router = express.Router();

// Public route - Lấy dịch vụ theo facility (không cần authentication)
router.get("/facility/:facilityId", serviceController.getServicesByFacility);

// Tất cả routes còn lại đều cần authentication
router.use(authenticateToken);

// Owner routes - chỉ owner mới có thể quản lý dịch vụ của mình
router.use(requireOwnerOrAdmin);

// GET /api/services - Lấy tất cả dịch vụ của owner
router.get("/", serviceController.getAllServices);

// POST /api/services - Tạo dịch vụ mới
router.post("/", serviceController.createService);

// PUT /api/services/:id - Cập nhật dịch vụ
router.put("/:id", serviceController.updateService);

// DELETE /api/services/:id - Xóa dịch vụ
router.delete("/:id", serviceController.deleteService);

// PATCH /api/services/:id/toggle-active - Toggle active status
router.patch("/:id/toggle-active", serviceController.toggleActive);

// POST /api/services/:id/upload - Upload ảnh cho dịch vụ
router.post(
  "/:id/upload",
  uploadRewardImage.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Không có file ảnh được upload",
        });
      }

      const imageUrl = req.file.path; // Cloudinary URL
      const imagePublicId = req.file.filename; // Cloudinary public_id

      // Update service with image
      const service = await Service.findById(req.params.id);
      if (!service) {
        // Delete uploaded image if service not found
        if (req.file && req.file.filename) {
          await cloudinaryUtils.deleteImage(req.file.filename);
        }
        return res.status(404).json({
          success: false,
          message: "Dịch vụ không tồn tại",
        });
      }

      // Check ownership
      if (service.owner.toString() !== req.user._id.toString()) {
        // Delete uploaded image
        if (req.file && req.file.filename) {
          await cloudinaryUtils.deleteImage(req.file.filename);
        }
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền upload ảnh cho dịch vụ này",
        });
      }

      // Delete old image if exists
      if (service.imagePublicId) {
        try {
          await cloudinaryUtils.deleteImage(service.imagePublicId);
        } catch (deleteError) {
          console.error("Error deleting old image:", deleteError);
        }
      }

      // Update service with new image
      service.image = imageUrl;
      service.imagePublicId = imagePublicId;
      await service.save();

      res.json({
        success: true,
        message: "Upload ảnh thành công",
        data: {
          image: imageUrl,
          publicId: imagePublicId,
        },
      });
    } catch (error) {
      // If error, delete uploaded image from Cloudinary
      if (req.file && req.file.filename) {
        try {
          await cloudinaryUtils.deleteImage(req.file.filename);
        } catch (deleteError) {
          console.error("Error cleaning up uploaded file:", deleteError);
        }
      }
      next(error);
    }
  }
);

export default router;


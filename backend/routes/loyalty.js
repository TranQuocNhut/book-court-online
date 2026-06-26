import express from "express";
import * as loyaltyController from "../controllers/loyaltyController.js";
import { authenticateToken, requireOwnerOrAdmin } from "../middleware/auth.js";
import { uploadRewardImage, cloudinaryUtils } from "../config/cloudinary.js";
import Reward from "../models/Reward.js";

const router = express.Router();

router.use(authenticateToken);

// Public routes (for users)
router.get("/summary", loyaltyController.getSummary);
router.get("/transactions", loyaltyController.getHistory);
router.get("/rewards", loyaltyController.getRewards);
router.get("/tiers", loyaltyController.getTiers);
router.post("/redeem", loyaltyController.redeemReward);
router.get("/vouchers", loyaltyController.getMyVouchers);

// Owner/Admin routes
router.use(requireOwnerOrAdmin);
router.get("/admin/rewards", loyaltyController.getAllRewards);
router.post("/admin/rewards", loyaltyController.createReward);
router.put("/admin/rewards/:id", loyaltyController.updateReward);
router.delete("/admin/rewards/:id", loyaltyController.deleteReward);

// Upload image for reward
router.post(
  "/admin/rewards/:id/upload",
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

      // Update reward with image
      const reward = await Reward.findById(req.params.id);
      if (!reward) {
        // Delete uploaded image if reward not found
        if (req.file && req.file.filename) {
          await cloudinaryUtils.deleteImage(req.file.filename);
        }
        return res.status(404).json({
          success: false,
          message: "Quà tặng không tồn tại",
        });
      }

      // Delete old image if exists
      if (reward.imagePublicId) {
        try {
          await cloudinaryUtils.deleteImage(reward.imagePublicId);
        } catch (deleteError) {
          console.error("Error deleting old image:", deleteError);
        }
      }

      // Update reward with new image
      reward.image = imageUrl;
      reward.imagePublicId = imagePublicId;
      await reward.save();

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

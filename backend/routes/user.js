// routes/user.js
import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Facility from "../models/Facility.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { logAudit } from "../utils/auditLogger.js";
import upload, { cloudinaryUtils } from "../config/cloudinary.js"; // Cloudinary upload middleware

const router = express.Router();

// Tất cả các route ở đây đều yêu cầu đăng nhập
router.use(authenticateToken);

/**
 * Lấy thông tin user hiện tại (Thay thế cho /api/auth/me)
 * GET /api/users/profile
 */
router.get("/profile", (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user, // req.user đã select('-password -refreshTokens')
    },
  });
});

/**
 * API SỐ 8: Cập nhật hồ sơ cá nhân
 * PUT /api/users/profile
 */
router.put("/profile", async (req, res, next) => {
  try {
    const { name, phone, emailNotifications } = req.body;

    // Validation
    if (!name && !phone && emailNotifications === undefined) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp ít nhất một trường để cập nhật (name, phone hoặc emailNotifications).",
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (emailNotifications !== undefined) {
      updateData.emailNotifications = Boolean(emailNotifications);
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -refreshTokens");

    logAudit("UPDATE_PROFILE", req.user._id, req, updateData);

    res.json({
      success: true,
      message: "Cập nhật hồ sơ thành công.",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * API: Cập nhật thông tin tài khoản ngân hàng (Cho Owner)
 * PUT /api/users/bank-account
 */
router.put("/bank-account", async (req, res, next) => {
  try {
    // Chỉ owner mới được cập nhật
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ chủ sân mới có thể cập nhật thông tin tài khoản ngân hàng",
      });
    }

    const { accountNumber, accountName, bankCode, bankName } = req.body;

    // Validation
    if (!accountNumber || !accountName || !bankCode) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin: số tài khoản, tên chủ tài khoản, và mã ngân hàng",
      });
    }

    const updateData = {
      bankAccount: {
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        bankCode: bankCode.trim(),
        bankName: bankName?.trim() || bankCode,
      },
    };

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -refreshTokens");

    logAudit("UPDATE_BANK_ACCOUNT", req.user._id, req, { bankAccount: updateData.bankAccount });

    res.json({
      success: true,
      message: "Cập nhật thông tin tài khoản ngân hàng thành công.",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * API: Lấy thông tin tài khoản ngân hàng (Cho Owner)
 * GET /api/users/bank-account
 */
router.get("/bank-account", async (req, res, next) => {
  try {
    // Chỉ owner mới được xem
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ chủ sân mới có thể xem thông tin tài khoản ngân hàng",
      });
    }

    const user = await User.findById(req.user._id).select("bankAccount -_id");

    res.json({
      success: true,
      data: {
        bankAccount: user.bankAccount || null,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * API SỐ 9: Cập nhật ảnh đại diện với Cloudinary
 * POST /api/users/avatar
 */
router.post("/avatar", upload.single("avatar"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng upload file ảnh." });
    }

    // Cloudinary trả về thông tin file trong req.file
    // CloudinaryStorage sử dụng 'path' và 'filename' thay vì 'secure_url' và 'public_id'
    const secure_url = req.file.path;
    const public_id = req.file.filename;

    // Lấy user hiện tại để xóa avatar cũ
    const currentUser = await User.findById(req.user._id);
    
    // Xóa avatar cũ từ Cloudinary nếu có
    if (currentUser.avatarPublicId) {
      try {
        await cloudinaryUtils.deleteImage(currentUser.avatarPublicId);
      } catch (deleteError) {
        console.warn('⚠️ Could not delete old avatar:', deleteError.message);
        // Không throw error vì upload mới đã thành công
      }
    }

    // Lưu URL và public_id vào database
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        avatar: secure_url,
        avatarPublicId: public_id // Lưu public_id để có thể xóa sau này
      },
      { new: true }
    ).select("-password -refreshTokens");

    logAudit("UPDATE_AVATAR", req.user._id, req, { 
      url: secure_url, 
      publicId: public_id,
      oldPublicId: currentUser.avatarPublicId
    });

    res.json({
      success: true,
      message: "Cập nhật ảnh đại diện thành công.",
      data: { 
        user,
        uploadInfo: {
          url: secure_url,
          publicId: public_id
        }
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * API SỐ 10: Đa ngôn ngữ (i18n)
 * PATCH /api/users/language
 */
router.patch("/language", async (req, res, next) => {
  try {
    const { language } = req.body;
    if (!["vi", "en"].includes(language)) {
      // Chỉ cho phép 'vi' hoặc 'en'
      return res
        .status(400)
        .json({ success: false, message: "Ngôn ngữ không hợp lệ." });
    }

    req.user.language = language;
    await req.user.save();

    res.json({ success: true, data: { language: req.user.language } });
  } catch (error) {
    next(error);
  }
});

/**
 * API SỐ 11: Đổi mật khẩu
 * PUT /api/users/change-password
 */
router.put("/change-password", async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải có ít nhất 6 ký tự.",
      });
    }

    // Get user with password field
    const user = await User.findById(req.user._id).select("+password");

    // Check if user has password (not OAuth user)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "Tài khoản này đăng ký qua Google, không thể đổi mật khẩu.",
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Mật khẩu hiện tại không đúng.",
      });
    }

    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới không được trùng với mật khẩu hiện tại.",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log audit
    logAudit("CHANGE_PASSWORD", user._id, req);

    res.json({
      success: true,
      message: "Đổi mật khẩu thành công.",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * API: Xóa tài khoản của chính mình
 * DELETE /api/users/account
 */
router.delete("/account", async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Không cho phép admin xóa tài khoản của mình
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản admin không thể tự xóa. Vui lòng liên hệ quản trị viên.",
      });
    }

    // Kiểm tra nếu user là owner và có facilities
    if (user.role === "owner") {
      const facilityCount = await Facility.countDocuments({ 
        owner: user._id,
        status: { $ne: "deleted" }
      });
      
      if (facilityCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Bạn không thể xóa tài khoản vì bạn đang quản lý ${facilityCount} sân. Vui lòng xóa hoặc chuyển quyền quản lý các sân trước khi xóa tài khoản.`,
        });
      }
    }

    // Xóa avatar từ Cloudinary nếu có
    if (user.avatarPublicId) {
      try {
        await cloudinaryUtils.deleteImage(user.avatarPublicId);
        console.log('✅ Deleted avatar from Cloudinary:', user.avatarPublicId);
      } catch (deleteError) {
        console.warn('⚠️ Could not delete avatar from Cloudinary:', deleteError.message);
        // Vẫn tiếp tục xóa tài khoản
      }
    }

    // Soft delete tài khoản
    const deletedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        isDeleted: true,
        deletedAt: new Date(),
        isLocked: false, // Unlock khi xóa
        refreshTokens: [], // Xóa tất cả refresh tokens
      },
      { new: true }
    ).select("-password -refreshTokens");

    logAudit("DELETE_OWN_ACCOUNT", req.user._id, req, {
      userName: user.name,
      email: user.email,
    });

    res.json({
      success: true,
      message: "Tài khoản đã được xóa thành công.",
      data: { user: deletedUser },
    });
  } catch (error) {
    next(error);
  }
});

// --- ADMIN ROUTES ---
// (Di chuyển từ auth.js)

/**
 * Thay đổi vai trò user (Admin only)
 * PUT /api/users/role/:userId
 */
router.put("/role/:userId", requireAdmin, async (req, res, next) => {
  try {
    const { role } = req.body;
    const { userId } = req.params;

    if (!["user", "owner", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password -refreshTokens");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    logAudit("CHANGE_ROLE", req.user._id, req, {
      targetUser: userId,
      newRole: role,
    });

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Lấy tất cả users (Admin only) với search và filter
 * GET /api/users?page=1&limit=10&search=xxx&role=xxx&status=xxx
 */
router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query filters
    const query = {};

    // Search filter
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    // Role filter
    if (req.query.role && ["user", "owner", "admin"].includes(req.query.role)) {
      query.role = req.query.role;
    }

    // Status filter
    if (req.query.status) {
      switch (req.query.status) {
        case "active":
          query.isDeleted = false;
          query.isLocked = false;
          break;
        case "locked":
          query.isLocked = true;
          query.isDeleted = false;
          break;
        case "deleted":
          query.isDeleted = true;
          break;
      }
    } else {
      // Khi không có status filter, chỉ filter deleted nếu có yêu cầu rõ ràng
      // Mặc định lấy TẤT CẢ users (kể cả deleted)
      if (req.query.includeDeleted === 'false') {
        query.isDeleted = false;
      }
      // Nếu không có includeDeleted, không filter gì - lấy tất cả
    }

    const users = await User.find(query)
      .select("-password -refreshTokens")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
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
 * API: Xóa ảnh đại diện
 * DELETE /api/users/avatar
 */
router.delete("/avatar", async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.avatarPublicId) {
      return res.status(400).json({
        success: false,
        message: "Không có ảnh đại diện để xóa."
      });
    }

    // Xóa avatar từ Cloudinary
    try {
      await cloudinaryUtils.deleteImage(user.avatarPublicId);
      console.log('✅ Deleted avatar from Cloudinary:', user.avatarPublicId);
    } catch (deleteError) {
      console.warn('⚠️ Could not delete avatar from Cloudinary:', deleteError.message);
      // Vẫn tiếp tục xóa trong database
    }

    // Xóa avatar trong database
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        avatar: null,
        avatarPublicId: null
      },
      { new: true }
    ).select("-password -refreshTokens");

    logAudit("DELETE_AVATAR", req.user._id, req, { 
      publicId: user.avatarPublicId 
    });

    res.json({
      success: true,
      message: "Xóa ảnh đại diện thành công.",
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
});

// =============================================
// ===== FAVORITES ROUTES (PHẢI ĐẶT TRƯỚC /:userId) =====
// =============================================

/**
 * GET /api/users/favorites
 * Lấy danh sách sân yêu thích của user hiện tại
 */
router.get("/favorites", async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'favorites',
        select: '-owner -createdAt -updatedAt',
        populate: {
          path: 'types',
          select: 'name'
        }
      })
      .select('favorites');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    res.json({
      success: true,
      data: {
        favorites: user.favorites || [],
        count: user.favorites?.length || 0
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users/favorites/:facilityId
 * Thêm sân vào danh sách yêu thích
 */
router.post("/favorites/:facilityId", async (req, res, next) => {
  try {
    const { facilityId } = req.params;

    // Validate facilityId
    if (!mongoose.Types.ObjectId.isValid(facilityId)) {
      return res.status(400).json({
        success: false,
        message: "ID sân không hợp lệ",
      });
    }

    // Kiểm tra facility có tồn tại không
    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sân",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Kiểm tra đã có trong favorites chưa
    if (user.favorites && user.favorites.includes(facilityId)) {
      return res.status(400).json({
        success: false,
        message: "Sân đã có trong danh sách yêu thích",
      });
    }

    // Thêm vào favorites
    if (!user.favorites) {
      user.favorites = [];
    }
    user.favorites.push(facilityId);
    await user.save();

    logAudit("ADD_FAVORITE", req.user._id, req, {
      facilityId: facilityId,
      facilityName: facility.name
    });

    res.json({
      success: true,
      message: "Đã thêm sân vào danh sách yêu thích",
      data: {
        facilityId: facilityId,
        favoritesCount: user.favorites.length
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/users/favorites/:facilityId
 * Xóa sân khỏi danh sách yêu thích
 */
router.delete("/favorites/:facilityId", async (req, res, next) => {
  try {
    const { facilityId } = req.params;

    // Validate facilityId
    if (!mongoose.Types.ObjectId.isValid(facilityId)) {
      return res.status(400).json({
        success: false,
        message: "ID sân không hợp lệ",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Kiểm tra có trong favorites không
    if (!user.favorites || !user.favorites.includes(facilityId)) {
      return res.status(400).json({
        success: false,
        message: "Sân không có trong danh sách yêu thích",
      });
    }

    // Xóa khỏi favorites
    user.favorites = user.favorites.filter(
      (id) => id.toString() !== facilityId
    );
    await user.save();

    const facility = await Facility.findById(facilityId);

    logAudit("REMOVE_FAVORITE", req.user._id, req, {
      facilityId: facilityId,
      facilityName: facility?.name || 'Unknown'
    });

    res.json({
      success: true,
      message: "Đã xóa sân khỏi danh sách yêu thích",
      data: {
        facilityId: facilityId,
        favoritesCount: user.favorites.length
      },
    });
  } catch (error) {
    next(error);
  }
});

// --- TOURNAMENT FEE CONFIG ROUTES (Must be before /:userId route) ---

/**
 * GET /api/users/tournament-fee-config
 * Lấy cấu hình phí giải đấu của owner hiện tại
 */
router.get("/tournament-fee-config", async (req, res, next) => {
  try {
    // Chỉ owner mới có thể xem cấu hình phí giải đấu
    if (!req.user || req.user.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Chỉ owner mới có thể xem cấu hình phí giải đấu",
      });
    }

    const user = await User.findById(req.user._id).select("tournamentFeeConfig");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Trả về cấu hình hoặc giá trị mặc định
    const rawConfig = user.tournamentFeeConfig || {
      registrationFee: 0,
      internalTournamentFees: {
        serviceFee: 0,
        courtTypeFees: new Map(),
        refereeFee: 0,
      },
    };

    // Build config object manually để đảm bảo Map được convert đúng
    const config = {
      registrationFee: rawConfig.registrationFee || 0,
      internalTournamentFees: {
        serviceFee: rawConfig.internalTournamentFees?.serviceFee || 0,
        refereeFee: rawConfig.internalTournamentFees?.refereeFee || 0,
        courtTypeFees: {}
      }
    };

    // Convert Map to Object - xử lý cả Map instance và plain object từ MongoDB
    const rawCourtTypeFees = rawConfig.internalTournamentFees?.courtTypeFees;
    if (rawCourtTypeFees) {
      if (rawCourtTypeFees instanceof Map) {
        // Nếu là Map instance, convert sang Object
        config.internalTournamentFees.courtTypeFees = Object.fromEntries(
          rawCourtTypeFees
        );
      } else if (typeof rawCourtTypeFees === 'object' && 
                 rawCourtTypeFees !== null &&
                 !Array.isArray(rawCourtTypeFees)) {
        // Nếu đã là plain object (sau khi load từ MongoDB), giữ nguyên
        config.internalTournamentFees.courtTypeFees = rawCourtTypeFees;
      }
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/tournament-fee-config
 * Lưu cấu hình phí giải đấu của owner
 */
router.put("/tournament-fee-config", async (req, res, next) => {
  try {
    // Chỉ owner mới có thể cập nhật cấu hình phí giải đấu
    if (!req.user || req.user.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Chỉ owner mới có thể cập nhật cấu hình phí giải đấu",
      });
    }

    const {
      registrationFee,
      internalTournamentFees,
    } = req.body;

    // Validation
    if (registrationFee !== undefined && (isNaN(registrationFee) || registrationFee < 0)) {
      return res.status(400).json({
        success: false,
        message: "Phí đăng ký phải là số không âm",
      });
    }

    if (internalTournamentFees) {
      if (internalTournamentFees.serviceFee !== undefined && 
          (isNaN(internalTournamentFees.serviceFee) || internalTournamentFees.serviceFee < 0)) {
        return res.status(400).json({
          success: false,
          message: "Phí tạo giải phải là số không âm",
        });
      }

      if (internalTournamentFees.refereeFee !== undefined && 
          (isNaN(internalTournamentFees.refereeFee) || internalTournamentFees.refereeFee < 0)) {
        return res.status(400).json({
          success: false,
          message: "Phí trọng tài phải là số không âm",
        });
      }

      // Validate courtTypeFees nếu có
      if (internalTournamentFees.courtTypeFees) {
        const courtTypeFees = internalTournamentFees.courtTypeFees;
        for (const [courtTypeId, fee] of Object.entries(courtTypeFees)) {
          // Convert fee sang number nếu là string
          const feeNumber = typeof fee === 'string' ? parseFloat(fee) : fee;
          if (isNaN(feeNumber) || feeNumber < 0) {
            return res.status(400).json({
              success: false,
              message: `Phí cho loại sân ${courtTypeId} phải là số không âm`,
            });
          }
        }
      }
    }

    // Lấy user hiện tại
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Khởi tạo tournamentFeeConfig nếu chưa có
    if (!user.tournamentFeeConfig) {
      user.tournamentFeeConfig = {
        registrationFee: 0,
        internalTournamentFees: {
          serviceFee: 0,
          courtTypeFees: new Map(),
          refereeFee: 0,
        },
      };
    }

    // Cập nhật registrationFee nếu có
    if (registrationFee !== undefined) {
      user.tournamentFeeConfig.registrationFee = registrationFee;
    }

    // Cập nhật internalTournamentFees nếu có
    if (internalTournamentFees) {
      if (internalTournamentFees.serviceFee !== undefined) {
        user.tournamentFeeConfig.internalTournamentFees.serviceFee = internalTournamentFees.serviceFee;
      }

      if (internalTournamentFees.refereeFee !== undefined) {
        user.tournamentFeeConfig.internalTournamentFees.refereeFee = internalTournamentFees.refereeFee;
      }

      // Cập nhật courtTypeFees
      if (internalTournamentFees.courtTypeFees) {
        // Khởi tạo Map nếu chưa có
        if (!(user.tournamentFeeConfig.internalTournamentFees.courtTypeFees instanceof Map)) {
          user.tournamentFeeConfig.internalTournamentFees.courtTypeFees = new Map();
        }

        // Cập nhật từng courtTypeFee
        for (const [courtTypeId, fee] of Object.entries(internalTournamentFees.courtTypeFees)) {
          // Convert fee sang number nếu là string
          const feeNumber = typeof fee === 'string' ? parseFloat(fee) : Number(fee);
          
          // Chỉ lưu nếu fee là số hợp lệ và > 0
          if (!isNaN(feeNumber) && feeNumber > 0) {
            user.tournamentFeeConfig.internalTournamentFees.courtTypeFees.set(courtTypeId, feeNumber);
          } else {
            // Xóa nếu fee = 0, NaN, hoặc rỗng
            user.tournamentFeeConfig.internalTournamentFees.courtTypeFees.delete(courtTypeId);
          }
        }
      }
    }

    await user.save();

    // Reload user để đảm bảo có dữ liệu mới nhất
    const savedUser = await User.findById(req.user._id).select("tournamentFeeConfig");
    
    // Convert Map to Object để trả về
    const config = savedUser.tournamentFeeConfig ? { ...savedUser.tournamentFeeConfig.toObject() } : {};
    if (config.internalTournamentFees?.courtTypeFees instanceof Map) {
      config.internalTournamentFees.courtTypeFees = Object.fromEntries(
        config.internalTournamentFees.courtTypeFees
      );
    }

    await logAudit(
      "UPDATE_TOURNAMENT_FEE_CONFIG",
      req.user._id,
      req,
      {
        config: config,
      }
    );

    res.json({
      success: true,
      message: "Cập nhật cấu hình phí giải đấu thành công",
      data: config,
    });
  } catch (error) {
    next(error);
  }
});

// --- ADMIN USER MANAGEMENT ROUTES ---

/**
 * GET /api/users/:userId
 * Lấy chi tiết user (Admin only)
 */
router.get("/:userId", requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select("-password -refreshTokens");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Nếu user là owner, lấy danh sách facilities của họ
    let facilities = [];
    if (user.role === "owner") {
      facilities = await Facility.find({ 
        owner: userId,
        status: { $ne: "deleted" }
      })
      .select("name address status createdAt")
      .sort({ createdAt: -1 });
    }

    // Get additional stats if needed
    // TODO: Có thể thêm stats về booking, revenue, etc.

    res.json({
      success: true,
      data: { 
        user: user.toObject(),
        facilities: facilities.length > 0 ? facilities : undefined
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/users/:userId/lock
 * Khóa tài khoản (Admin only)
 */
router.patch("/:userId/lock", requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Không cho phép khóa chính mình
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Bạn không thể khóa chính tài khoản của mình",
      });
    }

    // Không cho phép khóa admin khác
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    if (targetUser.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Không thể khóa tài khoản admin",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isLocked: true },
      { new: true }
    ).select("-password -refreshTokens");

    logAudit("LOCK_USER", req.user._id, req, {
      targetUser: userId,
      userName: user.name,
    });

    res.json({
      success: true,
      message: `Đã khóa tài khoản ${user.name}`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/users/:userId/unlock
 * Mở khóa tài khoản (Admin only)
 */
router.patch("/:userId/unlock", requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { isLocked: false },
      { new: true }
    ).select("-password -refreshTokens");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    logAudit("UNLOCK_USER", req.user._id, req, {
      targetUser: userId,
      userName: user.name,
    });

    res.json({
      success: true,
      message: `Đã mở khóa tài khoản ${user.name}`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/users/:userId
 * Soft delete user (Admin only)
 */
router.delete("/:userId", requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Không cho phép xóa chính mình
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Bạn không thể xóa chính tài khoản của mình",
      });
    }

    // Không cho phép xóa admin khác
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    if (targetUser.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Không thể xóa tài khoản admin",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isDeleted: true,
        deletedAt: new Date(),
        isLocked: false, // Unlock khi xóa
      },
      { new: true }
    ).select("-password -refreshTokens");

    logAudit("DELETE_USER", req.user._id, req, {
      targetUser: userId,
      userName: user.name,
    });

    res.json({
      success: true,
      message: `Đã xóa tài khoản ${user.name}`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/users/:userId/restore
 * Khôi phục user đã xóa (Admin only)
 */
router.patch("/:userId/restore", requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isDeleted: false,
        deletedAt: null,
      },
      { new: true }
    ).select("-password -refreshTokens");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    logAudit("RESTORE_USER", req.user._id, req, {
      targetUser: userId,
      userName: user.name,
    });

    res.json({
      success: true,
      message: `Đã khôi phục tài khoản ${user.name}`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/:userId
 * Lấy thông tin user theo ID (Admin only)
 */
router.get("/:userId", requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select("-password -refreshTokens");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Nếu user là owner, lấy danh sách facilities của họ
    let facilities = [];
    if (user.role === "owner") {
      facilities = await Facility.find({ 
        owner: userId,
        status: { $ne: "deleted" }
      })
      .select("name address status createdAt")
      .sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      data: { 
        user: user.toObject(),
        facilities: facilities.length > 0 ? facilities : undefined
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

import express from "express";
import passport from "passport";
import User from "../models/User.js";
import {
  authenticateToken,
  generateTokens,
  refreshToken,
} from "../middleware/auth.js";
import { authLimiter, loginLimiter } from "../middleware/rateLimiter.js";

// === CÁC IMPORT MỚI CHO TÍNH NĂNG MỚI ===
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { config } from "../config/config.js"; // Import config
import { generateOtp, generateResetToken } from "../utils/tokenGenerator.js";
import { sendEmail } from "../utils/emailService.js";
import { logAudit } from "../utils/auditLogger.js";

const router = express.Router();

// =============================================
// ===== CÁC API MỚI (API 1, 3, 4, 5, 6) =====
// =============================================

/**
 * API MỚI: Đăng ký bằng Email
 * POST /api/auth/register
 */
router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Check if email already exists (including unverified users)
    let user = await User.findByEmail(email);
    if (user) {
      // If user exists but not verified, allow resending OTP
      if (!user.isEmailVerified) {
        // Regenerate OTP
        const otp = generateOtp();
        const otpExpires = Date.now() + 10 * 60 * 1000; // 10 phút
        
        user.otpCode = otp;
        user.otpExpires = otpExpires;
        await user.save();

        // Gửi email OTP
        await sendEmail({
          to: user.email,
          subject: "Mã xác thực OTP cho DAT-SAN-ONLINE",
          html: `<p>Mã OTP của bạn là: <b>${otp}</b>. Mã này có hiệu lực trong 10 phút.</p>`,
        });

        res.status(200).json({
          success: true,
          message: "Mã OTP mới đã được gửi đến email của bạn.",
        });
        return;
      }
      
      return res.status(400).json({
        success: false,
        message: "Email đã được sử dụng",
      });
    }

    // Create user but don't save yet - store in temporary location
    // We'll use a new approach: save with pending state
    const otp = generateOtp();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 phút

    // Password will be hashed automatically by User model's pre-save middleware
    user = new User({
      email,
      password: password, // Plain password - will be hashed by pre-save middleware
      name,
      otpCode: otp,
      otpExpires: otpExpires,
      isEmailVerified: false, // Yêu cầu xác thực
      isActive: false, // Chưa active
    });

    // Save user in pending state
    await user.save();

    // Gửi email OTP
    await sendEmail({
      to: user.email,
      subject: "Mã xác thực OTP cho DAT-SAN-ONLINE",
      html: `<p>Mã OTP của bạn là: <b>${otp}</b>. Mã này có hiệu lực trong 10 phút.</p>`,
    });

    logAudit("REGISTER_PENDING", user._id, req);

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP.",
    });
  } catch (error) {
    next(error); // Chuyển cho errorHandler
  }
});

/**
 * API SỐ 3: Xác thực tài khoản (OTP)
 * POST /api/auth/verify-otp
 */
router.post("/verify-otp", authLimiter, async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email }).select("+otpCode +otpExpires");

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Email không tồn tại" });
    }

    if (user.otpCode !== otp || user.otpExpires < Date.now()) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Mã OTP không hợp lệ hoặc đã hết hạn",
        });
    }

    // Only activate user if they haven't been activated yet
    // This prevents unverified users from being active
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      user.isActive = true;
      user.otpCode = undefined;
      user.otpExpires = undefined;
      await user.save();

      logAudit("VERIFY_OTP", user._id, req);

      res.json({ success: true, message: "Xác thực tài khoản thành công." });
    } else {
      // Already verified
      res.json({ success: true, message: "Tài khoản đã được xác thực trước đó." });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * API SỐ 1: Đăng nhập bằng email/sđt
 * POST /api/auth/login
 */
router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email).select("+password");

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Email hoặc mật khẩu không đúng" });
    }

    if (!user.password) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Tài khoản này được đăng ký qua Google, vui lòng đăng nhập bằng Google.",
        });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Email hoặc mật khẩu không đúng" });
    }

    if (!user.isActive) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Tài khoản chưa được kích hoạt hoặc đã bị khóa.",
        });
    }

    // Tạo tokens
    const tokens = generateTokens(user);
    await user.addRefreshToken(tokens.refreshToken);
    await user.updateLoginInfo();

    logAudit("LOGIN", user._id, req);

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * API SỐ 4: Quên mật khẩu
 * POST /api/auth/forgot-password
 */
router.post("/forgot-password", authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);

    if (!user) {
      return res.json({
        success: true,
        message: "Nếu email tồn tại, bạn sẽ nhận được link reset mật khẩu.",
      });
    }

    const { plainToken, hashedToken } = generateResetToken();
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 phút
    await user.save();

    const resetUrl = `${config.frontendUrl}/reset-password/${plainToken}`;

    await sendEmail({
      to: user.email,
      subject: "Yêu cầu reset mật khẩu DAT-SAN-ONLINE",
      html: `<p>Nhấn vào link sau để reset mật khẩu: <a href="${resetUrl}">${resetUrl}</a></p>
             <p>Link có hiệu lực trong 30 phút.</p>`,
    });

    logAudit("FORGOT_PASSWORD", user._id, req);

    res.json({
      success: true,
      message: "Nếu email tồn tại, bạn sẽ nhận được link reset mật khẩu.",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * API SỐ 5: Thiết lập lại mật khẩu
 * POST /api/auth/reset-password/:token
 */
router.post("/reset-password/:token", authLimiter, async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Token không hợp lệ hoặc đã hết hạn.",
        });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshTokens = []; // Xóa tất cả session cũ
    await user.save();

    logAudit("RESET_PASSWORD", user._id, req);

    res.json({ success: true, message: "Reset mật khẩu thành công." });
  } catch (error) {
    next(error);
  }
});

/**
 * API SỐ 6: Quản lý đa thiết bị / session
 * GET /api/auth/sessions
 */
router.get("/sessions", authenticateToken, async (req, res) => {
  // Query lại user để lấy refreshTokens
  const userWithTokens = await User.findById(req.user._id).select('refreshTokens');
  
  const sessions = userWithTokens.refreshTokens.map((rt) => ({
    id: rt._id,
    createdAt: rt.createdAt,
  }));
  res.json({ success: true, data: sessions });
});

/**
 * API SỐ 6: Xóa session
 * DELETE /api/auth/sessions/:sessionId
 */
router.delete(
  "/sessions/:sessionId",
  authenticateToken,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      // Bạn cần thêm method `removeRefreshTokenById` vào User.js
      await req.user.removeRefreshTokenById(sessionId);
      res.json({ success: true, message: "Session đã được xóa." });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// ===== CÁC API GỐC CỦA BẠN (ĐÃ CẬP NHẬT) =====
// =============================================

// Google OAuth2 routes
router.get(
  "/google",
  authLimiter,
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/failure", //
  }),
  async (req, res) => {
    try {
      const tokens = generateTokens(req.user); //
      await req.user.addRefreshToken(tokens.refreshToken); //

      // THÊM MỚI (API SỐ 7)
      logAudit("LOGIN_GOOGLE", req.user._id, req);

      // Redirect về frontend (Sử dụng config.frontendUrl)
      const redirectUrl =
        `${
          config.frontendUrl // Giữ nguyên localhost fallback từ config.js
        }/auth/callback?` +
        `access_token=${tokens.accessToken}&` +
        `refresh_token=${tokens.refreshToken}&` +
        `user=${encodeURIComponent(
          JSON.stringify({
            id: req.user._id,
            email: req.user.email,
            name: req.user.name,
            avatar: req.user.avatar,
            role: req.user.role,
          })
        )}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error("OAuth callback error:", error); //
      res.redirect(
        `${config.frontendUrl}/auth/error` // Giữ nguyên localhost fallback
      );
    }
  }
);

// OAuth failure route
router.get("/failure", (req, res) => {
  res.redirect(
    `${config.frontendUrl}/auth/error` // Giữ nguyên localhost fallback
  );
});

// Logout route
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    const { refreshToken: token } = req.body; //

    if (token && req.user) {
      //
      try {
        await req.user.removeRefreshToken(token); //
      } catch (tokenError) {
        //
        console.warn(
          "Warning: Failed to remove refresh token:",
          tokenError.message
        ); //
      }
    }

    // THÊM MỚI (API SỐ 7)
    logAudit("LOGOUT", req.user._id, req);

    res.json({
      success: true,
      message: "Logged out successfully",
    }); //
  } catch (error) {
    console.error("Logout error:", error); //
    res.status(500).json({
      success: false,
      message: "Logout failed",
    }); //
  }
});

// Refresh token route
router.post("/refresh", refreshToken);

// =============================================
// ===== CÁC API ĐÃ DI CHUYỂN SANG USER.JS =====
// =============================================
// GET /me -> Đã chuyển sang routes/user.js
// PUT /profile -> Đã chuyển sang routes/user.js
// PUT /role/:userId -> Đã chuyển sang routes/user.js
// GET /users -> Đã chuyển sang routes/user.js

export default router;

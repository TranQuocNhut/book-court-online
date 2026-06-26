import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Referral from "../models/Referral.js";
import LoyaltyTransaction from "../models/LoyaltyTransaction.js";
import QRCode from "qrcode";
import { config } from "../config/config.js";

export const getReferralInfo = asyncHandler(async (req, res) => {
  let user = await User.findById(req.user._id);

  // Nếu user cũ chưa có code, tạo ngay lúc này
  if (!user.referralCode) {
    // Logic tạo code (đơn giản hóa)
    user.referralCode = `REF${user._id.toString().slice(-6).toUpperCase()}`;
    await user.save();
  }

  const referralLink = `${config.frontendUrl}/register?ref=${user.referralCode}`;
  const qrCodeData = await QRCode.toDataURL(referralLink);

  res.json({
    success: true,
    data: {
      referral_code: user.referralCode,
      referral_link: referralLink,
      qr_code_url: qrCodeData,
      reward_policy: "Bạn nhận 500 điểm, bạn bè nhận Voucher 50k",
    },
  });
});

export const getReferralStats = asyncHandler(async (req, res) => {
  const referrals = await Referral.find({ referrer: req.user._id })
    .populate("referee", "name avatar createdAt")
    .sort({ createdAt: -1 });

  const totalInvited = referrals.length;
  const totalPoints = referrals.reduce((sum, ref) => sum + ref.rewardEarned, 0);

  const history = referrals.map((ref) => ({
    invited_user_name: ref.referee.name,
    avatar: ref.referee.avatar,
    status: ref.status,
    points_earned: ref.rewardEarned,
    date: ref.createdAt,
  }));

  res.json({
    success: true,
    data: {
      total_invited: totalInvited,
      total_points_earned: totalPoints,
      history,
    },
  });
});

export const applyReferralCode = asyncHandler(async (req, res) => {
  const { referral_code } = req.body;
  const currentUser = req.user;

  // 1. Validate
  if (currentUser.referredBy) {
    return res
      .status(400)
      .json({ success: false, message: "Bạn đã nhập mã giới thiệu rồi" });
  }

  // Chỉ cho phép nhập mã trong vòng 24h sau khi đăng ký (Logic tùy chọn)
  const oneDay = 24 * 60 * 60 * 1000;
  if (Date.now() - new Date(currentUser.createdAt).getTime() > oneDay) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Đã quá thời hạn nhập mã giới thiệu (24h)",
      });
  }

  const referrer = await User.findOne({
    referralCode: referral_code.toUpperCase(),
  });
  if (!referrer) {
    return res
      .status(404)
      .json({ success: false, message: "Mã giới thiệu không tồn tại" });
  }

  if (referrer._id.toString() === currentUser._id.toString()) {
    return res
      .status(400)
      .json({ success: false, message: "Không thể nhập mã của chính mình" });
  }

  // 2. Update User & Create Referral Record
  currentUser.referredBy = referrer._id;
  await currentUser.save();

  await Referral.create({
    referrer: referrer._id,
    referee: currentUser._id,
    status: "PENDING", // Chờ completed khi user mới đặt sân
    rewardEarned: 0,
  });

  // 3. Có thể tặng quà ngay cho người nhập mã (Referee)
  // Ví dụ: Tặng voucher 20k

  res.json({
    success: true,
    message:
      "Áp dụng mã thành công. Hãy đặt sân ngay để người giới thiệu nhận thưởng!",
  });
});

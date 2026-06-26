import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import LoyaltyTransaction from "../models/LoyaltyTransaction.js";
import Reward from "../models/Reward.js";
import Promotion from "../models/Promotion.js"; // Tận dụng model Promotion có sẵn để tạo Voucher
import Facility from "../models/Facility.js";

// Helper tính hạng
const calculateTier = (points) => {
  if (points >= 10000) return { id: "gold", name: "Vàng", next: null };
  if (points >= 5000) return { id: "silver", name: "Bạc", next: 10000 };
  return { id: "bronze", name: "Đồng", next: 5000 };
};

export const getSummary = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const tierInfo = calculateTier(user.lifetimePoints);

  res.json({
    success: true,
    data: {
      current_points: user.loyaltyPoints,
      lifetime_points: user.lifetimePoints,
      current_tier: {
        id: tierInfo.id,
        name: tierInfo.name,
        icon_url: `https://your-domain.com/assets/tiers/${tierInfo.id}.png`, // Mock URL
      },
      next_tier: tierInfo.next
        ? {
            id: tierInfo.id === "bronze" ? "silver" : "gold",
            points_required: tierInfo.next,
            progress_percentage: Math.min(
              100,
              (user.lifetimePoints / tierInfo.next) * 100
            ),
          }
        : null,
    },
  });
});

export const getHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const type = req.query.type; // EARN hoặc REDEEM

  const query = { user: req.user._id };
  if (type) query.type = type;

  const transactions = await LoyaltyTransaction.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  // Populate reward information for REDEEM transactions
  const transactionsWithRewards = await Promise.all(
    transactions.map(async (transaction) => {
      const transactionObj = transaction.toObject();
      if (
        transaction.type === "REDEEM" &&
        transaction.source?.sourceType === "Reward" &&
        transaction.source?.sourceId
      ) {
        const reward = await Reward.findById(transaction.source.sourceId).select(
          "name image"
        );
        if (reward) {
          transactionObj.reward = {
            _id: reward._id,
            name: reward.name,
            image: reward.image,
          };
        }
      }
      return transactionObj;
    })
  );

  const total = await LoyaltyTransaction.countDocuments(query);

  res.json({
    success: true,
    data: { transactions: transactionsWithRewards, pagination: { page, limit, total } },
  });
});

export const getRewards = asyncHandler(async (req, res) => {
  const rewards = await Reward.find({ isActive: true });
  res.json({ success: true, data: rewards });
});

export const getTiers = asyncHandler(async (req, res) => {
  // Dữ liệu tĩnh hoặc lấy từ DB cấu hình
  res.json({
    success: true,
    data: [
      { id: "bronze", name: "Đồng", min_points: 0, benefits: ["Tích điểm 1%"] },
      {
        id: "silver",
        name: "Bạc",
        min_points: 5000,
        benefits: ["Tích điểm 2%", "Ưu tiên đặt sân"],
      },
      {
        id: "gold",
        name: "Vàng",
        min_points: 10000,
        benefits: ["Tích điểm 3%", "Nước uống miễn phí"],
      },
    ],
  });
});

export const redeemReward = asyncHandler(async (req, res) => {
  const { rewardId } = req.body;
  const user = await User.findById(req.user._id);
  const reward = await Reward.findById(rewardId);

  if (!reward || !reward.isActive) {
    return res
      .status(404)
      .json({ success: false, message: "Quà không tồn tại hoặc đã hết hạn" });
  }

  if (user.loyaltyPoints < reward.pointCost) {
    return res
      .status(400)
      .json({ success: false, message: "Không đủ điểm để đổi quà" });
  }

  // 1. Trừ điểm User
  user.loyaltyPoints -= reward.pointCost;
  await user.save();

  // 2. Lưu lịch sử giao dịch
  await LoyaltyTransaction.create({
    user: user._id,
    type: "REDEEM",
    amount: -reward.pointCost,
    description: `Đổi quà: ${reward.name}`,
    source: { sourceType: "Reward", sourceId: reward._id },
  });

  // 3. Xử lý trao quà (Tạo Voucher vào ví voucher của user)
  let rewardData = {};
  let voucherPromotion = null;
  if (reward.type === "VOUCHER") {
    // Tạo mã voucher unique (chỉ chữ cái và số, không có dấu gạch ngang)
    const userIdSuffix = user._id.toString().slice(-4).toUpperCase();
    const timestampSuffix = Date.now().toString().slice(-4);
    const voucherCode = `VOUCHER${userIdSuffix}${timestampSuffix}`;

    // Tính toán ngày hết hạn (mặc định 90 ngày)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90);

    // Xác định discountType và discountValue
    const discountType = reward.voucherType || "fixed";
    const discountValue = reward.voucherValue || 0;

    // Lấy danh sách facility của owner tạo reward (nếu có)
    let applicableFacilities = [];
    let isAllFacilities = false;
    
    if (reward.createdBy) {
      // Lấy tất cả facility của owner tạo reward
      const ownerFacilities = await Facility.find({ 
        owner: reward.createdBy,
        status: "opening" // Chỉ lấy facility đang mở
      }).select("_id");
      
      applicableFacilities = ownerFacilities.map(f => f._id);
      isAllFacilities = false; // Chỉ áp dụng cho facility của owner
    } else {
      // Nếu reward không có createdBy (reward cũ), áp dụng cho tất cả
      isAllFacilities = true;
    }

    // Lưu vào bảng Promotion
    voucherPromotion = await Promotion.create({
      code: voucherCode,
      name: reward.name,
      description: reward.description || `Voucher từ đổi điểm: ${reward.name}`,
      discountType: discountType,
      discountValue: discountValue,
      startDate: startDate,
      endDate: endDate,
      isAllFacilities: isAllFacilities,
      applicableFacilities: applicableFacilities,
      status: "active",
      maxUsage: 1, // Mỗi voucher chỉ dùng 1 lần
      usageCount: 0,
      createdBy: user._id,
      fromReward: true,
      rewardId: reward._id,
      ownedBy: user._id,
    });

    rewardData = {
      code: voucherCode,
      value: reward.voucherValue,
      voucherType: discountType,
      promotionId: voucherPromotion._id,
    };
  }

  res.json({
    success: true,
    message: "Đổi quà thành công",
    data: {
      remaining_points: user.loyaltyPoints,
      reward_detail: rewardData,
    },
  });
});

// Lấy danh sách voucher của user (từ reward)
export const getMyVouchers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = {
    fromReward: true,
    ownedBy: req.user._id,
  };

  // Lấy tất cả voucher của user (bao gồm cả đã hết hạn/đã dùng)
  const vouchers = await Promotion.find(query)
    .populate("rewardId", "name image")
    .populate("applicableFacilities", "_id name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Promotion.countDocuments(query);

  res.json({
    success: true,
    data: {
      vouchers: vouchers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// Owner/Admin: Tạo quà tặng mới
export const createReward = asyncHandler(async (req, res) => {
  const { name, description, pointCost, type, voucherValue, voucherType, stock, image } = req.body;

  if (!name || !pointCost || !type) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng điền đầy đủ thông tin bắt buộc (tên, điểm, loại)",
    });
  }

  if (type === "VOUCHER" && (!voucherValue || !voucherType)) {
    return res.status(400).json({
      success: false,
      message: "Voucher cần có giá trị và loại giảm giá",
    });
  }

  const reward = await Reward.create({
    name,
    description,
    pointCost: parseInt(pointCost),
    type,
    voucherValue: voucherValue ? parseFloat(voucherValue) : 0,
    voucherType: voucherType || "fixed",
    stock: stock ? parseInt(stock) : null,
    image,
    isActive: true,
    createdBy: req.user._id, // Lưu owner tạo reward
  });

  res.status(201).json({
    success: true,
    message: "Tạo quà tặng thành công",
    data: reward,
  });
});

// Owner/Admin: Lấy tất cả rewards (bao gồm inactive)
export const getAllRewards = asyncHandler(async (req, res) => {
  const rewards = await Reward.find({}).sort({ createdAt: -1 });
  res.json({ success: true, data: rewards });
});

// Owner/Admin: Cập nhật reward
export const updateReward = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  // Handle image upload from multer
  if (req.file) {
    updateData.image = req.file.path;
    updateData.imagePublicId = req.file.filename;
  }

  if (updateData.pointCost) updateData.pointCost = parseInt(updateData.pointCost);
  if (updateData.voucherValue) updateData.voucherValue = parseFloat(updateData.voucherValue);
  if (updateData.stock !== undefined) {
    updateData.stock = updateData.stock ? parseInt(updateData.stock) : null;
  }

  const reward = await Reward.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!reward) {
    return res.status(404).json({
      success: false,
      message: "Quà tặng không tồn tại",
    });
  }

  res.json({
    success: true,
    message: "Cập nhật quà tặng thành công",
    data: reward,
  });
});

// Owner/Admin: Xóa reward (soft delete)
export const deleteReward = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const reward = await Reward.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!reward) {
    return res.status(404).json({
      success: false,
      message: "Quà tặng không tồn tại",
    });
  }

  res.json({
    success: true,
    message: "Xóa quà tặng thành công",
    data: reward,
  });
});
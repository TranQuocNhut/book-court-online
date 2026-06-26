import asyncHandler from "express-async-handler";
import Withdrawal from "../models/Withdrawal.js";
import User from "../models/User.js";
import {
  getOwnerBalance,
  debitOwnerBalance,
  confirmWithdrawal,
  refundOwnerBalance,
} from "../utils/ownerBalanceService.js";
import {
  createSinglePayout,
  getPayoutInfo,
  estimatePayoutFee,
  getBankBin,
  getPayoutsList,
} from "../utils/payosPayoutService.js";

/**
 * POST /api/withdrawals/request
 * Tạo yêu cầu rút tiền (Chỉ Owner)
 */
export const requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount, bankAccount } = req.body;

  // CHỈ OWNER mới được rút tiền
  if (req.user.role !== "owner") {
    return res.status(403).json({
      success: false,
      message: "Chỉ chủ sân mới có thể rút tiền",
    });
  }

  const ownerId = req.user._id;

  // Validate số tiền
  const MIN_WITHDRAWAL = 10000; // Tối thiểu 10,000 VNĐ
  if (!amount || amount < MIN_WITHDRAWAL) {
    return res.status(400).json({
      success: false,
      message: `Số tiền rút tối thiểu là ${MIN_WITHDRAWAL.toLocaleString("vi-VN")} VNĐ`,
    });
  }

  // Validate thông tin tài khoản ngân hàng
  if (
    !bankAccount ||
    !bankAccount.accountNumber ||
    !bankAccount.accountName ||
    !bankAccount.bankCode
  ) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng cung cấp đầy đủ thông tin tài khoản ngân hàng",
    });
  }

  // Lấy BIN code từ bankCode
  const toBin = getBankBin(bankAccount.bankCode);
  if (!toBin) {
    return res.status(400).json({
      success: false,
      message: `Mã ngân hàng "${bankAccount.bankCode}" không được hỗ trợ`,
    });
  }

  // Kiểm tra số dư
  const balance = await getOwnerBalance(ownerId);
  if (balance.availableBalance < amount) {
    return res.status(400).json({
      success: false,
      message: `Số dư không đủ. Số dư hiện tại: ${balance.availableBalance.toLocaleString("vi-VN")} VNĐ`,
    });
  }

  try {
    // Tạo referenceId duy nhất
    const referenceId = `WITHDRAW_${ownerId}_${Date.now()}`;

    // Ước tính phí (optional - để hiển thị cho user)
    // Nếu lỗi thì bỏ qua, không ảnh hưởng đến việc rút tiền
    let estimatedFee = 0;
    try {
      estimatedFee = await estimatePayoutFee({
        referenceId: `ESTIMATE_${referenceId}`,
        amount,
        description: "Rut tien",
        toBin,
        toAccountNumber: bankAccount.accountNumber,
      });
    } catch (feeError) {
      // Chỉ log ở mức debug, không hiển thị lỗi cho user
      // Vì estimate fee là optional và không ảnh hưởng đến việc rút tiền
      if (process.env.NODE_ENV === 'development') {
        console.log("ℹ️ [DEBUG] Không thể ước tính phí (không ảnh hưởng đến rút tiền):", feeError.message);
      }
      // Không log error để tránh làm user lo lắng
    }

    // Tạo yêu cầu rút tiền trong DB
    const withdrawal = new Withdrawal({
      owner: ownerId,
      amount,
      bankAccount: {
        ...bankAccount,
        bankName: bankAccount.bankName || bankAccount.bankCode,
      },
      status: "pending",
      description: `Rút tiền về tài khoản ${bankAccount.accountNumber}`,
    });
    await withdrawal.save();

    // Trừ tiền từ số dư (tạm thời)
    await debitOwnerBalance(ownerId, amount);

    // Gọi PayOS API để tạo lệnh chi
    try {
      const payoutResult = await createSinglePayout({
        referenceId,
        amount,
        description: withdrawal.description.substring(0, 25),
        toBin,
        toAccountNumber: bankAccount.accountNumber,
        category: "salary", // hoặc category khác tùy business logic
      });

      // Cập nhật thông tin PayOS vào withdrawal
      withdrawal.payosData = {
        transferId: payoutResult.payoutId,
        reference: payoutResult.referenceId,
      };

      // Kiểm tra trạng thái từ PayOS
      const payoutInfo = payoutResult.data;
      const transactionState = payoutInfo.transactions?.[0]?.state || payoutInfo.approvalState;

      if (transactionState === "SUCCEEDED") {
        withdrawal.status = "success";
        withdrawal.processedAt = new Date();
        // CHỈ khi thành công mới cộng vào totalWithdrawn
        await confirmWithdrawal(ownerId, amount);
      } else if (transactionState === "PROCESSING") {
        withdrawal.status = "processing";
        // Đang xử lý, chưa cộng vào totalWithdrawn
      } else {
        withdrawal.status = "failed";
        withdrawal.failureReason = "Giao dịch không thành công";
        // Thất bại, hoàn lại tiền (KHÔNG cộng vào totalRevenue)
        await refundOwnerBalance(ownerId, amount);
      }

      await withdrawal.save();

      res.status(201).json({
        success: true,
        message: "Yêu cầu rút tiền đã được tạo thành công",
        data: {
          withdrawal,
          estimatedFee, // Phí ước tính (nếu có)
        },
      });
    } catch (payosError) {
      // Xử lý lỗi IP whitelist đặc biệt
      if (payosError.message && payosError.message.includes('IP_WHITELIST_ERROR')) {
        // Lưu withdrawal với status "pending" và thông báo lỗi
        withdrawal.status = "pending";
        withdrawal.failureReason = "IP server chưa được whitelist trong PayOS. Vui lòng liên hệ admin.";
        await withdrawal.save();
        
        // Hoàn lại tiền cho owner (KHÔNG cộng vào totalRevenue)
        await refundOwnerBalance(ownerId, amount);
        
        return res.status(503).json({
          success: false,
          message: "Hệ thống đang bảo trì. Vui lòng thử lại sau hoặc liên hệ admin để được hỗ trợ.",
          error: "IP_WHITELIST_ERROR",
          data: {
            withdrawal,
          },
        });
      }
      
      // Nếu PayOS lỗi khác, hoàn lại số dư (KHÔNG cộng vào totalRevenue)
      await refundOwnerBalance(ownerId, amount);
      withdrawal.status = "failed";
      withdrawal.failureReason = payosError.message;
      await withdrawal.save();

      return res.status(500).json({
        success: false,
        message: `Lỗi khi tạo yêu cầu chi tiền: ${payosError.message}`,
      });
    }
  } catch (error) {
    console.error("Lỗi khi tạo yêu cầu rút tiền:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Không thể tạo yêu cầu rút tiền",
    });
  }
});

/**
 * GET /api/withdrawals/balance
 * Lấy số dư hiện tại của owner (Owner xem của mình, Admin xem của owner khác nếu có ownerId)
 */
export const getBalance = asyncHandler(async (req, res) => {
  let ownerId = req.user._id;

  // Admin có thể xem số dư của owner khác nếu có ownerId trong query
  if (req.user.role === "admin" && req.query.ownerId) {
    ownerId = req.query.ownerId;
  } else if (req.user.role !== "owner" && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Chỉ chủ sân và admin mới có thể xem số dư",
    });
  }

  const balance = await getOwnerBalance(ownerId);

  res.json({
    success: true,
    data: balance,
  });
});

/**
 * GET /api/withdrawals/history
 * Lấy lịch sử rút tiền (Owner xem của mình, Admin xem của owner khác nếu có ownerId)
 */
export const getWithdrawalHistory = asyncHandler(async (req, res) => {
  let ownerId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Admin có thể xem lịch sử của owner khác nếu có ownerId trong query
  if (req.user.role === "admin" && req.query.ownerId) {
    ownerId = req.query.ownerId;
  } else if (req.user.role !== "owner" && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Chỉ chủ sân và admin mới có thể xem lịch sử rút tiền",
    });
  }

  const withdrawals = await Withdrawal.find({ owner: ownerId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Withdrawal.countDocuments({ owner: ownerId });

  res.json({
    success: true,
    data: {
      withdrawals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * GET /api/withdrawals/:withdrawalId/status
 * Kiểm tra trạng thái rút tiền (có thể gọi lại PayOS để cập nhật)
 */
export const checkWithdrawalStatus = asyncHandler(async (req, res) => {
  const { withdrawalId } = req.params;
  const ownerId = req.user._id;

  const withdrawal = await Withdrawal.findById(withdrawalId);

  if (!withdrawal) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy yêu cầu rút tiền",
    });
  }

  // Kiểm tra quyền
  if (
    withdrawal.owner.toString() !== ownerId.toString() &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      message: "Không có quyền truy cập",
    });
  }

  // Nếu có payoutId, kiểm tra lại từ PayOS
  if (withdrawal.payosData?.transferId) {
    try {
      const payoutInfo = await getPayoutInfo(withdrawal.payosData.transferId);
      const transactionState =
        payoutInfo.transactions?.[0]?.state || payoutInfo.approvalState;

      // Cập nhật trạng thái nếu thay đổi
      if (transactionState === "SUCCEEDED" && withdrawal.status !== "success") {
        withdrawal.status = "success";
        withdrawal.processedAt = new Date();
        // CHỈ khi thành công mới cộng vào totalWithdrawn
        await confirmWithdrawal(withdrawal.owner, withdrawal.amount);
        await withdrawal.save();
      } else if (
        transactionState === "PROCESSING" &&
        withdrawal.status === "pending"
      ) {
        withdrawal.status = "processing";
        await withdrawal.save();
      } else if (
        (transactionState === "FAILED" || transactionState === "CANCELLED") &&
        withdrawal.status !== "failed"
      ) {
        // Nếu thất bại, hoàn lại tiền (KHÔNG cộng vào totalRevenue)
        withdrawal.status = "failed";
        withdrawal.failureReason = "Giao dịch thất bại từ PayOS";
        await refundOwnerBalance(withdrawal.owner, withdrawal.amount);
        await withdrawal.save();
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra trạng thái từ PayOS:", error);
    }
  }

  res.json({
    success: true,
    data: withdrawal,
  });
});

/**
 * POST /api/withdrawals/callback/payos
 * Webhook callback từ PayOS khi chi tiền thành công/thất bại
 */
export const payosWithdrawalCallback = asyncHandler(async (req, res) => {
  const webhookBody = req.body;
  const headers = req.headers;

  try {
    // Xác thực webhook từ PayOS (có thể cần verify signature)
    // const verifiedData = await verifyPayOSWebhook(webhookBody, headers);

    const { referenceId, state, id } = webhookBody.data || webhookBody;

    // Tìm withdrawal theo referenceId hoặc transferId
    const withdrawal = await Withdrawal.findOne({
      $or: [
        { "payosData.reference": referenceId },
        { "payosData.transferId": id },
      ],
    });

    if (!withdrawal) {
      console.warn(`Không tìm thấy withdrawal cho referenceId ${referenceId}`);
      return res.status(200).json({ success: true, message: "Đã xử lý" });
    }

    // Cập nhật trạng thái
    const transactionState = state || webhookBody.data?.transactions?.[0]?.state;
    
    if (transactionState === "SUCCEEDED" || webhookBody.code === "00") {
      withdrawal.status = "success";
      withdrawal.processedAt = new Date();
      // CHỈ khi thành công mới cộng vào totalWithdrawn
      await confirmWithdrawal(withdrawal.owner, withdrawal.amount);
    } else if (transactionState === "PROCESSING") {
      withdrawal.status = "processing";
      // Đang xử lý, chưa cộng vào totalWithdrawn
    } else {
      withdrawal.status = "failed";
      withdrawal.failureReason = webhookBody.message || webhookBody.desc || "Giao dịch thất bại";
      
      // Hoàn lại số dư nếu thất bại (KHÔNG cộng vào totalRevenue)
      await refundOwnerBalance(withdrawal.owner, withdrawal.amount);
    }

    await withdrawal.save();

    res.status(200).json({ success: true, message: "Webhook đã xử lý" });
  } catch (error) {
    console.error("Lỗi xử lý webhook withdrawal:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/withdrawals/payos/list
 * Lấy danh sách lệnh rút tiền từ PayOS (Admin và Owner)
 */
export const getPayosPayoutsList = asyncHandler(async (req, res) => {
  try {
    const {
      limit = 10,
      offset = 0,
      referenceId,
      approvalState,
      category,
      fromDate,
      toDate,
    } = req.query;

    // Chuyển đổi limit và offset sang number
    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);

    // Gọi PayOS API để lấy danh sách payouts
    const result = await getPayoutsList({
      limit: limitNum,
      offset: offsetNum,
      referenceId,
      approvalState,
      category,
      fromDate,
      toDate,
    });

    res.json({
      success: true,
      data: {
        payouts: result.payouts,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách payouts từ PayOS:", error);
    
    // Xử lý các lỗi đặc biệt
    if (error.message.includes("IP_WHITELIST_ERROR")) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lấy danh sách lệnh rút tiền từ PayOS",
    });
  }
});


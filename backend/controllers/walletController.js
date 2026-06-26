import asyncHandler from "express-async-handler";
import crypto from "crypto";
import qs from "qs";
import { format } from "date-fns";
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";
import { config } from "../config/config.js";
import {
  createPaymentLink as createPayOSLink,
  verifyWebhook as verifyPayOSWebhook,
} from "../utils/payosService.js";
import { credit } from "../utils/walletService.js";

// Hàm helper sắp xếp object (lấy từ paymentController)
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

/**
 * GET /api/wallet/balance
 * Lấy số dư ví
 */
export const getBalance = asyncHandler(async (req, res) => {
  // req.user được lấy từ authenticateToken
  const user = await User.findById(req.user._id).select("walletBalance");
  res.json({
    success: true,
    data: {
      balance: user.walletBalance,
    },
  });
});

/**
 * GET /api/wallet/history
 * Lấy lịch sử giao dịch ví (có phân trang)
 */
export const getHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { user: req.user._id };

  const transactions = await WalletTransaction.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await WalletTransaction.countDocuments(filter);

  res.json({
    success: true,
    data: {
      transactions: transactions,
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
 * POST /api/wallet/top-up
 * Khởi tạo giao dịch nạp tiền (Momo, VNPay, PayOS)
 */
export const initTopUp = asyncHandler(async (req, res) => {
  const { amount, method } = req.body;
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Vui lòng đăng nhập để nạp tiền",
    });
  }

  // === SỬ DỤNG LOGIC TỪ STASH: Ràng buộc số tiền tối thiểu ===
  const MIN_TOPUP_AMOUNT = 10000; // 10.000 VNĐ
  if (!amount || amount < MIN_TOPUP_AMOUNT) {
    return res.status(400).json({
      success: false,
      message: `Số tiền nạp tối thiểu là ${MIN_TOPUP_AMOUNT.toLocaleString(
        "vi-VN"
      )} VNĐ`,
    });
  }

  if (!["momo", "vnpay", "payos"].includes(method)) {
    return res
      .status(400)
      .json({ success: false, message: "Phương thức không hợp lệ" });
  }

  // 1. Tạo một giao dịch ví (WalletTransaction) ở trạng thái PENDING
  const transaction = new WalletTransaction({
    user: user._id,
    amount,
    type: "top-up",
    status: "pending",
    metadata: {
      topUpMethod: method,
    },
  });
  await transaction.save();

  // 2. Sử dụng _id của transaction làm mã giao dịch (paymentId)
  const paymentId = `WALLET_${transaction._id.toString()}`;
  // Rút ngắn description cho PayOS (tối đa 25 ký tự)
  const orderInfo =
    method === "payos"
      ? `Nap tien ${transaction._id.toString().slice(-8)}`
      : `Nap tien vao vi ${user.email} - ${transaction._id}`;

  // 3. Xử lý logic cổng thanh toán (tương tự paymentController)

  if (method === "vnpay") {
    // ... (logic VNPay)
    const ipAddr = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const tmnCode = config.vnpay.tmnCode;
    const secretKey = config.vnpay.hashSecret;
    const vnpUrl = config.vnpay.url;
    const returnUrl = `http://localhost:3000/api/wallet/callback/vnpay`;
    const createDate = format(new Date(), "yyyyMMddHHmmss");

    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = "vn";
    vnp_Params["vnp_CurrCode"] = "VND";
    vnp_Params["vnp_TxnRef"] = paymentId;
    vnp_Params["vnp_OrderInfo"] = orderInfo;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = amount * 100; // VNPay * 100
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;

    vnp_Params = sortObject(vnp_Params);
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;

    const paymentUrl =
      vnpUrl + "?" + qs.stringify(vnp_Params, { encode: false });
    res.status(200).json({ success: true, paymentUrl });
  } else if (method === "momo") {
    // ... (logic Momo)
    const partnerCode = config.momo.partnerCode;
    const accessKey = config.momo.accessKey;
    const secretKey = config.momo.secretKey;
    const redirectUrl = `${config.frontendUrl}/wallet-success`; // URL frontend
    const ipnUrl = "http://localhost:3000/api/wallet/callback/momo"; // <-- IPN RIÊNG CỦA VÍ
    const requestId = paymentId;
    const orderId = paymentId;
    const requestType = "captureWallet";
    const extraData = "";
    const amountStr = Math.round(amount).toString();

    const rawSignature = `accessKey=${accessKey}&amount=${amountStr}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount: amountStr,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: "vi",
    };

    try {
      const response = await fetch(config.momo.apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      if (data.resultCode !== 0) {
        return res
          .status(400)
          .json({ success: false, message: `Momo Error: ${data.message}` });
      }
      res.status(200).json({ success: true, paymentUrl: data.payUrl });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Lỗi kết nối tới MoMo" });
    }
  } else if (method === "payos") {
    // ... (logic PayOS)
    const orderCode = parseInt(transaction._id.toString().substring(18), 16);

    transaction.metadata.transactionCode = `PAYOS_WALLET_${orderCode}`;
    await transaction.save();

    try {
      // Rút ngắn description cho PayOS (tối đa 25 ký tự)
      const payosDescription = `Nap tien ${transaction._id
        .toString()
        .slice(-8)}`.substring(0, 25);

      const paymentLinkData = await createPayOSLink({
        orderCode,
        amount: amount,
        description: payosDescription,
        returnUrl: `${config.frontendUrl}/wallet-success`,
        cancelUrl: `${config.frontendUrl}/wallet-failed`,
      });

      res.status(200).json({
        success: true,
        paymentUrl: paymentLinkData.checkoutUrl,
      });
    } catch (error) {
      console.error("PayOS Error:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi khởi tạo thanh toán PayOS",
      });
    }
  }
});

/**
 * POST /api/wallet/callback/momo
 * Webhook (IPN) nạp tiền từ Momo
 */
export const momoCallback = asyncHandler(async (req, res) => {
  // ... (Logic xác thực chữ ký của Momo) ...

  const { orderId, resultCode, transId } = req.body; // orderId là paymentId

  // Tách lấy transactionId từ "WALLET_..."
  const transactionId = orderId.replace("WALLET_", "");

  if (resultCode === 0) {
    // Nạp tiền thành công
    const transaction = await WalletTransaction.findById(transactionId);
    if (transaction && transaction.status === "pending") {
      // Dùng service để cộng tiền và lưu lịch sử
      await credit(transaction.user, transaction.amount, "top-up", {
        ...transaction.metadata,
        transactionCode: transId,
      });
      // Xóa giao dịch pending (vì credit đã tạo giao dịch success mới)
      // Hoặc cập nhật status (tùy logic của bạn)
      transaction.status = "success";
      transaction.metadata.transactionCode = transId;
      await transaction.save();
    }
  } else {
    // Thất bại
    await WalletTransaction.findByIdAndUpdate(transactionId, {
      status: "failed",
    });
  }

  res.status(204).send(); // Phản hồi cho Momo
});

/**
 * GET /api/wallet/callback/vnpay
 * Webhook (IPN) nạp tiền từ VNPay
 */
export const vnpayCallback = asyncHandler(async (req, res) => {
  // ... (Logic xác thực chữ ký VNPay) ...

  const vnp_Params = req.query;
  const paymentId = vnp_Params["vnp_TxnRef"];
  const responseCode = vnp_Params["vnp_ResponseCode"];
  const transactionCode = vnp_Params["vnp_TransactionNo"];

  const transactionId = paymentId.replace("WALLET_", "");

  if (responseCode === "00") {
    // Nạp tiền thành công
    const transaction = await WalletTransaction.findById(transactionId);
    if (transaction && transaction.status === "pending") {
      // Cộng tiền
      await credit(transaction.user, transaction.amount, "top-up", {
        ...transaction.metadata,
        transactionCode: transactionCode,
      });
      // Cập nhật giao dịch
      transaction.status = "success";
      transaction.metadata.transactionCode = transactionCode;
      await transaction.save();
    }
    res.redirect(`${config.momo.redirectUrl}?success=true&type=wallet_topup`);
  } else {
    // Thất bại
    await WalletTransaction.findByIdAndUpdate(transactionId, {
      status: "failed",
    });
    res.redirect(`${config.momo.redirectUrl}?success=false&type=wallet_topup`);
  }
});

/**
 * POST /api/wallet/callback/payos
 * Webhook (IPN) nạp tiền từ PayOS
 */
export const payosWalletCallback = asyncHandler(async (req, res) => {
  const webhookBody = req.body;
  const headers = req.headers;

  try {
    // BƯỚC 1: Kiểm tra mã "code" từ body TRƯỚC
    if (webhookBody.code !== "00") {
      console.log(
        `PayOS Wallet: Giao dịch ${webhookBody.data?.orderCode} thất bại/hủy (code: ${webhookBody.code}).`
      );

      // Tìm và cập nhật transaction thành "failed" nếu có orderCode
      if (webhookBody.data?.orderCode) {
        const orderCode = webhookBody.data.orderCode;
        const pendingTransactions = await WalletTransaction.find({
          status: "pending",
          "metadata.topUpMethod": "payos",
        });

        for (const trans of pendingTransactions) {
          const transOrderCode = parseInt(
            trans._id.toString().substring(18),
            16
          );
          if (transOrderCode === orderCode) {
            trans.status = "failed";
            await trans.save();
            console.log(
              `PayOS Wallet: Đã cập nhật transaction ${trans._id} thành failed`
            );
            break;
          }
        }
      }

      return res
        .status(200)
        .json({ success: false, message: "Giao dịch thất bại" });
    }

    // BƯỚC 2: Xác thực chữ ký.
    const verifiedData = await verifyPayOSWebhook(webhookBody, headers);

    // BƯỚC 3: Xử lý logic (verifiedData bây giờ chính là "data" object)
    const { orderCode, reference } = verifiedData;

    // Tìm orderCode dựa trên logic lúc tạo (lấy 6 ký tự cuối ObjectId)
    const pendingTransactions = await WalletTransaction.find({
      status: "pending",
      "metadata.topUpMethod": "payos",
    });

    let transaction = null;
    for (const trans of pendingTransactions) {
      // Logic tìm orderCode dựa trên 6 ký tự cuối của ID
      const transOrderCode = parseInt(trans._id.toString().substring(18), 16);
      if (transOrderCode === orderCode) {
        transaction = trans;
        break;
      }
    }

    if (!transaction) {
      console.warn(
        `PayOS Wallet: Không tìm thấy transaction cho orderCode ${orderCode} hoặc đã xử lý`
      );
      return res
        .status(200)
        .json({ success: true, message: "Đã xử lý trước đó" });
    }

    // 4. Cộng tiền vào ví (Dùng walletService)
    await credit(transaction.user, transaction.amount, "top-up", {
      topUpMethod: "payos",
      transactionCode: reference, // Mã giao dịch của PayOS
    });

    // 5. Cập nhật giao dịch "pending" sang "success"
    transaction.status = "success";
    transaction.metadata.transactionCode = reference;
    await transaction.save();

    console.log(
      `PayOS Wallet: Nạp tiền thành công cho user ${transaction.user}`
    );

    // 6. Phản hồi 200 cho PayOS
    res.status(200).json({ success: true, message: "Webhook đã xử lý" });
  } catch (error) {
    console.error("Lỗi xác thực PayOS Webhook (Wallet):", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

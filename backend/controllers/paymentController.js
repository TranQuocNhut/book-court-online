import asyncHandler from "express-async-handler";
import crypto from "crypto";
import qs from "qs";
import { config } from "../config/config.js";
import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import { format } from "date-fns";
import {
  createPaymentLink as createPayOSLink,
  verifyWebhook as verifyPayOSWebhook,
} from "../utils/payosService.js";
import { credit } from "../utils/walletService.js";
// === IMPORTS TỪ STASH ===
import { processBookingRewards } from "../utils/rewardService.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import { sendEmail, sendPaymentReceipt } from "../utils/emailService.js";
import { creditOwnerBalance } from "../utils/ownerBalanceService.js";
import Facility from "../models/Facility.js";
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
 * Cập nhật trạng thái sau khi thanh toán thành công
 * (Hàm helper dùng chung - Sử dụng Transaction để an toàn dữ liệu)
 */
const processSuccessfulPayment = async (paymentId, transactionId) => {
  // KHÔNG dùng transaction cho MongoDB local
  try {
    // 1. Tìm payment
    const payment = await Payment.findOne({ paymentId });

    if (payment && payment.status === "pending") {
      // 2. Cập nhật Payment
      payment.status = "success";
      payment.transactionId = transactionId;
      payment.paidAt = new Date();
      await payment.save();

      // Lấy user để update thông tin phone nếu cần
      const user = await User.findById(payment.user);
      const phoneToUpdate = user && user.phone ? user.phone : "0900000000";

      // 3. Cập nhật Booking
      const booking = await Booking.findByIdAndUpdate(
        payment.booking,
        {
          paymentStatus: "paid",
          status: "confirmed",
          $set: { "contactInfo.phone": phoneToUpdate },
        },
        { new: true }
      );

      if (!booking) {
        throw new Error("Không tìm thấy booking liên quan đến payment này.");
      }

      // --- CÁC TÁC VỤ PHỤ (Sau khi lưu DB) ---

      // A. Gửi Email
      try {
        console.log("🔍 [EMAIL] Đang lấy thông tin booking để gửi email...");

        const fullBookingDetails = await Booking.findById(booking._id)
          .populate("user", "name email phone") // Lấy cả phone để log
          .populate("court", "name")
          .populate("facility", "name address");

        if (!fullBookingDetails) {
          console.error("❌ [EMAIL] Không tìm thấy booking details");
          return true; // Return true để không rollback transaction
        }

        // LOGIC MỚI: Kiểm tra linh hoạt cả 2 nguồn email
        const userEmail = fullBookingDetails.user?.email;
        const contactEmail = fullBookingDetails.contactInfo?.email;

        // Email nhận sẽ ưu tiên Contact Info (người điền form), nếu không thì lấy User Account
        const recipientEmail = contactEmail || userEmail;

        console.log("📧 [DEBUG INFO]:", {
          bookingId: fullBookingDetails._id,
          userAccountEmail: userEmail || "Không có",
          contactFormEmail: contactEmail || "Không có",
          finalRecipient: recipientEmail || "KHÔNG TÌM THẤY EMAIL NÀO",
        });

        if (!recipientEmail) {
          console.error(
            "⚠️ [EMAIL SKIP] Không tìm thấy bất kỳ email nào để gửi (User lẫn ContactInfo đều trống)."
          );
          return true;
        }

        console.log(`📬 [EMAIL] Đang tiến hành gửi tới: ${recipientEmail}`);

        // Gọi hàm gửi mail (Hàm này trong emailService.js cũng cần update logic lấy email tương tự)
        await sendPaymentReceipt(fullBookingDetails);

        console.log("✅ [EMAIL] Email đã được gửi thành công!");
      } catch (e) {
        console.error("❌ [EMAIL] Lỗi ngoại lệ khi gửi mail:", e);
      }

      // B. Cộng điểm thưởng
      try {
        if (typeof processBookingRewards === "function") {
          await processBookingRewards(booking);
        }
      } catch (e) {
        console.error("Lỗi cộng điểm thưởng webhook:", e);
      }

      // C. Cộng tiền cho owner (sau khi thanh toán thành công)
      try {
        const bookingWithFacility = await Booking.findById(booking._id)
          .populate("facility", "owner");
        
        if (bookingWithFacility?.facility?.owner) {
          // Xử lý ownerId (có thể là ObjectId hoặc object đã populate)
          let ownerId = bookingWithFacility.facility.owner;
          if (ownerId._id) {
            ownerId = ownerId._id;
          } else if (typeof ownerId === 'object' && ownerId.toString) {
            ownerId = ownerId.toString();
          }
          
          // Lấy platformFee từ SystemConfig (hoặc dùng giá trị mặc định nếu có lỗi)
          const { getPlatformFee } = await import("../utils/systemConfigService.js");
          let platformFee = 0.1; // Fallback mặc định
          try {
            platformFee = await getPlatformFee();
          } catch (e) {
            console.warn("Không thể lấy platformFee từ SystemConfig, dùng giá trị mặc định 10%:", e);
          }
          
          await creditOwnerBalance(
            ownerId,
            booking.totalAmount
            // Không truyền platformFee, sẽ lấy từ SystemConfig trong creditOwnerBalance
          );
          
          console.log(`✅ Đã cộng ${(booking.totalAmount * (1 - platformFee)).toLocaleString("vi-VN")} VNĐ cho owner ${ownerId} (từ booking ${booking.totalAmount.toLocaleString("vi-VN")} VNĐ, phí ${(platformFee * 100).toFixed(0)}%)`);
        } else {
          console.warn(`⚠️ Booking ${booking._id} không có facility hoặc owner`);
        }
      } catch (e) {
        console.error("Lỗi cộng tiền cho owner:", e);
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error("❌ LỖI xử lý payment:", error);
    return false;
  }
};

// === POST /api/payments/init ===
// Khởi tạo thanh toán (Momo, VNPay, PayOS)
export const initPayment = asyncHandler(async (req, res, next) => {
  const { bookingId, method } = req.body;
  const user = req.user;

  // 1. Tìm booking
  const booking = await Booking.findById(bookingId);
  if (!booking || booking.user.toString() !== user._id.toString()) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy booking hoặc không có quyền",
    });
  }
  if (booking.paymentStatus === "paid") {
    return res
      .status(400)
      .json({ success: false, message: "Booking này đã được thanh toán" });
  }

  // 2. Tạo mã đơn hàng (paymentId) duy nhất
  const paymentId = `${method.toUpperCase()}_${
    booking._id
  }_${new Date().getTime()}`;
  const amount = booking.totalAmount;
  // Rút ngắn description cho PayOS (tối đa 25 ký tự)
  const orderInfo =
    method === "payos"
      ? `Dat san ${booking._id.toString().slice(-8)}`
      : `Thanh toan don dat san ${booking._id}`;

  // 3. Tạo/Cập nhật bản ghi Payment
  let payment = await Payment.findOne({ booking: bookingId });
  if (payment) {
    payment.paymentId = paymentId; // Cập nhật paymentId mới
    payment.method = method;
    payment.status = "pending";
    payment.amount = amount;
  } else {
    payment = new Payment({
      user: user._id,
      booking: bookingId,
      amount,
      method,
      paymentId,
      orderInfo,
    });
  }
  await payment.save();

  // 4. Xử lý theo phương thức
  if (method === "vnpay") {
    // --- XỬ LÝ VNPAY ---
    const ipAddr = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const tmnCode = config.vnpay.tmnCode;
    const secretKey = config.vnpay.hashSecret;
    const vnpUrl = config.vnpay.url;
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
    vnp_Params["vnp_Amount"] = amount * 100; // VNPay yêu cầu * 100
    vnp_Params["vnp_ReturnUrl"] = config.vnpay.returnUrl;
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
    // --- XỬ LÝ MOMO ---
    const partnerCode = config.momo.partnerCode;
    const accessKey = config.momo.accessKey;
    const secretKey = config.momo.secretKey;
    const redirectUrl = config.momo.redirectUrl;
    const ipnUrl = config.momo.notifyUrl;
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.resultCode !== 0) {
        return res.status(400).json({
          success: false,
          message: `Momo Error: ${data.message || data.localMessage}`,
        });
      }

      res.status(200).json({
        success: true,
        paymentUrl: data.payUrl,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi khi kết nối tới MoMo",
      });
    }
  } else if (method === "payos") {
    // --- XỬ LÝ PAYOS ---
    const orderCode = parseInt(new Date().getTime() / 1000);

    payment.paymentId = `PAYOS_${orderCode}`;
    await payment.save();

    try {
      const payosDescription = `Dat san ${booking._id
        .toString()
        .slice(-8)}`.substring(0, 25);

      const paymentLinkData = await createPayOSLink({
        orderCode,
        amount: amount,
        description: payosDescription,
        returnUrl: `${config.frontendUrl}/booking-success`,
        cancelUrl: `${config.frontendUrl}/booking-failed`,
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
  } else {
    return res.status(400).json({
      success: false,
      message: "Phương thức thanh toán không được hỗ trợ",
    });
  }
});

// === POST /api/payments/callback/vnpay ===
// Webhook callback VNPay (IPN)
export const vnpayCallback = asyncHandler(async (req, res, next) => {
  let vnp_Params = req.query;
  const secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);
  const secretKey = config.vnpay.hashSecret;
  const signData = qs.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  if (secureHash === signed) {
    const paymentId = vnp_Params["vnp_TxnRef"];
    const responseCode = vnp_Params["vnp_ResponseCode"];
    const transactionId = vnp_Params["vnp_TransactionNo"];

    if (responseCode === "00") {
      await processSuccessfulPayment(paymentId, transactionId);
      res.redirect(
        `${config.momo.redirectUrl}?success=true&paymentId=${paymentId}`
      );
    } else {
      await Payment.findOneAndUpdate({ paymentId }, { status: "failed" });
      res.redirect(
        `${config.momo.redirectUrl}?success=false&paymentId=${paymentId}`
      );
    }
  } else {
    res.redirect(
      `${config.momo.redirectUrl}?success=false&message=checksum_failed`
    );
  }
});

// === POST /api/payments/callback/momo ===
// Webhook callback Momo (IPN)
export const momoCallback = asyncHandler(async (req, res, next) => {
  const {
    resultCode,
    message,
    orderId,
    transId,
    signature,
    amount,
    orderInfo,
    partnerCode,
    requestId,
    responseTime,
    orderType,
    extraData,
  } = req.body;

  // Xác thực chữ ký của Momo
  const accessKey = config.momo.accessKey;
  const secretKey = config.momo.secretKey;

  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

  const calculatedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  // if (signature !== calculatedSignature) return res.status(400).json({ message: "Invalid signature" });

  if (resultCode === 0) {
    await processSuccessfulPayment(orderId, transId);
  } else {
    await Payment.findOneAndUpdate(
      { paymentId: orderId },
      { status: "failed" }
    );
  }

  res.status(204).send();
});

// === POST /api/payments/callback/payos ===
// Webhook callback PayOS (IPN)
export const payosBookingCallback = asyncHandler(async (req, res, next) => {
  const webhookBody = req.body;
  const headers = req.headers;

  try {
    if (webhookBody.code !== "00") {
      return res
        .status(200)
        .json({ success: false, message: "Giao dịch thất bại" });
    }

    const verifiedData = await verifyPayOSWebhook(webhookBody, headers);
    const { orderCode, reference } = verifiedData;

    const paymentId = `PAYOS_${orderCode}`;
    const transactionId = reference;

    const success = await processSuccessfulPayment(paymentId, transactionId);

    if (success) {
      console.log(`PayOS: Thanh toán thành công cho paymentId ${paymentId}`);
    }

    res.status(200).json({ success: true, message: "Webhook đã xử lý" });
  } catch (error) {
    console.error("Lỗi xác thực PayOS Webhook:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

// === POST /api/payments/cash ===
// Thanh toán tiền mặt (owner)
export const paymentCash = asyncHandler(async (req, res, next) => {
  const { bookingId } = req.body;

  try {
    // 1. Check Booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy booking" });
    }
    if (booking.paymentStatus === "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Booking đã được thanh toán" });
    }

    // 2. Chuẩn bị thông tin User
    const user = await User.findById(booking.user);
    const phoneToUpdate = user && user.phone ? user.phone : "0900000000";

    // 3. Update Booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      booking._id,
      {
        paymentStatus: "paid",
        status: "confirmed",
        $set: { "contactInfo.phone": phoneToUpdate },
      },
      { new: true }
    )
      .populate("user", "name email")
      .populate("court", "name")
      .populate("facility", "name address");

    // 4. Create Payment
    const paymentId = `CASH_${booking._id}_${new Date().getTime()}`;
    const payment = new Payment({
      user: booking.user,
      booking: booking._id,
      amount: booking.totalAmount,
      method: "cash",
      status: "success",
      paymentId: paymentId,
      transactionId: paymentId,
      orderInfo: `Thanh toan tien mat boi ${req.user.name}`,
      paidAt: new Date(),
    });
    await payment.save();

    // --- LOGIC PHỤ ---
    // Gửi email
    try {
      if (updatedBooking) {
        console.log(
          "🔍 [EMAIL CASH] Đang gửi email cho thanh toán tiền mặt..."
        );
        await sendPaymentReceipt(updatedBooking);
        console.log("✅ [EMAIL CASH] Đã gửi email thành công");
      }
    } catch (e) {
      console.error("Lỗi gửi mail tiền mặt:", e);
    }

    // Cộng điểm
    try {
      if (typeof processBookingRewards === "function") {
        await processBookingRewards(updatedBooking);
      }
    } catch (e) {
      console.error("Lỗi cộng điểm tiền mặt:", e);
    }

    // Cộng tiền cho owner (sau khi thanh toán tiền mặt thành công)
    try {
      if (updatedBooking?.facility?.owner) {
        // Xử lý ownerId (có thể là ObjectId hoặc object đã populate)
        let ownerId = updatedBooking.facility.owner;
        if (ownerId._id) {
          ownerId = ownerId._id;
        } else if (typeof ownerId === 'object' && ownerId.toString) {
          ownerId = ownerId.toString();
        }
        
        // Lấy platformFee từ SystemConfig (hoặc dùng giá trị mặc định nếu có lỗi)
        const { getPlatformFee } = await import("../utils/systemConfigService.js");
        let platformFee = 0.1; // Fallback mặc định
        try {
          platformFee = await getPlatformFee();
        } catch (e) {
          console.warn("Không thể lấy platformFee từ SystemConfig, dùng giá trị mặc định 10%:", e);
        }
        
        await creditOwnerBalance(
          ownerId,
          updatedBooking.totalAmount
          // Không truyền platformFee, sẽ lấy từ SystemConfig trong creditOwnerBalance
        );
        
        console.log(`✅ [CASH] Đã cộng ${(updatedBooking.totalAmount * (1 - platformFee)).toLocaleString("vi-VN")} VNĐ cho owner ${ownerId} (từ booking ${updatedBooking.totalAmount.toLocaleString("vi-VN")} VNĐ, phí ${(platformFee * 100).toFixed(0)}%)`);
      } else {
        console.warn(`⚠️ [CASH] Booking ${updatedBooking._id} không có facility hoặc owner`);
      }
    } catch (e) {
      console.error("Lỗi cộng tiền cho owner (cash):", e);
    }

    res.status(201).json({
      success: true,
      message: "Xác nhận thanh toán tiền mặt thành công",
      data: payment,
    });
  } catch (error) {
    console.error("Lỗi thanh toán tiền mặt:", error);
    next(error);
  }
});

// === GET /api/payments/history ===
export const getPaymentHistory = asyncHandler(async (req, res, next) => {
  const payments = await Payment.find({ user: req.user._id })
    .populate({
      path: "booking",
      select: "court facility date timeSlots",
      populate: [
        { path: "court", select: "name" },
        { path: "facility", select: "name address" },
      ],
    })
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: payments });
});

// === GET /api/payments/:paymentId/status ===
export const getPaymentStatus = asyncHandler(async (req, res, next) => {
  const { paymentId } = req.params;

  const payment = await Payment.findOne({ paymentId }).populate({
    path: "booking",
    select: "facility",
    populate: {
      path: "facility",
      select: "owner",
    },
  });

  if (!payment) {
    return res
      .status(404)
      .json({ success: false, message: "Không tìm thấy giao dịch" });
  }

  const isUserOwner = payment.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  const facilityOwnerId = payment.booking?.facility?.owner?.toString();
  const isFacilityOwner = facilityOwnerId === req.user._id.toString();

  if (!isUserOwner && !isAdmin && !isFacilityOwner) {
    return res
      .status(403)
      .json({ success: false, message: "Không có quyền truy cập" });
  }

  res.status(200).json({
    success: true,
    data: {
      paymentId: payment.paymentId,
      status: payment.status,
      method: payment.method,
      amount: payment.amount,
    },
  });
});

// === POST /api/payments/:paymentId/refund ===
// Hoàn tiền (Admin/Owner)
export const refundPayment = asyncHandler(async (req, res, next) => {
  const { paymentId } = req.params;
  const { amount, reason } = req.body;

  const payment = await Payment.findOne({ paymentId });
  if (!payment) {
    return res
      .status(404)
      .json({ success: false, message: "Không tìm thấy giao dịch" });
  }
  if (payment.status !== "success") {
    return res.status(400).json({
      success: false,
      message: "Chỉ hoàn tiền cho giao dịch đã thành công",
    });
  }
  if (payment.status === "refunded") {
    return res.status(400).json({
      success: false,
      message: "Giao dịch này đã được hoàn tiền trước đó",
    });
  }

  const refundAmount = amount || payment.amount;
  const refundReason = reason || "Hoàn tiền theo yêu cầu của admin/owner";

  try {
    // 1. Cộng tiền vào ví của user
    await credit(payment.user, refundAmount, "refund", {
      bookingId: payment.booking,
      paymentId: payment._id,
      reason: refundReason,
    });

    // 2. Cập nhật trạng thái Payment
    payment.status = "refunded";
    // 3. Cập nhật lại booking (chuyển về 'cancelled')
    await Booking.findByIdAndUpdate(payment.booking, {
      status: "cancelled",
      paymentStatus: "refunded",
    });

    res.status(200).json({
      success: true,
      message: `Hoàn tiền ${refundAmount} vào ví người dùng thành công`,
      data: payment,
    });
  } catch (error) {
    console.error("Lỗi khi hoàn tiền vào ví:", error);
    next(error);
  }
});

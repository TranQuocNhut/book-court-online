import express from "express";
import * as paymentController from "../controllers/paymentController.js";
import { authenticateToken, authorize } from "../middleware/auth.js";

const router = express.Router();

// === CÁC ROUTE WEBHOOK (PUBLIC) ===
// Các route này PHẢI đặt ở đây (trước authenticateToken)
// vì server của Momo/VNPay gọi vào mà không cần đăng nhập.
router.get("/callback/vnpay", paymentController.vnpayCallback); //
router.post("/callback/momo", paymentController.momoCallback); //
// Thêm route GET này để PayOS xác thực webhook
router.get("/callback/payos", (req, res) => {
  console.log("PayOS Webhook: Nhận được yêu cầu GET (xác thực).");
  res.status(200).json({ success: true, message: "Webhook URL is active." });
});
router.post("/callback/payos", paymentController.payosBookingCallback); //

// === CÁC ROUTE CẦN ĐĂNG NHẬP ===
// Tất cả các route bên dưới đây đều cần user đăng nhập
router.use(authenticateToken); //

// POST /api/payments/init - Khởi tạo payment (Momo, VNPay)
router.post("/init", paymentController.initPayment); //

// POST /api/payments/cash - Thanh toán tiền mặt (owner)
router.post("/cash", authorize("owner"), paymentController.paymentCash); //

// GET /api/payments/history - Lịch sử thanh toán (của tôi)
router.get("/history", paymentController.getPaymentHistory); //

// GET /api/payments/:paymentId/status - Status thanh toán
router.get("/:paymentId/status", paymentController.getPaymentStatus); //

// POST /api/payments/:paymentId/refund - Hoàn tiền (owner)
router.post(
  "/:paymentId/refund",
  authorize("owner", "admin "),
  paymentController.refundPayment
); //

export default router;

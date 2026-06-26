import express from "express";
import * as withdrawalController from "../controllers/withdrawalController.js";
import { authenticateToken, authorize } from "../middleware/auth.js";

const router = express.Router();

// Webhook callback từ PayOS (public)
router.post("/callback/payos", withdrawalController.payosWithdrawalCallback);

// Các route cần đăng nhập
router.use(authenticateToken);

// GET /api/withdrawals/balance - Lấy số dư (Owner xem của mình, Admin xem của owner khác nếu có ?ownerId=xxx)
router.get("/balance", authorize("owner", "admin"), withdrawalController.getBalance);

// GET /api/withdrawals/history - Lịch sử rút tiền (Owner xem của mình, Admin xem của owner khác nếu có ?ownerId=xxx)
router.get("/history", authorize("owner", "admin"), withdrawalController.getWithdrawalHistory);

// POST /api/withdrawals/request - Tạo yêu cầu rút tiền (CHỈ OWNER)
router.post("/request", authorize("owner"), withdrawalController.requestWithdrawal);

// GET /api/withdrawals/:withdrawalId/status - Kiểm tra trạng thái
router.get(
  "/:withdrawalId/status",
  authorize("owner", "admin"),
  withdrawalController.checkWithdrawalStatus
);

// GET /api/withdrawals/payos/list - Lấy danh sách lệnh rút tiền từ PayOS (Admin và Owner)
router.get(
  "/payos/list",
  authorize("owner", "admin"),
  withdrawalController.getPayosPayoutsList
);

export default router;


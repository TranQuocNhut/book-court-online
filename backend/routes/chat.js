import express from "express";
import { authenticateToken, requireOwnerOrAdmin, requireUser } from "../middleware/auth.js";
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
  customerSendMessage,
  customerGetMessages,
} from "../controllers/chatController.js";

const router = express.Router();

// Customer routes (phải đặt trước owner/admin routes để không bị middleware chặn)
router.post("/customer/send", authenticateToken, requireUser, customerSendMessage);
router.get("/customer/messages/:ownerId", authenticateToken, requireUser, customerGetMessages);

// Owner/Admin routes
router.use(authenticateToken);
router.use(requireOwnerOrAdmin);

// Lấy danh sách cuộc trò chuyện
router.get("/conversations", getConversations);

// Lấy tin nhắn với một customer
router.get("/messages/:customerId", getMessages);

// Gửi tin nhắn
router.post("/send", sendMessage);

// Đánh dấu tin nhắn đã đọc
router.put("/messages/:messageId/read", markAsRead);

// Lấy số tin nhắn chưa đọc
router.get("/unread-count", getUnreadCount);

export default router;


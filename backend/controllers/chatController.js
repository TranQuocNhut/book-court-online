import mongoose from "mongoose";
import ChatMessage from "../models/ChatMessage.js";
import User from "../models/User.js";
import Facility from "../models/Facility.js";

/**
 * GET /api/chat/conversations
 * Lấy danh sách cuộc trò chuyện cho owner
 */
export const getConversations = async (req, res, next) => {
  try {
    const ownerId = req.user._id.toString();

    // Lấy tất cả tin nhắn có owner là receiver
    const conversations = await ChatMessage.aggregate([
      {
        $match: {
          receiver: new mongoose.Types.ObjectId(ownerId),
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: "$sender",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [{ $eq: ["$isRead", false] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $unwind: "$customer",
      },
      {
        $project: {
          customerId: "$customer._id",
          customerName: "$customer.name",
          customerPhone: "$customer.phone",
          customerEmail: "$customer.email",
          customerAvatar: "$customer.avatar",
          lastMessage: "$lastMessage.message",
          lastMessageTime: "$lastMessage.createdAt",
          unreadCount: 1,
          isOnline: { $literal: false }, // Sẽ được cập nhật từ socket
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
    ]);

    res.json({
      success: true,
      conversations: conversations.map((conv) => ({
        id: `CHAT_${conv.customerId}`,
        customerId: conv.customerId,
        customerName: conv.customerName,
        customerPhone: conv.customerPhone,
        customerEmail: conv.customerEmail,
        avatar: conv.customerAvatar,
        lastMessage: conv.lastMessage,
        lastMessageTime: conv.lastMessageTime,
        unreadCount: conv.unreadCount,
        isOnline: false,
        status: conv.unreadCount > 0 ? "unread" : "read",
        messages: [], // Sẽ load riêng khi mở chat
      })),
    });
  } catch (error) {
    console.error("Error getting conversations:", error);
    next(error);
  }
};

/**
 * GET /api/chat/messages/:customerId
 * Lấy tin nhắn giữa owner và customer
 */
export const getMessages = async (req, res, next) => {
  try {
    const ownerId = req.user._id.toString();
    const customerId = req.params.customerId;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    // Lấy tất cả tin nhắn giữa owner và customer
    const messages = await ChatMessage.find({
      $or: [
        { sender: customerId, receiver: ownerId },
        { sender: ownerId, receiver: customerId },
      ],
    })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort({ createdAt: 1 })
      .lean();

    // Đánh dấu tin nhắn chưa đọc là đã đọc
    await ChatMessage.updateMany(
      {
        sender: customerId,
        receiver: ownerId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    res.json({
      success: true,
      messages: messages.map((msg) => ({
        id: msg._id.toString(),
        text: msg.message,
        sender: msg.sender._id.toString() === ownerId ? "owner" : "customer",
        senderAvatar: msg.sender.avatar || null,
        receiverAvatar: msg.receiver.avatar || null,
        timestamp: msg.createdAt.getTime(),
        showTime: false,
        isRead: msg.isRead,
      })),
    });
  } catch (error) {
    console.error("Error getting messages:", error);
    next(error);
  }
};

/**
 * POST /api/chat/send
 * Gửi tin nhắn
 */
export const sendMessage = async (req, res, next) => {
  try {
    const ownerId = req.user._id.toString();
    const { customerId, message, facilityId } = req.body;

    if (!customerId || !message) {
      return res.status(400).json({
        success: false,
        message: "Customer ID and message are required",
      });
    }

    // Tạo tin nhắn mới
    const chatMessage = new ChatMessage({
      sender: ownerId,
      receiver: customerId,
      message: message.trim(),
      facility: facilityId || null,
    });

    await chatMessage.save();

    // Populate để lấy thông tin người gửi
    await chatMessage.populate("sender", "name avatar");
    await chatMessage.populate("receiver", "name avatar");

    res.json({
      success: true,
      message: {
        id: chatMessage._id.toString(),
        text: chatMessage.message,
        sender: "owner",
        timestamp: chatMessage.createdAt.getTime(),
        showTime: true,
        isRead: false,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    next(error);
  }
};

/**
 * PUT /api/chat/messages/:messageId/read
 * Đánh dấu tin nhắn đã đọc
 */
export const markAsRead = async (req, res, next) => {
  try {
    const messageId = req.params.messageId;
    const ownerId = req.user._id.toString();

    const message = await ChatMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (message.receiver.toString() !== ownerId) {
      return res.status(403).json({
        success: false,
        message: "You can only mark your own messages as read",
      });
    }

    await message.markAsRead();

    res.json({
      success: true,
      message: "Message marked as read",
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    next(error);
  }
};

/**
 * GET /api/chat/unread-count
 * Lấy số tin nhắn chưa đọc
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const ownerId = req.user._id.toString();

    const unreadCount = await ChatMessage.countDocuments({
      receiver: ownerId,
      isRead: false,
    });

    res.json({
      success: true,
      count: unreadCount,
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    next(error);
  }
};

/**
 * POST /api/chat/customer/send
 * Customer gửi tin nhắn đến owner
 */
export const customerSendMessage = async (req, res, next) => {
  try {
    const customerId = req.user._id.toString();
    const { ownerId, message, facilityId } = req.body;

    if (!ownerId || !message) {
      return res.status(400).json({
        success: false,
        message: "Owner ID and message are required",
      });
    }

    // Tạo tin nhắn mới
    const chatMessage = new ChatMessage({
      sender: customerId,
      receiver: ownerId,
      message: message.trim(),
      facility: facilityId || null,
    });

    await chatMessage.save();

    // Populate để lấy thông tin người gửi
    await chatMessage.populate("sender", "name avatar");
    await chatMessage.populate("receiver", "name avatar");

    res.json({
      success: true,
      message: {
        id: chatMessage._id.toString(),
        text: chatMessage.message,
        sender: "customer",
        timestamp: chatMessage.createdAt.getTime(),
        showTime: true,
        isRead: false,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    next(error);
  }
};

/**
 * GET /api/chat/customer/messages/:ownerId
 * Customer lấy tin nhắn với owner
 */
export const customerGetMessages = async (req, res, next) => {
  try {
    const customerId = req.user._id.toString();
    const ownerId = req.params.ownerId;

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: "Owner ID is required",
      });
    }

    // Lấy tất cả tin nhắn giữa customer và owner
    const messages = await ChatMessage.find({
      $or: [
        { sender: customerId, receiver: ownerId },
        { sender: ownerId, receiver: customerId },
      ],
    })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      success: true,
      messages: messages.map((msg) => ({
        id: msg._id.toString(),
        text: msg.message,
        sender: msg.sender._id.toString() === customerId ? "customer" : "owner",
        senderAvatar: msg.sender.avatar || null,
        receiverAvatar: msg.receiver.avatar || null,
        timestamp: msg.createdAt.getTime(),
        showTime: false,
        isRead: msg.isRead,
      })),
    });
  } catch (error) {
    console.error("Error getting messages:", error);
    next(error);
  }
};


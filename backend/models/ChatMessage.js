import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    // Người gửi (customer)
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Người nhận (owner)
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Nội dung tin nhắn
    message: {
      type: String,
      required: true,
      trim: true,
    },
    // Trạng thái đã đọc
    isRead: {
      type: Boolean,
      default: false,
    },
    // Thời gian đọc
    readAt: {
      type: Date,
      default: null,
    },
    // Loại tin nhắn (text, image, file, etc.)
    type: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    // Facility liên quan (nếu có)
    facility: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      default: null,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// Index để tìm tin nhắn nhanh
chatMessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
chatMessageSchema.index({ receiver: 1, isRead: 1 });
chatMessageSchema.index({ facility: 1 });

// Virtual để lấy conversation ID (unique cho mỗi cặp sender-receiver)
chatMessageSchema.virtual("conversationId").get(function () {
  const senderId = this.sender?.toString() || this.sender;
  const receiverId = this.receiver?.toString() || this.receiver;
  // Sắp xếp để có cùng conversation ID cho cả 2 chiều
  return [senderId, receiverId].sort().join("_");
});

// Method để đánh dấu đã đọc
chatMessageSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

export default ChatMessage;


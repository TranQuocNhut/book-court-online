// models/Notification.js
import mongoose, { Schema } from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // User nhận thông báo
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Người dùng là bắt buộc"],
      index: true,
    },

    // Loại thông báo
    type: {
      type: String,
      required: [true, "Loại thông báo là bắt buộc"],
      enum: [
        "booking",
        "payment",
        "cancellation",
        "review",
        "maintenance",
        "promotion",
        "reminder",
        "system",
        "feedback",
      ],
      index: true,
    },

    // Tiêu đề thông báo
    title: {
      type: String,
      required: [true, "Tiêu đề là bắt buộc"],
      trim: true,
      maxlength: [200, "Tiêu đề không được quá 200 ký tự"],
    },

    // Nội dung thông báo
    message: {
      type: String,
      required: [true, "Nội dung là bắt buộc"],
      trim: true,
      maxlength: [1000, "Nội dung không được quá 1000 ký tự"],
    },

    // Trạng thái đã đọc
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Thời gian đọc
    readAt: {
      type: Date,
      default: null,
    },

    // Dữ liệu bổ sung (có thể chứa bookingId, facilityId, etc.)
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // Mức độ ưu tiên
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes để tối ưu hóa tìm kiếm
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, type: 1, isRead: 1 });

export default mongoose.model("Notification", notificationSchema);

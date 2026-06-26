// models/Feedback.js
import mongoose, { Schema } from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    // Thông tin người gửi
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false, // Có thể là anonymous
    },
    senderName: {
      type: String,
      required: [true, "Tên người gửi là bắt buộc"],
      trim: true,
      maxlength: [100, "Tên không được quá 100 ký tự"],
    },
    senderEmail: {
      type: String,
      required: [true, "Email người gửi là bắt buộc"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"],
    },
    senderPhone: {
      type: String,
      trim: true,
      maxlength: [20, "Số điện thoại không được quá 20 ký tự"],
    },
    senderRole: {
      type: String,
      enum: ["customer", "owner", "admin"],
      default: "customer",
    },

    // Loại phản hồi
    type: {
      type: String,
      enum: ["complaint", "feedback"],
      required: [true, "Loại phản hồi là bắt buộc"],
    },

    // Nội dung phản hồi
    subject: {
      type: String,
      required: [true, "Tiêu đề là bắt buộc"],
      trim: true,
      maxlength: [200, "Tiêu đề không được quá 200 ký tự"],
    },
    content: {
      type: String,
      required: [true, "Nội dung phản hồi là bắt buộc"],
      trim: true,
      maxlength: [2000, "Nội dung không được quá 2000 ký tự"],
    },

    // Liên quan đến
    relatedFacility: {
      type: Schema.Types.ObjectId,
      ref: "Facility",
      required: false,
    },
    relatedBooking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: false,
    },

    // Trạng thái xử lý
    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
    },

    // Phản hồi từ admin
    adminResponse: {
      type: String,
      trim: true,
      maxlength: [1000, "Phản hồi không được quá 1000 ký tự"],
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Đánh dấu xóa
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes để tối ưu hóa tìm kiếm
feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ type: 1, status: 1 });
feedbackSchema.index({ sender: 1, createdAt: -1 });
feedbackSchema.index({ relatedFacility: 1 });
feedbackSchema.index({ relatedBooking: 1 });
feedbackSchema.index({ isDeleted: 1 });

export default mongoose.model("Feedback", feedbackSchema);


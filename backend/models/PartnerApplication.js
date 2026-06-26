import mongoose, { Schema } from "mongoose";

const partnerApplicationSchema = new mongoose.Schema(
  {
    // User đăng ký (có thể là user đã có tài khoản hoặc chưa)
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Thông tin đăng ký
    name: {
      type: String,
      required: [true, "Họ và tên là bắt buộc"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Số điện thoại là bắt buộc"],
      trim: true,
    },
    // Trạng thái đơn đăng ký
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // Lý do từ chối (nếu có)
    rejectionReason: {
      type: String,
      trim: true,
    },
    // Người duyệt/từ chối
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    // Ngày duyệt/từ chối
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
partnerApplicationSchema.index({ user: 1 });
partnerApplicationSchema.index({ status: 1 });
partnerApplicationSchema.index({ createdAt: -1 });

export default mongoose.model("PartnerApplication", partnerApplicationSchema);


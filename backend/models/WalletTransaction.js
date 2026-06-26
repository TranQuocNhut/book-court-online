import mongoose, { Schema } from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Số tiền (luôn là số dương)
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Loại giao dịch
    type: {
      type: String,
      enum: [
        "top-up", // Nạp tiền
        "refund", // Hoàn tiền (từ booking)
        "payment", // Thanh toán (cho booking)
        "adjustment", // Điều chỉnh (admin)
      ],
      required: true,
      index: true,
    },
    // Trạng thái giao dịch (quan trọng cho Top-up)
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "success",
    },
    // Thông tin bổ sung
    metadata: {
      bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
      paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
      topUpMethod: { type: String, enum: ["momo", "vnpay", "payos"] },
      transactionCode: { type: String }, // Mã giao dịch của Momo/VNPay
      reason: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

walletTransactionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("WalletTransaction", walletTransactionSchema);

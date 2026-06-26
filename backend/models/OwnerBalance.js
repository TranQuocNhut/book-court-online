import mongoose, { Schema } from "mongoose";

const ownerBalanceSchema = new mongoose.Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    // Số dư hiện tại (có thể rút)
    availableBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Tổng doanh thu (tính từ tất cả booking đã thanh toán)
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Tổng số tiền đã rút
    totalWithdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Tổng phí dịch vụ web đã thu được từ owner này
    totalPlatformFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Phí platform (nếu có)
    platformFee: {
      type: Number,
      default: 0.1, // 10% mặc định
      min: 0,
      max: 1,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("OwnerBalance", ownerBalanceSchema);


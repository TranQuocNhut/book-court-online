import mongoose, { Schema } from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    // User thực hiện
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Booking liên quan (không bắt buộc nếu có league)
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: false,
    },
    // League liên quan (cho thanh toán phí giải đấu)
    league: {
      type: Schema.Types.ObjectId,
      ref: "League",
      required: false,
    },
    // Số tiền
    amount: {
      type: Number,
      required: true,
    },
    // Phương thức (sẽ dùng ở Giai đoạn 2)
    method: {
      type: String,
      enum: ["cash", "vnpay", "momo", "payos", "wallet"],
      required: true,
    },
    // Trạng thái thanh toán
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },
    // Mã đơn hàng của chúng ta (gửi cho gateway)
    // Ví dụ: DATSAN_1678886400
    paymentId: {
      type: String,
      unique: true,
      required: true,
    },
    // Mã giao dịch của cổng thanh toán (nhận về)
    transactionId: {
      type: String,
      sparse: true, // Cho phép null nhưng unique khi có
    },
    // Thông tin đơn hàng (gửi cho gateway)
    orderInfo: {
      type: String,
    },
    // Ngày thanh toán thành công
    paidAt: {
      type: Date,
    },
    // Thông tin hoàn tiền
    refundInfo: {
      refundAmount: Number,
      refundDate: Date,
      refundReason: String,
      refundTransactionId: String,
    },
  },
  {
    timestamps: true,
  }
);

// Validation: Phải có booking hoặc league
paymentSchema.pre("validate", function (next) {
  if (!this.booking && !this.league) {
    return next(new Error("Payment phải có booking hoặc league"));
  }
  next();
});

// Indexes
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ booking: 1 }, { unique: true, sparse: true });
paymentSchema.index({ league: 1 }, { unique: true, sparse: true });

export default mongoose.model("Payment", paymentSchema);

import mongoose, { Schema } from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 10000, // Tối thiểu 10,000 VNĐ
    },
    // Thông tin tài khoản ngân hàng nhận tiền
    bankAccount: {
      accountNumber: {
        type: String,
        required: true,
      },
      accountName: {
        type: String,
        required: true,
      },
      bankCode: {
        type: String,
        required: true, // Ví dụ: "VCB", "TCB", "VTB"
      },
      bankName: {
        type: String,
      },
    },
    // Trạng thái rút tiền
    status: {
      type: String,
      enum: ["pending", "processing", "success", "failed", "cancelled"],
      default: "pending",
    },
    // Thông tin từ PayOS
    payosData: {
      transferId: String, // ID lệnh chi từ PayOS (payoutId)
      reference: String, // Mã tham chiếu (referenceId)
    },
    // Mô tả
    description: {
      type: String,
      default: "Rút tiền về tài khoản ngân hàng",
    },
    // Lý do thất bại (nếu có)
    failureReason: {
      type: String,
    },
    // Ngày xử lý thành công
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

withdrawalSchema.index({ owner: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1 });

export default mongoose.model("Withdrawal", withdrawalSchema);


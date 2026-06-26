import mongoose, { Schema } from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    referrer: {
      // Người giới thiệu
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    referee: {
      // Người được giới thiệu
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Mỗi người chỉ được giới thiệu bởi 1 người
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED"], // COMPLETED khi referee đặt sân lần đầu
      default: "PENDING",
    },
    rewardEarned: { type: Number, default: 0 }, // Số điểm người giới thiệu nhận được
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Referral", referralSchema);

import mongoose, { Schema } from "mongoose";

const loyaltyTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["EARN", "REDEEM", "EXPIRE", "ADJUSTMENT"],
      required: true,
    },
    amount: {
      type: Number,
      required: true, // Dương là cộng, âm là trừ
    },
    description: {
      type: String,
      required: true,
    },
    // Tham chiếu đến nguồn tạo ra điểm (Booking, Referral...)
    source: {
      sourceType: { type: String, enum: ["Booking", "Referral", "Reward"] },
      sourceId: { type: Schema.Types.ObjectId },
    },
  },
  { timestamps: true }
);

export default mongoose.model("LoyaltyTransaction", loyaltyTransactionSchema);

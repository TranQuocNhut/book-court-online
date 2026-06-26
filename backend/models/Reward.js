import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    pointCost: { type: Number, required: true, min: 1 },
    type: {
      type: String,
      enum: ["VOUCHER", "ITEM", "SERVICE"],
      required: true,
    },
    // Giá trị voucher (nếu là loại VOUCHER)
    voucherValue: { type: Number, default: 0 },
    voucherType: {
      type: String,
      enum: ["fixed", "percentage"],
      default: "fixed",
    },

    isActive: { type: Boolean, default: true },
    stock: { type: Number, default: null }, // null = vô hạn
    image: { type: String },
    imagePublicId: { type: String }, // Cloudinary public_id để xóa ảnh sau này
    // Owner tạo reward này
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Reward", rewardSchema);

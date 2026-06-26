import mongoose, { Schema } from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên dịch vụ là bắt buộc"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Giá dịch vụ là bắt buộc"],
      min: [0, "Giá dịch vụ phải lớn hơn hoặc bằng 0"],
    },
    type: {
      type: String,
      enum: ["DRINK", "FOOD", "EQUIPMENT"],
      required: [true, "Loại dịch vụ là bắt buộc"],
    },
    // Môn thể thao (chỉ áp dụng cho loại EQUIPMENT)
    sportCategory: {
      type: Schema.Types.ObjectId,
      ref: "SportCategory",
      default: null,
    },
    // Owner tạo dịch vụ này
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Hình ảnh dịch vụ
    image: {
      type: String,
      default: null,
    },
    imagePublicId: {
      type: String,
      default: null,
    },
    // Trạng thái hoạt động
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
serviceSchema.index({ owner: 1 });
serviceSchema.index({ type: 1 });
serviceSchema.index({ sportCategory: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ createdAt: -1 });

export default mongoose.model("Service", serviceSchema);


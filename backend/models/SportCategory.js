// models/SportCategory.js
import mongoose, { Schema } from "mongoose";

const sportCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên danh mục là bắt buộc"],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    // Thứ tự hiển thị
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// sportCategorySchema.index({ name: 1 }); // Không cần vì unique: true đã tự tạo index
sportCategorySchema.index({ status: 1 });
sportCategorySchema.index({ order: 1 });

// Method để đếm số cơ sở đang sử dụng danh mục này
sportCategorySchema.methods.getFacilityCount = async function () {
  const Facility = mongoose.model("Facility");
  return await Facility.countDocuments({ types: { $in: [this.name] } });
};

export default mongoose.model("SportCategory", sportCategorySchema);


// models/CourtType.js
import mongoose, { Schema } from "mongoose";

const courtTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên loại sân là bắt buộc"],
      trim: true,
      unique: true,
    },
    // Tham chiếu đến danh mục thể thao
    sportCategory: {
      type: Schema.Types.ObjectId,
      ref: "SportCategory",
      required: [true, "Danh mục thể thao là bắt buộc"],
    },
    description: {
      type: String,
      trim: true,
    },
    // Đặc điểm của loại sân (ví dụ: "Sân trong nhà", "Sân cỏ nhân tạo", v.v.)
    features: [
      {
        type: String,
        trim: true,
      },
    ],
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
// courtTypeSchema.index({ name: 1 }); // Không cần vì unique: true đã tự tạo index
courtTypeSchema.index({ sportCategory: 1 });
courtTypeSchema.index({ status: 1 });
courtTypeSchema.index({ order: 1 });

// Method để đếm số sân đang sử dụng loại này
courtTypeSchema.methods.getCourtCount = async function () {
  const Court = mongoose.model("Court");
  return await Court.countDocuments({ type: this.name });
};

export default mongoose.model("CourtType", courtTypeSchema);


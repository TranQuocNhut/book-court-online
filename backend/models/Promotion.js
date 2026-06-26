// models/Promotion.js
import mongoose, { Schema } from "mongoose";

const promotionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Mã khuyến mãi là bắt buộc"],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9]+$/, "Mã khuyến mãi chỉ được chứa chữ cái và số"],
    },
    name: {
      type: String,
      required: [true, "Tên khuyến mãi là bắt buộc"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "Loại giảm giá là bắt buộc"],
    },
    discountValue: {
      type: Number,
      required: [true, "Giá trị giảm giá là bắt buộc"],
      min: [0, "Giá trị giảm giá phải lớn hơn hoặc bằng 0"],
      validate: {
        validator: function(value) {
          if (this.discountType === "percentage") {
            return value >= 0 && value <= 100;
          }
          return value >= 0;
        },
        message: "Giá trị giảm giá không hợp lệ (percentage: 0-100, fixed: >= 0)",
      },
    },
    startDate: {
      type: Date,
      required: [true, "Ngày bắt đầu là bắt buộc"],
    },
    endDate: {
      type: Date,
      required: [true, "Ngày kết thúc là bắt buộc"],
      validate: {
        validator: function(value) {
          return value > this.startDate;
        },
        message: "Ngày kết thúc phải sau ngày bắt đầu",
      },
    },
    // Mảng các facility ID hoặc "all" cho tất cả
    applicableFacilities: [
      {
        type: Schema.Types.ObjectId,
        ref: "Facility",
      },
    ],
    // Nếu applicableFacilities rỗng hoặc null, áp dụng cho tất cả
    isAllFacilities: {
      type: Boolean,
      default: false,
    },
    // Mảng các khu vực áp dụng (ví dụ: ["Quận 1", "Quận 2"])
    applicableAreas: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["active", "expired", "pending", "inactive"],
      default: "pending",
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxUsage: {
      type: Number,
      default: null, // null = không giới hạn
      min: 1,
    },
    // Admin tạo khuyến mãi
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Hình ảnh khuyến mãi (optional)
    image: {
      url: { type: String },
      publicId: { type: String },
    },
    // Đánh dấu voucher từ reward (loyalty points)
    fromReward: {
      type: Boolean,
      default: false,
    },
    rewardId: {
      type: Schema.Types.ObjectId,
      ref: "Reward",
      default: null,
    },
    // User sở hữu voucher này (nếu từ reward)
    ownedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: code index is automatically created by unique: true in field definition
promotionSchema.index({ status: 1 });
promotionSchema.index({ startDate: 1, endDate: 1 });
promotionSchema.index({ applicableFacilities: 1 });
promotionSchema.index({ createdAt: -1 });

// Virtual để tính toán trạng thái dựa trên ngày tháng
promotionSchema.virtual("computedStatus").get(function() {
  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);

  if (this.status === "inactive") {
    return "inactive";
  }

  if (now < start) {
    return "pending";
  }

  if (now > end) {
    return "expired";
  }

  if (this.maxUsage !== null && this.usageCount >= this.maxUsage) {
    return "expired";
  }

  return "active";
});

// Pre-save hook để tự động cập nhật status dựa trên ngày tháng
promotionSchema.pre("save", function(next) {
  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);

  // Chỉ tự động cập nhật nếu status không phải "inactive"
  if (this.status !== "inactive") {
    if (now > end || (this.maxUsage !== null && this.usageCount >= this.maxUsage)) {
      this.status = "expired";
    } else if (now >= start && now <= end) {
      this.status = "active";
    } else if (now < start) {
      this.status = "pending";
    }
  }

  // Xử lý isAllFacilities
  if (!this.applicableFacilities || this.applicableFacilities.length === 0) {
    this.isAllFacilities = true;
  } else {
    this.isAllFacilities = false;
  }

  next();
});

// Method để kiểm tra khuyến mãi có hợp lệ không
promotionSchema.methods.isValid = function(facilityId = null, area = null) {
  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);

  // Kiểm tra status
  if (this.status === "inactive" || this.status === "expired") {
    return { valid: false, reason: "Khuyến mãi đã hết hạn hoặc bị vô hiệu hóa" };
  }

  // Kiểm tra thời gian
  if (now < start) {
    return { valid: false, reason: "Khuyến mãi chưa bắt đầu" };
  }

  if (now > end) {
    return { valid: false, reason: "Khuyến mãi đã hết hạn" };
  }

  // Kiểm tra số lần sử dụng
  if (this.maxUsage !== null && this.usageCount >= this.maxUsage) {
    return { valid: false, reason: "Khuyến mãi đã hết lượt sử dụng" };
  }

  // Kiểm tra facility
  if (facilityId) {
    if (!this.isAllFacilities) {
      const facilityIdStr = facilityId.toString();
      const applicableIds = this.applicableFacilities.map((id) => id.toString());
      if (!applicableIds.includes(facilityIdStr)) {
        return { valid: false, reason: "Khuyến mãi không áp dụng cho cơ sở này" };
      }
    }
  }

  // Kiểm tra khu vực (nếu có)
  if (area && this.applicableAreas && this.applicableAreas.length > 0) {
    if (!this.applicableAreas.includes(area)) {
      return { valid: false, reason: "Khuyến mãi không áp dụng cho khu vực này" };
    }
  }

  return { valid: true };
};

// Method để tính giá sau khi giảm
promotionSchema.methods.calculateDiscount = function(originalPrice) {
  if (this.discountType === "percentage") {
    const discountAmount = (originalPrice * this.discountValue) / 100;
    return {
      discountAmount,
      finalPrice: originalPrice - discountAmount,
    };
  } else {
    // fixed
    const discountAmount = Math.min(this.discountValue, originalPrice);
    return {
      discountAmount,
      finalPrice: originalPrice - discountAmount,
    };
  }
};

export default mongoose.model("Promotion", promotionSchema);


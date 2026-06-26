// models/Review.js
import mongoose, { Schema } from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    // User tạo đánh giá
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Người dùng là bắt buộc"],
    },

    // Booking liên quan
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking là bắt buộc"],
    },

    // Facility được đánh giá
    facility: {
      type: Schema.Types.ObjectId,
      ref: "Facility",
      required: [true, "Cơ sở là bắt buộc"],
    },

    // Điểm đánh giá (1-5)
    rating: {
      type: Number,
      required: [true, "Điểm đánh giá là bắt buộc"],
      min: [1, "Điểm đánh giá tối thiểu là 1"],
      max: [5, "Điểm đánh giá tối đa là 5"],
    },

    // Nội dung đánh giá
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, "Bình luận không được quá 1000 ký tự"],
    },

    // Phản hồi từ owner
    ownerReply: {
      reply: {
        type: String,
        trim: true,
        maxlength: [500, "Phản hồi không được quá 500 ký tự"],
      },
      repliedAt: {
        type: Date,
      },
      repliedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },

    // Báo cáo đánh giá
    report: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: null,
      },
      reason: {
        type: String,
        trim: true,
      },
      reportedAt: {
        type: Date,
      },
      reportedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      processedAt: {
        type: Date,
      },
      processedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      adminNotes: {
        type: String,
        trim: true,
      },
    },

    // Trạng thái đánh giá
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes để tối ưu hóa tìm kiếm
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ facility: 1, rating: 1 });
reviewSchema.index({ booking: 1 }, { unique: true });
reviewSchema.index({ "report.status": 1 });

// Method để kiểm tra xem owner có thể trả lời không
reviewSchema.methods.canOwnerReply = function (ownerId) {
  if (!this.facility) return false;
  
  // Populate facility owner nếu chưa populate
  if (this.facility.owner) {
    const facilityOwnerId = this.facility.owner._id 
      ? this.facility.owner._id.toString() 
      : this.facility.owner.toString();
    return facilityOwnerId === ownerId.toString();
  }
  
  return false;
};

// Static method để tính rating trung bình của facility
reviewSchema.statics.getAverageRating = async function (facilityId) {
  // Convert facilityId to ObjectId if it's a string
  let facilityObjectId = facilityId;
  if (typeof facilityId === 'string' && mongoose.Types.ObjectId.isValid(facilityId)) {
    facilityObjectId = new mongoose.Types.ObjectId(facilityId);
  }
  
  const result = await this.aggregate([
    {
      $match: {
        facility: facilityObjectId,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: "$rating",
        },
      },
    },
  ]);

  if (result.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  result[0].ratingDistribution.forEach((rating) => {
    distribution[rating] = (distribution[rating] || 0) + 1;
  });

  return {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    totalReviews: result[0].totalReviews,
    ratingDistribution: distribution,
  };
};

export default mongoose.model("Review", reviewSchema);

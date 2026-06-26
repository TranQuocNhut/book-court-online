// models/Booking.js
import mongoose, { Schema } from "mongoose";
import BookingSequence from "./BookingSequence.js";

const bookingSchema = new mongoose.Schema(
  {
    // User đặt sân (optional - null cho walk-in booking)
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },

    // Sân được đặt
    court: {
      type: Schema.Types.ObjectId,
      ref: "Court",
      required: [true, "Sân là bắt buộc"],
    },

    // Cơ sở chứa sân
    facility: {
      type: Schema.Types.ObjectId,
      ref: "Facility",
      required: [true, "Cơ sở là bắt buộc"],
    },

    // Ngày đặt sân
    date: {
      type: Date,
      required: [true, "Ngày là bắt buộc"],
    },

    // Các khung giờ đặt (ví dụ: ["18:00-19:00", "19:00-20:00"])
    timeSlots: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],

    // Trạng thái booking
    status: {
      type: String,
      enum: [
        "pending", // Chờ xác nhận (cho thanh toán tiền mặt hoặc chờ owner xác nhận)
        "pending_payment", // Đang chờ thanh toán (HOLD - cho online payment)
        "hold", // Giữ slot tạm thời
        "confirmed", // Đã xác nhận (sau khi thanh toán)
        "expired", // Hết hạn thanh toán
        "cancelled", // Đã hủy
        "completed", // Đã hoàn thành
      ],
      default: "pending_payment",
    },

    // Thời gian hết hạn giữ slot (tự động expire sau X phút)
    holdUntil: {
      type: Date,
      default: function () {
        // Mặc định 5 phút từ thời điểm tạo
        return new Date(Date.now() + 5 * 60 * 1000);
      },
    },

    // Trạng thái thanh toán
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },

    // Phương thức thanh toán
    paymentMethod: {
      type: String,
      enum: ["momo", "vnpay", "cash", "payos", "wallet"],
      default: null,
    },

    // Tổng tiền
    totalAmount: {
      type: Number,
      required: [true, "Tổng tiền là bắt buộc"],
      min: [0, "Tổng tiền không được âm"],
    },

    // Mã khuyến mãi (nếu có)
    promotionCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },

    // Số tiền giảm giá từ khuyến mãi
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, "Số tiền giảm giá không được âm"],
    },

    // Thông tin liên hệ
    contactInfo: {
      name: {
        type: String,
        required: [true, "Tên người đặt là bắt buộc"],
        trim: true,
      },
      phone: {
        type: String,
        required: false,
        trim: true,
        match: [/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ"],
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      notes: {
        type: String,
        trim: true,
      },
    },

    // Thời gian hủy (nếu có)
    cancelledAt: {
      type: Date,
      default: null,
    },

    // Lý do hủy
    cancellationReason: {
      type: String,
      trim: true,
    },

    // Thời gian hoàn thành
    completedAt: {
      type: Date,
      default: null,
    },

    // Ghi chú từ chủ sân
    ownerNotes: {
      type: String,
      trim: true,
    },
    // Mã đặt sân (format: BK-YYYYMMDD-XXXX)
    bookingCode: {
      type: String,
      unique: true,
      sparse: true, // Cho phép null nhưng unique nếu có giá trị
      trim: true,
      uppercase: true,
    },
    // Mã QR điện tử Booking (base64)
    qrCode: {
      type: String,
      default: null,
    },
    // Thời điểm check-in tại cơ sở
    checkedInAt: {
      type: Date,
      default: null,
    },
    // Người thực hiện check-in (owner/admin)
    checkedInBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Tham chiếu đến giải đấu (nếu booking từ tournament)
    league: {
      type: Schema.Types.ObjectId,
      ref: "League",
      default: null,
    },
    // Thông tin match (nếu booking từ tournament match)
    matchInfo: {
      stage: String, // round1, round2, semi, final, etc.
      matchNumber: Number,
    },
    // Thời gian bắt đầu thực tế (Date object - kết hợp date + time)
    startTime: {
      type: Date,
      required: false,
      default: null,
    },
    // Thời gian kết thúc dự kiến (Date object - luôn có nếu có startTime)
    endTime: {
      type: Date,
      required: false,
      default: null,
    },
    // Đánh dấu booking linh hoạt (không theo khung giờ cố định)
    isFlexibleBooking: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes để tối ưu hóa tìm kiếm
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ facility: 1, date: 1 }); // Compound index cho facility và date (cũng hỗ trợ query theo date)
bookingSchema.index({ court: 1, date: 1 }); // Compound index cho court và date (cũng hỗ trợ query theo date)
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ holdUntil: 1 }); // Index for expiry queries
bookingSchema.index({ court: 1, date: 1, startTime: 1 }); // Index cho flexible booking queries
bookingSchema.index({ court: 1, date: 1, endTime: 1 }); // Index cho flexible booking queries
bookingSchema.index({ startTime: 1, endTime: 1 }); // Index cho overlap checking
// Note: bookingCode index được tạo tự động bởi unique: true trong field definition
// Note: date index không cần thiết vì đã có trong compound indexes ở trên

// Pre-save hook để generate booking code
bookingSchema.pre("save", async function (next) {
  // Chỉ generate nếu chưa có bookingCode và đây là document mới
  if (!this.bookingCode && this.isNew) {
    try {
      // Lấy ngày từ createdAt hoặc date
      const date = this.createdAt || this.date || new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD

      // Get or create sequence for today
      let sequence = await BookingSequence.findOneAndUpdate(
        { date: dateStr },
        { $inc: { sequence: 1 } },
        { upsert: true, new: true }
      );

      const seqNum = sequence.sequence.toString().padStart(4, "0");
      this.bookingCode = `BK-${dateStr}-${seqNum}`;
    } catch (error) {
      // Nếu có lỗi, vẫn tiếp tục nhưng không có bookingCode
      console.error("Error generating booking code:", error);
    }
  }
  next();
});

// Virtual field để lấy tổng số khung giờ
bookingSchema.virtual("duration").get(function () {
  return this.timeSlots.length;
});

// Virtual method để lấy display code (fallback về _id nếu không có bookingCode)
bookingSchema.virtual("displayCode").get(function () {
  return this.bookingCode || this._id.toString().slice(-8).toUpperCase();
});

// Virtual: Lấy startTime từ timeSlots nếu chưa có
bookingSchema.virtual("computedStartTime").get(function () {
  if (this.startTime) return this.startTime;
  
  if (this.timeSlots && this.timeSlots.length > 0) {
    const firstSlot = this.timeSlots[0];
    const [startTimeStr] = firstSlot.split('-');
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    const startDate = new Date(this.date);
    startDate.setHours(hours, minutes, 0, 0);
    return startDate;
  }
  return null;
});

// Virtual: Lấy endTime từ timeSlots nếu chưa có
bookingSchema.virtual("computedEndTime").get(function () {
  if (this.endTime) return this.endTime;
  
  if (this.timeSlots && this.timeSlots.length > 0) {
    const lastSlot = this.timeSlots[this.timeSlots.length - 1];
    const [, endTimeStr] = lastSlot.split('-');
    const [hours, minutes] = endTimeStr.split(':').map(Number);
    const endDate = new Date(this.date);
    endDate.setHours(hours, minutes, 0, 0);
    return endDate;
  }
  return null;
});

// Method: Lấy startTime thực tế (ưu tiên startTime, fallback computedStartTime)
bookingSchema.methods.getStartTime = function () {
  return this.startTime || this.computedStartTime;
};

// Method: Lấy endTime thực tế (ưu tiên endTime, fallback computedEndTime)
bookingSchema.methods.getEndTime = function () {
  return this.endTime || this.computedEndTime;
};

// Method để check xem booking có đang pending không
bookingSchema.methods.isPending = function () {
  return this.status === "pending_payment" || this.status === "hold";
};

// Method để check xem booking có đang hold không
bookingSchema.methods.isHold = function () {
  return this.status === "pending_payment" || this.status === "hold";
};

// Method để check xem booking có hết hạn không
bookingSchema.methods.isExpired = function () {
  return (
    this.status === "expired" || (this.holdUntil && new Date() > this.holdUntil)
  );
};

// Method để check xem booking có thể cancel không
bookingSchema.methods.canCancel = function () {
  return (
    this.status === "pending" || // Chờ xác nhận (thanh toán tiền mặt)
    this.status === "pending_payment" || // Chờ thanh toán (online payment)
    this.status === "hold" || // Đang giữ chỗ
    this.status === "confirmed"
  ); // Đã xác nhận
};

// Method để check xem booking có thể refund không
bookingSchema.methods.isEligibleForRefund = function () {
  return this.paymentStatus === "paid" && this.canCancel();
};

// Static method để lấy bookings theo user
bookingSchema.statics.findByUser = function (userId, filters = {}) {
  return this.find({ user: userId, ...filters })
    .populate("court", "name type price")
    .populate("facility", "name address location")
    .sort({ createdAt: -1 });
};

// Static method để lấy bookings theo facility
bookingSchema.statics.findByFacility = function (facilityId, filters = {}) {
  return this.find({ facility: facilityId, ...filters })
    .populate("court", "name type price")
    .populate("user", "name email phone avatar")
    .sort({ date: 1, createdAt: -1 });
};

// Static method để check overlap giữa 2 time ranges
bookingSchema.statics.hasTimeOverlap = function (start1, end1, start2, end2) {
  if (!start1 || !end1 || !start2 || !end2) return false;
  
  const s1 = start1 instanceof Date ? start1 : new Date(start1);
  const e1 = end1 instanceof Date ? end1 : new Date(end1);
  const s2 = start2 instanceof Date ? start2 : new Date(start2);
  const e2 = end2 instanceof Date ? end2 : new Date(end2);
  
  // Overlap nếu: start1 < end2 && start2 < end1
  return !(e1 <= s2 || s1 >= e2);
};

// Static method để check availability
bookingSchema.statics.checkAvailability = async function (
  courtId,
  date,
  timeSlots, // Optional - cho booking cố định
  startTime = null, // Optional - Date object cho flexible booking
  endTime = null   // Optional - Date object, LUÔN PHẢI CÓ nếu có startTime
) {
  const now = new Date();
  const bookingDate = new Date(date);
  bookingDate.setHours(0, 0, 0, 0);
  
  // Get all bookings for this court and date
  const startOfDay = new Date(bookingDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(bookingDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  const bookings = await this.find({
    court: courtId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $in: ["pending_payment", "hold", "confirmed"] },
    $or: [
      { holdUntil: { $exists: false } },
      { holdUntil: { $gt: now } },
      { status: "confirmed" },
    ],
  });

  // Normalize request times
  let reqStartTime, reqEndTime;
  
  if (startTime && endTime) {
    // Flexible booking - sử dụng Date objects
    reqStartTime = startTime instanceof Date ? startTime : new Date(startTime);
    reqEndTime = endTime instanceof Date ? endTime : new Date(endTime);
  } else if (timeSlots && timeSlots.length > 0) {
    // Fixed booking - convert từ timeSlots
    const firstSlot = timeSlots[0];
    const lastSlot = timeSlots[timeSlots.length - 1];
    const [startStr] = firstSlot.split('-');
    const [, endStr] = lastSlot.split('-');
    
    const [startHour, startMin] = startStr.split(':').map(Number);
    const [endHour, endMin] = endStr.split(':').map(Number);
    
    reqStartTime = new Date(bookingDate);
    reqStartTime.setHours(startHour, startMin, 0, 0);
    reqEndTime = new Date(bookingDate);
    reqEndTime.setHours(endHour, endMin, 0, 0);
  } else {
    return false; // Không có thông tin thời gian
  }

  // Check overlap với từng booking
  for (const booking of bookings) {
    const bookStartTime = booking.getStartTime();
    const bookEndTime = booking.getEndTime();
    
    if (!bookStartTime || !bookEndTime) continue;
    
    // Check overlap: start1 < end2 && start2 < end1
    const hasOverlap = this.hasTimeOverlap(
      reqStartTime,
      reqEndTime,
      bookStartTime,
      bookEndTime
    );
    
    if (hasOverlap) {
      return false; // Có overlap
    }
  }

  return true; // Không có overlap
};

export default mongoose.model("Booking", bookingSchema);

// models/Facility.js
import mongoose, { Schema } from "mongoose";

const facilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên cơ sở là bắt buộc"],
      trim: true,
    },
    // Owner (chủ cơ sở)
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Địa chỉ (text)
    address: {
      type: String,
      required: [true, "Địa chỉ là bắt buộc"],
      trim: true,
    },
    // Tọa độ địa lý (GeoJSON Point format)
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: false, // Không set default để tránh tạo object khi không có coordinates
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: false,
        validate: {
          validator: function(coords) {
            if (!coords || coords.length !== 2) return false;
            const [lng, lat] = coords;
            return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
          },
          message: 'Coordinates phải là [longitude, latitude] và trong phạm vi hợp lệ'
        }
      }
    },
    // Mảng các loại sân thể thao (ví dụ: ['Bóng đá', 'Tennis', 'Cầu lông'])
    types: {
      type: [String],
      required: [true, "Loại cơ sở là bắt buộc"],
      validate: {
        validator: function(types) {
          return Array.isArray(types) && types.length > 0;
        },
        message: "Phải chọn ít nhất một loại cơ sở"
      },
      trim: true,
    },
    pricePerHour: {
      type: Number,
      required: false, // Không bắt buộc nữa, dùng priceRange thay thế
      min: 0,
    },
    // Khoảng giá (min - max) cho mỗi khung giờ
    priceRange: {
      min: {
        type: Number,
        required: [true, "Giá tối thiểu là bắt buộc"],
        min: 0,
      },
      max: {
        type: Number,
        required: [true, "Giá tối đa là bắt buộc"],
        min: 0,
      },
    },
    // Khung giờ đặt sân (30 phút hoặc 60 phút)
    timeSlotDuration: {
      type: Number,
      enum: [30, 60],
      default: 60, // Mặc định 1 giờ
      required: false,
    },
    description: {
      type: String,
      trim: true,
    },
    // Số điện thoại liên hệ
    phoneNumber: {
      type: String,
      required: [true, "Số điện thoại là bắt buộc"],
      trim: true,
      match: [/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ"],
    },
    // Trạng thái của cơ sở
    status: {
      type: String,
      enum: ["opening", "closed", "maintenance"],
      default: "opening",
    },
    // Dịch vụ của cơ sở
    services: [
      {
        type: String,
        trim: true,
      },
    ],
    // Giờ hoạt động
    operatingHours: {
      monday: {
        isOpen: { type: Boolean, default: true },
        open: { type: String, default: "06:00" },
        close: { type: String, default: "22:00" },
      },
      tuesday: {
        isOpen: { type: Boolean, default: true },
        open: { type: String, default: "06:00" },
        close: { type: String, default: "22:00" },
      },
      wednesday: {
        isOpen: { type: Boolean, default: true },
        open: { type: String, default: "06:00" },
        close: { type: String, default: "22:00" },
      },
      thursday: {
        isOpen: { type: Boolean, default: true },
        open: { type: String, default: "06:00" },
        close: { type: String, default: "22:00" },
      },
      friday: {
        isOpen: { type: Boolean, default: true },
        open: { type: String, default: "06:00" },
        close: { type: String, default: "22:00" },
      },
      saturday: {
        isOpen: { type: Boolean, default: true },
        open: { type: String, default: "06:00" },
        close: { type: String, default: "22:00" },
      },
      sunday: {
        isOpen: { type: Boolean, default: true },
        open: { type: String, default: "06:00" },
        close: { type: String, default: "22:00" },
      },
    },
    // Mảng chứa các URL hình ảnh của cơ sở (liên kết với FieldImages)
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String }, // Tùy chọn, nếu dùng Cloudinary
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: xóa location nếu không có coordinates hợp lệ và trim types
facilitySchema.pre('save', function(next) {
  // Xử lý location
  if (this.location && (!this.location.coordinates || !Array.isArray(this.location.coordinates) || this.location.coordinates.length !== 2)) {
    // Xóa location nếu không có coordinates hợp lệ
    this.location = undefined;
  } else if (this.location && this.location.coordinates) {
    // Đảm bảo type luôn là 'Point' nếu có coordinates
    this.location.type = 'Point';
  }
  
  // Trim các phần tử trong mảng types và loại bỏ trùng lặp
  if (this.types && Array.isArray(this.types)) {
    this.types = this.types
      .map(type => typeof type === 'string' ? type.trim() : type)
      .filter(type => type && type.length > 0);
    // Loại bỏ trùng lặp
    this.types = [...new Set(this.types)];
  }
  
  // Validate priceRange: max phải >= min
  if (this.priceRange && this.priceRange.min !== undefined && this.priceRange.max !== undefined) {
    if (this.priceRange.max < this.priceRange.min) {
      return next(new Error('Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu'));
    }
  }
  
  next();
});

// Indexes để tối ưu hóa tìm kiếm
facilitySchema.index({ owner: 1 });
facilitySchema.index({ address: "text", name: "text" }); // Hỗ trợ tìm kiếm text
facilitySchema.index({ types: 1 }); // Index cho mảng types
facilitySchema.index({ location: "2dsphere" }); // GeoSpatial index cho tìm kiếm theo khoảng cách

export default mongoose.model("Facility", facilitySchema);

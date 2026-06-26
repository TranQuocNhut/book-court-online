import mongoose from "mongoose";

const systemConfigSchema = new mongoose.Schema(
  {
    // Platform fee (phí dịch vụ) - từ 0 đến 1 (ví dụ: 0.1 = 10%)
    platformFee: {
      type: Number,
      default: 0.1, // 10% mặc định
      min: 0,
      max: 1,
      required: true,
    },
    // Thông tin liên hệ hỗ trợ
    supportEmail: {
      type: String,
      trim: true,
      default: "support@datsanonline.com",
    },
    supportPhone: {
      type: String,
      trim: true,
      default: "1900123456",
    },
    // Các settings khác có thể thêm sau
    // siteName, siteDescription, logo, etc.
  },
  {
    timestamps: true,
  }
);

// Chỉ cho phép 1 document duy nhất
systemConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = new this({ 
      platformFee: 0.1,
      supportEmail: "support@datsanonline.com",
      supportPhone: "1900123456"
    });
    await config.save();
  }
  return config;
};

export default mongoose.model("SystemConfig", systemConfigSchema);


import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    // ================== THÔNG TIN CƠ BẢN ==================
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    avatarPublicId: {
      type: String,
      default: null,
    },

    // ================== OAUTH2 ==================
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Cho phép null nhưng unique khi có giá trị
    },

    // ================== THÔNG TIN BỔ SUNG ==================
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    
    // ================== TÀI KHOẢN NGÂN HÀNG (Cho Owner) ==================
    bankAccount: {
      accountNumber: {
        type: String,
        trim: true,
      },
      accountName: {
        type: String,
        trim: true,
      },
      bankCode: {
        type: String,
        trim: true,
      },
      bankName: {
        type: String,
        trim: true,
      },
    },

    // ================== VAI TRÒ & CÀI ĐẶT ==================
    role: {
      type: String,
      enum: ["user", "owner", "admin"],
      default: "user",
    },
    language: {
      type: String,
      default: "vi",
    },
    
    // Cài đặt thông báo
    emailNotifications: {
      type: Boolean,
      default: true, // Mặc định bật thông báo email
    },

    // ================== VÍ & LOYALTY (Đã sửa vị trí) ==================
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimePoints: {
      // Dùng để xét hạng
      type: Number,
      default: 0,
      min: 0,
    },

    // Sân yêu thích
    favorites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Facility'
    }],

    // Cấu hình phí giải đấu (chỉ cho owner)
    tournamentFeeConfig: {
      // Phí đăng ký tham gia giải đấu
      registrationFee: {
        type: Number,
        default: 0,
        min: 0,
      },
      // Phí tổ chức giải đấu nội bộ
      internalTournamentFees: {
        // Phí tạo giải (Service Fee)
        serviceFee: {
          type: Number,
          default: 0,
          min: 0,
        },
        // Phí sử dụng sân cho từng loại sân (Map: courtTypeId -> fee per hour)
        courtTypeFees: {
          type: Map,
          of: Number,
          default: new Map(),
        },
        // Phí trọng tài
        refereeFee: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    },

    // Trạng thái tài khoản
    isActive: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },

    // ================== AUTH & SECURITY ==================
    lastLogin: {
      type: Date,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    refreshTokens: [
      {
        token: String,
        createdAt: {
          type: Date,
          default: Date.now,
          expires: 604800, // 7 ngày
        },
      },
    ],
    otpCode: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  // ================== OPTIONS (Tham số thứ 2) ==================
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ================== INDEXES & VIRTUALS ==================
userSchema.index({ role: 1 });

userSchema.virtual("displayName").get(function () {
  return this.name || this.email.split("@")[0];
});

// ================== MIDDLEWARE (PRE-SAVE) ==================

// 1. Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 2. Tạo Referral Code tự động
userSchema.pre("save", async function (next) {
  if (!this.referralCode && this.name) {
    // Tạo mã ví dụ: NAM1234
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    // Lấy 3 ký tự đầu của tên, viết hoa
    const namePrefix = this.name
      .replace(/\s/g, "")
      .substring(0, 3)
      .toUpperCase();
    // Xử lý tiếng Việt không dấu
    const cleanPrefix = namePrefix
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    let code = `${cleanPrefix}${randomSuffix}`;
    this.referralCode = code;
  }
  next();
});

// ================== METHODS ==================

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateLoginInfo = function () {
  this.lastLogin = new Date();
  this.loginCount += 1;
  return this.save();
};

userSchema.methods.addRefreshToken = async function (token) {
  try {
    if (!this.refreshTokens || !Array.isArray(this.refreshTokens)) {
      this.refreshTokens = [];
    }
    this.refreshTokens.push({ token });
    return await this.save();
  } catch (error) {
    if (error.name === "VersionError") {
      const freshUser = await this.constructor.findById(this._id);
      if (freshUser) {
        if (
          !freshUser.refreshTokens ||
          !Array.isArray(freshUser.refreshTokens)
        ) {
          freshUser.refreshTokens = [];
        }
        freshUser.refreshTokens.push({ token });
        return await freshUser.save();
      }
    }
    throw error;
  }
};

userSchema.methods.removeRefreshToken = async function (token) {
  try {
    if (!this.refreshTokens || !Array.isArray(this.refreshTokens)) {
      this.refreshTokens = [];
    }
    this.refreshTokens = this.refreshTokens.filter((rt) => rt.token !== token);
    return await this.save();
  } catch (error) {
    if (error.name === "VersionError") {
      const freshUser = await this.constructor.findById(this._id);
      if (freshUser) {
        freshUser.refreshTokens = freshUser.refreshTokens.filter(
          (rt) => rt.token !== token
        );
        return await freshUser.save();
      }
    }
    throw error;
  }
};

userSchema.methods.removeRefreshTokenById = async function (tokenId) {
  try {
    if (!this.refreshTokens || !Array.isArray(this.refreshTokens)) {
      this.refreshTokens = [];
    }
    this.refreshTokens = this.refreshTokens.filter(
      (rt) => rt._id.toString() !== tokenId
    );
    return await this.save();
  } catch (error) {
    if (error.name === "VersionError") {
      const freshUser = await this.constructor.findById(this._id);
      if (freshUser) {
        if (
          !freshUser.refreshTokens ||
          !Array.isArray(freshUser.refreshTokens)
        ) {
          freshUser.refreshTokens = [];
        }
        freshUser.refreshTokens = freshUser.refreshTokens.filter(
          (rt) => rt._id.toString() !== tokenId
        );
        return await freshUser.save();
      }
    }
    throw error;
  }
};

// ================== STATICS ==================

userSchema.statics.findByGoogleId = function (googleId) {
  return this.findOne({ googleId });
};

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.cleanupUnverifiedUsers = function () {
  const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
  return this.deleteMany({
    isEmailVerified: false,
    createdAt: { $lt: new Date(fifteenMinutesAgo) },
  });
};

userSchema.statics.createFromGoogleProfile = function (profile) {
  return this.create({
    googleId: profile.id,
    email: profile.emails[0].value,
    name: profile.displayName,
    avatar: profile.photos[0]?.value,
    isEmailVerified: true,
    isActive: true,
  });
};

export default mongoose.model("User", userSchema);

import dotenv from "dotenv";

dotenv.config();

export const config = {
  // Server Configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  // MongoDB Configuration
  mongodbUri:
    process.env.MONGODB_URI || "mongodb://localhost:27017/dat-san-online",

  // Google OAuth2 Configuration
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "your_google_client_id_here",
    clientSecret:
      process.env.GOOGLE_CLIENT_SECRET || "your_google_client_secret_here",
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      "http://localhost:3000/api/auth/google/callback",
  },

  // JWT Configuration
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      "your_super_secret_jwt_key_here_make_it_long_and_random",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  // Session Configuration
  sessionSecret:
    process.env.SESSION_SECRET ||
    "your_super_secret_session_key_here_make_it_long_and_random",

  // Frontend URL (for CORS)
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  // Cloudinary Configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // Goong API Configuration
  goong: {
    apiKey: process.env.GOONG_API_KEY,
  },
  // VNPay Configuration (Sandbox)
  vnpay: {
    tmnCode: process.env.VNP_TMNCODE || "YOUR_VNP_TMNCODE",
    hashSecret: process.env.VNP_HASHSECRET || "YOUR_VNP_HASHSECRET",
    url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    returnUrl: "http://localhost:3000/api/payments/callback/vnpay", // Phải khớp với routes/payment.js
  },

  // Momo Configuration (Sandbox)
  momo: {
    partnerCode: process.env.MOMO_PARTNER_CODE || "YOUR_PARTNER_CODE",
    accessKey: process.env.MOMO_ACCESS_KEY || "YOUR_ACCESS_KEY",
    secretKey: process.env.MOMO_SECRET_KEY || "YOUR_SECRET_KEY",
    apiEndpoint: "https://test-payment.momo.vn/v2/gateway/api/create",
    notifyUrl:
      process.env.MOMO_NOTIFYURL ||
      "http://localhost:3000/api/payments/callback/momo",
    redirectUrl: process.env.MOMO_REDIRECT_URL || "http://localhost:5173/payment", // URL frontend - sẽ redirect về /payment với query params
  },

  // Payos Configuration
  payos: {
    // Kênh thanh toán (Payment)
    payment: {
      clientId: process.env.PAYOS_PAYMENT_CLIENT_ID || process.env.PAYOS_CLIENT_ID || "YOUR_PAYOS_PAYMENT_CLIENT_ID",
      apiKey: process.env.PAYOS_PAYMENT_API_KEY || process.env.PAYOS_API_KEY || "YOUR_PAYOS_PAYMENT_API_KEY",
      checksumKey: process.env.PAYOS_PAYMENT_CHECKSUM_KEY || process.env.PAYOS_CHECKSUM_KEY || "YOUR_PAYOS_PAYMENT_CHECKSUM_KEY",
    },
    // Kênh chi tiền (Payout)
    payout: {
      clientId: process.env.PAYOS_PAYOUT_CLIENT_ID || process.env.PAYOS_CLIENT_ID || "YOUR_PAYOS_PAYOUT_CLIENT_ID",
      apiKey: process.env.PAYOS_PAYOUT_API_KEY || process.env.PAYOS_API_KEY || "YOUR_PAYOS_PAYOUT_API_KEY",
      checksumKey: process.env.PAYOS_PAYOUT_CHECKSUM_KEY || process.env.PAYOS_CHECKSUM_KEY || "YOUR_PAYOS_PAYOUT_CHECKSUM_KEY",
    },
    // Giữ lại để backward compatibility (nếu có code cũ dùng)
    clientId: process.env.PAYOS_PAYMENT_CLIENT_ID || process.env.PAYOS_CLIENT_ID || "YOUR_PAYOS_CLIENT_ID",
    apiKey: process.env.PAYOS_PAYMENT_API_KEY || process.env.PAYOS_API_KEY || "YOUR_PAYOS_API_KEY",
    checksumKey: process.env.PAYOS_PAYMENT_CHECKSUM_KEY || process.env.PAYOS_CHECKSUM_KEY || "YOUR_PAYOS_CHECKSUM_KEY",
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // Gemini AI Configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  },

  // Google Sheets API Configuration
  googleSheets: {
    apiKey: process.env.GOOGLE_SHEETS_API_KEY || "",
  },
};

// Validation function
export const validateConfig = () => {
  const required = [
    "google.clientId",
    "google.clientSecret",
    "jwt.secret",
    "sessionSecret",
  ];

  const missing = required.filter((key) => {
    const value = key.split(".").reduce((obj, k) => obj?.[k], config);
    return !value || value.includes("your_") || value.includes("_here");
  });

  if (missing.length > 0) {
    console.warn("⚠️  Cảnh báo: Các biến môi trường sau cần được cấu hình:");
    missing.forEach((key) => console.warn(`   - ${key.toUpperCase()}`));
    console.warn("   Vui lòng tạo file .env và cấu hình các giá trị này.");
  }
};

// utils/tokenGenerator.js
import crypto from "crypto";

// Tạo mã OTP 6 số
export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Tạo token reset mật khẩu
export const generateResetToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  // Hash token trước khi lưu vào DB (bảo mật hơn)
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Trả về token gốc (để gửi mail) và token đã hash (để lưu)
  return { plainToken: token, hashedToken };
};

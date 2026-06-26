import mongoose from "mongoose";
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";

// Lấy môi trường từ file .env (đã được nạp bởi server.js)
const isProduction = process.env.NODE_ENV === "production";

/**
 * Hàm helper để thực hiện logic cộng tiền
 * (Để tránh lặp code)
 */
const performCredit = async (userId, amount, type, metadata, session) => {
  // 1. Cập nhật số dư của User (dùng $inc để đảm bảo an toàn)
  // 'session' sẽ là undefined nếu không ở production, và Mongoose sẽ tự bỏ qua nó
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { walletBalance: amount } },
    { new: true, session }
  );

  if (!user) {
    throw new Error("Không tìm thấy người dùng");
  }

  // 2. Tạo bản ghi giao dịch
  const transaction = new WalletTransaction({
    user: userId,
    amount,
    type,
    status: "success",
    metadata,
  });

  // Lưu transaction (cũng dùng session nếu có)
  await transaction.save({ session });

  return { user, transaction };
};

/**
 * Cộng tiền vào ví của người dùng (An toàn)
 * @param {string} userId - ID người dùng
 * @param {number} amount - Số tiền (phải > 0)
 *...
 */
export const credit = async (userId, amount, type, metadata = {}) => {
  if (amount <= 0) {
    throw new Error("Số tiền phải là số dương");
  }

  // CHỈ SỬ DỤNG TRANSACTION TRÊN PRODUCTION
  if (isProduction) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { user, transaction } = await performCredit(
        userId,
        amount,
        type,
        metadata,
        session
      );

      await session.commitTransaction();
      return { user, transaction };
    } catch (error) {
      await session.abortTransaction();
      console.error("Lỗi khi cộng tiền vào ví (Transaction):", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // KHI Ở DEVELOPMENT (localhost): Chạy mà không cần Transaction
  else {
    try {
      // 'session' (tham số cuối) là undefined, nên nó sẽ không được dùng
      const { user, transaction } = await performCredit(
        userId,
        amount,
        type,
        metadata,
        undefined
      );
      return { user, transaction };
    } catch (error) {
      console.error("Lỗi khi cộng tiền vào ví (Development):", error);
      throw error;
    }
  }
};

/**
 * Trừ tiền từ ví (Sẽ dùng nếu bạn muốn cho phép 'thanh toán bằng ví')
 * (Logic tương tự đã được áp dụng)
 */
export const debit = async (userId, amount, type, metadata = {}) => {
  if (amount <= 0) {
    throw new Error("Số tiền phải là số dương");
  }

  // CHỈ SỬ DỤNG TRANSACTION TRÊN PRODUCTION
  if (isProduction) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userId).session(session);
      if (!user) throw new Error("Không tìm thấy người dùng");
      if (user.walletBalance < amount) throw new Error("Số dư không đủ");

      user.walletBalance -= amount;
      await user.save({ session });

      const transaction = new WalletTransaction({
        user: userId,
        amount,
        type,
        status: "success",
        metadata,
      });
      await transaction.save({ session });

      await session.commitTransaction();
      return { user, transaction };
    } catch (error) {
      await session.abortTransaction();
      console.error("Lỗi khi trừ tiền ví (Transaction):", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // KHI Ở DEVELOPMENT (localhost):
  else {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error("Không tìm thấy người dùng");
      if (user.walletBalance < amount) throw new Error("Số dư không đủ");

      user.walletBalance -= amount;
      await user.save();

      const transaction = new WalletTransaction({
        user: userId,
        amount,
        type,
        status: "success",
        metadata,
      });
      await transaction.save();

      return { user, transaction };
    } catch (error) {
      console.error("Lỗi khi trừ tiền ví (Development):", error);
      throw error;
    }
  }
};

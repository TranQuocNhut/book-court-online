import OwnerBalance from "../models/OwnerBalance.js";
import mongoose from "mongoose";
import { getPlatformFee } from "./systemConfigService.js";

/**
 * Cộng tiền vào số dư của owner (khi có booking thanh toán)
 * @param {ObjectId} ownerId - ID của owner
 * @param {number} amount - Số tiền
 * @param {number} platformFee - Phí platform (0-1, ví dụ 0.1 = 10%). Nếu không truyền, sẽ lấy từ SystemConfig
 * @returns {Promise<object>} - OwnerBalance đã cập nhật
 */
export const creditOwnerBalance = async (ownerId, amount, platformFee = null) => {
  // Nếu không truyền platformFee, lấy từ SystemConfig
  if (platformFee === null) {
    platformFee = await getPlatformFee();
  }
  
  // Tính phí dịch vụ web thu được
  const platformFeeAmount = amount * platformFee;
  
  const ownerBalance = await OwnerBalance.findOneAndUpdate(
    { owner: ownerId },
    {
      $inc: {
        totalRevenue: amount,
        availableBalance: amount * (1 - platformFee), // Trừ phí platform
        totalPlatformFee: platformFeeAmount, // Cộng dồn phí dịch vụ web
      },
    },
    { upsert: true, new: true }
  );

  return ownerBalance;
};

/**
 * Trừ tiền từ số dư khả dụng (khi bắt đầu rút tiền - chưa chắc thành công)
 * KHÔNG cộng vào totalWithdrawn ở đây, chỉ cộng khi thành công
 * @param {ObjectId} ownerId - ID của owner
 * @param {number} amount - Số tiền
 * @returns {Promise<object>} - OwnerBalance đã cập nhật
 */
export const debitOwnerBalance = async (ownerId, amount) => {
  const ownerBalance = await OwnerBalance.findOne({ owner: ownerId });

  if (!ownerBalance) {
    throw new Error("Không tìm thấy số dư của owner");
  }

  if (ownerBalance.availableBalance < amount) {
    throw new Error("Số dư không đủ để rút tiền");
  }

  // CHỈ trừ availableBalance, KHÔNG cộng vào totalWithdrawn
  // totalWithdrawn chỉ được cộng khi rút tiền THÀNH CÔNG
  ownerBalance.availableBalance -= amount;
  await ownerBalance.save();

  return ownerBalance;
};

/**
 * Xác nhận rút tiền thành công (cộng vào totalWithdrawn)
 * @param {ObjectId} ownerId - ID của owner
 * @param {number} amount - Số tiền đã rút thành công
 * @returns {Promise<object>} - OwnerBalance đã cập nhật
 */
export const confirmWithdrawal = async (ownerId, amount) => {
  const ownerBalance = await OwnerBalance.findOne({ owner: ownerId });

  if (!ownerBalance) {
    throw new Error("Không tìm thấy số dư của owner");
  }

  // CHỈ cộng vào totalWithdrawn khi rút tiền thành công
  ownerBalance.totalWithdrawn += amount;
  await ownerBalance.save();

  return ownerBalance;
};

/**
 * Hoàn lại tiền cho owner (khi rút tiền thất bại)
 * KHÔNG cộng vào totalRevenue (vì đây không phải doanh thu mới)
 * @param {ObjectId} ownerId - ID của owner
 * @param {number} amount - Số tiền cần hoàn lại
 * @returns {Promise<object>} - OwnerBalance đã cập nhật
 */
export const refundOwnerBalance = async (ownerId, amount) => {
  const ownerBalance = await OwnerBalance.findOne({ owner: ownerId });

  if (!ownerBalance) {
    throw new Error("Không tìm thấy số dư của owner");
  }

  // CHỈ hoàn lại availableBalance, KHÔNG cộng vào totalRevenue
  ownerBalance.availableBalance += amount;
  await ownerBalance.save();

  return ownerBalance;
};

/**
 * Lấy số dư của owner
 * @param {ObjectId} ownerId - ID của owner
 * @returns {Promise<object>} - OwnerBalance
 */
export const getOwnerBalance = async (ownerId) => {
  let ownerBalance = await OwnerBalance.findOne({ owner: ownerId });

  if (!ownerBalance) {
    // Tạo mới nếu chưa có
    ownerBalance = new OwnerBalance({ owner: ownerId });
    await ownerBalance.save();
  }

  return ownerBalance;
};


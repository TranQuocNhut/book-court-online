/**
 * Script để đồng bộ lại số dư cho owner từ các booking đã thanh toán
 * Chạy script này để cộng lại tiền cho các booking đã thanh toán trước khi có logic cộng tiền
 * 
 * Usage: node backend/scripts/syncOwnerBalance.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import OwnerBalance from "../models/OwnerBalance.js";
import { creditOwnerBalance } from "../utils/ownerBalanceService.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dat-san-online";

async function syncOwnerBalance() {
  try {
    console.log("🔌 Đang kết nối MongoDB...");
    await mongoose.connect(MONGODB_URI);

    // 1. Lấy tất cả các Payment đã thành công
    const successfulPayments = await Payment.find({
      status: "success",
      booking: { $exists: true, $ne: null },
    }).populate({
      path: "booking",
      populate: {
        path: "facility",
        select: "owner",
      },
    });

    // 2. Lấy tất cả các booking đã thanh toán (để đảm bảo không bỏ sót)
    const paidBookings = await Booking.find({
      paymentStatus: "paid",
    }).populate("facility", "owner");


    // 3. Tạo map để tránh cộng trùng
    const processedBookings = new Set();
    const ownerStats = {};

    // Xử lý từ Payment
    for (const payment of successfulPayments) {
      if (!payment.booking || !payment.booking.facility) {
        continue;
      }

      const bookingId = payment.booking._id.toString();
      if (processedBookings.has(bookingId)) {
        continue;
      }

      const ownerId = payment.booking.facility.owner;
      if (!ownerId) {
        continue;
      }

      const ownerIdStr = ownerId._id ? ownerId._id.toString() : ownerId.toString();
      
      if (!ownerStats[ownerIdStr]) {
        ownerStats[ownerIdStr] = {
          totalAmount: 0,
          bookingCount: 0,
          bookings: [],
        };
      }

      ownerStats[ownerIdStr].totalAmount += payment.booking.totalAmount || payment.amount;
      ownerStats[ownerIdStr].bookingCount += 1;
      ownerStats[ownerIdStr].bookings.push(bookingId);
      processedBookings.add(bookingId);
    }

    // Xử lý từ Booking (nếu có booking paid nhưng không có payment record)
    for (const booking of paidBookings) {
      const bookingId = booking._id.toString();
      if (processedBookings.has(bookingId)) {
        continue;
      }

      if (!booking.facility || !booking.facility.owner) {
        continue;
      }

      const ownerId = booking.facility.owner;
      const ownerIdStr = ownerId._id ? ownerId._id.toString() : ownerId.toString();

      if (!ownerStats[ownerIdStr]) {
        ownerStats[ownerIdStr] = {
          totalAmount: 0,
          bookingCount: 0,
          bookings: [],
        };
      }

      ownerStats[ownerIdStr].totalAmount += booking.totalAmount;
      ownerStats[ownerIdStr].bookingCount += 1;
      ownerStats[ownerIdStr].bookings.push(bookingId);
      processedBookings.add(bookingId);
    }


    // 4. Cộng tiền cho từng owner
    let totalProcessed = 0;
    let totalAmount = 0;

    for (const [ownerId, stats] of Object.entries(ownerStats)) {
      try {
        // Kiểm tra xem đã có OwnerBalance chưa
        const existingBalance = await OwnerBalance.findOne({ owner: ownerId });
        
        if (existingBalance && existingBalance.totalRevenue >= stats.totalAmount * 0.9) {
          console.log(`⏭️  Owner ${ownerId} đã có số dư (${existingBalance.totalRevenue.toLocaleString("vi-VN")} VNĐ), bỏ qua`);
          continue;
        }

        // Lấy platformFee từ SystemConfig (hoặc dùng giá trị mặc định nếu có lỗi)
        const { getPlatformFee } = await import("../utils/systemConfigService.js");
        let platformFee = 0.1; // Fallback mặc định
        try {
          platformFee = await getPlatformFee();
        } catch (e) {
          console.warn("Không thể lấy platformFee từ SystemConfig, dùng giá trị mặc định 10%:", e);
        }
        await creditOwnerBalance(ownerId, stats.totalAmount);

        totalProcessed += stats.bookingCount;
        totalAmount += stats.totalAmount;
      } catch (error) {
        console.error(`❌ Lỗi khi cộng tiền cho owner ${ownerId}:`, error.message);
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Chạy script
syncOwnerBalance();


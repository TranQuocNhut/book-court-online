/**
 * Script để đồng bộ lại tổng phí dịch vụ web (totalPlatformFee) từ dữ liệu hiện có
 * Script này tính lại totalPlatformFee dựa trên totalRevenue và platformFee
 * 
 * Usage: node backend/scripts/syncPlatformFee.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import OwnerBalance from "../models/OwnerBalance.js";
import { getPlatformFee } from "../utils/systemConfigService.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dat-san-online";

async function syncPlatformFee() {
  try {
    console.log("🔌 Đang kết nối MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Đã kết nối MongoDB");

    // Lấy platformFee từ SystemConfig
    let platformFee = 0.1; // Fallback mặc định
    try {
      platformFee = await getPlatformFee();
      console.log(`📊 Phí dịch vụ hiện tại: ${(platformFee * 100).toFixed(1)}%`);
    } catch (e) {
      console.warn("⚠️  Không thể lấy platformFee từ SystemConfig, dùng giá trị mặc định 10%:", e.message);
    }

    // Lấy tất cả OwnerBalance
    const ownerBalances = await OwnerBalance.find({
      totalRevenue: { $gt: 0 }, // Chỉ xử lý owners có doanh thu
    });

    console.log(`\n📊 Tìm thấy ${ownerBalances.length} owner có doanh thu\n`);

    let totalUpdated = 0;
    let totalPlatformFeeCalculated = 0;

    // Tính lại totalPlatformFee cho từng owner
    for (const balance of ownerBalances) {
      try {
        // Tính phí dịch vụ dựa trên totalRevenue
        // Nếu owner có platformFee riêng, dùng nó; nếu không, dùng platformFee từ SystemConfig
        const feeRate = balance.platformFee || platformFee;
        const calculatedPlatformFee = balance.totalRevenue * feeRate;

        // Chỉ cập nhật nếu khác với giá trị hiện tại (tránh cập nhật không cần thiết)
        if (Math.abs(balance.totalPlatformFee - calculatedPlatformFee) > 0.01) {
          balance.totalPlatformFee = calculatedPlatformFee;
          await balance.save();

          totalUpdated++;
          totalPlatformFeeCalculated += calculatedPlatformFee;

          console.log(
            `✅ Owner ${balance.owner}: ` +
            `Doanh thu: ${balance.totalRevenue.toLocaleString("vi-VN")} VNĐ, ` +
            `Phí dịch vụ: ${calculatedPlatformFee.toLocaleString("vi-VN")} VNĐ (${(feeRate * 100).toFixed(1)}%)`
          );
        } else {
          totalPlatformFeeCalculated += balance.totalPlatformFee;
          console.log(
            `⏭️  Owner ${balance.owner}: Đã đúng, không cần cập nhật ` +
            `(Phí: ${balance.totalPlatformFee.toLocaleString("vi-VN")} VNĐ)`
          );
        }
      } catch (error) {
        console.error(`❌ Lỗi khi xử lý owner ${balance.owner}:`, error.message);
      }
    }

    // Tính tổng phí dịch vụ từ tất cả owners
    const totalStats = await OwnerBalance.aggregate([
      {
        $group: {
          _id: null,
          totalPlatformFee: { $sum: "$totalPlatformFee" },
          totalRevenue: { $sum: "$totalRevenue" },
        },
      },
    ]);

    const stats = totalStats[0] || { totalPlatformFee: 0, totalRevenue: 0 };

    console.log(`\n🎉 Hoàn thành!`);
    console.log(`   - Đã cập nhật: ${totalUpdated} owner(s)`);
    console.log(`   - Tổng phí dịch vụ: ${stats.totalPlatformFee.toLocaleString("vi-VN")} VNĐ`);
    console.log(`   - Tổng doanh thu: ${stats.totalRevenue.toLocaleString("vi-VN")} VNĐ`);
    console.log(
      `   - Tỷ lệ phí trung bình: ${stats.totalRevenue > 0 ? ((stats.totalPlatformFee / stats.totalRevenue) * 100).toFixed(2) : 0}%`
    );

    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Chạy script
syncPlatformFee();


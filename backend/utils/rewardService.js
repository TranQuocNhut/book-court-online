import User from "../models/User.js";
import LoyaltyTransaction from "../models/LoyaltyTransaction.js";
import Referral from "../models/Referral.js";
import Notification from "../models/Notification.js";
import { emitToUser } from "../socket/index.js";

export const processBookingRewards = async (booking) => {
  try {
    console.log(`🎁 Processing rewards for booking ${booking.bookingCode}...`);

    // 1. Tính điểm thưởng cho User đặt sân (Ví dụ: 1% giá trị đơn hàng = 1 điểm cho mỗi 1000đ)
    // Làm tròn xuống
    const pointsEarned = Math.floor(booking.totalAmount * 0.001);

    if (pointsEarned > 0) {
      // Cập nhật User
      await User.findByIdAndUpdate(booking.user, {
        $inc: {
          loyaltyPoints: pointsEarned,
          lifetimePoints: pointsEarned,
        },
      });

      // Lưu lịch sử Loyalty
      await LoyaltyTransaction.create({
        user: booking.user,
        type: "EARN",
        amount: pointsEarned,
        description: `Tích điểm từ đơn hàng ${
          booking.bookingCode || "Booking"
        }`,
        source: { sourceType: "Booking", sourceId: booking._id },
      });

      // Bắn thông báo Socket cho User
      emitToUser(booking.user.toString(), "loyalty:update", {
        pointsAdded: pointsEarned,
        message: `Bạn nhận được ${pointsEarned} điểm thưởng!`,
      });
    }

    // 2. Xử lý Referral (Chỉ thưởng nếu đây là đơn hoàn thành ĐẦU TIÊN của người này)
    // Kiểm tra xem user này đã từng có referral pending nào chưa
    const referral = await Referral.findOne({
      referee: booking.user,
      status: "PENDING",
    });

    if (referral) {
      console.log(
        `🔗 Found pending referral for user ${booking.user}. Processing...`
      );

      const REWARD_AMOUNT = 500; // Thưởng 500 điểm cho người giới thiệu

      // Cập nhật trạng thái Referral
      referral.status = "COMPLETED";
      referral.completedAt = new Date();
      referral.rewardEarned = REWARD_AMOUNT;
      await referral.save();

      // Cộng điểm cho người giới thiệu (Referrer)
      const referrer = await User.findByIdAndUpdate(referral.referrer, {
        $inc: {
          loyaltyPoints: REWARD_AMOUNT,
          lifetimePoints: REWARD_AMOUNT,
        },
      });

      if (referrer) {
        // Lưu lịch sử Loyalty cho người giới thiệu
        await LoyaltyTransaction.create({
          user: referrer._id,
          type: "EARN",
          amount: REWARD_AMOUNT,
          description: `Thưởng giới thiệu bạn bè thành công`,
          source: { sourceType: "Referral", sourceId: referral._id },
        });

        // Gửi thông báo cho người giới thiệu
        await Notification.create({
          user: referrer._id,
          type: "promotion", // Hoặc loại 'system'
          title: "Nhận thưởng giới thiệu",
          message: `Bạn nhận được ${REWARD_AMOUNT} điểm vì bạn bè của bạn đã đặt sân lần đầu!`,
          isRead: false,
          priority: "high",
        });

        emitToUser(referrer._id.toString(), "notification:new", {
          title: "Nhận thưởng giới thiệu",
          message: `Bạn nhận được ${REWARD_AMOUNT} điểm!`,
        });
      }
    }
  } catch (error) {
    console.error("❌ Error processing booking rewards:", error);
    // Không throw error để tránh làm rollback giao dịch thanh toán chính
  }
};

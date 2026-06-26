// Background job để tự động hủy booking chưa được xác nhận trước 15 phút vào sân
import Booking from "../models/Booking.js";
import { emitToFacility, emitToUser } from "../socket/index.js";
import { createNotification } from "../utils/notificationService.js";

const CONFIRMATION_DEADLINE_MINUTES = 15; // 15 phút trước khi vào sân

/**
 * Tự động hủy các booking chưa được xác nhận trước 15 phút vào sân
 * Chạy định kỳ mỗi phút để check và hủy các booking pending/pending_payment
 */
export async function cancelUnconfirmedBookings() {
  try {
    const now = new Date();
    
    // Tìm các booking đang pending hoặc pending_payment (chưa được xác nhận)
    const unconfirmedBookings = await Booking.find({
      status: { $in: ["pending", "pending_payment", "hold"] },
      paymentStatus: { $ne: "paid" }, // Chưa thanh toán
    })
      .populate("user", "name email")
      .populate("facility", "name")
      .populate("court", "name");

    if (unconfirmedBookings.length === 0) {
      return { cancelled: 0, message: "No unconfirmed bookings to cancel" };
    }

    const cancelledIds = [];
    const facilityUpdates = new Map(); // Track facility updates for socket events

    for (const booking of unconfirmedBookings) {
      // Lấy khung giờ đầu tiên để tính thời gian bắt đầu vào sân
      if (!booking.timeSlots || booking.timeSlots.length === 0) {
        continue; // Skip nếu không có timeSlots
      }

      const firstTimeSlot = booking.timeSlots[0]; // Ví dụ: "18:00-19:00"
      const [startTime] = firstTimeSlot.split("-"); // "18:00"
      const [startHour, startMinute] = startTime.split(":").map(Number);

      // Tạo Date object cho thời gian bắt đầu vào sân
      const bookingDate = new Date(booking.date);
      bookingDate.setHours(0, 0, 0, 0); // Reset time to start of day
      
      const bookingStartTime = new Date(bookingDate);
      bookingStartTime.setHours(startHour, startMinute, 0, 0);

      // Tính thời gian deadline (15 phút trước khi vào sân)
      const deadlineTime = new Date(bookingStartTime.getTime() - CONFIRMATION_DEADLINE_MINUTES * 60 * 1000);

      // Nếu thời gian hiện tại đã vượt quá deadline → hủy booking
      if (now >= deadlineTime) {
        // Update status to cancelled
        booking.status = "cancelled";
        booking.cancelledAt = new Date();
        booking.cancellationReason = `Tự động hủy do không xác nhận trước ${CONFIRMATION_DEADLINE_MINUTES} phút vào sân`;
        await booking.save();

        cancelledIds.push(booking._id);

        // Track facility updates for socket events
        const facilityId = booking.facility?._id?.toString() || booking.facility?.toString();
        if (facilityId) {
          if (!facilityUpdates.has(facilityId)) {
            facilityUpdates.set(facilityId, {
              facilityId,
              courtId: booking.court?._id?.toString() || booking.court?.toString(),
              date: booking.date,
              timeSlots: [],
            });
          }
          facilityUpdates.get(facilityId).timeSlots.push(...booking.timeSlots);
        }

        // Emit socket event to user
        const userId = booking.user?._id?.toString() || booking.user?.toString();
        if (userId) {
          emitToUser(userId, "booking:cancelled", {
            bookingId: booking._id.toString(),
            bookingCode: booking.bookingCode,
            reason: booking.cancellationReason,
            message: "Đơn đặt sân đã bị tự động hủy do không xác nhận trước 15 phút vào sân",
          });
        }

        // Create notification for user
        await createNotification({
          userId,
          type: "cancellation",
          title: "Đơn đặt sân đã bị tự động hủy",
          message: `Đơn đặt sân ${
            booking.bookingCode || booking._id.toString().slice(-8).toUpperCase()
          } tại ${booking.facility?.name || "sân"} đã bị tự động hủy do không được xác nhận trước ${CONFIRMATION_DEADLINE_MINUTES} phút vào sân.`,
          metadata: {
            bookingId: booking._id.toString(),
            bookingCode: booking.bookingCode,
            facilityId,
            cancellationReason: booking.cancellationReason,
          },
          priority: "high",
        });

        // Emit socket event to facility
        if (facilityId) {
          emitToFacility(facilityId, "booking:slot:cancelled", {
            bookingId: booking._id.toString(),
            facilityId,
            courtId: booking.court?._id?.toString() || booking.court?.toString(),
            date: booking.date,
            timeSlots: booking.timeSlots,
            reason: "auto_cancelled",
          });
        }
      }
    }

    // Emit socket events for each facility
    for (const [facilityId, updateData] of facilityUpdates.entries()) {
      emitToFacility(facilityId, "booking:auto_cancelled", {
        ...updateData,
        cancelledCount: cancelledIds.filter((id) => {
          const booking = unconfirmedBookings.find((b) => b._id.toString() === id.toString());
          return (
            booking &&
            (booking.facility?._id?.toString() || booking.facility?.toString()) === facilityId
          );
        }).length,
      });
    }

    if (cancelledIds.length > 0) {
      console.log(
        `[Booking Auto Cancel] Cancelled ${cancelledIds.length} unconfirmed bookings:`,
        cancelledIds
      );
    }

    return {
      cancelled: cancelledIds.length,
      ids: cancelledIds,
      message: `Cancelled ${cancelledIds.length} unconfirmed bookings`,
    };
  } catch (error) {
    console.error("[Booking Auto Cancel] Error cancelling unconfirmed bookings:", error);
    throw error;
  }
}

/**
 * Start the auto-cancel job
 * Chạy mỗi phút để check và hủy các booking chưa được xác nhận
 */
export function startBookingAutoCancelJob() {
  // Chạy ngay lập tức lần đầu
  cancelUnconfirmedBookings().catch((error) => {
    console.error("[Booking Auto Cancel] Initial run error:", error);
  });

  // Sau đó chạy mỗi phút
  const interval = setInterval(() => {
    cancelUnconfirmedBookings().catch((error) => {
      console.error("[Booking Auto Cancel] Interval run error:", error);
    });
  }, 60 * 1000); // 60 seconds = 1 minute

  console.log(
    `[Booking Auto Cancel] Job started - running every 60 seconds (cancels bookings not confirmed ${CONFIRMATION_DEADLINE_MINUTES} minutes before start time)`
  );

  // Return cleanup function
  return () => {
    clearInterval(interval);
    console.log("[Booking Auto Cancel] Job stopped");
  };
}


// Background job để tự động expire reservations hết hạn
import Booking from "../models/Booking.js";
import { emitToFacility } from "../socket/index.js";

/**
 * Expire reservations đã hết hạn thanh toán
 * Chạy định kỳ mỗi phút để check và expire các booking pending_payment/hold đã quá holdUntil
 */
export async function expireReservations() {
  try {
    const now = new Date();
    
    // Tìm các booking đang pending_payment hoặc hold và đã quá holdUntil
    const expiredReservations = await Booking.find({
      status: { $in: ["pending_payment", "hold"] },
      holdUntil: { $lt: now },
    }).populate("facility", "name").populate("court", "name");

    if (expiredReservations.length === 0) {
      return { expired: 0, message: "No reservations to expire" };
    }

    const expiredIds = [];
    const facilityUpdates = new Map(); // Track facility updates for socket events

    for (const reservation of expiredReservations) {
      // Update status to expired
      reservation.status = "expired";
      reservation.cancelledAt = new Date();
      reservation.cancellationReason = "Hết hạn thanh toán";
      await reservation.save();

      expiredIds.push(reservation._id);

      // Track facility updates for socket events
      const facilityId = reservation.facility?._id?.toString() || reservation.facility?.toString();
      if (facilityId) {
        if (!facilityUpdates.has(facilityId)) {
          facilityUpdates.set(facilityId, {
            facilityId,
            courtId: reservation.court?._id?.toString() || reservation.court?.toString(),
            date: reservation.date,
            timeSlots: [],
          });
        }
        facilityUpdates.get(facilityId).timeSlots.push(...reservation.timeSlots);
      }
    }

    // Emit socket events for each facility
    for (const [facilityId, updateData] of facilityUpdates.entries()) {
      emitToFacility(facilityId, "reservation:expired", {
        ...updateData,
        expiredCount: expiredReservations.filter(
          (r) =>
            (r.facility?._id?.toString() || r.facility?.toString()) === facilityId
        ).length,
      });
    }

    console.log(
      `[Reservation Expiry] Expired ${expiredReservations.length} reservations:`,
      expiredIds
    );

    return {
      expired: expiredReservations.length,
      ids: expiredIds,
      message: `Expired ${expiredReservations.length} reservations`,
    };
  } catch (error) {
    console.error("[Reservation Expiry] Error expiring reservations:", error);
    throw error;
  }
}

/**
 * Start the expiry job
 * Chạy mỗi phút để check và expire reservations
 */
export function startReservationExpiryJob() {
  // Chạy ngay lập tức lần đầu
  expireReservations().catch((error) => {
    console.error("[Reservation Expiry] Initial run error:", error);
  });

  // Sau đó chạy mỗi phút
  const interval = setInterval(() => {
    expireReservations().catch((error) => {
      console.error("[Reservation Expiry] Interval run error:", error);
    });
  }, 60 * 1000); // 60 seconds = 1 minute

  console.log("[Reservation Expiry] Job started - running every 60 seconds");

  // Return cleanup function
  return () => {
    clearInterval(interval);
    console.log("[Reservation Expiry] Job stopped");
  };
}


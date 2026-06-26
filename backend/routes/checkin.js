import express from "express";
import Booking from "../models/Booking.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

/**
 * POST /api/checkin/:bookingId
 * Check-in booking (owner hoặc admin)
 */
router.post("/:bookingId", authenticateToken, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate({
      path: "facility",
      select: "owner",
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Không tìm thấy booking" });
    }

    // Xác thực quyền: chủ cơ sở hoặc admin
    let facilityOwnerId = null;
    if (booking.facility && booking.facility.owner) {
      facilityOwnerId = booking.facility.owner._id
        ? booking.facility.owner._id.toString()
        : booking.facility.owner.toString();
    }
    const isFacilityOwner = facilityOwnerId === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isFacilityOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền check-in cho booking này" });
    }

    // Không cho check-in nếu đã hủy hoặc đã hoàn tất
    if (booking.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Booking đã bị hủy" });
    }
    if (booking.status === "completed") {
      return res.status(400).json({ success: false, message: "Booking đã hoàn tất" });
    }
    if (!(booking.paymentStatus === "paid" || booking.status === "confirmed")) {
      return res.status(400).json({ success: false, message: "Booking chưa đủ điều kiện check-in (cần paid hoặc confirmed)" });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDay = new Date(booking.date);
    bookingDay.setHours(0, 0, 0, 0);
    if (bookingDay > today) {
      return res.status(400).json({ success: false, message: "Chưa đến ngày check-in" });
    }
    booking.checkedInAt = new Date();
    booking.checkedInBy = req.user._id;
    booking.status = "completed";
    await booking.save();
    return res.json({ success: true, message: "Check-in thành công", data: booking });
  } catch (error) {
    next(error);
  }
});

export default router;

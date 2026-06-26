import asyncHandler from "express-async-handler";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";
import Court from "../models/Court.js";
import User from "../models/User.js";
import Facility from "../models/Facility.js";
import OwnerBalance from "../models/OwnerBalance.js";
import mongoose from "mongoose";

/**
 * Hàm helper: Lấy khoảng thời gian (startDate, endDate) dựa trên 'period'
 */
const getPeriodDates = (period) => {
  const now = new Date();
  let startDate,
    endDate = new Date(now); // endDate là hiện tại

  // Đặt endDate về cuối ngày (23:59:59.999)
  endDate.setHours(23, 59, 59, 999);

  switch (period) {
    case "day":
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0); // Bắt đầu từ 00:00 hôm nay
      break;
    case "week":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7); // 7 ngày trước
      startDate.setHours(0, 0, 0, 0);
      break;
    case "month":
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Ngày đầu tiên của tháng này
      startDate.setHours(0, 0, 0, 0);
      break;
  }
  return { startDate, endDate };
};

/**
 * Helper: Định dạng ngày từ query params (nếu có)
 */
const parseDateRange = (startDateStr, endDateStr) => {
  const startDate = startDateStr
    ? new Date(startDateStr)
    : new Date(new Date().setHours(0, 0, 0, 0));
  if (!isNaN(startDate.getTime())) {
    startDate.setHours(0, 0, 0, 0);
  }

  const endDate = endDateStr ? new Date(endDateStr) : new Date();
  if (!isNaN(endDate.getTime())) {
    endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
};

// --- API FUNCTIONS ---

/**
 * API 1: GET /api/analytics/owner/dashboard
 * Thống kê tổng quan (Dashboard)
 */
export const getOwnerDashboard = asyncHandler(async (req, res) => {
  // req.facilityId đã được validate bởi middleware
  const facilityId = req.facilityId;
  const { period = "month" } = req.query;
  const { startDate, endDate } = getPeriodDates(period);

  const facilityObjectId = new mongoose.Types.ObjectId(facilityId);

  // 1. Tổng doanh thu & Tổng booking (ĐÃ THANH TOÁN) trong kỳ
  // Chúng ta sẽ tính dựa trên 'date' (ngày đặt sân), không phải 'createdAt'
  const revenueStats = await Booking.aggregate([
    {
      $match: {
        facility: facilityObjectId,
        paymentStatus: "paid",
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        totalBookings: { $sum: 1 },
      },
    },
  ]);

  // 2. Tổng booking đang chờ (PENDING) - (tất cả, không theo kỳ)
  const pendingBookings = await Booking.countDocuments({
    facility: facilityObjectId,
    status: "pending",
  });

  // 3. Đánh giá mới & Rating trung bình
  const reviewStats = await Review.aggregate([
    {
      $match: { facility: facilityObjectId, isDeleted: false },
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" },
        newReviews: {
          $sum: {
            $cond: [{ $gte: ["$createdAt", startDate] }, 1, 0],
          },
        },
      },
    },
  ]);

  // 4. Dữ liệu biểu đồ doanh thu (theo ngày)
  const revenueChart = await Booking.aggregate([
    {
      $match: {
        facility: facilityObjectId,
        paymentStatus: "paid",
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        dailyRevenue: { $sum: "$totalAmount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    data: {
      period,
      totalRevenue: revenueStats[0]?.totalRevenue || 0,
      totalBookings: revenueStats[0]?.totalBookings || 0,
      pendingBookings,
      averageRating: reviewStats[0]?.averageRating
        ? Math.round(reviewStats[0].averageRating * 10) / 10
        : 0,
      totalReviews: reviewStats[0]?.totalReviews || 0,
      newReviews: reviewStats[0]?.newReviews || 0,
      revenueChart,
    },
  });
});

/**
 * API 2: GET /api/analytics/owner/revenue
 * Thống kê doanh thu theo khoảng thời gian
 */
export const getOwnerRevenue = asyncHandler(async (req, res) => {
  const facilityId = req.facilityId;
  const { startDate, endDate } = parseDateRange(
    req.query.startDate,
    req.query.endDate
  );
  const facilityObjectId = new mongoose.Types.ObjectId(facilityId);

  // Phân nhóm doanh thu theo ngày
  const revenueByDay = await Booking.aggregate([
    {
      $match: {
        facility: facilityObjectId,
        paymentStatus: "paid",
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        total: { $sum: "$totalAmount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Tính tổng
  const totalRevenue = revenueByDay.reduce((acc, day) => acc + day.total, 0);
  const totalBookings = revenueByDay.reduce((acc, day) => acc + day.count, 0);

  res.json({
    success: true,
    data: {
      startDate,
      endDate,
      totalRevenue,
      totalBookings,
      dailyData: revenueByDay,
    },
  });
});

/**
 * API 3: GET /api/analytics/owner/bookings
 * Thống kê booking (theo status, theo ngày)
 */
export const getOwnerBookings = asyncHandler(async (req, res) => {
  const facilityId = req.facilityId;
  const { startDate, endDate } = parseDateRange(
    req.query.startDate,
    req.query.endDate
  );
  const facilityObjectId = new mongoose.Types.ObjectId(facilityId);

  // 1. Thống kê theo status
  const bookingsByStatus = Booking.aggregate([
    {
      $match: {
        facility: facilityObjectId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // 2. Thống kê theo ngày (tất cả status)
  const bookingsByDay = Booking.aggregate([
    {
      $match: {
        facility: facilityObjectId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Thực thi song song 2 query
  const [statusStats, dayStats] = await Promise.all([
    bookingsByStatus,
    bookingsByDay,
  ]);

  res.json({
    success: true,
    data: {
      startDate,
      endDate,
      statusStats: statusStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      dayStats,
    },
  });
});

/**
 * API 4: GET /api/analytics/owner/courts
 * Thống kê từng sân: lượt đặt, doanh thu, tỷ lệ lấp đầy
 */
export const getOwnerCourts = asyncHandler(async (req, res) => {
  const facilityId = req.facilityId;
  const { startDate, endDate } = parseDateRange(
    req.query.startDate,
    req.query.endDate
  );
  const facilityObjectId = new mongoose.Types.ObjectId(facilityId);

  // 1. Lấy facility để có operatingHours
  const facility = await Facility.findById(facilityId).select("operatingHours");

  // 2. Lấy thông tin các sân
  const courts = await Court.find({ facility: facilityId }).lean();

  // 3. Tính tổng số slots có thể đặt trong khoảng thời gian
  const calculateAvailableSlots = (startDate, endDate, operatingHours) => {
    let totalSlots = 0;
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      const dayName = dayNames[dayOfWeek];
      const dayHours = operatingHours?.[dayName];

      if (dayHours && dayHours.isOpen) {
        const [openHour, openMin] = (dayHours.open || "06:00")
          .split(":")
          .map(Number);
        const [closeHour, closeMin] = (dayHours.close || "22:00")
          .split(":")
          .map(Number);

        const openMinutes = openHour * 60 + openMin;
        const closeMinutes = closeHour * 60 + closeMin;

        // Mỗi slot là 1 giờ (60 phút)
        const slotsPerDay = Math.floor((closeMinutes - openMinutes) / 60);
        totalSlots += slotsPerDay;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return totalSlots;
  };

  // 4. Lấy thống kê booking với tổng số time slots (chỉ tính booking đã thanh toán trong khoảng thời gian)
  const courtStats = await Booking.aggregate([
    {
      $match: {
        facility: facilityObjectId,
        paymentStatus: "paid",
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$court", // Nhóm theo courtId
        totalRevenue: { $sum: "$totalAmount" },
        totalBookings: { $sum: 1 },
        totalTimeSlots: { $sum: { $size: "$timeSlots" } }, // Tổng số time slots đã đặt
      },
    },
  ]);

  // 5. Tính tổng slots có thể đặt
  const totalAvailableSlots = calculateAvailableSlots(
    startDate,
    endDate,
    facility?.operatingHours
  );

  // 6. Map (ánh xạ) thống kê vào danh sách sân
  const statsMap = new Map(
    courtStats.map((stat) => [stat._id.toString(), stat])
  );

  const courtsWithStats = courts.map((court) => {
    const stats = statsMap.get(court._id.toString());
    const bookedSlots = stats?.totalTimeSlots || 0;

    // Tính tỷ lệ lấp đầy
    const occupancyRate =
      totalAvailableSlots > 0
        ? ((bookedSlots / totalAvailableSlots) * 100).toFixed(1)
        : 0;

    return {
      ...court,
      totalRevenue: stats?.totalRevenue || 0,
      totalBookings: stats?.totalBookings || 0,
      totalTimeSlots: bookedSlots,
      availableSlots: totalAvailableSlots,
      occupancyRate: parseFloat(occupancyRate),
    };
  });

  res.json({
    success: true,
    data: courtsWithStats,
  });
});

/**
 * API 5: GET /api/analytics/owner/peak-hours
 * Thống kê giờ cao điểm (theo timeSlots)
 */
export const getOwnerPeakHours = asyncHandler(async (req, res) => {
  const facilityId = req.facilityId;
  const { startDate, endDate } = parseDateRange(
    req.query.startDate,
    req.query.endDate
  );
  const facilityObjectId = new mongoose.Types.ObjectId(facilityId);

  // Lấy tất cả bookings đã thanh toán trong khoảng thời gian
  const bookings = await Booking.find({
    facility: facilityObjectId,
    paymentStatus: "paid",
    date: { $gte: startDate, $lte: endDate },
  }).select("timeSlots totalAmount");

  // Phân tích theo giờ (từ timeSlots)
  const hourStats = {};

  bookings.forEach((booking) => {
    booking.timeSlots.forEach((slot) => {
      // Parse time slot: "18:00-19:00" -> lấy giờ bắt đầu "18:00"
      const [startTime] = slot.split("-");
      // startTime đã có format "HH:MM", ta chỉ cần lấy phần giờ và thêm ":00"
      // Ví dụ: "18:00" -> "18:00", "08:00" -> "08:00"
      const hourKey = startTime.trim(); // startTime đã là "HH:MM" format

      if (!hourStats[hourKey]) {
        hourStats[hourKey] = {
          hour: hourKey,
          slotCount: 0, // Số lượng time slots đã đặt trong giờ này
          revenue: 0,
        };
      }

      // Tính revenue cho slot này (chia đều totalAmount cho số slots)
      const revenuePerSlot = booking.totalAmount / booking.timeSlots.length;
      hourStats[hourKey].slotCount += 1;
      hourStats[hourKey].revenue += revenuePerSlot;
    });
  });

  // Chuyển đổi thành array và sắp xếp theo giờ
  const peakHoursData = Object.values(hourStats)
    .sort((a, b) => a.hour.localeCompare(b.hour))
    .map((stat) => ({
      hour: stat.hour,
      bookings: stat.slotCount, // Số lượng time slots đã đặt trong giờ này
      revenue: Math.round(stat.revenue),
      type:
        stat.slotCount >= 10
          ? "Cao điểm"
          : stat.slotCount >= 5
          ? "Trung bình"
          : "Thấp điểm",
    }));

  res.json({
    success: true,
    data: {
      startDate,
      endDate,
      peakHours: peakHoursData,
    },
  });
});

/**
 * API 6: GET /api/analytics/owner/loyal-customers
 * Thống kê khách hàng trung thành
 */
export const getOwnerLoyalCustomers = asyncHandler(async (req, res) => {
  const facilityId = req.facilityId;
  const facilityObjectId = new mongoose.Types.ObjectId(facilityId);

  // Thống kê theo user (chỉ tính booking đã thanh toán)
  const customerStats = await Booking.aggregate([
    {
      $match: {
        facility: facilityObjectId,
        paymentStatus: "paid",
      },
    },
    {
      $group: {
        _id: "$user",
        totalBookings: { $sum: 1 },
        totalSpent: { $sum: "$totalAmount" },
        lastBooking: { $max: "$date" },
      },
    },
    {
      $sort: { totalSpent: -1 },
    },
    {
      $limit: 20, // Top 20 khách hàng
    },
  ]);

  // Populate user info
  const loyalCustomers = await Promise.all(
    customerStats.map(async (stat) => {
      const user = await User.findById(stat._id).select("name email phone");

      // Tính loyalty score (dựa trên số lần đặt và tổng chi tiêu)
      const bookingScore = Math.min(stat.totalBookings * 10, 50); // Max 50 điểm
      const spendingScore = Math.min((stat.totalSpent / 1000000) * 10, 50); // Max 50 điểm
      const loyaltyScore = Math.round(bookingScore + spendingScore);

      // Xác định tier
      let tier = "Silver";
      if (loyaltyScore >= 80) tier = "VIP";
      else if (loyaltyScore >= 60) tier = "Gold";

      return {
        customer: user?.name || "Khách vãng lai",
        email: user?.email || "",
        phone: user?.phone || "",
        totalBookings: stat.totalBookings,
        totalSpent: stat.totalSpent,
        lastBooking: stat.lastBooking,
        loyaltyScore,
        tier,
      };
    })
  );

  res.json({
    success: true,
    data: loyalCustomers,
  });
});

/**
 * API 7: GET /api/analytics/owner/cancellations
 * Thống kê tỷ lệ hủy theo sân
 */
export const getOwnerCancellations = asyncHandler(async (req, res) => {
  const facilityId = req.facilityId;
  const { startDate, endDate } = parseDateRange(
    req.query.startDate,
    req.query.endDate
  );
  const facilityObjectId = new mongoose.Types.ObjectId(facilityId);

  // Lấy thông tin các sân
  const courts = await Court.find({ facility: facilityId }).lean();

  // Thống kê booking theo court và status
  const cancellationStats = await Booking.aggregate([
    {
      $match: {
        facility: facilityObjectId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          court: "$court",
          status: "$status",
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // Tính tỷ lệ hủy cho từng sân
  const courtCancellationMap = new Map();

  cancellationStats.forEach((stat) => {
    const courtId = stat._id.court.toString();
    if (!courtCancellationMap.has(courtId)) {
      courtCancellationMap.set(courtId, {
        totalBookings: 0,
        cancelled: 0,
        noShow: 0, // Có thể thêm logic để detect no-show
      });
    }

    const stats = courtCancellationMap.get(courtId);
    stats.totalBookings += stat.count;

    if (stat._id.status === "cancelled") {
      stats.cancelled += stat.count;
    }
    // Có thể thêm logic để detect no-show (ví dụ: booking confirmed nhưng không đến)
  });

  // Map vào danh sách sân
  const cancellationData = courts.map((court) => {
    const stats = courtCancellationMap.get(court._id.toString()) || {
      totalBookings: 0,
      cancelled: 0,
      noShow: 0,
    };

    const cancellationRate =
      stats.totalBookings > 0
        ? ((stats.cancelled / stats.totalBookings) * 100).toFixed(1)
        : 0;

    const noShowRate =
      stats.totalBookings > 0
        ? ((stats.noShow / stats.totalBookings) * 100).toFixed(1)
        : 0;

    let status = "Tốt";
    if (parseFloat(cancellationRate) > 20) status = "Cần cải thiện";
    else if (parseFloat(cancellationRate) > 10) status = "Trung bình";

    return {
      court: court.name || `Sân ${court.courtNumber || ""}`,
      totalBookings: stats.totalBookings,
      cancelled: stats.cancelled,
      noShow: stats.noShow,
      cancellationRate: parseFloat(cancellationRate),
      noShowRate: parseFloat(noShowRate),
      status,
    };
  });

  res.json({
    success: true,
    data: {
      startDate,
      endDate,
      cancellations: cancellationData,
    },
  });
});

/**
 * API 8: GET /api/analytics/owner/today-schedule
 * Lịch sân hôm nay (theo time slots)
 */
export const getOwnerTodaySchedule = asyncHandler(async (req, res) => {
  const facilityId = req.facilityId;
  const facilityObjectId = new mongoose.Types.ObjectId(facilityId);

  // Lấy ngày hôm nay (00:00:00 - 23:59:59)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Lấy facility để có operatingHours
  const facility = await Facility.findById(facilityId).select("operatingHours");

  // Lấy tất cả bookings hôm nay (pending, confirmed, completed)
  const todayBookings = await Booking.find({
    facility: facilityObjectId,
    date: { $gte: today, $lt: tomorrow },
    status: { $in: ["pending", "confirmed", "completed"] },
  })
    .populate("court", "name courtNumber")
    .populate("user", "name")
    .select("timeSlots court user contactInfo status");

  // Lấy operating hours hôm nay
  const dayOfWeek = today.getDay();
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayName = dayNames[dayOfWeek];
  const dayOperatingHours = facility?.operatingHours?.[dayName];

  // Tạo map để track các time slots đã được đặt
  const scheduleMap = new Map();

  // Nếu facility có operating hours, tạo tất cả slots có thể
  if (dayOperatingHours && dayOperatingHours.isOpen) {
    const openTime = dayOperatingHours.open || "06:00";
    const closeTime = dayOperatingHours.close || "22:00";

    const [openHour, openMin] = openTime.split(":").map(Number);
    const [closeHour, closeMin] = closeTime.split(":").map(Number);

    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    // Tạo tất cả slots có thể
    let currentMinutes = openMinutes;
    while (currentMinutes < closeMinutes) {
      const currentHour = Math.floor(currentMinutes / 60);
      const currentMin = currentMinutes % 60;
      const nextMinutes = currentMinutes + 60;

      if (nextMinutes > closeMinutes) break;

      const startTime = `${String(currentHour).padStart(2, "0")}:${String(
        currentMin
      ).padStart(2, "0")}`;
      const nextHour = Math.floor(nextMinutes / 60);
      const nextMin = nextMinutes % 60;
      const endTime = `${String(nextHour).padStart(2, "0")}:${String(
        nextMin
      ).padStart(2, "0")}`;

      scheduleMap.set(startTime, {
        time: startTime,
        status: "available",
        customer: null,
        court: null,
      });

      currentMinutes = nextMinutes;
    }
  }

  // Cập nhật schedule với các booking thực tế
  todayBookings.forEach((booking) => {
    booking.timeSlots.forEach((slot) => {
      // Parse slot: "18:00-19:00" -> lấy startTime "18:00"
      const [startTime] = slot.split("-");
      const timeKey = startTime.trim();

      if (scheduleMap.has(timeKey)) {
        // Cập nhật slot đã đặt
        scheduleMap.set(timeKey, {
          time: timeKey,
          status: "booked",
          customer:
            booking.user?.name || booking.contactInfo?.name || "Khách vãng lai",
          court:
            booking.court?.name || `Sân ${booking.court?.courtNumber || ""}`,
        });
      } else {
        // Thêm slot mới nếu không có trong operating hours
        scheduleMap.set(timeKey, {
          time: timeKey,
          status: "booked",
          customer:
            booking.user?.name || booking.contactInfo?.name || "Khách vãng lai",
          court:
            booking.court?.name || `Sân ${booking.court?.courtNumber || ""}`,
        });
      }
    });
  });

  // Chuyển thành array và sắp xếp theo giờ
  const schedule = Array.from(scheduleMap.values()).sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  res.json({
    success: true,
    data: {
      date: today,
      schedule,
    },
  });
});

/**
 * API: GET /api/analytics/admin/platform-fee
 * Thống kê tổng phí dịch vụ web đã thu được (Admin only)
 */
export const getAdminPlatformFee = asyncHandler(async (req, res) => {
  // Tính tổng phí dịch vụ từ tất cả owners
  const platformFeeStats = await OwnerBalance.aggregate([
    {
      $group: {
        _id: null,
        totalPlatformFee: { $sum: "$totalPlatformFee" },
        totalRevenue: { $sum: "$totalRevenue" },
        totalOwners: { $sum: 1 },
      },
    },
  ]);

  // Lấy chi tiết phí dịch vụ theo từng owner
  const ownerFeeDetails = await OwnerBalance.aggregate([
    {
      $match: {
        totalPlatformFee: { $gt: 0 }, // Chỉ lấy owners có phí dịch vụ
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerInfo",
      },
    },
    {
      $unwind: {
        path: "$ownerInfo",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        ownerId: "$owner",
        ownerName: "$ownerInfo.name",
        ownerEmail: "$ownerInfo.email",
        totalRevenue: 1,
        totalPlatformFee: 1,
        availableBalance: 1,
        totalWithdrawn: 1,
      },
    },
    {
      $sort: { totalPlatformFee: -1 }, // Sắp xếp theo phí dịch vụ giảm dần
    },
  ]);

  const stats = platformFeeStats[0] || {
    totalPlatformFee: 0,
    totalRevenue: 0,
    totalOwners: 0,
  };

  res.json({
    success: true,
    data: {
      totalPlatformFee: stats.totalPlatformFee,
      totalRevenue: stats.totalRevenue,
      totalOwners: stats.totalOwners,
      ownerDetails: ownerFeeDetails,
    },
  });
});

/**
 * API: GET /api/analytics/admin/dashboard
 * Thống kê tổng quan cho Admin
 */
export const getAdminDashboard = asyncHandler(async (req, res) => {
  const { period = "month" } = req.query;
  const { startDate, endDate } = getPeriodDates(period);

  // Lấy ngày cùng kỳ trước để tính tăng trưởng
  const previousPeriodStart = new Date(startDate);
  const previousPeriodEnd = new Date(endDate);
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  if (period === "day") {
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
  } else if (period === "week") {
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 7);
  } else {
    // month
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
    previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - 1);
  }

  // 1. Tổng doanh thu (từ tất cả booking đã thanh toán)
  const currentRevenue = await Booking.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        totalBookings: { $sum: 1 },
      },
    },
  ]);

  // 2. Doanh thu kỳ trước
  const previousRevenue = await Booking.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        date: { $gte: previousPeriodStart, $lte: previousPeriodEnd },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
      },
    },
  ]);

  const currentRevenueAmount = currentRevenue[0]?.totalRevenue || 0;
  const previousRevenueAmount = previousRevenue[0]?.totalRevenue || 0;
  const revenueGrowth = previousRevenueAmount > 0
    ? ((currentRevenueAmount - previousRevenueAmount) / previousRevenueAmount * 100).toFixed(1)
    : 0;

  // 3. Thống kê Facilities
  const facilityStats = await Facility.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const statsMap = facilityStats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});

  const activeFacilities = statsMap.opening || 0;
  const pausedFacilities = statsMap.closed || 0;
  const maintenanceFacilities = statsMap.maintenance || 0;
  const totalFacilities = activeFacilities + pausedFacilities + maintenanceFacilities;

  // 4. Tổng số users
  const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });
  const totalOwners = await User.countDocuments({ role: "owner" });

  // 5. Tổng số bookings
  const totalBookings = currentRevenue[0]?.totalBookings || 0;

  // 6. Tỷ lệ lấp đầy (active facilities / total facilities)
  const fillRate = totalFacilities > 0
    ? Math.round((activeFacilities / totalFacilities) * 100)
    : 0;

  res.json({
    success: true,
    data: {
      period,
      totalRevenue: currentRevenueAmount,
      revenueGrowth: parseFloat(revenueGrowth),
      totalBookings,
      activeFacilities,
      pausedFacilities,
      maintenanceFacilities,
      totalFacilities,
      fillRate,
      totalUsers,
      totalOwners,
    },
  });
});

/**
 * API: GET /api/analytics/admin/revenue
 * Doanh thu theo tháng/quý cho Admin
 */
export const getAdminRevenue = asyncHandler(async (req, res) => {
  const { period = "month", year } = req.query;
  const selectedYear = year ? parseInt(year) : new Date().getFullYear();

  let data = [];

  if (period === "month") {
    // Doanh thu theo tháng
    for (let month = 1; month <= 12; month++) {
      const monthStart = new Date(selectedYear, month - 1, 1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(selectedYear, month, 0);
      monthEnd.setHours(23, 59, 59, 999);

      const monthStats = await Booking.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            date: { $gte: monthStart, $lte: monthEnd },
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$totalAmount" },
            bookings: { $sum: 1 },
          },
        },
      ]);

      data.push({
        period: `Tháng ${month}`,
        revenue: monthStats[0]?.revenue || 0,
        bookings: monthStats[0]?.bookings || 0,
      });
    }
  } else {
    // Doanh thu theo quý
    for (let quarter = 1; quarter <= 4; quarter++) {
      const startMonth = (quarter - 1) * 3;
      const endMonth = quarter * 3 - 1;
      const quarterStart = new Date(selectedYear, startMonth, 1);
      quarterStart.setHours(0, 0, 0, 0);
      const quarterEnd = new Date(selectedYear, endMonth + 1, 0);
      quarterEnd.setHours(23, 59, 59, 999);

      const quarterStats = await Booking.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            date: { $gte: quarterStart, $lte: quarterEnd },
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$totalAmount" },
            bookings: { $sum: 1 },
          },
        },
      ]);

      data.push({
        period: `Q${quarter}`,
        revenue: quarterStats[0]?.revenue || 0,
        bookings: quarterStats[0]?.bookings || 0,
      });
    }
  }

  res.json({
    success: true,
    data: {
      period,
      year: selectedYear,
      revenueData: data,
    },
  });
});

/**
 * API: GET /api/analytics/admin/facility-stats
 * Thống kê facilities cho Admin
 */
export const getAdminFacilityStats = asyncHandler(async (req, res) => {
  const facilityStats = await Facility.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const statsMap = facilityStats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      activeFacilities: statsMap.opening || 0,
      pausedFacilities: statsMap.closed || 0,
      maintenanceFacilities: statsMap.maintenance || 0,
      totalFacilities: Object.values(statsMap).reduce((sum, count) => sum + count, 0),
    },
  });
});

/**
 * API: GET /api/analytics/admin/peak-hours
 * Thống kê giờ cao điểm cho Admin
 */
export const getAdminPeakHours = asyncHandler(async (req, res) => {
  const { startDate, endDate } = parseDateRange(
    req.query.startDate,
    req.query.endDate
  );

  // Lấy tất cả bookings đã thanh toán trong khoảng thời gian
  const bookings = await Booking.find({
    paymentStatus: "paid",
    date: { $gte: startDate, $lte: endDate },
  }).select("timeSlots totalAmount");

  // Phân tích theo giờ
  const hourStats = {};

  bookings.forEach((booking) => {
    booking.timeSlots.forEach((slot) => {
      const [startTime] = slot.split("-");
      const hourKey = startTime.trim();

      if (!hourStats[hourKey]) {
        hourStats[hourKey] = {
          hour: hourKey,
          slotCount: 0,
          revenue: 0,
        };
      }

      const revenuePerSlot = booking.totalAmount / booking.timeSlots.length;
      hourStats[hourKey].slotCount += 1;
      hourStats[hourKey].revenue += revenuePerSlot;
    });
  });

  // Tạo array với tất cả giờ từ 6:00 đến 22:00
  const peakHoursData = [];
  for (let hour = 6; hour <= 22; hour++) {
    const hourKey = `${String(hour).padStart(2, "0")}:00`;
    const nextHour = hour === 22 ? "23:00" : `${String(hour + 1).padStart(2, "0")}:00`;
    const stat = hourStats[hourKey] || { slotCount: 0, revenue: 0 };

    peakHoursData.push({
      hour: `${hourKey}-${nextHour}`,
      bookings: stat.slotCount,
      revenue: Math.round(stat.revenue),
      type:
        stat.slotCount >= 10
          ? "Cao điểm"
          : stat.slotCount >= 5
          ? "Trung bình"
          : "Thấp điểm",
    });
  }

  res.json({
    success: true,
    data: {
      startDate,
      endDate,
      peakHours: peakHoursData,
    },
  });
});

/**
 * API: GET /api/analytics/admin/top-facilities
 * Top facilities được đặt nhiều nhất cho Admin
 */
export const getAdminTopFacilities = asyncHandler(async (req, res) => {
  const { startDate, endDate } = parseDateRange(
    req.query.startDate,
    req.query.endDate
  );
  const limit = parseInt(req.query.limit) || 10;

  // Thống kê booking theo facility
  const facilityStats = await Booking.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$facility",
        totalRevenue: { $sum: "$totalAmount" },
        totalBookings: { $sum: 1 },
      },
    },
    {
      $sort: { totalBookings: -1 },
    },
    {
      $limit: limit,
    },
  ]);

  // Populate facility info
  const topFacilities = await Promise.all(
    facilityStats.map(async (stat) => {
      const facility = await Facility.findById(stat._id).select("name address status");
      return {
        facilityId: stat._id,
        name: facility?.name || "N/A",
        address: facility?.address || "",
        status: facility?.status || "unknown",
        bookings: stat.totalBookings,
        revenue: stat.totalRevenue,
      };
    })
  );

  res.json({
    success: true,
    data: {
      startDate,
      endDate,
      facilities: topFacilities,
    },
  });
});

/**
 * API: GET /api/analytics/admin/top-owners
 * Top owners doanh thu cao nhất cho Admin
 */
export const getAdminTopOwners = asyncHandler(async (req, res) => {
  const { startDate, endDate } = parseDateRange(
    req.query.startDate,
    req.query.endDate
  );
  const limit = parseInt(req.query.limit) || 10;

  // Lấy thống kê từ OwnerBalance
  const ownerStats = await OwnerBalance.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerInfo",
      },
    },
    {
      $unwind: {
        path: "$ownerInfo",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "facilities",
        localField: "owner",
        foreignField: "owner",
        as: "facilities",
      },
    },
    {
      $project: {
        ownerId: "$owner",
        ownerName: "$ownerInfo.name",
        ownerEmail: "$ownerInfo.email",
        totalRevenue: 1,
        totalPlatformFee: 1,
        facilityCount: { $size: "$facilities" },
        facilityNames: {
          $map: {
            input: "$facilities",
            as: "facility",
            in: "$$facility.name",
          },
        },
      },
    },
    {
      $sort: { totalRevenue: -1 },
    },
    {
      $limit: limit,
    },
  ]);

  // Tính tổng số booking cho mỗi owner (từ bookings trong khoảng thời gian)
  const ownerBookings = await Booking.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $lookup: {
        from: "facilities",
        localField: "facility",
        foreignField: "_id",
        as: "facilityInfo",
      },
    },
    {
      $unwind: "$facilityInfo",
    },
    {
      $group: {
        _id: "$facilityInfo.owner",
        totalBookings: { $sum: 1 },
      },
    },
  ]);

  const bookingsMap = new Map(
    ownerBookings.map((stat) => [stat._id.toString(), stat.totalBookings])
  );

  // Kết hợp dữ liệu
  const topOwners = ownerStats.map((stat) => ({
    id: stat.ownerId,
    name: stat.ownerName || "N/A",
    email: stat.ownerEmail || "",
    facilities: stat.facilityNames || [],
    facilityCount: stat.facilityCount || 0,
    revenue: stat.totalRevenue || 0,
    bookings: bookingsMap.get(stat.ownerId.toString()) || 0,
    platformFee: stat.totalPlatformFee || 0,
  }));

  res.json({
    success: true,
    data: {
      startDate,
      endDate,
      owners: topOwners,
    },
  });
});

/**
 * API: GET /api/analytics/admin/dashboard-overview
 * Tổng hợp dữ liệu cho Dashboard Admin (KPI, charts, top facilities)
 */
export const getAdminDashboardOverview = asyncHandler(async (req, res) => {
  const { range = "30d" } = req.query; // Today, 7d, 30d

  // Tính toán khoảng thời gian
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);
  
  let startDate = new Date(now);
  if (range === "Today") {
    startDate.setHours(0, 0, 0, 0);
  } else if (range === "7d") {
    startDate.setDate(now.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
  } else {
    // 30d
    startDate.setDate(now.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);
  }

  // 1. KPI Cards
  // Tổng doanh thu (tháng hiện tại)
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  currentMonthStart.setHours(0, 0, 0, 0);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  currentMonthEnd.setHours(23, 59, 59, 999);

  const revenueStats = await Booking.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        date: { $gte: currentMonthStart, $lte: currentMonthEnd },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        totalBookings: { $sum: 1 },
      },
    },
  ]);

  const totalRevenue = revenueStats[0]?.totalRevenue || 0;
  const totalBookings = revenueStats[0]?.totalBookings || 0;

  // Tỷ lệ lấp đầy (active facilities / total facilities)
  const facilityStats = await Facility.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const statsMap = facilityStats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});

  const activeFacilities = statsMap.opening || 0;
  const totalFacilities = Object.values(statsMap).reduce((sum, count) => sum + count, 0);
  const occupancyRate = totalFacilities > 0
    ? Math.round((activeFacilities / totalFacilities) * 100)
    : 0;

  // Số người dùng mới (trong 7 ngày qua)
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);
  const newUsers = await User.countDocuments({
    role: { $ne: "admin" },
    createdAt: { $gte: weekAgo },
  });

  // 2. Trend Data (7 ngày gần nhất)
  const trendData = [];
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const dayStats = await Booking.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          date: { $gte: date, $lt: nextDate },
        },
      },
      {
        $group: {
          _id: null,
          bookings: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const dayOfWeek = date.getDay();
    trendData.push({
      name: dayNames[dayOfWeek],
      bookings: dayStats[0]?.bookings || 0,
      revenue: dayStats[0]?.revenue ? parseFloat((dayStats[0].revenue / 1000000).toFixed(1)) : 0, // Convert to millions
    });
  }

  // 3. Pie Chart Data (Tình trạng đơn)
  const bookingStatusStats = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const statusMap = bookingStatusStats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});

  const pieData = [
    {
      name: "Đã xác nhận",
      value: (statusMap.confirmed || 0) + (statusMap.completed || 0),
    },
    {
      name: "Đã hủy",
      value: statusMap.cancelled || 0,
    },
    {
      name: "Chờ xử lý",
      value: (statusMap.pending || 0) + (statusMap.pending_payment || 0) + (statusMap.hold || 0),
    },
  ];

  // 4. Top Facilities (Top 5)
  const topFacilitiesStats = await Booking.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$facility",
        totalRevenue: { $sum: "$totalAmount" },
        totalBookings: { $sum: 1 },
      },
    },
    {
      $sort: { totalBookings: -1 },
    },
    {
      $limit: 5,
    },
  ]);

  const topFacilities = await Promise.all(
    topFacilitiesStats.map(async (stat) => {
      const facility = await Facility.findById(stat._id).select("name");
      return {
        name: facility?.name || "N/A",
        bookings: stat.totalBookings,
        revenue: stat.totalRevenue,
      };
    })
  );

  res.json({
    success: true,
    data: {
      kpis: {
        totalRevenue,
        totalBookings,
        occupancyRate,
        newUsers,
      },
      trendData,
      pieData,
      topFacilities,
    },
  });
});
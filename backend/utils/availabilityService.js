/**
 * Availability Service - Kiểm tra sân trống real-time và gợi ý thông minh
 * Hỗ trợ kiểm tra sân trống với các yêu cầu thời gian phức tạp
 * và gợi ý các khung giờ/sân thay thế khi hết sân
 */

import Court from '../models/Court.js';
import Booking from '../models/Booking.js';
import Facility from '../models/Facility.js';
import SportCategory from '../models/SportCategory.js';
import CourtType from '../models/CourtType.js';
import { parseTimeExpression } from './timeParser.js';
import mongoose from 'mongoose';

/**
 * Kiểm tra sân trống real-time dựa trên yêu cầu tự nhiên
 * @param {Object} params
 * @param {string} params.query - Câu hỏi tự nhiên từ người dùng (e.g., "Tối thứ 3 tuần sau còn sân không?")
 * @param {string} params.sportCategoryId - ID môn thể thao (optional)
 * @param {string} params.facilityId - ID cơ sở cụ thể (optional)
 * @param {Object} params.userLocation - Vị trí người dùng {lat, lng} (optional)
 * @returns {Promise<Object>} Kết quả kiểm tra với gợi ý thông minh
 */
export const checkAvailabilityWithQuery = async ({ query, sportCategoryId, facilityId, userLocation }) => {
  try {
    // Parse thời gian từ câu hỏi
    const timeInfo = parseTimeExpression(query);
    
    if (!timeInfo || !timeInfo.hasTimeInfo) {
      return {
        success: false,
        needsMoreInfo: true,
        missing: ['time'],
        templateType: 'ask_time',
        availableCourts: [],
        alternativeSlots: [],
        date: null,
        timeRange: null,
        facilityId: facilityId || null
      };
    }

    const targetDate = timeInfo.date;
    const timeRange = timeInfo.timeRange;
    
    // Build query cho courts
    const courtQuery = {
      status: 'active'
    };

    // Filter by facility if specified
    if (facilityId) {
      courtQuery.facility = facilityId;
    }

    // Filter by sport category if specified
    if (sportCategoryId) {
      const courtTypes = await CourtType.find({
        sportCategory: sportCategoryId,
        status: 'active'
      }).select('name _id').lean();
      
      if (courtTypes.length > 0) {
        const courtTypeNames = courtTypes.map(ct => ct.name);
        const courtTypeIds = courtTypes.map(ct => ct._id);
        courtQuery.$or = [
          { type: { $in: courtTypeNames } },
          { courtType: { $in: courtTypeIds } }
        ];
        if (mongoose.Types.ObjectId.isValid(sportCategoryId)) {
          courtQuery.$or.push({ sportCategory: new mongoose.Types.ObjectId(sportCategoryId) });
        }
      }
    }

    // Get courts matching criteria
    let courts = await Court.find(courtQuery)
      .populate({
        path: 'facility',
        match: { status: 'opening' },
        select: 'name address location types pricePerHour phoneNumber operatingHours timeSlotDuration'
      })
      .lean();

    // Filter out courts without active facilities
    courts = courts.filter(c => c.facility);

    if (courts.length === 0) {
      return {
        success: false,
        needsMoreInfo: false,
        templateType: 'no_courts_found',
        availableCourts: [],
        alternativeSlots: [],
        date: targetDate,
        timeRange: timeRange,
        facilityId: facilityId || null
      };
    }

    // Check availability for each court
    const availableCourts = [];
    const allAlternatives = [];

    for (const court of courts) {
      const facility = court.facility;
      
      // Check if facility is open on target date
      const dayOfWeek = targetDate.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      const dayOperatingHours = facility.operatingHours?.[dayName];

      if (!dayOperatingHours || !dayOperatingHours.isOpen) {
        continue;
      }

      // Get operating hours
      const openTime = dayOperatingHours.open || '06:00';
      const closeTime = dayOperatingHours.close || '22:00';
      
      // Convert time range to time slots
      const requestedSlots = convertTimeRangeToSlots(timeRange, openTime, closeTime, facility.timeSlotDuration || 60);
      
      if (requestedSlots.length === 0) {
        continue;
      }

      // Check availability for requested slots
      const availability = await checkCourtAvailability(court._id, targetDate, requestedSlots);
      
      if (availability.allAvailable) {
        // Court is available for all requested slots
        availableCourts.push({
          court: {
            id: court._id.toString(),
            name: court.name,
            type: court.type,
            price: court.price,
            capacity: court.capacity
          },
          facility: {
            id: facility._id.toString(),
            name: facility.name,
            address: facility.address,
            phoneNumber: facility.phoneNumber
          },
          availableSlots: availability.availableSlots,
          date: targetDate,
          totalPrice: calculateTotalPrice(court.price, availability.availableSlots.length)
        });
      } else {
        // Court is partially or fully booked, find alternatives
        const alternatives = await findAlternativeSlots(
          court,
          facility,
          targetDate,
          requestedSlots,
          availability.availableSlots,
          availability.bookedSlots
        );
        
        if (alternatives.length > 0) {
          allAlternatives.push(...alternatives);
        }
      }
    }

    // Return structured data (no message, will use template)
    const hasAvailable = availableCourts.length > 0;
    
    // Group alternatives by court for better presentation
    const groupedAlternatives = [];
    if (allAlternatives.length > 0) {
      const byCourt = {};
      allAlternatives.forEach(alt => {
        const key = `${alt.court.id}_${alt.date.getTime()}`;
        if (!byCourt[key]) {
          byCourt[key] = {
            court: alt.court,
            facility: alt.facility,
            date: alt.date,
            slots: []
          };
        }
        byCourt[key].slots.push(alt.slot);
      });
      
      // Get top alternatives sorted by priority
      groupedAlternatives.push(...Object.values(byCourt)
        .sort((a, b) => {
          // Prioritize same date, then more slots
          if (a.date.getTime() === targetDate.getTime() && b.date.getTime() !== targetDate.getTime()) return -1;
          if (b.date.getTime() === targetDate.getTime() && a.date.getTime() !== targetDate.getTime()) return 1;
          return b.slots.length - a.slots.length;
        })
        .slice(0, 5));
    }

    // Get facility name if facilityId provided
    let facilityName = null;
    if (facilityId && availableCourts.length > 0) {
      facilityName = availableCourts[0].facility.name;
    } else if (facilityId && groupedAlternatives.length > 0) {
      facilityName = groupedAlternatives[0].facility.name;
    }

    return {
      success: true,
      needsMoreInfo: false,
      templateType: hasAvailable ? 'available_courts' : 'no_available_with_alternatives',
      availableCourts: availableCourts.slice(0, 10),
      alternativeSlots: groupedAlternatives.slice(0, 10),
      date: targetDate,
      timeRange: timeRange,
      facilityId: facilityId || null,
      facilityName: facilityName
    };

  } catch (error) {
    console.error('Error checking availability:', error);
    return {
      success: false,
      needsMoreInfo: false,
      templateType: 'error',
      error: 'Có lỗi xảy ra khi kiểm tra sân trống. Vui lòng thử lại sau.',
      availableCourts: [],
      alternativeSlots: []
    };
  }
};

/**
 * Kiểm tra tính khả dụng của một sân cho các time slots
 * @param {string} courtId - ID sân
 * @param {Date} date - Ngày kiểm tra
 * @param {Array<string>} timeSlots - Mảng các time slots (format: "HH:MM-HH:MM")
 * @returns {Promise<Object>} { allAvailable: boolean, availableSlots: [], bookedSlots: [] }
 */
const checkCourtAvailability = async (courtId, date, timeSlots) => {
  const now = new Date();
  
  // Create date range for query
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  startOfDay.setTime(startOfDay.getTime() - 12 * 60 * 60 * 1000);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  endOfDay.setTime(endOfDay.getTime() + 12 * 60 * 60 * 1000);
  
  // Get existing bookings
  const existingBookings = await Booking.find({
    court: courtId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $in: ['pending_payment', 'hold', 'confirmed'] },
    $or: [
      { holdUntil: { $exists: false } },
      { holdUntil: { $gt: now } },
      { status: 'confirmed' }
    ]
  }).lean();

  const availableSlots = [];
  const bookedSlots = [];

  for (const slot of timeSlots) {
    const isAvailable = !isSlotBooked(slot, existingBookings, date);
    
    if (isAvailable) {
      availableSlots.push(slot);
    } else {
      bookedSlots.push(slot);
    }
  }

  return {
    allAvailable: bookedSlots.length === 0,
    availableSlots,
    bookedSlots
  };
};

/**
 * Kiểm tra xem một slot có bị đặt chưa
 * @param {string} slot - Time slot (format: "HH:MM-HH:MM")
 * @param {Array} bookings - Mảng bookings
 * @param {Date} date - Ngày kiểm tra
 * @returns {boolean} true nếu slot bị đặt
 */
const isSlotBooked = (slot, bookings, date) => {
  const [slotStart, slotEnd] = slot.split('-').map(time => {
    const [hours, minutes] = time.split(':').map(Number);
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d;
  });

  return bookings.some(booking => {
    // Get booking time range
    let bookingStart, bookingEnd;

    if (booking.startTime && booking.endTime) {
      bookingStart = new Date(booking.startTime);
      bookingEnd = new Date(booking.endTime);
      bookingStart.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      bookingEnd.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    } else if (booking.timeSlots && booking.timeSlots.length > 0) {
      const firstSlot = booking.timeSlots[0];
      const lastSlot = booking.timeSlots[booking.timeSlots.length - 1];
      const [startH, startM] = firstSlot.split('-')[0].split(':').map(Number);
      const [, endStr] = lastSlot.split('-');
      const [endH, endM] = endStr.split(':').map(Number);
      
      bookingStart = new Date(date);
      bookingStart.setHours(startH, startM, 0, 0);
      bookingEnd = new Date(date);
      bookingEnd.setHours(endH, endM, 0, 0);
    } else {
      return false;
    }

    // Check overlap
    return slotStart < bookingEnd && slotEnd > bookingStart;
  });
};

/**
 * Tìm các khung giờ thay thế khi sân hết chỗ
 * @param {Object} court - Court object
 * @param {Object} facility - Facility object
 * @param {Date} targetDate - Ngày yêu cầu
 * @param {Array<string>} requestedSlots - Các slots yêu cầu
 * @param {Array<string>} availableSlots - Các slots còn trống (nếu có)
 * @param {Array<string>} bookedSlots - Các slots đã bị đặt
 * @returns {Promise<Array>} Mảng các alternatives
 */
const findAlternativeSlots = async (court, facility, targetDate, requestedSlots, availableSlots, bookedSlots) => {
  const alternatives = [];
  const slotDuration = facility.timeSlotDuration || 60;

  // Get operating hours for target date
  const dayOfWeek = targetDate.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  const dayOperatingHours = facility.operatingHours?.[dayName];

  if (!dayOperatingHours || !dayOperatingHours.isOpen) {
    return alternatives;
  }

  const openTime = dayOperatingHours.open || '06:00';
  const closeTime = dayOperatingHours.close || '22:00';

  // Try to find slots on the same day (nearby times)
  if (availableSlots.length > 0) {
    // Some slots are available, suggest those
    availableSlots.forEach(slot => {
      alternatives.push({
        court: {
          id: court._id.toString(),
          name: court.name,
          type: court.type,
          price: court.price
        },
        facility: {
          id: facility._id.toString(),
          name: facility.name,
          address: facility.address
        },
        date: targetDate,
        slot,
        priority: 1 // Same day, same slot type
      });
    });
  }

  // Try nearby time slots (before/after requested time)
  const requestedStartTime = requestedSlots[0].split('-')[0];
  const [reqHour, reqMin] = requestedStartTime.split(':').map(Number);
  const requestedMinutes = reqHour * 60 + reqMin;

  // Check slots before requested time (up to 3 hours earlier)
  for (let hoursBefore = 1; hoursBefore <= 3; hoursBefore++) {
    const altMinutes = requestedMinutes - (hoursBefore * 60);
    if (altMinutes >= 0) {
      const altSlot = generateSlotFromMinutes(altMinutes, slotDuration);
      if (isSlotInRange(altSlot, openTime, closeTime)) {
        const altAvailability = await checkCourtAvailability(court._id, targetDate, [altSlot]);
        if (altAvailability.allAvailable) {
          alternatives.push({
            court: {
              id: court._id.toString(),
              name: court.name,
              type: court.type,
              price: court.price
            },
            facility: {
              id: facility._id.toString(),
              name: facility.name,
              address: facility.address
            },
            date: targetDate,
            slot: altSlot,
            priority: 2 // Same day, different time
          });
        }
      }
    }
  }

  // Check slots after requested time (up to 3 hours later)
  for (let hoursAfter = 1; hoursAfter <= 3; hoursAfter++) {
    const altMinutes = requestedMinutes + (requestedSlots.length * slotDuration) + (hoursAfter * 60);
    const [closeH, closeM] = closeTime.split(':').map(Number);
    const closeMinutes = closeH * 60 + closeM;
    
    if (altMinutes + slotDuration <= closeMinutes) {
      const altSlot = generateSlotFromMinutes(altMinutes, slotDuration);
      if (isSlotInRange(altSlot, openTime, closeTime)) {
        const altAvailability = await checkCourtAvailability(court._id, targetDate, [altSlot]);
        if (altAvailability.allAvailable) {
          alternatives.push({
            court: {
              id: court._id.toString(),
              name: court.name,
              type: court.type,
              price: court.price
            },
            facility: {
              id: facility._id.toString(),
              name: facility.name,
              address: facility.address
            },
            date: targetDate,
            slot: altSlot,
            priority: 2 // Same day, different time
          });
        }
      }
    }
  }

  // Try next day if no alternatives found on same day
  if (alternatives.length === 0) {
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const nextDayOfWeek = nextDate.getDay();
    const nextDayName = dayNames[nextDayOfWeek];
    const nextDayHours = facility.operatingHours?.[nextDayName];

    if (nextDayHours && nextDayHours.isOpen) {
      const altAvailability = await checkCourtAvailability(court._id, nextDate, requestedSlots);
      if (altAvailability.allAvailable) {
        alternatives.push({
          court: {
            id: court._id.toString(),
            name: court.name,
            type: court.type,
            price: court.price
          },
          facility: {
            id: facility._id.toString(),
            name: facility.name,
            address: facility.address
          },
          date: nextDate,
          slot: requestedSlots[0],
          priority: 3 // Next day
        });
      }
    }
  }

  return alternatives;
};

/**
 * Chuyển đổi time range thành các time slots
 * @param {Object} timeRange - { start: "HH:MM", end: "HH:MM" }
 * @param {string} openTime - Giờ mở cửa
 * @param {string} closeTime - Giờ đóng cửa
 * @param {number} slotDuration - Độ dài mỗi slot (phút)
 * @returns {Array<string>} Mảng các time slots
 */
const convertTimeRangeToSlots = (timeRange, openTime, closeTime, slotDuration) => {
  if (!timeRange || !timeRange.start || !timeRange.end) {
    return [];
  }

  const slots = [];
  const [startH, startM] = timeRange.start.split(':').map(Number);
  const [endH, endM] = timeRange.end.split(':').map(Number);
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  // Clamp to operating hours
  const actualStart = Math.max(startMinutes, openMinutes);
  const actualEnd = Math.min(endMinutes, closeMinutes);

  let currentMinutes = actualStart;

  while (currentMinutes + slotDuration <= actualEnd) {
    const currentHour = Math.floor(currentMinutes / 60);
    const currentMin = currentMinutes % 60;
    const nextMinutes = currentMinutes + slotDuration;
    const nextHour = Math.floor(nextMinutes / 60);
    const nextMin = nextMinutes % 60;

    const startTime = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    const endTime = `${String(nextHour).padStart(2, '0')}:${String(nextMin).padStart(2, '0')}`;
    
    slots.push(`${startTime}-${endTime}`);
    currentMinutes = nextMinutes;
  }

  return slots;
};

/**
 * Tạo slot từ số phút
 * @param {number} minutes - Số phút từ đầu ngày
 * @param {number} slotDuration - Độ dài slot (phút)
 * @returns {string} Time slot string
 */
const generateSlotFromMinutes = (minutes, slotDuration) => {
  const hour = Math.floor(minutes / 60);
  const min = minutes % 60;
  const nextMinutes = minutes + slotDuration;
  const nextHour = Math.floor(nextMinutes / 60);
  const nextMin = nextMinutes % 60;

  const startTime = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  const endTime = `${String(nextHour).padStart(2, '0')}:${String(nextMin).padStart(2, '0')}`;
  
  return `${startTime}-${endTime}`;
};

/**
 * Kiểm tra slot có nằm trong operating hours không
 * @param {string} slot - Time slot
 * @param {string} openTime - Giờ mở cửa
 * @param {string} closeTime - Giờ đóng cửa
 * @returns {boolean}
 */
const isSlotInRange = (slot, openTime, closeTime) => {
  const [startTime] = slot.split('-');
  const [startH, startM] = startTime.split(':').map(Number);
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return startMinutes >= openMinutes && startMinutes < closeMinutes;
};

/**
 * Tính tổng giá
 * @param {number} pricePerSlot - Giá mỗi slot
 * @param {number} slotCount - Số lượng slots
 * @returns {number} Tổng giá
 */
const calculateTotalPrice = (pricePerSlot, slotCount) => {
  return pricePerSlot * slotCount;
};

export default {
  checkAvailabilityWithQuery
};

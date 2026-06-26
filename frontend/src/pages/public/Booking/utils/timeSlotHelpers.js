// Time slot helper functions
import { formatDateToYYYYMMDD } from './dateHelpers';

/**
 * Format time slots from "YYYY-MM-DD-HH:MM" to "HH:MM-HH:MM"
 * @param {Array<string>} slots - Array of slot keys in format "YYYY-MM-DD-HH:MM"
 * @param {number} timeSlotDuration - Duration in minutes (30 or 60)
 * @returns {Array<string>} Array of formatted time slots in format "HH:MM-HH:MM"
 */
export const formatTimeSlots = (slots, timeSlotDuration = 60) => {
  return slots.map(slot => {
    // Parse slot: "2024-01-15-18:00" -> "18:00-18:30" hoặc "18:00-19:00"
    const parts = slot.split('-');
    if (parts.length >= 4) {
      const hourStr = parts[3]; // "18:00"
      const [hours, minutes] = hourStr.split(':').map(Number);
      const startTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      
      // Calculate end time dựa trên timeSlotDuration
      const slotDurationMinutes = timeSlotDuration || 60;
      const totalMinutes = hours * 60 + minutes + slotDurationMinutes;
      const endHours = Math.floor(totalMinutes / 60) % 24;
      const endMinutes = totalMinutes % 60;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
      
      return `${startTime}-${endTime}`;
    }
    return slot;
  });
};

/**
 * Calculate end time based on start time and duration
 * @param {string} startTime - Start time in format "HH:MM"
 * @param {number} durationMinutes - Duration in minutes
 * @returns {string} End time in format "HH:MM"
 */
export const calculateEndTime = (startTime, durationMinutes) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

/**
 * Parse slot key to extract date and time
 * @param {string} slotKey - Slot key in format "YYYY-MM-DD-HH:MM"
 * @returns {Object} { date: string, time: string }
 */
export const parseSlotKey = (slotKey) => {
  const parts = slotKey.split('-');
  if (parts.length >= 4) {
    return {
      date: `${parts[0]}-${parts[1]}-${parts[2]}`,
      time: parts[3] || (parts[3] + ':' + (parts[4] || '00'))
    };
  }
  return { date: '', time: '' };
};

/**
 * Generate lock key for slot
 * @param {string} courtId - Court ID
 * @param {string|Date} date - Date string (YYYY-MM-DD) or Date object
 * @param {string} timeSlot - Time slot string
 * @returns {string} Lock key
 */
export const generateLockKey = (courtId, date, timeSlot) => {
  let dateStr;
  if (date instanceof Date) {
    dateStr = formatDateToYYYYMMDD(date);
  } else if (typeof date === 'string') {
    dateStr = date.includes('T') ? formatDateToYYYYMMDD(new Date(date)) : date;
  } else {
    dateStr = formatDateToYYYYMMDD(new Date(date));
  }
  return `${courtId}_${dateStr}_${timeSlot}`;
};


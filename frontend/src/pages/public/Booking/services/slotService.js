// Slot service functions
import { formatDateToYYYYMMDD } from '../utils/dateHelpers';
import { generateLockKey } from '../utils/timeSlotHelpers';

/**
 * Mark slots as booked
 * @param {string} courtId - Court ID
 * @param {string|Date} date - Date string or Date object
 * @param {Array<string>} timeSlots - Array of time slot strings
 * @param {Function} setLockedSlots - State setter for locked slots
 * @param {Function} setBookedSlots - State setter for booked slots
 * @param {Object} lockedSlotsByMeRef - Ref tracking slots locked by current user
 */
export const markSlotsAsBooked = (
  courtId,
  date,
  timeSlots,
  setLockedSlots,
  setBookedSlots,
  lockedSlotsByMeRef
) => {
  let dateStr;
  if (date instanceof Date) {
    dateStr = formatDateToYYYYMMDD(date);
  } else if (typeof date === 'string') {
    // If it's already in YYYY-MM-DD format, use it directly
    dateStr = date.includes('T') ? formatDateToYYYYMMDD(new Date(date)) : date;
  } else {
    dateStr = formatDateToYYYYMMDD(new Date(date));
  }
  
  timeSlots.forEach(timeSlot => {
    const lockKey = generateLockKey(courtId, dateStr, timeSlot);
    if (lockedSlotsByMeRef) {
      lockedSlotsByMeRef.current?.delete(lockKey); // Remove from tracking
    }
    
    // Remove from locked slots
    setLockedSlots(prev => {
      const newState = { ...prev };
      delete newState[lockKey];
      return newState;
    });
    
    // Mark as booked
    setBookedSlots(prev => {
      const newSet = new Set(prev);
      newSet.add(lockKey);
      return newSet;
    });
  });
};

/**
 * Mark slots as available (when cancelled)
 * @param {string} courtId - Court ID
 * @param {string|Date} date - Date string or Date object
 * @param {Array<string>} timeSlots - Array of time slot strings
 * @param {Function} setBookedSlots - State setter for booked slots
 */
export const markSlotsAsAvailable = (courtId, date, timeSlots, setBookedSlots) => {
  let dateStr;
  if (date instanceof Date) {
    dateStr = formatDateToYYYYMMDD(date);
  } else if (typeof date === 'string') {
    dateStr = date.includes('T') ? formatDateToYYYYMMDD(new Date(date)) : date;
  } else {
    dateStr = formatDateToYYYYMMDD(new Date(date));
  }
  
  timeSlots.forEach(timeSlot => {
    const lockKey = generateLockKey(courtId, dateStr, timeSlot);
    
    // Remove from booked slots
    setBookedSlots(prev => {
      const newSet = new Set(prev);
      newSet.delete(lockKey);
      return newSet;
    });
  });
};


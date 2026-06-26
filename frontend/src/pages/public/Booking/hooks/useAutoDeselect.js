// Custom hook to auto-deselect slots after 5 minutes
import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { formatDateToYYYYMMDD } from '../utils/dateHelpers';
import { formatTimeSlots } from '../utils/timeSlotHelpers';

/**
 * Custom hook to auto-deselect slots after 5 minutes if user doesn't confirm booking
 * @param {Array} selectedSlots - Array of selected slot keys
 * @param {string} selectedCourt - Selected court ID
 * @param {Date} selectedDate - Selected date
 * @param {number} timeSlotDuration - Time slot duration in minutes
 * @param {Object} defaultSocket - Socket.IO instance
 * @param {boolean} isAuthenticated - Authentication status
 * @param {Function} setSelectedSlots - State setter for selected slots
 * @returns {Object} { clearTimeout }
 */
export const useAutoDeselect = (
  selectedSlots,
  selectedCourt,
  selectedDate,
  timeSlotDuration,
  defaultSocket,
  isAuthenticated,
  setSelectedSlots
) => {
  const slotTimeoutRef = useRef(null);

  useEffect(() => {
    // Clear existing timeout
    if (slotTimeoutRef.current) {
      clearTimeout(slotTimeoutRef.current);
      slotTimeoutRef.current = null;
    }

    // Only start timeout if there are selected slots
    if (selectedSlots.length > 0 && selectedCourt && selectedDate) {
      const timeoutDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      // Store current values to avoid closure issues
      const currentSlots = [...selectedSlots];
      const currentCourt = selectedCourt;
      const currentDate = selectedDate;
      const currentTimeSlotDuration = timeSlotDuration || 60;
      
      slotTimeoutRef.current = setTimeout(() => {
        // Auto-deselect all slots
        const dateStr = formatDateToYYYYMMDD(currentDate);
        
        // Unlock all locked slots by current user
        const formattedSlots = formatTimeSlots(currentSlots, currentTimeSlotDuration);
        formattedSlots.forEach(timeSlotStr => {
          // Unlock slot via socket
          if (defaultSocket && isAuthenticated) {
            defaultSocket.emit('booking:unlock', {
              courtId: currentCourt,
              date: dateStr,
              timeSlot: timeSlotStr
            });
          }
        });
        
        // Clear selected slots
        setSelectedSlots([]);
        
        // Show notification
        toast.warning('Đã tự động bỏ chọn khung giờ do quá 5 phút không xác nhận đặt sân. Vui lòng chọn lại.');
        
        slotTimeoutRef.current = null;
      }, timeoutDuration);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (slotTimeoutRef.current) {
        clearTimeout(slotTimeoutRef.current);
        slotTimeoutRef.current = null;
      }
    };
  }, [selectedSlots, selectedCourt, selectedDate, timeSlotDuration, defaultSocket, isAuthenticated, setSelectedSlots]);

  return {
    slotTimeoutRef,
    clearTimeout: () => {
      if (slotTimeoutRef.current) {
        clearTimeout(slotTimeoutRef.current);
        slotTimeoutRef.current = null;
      }
    }
  };
};


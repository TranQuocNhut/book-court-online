// Custom hook to cleanup slots when court or date changes
import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { formatDateToYYYYMMDD } from '../utils/dateHelpers';
import { generateLockKey } from '../utils/timeSlotHelpers';

/**
 * Custom hook to cleanup locked/booked slots when court or date changes
 * @param {string} selectedCourt - Selected court ID
 * @param {Date} selectedDate - Selected date
 * @param {Object} lockedSlots - Locked slots state
 * @param {Set} bookedSlots - Booked slots state
 * @param {Object} defaultSocket - Socket.IO instance
 * @param {boolean} isAuthenticated - Authentication status
 * @param {Function} setLockedSlots - State setter for locked slots
 * @param {Function} setBookedSlots - State setter for booked slots
 * @param {Object} lockedSlotsByMeRef - Ref tracking slots locked by current user
 * @param {Function} setSelectedSlots - State setter for selected slots
 * @param {Object} slotTimeoutRef - Ref for timeout
 */
export const useSlotCleanup = (
  selectedCourt,
  selectedDate,
  lockedSlots,
  bookedSlots,
  defaultSocket,
  isAuthenticated,
  setLockedSlots,
  setBookedSlots,
  lockedSlotsByMeRef,
  setSelectedSlots,
  slotTimeoutRef
) => {
  const previousCourtRef = useRef(selectedCourt);
  const previousDateRef = useRef(selectedDate);

  useEffect(() => {
    const dateStr = formatDateToYYYYMMDD(selectedDate);
    const courtChanged = previousCourtRef.current !== selectedCourt;
    const dateChanged = previousDateRef.current?.getTime() !== selectedDate?.getTime();

    // Only run cleanup if court or date actually changed
    if (!courtChanged && !dateChanged && previousCourtRef.current) {
      return;
    }

    if (!selectedCourt) {
      // If no court selected, clear all selected slots and locked slots
      // Clear timeout
      if (slotTimeoutRef?.current) {
        clearTimeout(slotTimeoutRef.current);
        slotTimeoutRef.current = null;
      }
      setSelectedSlots([]);
      setLockedSlots({});
      previousCourtRef.current = selectedCourt;
      previousDateRef.current = selectedDate;
      return;
    }

    // When court changes, unlock all slots from previous court and clear selected slots
    if (courtChanged && previousCourtRef.current && defaultSocket && isAuthenticated) {
      // Get locked slots from previous court using functional update
      setLockedSlots(prev => {
        const previousLocks = Object.keys(prev)
          .filter(key => {
            const parts = key.split('_');
            if (parts.length >= 3) {
              const lockCourtId = parts[0];
              return lockCourtId === previousCourtRef.current;
            }
            return false;
          })
          .map(key => {
            const parts = key.split('_');
            if (parts.length >= 3) {
              const lockInfo = prev[key];
              if (lockInfo?.isLockedByMe) {
                return {
                  courtId: parts[0],
                  date: parts[1],
                  timeSlot: parts.slice(2).join('_')
                };
              }
            }
            return null;
          })
          .filter(item => item !== null);

        // Unlock slots from previous court
        previousLocks.forEach(({ courtId, date, timeSlot }) => {
          const lockKey = generateLockKey(courtId, date, timeSlot);
          lockedSlotsByMeRef.current?.delete(lockKey); // Remove from tracking
          defaultSocket.emit('booking:unlock', { courtId, date, timeSlot });
        });

        // Return filtered state (only keep slots for current court/date)
        const newState = {};
        Object.keys(prev).forEach(key => {
          if (key.startsWith(`${selectedCourt}_${dateStr}_`)) {
            newState[key] = prev[key];
          }
        });
        return newState;
      });

      // Clear selected slots when court changes
      // Clear timeout
      if (slotTimeoutRef?.current) {
        clearTimeout(slotTimeoutRef.current);
        slotTimeoutRef.current = null;
      }
      setSelectedSlots(prev => {
        if (prev.length > 0) {
          toast.info('Đã xóa các khung giờ đã chọn vì bạn đã đổi sân. Vui lòng chọn lại.');
          return [];
        }
        return prev;
      });
    } else {
      // Only cleanup slots that don't match current court/date (when date changes or on mount)
      setLockedSlots(prev => {
        const newState = {};
        Object.keys(prev).forEach(key => {
          if (key.startsWith(`${selectedCourt}_${dateStr}_`)) {
            newState[key] = prev[key];
          }
        });
        return newState;
      });
    }
    
    // Clear booked slots that don't match current court/date
    setBookedSlots(prev => {
      const newSet = new Set();
      prev.forEach(key => {
        if (key.startsWith(`${selectedCourt}_${dateStr}_`)) {
          newSet.add(key);
        }
      });
      return newSet;
    });

    previousCourtRef.current = selectedCourt;
    previousDateRef.current = selectedDate;
  }, [selectedCourt, selectedDate, defaultSocket, isAuthenticated, setLockedSlots, setBookedSlots, lockedSlotsByMeRef, setSelectedSlots, slotTimeoutRef]);
};


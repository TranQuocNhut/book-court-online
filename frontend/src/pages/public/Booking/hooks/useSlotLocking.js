// Custom hook to manage slot locking/unlocking with Socket.IO
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { formatDateToYYYYMMDD } from '../utils/dateHelpers';
import { generateLockKey } from '../utils/timeSlotHelpers';
import { markSlotsAsBooked, markSlotsAsAvailable } from '../services/slotService';

/**
 * Custom hook to manage slot locking/unlocking with Socket.IO
 * @param {string} venueId - Facility ID
 * @param {string} selectedCourt - Selected court ID
 * @param {Date} selectedDate - Selected date
 * @param {Object} user - Current user object
 * @param {Object} defaultSocket - Socket.IO instance
 * @param {boolean} isAuthenticated - Authentication status
 * @param {Object} socketHelpers - { isConnected, joinFacility, leaveFacility, joinCourt, leaveCourt }
 * @returns {Object} { lockedSlots, bookedSlots, handleSlotLock, handleSlotUnlock, lockedSlotsByMeRef }
 */
export const useSlotLocking = (
  venueId,
  selectedCourt,
  selectedDate,
  user,
  defaultSocket,
  isAuthenticated,
  socketHelpers
) => {
  const { isConnected, joinFacility, leaveFacility, joinCourt, leaveCourt } = socketHelpers;
  const [lockedSlots, setLockedSlots] = useState({});
  const [bookedSlots, setBookedSlots] = useState(new Set());
  const lockedSlotsByMeRef = useRef(new Set());

  // Socket.IO: Join facility and court rooms, listen for slot lock events
  useEffect(() => {
    if (!venueId || !selectedCourt || !isConnected || !defaultSocket || !isAuthenticated) return;

    // Join facility room to receive updates
    joinFacility(venueId, 'default');
    
    // Join court room for specific court updates
    const dateStr = selectedDate ? formatDateToYYYYMMDD(selectedDate) : null;
    joinCourt(selectedCourt, venueId, 'default', dateStr);

    // Listen for initial locked slots when joining court
    const handleLockedSlots = (data) => {
      const { courtId, date, lockedSlots: receivedLockedSlots } = data;
      
      // Only process if it's for the current court and date
      if (courtId === selectedCourt) {
        const currentDateStr = selectedDate ? formatDateToYYYYMMDD(selectedDate) : null;
        if (!date || date === currentDateStr) {
          const newLockedSlots = {};
          receivedLockedSlots.forEach(lock => {
            const lockKey = generateLockKey(lock.courtId, lock.date, lock.timeSlot);
            // Only mark as locked by other if it's not locked by current user
            if (lock.lockedBy !== user?._id) {
              newLockedSlots[lockKey] = {
                lockedBy: lock.lockedBy,
                expiresAt: lock.expiresAt,
                isLockedByOther: true
              };
            }
          });
          
          if (Object.keys(newLockedSlots).length > 0) {
            setLockedSlots(prev => ({ ...prev, ...newLockedSlots }));
          }
        }
      }
    };

    // Listen for slot lock events from other users
    const handleSlotLocked = (data) => {
      const { courtId, date, timeSlot, lockedBy, expiresAt } = data;
      
      // Only update if it's not locked by current user
      if (lockedBy !== user?._id) {
        const lockKey = generateLockKey(courtId, date, timeSlot);
        setLockedSlots(prev => ({
          ...prev,
          [lockKey]: { lockedBy, expiresAt, isLockedByOther: true }
        }));
      }
    };

    const handleSlotUnlocked = (data) => {
      const { courtId, date, timeSlot } = data;
      const lockKey = generateLockKey(courtId, date, timeSlot);
      setLockedSlots(prev => {
        const newState = { ...prev };
        delete newState[lockKey];
        return newState;
      });
    };

    const handleSlotConfirmed = (data) => {
      const { courtId, date, timeSlots } = data;
      markSlotsAsBooked(courtId, date, timeSlots, setLockedSlots, setBookedSlots, lockedSlotsByMeRef);
    };

    const handleSlotBooked = (data) => {
      const { courtId, date, timeSlots } = data;
      markSlotsAsBooked(courtId, date, timeSlots, setLockedSlots, setBookedSlots, lockedSlotsByMeRef);
    };

    const handleSlotCancelled = (data) => {
      const { courtId, date, timeSlots } = data;
      markSlotsAsAvailable(courtId, date, timeSlots, setBookedSlots);
    };

    const handleStatusUpdated = (data) => {
      // If booking is cancelled, mark slots as available
      if (data.status === 'cancelled' && data.timeSlots) {
        const { courtId, date, timeSlots } = data;
        markSlotsAsAvailable(courtId, date, timeSlots, setBookedSlots);
      }
    };

    defaultSocket.on('booking:locked:slots', handleLockedSlots);
    defaultSocket.on('booking:slot:locked', handleSlotLocked);
    defaultSocket.on('booking:slot:unlocked', handleSlotUnlocked);
    defaultSocket.on('booking:slot:confirmed', handleSlotConfirmed);
    defaultSocket.on('booking:slot:booked', handleSlotBooked);
    defaultSocket.on('booking:slot:cancelled', handleSlotCancelled);
    defaultSocket.on('booking:status:updated', handleStatusUpdated);

    return () => {
      defaultSocket.off('booking:locked:slots', handleLockedSlots);
      defaultSocket.off('booking:slot:locked', handleSlotLocked);
      defaultSocket.off('booking:slot:unlocked', handleSlotUnlocked);
      defaultSocket.off('booking:slot:confirmed', handleSlotConfirmed);
      defaultSocket.off('booking:slot:booked', handleSlotBooked);
      defaultSocket.off('booking:slot:cancelled', handleSlotCancelled);
      defaultSocket.off('booking:status:updated', handleStatusUpdated);
      leaveFacility(venueId, 'default');
      leaveCourt(selectedCourt, 'default');
    };
  }, [venueId, selectedCourt, selectedDate, isConnected, defaultSocket, isAuthenticated, user?._id, joinFacility, leaveFacility, joinCourt, leaveCourt]);

  // Handle slot lock (when user selects a slot)
  const handleSlotLock = (timeSlot, setSelectedSlots) => {
    if (!selectedCourt || !selectedDate || !defaultSocket || !isAuthenticated) return;
    
    // Use local timezone format, not UTC
    const dateStr = formatDateToYYYYMMDD(selectedDate);
    const timeSlotStr = timeSlot; // Format: "18:00-19:00"
    
    defaultSocket.emit('booking:lock', {
      courtId: selectedCourt,
      date: dateStr,
      timeSlot: timeSlotStr
    });

    // Listen for lock success
    const handleLockSuccess = (data) => {
      if (data.courtId === selectedCourt && data.timeSlot === timeSlotStr) {
        const lockKey = generateLockKey(selectedCourt, dateStr, timeSlotStr);
        lockedSlotsByMeRef.current.add(lockKey); // Track this slot
        setLockedSlots(prev => ({
          ...prev,
          [lockKey]: { 
            lockedBy: user?._id, 
            expiresAt: data.expiresAt,
            isLockedByMe: true 
          }
        }));
        defaultSocket.off('booking:lock:success', handleLockSuccess);
        defaultSocket.off('booking:lock:error', handleLockError);
      }
    };

    const handleLockError = (error) => {
      toast.error(error.message || 'Không thể giữ chỗ. Slot có thể đang được người khác chọn.');
      // Remove slot from selection if lock fails
      const slotKey = `${dateStr}-${timeSlotStr.split('-')[0]}`;
      setSelectedSlots(prev => prev.filter(slot => slot !== slotKey));
      defaultSocket.off('booking:lock:success', handleLockSuccess);
      defaultSocket.off('booking:lock:error', handleLockError);
    };

    defaultSocket.once('booking:lock:success', handleLockSuccess);
    defaultSocket.once('booking:lock:error', handleLockError);
  };

  // Handle slot unlock (when user deselects a slot)
  const handleSlotUnlock = (timeSlot) => {
    if (!selectedCourt || !selectedDate || !defaultSocket || !isAuthenticated) return;
    
    // Use local timezone format, not UTC
    const dateStr = formatDateToYYYYMMDD(selectedDate);
    const timeSlotStr = timeSlot;
    
    defaultSocket.emit('booking:unlock', {
      courtId: selectedCourt,
      date: dateStr,
      timeSlot: timeSlotStr
    });

    // Remove from lockedSlots on success
    const handleUnlockSuccess = () => {
      const lockKey = generateLockKey(selectedCourt, dateStr, timeSlotStr);
      lockedSlotsByMeRef.current.delete(lockKey); // Remove from tracking
      setLockedSlots(prev => {
        const newState = { ...prev };
        delete newState[lockKey];
        return newState;
      });
      defaultSocket.off('booking:unlock:success', handleUnlockSuccess);
      defaultSocket.off('booking:unlock:error', handleUnlockError);
    };

    const handleUnlockError = (error) => {
      // Silently fail unlock error, slot will expire anyway
      defaultSocket.off('booking:unlock:success', handleUnlockSuccess);
      defaultSocket.off('booking:unlock:error', handleUnlockError);
    };

    defaultSocket.once('booking:unlock:success', handleUnlockSuccess);
    defaultSocket.once('booking:unlock:error', handleUnlockError);
  };

  return {
    lockedSlots,
    bookedSlots,
    setLockedSlots,
    setBookedSlots,
    handleSlotLock,
    handleSlotUnlock,
    lockedSlotsByMeRef
  };
};


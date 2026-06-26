// backend/socket/bookingSocket.js
import Booking from '../models/Booking.js';
import Court from '../models/Court.js';
import Facility from '../models/Facility.js';

const lockedSlots = new Map(); // key: "courtId_date_timeSlot", value: { userId, lockedAt, expiresAt }

// Lock expiration time (5 minutes)
const LOCK_DURATION = 5 * 60 * 1000;
// Periodic cleanup of expired locks
setInterval(() => {
  const now = Date.now();
  for (const [key, lock] of lockedSlots.entries()) {
    if (lock.expiresAt < now) {
      lockedSlots.delete(key);
    }
  }
}, 60000); // Cleanup every minute

const getLockKey = (courtId, date, timeSlot) => {
  let dateStr;
  // If date is already a string in YYYY-MM-DD format, use it directly
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    dateStr = date;
  } else {
    // If date is Date object or ISO string, convert to YYYY-MM-DD
    // Use local timezone to match frontend
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dateStr = `${year}-${month}-${day}`;
  }
  return `${courtId}_${dateStr}_${timeSlot}`;
};

/**
 * Check if slot is locked
 */
const isSlotLocked = (courtId, date, timeSlot) => {
  const key = getLockKey(courtId, date, timeSlot);
  const lock = lockedSlots.get(key);
  
  if (!lock) return false;
  
  // Check if lock expired
  if (lock.expiresAt < Date.now()) {
    lockedSlots.delete(key);
    return false;
  }
  
  return lock;
};

/**
 * Lock a slot
 */
const lockSlot = (courtId, date, timeSlot, userId) => {
  const key = getLockKey(courtId, date, timeSlot);
  const now = Date.now();
  
  const existingLock = lockedSlots.get(key);
  
  // If already locked by same user, extend the lock
  if (existingLock && existingLock.userId === userId) {
    existingLock.expiresAt = now + LOCK_DURATION;
    return { success: true, lock: existingLock };
  }
  
  // If locked by another user, reject
  if (existingLock && existingLock.expiresAt > now) {
    return { success: false, message: 'Slot is currently locked by another user' };
  }
  
  // Create new lock
  const lock = {
    userId,
    courtId,
    date,
    timeSlot,
    lockedAt: now,
    expiresAt: now + LOCK_DURATION,
  };
  
  lockedSlots.set(key, lock);
  return { success: true, lock };
};

/**
 * Unlock a slot
 */
const unlockSlot = (courtId, date, timeSlot, userId) => {
  const key = getLockKey(courtId, date, timeSlot);
  const lock = lockedSlots.get(key);
  
  if (!lock) {
    return { success: false, message: 'Slot is not locked' };
  }
  
  // Only the user who locked it can unlock it (or admin)
  if (lock.userId !== userId) {
    return { success: false, message: 'You do not have permission to unlock this slot' };
  }
  
  lockedSlots.delete(key);
  return { success: true };
};

/**
 * Unlock all slots for a user
 * Returns array of unlocked slots with their details
 */
const unlockUserSlots = (userId) => {
  const unlockedSlots = [];
  for (const [key, lock] of lockedSlots.entries()) {
    if (lock.userId === userId) {
      unlockedSlots.push({
        courtId: lock.courtId,
        date: lock.date,
        timeSlot: lock.timeSlot,
        key: key
      });
      lockedSlots.delete(key);
    }
  }
  return unlockedSlots;
};

/**
 * Get all locked slots for a court (and optionally a specific date)
 */
const getLockedSlotsForCourt = (courtId, date = null) => {
  const now = Date.now();
  const lockedSlotsList = [];
  
  for (const [key, lock] of lockedSlots.entries()) {
    // Skip expired locks
    if (lock.expiresAt < now) {
      continue;
    }
    
    // Check if this lock is for the requested court
    if (lock.courtId === courtId || key.startsWith(`${courtId}_`)) {
      // If date is specified, filter by date
      if (date) {
        let lockDateStr;
        if (typeof lock.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(lock.date)) {
          lockDateStr = lock.date;
        } else {
          const d = new Date(lock.date);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          lockDateStr = `${year}-${month}-${day}`;
        }
        
        let requestedDateStr;
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
          requestedDateStr = date;
        } else {
          const d = new Date(date);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          requestedDateStr = `${year}-${month}-${day}`;
        }
        
        if (lockDateStr !== requestedDateStr) {
          continue;
        }
      }
      
      lockedSlotsList.push({
        courtId: lock.courtId,
        date: lock.date,
        timeSlot: lock.timeSlot,
        lockedBy: lock.userId,
        lockedAt: lock.lockedAt,
        expiresAt: lock.expiresAt,
      });
    }
  }
  
  return lockedSlotsList;
};

/**
 * Booking socket handlers
 * Handles lock, unlock, and confirm events for bookings
 */
export default function bookingSocket(io) {
  // Handle lock slot event (from any namespace)
  io.on('connection', (socket) => {
    // Lock slot for booking
    socket.on('booking:lock', async (data) => {
      try {
        const { courtId, date, timeSlot } = data;

        if (!courtId || !date || !timeSlot) {
          socket.emit('booking:lock:error', { message: 'Missing required fields: courtId, date, timeSlot' });
          return;
        }

        // Verify court exists
        const court = await Court.findById(courtId).populate('facility').lean();
        if (!court) {
          socket.emit('booking:lock:error', { message: 'Court not found' });
          return;
        }

        // Try to lock the slot
        const result = lockSlot(courtId, date, timeSlot, socket.userId);

        if (!result.success) {
          socket.emit('booking:lock:error', { message: result.message });
          return;
        }

        // Emit success to user
        socket.emit('booking:lock:success', {
          courtId,
          date,
          timeSlot,
          lockedAt: result.lock.lockedAt,
          expiresAt: result.lock.expiresAt,
        });

        // Notify others in facility room that slot is locked
        const facilityId = court.facility?._id?.toString() || court.facility?.toString();
        if (facilityId) {
          socket.to(`facility_${facilityId}`).to(`court_${courtId}`).emit('booking:slot:locked', {
            courtId,
            date,
            timeSlot,
            lockedBy: socket.userId,
            lockedAt: result.lock.lockedAt,
            expiresAt: result.lock.expiresAt,
          });
        }

      } catch (error) {
        console.error('Error in booking:lock:', error);
        socket.emit('booking:lock:error', { message: 'Failed to lock slot' });
      }
    });

    // Unlock slot
    socket.on('booking:unlock', async (data) => {
      try {
        const { courtId, date, timeSlot } = data;

        if (!courtId || !date || !timeSlot) {
          socket.emit('booking:unlock:error', { message: 'Missing required fields' });
          return;
        }

        const result = unlockSlot(courtId, date, timeSlot, socket.userId);

        if (!result.success) {
          socket.emit('booking:unlock:error', { message: result.message });
          return;
        }

        // Get court to find facility
        const court = await Court.findById(courtId).populate('facility').lean();
        const facilityId = court?.facility?._id?.toString() || court?.facility?.toString();

        // Emit success to user
        socket.emit('booking:unlock:success', { courtId, date, timeSlot });

        // Notify others in facility room
        if (facilityId) {
          socket.to(`facility_${facilityId}`).to(`court_${courtId}`).emit('booking:slot:unlocked', {
            courtId,
            date,
            timeSlot,
            unlockedBy: socket.userId,
          });
        }
      } catch (error) {
        console.error('Error in booking:unlock:', error);
        socket.emit('booking:unlock:error', { message: 'Failed to unlock slot' });
      }
    });

    // Unlock all user's slots
    socket.on('booking:unlock:all', async () => {
      const unlockedSlots = unlockUserSlots(socket.userId);
      
      // Emit success to user
      socket.emit('booking:unlock:all:success', { unlockedCount: unlockedSlots.length });
      
      // Broadcast each unlocked slot to other users
      for (const slot of unlockedSlots) {
        try {
          // Get court to find facility
          const court = await Court.findById(slot.courtId).populate('facility').lean();
          const facilityId = court?.facility?._id?.toString() || court?.facility?.toString();
          
          // Notify others in facility room that slot is unlocked
          if (facilityId) {
            socket.to(`facility_${facilityId}`).to(`court_${slot.courtId}`).emit('booking:slot:unlocked', {
              courtId: slot.courtId,
              date: slot.date,
              timeSlot: slot.timeSlot,
              unlockedBy: socket.userId,
            });
          }
        } catch (error) {
          console.error(`Error broadcasting unlock for slot ${slot.key}:`, error);
        }
      }
      
    });

    // Confirm booking (create actual booking)
    socket.on('booking:confirm', async (data) => {
      try {
        const { courtId, facilityId, date, timeSlots, contactInfo, totalAmount } = data;

        if (!courtId || !facilityId || !date || !timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
          socket.emit('booking:confirm:error', { message: 'Missing required fields' });
          return;
        }

        // Check if all slots are still locked by this user
        const allLocked = timeSlots.every(timeSlot => {
          const lock = isSlotLocked(courtId, date, timeSlot);
          return lock && lock.userId === socket.userId;
        });

        if (!allLocked) {
          socket.emit('booking:confirm:error', { 
            message: 'Some slots are no longer locked. Please try again.' 
          });
          return;
        }

        // Verify court exists and get facility
        const court = await Court.findById(courtId).populate('facility').lean();
        if (!court) {
          socket.emit('booking:confirm:error', { message: 'Court not found' });
          return;
        }

        // Check availability (ensure slots are not booked)
        const bookingDate = new Date(date);
        const existingBookings = await Booking.find({
          court: courtId,
          date: bookingDate,
          status: { $in: ['pending', 'confirmed'] },
          timeSlots: { $in: timeSlots },
        });

        if (existingBookings.length > 0) {
          socket.emit('booking:confirm:error', { 
            message: 'Some time slots are already booked' 
          });
          return;
        }

        // Create booking
        const booking = new Booking({
          user: socket.userId,
          court: courtId,
          facility: facilityId,
          date: bookingDate,
          timeSlots: timeSlots,
          contactInfo: contactInfo || {},
          totalAmount: totalAmount || 0,
          status: 'pending',
          paymentStatus: 'pending',
        });

        await booking.save();

        // Unlock all slots for this booking
        timeSlots.forEach(timeSlot => {
          unlockSlot(courtId, date, timeSlot, socket.userId);
        });

        // Emit success to user
        socket.emit('booking:confirm:success', {
          booking: booking.toObject(),
          message: 'Booking confirmed successfully',
        });

        // Notify facility owner
        const facility = await Facility.findById(facilityId).select('owner').lean();
        if (facility?.owner) {
          const ownerId = facility.owner._id?.toString() || facility.owner.toString();
          io.to(`user_${ownerId}`).emit('booking:new', {
            booking: booking.toObject(),
            message: 'New booking received',
          });
        }

        // Notify others in facility room
        io.to(`facility_${facilityId}`).to(`court_${courtId}`).emit('booking:slot:confirmed', {
          courtId,
          date,
          timeSlots,
          bookingId: booking._id,
        });

        console.log(`✅ Booking confirmed: ${booking._id} by user ${socket.userId}`);
      } catch (error) {
        console.error('Error in booking:confirm:', error);
        socket.emit('booking:confirm:error', { message: 'Failed to confirm booking' });
      }
    });

    // Handle disconnect - unlock all user's slots and broadcast
    socket.on('disconnect', async () => {
      const unlockedSlots = unlockUserSlots(socket.userId);
      
      if (unlockedSlots.length > 0) {
        // Broadcast each unlocked slot to other users
        for (const slot of unlockedSlots) {
          try {
            // Get court to find facility
            const court = await Court.findById(slot.courtId).populate('facility').lean();
            const facilityId = court?.facility?._id?.toString() || court?.facility?.toString();
            
            // Notify others in facility room that slot is unlocked
            if (facilityId) {
              // Use io to broadcast since socket is disconnected
              io.to(`facility_${facilityId}`).to(`court_${slot.courtId}`).emit('booking:slot:unlocked', {
                courtId: slot.courtId,
                date: slot.date,
                timeSlot: slot.timeSlot,
                unlockedBy: socket.userId,
              });
            }
          } catch (error) {
            console.error(`Error broadcasting unlock for slot ${slot.key} on disconnect:`, error);
          }
        }
      }
    });
  });

  console.log('✅ Booking socket handlers initialized');
}

export { lockSlot, unlockSlot, isSlotLocked, unlockUserSlots, getLockedSlotsForCourt };

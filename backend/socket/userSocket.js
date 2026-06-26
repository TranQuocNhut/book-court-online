// backend/socket/userSocket.js
import { getLockedSlotsForCourt } from './bookingSocket.js';

/**
 * User namespace socket handlers
 * Handles events for regular users
 */
export default function userSocket(namespace) {
  namespace.on('connection', (socket) => {
    console.log(`✅ User connected [/user]: ${socket.userId} (${socket.user.email})`);

    // Join user's personal room
    socket.join(`user_${socket.userId}`);

    // Handle join facility room (to receive facility-specific updates)
    socket.on('join_facility', (facilityId) => {
      if (!facilityId) {
        socket.emit('error', { message: 'Facility ID is required' });
        return;
      }
      socket.join(`facility_${facilityId}`);
      console.log(`📌 User ${socket.userId} joined facility room: ${facilityId}`);
      socket.emit('joined_facility', { facilityId });
    });

    // Handle leave facility room
    socket.on('leave_facility', (facilityId) => {
      if (!facilityId) return;
      socket.leave(`facility_${facilityId}`);
      console.log(`User ${socket.userId} left facility room: ${facilityId}`);
      socket.emit('left_facility', { facilityId });
    });

    // Handle join court room (for real-time slot updates)
    socket.on('join_court', (data) => {
      const { courtId, facilityId, date } = typeof data === 'object' ? data : { courtId: data, facilityId: null, date: null };
      if (!courtId) {
        socket.emit('error', { message: 'Court ID is required' });
        return;
      }
      socket.join(`court_${courtId}`);
      console.log(`User ${socket.userId} joined court room: ${courtId}`);
      
      // Send all currently locked slots for this court to the user
      const lockedSlots = getLockedSlotsForCourt(courtId, date);
      if (lockedSlots.length > 0) {
        socket.emit('booking:locked:slots', { courtId, date, lockedSlots });
        console.log(`Sent ${lockedSlots.length} locked slots to user ${socket.userId} for court ${courtId}`);
      }
      
      socket.emit('joined_court', { courtId, facilityId });
    });

    // Handle leave court room
    socket.on('leave_court', (courtId) => {
      if (!courtId) return;
      socket.leave(`court_${courtId}`);
      console.log(`User ${socket.userId} left court room: ${courtId}`);
      socket.emit('left_court', { courtId });
    });

    // Handle ping (for connection health check)
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected [/user]: ${socket.userId} - Reason: ${reason}`);
      
      // Online status is handled in default namespace
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`User socket error [/user]: ${socket.userId}`, error);
    });
  });

  console.log('User namespace initialized');
}

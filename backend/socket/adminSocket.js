// backend/socket/adminSocket.js
/**
 * Admin namespace socket handlers
 * Handles events for administrators
 */
export default function adminSocket(namespace) {
  namespace.on('connection', (socket) => {
    console.log(`✅ Admin connected [/admin]: ${socket.userId} (${socket.user.email})`);

    // Verify user is actually an admin
    if (socket.userRole !== 'admin') {
      socket.emit('error', { message: 'Access denied: Admin namespace requires admin role' });
      socket.disconnect();
      return;
    }

    // Join admin rooms
    socket.join('admins');
    socket.join(`admin_${socket.userId}`);

    // Admin can join any facility
    socket.on('join_facility', (facilityId) => {
      if (!facilityId) {
        socket.emit('error', { message: 'Facility ID is required' });
        return;
      }
      socket.join(`facility_${facilityId}`);
      console.log(`📌 Admin ${socket.userId} joined facility room: ${facilityId}`);
      socket.emit('joined_facility', { facilityId });
    });

    socket.on('leave_facility', (facilityId) => {
      if (!facilityId) return;
      socket.leave(`facility_${facilityId}`);
      console.log(`👋 Admin ${socket.userId} left facility room: ${facilityId}`);
      socket.emit('left_facility', { facilityId });
    });

    // Handle request system stats
    socket.on('get_system_stats', () => {
      // This can be extended to fetch real-time system stats
      socket.emit('system_stats', { stats: {} });
    });

    // Handle ping
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`❌ Admin disconnected [/admin]: ${socket.userId} - Reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`❌ Admin socket error [/admin]: ${socket.userId}`, error);
    });
  });

  console.log('✅ Admin namespace initialized');
}

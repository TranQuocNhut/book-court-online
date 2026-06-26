// backend/socket/ownerSocket.js
import Facility from '../models/Facility.js';
import ChatMessage from '../models/ChatMessage.js';
import { getIO } from './index.js';

/**
 * Owner namespace socket handlers
 * Handles events for facility owners
 */
export default function ownerSocket(namespace) {
  namespace.on('connection', async (socket) => {
    console.log(`✅ Owner connected [/owner]: ${socket.userId} (${socket.user.email})`);

    // Verify user is actually an owner
    if (socket.userRole !== 'owner' && socket.userRole !== 'admin') {
      socket.emit('error', { message: 'Access denied: Owner namespace requires owner role' });
      socket.disconnect();
      return;
    }

    // Join owner rooms
    socket.join('owners');
    socket.join(`owner_${socket.userId}`);

    // Auto-join all facilities owned by this user
    try {
      const facilities = await Facility.find({ owner: socket.userId })
        .select('_id name')
        .lean();

      facilities.forEach(facility => {
        socket.join(`facility_${facility._id}`);
        console.log(`📌 Owner ${socket.userId} auto-joined facility: ${facility.name} (${facility._id})`);
      });
    } catch (error) {
      console.error(`Error loading owner facilities: ${error.message}`);
    }

    // Handle join facility room
    socket.on('join_facility', async (facilityId) => {
      if (!facilityId) {
        socket.emit('error', { message: 'Facility ID is required' });
        return;
      }

      try {
        // Verify ownership
        const facility = await Facility.findById(facilityId).select('owner').lean();
        if (!facility) {
          socket.emit('error', { message: 'Facility not found' });
          return;
        }

        const facilityOwnerId = facility.owner?.toString() || facility.owner;
        if (facilityOwnerId !== socket.userId && socket.userRole !== 'admin') {
          socket.emit('error', { message: 'You do not own this facility' });
          return;
        }

        socket.join(`facility_${facilityId}`);
        console.log(`📌 Owner ${socket.userId} joined facility room: ${facilityId}`);
        socket.emit('joined_facility', { facilityId });
      } catch (error) {
        socket.emit('error', { message: 'Error joining facility room' });
        console.error('Error in join_facility:', error);
      }
    });

    // Handle leave facility room
    socket.on('leave_facility', (facilityId) => {
      if (!facilityId) return;
      socket.leave(`facility_${facilityId}`);
      console.log(`👋 Owner ${socket.userId} left facility room: ${facilityId}`);
      socket.emit('left_facility', { facilityId });
    });

    // Handle request facility stats
    socket.on('get_facility_stats', async (facilityId) => {
      // This can be extended to fetch real-time stats
      socket.emit('facility_stats', { facilityId, stats: {} });
    });

    // ==================== CHAT HANDLERS ====================
    
    // Join conversation với một customer
    socket.on('chat:join_conversation', (customerId) => {
      if (!customerId) {
        socket.emit('chat:error', { message: 'Customer ID is required' });
        return;
      }
      
      const conversationRoom = `chat_${socket.userId}_${customerId}`;
      socket.join(conversationRoom);
      console.log(`💬 Owner ${socket.userId} joined conversation with customer ${customerId}`);
      socket.emit('chat:joined_conversation', { customerId });
    });

    // Leave conversation
    socket.on('chat:leave_conversation', (customerId) => {
      if (!customerId) return;
      
      const conversationRoom = `chat_${socket.userId}_${customerId}`;
      socket.leave(conversationRoom);
      console.log(`💬 Owner ${socket.userId} left conversation with customer ${customerId}`);
    });

    // Gửi tin nhắn
    socket.on('chat:send_message', async (data) => {
      try {
        const { customerId, message, facilityId } = data;

        if (!customerId || !message || !message.trim()) {
          socket.emit('chat:error', { message: 'Customer ID and message are required' });
          return;
        }

        // Tạo tin nhắn mới
        const chatMessage = new ChatMessage({
          sender: socket.userId,
          receiver: customerId,
          message: message.trim(),
          facility: facilityId || null,
        });

        await chatMessage.save();

        // Populate để lấy thông tin
        await chatMessage.populate('sender', 'name avatar');
        await chatMessage.populate('receiver', 'name avatar');

        const messageData = {
          id: chatMessage._id.toString(),
          text: chatMessage.message,
          sender: 'owner',
          senderAvatar: chatMessage.sender.avatar || null,
          receiverAvatar: chatMessage.receiver.avatar || null,
          timestamp: chatMessage.createdAt.getTime(),
          showTime: true,
          isRead: false,
        };

        // Gửi tin nhắn đến customer (qua default namespace)
        const io = getIO();
        io.to(`user_${customerId}`).emit('chat:new_message', {
          message: messageData,
          senderId: socket.userId,
          senderName: socket.user.name,
        });

        // Gửi lại cho owner để confirm
        socket.emit('chat:message_sent', { message: messageData });

        console.log(`💬 Owner ${socket.userId} sent message to customer ${customerId}`);
      } catch (error) {
        console.error('Error sending chat message:', error);
        socket.emit('chat:error', { message: 'Failed to send message' });
      }
    });

    // Lắng nghe tin nhắn từ customer (được gửi từ default namespace)
    socket.on('chat:customer_message', async (data) => {
      try {
        const { customerId, message, facilityId } = data;

        if (!customerId || !message) {
          return;
        }

        // Lưu tin nhắn vào database
        const chatMessage = new ChatMessage({
          sender: customerId,
          receiver: socket.userId,
          message: message.trim(),
          facility: facilityId || null,
        });

        await chatMessage.save();

        // Populate để lấy thông tin
        await chatMessage.populate('sender', 'name avatar');
        await chatMessage.populate('receiver', 'name avatar');

        const messageData = {
          id: chatMessage._id.toString(),
          text: chatMessage.message,
          sender: 'customer',
          senderAvatar: chatMessage.sender.avatar || null,
          receiverAvatar: chatMessage.receiver.avatar || null,
          timestamp: chatMessage.createdAt.getTime(),
          showTime: true,
          isRead: false,
        };

        // Gửi tin nhắn đến owner
        socket.emit('chat:new_message', {
          message: messageData,
          customerId,
        });

        console.log(`💬 Customer ${customerId} sent message to owner ${socket.userId}`);
      } catch (error) {
        console.error('Error receiving customer message:', error);
      }
    });

    // Handle typing indicator
    socket.on('chat:typing', (data) => {
      const { customerId, isTyping } = data;
      if (!customerId) return;

      const io = getIO();
      // Gửi typing status đến customer
      io.to(`user_${customerId}`).emit('chat:typing', {
        userId: socket.userId,
        isTyping: isTyping,
      });
    });

    // Đánh dấu tin nhắn đã đọc
    socket.on('chat:mark_read', async (messageIds) => {
      try {
        if (!Array.isArray(messageIds)) {
          messageIds = [messageIds];
        }

        await ChatMessage.updateMany(
          {
            _id: { $in: messageIds },
            receiver: socket.userId,
            isRead: false,
          },
          {
            $set: {
              isRead: true,
              readAt: new Date(),
            },
          }
        );

        socket.emit('chat:messages_read', { messageIds });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle ping
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`❌ Owner disconnected [/owner]: ${socket.userId} - Reason: ${reason}`);
      
      // Online status is handled in default namespace
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`❌ Owner socket error [/owner]: ${socket.userId}`, error);
    });
  });

  console.log('✅ Owner namespace initialized');
}

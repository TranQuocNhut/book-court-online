import axiosClient from "./axiosClient";

const chatApi = {
  // Lấy danh sách cuộc trò chuyện
  getConversations: async () => {
    const response = await axiosClient.get("/chat/conversations");
    return response.data;
  },

  // Lấy tin nhắn với một customer
  getMessages: async (customerId) => {
    const response = await axiosClient.get(`/chat/messages/${customerId}`);
    return response.data;
  },

  // Gửi tin nhắn
  sendMessage: async (customerId, message, facilityId = null) => {
    const response = await axiosClient.post("/chat/send", {
      customerId,
      message,
      facilityId,
    });
    return response.data;
  },

  // Đánh dấu tin nhắn đã đọc
  markAsRead: async (messageId) => {
    const response = await axiosClient.put(`/chat/messages/${messageId}/read`);
    return response.data;
  },

  // Lấy số tin nhắn chưa đọc
  getUnreadCount: async () => {
    const response = await axiosClient.get("/chat/unread-count");
    return response.data;
  },
};

export default chatApi;


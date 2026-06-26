import axiosClient from "./axiosClient";

const customerChatApi = {
  // Customer gửi tin nhắn đến owner
  sendMessage: async (ownerId, message, facilityId = null) => {
    const response = await axiosClient.post("/chat/customer/send", {
      ownerId,
      message,
      facilityId,
    });
    return response.data;
  },

  // Lấy tin nhắn với owner
  getMessages: async (ownerId) => {
    const response = await axiosClient.get(`/chat/customer/messages/${ownerId}`);
    return response.data;
  },
};

export default customerChatApi;


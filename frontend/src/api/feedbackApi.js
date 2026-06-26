// frontend/src/api/feedbackApi.js
import api from './axiosClient';

/**
 * Handle API success response
 */
const handleApiSuccess = (response) => {
  if (response.data?.success && response.data?.data) {
    return response.data.data;
  }
  return response.data || response;
};

/**
 * Handle API error response
 */
const handleApiError = (error) => {
  if (error.response?.data) {
    throw new Error(error.response.data.message || 'Có lỗi xảy ra');
  }
  throw error;
};

export const feedbackApi = {
  /**
   * Gửi phản hồi mới
   * @param {Object} feedbackData - Dữ liệu phản hồi
   * @param {string} feedbackData.senderName - Tên người gửi
   * @param {string} feedbackData.senderEmail - Email người gửi
   * @param {string} [feedbackData.senderPhone] - Số điện thoại (optional)
   * @param {string} feedbackData.type - Loại: "complaint" hoặc "feedback"
   * @param {string} feedbackData.subject - Tiêu đề
   * @param {string} feedbackData.content - Nội dung
   * @param {string} [feedbackData.relatedFacilityId] - ID cơ sở liên quan (optional)
   * @param {string} [feedbackData.relatedBookingId] - ID đặt sân liên quan (optional)
   */
  submitFeedback: async (feedbackData) => {
    try {
      const response = await api.post('/feedbacks', feedbackData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lấy danh sách phản hồi (Admin only)
   * @param {Object} params - Tham số tìm kiếm
   * @param {number} [params.page=1] - Trang hiện tại
   * @param {number} [params.limit=10] - Số lượng mỗi trang
   * @param {string} [params.type] - Lọc theo loại: "complaint" hoặc "feedback"
   * @param {string} [params.status] - Lọc theo trạng thái: "pending" hoặc "resolved"
   * @param {string} [params.search] - Tìm kiếm theo từ khóa
   */
  getFeedbacks: async (params = {}) => {
    try {
      const response = await api.get('/feedbacks', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lấy chi tiết phản hồi (Admin only)
   * @param {string} feedbackId - ID của phản hồi
   */
  getFeedbackById: async (feedbackId) => {
    try {
      const response = await api.get(`/feedbacks/${feedbackId}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Phản hồi và đánh dấu đã xử lý (Admin only)
   * @param {string} feedbackId - ID của phản hồi
   * @param {string} adminResponse - Nội dung phản hồi từ admin
   */
  resolveFeedback: async (feedbackId, adminResponse) => {
    try {
      const response = await api.patch(`/feedbacks/${feedbackId}/resolve`, {
        adminResponse,
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Xóa phản hồi (Admin only)
   * @param {string} feedbackId - ID của phản hồi
   */
  deleteFeedback: async (feedbackId) => {
    try {
      const response = await api.delete(`/feedbacks/${feedbackId}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default feedbackApi;


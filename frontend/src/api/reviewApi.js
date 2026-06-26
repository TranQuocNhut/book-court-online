// frontend/src/api/reviewApi.js
import api from './axiosClient';

/**
 * Handle API success response
 */
const handleApiSuccess = (response) => {
  // Backend returns: { success: true, data: { reviews, pagination, stats } }
  if (response.data?.success && response.data?.data) {
    // Return the data object directly (contains reviews, pagination, stats)
    return response.data.data;
  }
  // Fallback: return response.data if structure is different
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

export const reviewApi = {
  /**
   * Tạo đánh giá cho booking
   * @param {Object} reviewData - Dữ liệu review
   * @param {string} reviewData.bookingId - ID của booking
   * @param {number} reviewData.rating - Điểm đánh giá (1-5)
   * @param {string} [reviewData.comment] - Nội dung đánh giá (optional)
   */
  createReview: async (reviewData) => {
    try {
      const response = await api.post('/reviews', reviewData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lấy danh sách đánh giá của facility
   * @param {string} facilityId - ID của facility
   * @param {Object} params - Query parameters
   * @param {number} [params.page] - Số trang
   * @param {number} [params.limit] - Số lượng mỗi trang
   * @param {number} [params.rating] - Filter theo rating (1-5)
   */
  getFacilityReviews: async (facilityId, params = {}) => {
    try {
      const response = await api.get(`/reviews/facility/${facilityId}`, { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lấy danh sách đánh giá của user hiện tại
   * @param {Object} params - Query parameters
   * @param {number} [params.page] - Số trang
   * @param {number} [params.limit] - Số lượng mỗi trang
   */
  getMyReviews: async (params = {}) => {
    try {
      const response = await api.get('/reviews/my-reviews', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Cập nhật đánh giá
   * @param {string} reviewId - ID của review
   * @param {Object} updateData - Dữ liệu cập nhật
   * @param {number} [updateData.rating] - Điểm đánh giá mới (1-5)
   * @param {string} [updateData.comment] - Nội dung đánh giá mới
   */
  updateReview: async (reviewId, updateData) => {
    try {
      const response = await api.patch(`/reviews/${reviewId}`, updateData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Xóa đánh giá
   * @param {string} reviewId - ID của review
   */
  deleteReview: async (reviewId) => {
    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Owner trả lời đánh giá
   * @param {string} reviewId - ID của review
   * @param {string} reply - Nội dung phản hồi
   */
  replyToReview: async (reviewId, reply) => {
    try {
      const response = await api.post(`/reviews/${reviewId}/reply`, { reply });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Owner báo cáo đánh giá
   * @param {string} reviewId - ID của review
   * @param {string} reason - Lý do báo cáo
   */
  reportReview: async (reviewId, reason) => {
    try {
      const response = await api.post(`/reviews/${reviewId}/report`, { reason });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Admin xử lý báo cáo đánh giá
   * @param {string} reviewId - ID của review
   * @param {string} status - Trạng thái: "approved" hoặc "rejected"
   * @param {string} [adminNotes] - Ghi chú của admin (optional)
   */
  updateReportStatus: async (reviewId, status, adminNotes) => {
    try {
      const response = await api.patch(`/reviews/${reviewId}/report-status`, {
        status,
        adminNotes,
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lấy danh sách báo cáo đánh giá (Admin only)
   * @param {Object} params - Tham số tìm kiếm
   * @param {number} [params.page=1] - Trang hiện tại
   * @param {number} [params.limit=10] - Số lượng mỗi trang
   * @param {string} [params.status] - Lọc theo trạng thái: "pending", "approved", "rejected"
   * @param {string} [params.search] - Tìm kiếm theo từ khóa
   */
  getReviewReports: async (params = {}) => {
    try {
      const response = await api.get("/reviews/reports", { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default reviewApi;


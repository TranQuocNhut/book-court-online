import { api, handleApiError, handleApiSuccess } from './axiosClient';

export const loyaltyApi = {
  /**
   * Lấy thông tin tổng quan về điểm tích lũy
   * GET /api/loyalty/summary
   */
  getSummary: async () => {
    try {
      const response = await api.get('/loyalty/summary');
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lấy lịch sử giao dịch điểm
   * GET /api/loyalty/transactions
   * @param {Object} params - Query parameters (page, limit, type)
   */
  getHistory: async (params = {}) => {
    try {
      const response = await api.get('/loyalty/transactions', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lấy danh sách quà có thể đổi
   * GET /api/loyalty/rewards
   */
  getRewards: async () => {
    try {
      const response = await api.get('/loyalty/rewards');
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lấy thông tin các hạng thành viên
   * GET /api/loyalty/tiers
   */
  getTiers: async () => {
    try {
      const response = await api.get('/loyalty/tiers');
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Đổi điểm lấy quà
   * POST /api/loyalty/redeem
   * @param {string} rewardId - ID của quà muốn đổi
   */
  redeemReward: async (rewardId) => {
    try {
      const response = await api.post('/loyalty/redeem', { rewardId });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lấy danh sách voucher của user (từ reward)
   * GET /api/loyalty/vouchers
   * @param {Object} params - Query parameters (page, limit)
   */
  getMyVouchers: async (params = {}) => {
    try {
      const response = await api.get('/loyalty/vouchers', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Owner/Admin: Lấy tất cả rewards (bao gồm inactive)
   * GET /api/loyalty/admin/rewards
   */
  getAllRewards: async () => {
    try {
      const response = await api.get('/loyalty/admin/rewards');
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Owner/Admin: Tạo quà tặng mới
   * POST /api/loyalty/admin/rewards
   * @param {Object} rewardData - Dữ liệu quà tặng
   */
  createReward: async (rewardData) => {
    try {
      const response = await api.post('/loyalty/admin/rewards', rewardData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Owner/Admin: Cập nhật quà tặng
   * PUT /api/loyalty/admin/rewards/:id
   * @param {string} id - ID của quà tặng
   * @param {Object} rewardData - Dữ liệu cập nhật
   */
  updateReward: async (id, rewardData) => {
    try {
      const response = await api.put(`/loyalty/admin/rewards/${id}`, rewardData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Owner/Admin: Xóa quà tặng (soft delete)
   * DELETE /api/loyalty/admin/rewards/:id
   * @param {string} id - ID của quà tặng
   */
  deleteReward: async (id) => {
    try {
      const response = await api.delete(`/loyalty/admin/rewards/${id}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Owner/Admin: Upload ảnh cho quà tặng
   * POST /api/loyalty/admin/rewards/:id/upload
   * @param {string} id - ID của quà tặng
   * @param {File} image - File ảnh
   */
  uploadRewardImage: async (id, image) => {
    try {
      const formData = new FormData();
      formData.append('image', image);

      // Use fetch directly for multipart/form-data
      const token = localStorage.getItem('accessToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      
      const response = await fetch(`${apiUrl}/loyalty/admin/rewards/${id}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Upload ảnh thất bại');
      }

      return { success: true, data: data.data };
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default loyaltyApi;


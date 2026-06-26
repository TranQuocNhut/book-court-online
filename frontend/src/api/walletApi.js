import { api, handleApiError, handleApiSuccess } from './axiosClient';

export const walletApi = {
  /**
   * Lấy số dư ví của user hiện tại
   * GET /api/wallet/balance
   * @returns {Promise} Số dư ví
   */
  getBalance: async () => {
    try {
      const response = await api.get('/wallet/balance');
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lấy lịch sử giao dịch ví
   * GET /api/wallet/history
   * @param {Object} params - Query parameters
   * @param {number} [params.page] - Số trang
   * @param {number} [params.limit] - Số lượng mỗi trang
   * @param {string} [params.type] - Loại giao dịch ('top-up', 'payment', 'refund')
   * @param {string} [params.status] - Trạng thái ('pending', 'success', 'failed')
   * @returns {Promise} Lịch sử giao dịch với pagination
   */
  getHistory: async (params = {}) => {
    try {
      const response = await api.get('/wallet/history', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Khởi tạo nạp tiền vào ví
   * POST /api/wallet/top-up
   * @param {Object} data - Dữ liệu nạp tiền
   * @param {number} data.amount - Số tiền nạp (VND)
   * @param {string} data.method - Phương thức thanh toán ('momo', 'vnpay', 'payos')
   * @returns {Promise} Payment URL để redirect
   */
  initTopUp: async (data) => {
    try {
      const response = await api.post('/wallet/top-up', data);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};


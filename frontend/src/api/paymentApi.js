import { api, handleApiError, handleApiSuccess } from './axiosClient';

export const paymentApi = {
  /**
   * Khởi tạo thanh toán (MoMo, VNPay)
   * @param {string} bookingId - ID của booking
   * @param {string} method - Phương thức thanh toán ('momo' hoặc 'vnpay')
   * @returns {Promise<{success: boolean, data: {paymentUrl: string}}>}
   */
  initPayment: async (bookingId, method) => {
    try {
      const response = await api.post('/payments/init', {
        bookingId,
        method
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lấy trạng thái thanh toán
   * @param {string} paymentId - ID của payment
   * @returns {Promise<{success: boolean, data: {status: string}}>}
   */
  getPaymentStatus: async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}/status`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lấy lịch sử thanh toán của user
   * @param {Object} params - Query parameters
   * @param {number} [params.page] - Số trang
   * @param {number} [params.limit] - Số lượng mỗi trang
   * @returns {Promise<{success: boolean, data: {payments: Array, pagination: Object}}>}
   */
  getPaymentHistory: async (params = {}) => {
    try {
      const response = await api.get('/payments/history', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Thanh toán bằng ví tiền
   * @param {string} bookingId - ID của booking
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  payWithWallet: async (bookingId) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/pay-wallet`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Thanh toán phí giải đấu bằng ví
   * @param {string} leagueId - ID của league
   * @param {number} amount - Số tiền cần thanh toán
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  payTournamentFee: async (leagueId, amount) => {
    try {
      const response = await api.post(`/leagues/${leagueId}/pay-fee`, {
        amount,
        method: 'wallet'
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Hoàn tiền cho payment (Admin/Owner)
   * @param {string} paymentId - ID của payment
   * @param {number} [amount] - Số tiền hoàn (optional, mặc định là toàn bộ)
   * @param {string} [reason] - Lý do hoàn tiền
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  refundPayment: async (paymentId, amount, reason) => {
    try {
      const response = await api.post(`/payments/${paymentId}/refund`, {
        amount,
        reason
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
};


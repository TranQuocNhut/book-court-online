import { api, handleApiError, handleApiSuccess } from './axiosClient';

export const withdrawalApi = {
  /**
   * Lấy số dư hiện tại của owner
   * GET /api/withdrawals/balance
   * @returns {Promise} Số dư và thông tin tài khoản
   */
  getBalance: async () => {
    try {
      const response = await api.get('/withdrawals/balance');
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lấy lịch sử rút tiền
   * GET /api/withdrawals/history
   * @param {Object} params - Query parameters
   * @param {number} [params.page] - Số trang
   * @param {number} [params.limit] - Số lượng mỗi trang
   * @returns {Promise} Lịch sử rút tiền với pagination
   */
  getHistory: async (params = {}) => {
    try {
      const response = await api.get('/withdrawals/history', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Tạo yêu cầu rút tiền
   * POST /api/withdrawals/request
   * @param {Object} data - Dữ liệu rút tiền
   * @param {number} data.amount - Số tiền rút (VND)
   * @param {Object} data.bankAccount - Thông tin tài khoản ngân hàng
   * @param {string} data.bankAccount.accountNumber - Số tài khoản
   * @param {string} data.bankAccount.accountName - Tên chủ tài khoản
   * @param {string} data.bankAccount.bankCode - Mã ngân hàng (VCB, TCB, VTB, etc.)
   * @param {string} [data.bankAccount.bankName] - Tên ngân hàng
   * @returns {Promise} Thông tin yêu cầu rút tiền
   */
  requestWithdrawal: async (data) => {
    try {
      const response = await api.post('/withdrawals/request', data);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Kiểm tra trạng thái rút tiền
   * GET /api/withdrawals/:withdrawalId/status
   * @param {string} withdrawalId - ID của yêu cầu rút tiền
   * @returns {Promise} Trạng thái rút tiền
   */
  checkStatus: async (withdrawalId) => {
    try {
      const response = await api.get(`/withdrawals/${withdrawalId}/status`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lấy danh sách lệnh rút tiền từ PayOS
   * GET /api/withdrawals/payos/list
   * @param {Object} params - Query parameters
   * @param {number} [params.limit] - Số lượng kết quả (mặc định 10)
   * @param {number} [params.offset] - Vị trí bắt đầu (mặc định 0)
   * @param {string} [params.referenceId] - Mã tham chiếu để lọc
   * @param {string} [params.approvalState] - Trạng thái phê duyệt (SUCCEEDED, PENDING, FAILED, etc.)
   * @param {string} [params.category] - Danh mục để lọc
   * @param {string} [params.fromDate] - Lọc từ ngày (ISO 8601 format)
   * @param {string} [params.toDate] - Lọc đến ngày (ISO 8601 format)
   * @returns {Promise} Danh sách payouts và pagination
   */
  getPayosPayoutsList: async (params = {}) => {
    try {
      const response = await api.get('/withdrawals/payos/list', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};


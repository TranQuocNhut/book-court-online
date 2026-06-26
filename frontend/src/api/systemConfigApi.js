import { api, handleApiError, handleApiSuccess } from './axiosClient';

export const systemConfigApi = {
  /**
   * Lấy cấu hình hệ thống
   * GET /api/system-config
   */
  getSystemConfig: async () => {
    try {
      const response = await api.get('/system-config');
      return handleApiSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Cập nhật cấu hình hệ thống
   * PUT /api/system-config
   * @param {Object} configData - { serviceFeePercent: number } hoặc { platformFee: number }
   */
  updateSystemConfig: async (configData) => {
    try {
      const response = await api.put('/system-config', configData);
      return handleApiSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  },
};


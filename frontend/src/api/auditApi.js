import { api, handleApiError, handleApiSuccess } from './axiosClient';

/**
 * Audit API Service
 * 
 * This file handles audit log-related API operations for admin:
 * - Get activity logs
 * - Filter and search logs
 */

export const auditApi = {
  /**
   * Get audit logs (Admin only)
   * GET /api/audit/logs
   * @param {Object} params - Query parameters
   * @param {Number} params.page - Page number (default: 1)
   * @param {Number} params.limit - Items per page (default: 20)
   * @param {String} params.userId - Filter by user ID
   * @param {String} params.action - Filter by action
   * @param {String} params.search - Search query
   * @param {String} params.startDate - Start date (YYYY-MM-DD)
   * @param {String} params.endDate - End date (YYYY-MM-DD)
   * @returns {Promise} Audit logs with pagination
   */
  getAuditLogs: async (params = {}) => {
    try {
      const response = await api.get('/audit/logs', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default auditApi;


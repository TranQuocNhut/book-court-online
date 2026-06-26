import { api, handleApiError, handleApiSuccess } from './axiosClient';

/**
 * Partner Application API Service
 * 
 * This file handles partner application-related API operations such as:
 * - Creating a partner application
 * - Getting all partner applications (admin)
 * - Approving/rejecting partner applications (admin)
 */

export const partnerApi = {
  /**
   * Create a partner application
   * POST /api/partner-applications
   * @param {Object} applicationData - { name, email, phone }
   * @returns {Promise} Application object
   */
  createApplication: async (applicationData) => {
    try {
      const response = await api.post('/partner-applications', applicationData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get all partner applications (Admin only)
   * GET /api/partner-applications/admin/all?page=1&limit=10&status=xxx&search=xxx
   * @param {Object} params - { page?, limit?, status?, search? }
   * @returns {Promise} Applications list with pagination and stats
   */
  getAllApplications: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const url = `/partner-applications/admin/all${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Approve partner application (Admin only)
   * PUT /api/partner-applications/:id/approve
   * @param {String} applicationId
   * @returns {Promise} Updated application object
   */
  approveApplication: async (applicationId) => {
    try {
      const response = await api.put(`/partner-applications/${applicationId}/approve`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Reject partner application (Admin only)
   * PUT /api/partner-applications/:id/reject
   * @param {String} applicationId
   * @param {String} reason - Optional rejection reason
   * @returns {Promise} Updated application object
   */
  rejectApplication: async (applicationId, reason = '') => {
    try {
      const response = await api.put(`/partner-applications/${applicationId}/reject`, { reason });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default partnerApi;


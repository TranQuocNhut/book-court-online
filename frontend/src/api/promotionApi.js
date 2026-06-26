import { api, handleApiError, handleApiSuccess } from './axiosClient';

/**
 * Promotion API Service
 * 
 * This file handles promotion-related API operations such as:
 * - Getting promotion list
 * - Getting promotion details
 * - Creating a new promotion (admin)
 * - Updating promotion (admin)
 * - Deleting promotion (admin)
 * - Validating promotion code
 */

export const promotionApi = {
  /**
   * Get promotions list
   * GET /api/promotions
   * @param {Object} params - Query parameters (status, facilityId, code, page, limit, isActive)
   * @returns {Promise} Promotions list with pagination
   */
  getPromotions: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const url = `/promotions${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get promotion by ID
   * GET /api/promotions/:id
   * @param {String} promotionId - Promotion ID
   * @returns {Promise} Promotion object
   */
  getPromotionById: async (promotionId) => {
    try {
      const response = await api.get(`/promotions/${promotionId}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Validate promotion code
   * GET /api/promotions/validate/:code
   * @param {String} code - Promotion code
   * @param {String} facilityId - Optional facility ID
   * @param {String} area - Optional area
   * @returns {Promise} Validation result with promotion data if valid
   */
  validatePromotionCode: async (code, facilityId = null, area = null) => {
    try {
      const queryParams = new URLSearchParams();
      if (facilityId) queryParams.append('facilityId', facilityId);
      if (area) queryParams.append('area', area);
      
      const queryString = queryParams.toString();
      const url = `/promotions/validate/${code}${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Create a new promotion (admin only)
   * POST /api/promotions
   * @param {Object} promotionData - Promotion data object
   * @returns {Promise} Created promotion object
   */
  createPromotion: async (promotionData) => {
    try {
      const response = await api.post('/promotions', promotionData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update promotion (admin only)
   * PUT /api/promotions/:id
   * @param {String} promotionId - Promotion ID
   * @param {Object} promotionData - Updated promotion data
   * @returns {Promise} Updated promotion object
   */
  updatePromotion: async (promotionId, promotionData) => {
    try {
      const response = await api.put(`/promotions/${promotionId}`, promotionData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete promotion (admin only)
   * DELETE /api/promotions/:id
   * @param {String} promotionId - Promotion ID
   * @returns {Promise} Success message
   */
  deletePromotion: async (promotionId) => {
    try {
      const response = await api.delete(`/promotions/${promotionId}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Increment promotion usage count (internal)
   * PATCH /api/promotions/:id/usage
   * @param {String} promotionId - Promotion ID
   * @returns {Promise} Updated usage count
   */
  incrementUsage: async (promotionId) => {
    try {
      const response = await api.patch(`/promotions/${promotionId}/usage`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default promotionApi;


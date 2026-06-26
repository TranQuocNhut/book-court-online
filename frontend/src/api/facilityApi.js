import { api, handleApiError, handleApiSuccess } from './axiosClient';

/**
 * Facility API Service
 * 
 * This file handles facility-related API operations such as:
 * - Creating a new facility
 * - Getting facility list
 * - Getting facility details
 * - Updating facility
 * - Uploading facility images
 * - Deleting facility images
 */

// Get API base URL and access token helper
const getToken = () => localStorage.getItem('accessToken');
const getAPIBaseURL = () => import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const facilityApi = {
  /**
   * Create a new facility
   * POST /api/facilities
   * @param {Object} facilityData - Facility data object
   * @returns {Promise} Facility object
   */
  createFacility: async (facilityData) => {
    try {
      const response = await api.post('/facilities', facilityData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get facilities list
   * GET /api/facilities
   * @param {Object} params - Query parameters (page, limit, ownerId, type, address, etc.)
   * @returns {Promise} Facilities list with pagination
   */
  getFacilities: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const url = `/facilities${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get facility by ID
   * GET /api/facilities/:id
   * @param {String} facilityId - Facility ID
   * @returns {Promise} Facility object
   */
  getFacilityById: async (facilityId) => {
    try {
      const response = await api.get(`/facilities/${facilityId}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update facility
   * PUT /api/facilities/:id
   * @param {String} facilityId - Facility ID
   * @param {Object} facilityData - Updated facility data
   * @returns {Promise} Updated facility object
   */
  updateFacility: async (facilityId, facilityData) => {
    try {
      const response = await api.put(`/facilities/${facilityId}`, facilityData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Upload images to facility
   * POST /api/facilities/:id/upload
   * @param {String} facilityId - Facility ID
   * @param {Array<File>} images - Array of image files
   * @returns {Promise} Facility object with updated images
   */
  uploadImages: async (facilityId, images) => {
    try {
      if (!images || images.length === 0) {
        throw new Error('Không có ảnh để upload');
      }

      // Create FormData
      const formData = new FormData();
      images.forEach((image) => {
        formData.append('images', image);
      });

      // Use fetch directly for multipart/form-data (axios sometimes has issues with boundaries)
      const token = getToken();
      const API_BASE_URL = getAPIBaseURL();
      
      const response = await fetch(`${API_BASE_URL}/facilities/${facilityId}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - browser will add boundary automatically
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `Upload failed with status: ${response.status}` 
        }));
        throw new Error(errorData?.message || 'Upload ảnh thất bại');
      }

      const data = await response.json();
      
      if (data?.success) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Upload ảnh thành công',
        };
      } else {
        throw new Error(data?.message || 'Upload ảnh thất bại');
      }
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete facility image
   * DELETE /api/facilities/:id/images/:imageId
   * @param {String} facilityId - Facility ID
   * @param {String} imageId - Image ID
   * @returns {Promise} Success message
   */
  deleteImage: async (facilityId, imageId) => {
    try {
      const response = await api.delete(`/facilities/${facilityId}/images/${imageId}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete facility
   * DELETE /api/facilities/:id
   * @param {String} facilityId - Facility ID
   * @returns {Promise} Success message
   */
  deleteFacility: async (facilityId) => {
    try {
      const response = await api.delete(`/facilities/${facilityId}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Check if owner has any facilities
   * GET /api/facilities?ownerId=:ownerId&limit=1
   * @param {String} ownerId - Owner user ID
   * @returns {Promise<Boolean>} True if owner has at least one facility
   */
  checkOwnerHasFacility: async (ownerId) => {
    try {
      const response = await api.get(`/facilities?ownerId=${ownerId}&limit=1`);
      if (response.data?.success) {
        const facilities = response.data.data?.facilities || [];
        return facilities.length > 0;
      }
      return false;
    } catch (error) {
      console.error('Error checking owner facilities:', error);
      return false;
    }
  },

  // --- ADMIN ONLY OPERATIONS ---

  /**
   * Get all facilities (Admin only) with search and filters
   * GET /api/facilities/admin/all?page=1&limit=10&search=xxx&status=xxx&city=xxx&district=xxx&sport=xxx&date=xxx
   * @param {Object} params - { page?, limit?, search?, status?, city?, district?, sport?, date? }
   * @returns {Promise} Facilities list with pagination and stats
   */
  getAllFacilities: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const url = `/facilities/admin/all${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Approve facility (Admin only)
   * PUT /api/facilities/:id/approve
   * @param {String} facilityId
   * @returns {Promise} Updated facility object
   */
  approveFacility: async (facilityId) => {
    try {
      const response = await api.put(`/facilities/${facilityId}/approve`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Reject facility (Admin only)
   * PUT /api/facilities/:id/reject
   * @param {String} facilityId
   * @param {String} reason - Optional rejection reason
   * @returns {Promise} Updated facility object
   */
  rejectFacility: async (facilityId, reason = '') => {
    try {
      const response = await api.put(`/facilities/${facilityId}/reject`, { reason });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get featured facilities (top rated facilities)
   * GET /api/facilities/featured
   * @param {Object} params - Query parameters (limit?)
   * @returns {Promise} Featured facilities list
   */
  getFeaturedFacilities: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const url = `/facilities/featured${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get recent facilities (newest facilities)
   * GET /api/facilities/recent
   * @param {Object} params - Query parameters (limit?, skip?)
   * @returns {Promise} Recent facilities list
   */
  getRecentFacilities: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const url = `/facilities/recent${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get popular cities (top 6 cities with most facilities)
   * GET /api/facilities/popular-cities
   * @returns {Promise} Array of cities with count
   */
  getPopularCities: async () => {
    try {
      const response = await api.get('/facilities/popular-cities');
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get tournament fee configuration from facility owner
   * GET /api/facilities/:id/tournament-fee-config
   * @param {string} facilityId - Facility ID
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  getTournamentFeeConfig: async (facilityId) => {
    try {
      const response = await api.get(`/facilities/${facilityId}/tournament-fee-config`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default facilityApi;


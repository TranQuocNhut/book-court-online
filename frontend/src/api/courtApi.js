import { api, handleApiError, handleApiSuccess } from './axiosClient';

/**
 * Court API Service
 * 
 * This file handles court-related API operations such as:
 * - Creating a new court
 * - Getting court list
 * - Getting court details
 * - Updating court
 * - Uploading court images
 * - Deleting court images
 * - Updating court status
 */

// Get API base URL and access token helper
const getToken = () => localStorage.getItem('accessToken');
const getAPIBaseURL = () => import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const courtApi = {
  /**
   * Create a new court
   * POST /api/courts
   * @param {Object} courtData - Court data object
   * @returns {Promise} Court object
   */
  createCourt: async (courtData) => {
    try {
      const response = await api.post('/courts', courtData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get courts list
   * GET /api/courts
   * @param {Object} params - Query parameters (page, limit, facility, status, etc.)
   * @returns {Promise} Courts list with pagination
   */
  getCourts: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const url = `/courts${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get court by ID
   * GET /api/courts/:id
   * @param {String} courtId - Court ID
   * @returns {Promise} Court object
   */
  getCourtById: async (courtId) => {
    try {
      const response = await api.get(`/courts/${courtId}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update court
   * PUT /api/courts/:id
   * @param {String} courtId - Court ID
   * @param {Object} courtData - Updated court data
   * @returns {Promise} Updated court object
   */
  updateCourt: async (courtId, courtData) => {
    try {
      const response = await api.put(`/courts/${courtId}`, courtData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Upload images to court
   * POST /api/courts/:id/upload
   * @param {String} courtId - Court ID
   * @param {Array<File>} images - Array of image files
   * @returns {Promise} Court object with updated images
   */
  uploadImages: async (courtId, images) => {
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
      
      const response = await fetch(`${API_BASE_URL}/courts/${courtId}/upload`, {
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
   * Delete court image
   * DELETE /api/courts/:id/images/:imageId
   * @param {String} courtId - Court ID
   * @param {String} imageId - Image ID
   * @returns {Promise} Success message
   */
  deleteImage: async (courtId, imageId) => {
    try {
      const response = await api.delete(`/courts/${courtId}/images/${imageId}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update court status
   * PATCH /api/courts/:id/status
   * @param {String} courtId - Court ID
   * @param {String} status - New status (active, maintenance, inactive)
   * @returns {Promise} Updated court object
   */
  updateStatus: async (courtId, status) => {
    try {
      const response = await api.patch(`/courts/${courtId}/status`, { status });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete court
   * DELETE /api/courts/:id
   * @param {String} courtId - Court ID
   * @returns {Promise} Success message
   */
  deleteCourt: async (courtId) => {
    try {
      const response = await api.delete(`/courts/${courtId}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default courtApi;


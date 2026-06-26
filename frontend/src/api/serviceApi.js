import { api, handleApiError, handleApiSuccess } from './axiosClient';

export const serviceApi = {
  /**
   * Lấy tất cả dịch vụ của owner
   * GET /api/services
   * @param {Object} params - Query parameters (type, isActive)
   */
  getAllServices: async (params = {}) => {
    try {
      const response = await api.get('/services', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Tạo dịch vụ mới
   * POST /api/services
   * @param {Object} serviceData - Dữ liệu dịch vụ
   */
  createService: async (serviceData) => {
    try {
      const response = await api.post('/services', serviceData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Cập nhật dịch vụ
   * PUT /api/services/:id
   * @param {string} id - ID của dịch vụ
   * @param {Object} serviceData - Dữ liệu cập nhật
   */
  updateService: async (id, serviceData) => {
    try {
      const response = await api.put(`/services/${id}`, serviceData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Xóa dịch vụ
   * DELETE /api/services/:id
   * @param {string} id - ID của dịch vụ
   */
  deleteService: async (id) => {
    try {
      const response = await api.delete(`/services/${id}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Toggle active status
   * PATCH /api/services/:id/toggle-active
   * @param {string} id - ID của dịch vụ
   */
  toggleActive: async (id) => {
    try {
      const response = await api.patch(`/services/${id}/toggle-active`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lấy dịch vụ theo facility (Public)
   * GET /api/services/facility/:facilityId
   * @param {string} facilityId - ID của facility
   * @param {Object} params - Query parameters (type, sportCategory)
   */
  getServicesByFacility: async (facilityId, params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const url = `/services/facility/${facilityId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Upload ảnh cho dịch vụ
   * POST /api/services/:id/upload
   * @param {string} id - ID của dịch vụ
   * @param {File} image - File ảnh
   */
  uploadServiceImage: async (id, image) => {
    try {
      const formData = new FormData();
      formData.append('image', image);

      // Use fetch directly for multipart/form-data
      const token = localStorage.getItem('accessToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      
      const response = await fetch(`${apiUrl}/services/${id}/upload`, {
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

export default serviceApi;


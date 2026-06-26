import { api, handleApiError, handleApiSuccess } from './axiosClient';

/**
 * Category API Service
 * Handles sport category and court type operations
 */

export const categoryApi = {
  /**
   * Sport Category APIs
   */

  // Get all sport categories
  getSportCategories: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const url = `/sport-categories${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get sport category by ID
  getSportCategoryById: async (id) => {
    try {
      const response = await api.get(`/sport-categories/${id}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Create sport category
  createSportCategory: async (categoryData) => {
    try {
      const response = await api.post('/sport-categories', categoryData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update sport category
  updateSportCategory: async (id, categoryData) => {
    try {
      const response = await api.put(`/sport-categories/${id}`, categoryData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete sport category
  deleteSportCategory: async (id) => {
    try {
      const response = await api.delete(`/sport-categories/${id}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Court Type APIs
   */

  // Get all court types
  getCourtTypes: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const url = `/court-types${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get court type by ID
  getCourtTypeById: async (id) => {
    try {
      const response = await api.get(`/court-types/${id}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Create court type
  createCourtType: async (courtTypeData) => {
    try {
      const response = await api.post('/court-types', courtTypeData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update court type
  updateCourtType: async (id, courtTypeData) => {
    try {
      const response = await api.put(`/court-types/${id}`, courtTypeData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete court type
  deleteCourtType: async (id) => {
    try {
      const response = await api.delete(`/court-types/${id}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};


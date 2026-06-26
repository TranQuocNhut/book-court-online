import { api, handleApiError, handleApiSuccess } from './axiosClient';

export const aiApi = {
  /**
   * Chat with AI assistant
   * @param {string} message - User message
   * @param {Array} conversationHistory - Previous conversation history
   * @param {Object} userLocation - User location {lat, lng}
   * @param {string} sportCategoryId - Sport category ID (optional)
   * @param {number} radius - Search radius in meters (optional)
   * @returns {Promise} AI response
   */
  chat: async (message, conversationHistory = [], userLocation = null, sportCategoryId = null, radius = null) => {
    try {
      const response = await api.post('/ai/chat', {
        message,
        conversationHistory,
        userLocation,
        sportCategoryId,
        radius
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get facility suggestions
   * @param {Object} params - Query parameters
   * @param {string} params.query - Search query
   * @param {number} params.lat - Latitude
   * @param {number} params.lng - Longitude
   * @param {number} params.maxDistance - Max distance in meters
   * @returns {Promise} Facility suggestions
   */
  suggestFacilities: async (params = {}) => {
    try {
      const response = await api.get('/ai/suggest-facilities', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get booking data (sport categories and court types)
   * @param {string} sportCategoryId - Optional sport category ID to get court types
   * @returns {Promise} Booking data
   */
  getBookingData: async (sportCategoryId = null) => {
    try {
      const params = sportCategoryId ? { sportCategoryId } : {};
      const response = await api.get('/ai/booking-data', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Search facilities for booking
   * @param {Object} data - Search parameters
   * @param {string} data.sportCategoryId - Sport category ID
   * @param {string} data.courtTypeId - Court type ID
   * @param {Array<string>} data.timeSlots - Time slots array
   * @param {string} data.date - Booking date (ISO string)
   * @param {Object} data.userLocation - User location {lat, lng}
   * @returns {Promise} Available facilities
   */
  searchBookingFacilities: async (data) => {
    try {
      const response = await api.post('/ai/booking-search', data);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Search facilities with suggestions (price range, radius, time slots)
   * @param {Object} data - Search parameters
   * @param {string} data.sportCategoryId - Sport category ID
   * @param {Array<string>} data.timeSlots - Time slots array
   * @param {string} data.date - Booking date (ISO string)
   * @param {Object} data.userLocation - User location {lat, lng}
   * @param {number} data.priceMin - Minimum price
   * @param {number} data.priceMax - Maximum price
   * @param {number} data.radius - Radius in meters
   * @returns {Promise} Available facilities
   */
  searchSuggestFacilities: async (data) => {
    try {
      const response = await api.post('/ai/suggest-search', data);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default aiApi;


// frontend/src/api/notificationApi.js
import api from './axiosClient';

/**
 * Handle API success response
 */
const handleApiSuccess = (response) => {
  if (response.data?.success) {
    return response.data.data || response.data;
  }
  return response.data;
};

/**
 * Handle API error response
 */
const handleApiError = (error) => {
  if (error.response?.data) {
    throw new Error(error.response.data.message || 'Có lỗi xảy ra');
  }
  throw error;
};

export const notificationApi = {
  /**
   * Get notifications for current user
   * @param {Object} params - Query parameters
   * @param {string} params.type - Filter by type (booking, payment, cancellation, etc.)
   * @param {boolean} params.isRead - Filter by read status
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   */
  getNotifications: async (params = {}) => {
    try {
      const response = await api.get('/notifications', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get unread count
   */
  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   */
  markAsRead: async (notificationId) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    try {
      const response = await api.patch('/notifications/mark-all-read');
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   */
  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete all read notifications
   * @param {string} type - Optional: delete only notifications of this type
   */
  deleteAllRead: async (type = null) => {
    try {
      const params = type ? { type } : {};
      const response = await api.delete('/notifications', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default notificationApi;


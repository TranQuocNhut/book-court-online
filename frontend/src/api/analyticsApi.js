import { api, handleApiError, handleApiSuccess } from './axiosClient';

/**
 * Analytics API Service
 * 
 * This file handles analytics-related API operations for owners:
 * - Dashboard statistics
 * - Revenue analytics
 * - Booking analytics
 * - Court statistics
 */

export const analyticsApi = {
  /**
   * Get owner dashboard statistics
   * GET /api/analytics/owner/dashboard?facilityId=xxx&period=month
   * @param {String} facilityId - Facility ID
   * @param {String} period - Period: 'day', 'week', 'month' (default: 'month')
   * @returns {Promise} Dashboard statistics
   */
  getOwnerDashboard: async (facilityId, period = 'month') => {
    try {
      if (!facilityId) {
        throw new Error('facilityId is required');
      }
      const response = await api.get('/analytics/owner/dashboard', {
        params: { facilityId, period },
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get owner revenue statistics
   * GET /api/analytics/owner/revenue?facilityId=xxx&startDate=xxx&endDate=xxx
   * @param {String} facilityId - Facility ID
   * @param {String} startDate - Start date (YYYY-MM-DD)
   * @param {String} endDate - End date (YYYY-MM-DD)
   * @returns {Promise} Revenue statistics
   */
  getOwnerRevenue: async (facilityId, startDate, endDate) => {
    try {
      if (!facilityId) {
        throw new Error('facilityId is required');
      }
      const params = { facilityId };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await api.get('/analytics/owner/revenue', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get owner booking statistics
   * GET /api/analytics/owner/bookings?facilityId=xxx&startDate=xxx&endDate=xxx
   * @param {String} facilityId - Facility ID
   * @param {String} startDate - Start date (YYYY-MM-DD)
   * @param {String} endDate - End date (YYYY-MM-DD)
   * @returns {Promise} Booking statistics
   */
  getOwnerBookings: async (facilityId, startDate, endDate) => {
    try {
      if (!facilityId) {
        throw new Error('facilityId is required');
      }
      const params = { facilityId };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await api.get('/analytics/owner/bookings', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get owner court statistics
   * GET /api/analytics/owner/courts?facilityId=xxx&startDate=xxx&endDate=xxx
   * @param {String} facilityId - Facility ID
   * @param {String} startDate - Start date (YYYY-MM-DD) - optional
   * @param {String} endDate - End date (YYYY-MM-DD) - optional
   * @returns {Promise} Court statistics
   */
  getOwnerCourts: async (facilityId, startDate, endDate) => {
    try {
      if (!facilityId) {
        throw new Error('facilityId is required');
      }
      const params = { facilityId };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await api.get('/analytics/owner/courts', {
        params,
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get owner peak hours statistics
   * GET /api/analytics/owner/peak-hours?facilityId=xxx&startDate=xxx&endDate=xxx
   * @param {String} facilityId - Facility ID
   * @param {String} startDate - Start date (YYYY-MM-DD)
   * @param {String} endDate - End date (YYYY-MM-DD)
   * @returns {Promise} Peak hours statistics
   */
  getOwnerPeakHours: async (facilityId, startDate, endDate) => {
    try {
      if (!facilityId) {
        throw new Error('facilityId is required');
      }
      const params = { facilityId };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await api.get('/analytics/owner/peak-hours', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get owner loyal customers statistics
   * GET /api/analytics/owner/loyal-customers?facilityId=xxx
   * @param {String} facilityId - Facility ID
   * @returns {Promise} Loyal customers statistics
   */
  getOwnerLoyalCustomers: async (facilityId) => {
    try {
      if (!facilityId) {
        throw new Error('facilityId is required');
      }
      const response = await api.get('/analytics/owner/loyal-customers', {
        params: { facilityId },
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get owner cancellation statistics
   * GET /api/analytics/owner/cancellations?facilityId=xxx&startDate=xxx&endDate=xxx
   * @param {String} facilityId - Facility ID
   * @param {String} startDate - Start date (YYYY-MM-DD)
   * @param {String} endDate - End date (YYYY-MM-DD)
   * @returns {Promise} Cancellation statistics
   */
  getOwnerCancellations: async (facilityId, startDate, endDate) => {
    try {
      if (!facilityId) {
        throw new Error('facilityId is required');
      }
      const params = { facilityId };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await api.get('/analytics/owner/cancellations', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get owner today schedule
   * GET /api/analytics/owner/today-schedule?facilityId=xxx
   * @param {String} facilityId - Facility ID
   * @returns {Promise} Today schedule with time slots
   */
  getOwnerTodaySchedule: async (facilityId) => {
    try {
      if (!facilityId) {
        throw new Error('facilityId is required');
      }
      const response = await api.get('/analytics/owner/today-schedule', {
        params: { facilityId },
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get admin platform fee statistics
   * GET /api/analytics/admin/platform-fee
   * @returns {Promise} Platform fee statistics (totalPlatformFee, totalRevenue, etc.)
   */
  getAdminPlatformFee: async () => {
    try {
      const response = await api.get('/analytics/admin/platform-fee');
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get admin dashboard statistics
   * GET /api/analytics/admin/dashboard?period=month
   * @param {String} period - Period: 'day', 'week', 'month' (default: 'month')
   * @returns {Promise} Dashboard statistics
   */
  getAdminDashboard: async (period = 'month') => {
    try {
      const response = await api.get('/analytics/admin/dashboard', {
        params: { period },
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get admin revenue statistics by period
   * GET /api/analytics/admin/revenue?period=month&year=2025
   * @param {String} period - Period: 'month' or 'quarter' (default: 'month')
   * @param {Number} year - Year (default: current year)
   * @returns {Promise} Revenue statistics by period
   */
  getAdminRevenue: async (period = 'month', year) => {
    try {
      const params = { period };
      if (year) params.year = year;
      
      const response = await api.get('/analytics/admin/revenue', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get admin facility statistics
   * GET /api/analytics/admin/facility-stats
   * @returns {Promise} Facility statistics (active, paused, maintenance, total)
   */
  getAdminFacilityStats: async () => {
    try {
      const response = await api.get('/analytics/admin/facility-stats');
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get admin peak hours statistics
   * GET /api/analytics/admin/peak-hours?startDate=xxx&endDate=xxx
   * @param {String} startDate - Start date (YYYY-MM-DD) - optional
   * @param {String} endDate - End date (YYYY-MM-DD) - optional
   * @returns {Promise} Peak hours statistics
   */
  getAdminPeakHours: async (startDate, endDate) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await api.get('/analytics/admin/peak-hours', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get admin top facilities statistics
   * GET /api/analytics/admin/top-facilities?startDate=xxx&endDate=xxx&limit=10
   * @param {String} startDate - Start date (YYYY-MM-DD) - optional
   * @param {String} endDate - End date (YYYY-MM-DD) - optional
   * @param {Number} limit - Limit number of results (default: 10)
   * @returns {Promise} Top facilities statistics
   */
  getAdminTopFacilities: async (startDate, endDate, limit = 10) => {
    try {
      const params = { limit };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await api.get('/analytics/admin/top-facilities', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get admin top owners statistics
   * GET /api/analytics/admin/top-owners?startDate=xxx&endDate=xxx&limit=10
   * @param {String} startDate - Start date (YYYY-MM-DD) - optional
   * @param {String} endDate - End date (YYYY-MM-DD) - optional
   * @param {Number} limit - Limit number of results (default: 10)
   * @returns {Promise} Top owners statistics
   */
  getAdminTopOwners: async (startDate, endDate, limit = 10) => {
    try {
      const params = { limit };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await api.get('/analytics/admin/top-owners', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get admin dashboard overview (KPI, charts, top facilities)
   * GET /api/analytics/admin/dashboard-overview?range=Today|7d|30d
   * @param {String} range - Time range: 'Today', '7d', or '30d' (default: '30d')
   * @returns {Promise} Dashboard overview data
   */
  getAdminDashboardOverview: async (range = '30d') => {
    try {
      const response = await api.get('/analytics/admin/dashboard-overview', {
        params: { range },
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default analyticsApi;


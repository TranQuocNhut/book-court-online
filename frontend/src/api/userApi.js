import { api, handleApiError, handleApiSuccess } from './axiosClient';

/**
 * User API Service
 * 
 * This file handles user-related API operations such as:
 * - Getting current user profile
 * - Updating user profile
 * - Managing avatar
 * - Updating language preference
 * - Changing password
 * - Admin operations on users
 */

export const userApi = {
  /**
   * Get current user profile
   * GET /api/users/profile
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/profile');
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update user profile
   * PUT /api/users/profile
   * @param {Object} userData - { name?, phone? }
   */
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/users/profile', userData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Upload avatar
   * POST /api/users/avatar
   * @param {File} file - Avatar image file
   */
  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await api.upload('/users/avatar', formData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete avatar
   * DELETE /api/users/avatar
   */
  deleteAvatar: async () => {
    try {
      const response = await api.delete('/users/avatar');
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update language preference
   * PATCH /api/users/language
   * @param {string} language - 'vi' or 'en'
   */
  updateLanguage: async (language) => {
    try {
      const response = await api.patch('/users/language', { language });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get user favorites
   * GET /api/users/favorites
   * @returns {Promise} List of favorite facilities
   */
  getFavorites: async () => {
    try {
      const response = await api.get('/users/favorites');
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Add facility to favorites
   * POST /api/users/favorites/:facilityId
   * @param {string} facilityId - Facility ID
   * @returns {Promise} Success message
   */
  addFavorite: async (facilityId) => {
    try {
      const response = await api.post(`/users/favorites/${facilityId}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Remove facility from favorites
   * DELETE /api/users/favorites/:facilityId
   * @param {string} facilityId - Facility ID
   * @returns {Promise} Success message
   */
  removeFavorite: async (facilityId) => {
    try {
      const response = await api.delete(`/users/favorites/${facilityId}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Change password
   * PUT /api/users/change-password
   * @param {string} currentPassword
   * @param {string} newPassword
   */
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/users/change-password', {
        currentPassword,
        newPassword
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete own account
   * DELETE /api/users/account
   * @returns {Promise} Success message
   */
  deleteAccount: async () => {
    try {
      const response = await api.delete('/users/account');
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // --- ADMIN ONLY OPERATIONS ---

  /**
   * Get all users (Admin only) with search and filters
   * GET /api/users?page=1&limit=10&search=xxx&role=xxx&status=xxx
   * @param {Object} params - { page?, limit?, search?, role?, status? }
   */
  getAllUsers: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const url = `/users${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get user by ID (Admin only)
   * GET /api/users/:userId
   * @param {string} userId
   */
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Change user role (Admin only)
   * PUT /api/users/role/:userId
   * @param {string} userId
   * @param {string} role - 'user', 'owner', or 'admin'
   */
  changeUserRole: async (userId, role) => {
    try {
      const response = await api.put(`/users/role/${userId}`, { role });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lock user account (Admin only)
   * PATCH /api/users/:userId/lock
   * @param {string} userId
   */
  lockUser: async (userId) => {
    try {
      const response = await api.patch(`/users/${userId}/lock`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Unlock user account (Admin only)
   * PATCH /api/users/:userId/unlock
   * @param {string} userId
   */
  unlockUser: async (userId) => {
    try {
      const response = await api.patch(`/users/${userId}/unlock`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete user (soft delete, Admin only)
   * DELETE /api/users/:userId
   * @param {string} userId
   */
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/users/${userId}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Restore deleted user (Admin only)
   * PATCH /api/users/:userId/restore
   * @param {string} userId
   */
  restoreUser: async (userId) => {
    try {
      const response = await api.patch(`/users/${userId}/restore`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get tournament fee configuration (Owner only)
   * GET /api/users/tournament-fee-config
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  getTournamentFeeConfig: async () => {
    try {
      const response = await api.get('/users/tournament-fee-config');
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update tournament fee configuration (Owner only)
   * PUT /api/users/tournament-fee-config
   * @param {Object} config - Tournament fee configuration
   * @param {number} [config.registrationFee] - Registration fee
   * @param {Object} [config.internalTournamentFees] - Internal tournament fees
   * @param {number} [config.internalTournamentFees.serviceFee] - Service fee
   * @param {Object} [config.internalTournamentFees.courtTypeFees] - Court type fees (courtTypeId -> fee)
   * @param {number} [config.internalTournamentFees.refereeFee] - Referee fee
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  updateTournamentFeeConfig: async (config) => {
    try {
      const response = await api.put('/users/tournament-fee-config', config);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get bank account information (Owner only)
   * GET /api/users/bank-account
   * @returns {Promise<{success: boolean, data: {bankAccount: Object}}>}
   */
  getBankAccount: async () => {
    try {
      const response = await api.get('/users/bank-account');
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update bank account information (Owner only)
   * PUT /api/users/bank-account
   * @param {Object} bankAccount - Bank account information
   * @param {string} bankAccount.accountNumber - Account number
   * @param {string} bankAccount.accountName - Account holder name
   * @param {string} bankAccount.bankCode - Bank code (VCB, TCB, etc.)
   * @param {string} [bankAccount.bankName] - Bank name
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  updateBankAccount: async (bankAccount) => {
    try {
      const response = await api.put('/users/bank-account', bankAccount);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

export default userApi;

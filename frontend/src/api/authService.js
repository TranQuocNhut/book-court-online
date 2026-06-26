import { api, handleApiError, handleApiSuccess } from './axiosClient';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './axiosClient';
import { userApi } from './userApi';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Auth service functions
export const authService = {
  // Register with email
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Verify OTP
  verifyOtp: async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Login with email/password
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const result = handleApiSuccess(response);
      
      // Store tokens
      if (result.data.accessToken && result.data.refreshToken) {
        setTokens({
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken
        });
      }
      
      return result;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Login with Google OAuth2
  loginWithGoogle: () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Reset password
  resetPassword: async (token, password) => {
    try {
      const response = await api.post(`/auth/reset-password/${token}`, { password });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get user sessions
  getSessions: async () => {
    try {
      const response = await api.get('/auth/sessions');
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete session
  deleteSession: async (sessionId) => {
    try {
      const response = await api.delete(`/auth/sessions/${sessionId}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Logout
  logout: async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
      clearTokens();
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      // Even if logout fails, clear local tokens
      clearTokens();
      console.error('Logout error:', error);
      return { success: true, message: 'Logged out locally' };
    }
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get tokens from localStorage
  getTokens: () => {
    return {
      accessToken: getAccessToken(),
      refreshToken: getRefreshToken()
    };
  },

  // Set tokens in localStorage
  setTokens,

  // Clear tokens from localStorage
  clearTokens,

  // Redirect to userApi for user-related operations (for backward compatibility)
  getCurrentUser: userApi.getCurrentUser,
  updateProfile: userApi.updateProfile,
  uploadAvatar: userApi.uploadAvatar,
  deleteAvatar: userApi.deleteAvatar,
  changePassword: userApi.changePassword
};

export default authService;

import axios from 'axios';

// API base URL - có thể thay đổi theo environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management functions
export const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

export const setTokens = ({ accessToken, refreshToken }) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Refresh token queue management
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Nếu đang refresh, đợi và retry sau
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          // Try to refresh token
          const response = await refreshTokenRequest(refreshToken);
          const { accessToken, refreshToken: newRefreshToken, user } = response.data.data;
          
          // Update tokens
          setTokens({ accessToken, refreshToken: newRefreshToken });
          
          // Dispatch custom event to notify AuthContext
          window.dispatchEvent(new CustomEvent('tokenRefreshed', {
            detail: {
              accessToken,
              refreshToken: newRefreshToken,
              user
            }
          }));
          
          // Process queued requests
          processQueue(null, accessToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } else {
          // No refresh token available
          processQueue(error);
          clearTokens();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        processQueue(refreshError);
        // Clear tokens and redirect to login
        clearTokens();
        
        // Dispatch logout event
        window.dispatchEvent(new CustomEvent('tokenRefreshFailed'));
        
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors
    if (error.response?.status === 403) {
      console.error('Access forbidden - insufficient permissions');
    }

    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

// Helper function for refresh token request (bypasses interceptor)
const refreshTokenRequest = async (refreshToken) => {
  return axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
};

// Generic API methods
export const api = {
  // GET request
  get: (url, config = {}) => apiClient.get(url, config),
  
  // POST request
  post: (url, data = {}, config = {}) => apiClient.post(url, data, config),
  
  // PUT request
  put: (url, data = {}, config = {}) => apiClient.put(url, data, config),
  
  // PATCH request
  patch: (url, data = {}, config = {}) => apiClient.patch(url, data, config),
  
  // DELETE request
  delete: (url, config = {}) => apiClient.delete(url, config),
  
  // Upload file
  upload: (url, formData, config = {}) => {
    return apiClient.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers,
      },
    });
  },
};

// Error handling helper
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return {
      status,
      message: data?.message || 'An error occurred',
      errors: data?.errors || [],
      debug: data?.debug, // Include debug info if available
      responseData: data, // Include full response data
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      status: 0,
      message: 'Network error - please check your connection',
      errors: [],
    };
  } else {
    // Something else happened
    return {
      status: 0,
      message: error.message || 'An unexpected error occurred',
      errors: [],
    };
  }
};

// Success response helper
export const handleApiSuccess = (response) => {
  return {
    success: true,
    data: response.data?.data || response.data,
    message: response.data?.message || 'Success',
  };
};

// Export the configured axios instance
export default apiClient;
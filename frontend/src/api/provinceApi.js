/**
 * Province API Service
 * Handles fetching provinces and districts data from Vietnam administrative API
 * Uses backend proxy to avoid CORS issues
 */

import apiClient from './axiosClient';

/**
 * Fetch provinces with districts (depth=2)
 * @returns {Promise<Object>} Object with success flag and data array
 */
export const getProvinces = async () => {
  try {
    // Gọi API qua backend (không còn CORS issue)
    // Tăng timeout lên 20 giây vì API province có thể mất thời gian
    const response = await apiClient.get('/provinces', {
      timeout: 20000, // 20 seconds
    });

    if (response.data && response.data.success) {
      return {
        success: true,
        data: response.data.data || [],
      };
    }

    // Fallback nếu response format khác
    if (response.data && Array.isArray(response.data)) {
      return {
        success: true,
        data: response.data,
      };
    }

    return {
      success: false,
      data: [],
      error: response.data?.error || 'Không thể tải danh sách tỉnh thành.',
    };
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return {
      success: false,
      data: [],
      error:
        error.response?.data?.error ||
        error.message ||
        'Không thể tải danh sách tỉnh thành. Vui lòng thử lại sau.',
    };
  }
};

/**
 * Get districts for a specific province
 * @param {string} provinceName - Name of the province
 * @param {Array} provinces - Array of all provinces
 * @returns {Array} Array of districts
 */
export const getDistrictsByProvince = (provinceName, provinces) => {
  if (!provinceName || !provinces || provinces.length === 0) {
    return [];
  }

  const province = provinces.find(p => p.name === provinceName || p.name_en === provinceName);
  return province?.districts || [];
};

/**
 * Get wards for a specific district
 * @param {string} districtName - Name of the district
 * @param {Array} districts - Array of all districts
 * @returns {Array} Array of wards
 */
export const getWardsByDistrict = (districtName, districts) => {
  if (!districtName || !districts || districts.length === 0) {
    return [];
  }

  const district = districts.find(d => d.name === districtName || d.name_en === districtName);
  return district?.wards || [];
};

export default {
  getProvinces,
  getDistrictsByProvince,
  getWardsByDistrict,
};


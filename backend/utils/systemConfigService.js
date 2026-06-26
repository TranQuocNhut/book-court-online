import SystemConfig from "../models/SystemConfig.js"; 

let cachedConfig = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

/**
 * Lấy platform fee từ SystemConfig
 * Có cache để tránh query database quá nhiều
 * @returns {Promise<number>} - Platform fee (0-1, ví dụ: 0.1 = 10%)
 */
export const getPlatformFee = async () => {
  const now = Date.now();

  // Kiểm tra cache
  if (cachedConfig && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedConfig.platformFee;
  }

  // Lấy từ database
  const config = await SystemConfig.getConfig();
  cachedConfig = config;
  cacheTimestamp = now;

  return config.platformFee;
};

/**
 * Xóa cache (gọi khi cập nhật config)
 */
export const clearConfigCache = () => {
  cachedConfig = null;
  cacheTimestamp = null;
};


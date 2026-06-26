// utils/auditLogger.js
import AuditLog from "../models/AuditLog.js";

/**
 * Ghi lại hành động của user
 * @param {string} action - Tên hành động (ví dụ: 'LOGIN')
 * @param {string} userId - ID của user thực hiện
 * @param {Object} req - (Optional) Đối tượng request để lấy IP
 * @param {Object} details - (Optional) Thông tin chi tiết
 */
export const logAudit = async (action, userId, req = null, details = {}) => {
  try {
    let ipAddress = null;
    if (req) {
      ipAddress = req.ip || req.connection.remoteAddress;
    }

    await AuditLog.create({
      user: userId,
      action,
      ipAddress,
      details,
    });
  } catch (error) {
    console.error("❌ Error logging audit:", error);
  }
};

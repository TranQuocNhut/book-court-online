import { PayOS } from "@payos/node";
import { config } from "../config/config.js";

// Khởi tạo đối tượng PayOS cho kênh thanh toán (Payment)
const payOS = new PayOS(
  config.payos.payment.clientId,
  config.payos.payment.apiKey,
  config.payos.payment.checksumKey
);

/**
 * Tạo link thanh toán PayOS
 * @param {number} orderCode - Mã đơn hàng (duy nhất, kiểu số)
 * @param {number} amount - Số tiền
 * @param {string} description - Mô tả
 * @param {string} returnUrl - URL trả về sau khi thanh toán
 * @param {string} cancelUrl - URL hủy bỏ
 * @returns {Promise<object>} - Thông tin link thanh toán
 */
export const createPaymentLink = async ({
  orderCode,
  amount,
  description,
  returnUrl,
  cancelUrl,
}) => {
  try {
    // Tự động rút ngắn description nếu quá 25 ký tự
    const maxDescriptionLength = 25;
    const truncatedDescription = description.length > maxDescriptionLength
      ? description.substring(0, maxDescriptionLength)
      : description;

    const paymentData = {
      orderCode,
      amount,
      description: truncatedDescription,
      returnUrl,
      cancelUrl,
      expiredAt: Math.floor((Date.now() + 15 * 60 * 1000) / 1000),
    };

    const paymentLink = await payOS.paymentRequests.create(paymentData);
    return paymentLink;
  } catch (error) {
    console.error("Lỗi khi tạo link PayOS:", error);
    
    // Hiển thị chi tiết lỗi từ PayOS
    if (error.code) {
      console.error(`PayOS Error Code: ${error.code}`);
      console.error(`PayOS Error Desc: ${error.desc}`);
      
      // Xử lý các lỗi cụ thể
      if (error.code === '214') {
        throw new Error(
          'Cổng thanh toán PayOS chưa được kích hoạt. ' +
          'Vui lòng kích hoạt cổng thanh toán trong PayOS Dashboard.'
        );
      }
      
      if (error.code === '20') {
        throw new Error(
          'Mô tả thanh toán quá dài (tối đa 25 ký tự). ' +
          `Độ dài hiện tại: ${description?.length || 0} ký tự.`
        );
      }
    }
    
    throw new Error(
      error.message || "Không thể tạo link thanh toán PayOS"
    );
  }
};

/**
 * Xác thực Webhook (IPN) từ PayOS
 * @param {object} webhookBody - Dữ liệu PayOS gửi về
 * @returns {Promise<object>} - Dữ liệu đã xác thực
 */
export const verifyWebhook = async (webhookBody, headers) => {
  try {
    const verifiedData = payOS.webhooks.verify(webhookBody, headers);
    return verifiedData;
  } catch (error) {
    console.error("Lỗi xác thực webhook PayOS:", error.message);
    throw new Error("Chữ ký webhook không hợp lệ");
  }
};

export default payOS;

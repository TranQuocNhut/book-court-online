// utils/emailService.js
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import dotenv from "dotenv";
dotenv.config();

// !! CẤU HÌNH NODEMAILER !!
// Bạn cần cấu hình transporter này với dịch vụ mail của bạn
// (ví dụ: Gmail, SendGrid, Mailgun)

// Kiểm tra xem có credentials không
const hasEmailCredentials = process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD;

let transporter = null;

if (hasEmailCredentials) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
} else {
  console.warn("⚠️ [EMAIL] Chưa cấu hình EMAIL_USER hoặc EMAIL_APP_PASSWORD. Email sẽ không được gửi.");
}

// ---- HOẶC DÙNG DỊCH VỤ SMTP TEST (ví dụ: Mailtrap) ----
// host: "sandbox.smtp.mailtrap.io",
//port: 2525,
//auth: {
//  user: "your_mailtrap_user",
//  pass: "your_mailtrap_pass",
//},

/**
 * Gửi email
 * @param {Object} options
 * @param {string} options.to - Email người nhận
 * @param {string} options.subject - Tiêu đề email
 * @param {string} options.html - Nội dung HTML của email
 * @param {Array} [options.attachments] - Mảng các file đính kèm (optional)
 */
export const sendEmail = async ({ to, subject, html, attachments }) => {
  try {
    // Kiểm tra xem có transporter không
    if (!transporter) {
      console.warn(`⚠️ [EMAIL] Không thể gửi email tới ${to} - Chưa cấu hình email credentials`);
      return;
    }

    const mailOptions = {
      from: `"DAT-SAN-ONLINE" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      ...(attachments && attachments.length > 0 && { attachments }),
    };

    if (process.env.NODE_ENV === "test") {
      console.log(`📧 (Test Mode) Email to ${to} with subject "${subject}"`);
      return;
    }

    console.log(`📬 Đang bắt đầu gửi email tới: ${to}`);

    // 2. Gọi hàm từ biến transporter đã khởi tạo ở trên
    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Email sent successfully! Message ID: ${info.messageId}`);
  } catch (error) {
    // Log lỗi nhưng không throw - để không làm gián đoạn flow thanh toán
    console.error("❌ Error sending email:", error.message || error);
    // Không throw error để không làm gián đoạn các process khác (như cộng tiền cho owner)
  }
};

/**
 * Gửi email biên lai thanh toán
 * @param {Object} booking - Object Booking đã populate đầy đủ thông tin
 */
export const sendPaymentReceipt = async (booking) => {
  try {
    if (!booking) return;

    // Kiểm tra emailNotifications setting
    // Nếu user đã tắt email notifications, không gửi email
    if (booking.user && booking.user.emailNotifications === false) {
      console.log(`ℹ️ [EMAIL] User đã tắt thông báo email. Bỏ qua gửi email thanh toán cho booking ${booking.bookingCode || booking._id}`);
      return;
    }

    // Logic thông minh: Lấy email người điền form HOẶC email tài khoản
    const recipientEmail = booking.contactInfo?.email || booking.user?.email;

    if (!recipientEmail) {
      console.warn(
        `⚠️ [EMAIL] Không tìm thấy email nhận cho đơn ${
          booking.bookingCode || booking._id
        }`
      );
      return;
    }

    // Format tiền
    const formattedAmount = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(booking.totalAmount);

    const bookingDate = new Date(booking.date).toLocaleDateString("vi-VN");
    const bookingCode =
      booking.bookingCode || booking._id.toString().slice(-6).toUpperCase();

    // Tạo QR code cho vé đặt sân
    let qrCodeDataUrl = "";
    let qrCodeBuffer = null;
    try {
      // Tạo dữ liệu QR code chứa thông tin booking
      const qrData = JSON.stringify({
        id: booking._id.toString(),
        bookingCode: bookingCode,
        venue: booking.facility?.name || "Sân bóng",
        date: bookingDate,
        time: booking.timeSlots?.join(", ") || "",
        court: booking.court?.name || "Sân bóng"
      });
      
      // Generate QR code as buffer (để dùng làm attachment)
      qrCodeBuffer = await QRCode.toBuffer(qrData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 1,
        width: 200
      });
      
      // Cũng tạo data URL để dùng làm fallback
      qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 1,
        width: 200
      });
      
      console.log(`✅ [QR CODE] Đã tạo QR code thành công cho booking ${bookingCode}`);
    } catch (qrError) {
      console.error("❌ Lỗi khi tạo QR code:", qrError);
      // Tiếp tục gửi email dù không có QR code
    }

    // Nội dung HTML
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #1a4d2e; padding: 20px; text-align: center; color: white;">
          <h2>THANH TOÁN THÀNH CÔNG</h2>
          <p>Mã đặt sân: <strong>${bookingCode}</strong></p>
        </div>
        <div style="padding: 20px;">
          <p>Xin chào quý khách,</p>
          <p>Hệ thống đã nhận được thanh toán <strong>${formattedAmount}</strong>.</p>
          <p><strong>Thông tin đặt sân:</strong></p>
          <ul>
            <li>Sân: ${booking.court?.name || "Sân bóng"}</li>
            <li>Ngày: ${bookingDate}</li>
            <li>Khung giờ: ${booking.timeSlots.join(", ")}</li>
          </ul>
          <p>Vui lòng đưa mã này cho nhân viên khi nhận sân.</p>
          ${qrCodeDataUrl ? `
          <div style="text-align: center; margin-top: 20px; margin-bottom: 10px;">
            <img src="cid:qrcode" alt="QR Code vé đặt sân" style="max-width: 200px; height: auto; border: 2px solid #1a4d2e; border-radius: 8px; padding: 10px; background: #fff; display: block; margin: 0 auto;" />
            <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">Quét mã QR để xác nhận thông tin đặt sân</p>
          </div>
          ` : ""}
        </div>
      </div>
    `;

    // Chuẩn bị attachments nếu có QR code
    const attachments = [];
    if (qrCodeBuffer) {
      attachments.push({
        filename: `qrcode-${bookingCode}.png`,
        content: qrCodeBuffer,
        cid: 'qrcode' // Content ID để reference trong HTML
      });
    }

    await sendEmail({
      to: recipientEmail,
      subject: `[DAT-SAN] Xác nhận thanh toán #${bookingCode}`,
      html: htmlContent,
      attachments: attachments.length > 0 ? attachments : undefined
    });
  } catch (error) {
    console.error("❌ Lỗi logic gửi biên lai:", error);
  }
};

/**
 * Gửi email thông báo hủy đặt sân
 * @param {Object} booking - Object Booking đã populate đầy đủ thông tin
 * @param {string} cancellationReason - Lý do hủy
 * @param {number} refundAmount - Số tiền được hoàn (0 nếu không hoàn)
 * @param {number} totalAmount - Tổng tiền đã thanh toán
 * @param {string} refundPolicy - Chính sách hoàn tiền (mô tả)
 */
export const sendCancellationEmail = async (
  booking,
  cancellationReason,
  refundAmount = 0,
  totalAmount = 0,
  refundPolicy = ""
) => {
  try {
    if (!booking) return;

    // Kiểm tra emailNotifications setting
    // Nếu user đã tắt email notifications, không gửi email
    if (booking.user && booking.user.emailNotifications === false) {
      console.log(`ℹ️ [EMAIL] User đã tắt thông báo email. Bỏ qua gửi email hủy đặt sân cho booking ${booking.bookingCode || booking._id}`);
      return;
    }

    // Logic thông minh: Lấy email người điền form HOẶC email tài khoản
    const recipientEmail = booking.contactInfo?.email || booking.user?.email;

    if (!recipientEmail) {
      console.warn(
        `⚠️ [EMAIL] Không tìm thấy email nhận cho đơn hủy ${
          booking.bookingCode || booking._id
        }`
      );
      return;
    }

    // Format tiền
    const formattedTotalAmount = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(totalAmount);

    const formattedRefundAmount = refundAmount > 0
      ? new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(refundAmount)
      : "0 VNĐ";

    const bookingDate = new Date(booking.date).toLocaleDateString("vi-VN");
    const bookingCode =
      booking.bookingCode || booking._id.toString().slice(-6).toUpperCase();

    // Tạo nội dung thông tin hoàn tiền đơn giản
    let refundInfoHtml = "";
    if (refundAmount > 0) {
      const refundPercentage = totalAmount > 0 
        ? Math.round((refundAmount / totalAmount) * 100) 
        : 0;
      refundInfoHtml = `
        <p>Hệ thống đã hoàn tiền <strong>${formattedRefundAmount}</strong>${refundPercentage > 0 ? ` (${refundPercentage}% tổng tiền)` : ""} vào ví của bạn.</p>
        <p>Bạn có thể kiểm tra trong mục "Ví của tôi" trên ứng dụng.</p>
      `;
    } else if (totalAmount > 0) {
      refundInfoHtml = `<p>Đơn đặt sân đã bị hủy nhưng không đủ điều kiện để hoàn tiền theo chính sách của chúng tôi.</p>`;
    }

    // Chính sách hoàn tiền
    const policyHtml = refundPolicy 
      ? `<p><strong>Chính sách hoàn tiền:</strong></p><p>${refundPolicy}</p>`
      : "";

    // Nội dung HTML - đơn giản giống form thanh toán thành công
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #dc2626; padding: 20px; text-align: center; color: white;">
          <h2>ĐƠN ĐẶT SÂN ĐÃ BỊ HỦY</h2>
          <p>Mã đặt sân: <strong>${bookingCode}</strong></p>
        </div>
        <div style="padding: 20px;">
          <p>Xin chào quý khách,</p>
          <p>Chúng tôi xin thông báo rằng đơn đặt sân của bạn đã bị hủy.</p>
          <p><strong>Lý do hủy:</strong> ${cancellationReason || "Không có thông tin"}</p>
          <p><strong>Thông tin đặt sân:</strong></p>
          <ul>
            <li>Sân: ${booking.court?.name || "Sân bóng"}</li>
            <li>Cơ sở: ${booking.facility?.name || "N/A"}</li>
            <li>Ngày: ${bookingDate}</li>
            <li>Khung giờ: ${booking.timeSlots?.join(", ") || "N/A"}</li>
            ${totalAmount > 0 ? `<li>Tổng tiền: ${formattedTotalAmount}</li>` : ""}
          </ul>
          ${refundInfoHtml}
          ${policyHtml}
        </div>
      </div>
    `;

    await sendEmail({
      to: recipientEmail,
      subject: `[DAT-SAN] Thông báo hủy đặt sân #${bookingCode}`,
      html: htmlContent,
    });

    console.log(`✅ [EMAIL] Đã gửi email thông báo hủy đặt sân tới: ${recipientEmail}`);
  } catch (error) {
    console.error("❌ Lỗi logic gửi email thông báo hủy đặt sân:", error);
  }
};

/**
 * Gửi email thông báo khi người dùng tự hủy đặt sân
 * @param {Object} booking - Object Booking đã populate đầy đủ thông tin
 * @param {string} cancellationReason - Lý do hủy
 * @param {number} refundAmount - Số tiền được hoàn (0 nếu không hoàn)
 * @param {number} totalAmount - Tổng tiền đã thanh toán
 * @param {string} refundPolicy - Chính sách hoàn tiền (mô tả)
 */
export const sendUserCancellationEmail = async (
  booking,
  cancellationReason,
  refundAmount = 0,
  totalAmount = 0,
  refundPolicy = ""
) => {
  try {
    if (!booking) return;

    // Kiểm tra emailNotifications setting
    // Nếu user đã tắt email notifications, không gửi email
    if (booking.user && booking.user.emailNotifications === false) {
      console.log(`ℹ️ [EMAIL] User đã tắt thông báo email. Bỏ qua gửi email xác nhận hủy đặt sân cho booking ${booking.bookingCode || booking._id}`);
      return;
    }

    // Logic thông minh: Lấy email người điền form HOẶC email tài khoản
    const recipientEmail = booking.contactInfo?.email || booking.user?.email;

    if (!recipientEmail) {
      console.warn(
        `⚠️ [EMAIL] Không tìm thấy email nhận cho đơn hủy ${
          booking.bookingCode || booking._id
        }`
      );
      return;
    }

    // Format tiền
    const formattedTotalAmount = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(totalAmount);

    const formattedRefundAmount = refundAmount > 0
      ? new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(refundAmount)
      : "0 VNĐ";

    const bookingDate = new Date(booking.date).toLocaleDateString("vi-VN");
    const bookingCode =
      booking.bookingCode || booking._id.toString().slice(-6).toUpperCase();

    // Tạo nội dung thông tin hoàn tiền đơn giản
    let refundInfoHtml = "";
    if (refundAmount > 0) {
      const refundPercentage = totalAmount > 0 
        ? Math.round((refundAmount / totalAmount) * 100) 
        : 0;
      refundInfoHtml = `
        <p>Hệ thống đã hoàn tiền <strong>${formattedRefundAmount}</strong>${refundPercentage > 0 ? ` (${refundPercentage}% tổng tiền)` : ""} vào ví của bạn.</p>
        <p>Bạn có thể kiểm tra trong mục "Ví của tôi" trên ứng dụng.</p>
      `;
    } else if (totalAmount > 0) {
      refundInfoHtml = `<p>Đơn đặt sân đã bị hủy nhưng không đủ điều kiện để hoàn tiền theo chính sách của chúng tôi.</p>`;
    }

    // Chính sách hoàn tiền
    const policyHtml = refundPolicy 
      ? `<p><strong>Chính sách hoàn tiền:</strong></p><p>${refundPolicy}</p>`
      : "";

    // Nội dung HTML - đơn giản giống form thanh toán thành công
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #dc2626; padding: 20px; text-align: center; color: white;">
          <h2>ĐÃ HỦY ĐẶT SÂN</h2>
          <p>Mã đặt sân: <strong>${bookingCode}</strong></p>
        </div>
        <div style="padding: 20px;">
          <p>Xin chào quý khách,</p>
          <p>Bạn đã hủy đơn đặt sân thành công.</p>
          <p><strong>Lý do hủy:</strong> ${cancellationReason || "Không có thông tin"}</p>
          <p><strong>Thông tin đặt sân:</strong></p>
          <ul>
            <li>Sân: ${booking.court?.name || "Sân bóng"}</li>
            <li>Cơ sở: ${booking.facility?.name || "N/A"}</li>
            <li>Ngày: ${bookingDate}</li>
            <li>Khung giờ: ${booking.timeSlots?.join(", ") || "N/A"}</li>
            ${totalAmount > 0 ? `<li>Tổng tiền: ${formattedTotalAmount}</li>` : ""}
          </ul>
          ${refundInfoHtml}
          ${policyHtml}
        </div>
      </div>
    `;

    await sendEmail({
      to: recipientEmail,
      subject: `[DAT-SAN] Xác nhận hủy đặt sân #${bookingCode}`,
      html: htmlContent,
    });

    console.log(`✅ [EMAIL] Đã gửi email xác nhận hủy đặt sân tới: ${recipientEmail}`);
  } catch (error) {
    console.error("❌ Lỗi logic gửi email xác nhận hủy đặt sân:", error);
  }
};
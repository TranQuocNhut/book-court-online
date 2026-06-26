import React from "react";
import { X, User, DollarSign, List, Building } from "lucide-react";

// Component con để hiển thị từng hàng chi tiết
const DetailRow = ({ label, value, isBadge = false, badgeData = {} }) => (
  <div style={{ marginBottom: 16 }}>
    <div
      style={{
        fontSize: 13,
        color: "#374151",
        fontWeight: 600,
        marginBottom: 6,
      }}
    >
      {label}
    </div>
    {isBadge ? (
      <span
        style={{
          background: badgeData.bg,
          color: badgeData.color,
          padding: "4px 10px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          textTransform: "capitalize",
        }}
      >
        {value}
      </span>
    ) : (
      <div
        style={{
          fontSize: 15,
          color: "#1f2937",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    )}
  </div>
);

// Component con cho Tiêu đề Card
const CardHeader = ({ Icon, title }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "16px 20px",
      borderBottom: "1px solid #e5e7eb",
      color: "#374151",
    }}
  >
    <Icon size={18} />
    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
      {title}
    </h3>
  </div>
);

// Component Modal
const PaymentDetailModal = ({ isOpen, onClose, payment }) => {
  if (!isOpen || !payment) return null;

  // Định nghĩa màu sắc cho Phương thức
  const methodColors = {
    VNPay: { bg: "#e6f0ff", color: "#0052d9", text: "VNPay" },
    Momo: { bg: "#fce7f3", color: "#ea4c89", text: "Momo" },
    "Tiền mặt": { bg: "#e6f9f0", color: "#059669", text: "Tiền mặt" },
  };

  // Định nghĩa màu sắc cho Trạng thái
  const statusColors = {
    success: { bg: "#e6f9f0", color: "#059669", text: "Thành công" },
    pending: { bg: "#fef3c7", color: "#d97706", text: "Chờ xử lý" },
    failed: { bg: "#fee2e2", color: "#ef4444", text: "Lỗi" },
  };

  const methodConfig = methodColors[payment.paymentMethod] || { bg: "#e5e7eb", color: "#374151", text: payment.paymentMethod || "N/A" };
  const statusConfig = statusColors[payment.status] || { bg: "#e5e7eb", color: "#374151", text: payment.status };

  return (
    // Backdrop
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      {/* Nội dung Modal */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,.1)",
          width: "90%",
          maxWidth: "550px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Nền trắng) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#1f2937" }}>
            Chi tiết giao dịch:{" "}
            <span style={{ color: "#3b82f6" }}>{payment.transactionId || payment.id}</span>
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: 0,
              cursor: "pointer",
              color: "#6b7280",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body (Nền xám nhạt) */}
        <div
          style={{
            padding: 24,
            background: "#f9fafb",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {/* Card 1: Thông tin giao dịch */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
            <CardHeader Icon={List} title="Thông tin giao dịch" />
            <div style={{ padding: 20 }}>
                <DetailRow label="Mã giao dịch" value={payment.transactionId || payment.id} />
                {payment.bookingId && (
                  <DetailRow label="Mã đặt sân" value={payment.bookingId} />
                )}
                <DetailRow 
                  label="Ngày thanh toán" 
                  value={payment.paymentDate && payment.paymentTime 
                    ? `${payment.paymentDate} lúc ${payment.paymentTime}` 
                    : payment.date && payment.time 
                      ? `${payment.date} lúc ${payment.time}` 
                      : payment.paymentDate || payment.date || "N/A"} 
                />
            </div>
          </div>

          {/* Card 2: Thông tin thanh toán */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
            <CardHeader Icon={DollarSign} title="Thông tin thanh toán" />
            <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
              <DetailRow label="Số tiền" value={`${payment.amount.toLocaleString()} VNĐ`} />
              <DetailRow
                label="Hình thức thanh toán"
                value={methodConfig.text}
                isBadge={true}
                badgeData={{ bg: methodConfig.bg, color: methodConfig.color }}
              />
              <DetailRow
                label="Trạng thái"
                value={statusConfig.text}
                isBadge={true}
                badgeData={{ bg: statusConfig.bg, color: statusConfig.color }}
              />
              {payment.platformFee > 0 && (
                <DetailRow 
                  label="Phí nền tảng" 
                  value={`${payment.platformFee.toLocaleString()} VNĐ (${payment.platformFeePercent || 10}%)`} 
                />
              )}
            </div>
          </div>

          {/* Card 3: Thông tin bên liên quan */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
            <CardHeader Icon={User} title="Thông tin bên liên quan" />
            <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
              <DetailRow 
                label="Người thực hiện" 
                value={payment.performer || payment.customer || "N/A"} 
              />
              <DetailRow 
                label="Vai trò" 
                value={payment.performerRole === "owner" ? "Chủ sân" : "Khách hàng"} 
              />
              <DetailRow label="Sân liên quan" value={payment.facility || "N/A"} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            padding: "16px 24px",
            borderTop: "1px solid #e5e7eb",
            background: "#fff",
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "#fff",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: "8px 14px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailModal;
import React from "react";
import { X, User, Calendar, DollarSign, ClipboardList, Clock5, CheckCircle2, XCircle } from "lucide-react";

const BG_HEADER = "#eef2ff"; 
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
          display: "inline-flex",
          alignItems: "center",
          gap: 6
        }}
      >
        {badgeData.icon}
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
const BookingDetailModal = ({ isOpen, onClose, booking }) => {
  if (!isOpen || !booking) return null;

  // Định nghĩa màu sắc và text cho Trạng thái Đặt sân
  const statusMap = {
    pending: {
      bg: "#e6effe", color: "#4338ca",
      icon: <Clock5 size={14} />, label: "Chờ xử lý",
    },
    pending_payment: {
      bg: "#fef3c7", color: "#d97706",
      icon: <Clock5 size={14} />, label: "Chờ thanh toán",
    },
    hold: {
      bg: "#fef3c7", color: "#d97706",
      icon: <Clock5 size={14} />, label: "Đang giữ chỗ",
    },
    confirmed: {
      bg: "#e6f9f0", color: "#059669",
      icon: <CheckCircle2 size={14} />, label: "Đã xác nhận",
    },
    expired: {
      bg: "#fee2e2", color: "#dc2626",
      icon: <XCircle size={14} />, label: "Hết hạn",
    },
    cancelled: {
      bg: "#fee2e2", color: "#ef4444",
      icon: <XCircle size={14} />, label: "Đã hủy",
    },
    completed: {
      bg: "#e6f9f0", color: "#059669",
      icon: <CheckCircle2 size={14} />, label: "Hoàn thành",
    },
    "no-show": {
      bg: "#fee2e2", color: "#ef4444",
      icon: <XCircle size={14} />, label: "Không đến",
    },
  };

  // Định nghĩa màu sắc và text cho Trạng thái Thanh toán
  const paymentMap = {
    paid: {
      bg: "#e6f9f0", color: "#059669",
      label: "Đã thanh toán"
    },
    pending: {
      bg: "#fef3c7", color: "#d97706",
      label: "Chờ thanh toán"
    },
    refunded: {
      bg: "#fee2e2", color: "#ef4444",
      label: "Đã hoàn tiền"
    }
  };
  
  const statusConfig = statusMap[booking.status] || statusMap.pending;
  const paymentConfig = paymentMap[booking.pay] || paymentMap.pending;

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
          maxWidth: "600px",
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
            background: BG_HEADER,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#1f2937" }}>
            Chi tiết đặt sân:{" "}
            <span style={{ color: "#3b82f6" }}>{booking.id}</span>
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
          {/* Card 1: Thông tin khách hàng */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
            <CardHeader Icon={User} title="Thông tin khách hàng" />
            <div style={{ padding: 20 }}>
              <DetailRow label="Tên khách hàng" value={booking.customer} />
              <DetailRow label="Số điện thoại" value={booking.phone} />
              <DetailRow label="Email" value={booking.email} />
            </div>
          </div>

          {/* Card 2: Thông tin đặt sân */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
            <CardHeader Icon={Calendar} title="Thông tin đặt sân" />
            <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
              <DetailRow label="Sân" value={booking.facility} />
              <DetailRow label="Sân con" value={booking.court} />
              <DetailRow label="Ngày chơi" value={booking.date} />
              <DetailRow 
                label="Thời gian" 
                value={booking.startTime && booking.endTime 
                  ? `${booking.startTime} - ${booking.endTime}` 
                  : booking.time 
                    ? booking.time 
                    : "N/A"} 
              />
            </div>
          </div>

          {/* Card 3: Thanh toán & Trạng thái */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
            <CardHeader Icon={DollarSign} title="Thanh toán & Trạng thái" />
            <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
              <DetailRow 
                label="Trạng thái đặt sân" 
                value={statusConfig.label}
                isBadge={true}
                badgeData={{ bg: statusConfig.bg, color: statusConfig.color, icon: statusConfig.icon }}
              />
              <DetailRow
                label="Trạng thái thanh toán"
                value={paymentConfig.label}
                isBadge={true}
                badgeData={{ bg: paymentConfig.bg, color: paymentConfig.color }}
              />
              <DetailRow 
                label="Phương thức thanh toán" 
                value={booking.paymentMethod || "N/A"} 
              />
              <DetailRow label="Tổng tiền" value={`${booking.price.toLocaleString()} VNĐ`} />
              <DetailRow 
                label="Ngày đặt" 
                value={booking.bookingDate && booking.bookingTime 
                  ? `${booking.bookingDate} ${booking.bookingTime}` 
                  : booking.bookingDate 
                    ? booking.bookingDate 
                    : "N/A"} 
              />
            </div>
          </div>
          
          {/* Card 4: Thông tin hủy đơn - Hiển thị khi booking đã bị hủy */}
          {(booking.status === "cancelled" || booking.status === "expired") && (booking.cancellationReason || booking.cancelledAt) && (
            <div style={{ background: "#fef2f2", border: "2px solid #fee2e2", borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
              <CardHeader Icon={XCircle} title="Thông tin hủy đơn" />
              <div style={{ padding: 20 }}>
                {booking.cancelledAt && (
                  <DetailRow 
                    label="Thời gian hủy" 
                    value={new Date(booking.cancelledAt).toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })} 
                  />
                )}
                {booking.cancellationReason && (
                  <DetailRow 
                    label="Lý do hủy" 
                    value={booking.cancellationReason || "Không có lý do"} 
                  />
                )}
              </div>
            </div>
          )}

          {/* Card 5: Ghi chú */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
            <CardHeader Icon={ClipboardList} title="Ghi chú" />
            <div style={{ padding: 20 }}>
              <DetailRow label="Ghi chú của khách hàng" value={booking.notes || "Không có ghi chú"} />
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

export default BookingDetailModal;
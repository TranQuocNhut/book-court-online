import React, { useState } from "react";
import { X, Calendar, Clock, DollarSign, User, Mail, Phone, FileText, Image as ImageIcon } from "lucide-react";
import useClickOutside from "../../../../hook/use-click-outside";
import useBodyScrollLock from "../../../../hook/use-body-scroll-lock";
import useEscapeKey from "../../../../hook/use-escape-key";
import { courtData } from "../data/mockData";

const BookingDetailModal = ({ isOpen, onClose, booking = {}, courtInfo = null }) => {
  // Lock body scroll
  useBodyScrollLock(isOpen);
  
  // Handle escape key
  useEscapeKey(onClose, isOpen);
  
  // Handle click outside
  const modalRef = useClickOutside(onClose, isOpen);

  const [imageIdx, setImageIdx] = useState(0);

  if (!isOpen || !booking) return null;

  const statusMap = {
    pending: { bg: "#e6effe", color: "#4338ca", text: "Chờ xác nhận" },
    confirmed: { bg: "#e6f9f0", color: "#059669", text: "Đã xác nhận" },
    cancelled: { bg: "#fee2e2", color: "#ef4444", text: "Đã hủy" },
    completed: { bg: "#f0f9ff", color: "#0284c7", text: "Hoàn thành" },
  };

  const paymentMap = {
    paid: { bg: "#e6f9f0", color: "#059669", text: "Đã thanh toán" },
    pending: { bg: "#fef3c7", color: "#d97706", text: "Chờ thanh toán" },
    refunded: { bg: "#fee2e2", color: "#ef4444", text: "Hoàn tiền" },
  };

  const statusConfig = statusMap[booking.status] || statusMap.pending;
  const paymentConfig = paymentMap[booking.pay] || paymentMap.pending;

  // Get court images
  const courtImages = courtInfo?.images || [];
  const displayImage = courtImages.length > 0 ? courtImages[imageIdx] : null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: "700px",
          maxHeight: "90vh",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "24px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#111827" }}>
              Chi tiết đơn đặt sân
            </h2>
            <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0 0" }}>
              {booking.id} • {booking.customer}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#6b7280",
              padding: "4px",
            }}
            aria-label="Đóng"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "24px",
            background: "#f9fafb",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {/* Court Image */}
          {displayImage && (
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: 20,
                marginBottom: 16,
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <ImageIcon size={20} color="#3b82f6" />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#374151" }}>
                  Hình ảnh sân
                </h3>
              </div>
              <div
                style={{
                  position: "relative",
                  borderRadius: 10,
                  overflow: "hidden",
                  background: "#f3f4f6",
                }}
              >
                <img
                  src={displayImage}
                  alt={booking.court}
                  style={{
                    width: "100%",
                    height: 240,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                {courtImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageIdx((i) => (i <= 0 ? courtImages.length - 1 : i - 1));
                      }}
                      style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        cursor: "pointer",
                        width: 36,
                        height: 36,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        fontWeight: "bold",
                      }}
                    >
                      ‹
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageIdx((i) => (i >= courtImages.length - 1 ? 0 : i + 1));
                      }}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        cursor: "pointer",
                        width: 36,
                        height: 36,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        fontWeight: "bold",
                      }}
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
              {/* Thumbnails */}
              {courtImages.length > 1 && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 12,
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  {courtImages.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setImageIdx(i)}
                      style={{
                        border: imageIdx === i ? "3px solid #3b82f6" : "2px solid #e5e7eb",
                        padding: 0,
                        borderRadius: 8,
                        overflow: "hidden",
                        cursor: "pointer",
                        width: 70,
                        height: 50,
                        background: "#fff",
                        opacity: imageIdx === i ? 1 : 0.7,
                      }}
                    >
                      <img
                        src={url}
                        alt={`Thumbnail ${i + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Customer Info */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 20,
              }}
            >
              <User size={20} color="#3b82f6" />
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#374151" }}>
                Thông tin khách hàng
              </h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>
                  <User size={14} />
                  Tên khách hàng
                </label>
                <div style={{ fontSize: 15, color: "#111827", fontWeight: 500 }}>
                  {booking.customer || "Chưa có thông tin"}
                </div>
              </div>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>
                  <Phone size={14} />
                  Số điện thoại
                </label>
                <div style={{ fontSize: 15, color: "#111827", fontWeight: 500 }}>
                  {booking.phone || "Chưa có thông tin"}
                </div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>
                  <Mail size={14} />
                  Email
                </label>
                <div style={{ fontSize: 15, color: "#111827", fontWeight: 500 }}>
                  {booking.email || "Chưa có thông tin"}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Info */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 20,
              }}
            >
              <Calendar size={20} color="#10b981" />
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#374151" }}>
                Thông tin đặt sân
              </h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>
                  Sân
                </label>
                <div style={{ fontSize: 15, color: "#111827", fontWeight: 500 }}>
                  {booking.court || "Chưa có thông tin"}
                </div>
                {booking.courtType && (
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                    {booking.courtType}
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>
                  <Calendar size={14} />
                  Ngày đặt
                </label>
                <div style={{ fontSize: 15, color: "#111827", fontWeight: 500 }}>
                  {booking.date || "Chưa có thông tin"}
                </div>
              </div>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>
                  <Clock size={14} />
                  Khung giờ
                </label>
                <div style={{ fontSize: 15, color: "#059669", fontWeight: 600 }}>
                  {booking.time || "Chưa có thông tin"}
                </div>
              </div>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>
                  <DollarSign size={14} />
                  Giá
                </label>
                <div style={{ fontSize: 15, color: "#059669", fontWeight: 600 }}>
                  {booking.price ? `${booking.price.toLocaleString()} VNĐ` : "Chưa có thông tin"}
                </div>
              </div>
            </div>
          </div>

          {/* Status & Payment */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
              border: "1px solid #e5e7eb",
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 20px 0", color: "#374151" }}>
              Trạng thái & Thanh toán
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>
                  Trạng thái
                </label>
                <span
                  style={{
                    display: "inline-block",
                    background: statusConfig.bg,
                    color: statusConfig.color,
                    padding: "6px 12px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {statusConfig.text}
                </span>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>
                  Thanh toán
                </label>
                <span
                  style={{
                    display: "inline-block",
                    background: paymentConfig.bg,
                    color: paymentConfig.color,
                    padding: "6px 12px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {paymentConfig.text}
                </span>
              </div>
            </div>
          </div>

          {/* Cancellation Info - Hiển thị khi booking đã bị hủy */}
          {(booking.status === "cancelled" || booking.status === "expired") && (booking.cancellationReason || booking.cancelledAt || booking._original?.cancellationReason || booking._original?.cancelledAt) && (
            <div
              style={{
                background: "#fef2f2",
                borderRadius: 12,
                padding: 20,
                marginBottom: 16,
                border: "2px solid #fee2e2",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <X size={20} color="#ef4444" />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#dc2626" }}>
                  Thông tin hủy đơn
                </h3>
              </div>
              {(booking.cancelledAt || booking._original?.cancelledAt) && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 13, color: "#991b1b", fontWeight: 600, marginBottom: 6 }}>
                    Thời gian hủy
                  </label>
                  <div style={{ fontSize: 14, color: "#7f1d1d", fontWeight: 500 }}>
                    {new Date(booking.cancelledAt || booking._original?.cancelledAt).toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}
              {(booking.cancellationReason || booking._original?.cancellationReason) && (
                <div>
                  <label style={{ display: "block", fontSize: 13, color: "#991b1b", fontWeight: 600, marginBottom: 6 }}>
                    Lý do hủy
                  </label>
                  <div style={{ fontSize: 14, color: "#7f1d1d", whiteSpace: "pre-wrap", lineHeight: 1.6, padding: "12px", background: "#fff", borderRadius: 8, border: "1px solid #fecaca" }}>
                    {booking.cancellationReason || booking._original?.cancellationReason}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {booking.notes && (
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: 20,
                marginBottom: 16,
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <FileText size={20} color="#f59e0b" />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#374151" }}>
                  Ghi chú
                </h3>
              </div>
              <div style={{ fontSize: 14, color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {booking.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            padding: "20px 24px",
            borderTop: "1px solid #e5e7eb",
            background: "#fff",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              background: "#fff",
              color: "#374151",
              border: "2px solid #e5e7eb",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "#d1d5db";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "#e5e7eb";
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


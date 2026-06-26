import React from "react";
import { X, Bell, Calendar, Clock, Tag } from "lucide-react";
import useClickOutside from "../../../../hook/use-click-outside";
import useBodyScrollLock from "../../../../hook/use-body-scroll-lock";
import useEscapeKey from "../../../../hook/use-escape-key";

const NotificationDetailModal = ({ isOpen, onClose, notification = {} }) => {
  useBodyScrollLock(isOpen);
  useEscapeKey(onClose, isOpen);
  const modalRef = useClickOutside(onClose, isOpen);

  if (!isOpen || !notification) return null;

  const typeMap = {
    booking: { bg: "#e6f3ff", color: "#1d4ed8", text: "Đặt sân" },
    payment: { bg: "#e6f9f0", color: "#059669", text: "Thanh toán" },
    cancellation: { bg: "#fee2e2", color: "#ef4444", text: "Hủy đặt sân" },
    review: { bg: "#fef3c7", color: "#d97706", text: "Đánh giá" },
    maintenance: { bg: "#e6f3ff", color: "#1d4ed8", text: "Bảo trì" },
  };

  const statusMap = {
    unread: { bg: "#e6f3ff", color: "#1d4ed8", text: "Chưa đọc" },
    read: { bg: "#e6f9f0", color: "#059669", text: "Đã đọc" },
  };

  const typeConfig = typeMap[notification.type] || typeMap.booking;
  const statusConfig = statusMap[notification.status] || statusMap.unread;

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
          maxWidth: "600px",
          overflow: "hidden",
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Bell size={24} color="#3b82f6" />
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#111827" }}>
              Chi tiết tin nhắn
            </h3>
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
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
              border: "1px solid #e5e7eb",
            }}
          >
            <h4 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px 0", color: "#111827" }}>
              {notification.title || "Không có tiêu đề"}
            </h4>
            <div
              style={{
                fontSize: 15,
                color: "#374151",
                lineHeight: 1.7,
                marginBottom: 16,
                whiteSpace: "pre-wrap",
              }}
            >
              {notification.message || "Không có nội dung"}
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              border: "1px solid #e5e7eb",
            }}
          >
            <h4 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px 0", color: "#374151" }}>
              Thông tin thêm
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: "#6b7280",
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  <Tag size={14} />
                  Loại
                </label>
                <span
                  style={{
                    display: "inline-block",
                    background: typeConfig.bg,
                    color: typeConfig.color,
                    padding: "6px 12px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {typeConfig.text}
                </span>
              </div>
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: "#6b7280",
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
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
                    fontWeight: 600,
                  }}
                >
                  {statusConfig.text}
                </span>
              </div>
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: "#6b7280",
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  <Calendar size={14} />
                  Ngày
                </label>
                <div style={{ fontSize: 14, color: "#111827", fontWeight: 500 }}>
                  {notification.date || "Chưa có thông tin"}
                </div>
              </div>
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: "#6b7280",
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  <Clock size={14} />
                  Giờ
                </label>
                <div style={{ fontSize: 14, color: "#111827", fontWeight: 500 }}>
                  {notification.time || "Chưa có thông tin"}
                </div>
              </div>
            </div>
          </div>
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
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationDetailModal;


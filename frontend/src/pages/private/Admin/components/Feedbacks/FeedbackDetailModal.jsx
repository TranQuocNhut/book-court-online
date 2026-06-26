import React from "react";
import { X } from "lucide-react";

const FeedbackDetailModal = ({
  isOpen,
  feedback,
  typeMap,
  statusMap,
  formatDate,
  onClose,
  onResolve,
}) => {
  if (!isOpen || !feedback) return null;

  const type = typeMap[feedback.type];
  const status = statusMap[feedback.status];
  const TypeIcon = type?.icon;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          maxWidth: "700px",
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 0 }}>Chi tiết phản hồi</h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>
              Người gửi
            </label>
            <div style={{ marginTop: 4 }}>
              <div style={{ fontWeight: 600 }}>{feedback.senderName}</div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                {feedback.senderEmail} | {feedback.senderPhone}
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>
                {feedback.senderRole === "customer" ? "Khách hàng" : "Chủ sân"}
              </div>
            </div>
          </div>

          {type && (
            <div>
              <label style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>
                Loại phản hồi
              </label>
              <div style={{ marginTop: 4 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    background: type.bg,
                    color: type.color,
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {TypeIcon && <TypeIcon size={14} />}
                  {type.label}
                </span>
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>
              Tiêu đề
            </label>
            <div style={{ marginTop: 4, fontWeight: 600, fontSize: 15 }}>
              {feedback.subject}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>
              Nội dung
            </label>
            <div
              style={{
                marginTop: 4,
                padding: 12,
                background: "#f9fafb",
                borderRadius: 8,
                fontSize: 14,
                lineHeight: 1.6,
                color: "#374151",
                whiteSpace: "pre-wrap",
              }}
            >
              {feedback.content}
            </div>
          </div>

          {feedback.relatedFacility && (
            <div>
              <label style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>
                Sân liên quan
              </label>
              <div style={{ marginTop: 4, fontWeight: 600, color: "#059669" }}>
                {feedback.relatedFacility}
              </div>
            </div>
          )}

          {feedback.relatedBooking && (
            <div>
              <label style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>
                Mã đặt sân
              </label>
              <div style={{ marginTop: 4, fontWeight: 600 }}>
                {feedback.relatedBooking}
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>
              Ngày gửi
            </label>
            <div style={{ marginTop: 4 }}>
              {formatDate(feedback.createdAt, feedback.createdTime)}
            </div>
          </div>

          {status && (
            <div>
              <label style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>
                Trạng thái
              </label>
              <div style={{ marginTop: 4 }}>
                <span
                  style={{
                    background: status.bg,
                    color: status.color,
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {status.label}
                </span>
              </div>
            </div>
          )}

          {feedback.adminResponse && (
            <div>
              <label style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>
                Phản hồi của admin
              </label>
              <div
                style={{
                  marginTop: 4,
                  padding: 12,
                  background: "#e6f9f0",
                  borderRadius: 8,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "#059669",
                  whiteSpace: "pre-wrap",
                }}
              >
                {feedback.adminResponse}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#6b7280",
                }}
              >
                Phản hồi bởi: {feedback.resolvedBy} vào{" "}
                {formatDate(feedback.resolvedAt)}
              </div>
            </div>
          )}

          {feedback.status === "pending" && (
            <div style={{ marginTop: 8 }}>
              <button
                onClick={() => {
                  onClose();
                  onResolve(feedback);
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Phản hồi phản hồi này
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackDetailModal;


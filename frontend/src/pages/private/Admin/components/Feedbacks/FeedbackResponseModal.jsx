import React from "react";
import { X } from "lucide-react";

const FeedbackResponseModal = ({
  isOpen,
  feedback,
  responseText,
  onResponseChange,
  onSave,
  onClose,
}) => {
  if (!isOpen || !feedback) return null;

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
          maxWidth: "600px",
          width: "90%",
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
          <h2 style={{ marginTop: 0, marginBottom: 0 }}>Phản hồi phản hồi</h2>
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

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
            Phản hồi từ: <strong>{feedback.senderName}</strong>
          </div>
          <div
            style={{
              padding: 12,
              background: "#f9fafb",
              borderRadius: 8,
              fontSize: 14,
              color: "#374151",
              marginBottom: 12,
            }}
          >
            {feedback.subject}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 600,
              color: "#374151",
            }}
          >
            Nội dung phản hồi *
          </label>
          <textarea
            value={responseText}
            onChange={(e) => onResponseChange(e.target.value)}
            placeholder="Nhập nội dung phản hồi cho người dùng..."
            rows={6}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              background: "#fff",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Hủy
          </button>
          <button
            onClick={onSave}
            disabled={!responseText.trim()}
            style={{
              padding: "10px 20px",
              background: responseText.trim() ? "#10b981" : "#d1d5db",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: responseText.trim() ? "pointer" : "not-allowed",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Gửi phản hồi
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackResponseModal;


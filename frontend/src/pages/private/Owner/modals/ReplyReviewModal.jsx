import React, { useState } from "react";
import { X, MessageSquare } from "lucide-react";
import useClickOutside from "../../../../hook/use-click-outside";
import useBodyScrollLock from "../../../../hook/use-body-scroll-lock";
import useEscapeKey from "../../../../hook/use-escape-key";

const ReplyReviewModal = ({ isOpen, onClose, review = {}, onSubmit }) => {
  useBodyScrollLock(isOpen);
  useEscapeKey(onClose, isOpen);
  const modalRef = useClickOutside(onClose, isOpen);

  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!replyText.trim()) {
      alert("Vui lòng nhập phản hồi");
      return;
    }

    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(replyText);
      }
      setReplyText("");
      if (onClose) onClose();
    } catch (error) {
      console.error("Error submitting reply:", error);
    } finally {
      setLoading(false);
    }
  };

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
          maxWidth: "500px",
          overflow: "hidden",
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
            <MessageSquare size={20} color="#3b82f6" />
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#111827" }}>
              Phản hồi đánh giá
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
        <div style={{ padding: "24px" }}>
          {review && (
            <div
              style={{
                background: "#f9fafb",
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
                Đánh giá từ {review.customer}
              </div>
              <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.5 }}>
                {review.comment}
              </div>
            </div>
          )}

          <div>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 8,
              }}
            >
              Phản hồi của bạn
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Nhập phản hồi của bạn..."
              style={{
                width: "100%",
                minHeight: "120px",
                padding: "12px",
                borderRadius: 8,
                border: "2px solid #e5e7eb",
                fontSize: 14,
                fontFamily: "inherit",
                resize: "vertical",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3b82f6";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e7eb";
              }}
            />
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
            background: "#f9fafb",
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "10px 24px",
              background: "#fff",
              color: "#374151",
              border: "2px solid #e5e7eb",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !replyText.trim()}
            style={{
              padding: "10px 24px",
              background: loading || !replyText.trim() ? "#9ca3af" : "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading || !replyText.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Đang gửi..." : "Gửi phản hồi"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplyReviewModal;


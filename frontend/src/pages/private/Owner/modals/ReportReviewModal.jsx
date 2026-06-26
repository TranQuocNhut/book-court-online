import React, { useState } from "react";
import { X, Flag, AlertTriangle } from "lucide-react";
import useClickOutside from "../../../../hook/use-click-outside";
import useBodyScrollLock from "../../../../hook/use-body-scroll-lock";
import useEscapeKey from "../../../../hook/use-escape-key";

const ReportReviewModal = ({ isOpen, onClose, review = {}, onSubmit }) => {
  useBodyScrollLock(isOpen);
  useEscapeKey(onClose, isOpen);
  const modalRef = useClickOutside(onClose, isOpen);

  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const reportReasons = [
    "Nội dung không phù hợp",
    "Spam / Quảng cáo",
    "Thông tin sai lệch",
    "Ngôn từ không phù hợp",
    "Khác",
  ];

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason) {
      alert("Vui lòng chọn lý do báo cáo");
      return;
    }

    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit({ reason, note: note || reason });
      }
      setReason("");
      setNote("");
      if (onClose) onClose();
    } catch (error) {
      console.error("Error submitting report:", error);
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
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Flag size={20} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#111827" }}>
              Báo cáo đánh giá
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
                background: "#fef2f2",
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                border: "1px solid #fee2e2",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <AlertTriangle size={16} color="#ef4444" />
                <div style={{ fontSize: 13, fontWeight: 600, color: "#ef4444" }}>
                  Đánh giá từ {review.customer}
                </div>
              </div>
              <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.5 }}>
                {review.comment}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 8,
              }}
            >
              Lý do báo cáo <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "2px solid #e5e7eb",
                fontSize: 14,
                outline: "none",
                cursor: "pointer",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3b82f6";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e7eb";
              }}
            >
              <option value="">Chọn lý do báo cáo</option>
              {reportReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

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
              Ghi chú thêm (tùy chọn)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Thêm thông tin chi tiết về lý do báo cáo..."
              style={{
                width: "100%",
                minHeight: "80px",
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
            disabled={loading || !reason}
            style={{
              padding: "10px 24px",
              background: loading || !reason ? "#9ca3af" : "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading || !reason ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Đang gửi..." : "Gửi báo cáo"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportReviewModal;


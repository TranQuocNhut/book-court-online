import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import useClickOutside from "../../../../hook/use-click-outside";
import useBodyScrollLock from "../../../../hook/use-body-scroll-lock";
import useEscapeKey from "../../../../hook/use-escape-key";

const RejectLeagueModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  leagueName = ""
}) => {
  // Lock body scroll
  useBodyScrollLock(isOpen);
  
  // Handle escape key
  useEscapeKey(onClose, isOpen);
  
  // Handle click outside
  const modalRef = useClickOutside(onClose, isOpen);

  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      return;
    }
    if (onConfirm) onConfirm(reason);
    setReason("");
    if (onClose) onClose();
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
          maxWidth: "480px",
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
              <AlertTriangle size={20} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#111827" }}>
              Từ chối giải đấu
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
            aria-label="Đóng"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px" }}>
          <p style={{ fontSize: 15, color: "#374151", marginBottom: 16, lineHeight: 1.6 }}>
            Bạn có chắc muốn từ chối giải đấu <strong>{leagueName}</strong>?
          </p>
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
              Lý do từ chối <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              rows={4}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e5e7eb",
                borderRadius: 8,
                fontSize: 14,
                color: "#111827",
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
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim()}
            style={{
              padding: "10px 24px",
              background: reason.trim() ? "#ef4444" : "#d1d5db",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: reason.trim() ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (reason.trim()) {
                e.target.style.background = "#dc2626";
              }
            }}
            onMouseLeave={(e) => {
              if (reason.trim()) {
                e.target.style.background = "#ef4444";
              }
            }}
          >
            Từ chối
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectLeagueModal;


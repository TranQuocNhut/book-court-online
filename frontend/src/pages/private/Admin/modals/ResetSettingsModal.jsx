import React from "react";
import { X, AlertTriangle, RotateCcw } from "lucide-react";
import useClickOutside from "../../../../hook/use-click-outside";
import useBodyScrollLock from "../../../../hook/use-body-scroll-lock";
import useEscapeKey from "../../../../hook/use-escape-key";

const ResetSettingsModal = ({ isOpen, onClose, onConfirm }) => {
  useBodyScrollLock(isOpen);
  useEscapeKey(onClose, isOpen);
  const modalRef = useClickOutside(onClose, isOpen);

  if (!isOpen) return null;

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
                background: "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <RotateCcw size={20} color="#d97706" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#111827" }}>
              Reset cài đặt
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
          <p style={{ fontSize: 15, color: "#374151", marginBottom: 12, lineHeight: 1.6 }}>
            Bạn có chắc chắn muốn reset về cài đặt mặc định?
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "12px",
              background: "#fef3c7",
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            <AlertTriangle size={16} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: "#92400e", margin: 0, lineHeight: 1.5 }}>
              Tất cả các cài đặt hiện tại sẽ bị ghi đè và không thể khôi phục.
            </p>
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
            onClick={() => {
              if (onConfirm) onConfirm();
              if (onClose) onClose();
            }}
            style={{
              padding: "10px 24px",
              background: "#f59e0b",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#d97706";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#f59e0b";
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetSettingsModal;


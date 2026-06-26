import React, { useState } from "react";
import { X, XCircle, AlertTriangle } from "lucide-react";
import useClickOutside from "../../../../hook/use-click-outside";
import useBodyScrollLock from "../../../../hook/use-body-scroll-lock";
import useEscapeKey from "../../../../hook/use-escape-key";

const RejectFacilityModal = ({ isOpen, onClose, onConfirm, facility }) => {
  useBodyScrollLock(isOpen);
  useEscapeKey(onClose, isOpen);
  const modalRef = useClickOutside(onClose, isOpen);
  const [rejectionReason, setRejectionReason] = useState("");

  if (!isOpen || !facility) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm(rejectionReason);
    if (onClose) onClose();
    setRejectionReason(""); // Reset sau khi đóng
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
              <XCircle size={20} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#111827" }}>
              Từ chối cơ sở
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
            Bạn có chắc muốn từ chối cơ sở <strong>"{facility.name}"</strong>?
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
              Cơ sở này sẽ bị xóa khỏi hệ thống và không thể khôi phục.
            </p>
          </div>
          <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 16 }}>
            ⚠️ Hành động này không thể hoàn tác.
          </p>
          <div>
            <label
              htmlFor="rejectionReason"
              style={{ display: "block", fontSize: 13, color: "#374151", marginBottom: 6 }}
            >
              Lý do từ chối (tùy chọn):
            </label>
            <textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows="4"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 14,
                resize: "vertical",
              }}
              placeholder="Nhập lý do từ chối..."
            ></textarea>
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
            style={{
              padding: "10px 24px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#dc2626";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#ef4444";
            }}
          >
            Từ chối
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectFacilityModal;


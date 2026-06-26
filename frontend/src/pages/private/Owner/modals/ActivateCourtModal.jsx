import React from "react";
import { X, Check } from "lucide-react";

// Simple confirmation modal to activate a court
const ActivateCourtModal = ({ isOpen, onClose, court = {}, onConfirm }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (typeof onConfirm === "function") onConfirm(court);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 18, borderBottom: "1px solid #eee" }}>
          <div style={{ fontWeight: 700 }}>Kích hoạt sân</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer" }} aria-label="Đóng"><X size={20} /></button>
        </div>

        <div style={{ padding: 18 }}>
          <p>Bạn có chắc muốn kích hoạt <strong>{court.name}</strong> không? Sân sẽ chuyển trạng thái sang <strong>Hoạt động</strong>.</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
            <button onClick={onClose} style={{ padding: "8px 12px", borderRadius: 8, background: "#fff", border: "1px solid #e5e7eb" }}>Hủy</button>
            <button onClick={handleConfirm} style={{ padding: "8px 12px", borderRadius: 8, background: "#10b981", color: "#fff", border: 0, display: "inline-flex", alignItems: "center", gap: 8 }}><Check size={14} /> Kích hoạt</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivateCourtModal;

import React, { useEffect, useState } from "react";

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const boxStyle = {
  width: 480,
  background: "#fff",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 10px 40px rgba(2,6,23,0.2)",
};

const SetMaintenanceModal = ({ isOpen, onClose, court, onConfirm }) => {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNote(court && court.maintenance && court.maintenance !== "Không có lịch bảo trì" ? court.maintenance : "");
    }
  }, [isOpen, court]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!court) return;
    const updated = { ...court, maintenance: note || "Đang bảo trì", status: "maintenance" };
    if (onConfirm) onConfirm(updated);
    if (onClose) onClose();
  };

  return (
    <div style={overlayStyle}>
      <div style={boxStyle}>
        <h3 style={{ margin: 0, marginBottom: 8 }}>Tạm ngưng</h3>
        <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 12 }}>Sân: {court?.name || "-"}</div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
          <button
            onClick={() => {
              if (onClose) onClose();
            }}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer" }}
          >
            Đóng
          </button>
          <button
            onClick={handleConfirm}
            style={{ padding: "8px 12px", borderRadius: 8, border: 0, background: "#f59e0b", color: "#fff", cursor: "pointer", fontWeight: 700 }}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetMaintenanceModal;

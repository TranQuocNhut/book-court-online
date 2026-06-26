import React from "react";

const FacilityDetailModal = ({ isOpen, facility, statusMap, formatPrice, onClose }) => {
  if (!isOpen || !facility) return null;

  const status = statusMap[facility.status] || statusMap.pending;

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
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: 20 }}>
          Chi tiết cơ sở: {facility.name}
        </h2>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <strong>Địa chỉ:</strong> {facility.address}
          </div>
          <div>
            <strong>Chủ sân:</strong> {facility.owner}
          </div>
          <div>
            <strong>Môn thể thao:</strong> {facility.sports?.join(", ")}
          </div>
          <div>
            <strong>Giá/giờ:</strong> {formatPrice(facility.pricePerHour)} VNĐ
          </div>
          <div>
            <strong>Tình trạng:</strong>{" "}
            <span
              style={{
                background: status.bg,
                color: status.color,
                padding: "4px 8px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {status.label}
            </span>
          </div>
          <div>
            <strong>Ngày tạo:</strong> {facility.createdAt}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: 20,
            padding: "10px 20px",
            background: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

export default FacilityDetailModal;


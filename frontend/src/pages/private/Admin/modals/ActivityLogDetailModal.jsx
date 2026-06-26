import React from "react";
import { X, User, Activity, Target, Clock } from "lucide-react";

const BG_HEADER = "#eef2ff"; 
// Component con để hiển thị từng hàng chi tiết
const DetailRow = ({ label, value, isBadge = false, badgeData = {} }) => (
  <div style={{ marginBottom: 16 }}>
    <div
      style={{
        fontSize: 13,
        color: "#374151",
        fontWeight: 600,
        marginBottom: 6,
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
    {isBadge ? (
      <span
        style={{
          background: badgeData.bg,
          color: badgeData.color,
          padding: "4px 10px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {value}
      </span>
    ) : (
      <div
        style={{
          fontSize: 15,
          color: "#1f2937",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    )}
  </div>
);

// Component con cho Tiêu đề Card
const CardHeader = ({ Icon, title }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "16px 20px",
      borderBottom: "1px solid #e5e7eb",
      color: "#374151",
    }}
  >
    <Icon size={18} />
    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
      {title}
    </h3>
  </div>
);

// Component Modal
const ActivityLogDetailModal = ({ isOpen, onClose, log }) => {
  if (!isOpen || !log) return null;

  // Định nghĩa màu sắc cho người dùng
  const userColors = {
    Admin: { bg: "#e6f3ff", color: "#1d4ed8" },
    Owner: { bg: "#fef3c7", color: "#d97706" },
    System: { bg: "#e6f9f0", color: "#059669" },
  };

  const userConfig = userColors[log.user] || { bg: "#e5e7eb", color: "#374151" };

  return (
    // Backdrop
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      {/* Nội dung Modal */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,.1)",
          width: "90%",
          maxWidth: "550px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px",
            borderBottom: "1px solid #e5e7eb",
            background: BG_HEADER,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#1f2937" }}>
            Chi tiết hoạt động:{" "}
            <span style={{ color: "#3b82f6" }}>{log.id}</span>
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: 0,
              cursor: "pointer",
              color: "#6b7280",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body (Nền xám nhạt) */}
        <div
          style={{
            padding: 24,
            background: "#f9fafb",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {/* Card 1: Thông tin hoạt động */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
            <CardHeader Icon={Activity} title="Thông tin hoạt động" />
            <div style={{ padding: 20 }}>
                <DetailRow label="Hành động" value={log.action} />
                <DetailRow label="Chi tiết" value={log.details} />
            </div>
          </div>

          {/* Card 2: Thông tin meta */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
            <CardHeader Icon={User} title="Đối tượng & Meta" />
            <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
              <DetailRow
                label="Người dùng"
                value={log.user}
                isBadge={true}
                badgeData={{ bg: userConfig.bg, color: userConfig.color }}
              />
              <DetailRow label="Mục tiêu" value={log.target} />
              <DetailRow label="Địa chỉ IP" value={log.ip} />
              <DetailRow label="Thời gian" value={`${log.date} ${log.time}`} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            padding: "16px 24px",
            borderTop: "1px solid #e5e7eb",
            background: "#fff",
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "#fff",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: "8px 14px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogDetailModal;
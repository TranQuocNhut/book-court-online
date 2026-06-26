import React from "react";

const CourtStats = ({ courts = [] }) => {
  const stats = {
    total: courts.length,
    active: courts.filter((c) => c.status === "active").length,
    maintenance: courts.filter((c) => c.status === "maintenance").length,
    inactive: courts.filter((c) => c.status === "inactive").length,
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0,1fr))",
        gap: 16,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
        }}
      >
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
          Tổng sân
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#1f2937" }}>
          {stats.total}
        </div>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
        }}
      >
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
          Đang hoạt động
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#059669" }}>
          {stats.active}
        </div>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
        }}
      >
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
          Bảo trì
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b" }}>
          {stats.maintenance}
        </div>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
        }}
      >
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
          Tạm ngưng
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#ef4444" }}>
          {stats.inactive}
        </div>
      </div>
    </div>
  );
};

export default CourtStats;


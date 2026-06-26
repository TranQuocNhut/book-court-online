import React from "react";

const FeedbackStats = ({ stats }) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
        }}
      >
        <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
          Tổng số phản hồi
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#374151" }}>
          {stats.total}
        </div>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
        }}
      >
        <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
          Đang xử lý
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#f59e0b" }}>
          {stats.pending}
        </div>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
        }}
      >
        <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
          Đã phản hồi
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#10b981" }}>
          {stats.resolved}
        </div>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
        }}
      >
        <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
          Khiếu nại
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#ef4444" }}>
          {stats.complaints}
        </div>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
        }}
      >
        <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
          Góp ý
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#3b82f6" }}>
          {stats.suggestions}
        </div>
      </div>
    </div>
  );
};

export default FeedbackStats;


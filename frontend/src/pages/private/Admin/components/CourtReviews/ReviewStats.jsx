import React from "react";

const ReviewStats = ({ stats }) => {
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
          padding: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
        }}
      >
        <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
          Tổng đánh giá
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#111827" }}>
          {stats.total}
        </div>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
        }}
      >
        <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
          Điểm trung bình
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#10b981" }}>
          {stats.avgRating.toFixed(1)}/5
        </div>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
        }}
      >
        <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
          Đã duyệt
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#059669" }}>
          {stats.approved}
        </div>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
        }}
      >
        <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
          Chờ duyệt
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#d97706" }}>
          {stats.pending}
        </div>
      </div>
    </div>
  );
};

export default ReviewStats;


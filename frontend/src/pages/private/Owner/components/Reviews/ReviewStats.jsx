import React from "react";

const ReviewStats = ({ reviews = [] }) => {
  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const totalReviews = reviews.length;
  const repliedReviews = reviews.filter((r) => r.isOwnerReplied).length;
  const reportedReviews = reviews.filter((r) => r.status === "reported").length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 16, marginBottom: 16 }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 6px 20px rgba(0,0,0,.06)" }}>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>Đánh giá trung bình</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b" }}>{averageRating.toFixed(1)} ⭐</div>
      </div>
      <div style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 6px 20px rgba(0,0,0,.06)" }}>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>Tổng đánh giá</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#1f2937" }}>{totalReviews}</div>
      </div>
      <div style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 6px 20px rgba(0,0,0,.06)" }}>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>Đã phản hồi</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#059669" }}>{repliedReviews}</div>
      </div>
      <div style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 6px 20px rgba(0,0,0,.06)" }}>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>Báo cáo</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#ef4444" }}>{reportedReviews}</div>
      </div>
    </div>
  );
};

export default ReviewStats;


import React from "react";
import { Star, Reply, Flag } from "lucide-react";

const ReviewCard = ({ review, onReply, onReport, renderStars }) => {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        background: review.status === "reported" ? "#fef2f2" : "#fff",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 16 }}>{review.customer}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>{renderStars(review.rating)}</div>
          </div>
          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
            {review.court} • {review.date}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onReply(review)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "#3b82f6",
              color: "#fff",
              border: 0,
              borderRadius: 8,
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Reply size={14} />
            Phản hồi
          </button>
          <button
            onClick={() => onReport(review)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "#ef4444",
              color: "#fff",
              border: 0,
              borderRadius: 8,
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Flag size={14} />
            Báo cáo
          </button>
        </div>
      </div>

      <div style={{ fontSize: 14, color: "#374151", marginBottom: 12, lineHeight: 1.5 }}>{review.comment}</div>

      {review.isOwnerReplied && (
        <div
          style={{
            background: "#f0f9ff",
            border: "1px solid #3b82f6",
            borderRadius: 8,
            padding: 12,
            marginTop: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#1e40af" }}>Phản hồi của bạn:</span>
            <span style={{ fontSize: 12, color: "#6b7280" }}>{review.replyDate}</span>
          </div>
          <div style={{ fontSize: 14, color: "#1e40af" }}>{review.ownerReply}</div>
        </div>
      )}

      {review.status === "reported" && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #ef4444",
            borderRadius: 8,
            padding: 8,
            marginTop: 12,
          }}
        >
          <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>⚠️ Đánh giá này đã được báo cáo</span>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;


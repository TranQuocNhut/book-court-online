import React from "react";
import { Star, Check, X } from "lucide-react";

const ReviewRow = ({
  review,
  index,
  page,
  pageSize,
  renderStars,
  onApprove,
  onReject,
}) => {
  return (
    <tr key={review.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
      <td style={{ padding: 12 }}>{(page - 1) * pageSize + index + 1}</td>
      <td style={{ padding: 12, fontWeight: 600 }}>{review.facility}</td>
      <td style={{ padding: 12 }}>
        <div>
          <div style={{ fontWeight: 500 }}>{review.customer}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            {review.customerEmail}
          </div>
        </div>
      </td>
      <td style={{ padding: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {renderStars(review.rating)}
          <span style={{ marginLeft: 4, fontSize: 12, color: "#6b7280" }}>
            ({review.rating}/5)
          </span>
        </div>
      </td>
      <td
        style={{
          padding: 12,
          maxWidth: "350px",
          color: "#374151",
          lineHeight: 1.5,
        }}
        title={review.comment}
      >
        {review.comment.length > 80
          ? review.comment.substring(0, 80) + "..."
          : review.comment}
      </td>
      <td style={{ padding: 12 }}>
        <div>
          <div>{review.date}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{review.time}</div>
        </div>
      </td>
      <td style={{ padding: 12 }}>
        <span
          style={{
            background:
              review.status === "approved" ? "#e6f9f0" : "#fef3c7",
            color: review.status === "approved" ? "#059669" : "#d97706",
            padding: "4px 8px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {review.status === "approved" ? "Đã duyệt" : "Chờ duyệt"}
        </span>
      </td>
      <td style={{ padding: 12, whiteSpace: "nowrap" }}>
        {review.status === "pending" && (
          <>
            <button
              onClick={() => onApprove(review)}
              style={{
                background: "#10b981",
                color: "#fff",
                border: 0,
                borderRadius: 8,
                padding: 8,
                marginRight: 6,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
              title="Duyệt đánh giá"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => onReject(review)}
              style={{
                background: "#ef4444",
                color: "#fff",
                border: 0,
                borderRadius: 8,
                padding: 8,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
              title="Từ chối đánh giá"
            >
              <X size={14} />
            </button>
          </>
        )}
        {review.status === "approved" && (
          <span style={{ color: "#6b7280", fontSize: 12 }}>Đã duyệt</span>
        )}
      </td>
    </tr>
  );
};

export default ReviewRow;


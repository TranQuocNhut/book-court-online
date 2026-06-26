import React from "react";
import { Eye, CheckCircle } from "lucide-react";

const FeedbackRow = ({
  feedback,
  typeMap,
  statusMap,
  formatDate,
  truncateText,
  onView,
  onResolve,
}) => {
  const type = typeMap[feedback.type] || typeMap.feedback;
  const status = statusMap[feedback.status] || statusMap.pending;
  const TypeIcon = type.icon;

  return (
    <tr
      key={feedback.id}
      style={{
        borderBottom: "1px solid #f3f4f6",
        opacity: feedback.status === "resolved" ? 0.8 : 1,
      }}
    >
      <td style={{ padding: 12 }}>
        <div>
          <div style={{ fontWeight: 600 }}>{feedback.senderName}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            {feedback.senderEmail}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#9ca3af",
              marginTop: 2,
            }}
          >
            {feedback.senderRole === "customer" ? "Khách hàng" : "Chủ sân"}
          </div>
        </div>
      </td>
      <td style={{ padding: 12 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: type.bg,
            color: type.color,
            padding: "4px 8px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <TypeIcon size={12} />
          {type.label}
        </span>
      </td>
      <td style={{ padding: 12, fontWeight: 600, maxWidth: 200 }}>
        {feedback.subject}
      </td>
      <td style={{ padding: 12, maxWidth: 300 }}>
        <div
          style={{
            fontSize: 13,
            color: "#6b7280",
            lineHeight: 1.5,
          }}
        >
          {truncateText(feedback.content, 150)}
        </div>
      </td>
      <td style={{ padding: 12 }}>
        {feedback.relatedFacility ? (
          <span
            style={{
              fontSize: 12,
              color: "#059669",
              fontWeight: 600,
            }}
          >
            {feedback.relatedFacility}
          </span>
        ) : (
          <span style={{ color: "#9ca3af" }}>-</span>
        )}
      </td>
      <td style={{ padding: 12, color: "#6b7280", fontSize: 13 }}>
        {formatDate(feedback.createdAt, feedback.createdTime)}
      </td>
      <td style={{ padding: 12 }}>
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
      </td>
      <td style={{ padding: 12, whiteSpace: "nowrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => onView(feedback)}
            title="Xem chi tiết"
            style={{
              background: "#3b82f6",
              color: "#fff",
              border: 0,
              borderRadius: 6,
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: 12,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Eye size={14} />
            Xem
          </button>
          {feedback.status === "pending" && (
            <button
              onClick={() => onResolve(feedback)}
              title="Phản hồi"
              style={{
                background: "#10b981",
                color: "#fff",
                border: 0,
                borderRadius: 6,
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <CheckCircle size={14} />
              Phản hồi
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default FeedbackRow;


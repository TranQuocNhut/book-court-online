import React from "react";
import FeedbackRow from "./FeedbackRow";

const FeedbackTable = ({
  feedbacks,
  page,
  pageSize,
  totalItems,
  typeMap,
  statusMap,
  formatDate,
  truncateText,
  onPageChange,
  onPageSizeChange,
  onView,
  onResolve,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const headers = [
    "Người gửi",
    "Loại phản hồi",
    "Tiêu đề",
    "Nội dung",
    "Sân liên quan",
    "Ngày gửi",
    "Trạng thái",
    "Hành động",
  ];

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 6px 20px rgba(0,0,0,.06)",
      }}
    >
      {/* Header với page size selector */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: 12,
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div>
          <label style={{ marginRight: 8 }}>Show</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{
              padding: 6,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span style={{ marginLeft: 8 }}>entries</span>
        </div>
        <div style={{ color: "#6b7280", fontSize: 14 }}>
          Hiển thị {totalItems} kết quả
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", textAlign: "left" }}>
              {headers.map((h) => (
                <th
                  key={h}
                  style={{
                    padding: 12,
                    fontSize: 13,
                    color: "#6b7280",
                    borderBottom: "1px solid #e5e7eb",
                    fontWeight: 600,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {feedbacks.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  Không tìm thấy phản hồi nào
                </td>
              </tr>
            ) : (
              feedbacks.map((feedback) => (
                <FeedbackRow
                  key={feedback.id}
                  feedback={feedback}
                  typeMap={typeMap}
                  statusMap={statusMap}
                  formatDate={formatDate}
                  truncateText={truncateText}
                  onView={onView}
                  onResolve={onResolve}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: 12,
        }}
      >
        <div>
          Showing {(page - 1) * pageSize + 1} to{" "}
          {Math.min(page * pageSize, totalItems)} of {totalItems} entries
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            disabled={page === 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#fff",
              cursor: page === 1 ? "not-allowed" : "pointer",
              opacity: page === 1 ? 0.5 : 1,
            }}
          >
            Previous
          </button>
          <div
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              background: "#10b981",
              color: "#fff",
            }}
          >
            {page}
          </div>
          <button
            disabled={page === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#fff",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              opacity: page === totalPages ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackTable;


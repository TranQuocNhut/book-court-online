import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  itemsLabel = "kết quả",
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 16,
        padding: "16px 0",
        borderTop: "1px solid #e5e7eb",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <label style={{ fontSize: 14, color: "#6b7280" }}>Hiển thị</label>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
          }}
          style={{
            padding: "6px 12px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            fontSize: 14,
            background: "#fff",
            cursor: "pointer",
            outline: "none",
          }}
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 14, color: "#6b7280" }}>{itemsLabel}</span>
        <span style={{ fontSize: 14, color: "#6b7280" }}>
          Hiển thị {startItem} đến {endItem} trong tổng số {total} bản ghi
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          disabled={page === 1}
          onClick={() => onPageChange((p) => Math.max(1, p - 1))}
          style={{
            padding: "8px 12px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            background: page === 1 ? "#f3f4f6" : "#fff",
            color: page === 1 ? "#9ca3af" : "#374151",
            cursor: page === 1 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            fontWeight: 500,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (page !== 1) {
              e.currentTarget.style.borderColor = "#3b82f6";
              e.currentTarget.style.color = "#3b82f6";
            }
          }}
          onMouseLeave={(e) => {
            if (page !== 1) {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.color = "#374151";
            }
          }}
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <div
          style={{
            padding: "8px 16px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            background: "#fff",
            fontSize: 14,
            fontWeight: 600,
            color: "#374151",
          }}
        >
          {page} / {totalPages}
        </div>

        <button
          disabled={page === totalPages}
          onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
          style={{
            padding: "8px 12px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            background: page === totalPages ? "#f3f4f6" : "#fff",
            color: page === totalPages ? "#9ca3af" : "#374151",
            cursor: page === totalPages ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            fontWeight: 500,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (page !== totalPages) {
              e.currentTarget.style.borderColor = "#3b82f6";
              e.currentTarget.style.color = "#3b82f6";
            }
          }}
          onMouseLeave={(e) => {
            if (page !== totalPages) {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.color = "#374151";
            }
          }}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;


import React from "react";
import { Search, Filter } from "lucide-react";

const FeedbackFilters = ({
  searchQuery,
  typeFilter,
  statusFilter,
  onSearchChange,
  onTypeChange,
  onStatusChange,
  onReset,
}) => {
  const hasFilters =
    typeFilter !== "all" || statusFilter !== "all" || searchQuery;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Filter size={18} color="#6b7280" />
        <span style={{ fontWeight: 600, color: "#374151" }}>Bộ lọc</span>
        {hasFilters && (
          <button
            onClick={onReset}
            style={{
              marginLeft: "auto",
              padding: "6px 12px",
              background: "#f3f4f6",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            Tìm kiếm
          </label>
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af",
              }}
            />
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tên, email, nội dung..."
              style={{
                width: "100%",
                padding: "8px 8px 8px 36px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 14,
              }}
            />
          </div>
        </div>
        <div>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            Loại phản hồi
          </label>
          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          >
            <option value="all">Tất cả</option>
            <option value="complaint">Khiếu nại</option>
            <option value="feedback">Góp ý</option>
          </select>
        </div>
        <div>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            Trạng thái
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          >
            <option value="all">Tất cả</option>
            <option value="pending">Đang xử lý</option>
            <option value="resolved">Đã phản hồi</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FeedbackFilters;


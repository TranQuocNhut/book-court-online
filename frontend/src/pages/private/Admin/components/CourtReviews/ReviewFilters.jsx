import React from "react";
import { Filter } from "lucide-react";

const ReviewFilters = ({
  searchQuery,
  statusFilter,
  facilityFilter,
  ratingFilter,
  uniqueFacilities,
  onSearchChange,
  onStatusChange,
  onFacilityChange,
  onRatingChange,
  onReset,
}) => {
  const hasFilters =
    statusFilter !== "all" ||
    facilityFilter !== "all" ||
    ratingFilter !== "all" ||
    searchQuery;

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
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#6b7280" }}>
            Tìm kiếm
          </label>
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cơ sở, khách hàng, bình luận..."
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#6b7280" }}>
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
            <option value="approved">Đã duyệt</option>
            <option value="pending">Chờ duyệt</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#6b7280" }}>
            Cơ sở
          </label>
          <select
            value={facilityFilter}
            onChange={(e) => onFacilityChange(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          >
            <option value="all">Tất cả cơ sở</option>
            {uniqueFacilities.map((facility) => (
              <option key={facility} value={facility}>
                {facility}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#6b7280" }}>
            Đánh giá
          </label>
          <select
            value={ratingFilter}
            onChange={(e) => onRatingChange(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          >
            <option value="all">Tất cả</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ReviewFilters;


import React from "react";
import SearchBar from "../shared/SearchBar";

const ReviewFilters = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  pageSize,
  onPageSizeChange,
  totalCount,
  facilities = [],
  selectedFacilityId = "all",
  onFacilityChange,
  loading = false,
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottom: "1px solid #e5e7eb",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <strong>Tổng:</strong> {totalCount} đánh giá
        </div>
        <div>
          <label style={{ marginRight: 8 }}>Hiển thị</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{
              padding: 6,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
              background: "#fff",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span style={{ marginLeft: 8 }}>bản ghi</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {facilities.length > 0 && (
            <select
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 14,
                background: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                outline: "none",
                opacity: loading ? 0.6 : 1,
              }}
              value={selectedFacilityId}
              onChange={(e) => onFacilityChange && onFacilityChange(e.target.value)}
              disabled={loading}
            >
              <option value="all">Tất cả cơ sở</option>
              {facilities.map((facility) => (
                <option key={facility._id || facility.id} value={facility._id || facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
          )}
          <select
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
              background: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              outline: "none",
              opacity: loading ? 0.6 : 1,
            }}
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            disabled={loading}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="approved">Đã duyệt</option>
            <option value="reported">Báo cáo</option>
          </select>
        </div>
      </div>
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Tìm theo khách hàng, sân, nội dung…"
        style={{ minWidth: 300 }}
      />
    </div>
  );
};

export default ReviewFilters;


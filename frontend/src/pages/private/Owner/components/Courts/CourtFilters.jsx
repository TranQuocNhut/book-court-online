import React from "react";
import SearchBar from "../shared/SearchBar";

const CourtFilters = ({
  searchQuery,
  onSearchChange,
  facilities = [],
  selectedFacilityFilter,
  onFacilityFilterChange,
  selectedStatusFilter,
  onStatusFilterChange,
  sportTypes = [],
  selectedSportFilter,
  onSportFilterChange,
  totalCount,
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: 16,
        borderBottom: "1px solid #e5e7eb",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <strong>Tổng:</strong> {totalCount} sân
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}> 
          <select
            value={selectedFacilityFilter}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
              background: "#fff",
              cursor: "pointer",
              outline: "none",
            }}
            onChange={(e) => onFacilityFilterChange(e.target.value)}
          >
            <option value="all">Tất cả cơ sở</option>
            {facilities.map((facility) => (
              <option key={facility._id || facility.id} value={facility._id || facility.id}>
                {facility.name}
              </option>
            ))}
          </select>
          
          <select
            value={selectedStatusFilter}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
              background: "#fff",
              cursor: "pointer",
              outline: "none",
            }}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="maintenance">Bảo trì</option>
            <option value="inactive">Tạm ngưng</option>
          </select>

          <select
            value={selectedSportFilter}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
              background: "#fff",
              cursor: "pointer",
              outline: "none",
            }}
            onChange={(e) => onSportFilterChange(e.target.value)}
          >
            <option value="all">Tất cả thể loại</option>
            {sportTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          
        </div>
      </div>
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Tìm theo tên, loại, mô tả…"
        style={{ minWidth: 300 }}
      />
    </div>
  );
};

export default CourtFilters;
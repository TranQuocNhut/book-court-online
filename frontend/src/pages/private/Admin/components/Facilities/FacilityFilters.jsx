import React from "react";
import { Search, Filter, X } from "lucide-react";

const FacilityFilters = ({
  searchQuery,
  onSearchChange,
  cityFilter,
  onCityChange,
  districtFilter,
  onDistrictChange,
  statusFilter,
  onStatusChange,
  sportFilter,
  onSportChange,
  dateFilter,
  onDateChange,
  totalResults,
  onReset,
  uniqueCities = [],
  filteredDistricts = [],
  uniqueSports = [],
}) => {
  const hasActiveFilters =
    cityFilter !== "all" ||
    districtFilter !== "all" ||
    statusFilter !== "all" ||
    sportFilter !== "all" ||
    dateFilter !== "";

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
      {/* Search bar và Filters cùng hàng */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        {/* Search bar */}
        <div style={{ flex: 1, minWidth: "300px", position: "relative" }}>
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
            placeholder="Tìm kiếm tên cơ sở, địa chỉ, chủ sân, môn thể thao..."
            style={{
              width: "100%",
              padding: "10px 10px 10px 36px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          />
        </div>

        {/* Thành phố/Tỉnh */}
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
            Thành phố/Tỉnh
          </label>
          <select
            value={cityFilter}
            onChange={(e) => onCityChange(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 13,
              minWidth: "160px",
              background: "#fff",
            }}
          >
            <option value="all">Tất cả thành phố/tỉnh</option>
            {uniqueCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Quận/Huyện */}
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
            Quận/Huyện
          </label>
          <select
            value={districtFilter}
            onChange={(e) => onDistrictChange(e.target.value)}
            disabled={cityFilter === "all"}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 13,
              minWidth: "160px",
              background: cityFilter === "all" ? "#f9fafb" : "#fff",
              cursor: cityFilter === "all" ? "not-allowed" : "pointer",
              opacity: cityFilter === "all" ? 0.6 : 1,
            }}
          >
            <option value="all">
              {cityFilter === "all" ? "Chọn thành phố/tỉnh trước" : "Tất cả quận/huyện"}
            </option>
            {filteredDistricts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>

        {/* Tình trạng */}
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
            Tình trạng
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 13,
              minWidth: "140px",
              background: "#fff",
            }}
          >
            <option value="all">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="paused">Tạm dừng</option>
            <option value="hidden">Đã ẩn</option>
          </select>
        </div>

        {/* Môn thể thao */}
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
            Môn thể thao
          </label>
          <select
            value={sportFilter}
            onChange={(e) => onSportChange(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 13,
              minWidth: "140px",
              background: "#fff",
            }}
          >
            <option value="all">Tất cả môn</option>
            {uniqueSports.map((sport) => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
        </div>

        {/* Ngày tạo */}
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
            Ngày tạo
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => onDateChange(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 13,
              minWidth: "140px",
              background: "#fff",
            }}
          />
        </div>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              background: "#f3f4f6",
              color: "#374151",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <X size={14} />
            Xóa bộ lọc
          </button>
        )}
      </div>
    </div>
  );
};

export default FacilityFilters;


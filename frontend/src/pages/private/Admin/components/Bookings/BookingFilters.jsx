import React from "react";
import { Filter, Search } from "lucide-react";

const BookingFilters = ({
  searchQuery,
  statusFilter,
  facilityFilter,
  customerFilter,
  dateFilter,
  uniqueFacilities,
  uniqueCustomers,
  onSearchChange,
  onStatusChange,
  onFacilityChange,
  onCustomerChange,
  onDateChange,
  onReset,
}) => {
  const hasFilters =
    statusFilter !== "all" ||
    facilityFilter !== "all" ||
    customerFilter !== "all" ||
    dateFilter ||
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
              placeholder="Mã đơn, tên sân, người đặt..."
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
            <option value="confirmed">Đã đặt</option>
            <option value="pending">Đã đặt (Chờ xử lý)</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
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
            Tên sân
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
            <option value="all">Tất cả sân</option>
            {uniqueFacilities.map((facility) => (
              <option key={facility} value={facility}>
                {facility}
              </option>
            ))}
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
            Người đặt
          </label>
          <select
            value={customerFilter}
            onChange={(e) => onCustomerChange(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          >
            <option value="all">Tất cả người đặt</option>
            {uniqueCustomers.map((customer) => (
              <option key={customer} value={customer}>
                {customer}
              </option>
            ))}
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
            Ngày đặt
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => onDateChange(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default BookingFilters;


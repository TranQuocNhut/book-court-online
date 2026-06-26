import React from "react";
import { Calendar } from "lucide-react";
import SearchBar from "../shared/SearchBar";

const BookingFilters = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  dateFilter,
  onDateFilterChange,
  pageSize,
  onPageSizeChange,
  totalCount,
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
          <strong>Tổng:</strong> {totalCount} đơn đặt sân
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
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
              background: "#fff",
              cursor: "pointer",
              outline: "none",
            }}
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="pending_payment">Chờ thanh toán</option>
            <option value="hold">Đang giữ chỗ</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="expired">Hết hạn</option>
            <option value="cancelled">Đã hủy</option>
            <option value="completed">Đã hoàn thành</option>
          </select>
          
          {/* Date Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={16} color="#6b7280" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => onDateFilterChange(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 14,
                background: "#fff",
                cursor: "pointer",
                outline: "none",
                minWidth: "150px",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3b82f6";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e7eb";
              }}
            />
            {dateFilter && (
              <button
                onClick={() => onDateFilterChange("")}
                style={{
                  padding: "4px 8px",
                  background: "#fee2e2",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
                title="Xóa bộ lọc ngày"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Tìm theo mã, khách hàng, sân, email…"
        style={{ minWidth: 300 }}
      />
    </div>
  );
};

export default BookingFilters;


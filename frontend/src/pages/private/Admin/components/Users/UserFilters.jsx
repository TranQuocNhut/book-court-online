import React from "react";
import { Filter } from "lucide-react";
import { SearchBar } from "../shared";

const UserFilters = ({ searchQuery, roleFilter, statusFilter, onSearchChange, onRoleChange, onStatusChange, onReset }) => {
  const hasFilters = roleFilter !== "all" || statusFilter !== "all" || searchQuery;

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
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Tên, email, số điện thoại..."
          />
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
            Vai trò
          </label>
          <select
            value={roleFilter}
            onChange={(e) => onRoleChange(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          >
            <option value="all">Tất cả</option>
            <option value="user">Người dùng thường</option>
            <option value="owner">Chủ cơ sở</option>
            <option value="admin">Quản trị viên</option>
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
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đã khóa</option>
            <option value="deleted">Đã xóa</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default UserFilters;


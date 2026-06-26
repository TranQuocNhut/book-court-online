import React from "react";
import { Loader2 } from "lucide-react";
import UserRow from "./UserRow";
import { Pagination } from "../shared";

const UserTable = ({
  users,
  loading,
  error,
  page,
  pageSize,
  totalUsers,
  onPageChange,
  onPageSizeChange,
  onView,
  onLock,
  onUnlock,
  onDelete,
  onRestore,
  onPromote,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
  const headers = [
    "Tên",
    "Email",
    "Số điện thoại",
    "Vai trò",
    "Cơ sở",
    "Ngày tham gia",
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
          Hiển thị {users.length} / {totalUsers} kết quả
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
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: "center" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Loader2
                      size={20}
                      className="animate-spin"
                      style={{ color: "#10b981" }}
                    />
                    <span style={{ color: "#6b7280" }}>Đang tải...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={8}
                  style={{ padding: 40, textAlign: "center", color: "#ef4444" }}
                >
                  {error}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{ padding: 40, textAlign: "center", color: "#6b7280" }}
                >
                  Không tìm thấy người dùng nào
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <UserRow
                  key={user._id || user.id}
                  user={user}
                  onView={() => onView(user)}
                  onLock={() => onLock(user)}
                  onUnlock={() => onUnlock(user)}
                  onDelete={() => onDelete(user)}
                  onRestore={() => onRestore(user)}
                  onPromote={() => onPromote(user)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && !error && users.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={totalUsers}
          onPageChange={(p) => onPageChange(p)}
          onPageSizeChange={onPageSizeChange}
          itemsLabel="người dùng"
        />
      )}
    </div>
  );
};

export default UserTable;


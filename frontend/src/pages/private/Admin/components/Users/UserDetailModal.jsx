import React from "react";

const UserDetailModal = ({ isOpen, user, onClose }) => {
  if (!isOpen || !user) return null;

  const getRoleBadge = (role) => {
    const configs = {
      owner: { label: "Chủ cơ sở", bg: "#e6f9f0", color: "#059669" },
      admin: { label: "Quản trị viên", bg: "#fef3c7", color: "#d97706" },
      user: { label: "Người dùng thường", bg: "#e6effe", color: "#4338ca" },
    };
    return configs[role] || configs.user;
  };

  const role = getRoleBadge(user.role);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          maxWidth: "600px",
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: 20 }}>
          Chi tiết tài khoản: {user.name}
        </h2>
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <strong>Tên:</strong> {user.name}
          </div>
          <div>
            <strong>Email:</strong> {user.email}
          </div>
          <div>
            <strong>Số điện thoại:</strong> {user.phone || "N/A"}
          </div>
          <div>
            <strong>Vai trò:</strong>{" "}
            <span
              style={{
                background: role.bg,
                color: role.color,
                padding: "4px 8px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {role.label}
            </span>
          </div>
          <div>
            <strong>Ngày tham gia:</strong>{" "}
            {user.createdAt
              ? new Date(user.createdAt).toLocaleDateString("vi-VN")
              : "N/A"}
          </div>
          <div>
            <strong>Đăng nhập lần cuối:</strong>{" "}
            {user.lastLogin
              ? new Date(user.lastLogin).toLocaleString("vi-VN")
              : "Chưa đăng nhập"}
          </div>
          {(user.facilities && user.facilities.length > 0) && (
            <div>
              <strong>Cơ sở ({user.facilities.length}):</strong>
              <ul style={{ marginTop: 8, marginLeft: 20 }}>
                {user.facilities.map((facility, idx) => (
                  <li key={facility._id || facility.id || idx} style={{ marginBottom: 4 }}>
                    <strong>{facility.name}</strong> - {facility.address || "N/A"}
                    <span
                      style={{
                        marginLeft: 8,
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontSize: 11,
                        background:
                          facility.status === "opening" || facility.status === "active"
                            ? "#e6f9f0"
                            : facility.status === "closed" || facility.status === "paused"
                            ? "#fee2e2"
                            : "#f3f4f6",
                        color:
                          facility.status === "opening" || facility.status === "active"
                            ? "#059669"
                            : facility.status === "closed" || facility.status === "paused"
                            ? "#ef4444"
                            : "#6b7280",
                      }}
                    >
                      {facility.status === "opening" || facility.status === "active"
                        ? "Đang hoạt động"
                        : facility.status === "closed"
                        ? "Đã đóng"
                        : facility.status === "paused"
                        ? "Tạm dừng"
                        : facility.status || "N/A"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <strong>Trạng thái:</strong>{" "}
            {user.isDeleted
              ? "Đã xóa"
              : user.isLocked
              ? "Đã khóa"
              : "Đang hoạt động"}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: 20,
            padding: "10px 20px",
            background: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

export default UserDetailModal;


import React from "react";
import UserActionButtons from "./UserActionButtons";
import { StatusBadge } from "../shared";

const getStatusValue = (user) => {
  if (user.isDeleted) {
    return "deleted";
  }
  if (user.isLocked) {
    return "locked";
  }
  return "active";
};

const getRoleBadge = (role) => {
  const configs = {
    owner: { label: "Chủ cơ sở", bg: "#e6f9f0", color: "#059669" },
    admin: { label: "Quản trị viên", bg: "#fef3c7", color: "#d97706" },
    user: { label: "Người dùng thường", bg: "#e6effe", color: "#4338ca" },
  };
  return configs[role] || configs.user;
};

const UserRow = ({ user, onView, onLock, onUnlock, onDelete, onRestore, onPromote }) => {
  const statusValue = getStatusValue(user);
  const role = getRoleBadge(user.role);

  return (
    <tr
      key={user._id || user.id}
      style={{
        borderBottom: "1px solid #f3f4f6",
        opacity: user.isDeleted ? 0.6 : 1,
      }}
    >
      <td style={{ padding: 12, fontWeight: 600 }}>{user.name}</td>
      <td style={{ padding: 12, color: "#6b7280" }}>{user.email}</td>
      <td style={{ padding: 12, color: "#6b7280" }}>{user.phone || "-"}</td>
      <td style={{ padding: 12 }}>
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
      </td>
      <td style={{ padding: 12, color: "#6b7280" }}>
        {user.role === "owner" && user.facilities && user.facilities.length > 0
          ? `${user.facilities.length} cơ sở`
          : "-"}
      </td>
      <td style={{ padding: 12, color: "#6b7280" }}>
        {user.createdAt
          ? new Date(user.createdAt).toLocaleDateString("vi-VN")
          : "N/A"}
      </td>
      <td style={{ padding: 12 }}>
        <StatusBadge value={statusValue} type="user" />
      </td>
      <td style={{ padding: 12, whiteSpace: "nowrap" }}>
        <UserActionButtons
          user={user}
          onView={onView}
          onLock={onLock}
          onUnlock={onUnlock}
          onDelete={onDelete}
          onRestore={onRestore}
          onPromote={onPromote}
        />
      </td>
    </tr>
  );
};

export default UserRow;


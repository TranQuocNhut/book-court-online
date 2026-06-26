import React from "react";
import { Eye, Lock, Unlock, Trash2, UserPlus, RotateCcw } from "lucide-react";
import { ActionButton } from "../shared";

const UserActionButtons = ({ user, onView, onLock, onUnlock, onDelete, onRestore, onPromote }) => {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <ActionButton bg="#06b6d4" Icon={Eye} onClick={onView} title="Xem chi tiết" size={12} />
      
      {!user.isDeleted && (
        <>
          {user.isLocked ? (
            <ActionButton bg="#10b981" Icon={Unlock} onClick={onUnlock} title="Mở khóa" size={12} />
          ) : (
            <ActionButton bg="#f59e0b" Icon={Lock} onClick={onLock} title="Khóa tài khoản" size={12} />
          )}
          <ActionButton bg="#ef4444" Icon={Trash2} onClick={onDelete} title="Xóa tài khoản" size={12} />
          {user.role === "user" && (
            <ActionButton bg="#8b5cf6" Icon={UserPlus} onClick={onPromote} title="Cấp quyền Owner" size={12} />
          )}
        </>
      )}
      
      {user.isDeleted && (
        <ActionButton bg="#10b981" Icon={RotateCcw} onClick={onRestore} title="Khôi phục tài khoản" size={12} />
      )}
    </div>
  );
};

export default UserActionButtons;


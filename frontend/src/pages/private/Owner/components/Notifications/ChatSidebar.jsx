import React from "react";
import { Search } from "lucide-react";

const ChatSidebar = ({
  notifications,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div
      style={{
        width: "350px",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #e5e7eb",
        color: "#1f2937",
      }}
    >
      {/* Header Sidebar */}
      <div style={{ padding: "20px", borderBottom: "1px solid #f3f4f6" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontSize: 24,
              fontWeight: 800,
              margin: 0,
              color: "#111827",
            }}
          >
            Hỗ trợ khách hàng
          </h2>
        </div>

        {/* Search Bar */}
        <div style={{ position: "relative" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
            }}
          />
          <input
            type="text"
            placeholder="Tìm kiếm khách hàng..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 12px 12px 40px",
              borderRadius: 24,
              border: "none",
              background: "#f3f4f6",
              color: "#1f2937",
              outline: "none",
              fontSize: 14,
            }}
          />
        </div>
      </div>

      {/* List Items */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {notifications.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#9ca3af",
            }}
          >
            <p>Không có cuộc trò chuyện nào</p>
          </div>
        ) : (
          notifications.map((item) => {
            const isActive = item.id === selectedId;
            const count = item.unreadCount || 0;
            const isUnread = count > 0;
            const displayCount = count > 5 ? "5+" : count;

            let bg = "transparent";
            if (isActive) bg = "#eff6ff";
            else if (isUnread) bg = "#fef2f2";

            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px 20px",
                  cursor: "pointer",
                  background: bg,
                  borderLeft: isActive
                    ? "4px solid #3b82f6"
                    : isUnread
                    ? "4px solid #ef4444"
                    : "4px solid transparent",
                  transition: "all 0.2s",
                  borderBottom: "1px solid #f3f4f6",
                }}
                onMouseEnter={(e) => {
                  if (!isActive && !isUnread)
                    e.currentTarget.style.background = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  if (!isActive && !isUnread)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                {/* Avatar */}
                <div style={{ position: "relative", marginRight: 14 }}>
                  {item.avatar ? (
                    <img
                      src={item.avatar}
                      alt={item.customerName}
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        // Fallback to default avatar if image fails to load
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: isUnread
                        ? "#fee2e2"
                        : isActive
                        ? "#dbeafe"
                        : "#e5e7eb",
                      color: isUnread
                        ? "#ef4444"
                        : isActive
                        ? "#2563eb"
                        : "#6b7280",
                      display: item.avatar ? "none" : "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 20,
                    }}
                  >
                    {item.customerName?.charAt(0).toUpperCase() || "K"}
                  </div>
                  {/* Chấm online/offline */}
                  <span
                    style={{
                      position: "absolute",
                      bottom: 2,
                      right: 2,
                      width: 12,
                      height: 12,
                      background: item.isOnline ? "#10b981" : "#9ca3af",
                      borderRadius: "50%",
                      border: "2px solid #fff",
                    }}
                  />
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: isUnread ? 700 : 600,
                        fontSize: 16,
                        color: "#111827",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "130px",
                      }}
                    >
                      {item.customerName || "Khách hàng"}
                    </span>

                    <span
                      style={{
                        fontSize: 12,
                        color: isUnread ? "#ef4444" : "#9ca3af",
                        fontWeight: isUnread ? 600 : 400,
                      }}
                    >
                      {item.lastMessageTime || "12:00"}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        color: isUnread ? "#374151" : "#6b7280",
                        fontWeight: isUnread ? 600 : 400,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "180px",
                      }}
                    >
                      {item.lastMessage || "Chưa có tin nhắn"}
                    </div>

                    {/* Badge số lượng tin nhắn chưa đọc */}
                    {isUnread && (
                      <div
                        style={{
                          background: "#ef4444",
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 700,
                          minWidth: 20,
                          height: 20,
                          padding: "0 6px",
                          borderRadius: 10,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: 8,
                          boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
                        }}
                      >
                        {displayCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;

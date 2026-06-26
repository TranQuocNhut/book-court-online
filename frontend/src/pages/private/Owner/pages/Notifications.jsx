import React, { useState, useMemo, useEffect } from "react";
import { useSocket } from "../../../../contexts/SocketContext";
import chatApi from "../../../../api/chatApi";
import { toast } from "react-toastify";
import ChatSidebar from "./../components/Notifications/ChatSidebar";
import ChatWindow from "./../components/Notifications/ChatWindow";

const Notifications = () => {
  const { ownerSocket, defaultSocket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lọc tin nhắn theo tìm kiếm
  const filteredNotifications = useMemo(
    () =>
      notifications.filter((r) =>
        [
          r.customerName,
          r.customerPhone,
          r.customerEmail,
          r.lastMessage,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ),
    [searchQuery, notifications]
  );

  // Fetch conversations từ API
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await chatApi.getConversations();
        if (response.success) {
          setNotifications(response.conversations);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
        // Sử dụng một Set để track các error đã hiển thị
        const errorKey = 'fetch_conversations_error';
        if (!window.chatErrorToastShown) {
          window.chatErrorToastShown = new Set();
        }
        if (!window.chatErrorToastShown.has(errorKey)) {
          window.chatErrorToastShown.add(errorKey);
          toast.error("Không thể tải danh sách cuộc trò chuyện");
          setTimeout(() => {
            window.chatErrorToastShown.delete(errorKey);
          }, 3000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Lắng nghe tin nhắn mới từ socket
  useEffect(() => {
    if (!ownerSocket || !isConnected) return;

    const handleNewMessage = (data) => {
      const { message, customerId } = data;
      
      setNotifications((prev) =>
        prev.map((conv) => {
          if (conv.customerId === customerId) {
            return {
              ...conv,
              lastMessage: message.text,
              lastMessageTime: new Date(message.timestamp).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              unreadCount: conv.id === selectedNotificationId ? 0 : (conv.unreadCount || 0) + 1,
              status: conv.id === selectedNotificationId ? "read" : "unread",
            };
          }
          return conv;
        })
      );
    };

    ownerSocket.on("chat:new_message", handleNewMessage);

    return () => {
      ownerSocket.off("chat:new_message", handleNewMessage);
    };
  }, [ownerSocket, isConnected, selectedNotificationId]);

  // Track online status của customers
  useEffect(() => {
    if (!defaultSocket || !isConnected || notifications.length === 0) return;

    // Lắng nghe thay đổi online status
    const handleOnlineStatus = (data) => {
      const { userId, online } = data;
      
      setNotifications((prev) =>
        prev.map((conv) => {
          if (conv.customerId === userId) {
            return {
              ...conv,
              isOnline: online,
            };
          }
          return conv;
        })
      );
    };

    defaultSocket.on("user:online_status", handleOnlineStatus);

    // Check online status cho tất cả customers khi load
    const checkAllOnlineStatus = () => {
      notifications.forEach((conv) => {
        if (conv.customerId && defaultSocket.connected) {
          defaultSocket.emit("check_user_online", { userId: conv.customerId }, (response) => {
            if (response && response.online !== undefined) {
              setNotifications((prev) =>
                prev.map((n) =>
                  n.customerId === conv.customerId
                    ? { ...n, isOnline: response.online }
                    : n
                )
              );
            }
          });
        }
      });
    };

    // Check sau 1 giây để đảm bảo socket đã sẵn sàng
    const timeout = setTimeout(checkAllOnlineStatus, 1000);

    return () => {
      clearTimeout(timeout);
      defaultSocket.off("user:online_status", handleOnlineStatus);
    };
  }, [defaultSocket, isConnected, notifications.length]);

  // Lấy nội dung tin nhắn đang chọn để hiển thị bên phải
  const selectedNotification = useMemo(
    () => notifications.find((n) => n.id === selectedNotificationId),
    [notifications, selectedNotificationId]
  );

  // --- HÀM QUAN TRỌNG: XỬ LÝ KHI CLICK VÀO TIN NHẮN ---
  const handleSelect = async (notification) => {
    // 1. Đặt ID tin nhắn này là tin nhắn đang xem
    setSelectedNotificationId(notification.id);

    // 2. Join conversation room
    if (ownerSocket && isConnected && notification.customerId) {
      ownerSocket.emit("chat:join_conversation", notification.customerId);
    }

    // 3. CẬP NHẬT TRẠNG THÁI "ĐÃ ĐỌC":
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id
          ? { ...n, unreadCount: 0, status: "read" }
          : n
      )
    );
  };

  const handleDelete = (id) => {
    // Leave conversation room
    const notification = notifications.find((n) => n.id === id);
    if (ownerSocket && isConnected && notification?.customerId) {
      ownerSocket.emit("chat:leave_conversation", notification.customerId);
    }

    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (selectedNotificationId === id) setSelectedNotificationId(null);
  };

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (ownerSocket && isConnected) {
        notifications.forEach((conv) => {
          if (conv.customerId) {
            ownerSocket.emit("chat:leave_conversation", conv.customerId);
          }
        });
      }
    };
  }, []);

  return (
    <div
      style={{
        // Các style để căn chỉnh full màn hình (như đã làm ở các bước trước)
        height: "calc(100vh - 60px)",
        margin: "-24px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          background: "#fff",
          borderTop: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        <ChatSidebar
          notifications={filteredNotifications}
          selectedId={selectedNotificationId}
          onSelect={handleSelect} // Truyền hàm xử lý đã sửa vào đây
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <ChatWindow
          notification={selectedNotification}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default Notifications;

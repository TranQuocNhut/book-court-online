import React, { useState, useEffect, useRef } from "react";
import { Send, Phone, Mail } from "lucide-react";
import { useSocket } from "../../../../../contexts/SocketContext";
import { useAuth } from "../../../../../contexts/AuthContext";
import chatApi from "../../../../../api/chatApi";
import { toast } from "react-toastify";
import EmojiPickerButton from "../../../../../components/chat/EmojiPicker";

const ChatWindow = ({ notification, onDelete }) => {
  const { ownerSocket, defaultSocket, isConnected } = useSocket();
  const { user } = useAuth();
  const [replyText, setReplyText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isCustomerOnline, setIsCustomerOnline] = useState(false);
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const errorToastShownRef = useRef(new Set());

  // --- HÀM TÍNH TOÁN THỜI GIAN HIỂN THỊ ---
  const getDisplayTime = (timestamp) => {
    if (!timestamp) return "";
    const now = Date.now();
    const diff = now - timestamp; // Khoảng cách thời gian (ms)
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;

    // Nếu quá 1 tuần thì hiện ngày cụ thể
    const date = new Date(timestamp);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Helper functions để lưu/load từ localStorage
  const getStorageKey = () => {
    if (!notification?.customerId) return null;
    return `chat_owner_${notification.customerId}`;
  };

  const loadMessagesFromStorage = () => {
    const key = getStorageKey();
    if (!key) return [];
    
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Error loading messages from storage:", error);
    }
    return [];
  };

  const saveMessagesToStorage = (msgs) => {
    const key = getStorageKey();
    if (!key) return;
    
    try {
      // Chỉ lưu 100 tin nhắn gần nhất để tránh localStorage quá lớn
      const messagesToSave = msgs.slice(-100);
      localStorage.setItem(key, JSON.stringify(messagesToSave));
    } catch (error) {
      console.error("Error saving messages to storage:", error);
      // Nếu localStorage đầy, xóa tin nhắn cũ nhất
      try {
        const messagesToSave = msgs.slice(-50);
        localStorage.setItem(key, JSON.stringify(messagesToSave));
      } catch (e) {
        console.error("Error saving reduced messages:", e);
      }
    }
  };

  // Fetch messages từ API khi chọn conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!notification || !notification.customerId) {
        setMessages([]);
        return;
      }

      // Load từ localStorage trước để hiển thị nhanh
      const cachedMessages = loadMessagesFromStorage();
      if (cachedMessages.length > 0) {
        setMessages(cachedMessages);
      }

      try {
        setLoading(true);
        const response = await chatApi.getMessages(notification.customerId);
        if (response.success) {
          // Merge messages: ưu tiên messages từ API, nhưng giữ lại temp messages
          setMessages((prev) => {
            const tempMessages = prev.filter((msg) => msg.id.startsWith("temp_"));
            const apiMessages = response.messages;
            
            // Merge và loại bỏ duplicate
            const merged = [...apiMessages];
            tempMessages.forEach((tempMsg) => {
              if (!merged.some((msg) => msg.id === tempMsg.id)) {
                merged.push(tempMsg);
              }
            });
            
            // Sort theo timestamp
            merged.sort((a, b) => a.timestamp - b.timestamp);
            
            // Lưu vào localStorage
            saveMessagesToStorage(merged);
            
            return merged;
          });
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        // Nếu API fail, vẫn dùng messages từ localStorage
        if (cachedMessages.length === 0) {
          const errorKey = 'load_messages_error';
          if (!errorToastShownRef.current.has(errorKey)) {
            errorToastShownRef.current.add(errorKey);
            toast.error("Không thể tải tin nhắn");
            setTimeout(() => {
              errorToastShownRef.current.delete(errorKey);
            }, 3000);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [notification?.customerId]);

  // Lắng nghe tin nhắn mới từ socket
  useEffect(() => {
    if (!ownerSocket || !isConnected || !notification?.customerId) return;

    const handleNewMessage = (data) => {
      const { message } = data;
      
      // Chỉ thêm tin nhắn nếu là từ customer hiện tại
      if (data.customerId === notification.customerId) {
        setMessages((prev) => {
          // Kiểm tra xem tin nhắn đã tồn tại chưa
          const exists = prev.some((msg) => msg.id === message.id);
          if (exists) return prev;
          
          const updated = [...prev, message];
          // Lưu vào localStorage
          saveMessagesToStorage(updated);
          return updated;
        });
      }
    };

    ownerSocket.on("chat:new_message", handleNewMessage);

    return () => {
      ownerSocket.off("chat:new_message", handleNewMessage);
    };
  }, [ownerSocket, isConnected, notification?.customerId]);

  // Cuộn xuống cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Tự động lưu messages vào localStorage mỗi khi có thay đổi
  useEffect(() => {
    if (messages.length > 0 && notification?.customerId) {
      saveMessagesToStorage(messages);
    }
  }, [messages, notification?.customerId]);

  // Track online status của customer
  useEffect(() => {
    if (!notification?.customerId || !defaultSocket || !isConnected) {
      setIsCustomerOnline(false);
      return;
    }

    // Check online status khi mở chat
    const checkOnlineStatus = () => {
      if (defaultSocket && defaultSocket.connected) {
        defaultSocket.emit('check_user_online', { userId: notification.customerId }, (response) => {
          if (response && response.online !== undefined) {
            setIsCustomerOnline(response.online);
          }
        });
      }
    };

    checkOnlineStatus();

    // Lắng nghe thay đổi online status
    const handleOnlineStatus = (data) => {
      if (data.userId === notification.customerId) {
        setIsCustomerOnline(data.online);
      }
    };

    defaultSocket.on('user:online_status', handleOnlineStatus);

    return () => {
      defaultSocket.off('user:online_status', handleOnlineStatus);
    };
  }, [defaultSocket, isConnected, notification?.customerId]);

  // Lắng nghe typing indicator từ customer
  useEffect(() => {
    if (!ownerSocket || !isConnected || !notification?.customerId) return;

    const handleTyping = (data) => {
      if (data.userId === notification.customerId) {
        setIsCustomerTyping(data.isTyping);
        
        // Tự động ẩn sau 3 giây nếu không có tin nhắn mới
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        if (data.isTyping) {
          typingTimeoutRef.current = setTimeout(() => {
            setIsCustomerTyping(false);
          }, 3000);
        }
      }
    };

    ownerSocket.on('chat:typing', handleTyping);

    return () => {
      ownerSocket.off('chat:typing', handleTyping);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [ownerSocket, isConnected, notification?.customerId]);

  // Emit typing status khi owner đang gõ
  useEffect(() => {
    if (!ownerSocket || !isConnected || !notification?.customerId) return;

    let typingTimeout;
    
    if (replyText.trim().length > 0) {
      // Emit typing khi có text
      ownerSocket.emit('chat:typing', {
        customerId: notification.customerId,
        isTyping: true,
      });

      // Clear timeout cũ
      if (typingTimeout) clearTimeout(typingTimeout);

      // Emit stop typing sau 1 giây không gõ
      typingTimeout = setTimeout(() => {
        if (ownerSocket && ownerSocket.connected) {
          ownerSocket.emit('chat:typing', {
            customerId: notification.customerId,
            isTyping: false,
          });
        }
      }, 1000);
    } else {
      // Emit stop typing khi input rỗng
      ownerSocket.emit('chat:typing', {
        customerId: notification.customerId,
        isTyping: false,
      });
    }

    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [replyText, ownerSocket, isConnected, notification?.customerId]);

  // --- XỬ LÝ GỬI TIN NHẮN ---
  const handleSendMessage = async () => {
    if (!replyText.trim() || !notification || !notification.customerId || sending) return;

    const messageText = replyText.trim();
    setReplyText("");
    setSending(true);

    // Optimistic update - hiển thị tin nhắn ngay
    const tempId = `temp_${Date.now()}`;
    const tempMessage = {
      id: tempId,
      text: messageText,
      sender: "owner",
      timestamp: Date.now(),
      showTime: true,
      isRead: false,
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      // Gửi qua socket
      if (ownerSocket && isConnected) {
        ownerSocket.emit("chat:send_message", {
          customerId: notification.customerId,
          message: messageText,
          facilityId: notification.facility || null,
        });

        // Lắng nghe confirmation
        const handleMessageSent = (data) => {
          if (data.message) {
            setMessages((prev) => {
              const updated = prev.map((msg) =>
                msg.id === tempId ? data.message : msg
              );
              saveMessagesToStorage(updated);
              return updated;
            });
            ownerSocket.off("chat:message_sent", handleMessageSent);
          }
        };

        ownerSocket.on("chat:message_sent", handleMessageSent);

        // Fallback: gửi qua API nếu socket không hoạt động
        setTimeout(async () => {
          try {
            const response = await chatApi.sendMessage(
              notification.customerId,
              messageText,
              notification.facility || null
            );
            if (response.success && response.message) {
              setMessages((prev) => {
                const updated = prev.map((msg) =>
                  msg.id === tempId ? response.message : msg
                );
                saveMessagesToStorage(updated);
                return updated;
              });
            }
          } catch (error) {
            console.error("Error sending message via API:", error);
            // Xóa tin nhắn tạm nếu lỗi
            setMessages((prev) => {
              const updated = prev.filter((msg) => msg.id !== tempId);
              saveMessagesToStorage(updated);
              return updated;
            });
            const errorKey = 'send_message_error';
            if (!errorToastShownRef.current.has(errorKey)) {
              errorToastShownRef.current.add(errorKey);
              toast.error("Không thể gửi tin nhắn");
              setTimeout(() => {
                errorToastShownRef.current.delete(errorKey);
              }, 3000);
            }
          }
        }, 2000);
      } else {
        // Gửi qua API nếu socket không kết nối
        const response = await chatApi.sendMessage(
          notification.customerId,
          messageText,
          notification.facility || null
        );
        if (response.success && response.message) {
          setMessages((prev) => {
            const updated = prev.map((msg) =>
              msg.id === tempId ? response.message : msg
            );
            saveMessagesToStorage(updated);
            return updated;
          });
        }
      }

    // --- LOGIC TỰ ĐỘNG ẨN SAU 3 GIÂY ---
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
            msg.id === tempId || (msg.id === tempMessage.id && msg.showTime)
              ? { ...msg, showTime: false }
              : msg
          )
        );
      }, 3000);
    } catch (error) {
      console.error("Error sending message:", error);
      // Xóa tin nhắn tạm nếu lỗi
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      const errorKey = 'send_message_error';
      if (!errorToastShownRef.current.has(errorKey)) {
        errorToastShownRef.current.add(errorKey);
        toast.error("Không thể gửi tin nhắn");
        setTimeout(() => {
          errorToastShownRef.current.delete(errorKey);
        }, 3000);
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emoji) => {
    setReplyText((prev) => prev + emoji);
  };

  // --- XỬ LÝ CLICK VÀO TIN NHẮN ĐỂ HIỆN/ẨN GIỜ ---
  const toggleTimeVisibility = (msgId) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId ? { ...msg, showTime: !msg.showTime } : msg
      )
    );
  };

  if (!notification) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fafb",
          color: "#9ca3af",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "#e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Send size={32} color="#9ca3af" />
        </div>
        <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>
          Chọn một khách hàng để bắt đầu trò chuyện
        </p>
        <p style={{ fontSize: 14, marginTop: 8, color: "#6b7280" }}>
          Chọn từ danh sách bên trái để xem tin nhắn
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#fff",
      }}
    >
      {/* Header với thông tin khách hàng */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Avatar */}
          <div style={{ position: "relative" }}>
            {notification.avatar ? (
              <img
                src={notification.avatar}
                alt={notification.customerName}
                style={{
                  width: 48,
                  height: 48,
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
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#dbeafe",
                color: "#2563eb",
                display: notification.avatar ? "none" : "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              {notification.customerName?.charAt(0).toUpperCase() || "K"}
            </div>
          <span
            style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 14,
                height: 14,
                background: isCustomerOnline ? "#10b981" : "#9ca3af",
                borderRadius: "50%",
                border: "2px solid #fff",
              }}
            />
          </div>

          {/* Thông tin khách hàng */}
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
              fontWeight: 600,
                color: "#1f2937",
              }}
            >
              {notification.customerName || "Khách hàng"}
            </h3>
            <div
              style={{
              display: "flex",
              alignItems: "center",
                gap: 12,
              marginTop: 4,
            }}
          >
            <span
              style={{
                  fontSize: 13,
                  color: isCustomerOnline ? "#10b981" : "#9ca3af",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                borderRadius: "50%",
                    background: isCustomerOnline ? "#10b981" : "#9ca3af",
                  }}
                />
                {isCustomerOnline ? "Đang hoạt động" : "Ngoại tuyến"}
              </span>
              {notification.customerPhone && (
                <span
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Phone size={14} />
                  {notification.customerPhone}
          </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          {notification.customerEmail && (
            <button
              onClick={() => window.open(`mailto:${notification.customerEmail}`)}
              style={{
                padding: "8px",
                borderRadius: 8,
                border: "none",
                background: "#f3f4f6",
                color: "#6b7280",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Gửi email"
            >
              <Mail size={18} />
            </button>
          )}
          {notification.customerPhone && (
            <button
              onClick={() => window.open(`tel:${notification.customerPhone}`)}
              style={{
                padding: "8px",
                borderRadius: 8,
                border: "none",
                background: "#f3f4f6",
                color: "#6b7280",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Gọi điện"
            >
              <Phone size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        style={{
          flex: 1,
          padding: "24px",
          background: "#f9fafb",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {loading ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9ca3af",
            }}
          >
            <p>Đang tải tin nhắn...</p>
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9ca3af",
            }}
          >
            <p>Chưa có tin nhắn nào trong cuộc trò chuyện này</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwner = msg.sender === "owner" || msg.sender === "me";
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const showAvatar =
              !prevMsg || prevMsg.sender !== msg.sender || index === 0;
            const showTime =
              msg.showTime ||
              !prevMsg ||
              msg.timestamp - prevMsg.timestamp > 300000; // 5 phút

          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                gap: 12,
                maxWidth: "70%",
                  alignSelf: isOwner ? "flex-end" : "flex-start",
                  flexDirection: isOwner ? "row-reverse" : "row",
                  cursor: "pointer",
                }}
              onClick={() => toggleTimeVisibility(msg.id)}
            >
                {/* Avatar - chỉ hiện khi cần */}
                {showAvatar ? (
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    {isOwner ? (
                      // Owner avatar - lấy từ user context hoặc message data
                      <>
                        {msg.senderAvatar || user?.avatar ? (
                          <img
                            src={msg.senderAvatar || user.avatar}
                            alt={user?.name || "Owner"}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "#3b82f6",
                            display: (msg.senderAvatar || user?.avatar) ? "none" : "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {user?.name?.charAt(0).toUpperCase() || "CS"}
                        </div>
                      </>
                    ) : (
                      // Customer avatar
                      <>
                        {msg.senderAvatar || notification.avatar ? (
                          <img
                            src={msg.senderAvatar || notification.avatar}
                            alt={notification.customerName}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
              <div
                style={{
                            width: 36,
                            height: 36,
                  borderRadius: "50%",
                            background: "#10b981",
                            display: (msg.senderAvatar || notification.avatar) ? "none" : "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                            fontSize: 14,
                  fontWeight: 700,
                          }}
                        >
                          {notification.customerName?.charAt(0).toUpperCase() ||
                            "K"}
                        </div>
                      </>
                    )}
              </div>
                ) : (
                  <div style={{ width: 36, flexShrink: 0 }} />
                )}

              {/* Message Bubble + Time */}
                <div style={{ flex: 1 }}>
                <div
                  style={{
                      background: isOwner ? "#3b82f6" : "#fff",
                      padding: "10px 14px",
                      borderRadius: isOwner
                        ? "18px 4px 18px 18px"
                        : "4px 18px 18px 18px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      border: isOwner ? "none" : "1px solid #e5e7eb",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      lineHeight: 1.5,
                        color: isOwner ? "#fff" : "#374151",
                      fontSize: 15,
                        wordBreak: "break-word",
                    }}
                  >
                    {msg.text}
                  </p>
                </div>

                  {/* Thời gian */}
                  {showTime && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      marginTop: 4,
                      display: "block",
                        textAlign: isOwner ? "right" : "left",
                        padding: "0 4px",
                    }}
                  >
                    {getDisplayTime(msg.timestamp)}
                  </span>
                )}
              </div>
            </div>
          );
          })
        )}
        
        {/* Typing indicator */}
        {isCustomerTyping && (
          <div
            style={{
              display: "flex",
              gap: 12,
              maxWidth: "70%",
              alignSelf: "flex-start",
              flexDirection: "row",
            }}
          >
            {notification.avatar ? (
              <img
                src={notification.avatar}
                alt={notification.customerName}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#e5e7eb",
                display: notification.avatar ? "none" : "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6b7280",
                fontSize: 14,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {notification.customerName?.charAt(0).toUpperCase() || "K"}
            </div>
            <div
              style={{
                background: "#fff",
                padding: "12px 16px",
                borderRadius: "0 12px 12px 12px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb",
                display: "flex",
                gap: 4,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#9ca3af",
                  animation: "typing 1.4s infinite",
                }}
              />
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#9ca3af",
                  animation: "typing 1.4s infinite 0.2s",
                }}
              />
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#9ca3af",
                  animation: "typing 1.4s infinite 0.4s",
                }}
              />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <style>{`
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>

      {/* Input */}
      <div
        style={{
          padding: "16px 24px",
          background: "#fff",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          gap: 12,
          alignItems: "flex-end",
        }}
      >
        <EmojiPickerButton onEmojiClick={handleEmojiClick} />
        <input
          type="text"
          placeholder="Nhập tin nhắn..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            background: "#f3f4f6",
            border: "1px solid #e5e7eb",
            borderRadius: 24,
            padding: "12px 20px",
            outline: "none",
            fontSize: 15,
            color: "#1f2937",
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!replyText.trim() || sending}
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: replyText.trim() && !sending ? "#3b82f6" : "#e5e7eb",
            border: "none",
            color: replyText.trim() && !sending ? "#fff" : "#9ca3af",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: replyText.trim() && !sending ? "pointer" : "not-allowed",
            transition: "all 0.2s",
          }}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;

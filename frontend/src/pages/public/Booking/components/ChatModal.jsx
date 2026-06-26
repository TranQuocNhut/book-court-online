import React, { useState, useEffect, useRef } from 'react'
import { X, Send, MessageCircle } from 'lucide-react'
import { facilityApi } from '../../../../api/facilityApi'
import customerChatApi from '../../../../api/customerChatApi'
import { useAuth } from '../../../../contexts/AuthContext'
import { useSocket } from '../../../../contexts/SocketContext'
import { toast } from 'react-toastify'
import useDeviceType from '../../../../hook/use-device-type'
import useClickOutside from '../../../../hook/use-click-outside'
import useBodyScrollLock from '../../../../hook/use-body-scroll-lock'
import useEscapeKey from '../../../../hook/use-escape-key'
import EmojiPickerButton from '../../../../components/chat/EmojiPicker'

function ChatModal({ isOpen, onClose, venueId }) {
  const { user, isAuthenticated } = useAuth()
  const { isMobile } = useDeviceType()
  const { defaultSocket, isConnected } = useSocket()
  const modalRef = useClickOutside(onClose, isOpen)
  useBodyScrollLock(isOpen)
  useEscapeKey(onClose, isOpen)
  
  const [facility, setFacility] = useState(null)
  const [owner, setOwner] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isOwnerOnline, setIsOwnerOnline] = useState(false)
  const [isOwnerTyping, setIsOwnerTyping] = useState(false)
  const typingTimeoutRef = useRef(null)
  const messagesEndRef = useRef(null)
  const errorToastShownRef = useRef(new Set())

  useEffect(() => {
    if (!isOpen) return

    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để nhắn tin')
      onClose()
      return
    }

    if (!venueId) {
      const errorKey = 'no_venue_id';
      if (!errorToastShownRef.current.has(errorKey)) {
        errorToastShownRef.current.add(errorKey);
        toast.error('Không tìm thấy thông tin cơ sở');
        setTimeout(() => {
          errorToastShownRef.current.delete(errorKey);
        }, 3000);
      }
      onClose()
      return
    }

    fetchFacilityData()
  }, [isOpen, venueId, isAuthenticated])

  useEffect(() => {
    if (!owner || !defaultSocket || !isOpen) return

    const checkOwnerStatus = () => {
      if (defaultSocket && defaultSocket.connected) {
        defaultSocket.emit('check_user_online', { userId: owner._id || owner.id }, (response) => {
          if (response && response.online !== undefined) {
            setIsOwnerOnline(response.online)
            const ownerId = owner._id || owner.id
            localStorage.setItem(`owner_online_${ownerId}`, String(response.online))
          }
        })
      } else {
        setIsOwnerOnline(false)
      }
    }

    // Check ngay khi mở
    checkOwnerStatus()
    
    // Check định kỳ mỗi 30 giây
    const interval = setInterval(checkOwnerStatus, 30000)

    // Lắng nghe thay đổi online status realtime
    const handleOnlineStatus = (data) => {
      if (data.userId === (owner._id || owner.id)) {
        setIsOwnerOnline(data.online)
        localStorage.setItem(`owner_online_${owner._id || owner.id}`, String(data.online))
      }
    }

    defaultSocket.on('user:online_status', handleOnlineStatus)

    return () => {
      clearInterval(interval)
      defaultSocket.off('user:online_status', handleOnlineStatus)
    }
  }, [owner, defaultSocket, isOpen])

  // Lắng nghe typing indicator từ owner
  useEffect(() => {
    if (!defaultSocket || !isConnected || !owner?._id || !isOpen) return

    const handleTyping = (data) => {
      if (data.userId === (owner._id || owner.id)) {
        setIsOwnerTyping(data.isTyping)
        
        // Tự động ẩn sau 3 giây nếu không có tin nhắn mới
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
        
        if (data.isTyping) {
          typingTimeoutRef.current = setTimeout(() => {
            setIsOwnerTyping(false)
          }, 3000)
        }
      }
    }

    defaultSocket.on('chat:typing', handleTyping)

    return () => {
      defaultSocket.off('chat:typing', handleTyping)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [defaultSocket, isConnected, owner?._id, isOpen])

  // Emit typing status khi customer đang gõ
  useEffect(() => {
    if (!defaultSocket || !isConnected || !owner?._id || !isOpen) return

    let typingTimeout
    
    if (newMessage.trim().length > 0) {
      // Emit typing khi có text
      defaultSocket.emit('chat:typing', {
        ownerId: owner._id,
        isTyping: true,
      })

      // Clear timeout cũ
      if (typingTimeout) clearTimeout(typingTimeout)

      // Emit stop typing sau 1 giây không gõ
      typingTimeout = setTimeout(() => {
        if (defaultSocket && defaultSocket.connected) {
          defaultSocket.emit('chat:typing', {
            ownerId: owner._id,
            isTyping: false,
          })
        }
      }, 1000)
    } else {
      // Emit stop typing khi input rỗng
      defaultSocket.emit('chat:typing', {
        ownerId: owner._id,
        isTyping: false,
      })
    }

    return () => {
      if (typingTimeout) clearTimeout(typingTimeout)
    }
  }, [newMessage, defaultSocket, isConnected, owner?._id, isOpen])

  const fetchFacilityData = async () => {
    try {
      setLoading(true)
      const result = await facilityApi.getFacilityById(venueId)
      
      if (result.success && result.data) {
        setFacility(result.data)
        if (result.data.owner) {
          setOwner(result.data.owner)
          // loadMessages sẽ được gọi tự động qua useEffect khi owner được set
        }
      } else {
        const errorKey = 'facility_not_found';
        if (!errorToastShownRef.current.has(errorKey)) {
          errorToastShownRef.current.add(errorKey);
          toast.error('Không tìm thấy thông tin cơ sở');
          setTimeout(() => {
            errorToastShownRef.current.delete(errorKey);
          }, 3000);
        }
        onClose()
      }
    } catch (error) {
      console.error('Error fetching facility:', error);
      const errorKey = 'fetch_facility_error';
      if (!errorToastShownRef.current.has(errorKey)) {
        errorToastShownRef.current.add(errorKey);
        toast.error('Không thể tải thông tin cơ sở');
        setTimeout(() => {
          errorToastShownRef.current.delete(errorKey);
        }, 3000);
      }
      onClose()
    } finally {
      setLoading(false)
    }
  }

  // Helper functions để lưu/load từ localStorage
  const getStorageKey = (ownerId, facilityId) => {
    const owner = ownerId || owner?._id;
    const venue = facilityId || venueId;
    if (!owner || !venue) return null;
    // Đảm bảo ownerId là string
    const ownerIdStr = typeof owner === 'string' ? owner : (owner._id || owner.id || owner);
    return `chat_customer_${ownerIdStr}_${venue}`;
  };

  const loadMessagesFromStorage = (ownerId, facilityId) => {
    const key = getStorageKey(ownerId, facilityId);
    if (!key) return [];
    
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.error('Error loading messages from storage:', error);
    }
    return [];
  };

  const saveMessagesToStorage = (msgs, ownerId, facilityId) => {
    const key = getStorageKey(ownerId, facilityId);
    if (!key || !msgs || !Array.isArray(msgs)) return;
    
    try {
      // Chỉ lưu 100 tin nhắn gần nhất để tránh localStorage quá lớn
      const messagesToSave = msgs.slice(-100);
      localStorage.setItem(key, JSON.stringify(messagesToSave));
    } catch (error) {
      console.error('Error saving messages to storage:', error);
      // Nếu localStorage đầy, xóa tin nhắn cũ nhất
      try {
        const messagesToSave = msgs.slice(-50);
        localStorage.setItem(key, JSON.stringify(messagesToSave));
      } catch (e) {
        console.error('Error saving reduced messages:', e);
      }
    }
  };

  // Load messages từ API
  const loadMessages = async () => {
    if (!owner?._id || !venueId) return;
    
    const ownerId = owner._id || owner.id;
    
    // Load từ localStorage trước để hiển thị nhanh
    const cachedMessages = loadMessagesFromStorage(ownerId, venueId);
    if (cachedMessages.length > 0) {
      setMessages(cachedMessages);
    }
    
    try {
      const response = await customerChatApi.getMessages(ownerId);
      if (response.success && response.messages) {
        // Merge messages: ưu tiên messages từ API, nhưng giữ lại temp messages
        setMessages((prev) => {
          const tempMessages = prev.filter((msg) => msg.id && msg.id.startsWith("temp_"));
          const apiMessages = response.messages || [];
          
          // Tạo map để loại bỏ duplicate dựa trên id
          const messageMap = new Map();
          
          // Thêm messages từ API trước
          apiMessages.forEach((msg) => {
            if (msg.id) {
              messageMap.set(msg.id, msg);
            }
          });
          
          // Thêm temp messages nếu chưa có trong map
          tempMessages.forEach((tempMsg) => {
            if (tempMsg.id && !messageMap.has(tempMsg.id)) {
              messageMap.set(tempMsg.id, tempMsg);
            }
          });
          
          // Chuyển map thành array và sort theo timestamp
          const merged = Array.from(messageMap.values()).sort((a, b) => {
            const timeA = a.timestamp || 0;
            const timeB = b.timestamp || 0;
            return timeA - timeB;
          });
          
          // Lưu vào localStorage
          saveMessagesToStorage(merged, ownerId, venueId);
          
          return merged;
        });
      }
      } catch (error) {
      console.error('Error loading messages:', error);
      // Nếu API fail, vẫn dùng messages từ localStorage
      if (cachedMessages.length === 0) {
        const errorKey = 'load_messages_error';
        if (!errorToastShownRef.current.has(errorKey)) {
          errorToastShownRef.current.add(errorKey);
          toast.error('Không thể tải tin nhắn');
          // Reset sau 3 giây để có thể hiển thị lại nếu cần
          setTimeout(() => {
            errorToastShownRef.current.delete(errorKey);
          }, 3000);
        }
      }
    }
  }
  
  // Load messages khi owner và venueId có sẵn
  useEffect(() => {
    if (isOpen && owner?._id && venueId) {
      loadMessages();
    }
  }, [isOpen, owner?._id, venueId]);

  // Lắng nghe tin nhắn mới từ owner qua socket
  useEffect(() => {
    if (!defaultSocket || !isConnected || !owner?._id || !isOpen) return;

    const handleNewMessage = (data) => {
      const { message } = data;
      
      setMessages((prev) => {
        // Kiểm tra xem tin nhắn đã tồn tại chưa
        const exists = prev.some((msg) => msg.id === message.id);
        if (exists) return prev;
        
        const updated = [...prev, message];
        // Lưu vào localStorage
        if (owner?._id && venueId) {
          const ownerId = owner._id || owner.id;
          saveMessagesToStorage(updated, ownerId, venueId);
        }
        return updated;
      });
    };

    defaultSocket.on('chat:new_message', handleNewMessage);

    return () => {
      defaultSocket.off('chat:new_message', handleNewMessage);
    };
  }, [defaultSocket, isConnected, owner?._id, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  // Tự động lưu messages vào localStorage mỗi khi có thay đổi
  useEffect(() => {
    if (messages.length > 0 && owner?._id && venueId) {
      const ownerId = owner._id || owner.id;
      saveMessagesToStorage(messages, ownerId, venueId);
    }
  }, [messages, owner?._id, venueId])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !owner?._id) return

    const messageText = newMessage.trim();
    setSending(true);
    setNewMessage('');

    // Optimistic update
    const tempId = `temp_${Date.now()}`;
    const tempMessage = {
      id: tempId,
      text: messageText,
      sender: 'customer',
      timestamp: Date.now(),
      showTime: true,
      isRead: false,
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      // Gửi qua socket
      if (defaultSocket && isConnected) {
        defaultSocket.emit('chat:send_to_owner', {
          ownerId: owner._id,
          message: messageText,
          facilityId: venueId || null,
        });

        // Lắng nghe confirmation
        const handleMessageSent = (data) => {
          if (data.message) {
            setMessages((prev) => {
              const updated = prev.map((msg) =>
                msg.id === tempId ? data.message : msg
              );
              if (owner?._id && venueId) {
                const ownerId = owner._id || owner.id;
                saveMessagesToStorage(updated, ownerId, venueId);
              }
              return updated;
            });
            defaultSocket.off('chat:message_sent', handleMessageSent);
          }
        };

        defaultSocket.on('chat:message_sent', handleMessageSent);

        // Fallback: gửi qua API nếu socket không hoạt động
        setTimeout(async () => {
          try {
            const response = await customerChatApi.sendMessage(
              owner._id,
              messageText,
              venueId || null
            );
            if (response.success && response.message) {
              setMessages((prev) => {
                const updated = prev.map((msg) =>
                  msg.id === tempId ? response.message : msg
                );
                if (owner?._id && venueId) {
                  const ownerId = owner._id || owner.id;
                  saveMessagesToStorage(updated, ownerId, venueId);
                }
                return updated;
              });
            }
          } catch (error) {
            console.error('Error sending message via API:', error);
            setMessages((prev) => {
              const updated = prev.filter((msg) => msg.id !== tempId);
              if (owner?._id && venueId) {
                const ownerId = owner._id || owner.id;
                saveMessagesToStorage(updated, ownerId, venueId);
              }
              return updated;
            });
            const errorKey = 'send_message_error';
            if (!errorToastShownRef.current.has(errorKey)) {
              errorToastShownRef.current.add(errorKey);
              toast.error('Không thể gửi tin nhắn');
      setTimeout(() => {
                errorToastShownRef.current.delete(errorKey);
              }, 3000);
            }
          }
        }, 2000);
      } else {
        // Gửi qua API nếu socket không kết nối
        const response = await customerChatApi.sendMessage(
          owner._id,
          messageText,
          venueId || null
        );
        if (response.success && response.message) {
          setMessages((prev) => {
            const updated = prev.map((msg) =>
              msg.id === tempId ? response.message : msg
            );
            if (owner?._id && venueId) {
              const ownerId = owner._id || owner.id;
              saveMessagesToStorage(updated, ownerId, venueId);
            }
            return updated;
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      const errorKey = 'send_message_error';
      if (!errorToastShownRef.current.has(errorKey)) {
        errorToastShownRef.current.add(errorKey);
        toast.error('Không thể gửi tin nhắn');
        setTimeout(() => {
          errorToastShownRef.current.delete(errorKey);
        }, 3000);
      }
    } finally {
      setSending(false);
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleEmojiClick = (emoji) => {
    setNewMessage((prev) => prev + emoji)
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
      return 'Vừa xong';
    }
    
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)} phút trước`;
    }
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: isMobile ? '0' : '20px'
    }}
    onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : '600px',
          height: isMobile ? '100vh' : '80vh',
          maxHeight: isMobile ? '100vh' : '700px',
          background: '#fff',
          borderRadius: isMobile ? '0' : '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {loading ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ color: '#6b7280' }}>Đang tải...</p>
          </div>
        ) : facility && owner ? (
          <>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>

            <div style={{
              background: '#fff',
              borderBottom: '1px solid #e5e7eb',
              padding: isMobile ? '12px 16px' : '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexShrink: 0
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {owner?.avatar ? (
                  <>
                    <img
                      src={owner.avatar}
                      alt={owner.name}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: isOwnerOnline ? '#10b981' : '#9ca3af',
                      border: '2px solid #fff',
                      boxShadow: isOwnerOnline ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none',
                      transition: 'all 0.3s'
                    }}></div>
                  </>
                ) : null}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: owner?.avatar ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: '600',
                fontSize: '16px',
                flexShrink: 0,
                position: 'relative'
              }}>
                {owner.name?.charAt(0)?.toUpperCase() || 'O'}
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: isOwnerOnline ? '#10b981' : '#9ca3af',
                  border: '2px solid #fff',
                  boxShadow: isOwnerOnline ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none',
                  transition: 'all 0.3s'
                }}></div>
                </div>
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{
                  margin: 0,
                  fontSize: isMobile ? '16px' : '18px',
                  fontWeight: '600',
                  color: '#1f2937',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {facility.name}
                </h2>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '13px',
                  color: '#6b7280',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {owner.name} {isOwnerOnline ? '• Đang hoạt động' : '• Offline'}
                </p>
              </div>

              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  transition: 'background 0.2s',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: isMobile ? '16px' : '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {messages.length === 0 ? (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  textAlign: 'center',
                  padding: '40px 20px'
                }}>
                  <MessageCircle size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>
                    Chưa có tin nhắn nào
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.7 }}>
                    Bắt đầu cuộc trò chuyện với chủ sân
                  </p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isMyMessage = message.sender === 'customer'
                  const prevMessage = index > 0 ? messages[index - 1] : null
                  const showAvatar = !prevMessage || prevMessage.sender !== message.sender
                  
                  return (
                    <div
                      key={message.id}
                      style={{
                        display: 'flex',
                        justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
                        gap: '8px'
                      }}
                    >
                      {!isMyMessage && (
                        <>
                          {showAvatar ? (
                            <>
                              {message.senderAvatar || owner?.avatar ? (
                                <img
                                  src={message.senderAvatar || owner.avatar}
                                  alt={owner?.name}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    flexShrink: 0
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: (message.senderAvatar || owner?.avatar) ? 'none' : 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: '600',
                          fontSize: '14px',
                          flexShrink: 0
                        }}>
                                {owner?.name?.charAt(0)?.toUpperCase() || 'O'}
                        </div>
                            </>
                          ) : (
                            <div style={{ width: '32px', flexShrink: 0 }} />
                          )}
                        </>
                      )}
                      
                      <div style={{
                        maxWidth: isMobile ? '75%' : '70%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <div style={{
                          background: isMyMessage ? '#3b82f6' : '#fff',
                          color: isMyMessage ? '#fff' : '#1f2937',
                          padding: '12px 16px',
                          borderRadius: isMyMessage 
                            ? '16px 16px 4px 16px' 
                            : '16px 16px 16px 4px',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                          wordWrap: 'break-word',
                          fontSize: '14px',
                          lineHeight: '1.5'
                        }}>
                          {message.text}
                        </div>
                        
                        <div style={{
                          fontSize: '11px',
                          color: '#9ca3af',
                          padding: isMyMessage ? '0 12px 0 0' : '0 0 0 12px',
                          textAlign: isMyMessage ? 'right' : 'left'
                        }}>
                          {formatTime(message.timestamp)}
                        </div>
                      </div>

                      {isMyMessage && (
                        <>
                          {showAvatar ? (
                            <>
                              {message.senderAvatar || user?.avatar ? (
                                <img
                                  src={message.senderAvatar || user.avatar}
                                  alt={user?.name}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    flexShrink: 0
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                display: (message.senderAvatar || user?.avatar) ? 'none' : 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: '600',
                          fontSize: '14px',
                          flexShrink: 0
                        }}>
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                            </>
                          ) : (
                            <div style={{ width: '32px', flexShrink: 0 }} />
                          )}
                        </>
                      )}
                    </div>
                  )
                })
              )}
              
              {/* Typing indicator */}
              {isOwnerTyping && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    gap: '8px'
                  }}
                >
                  {owner?.avatar ? (
                    <img
                      src={owner.avatar}
                      alt={owner.name}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: owner?.avatar ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '14px',
                    flexShrink: 0
                  }}>
                    {owner?.name?.charAt(0)?.toUpperCase() || 'O'}
            </div>
                  
                  <div style={{
                    background: '#fff',
                    padding: '12px 16px',
                    borderRadius: '16px 16px 16px 4px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#9ca3af',
                      animation: 'typing 1.4s infinite'
                    }}></span>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#9ca3af',
                      animation: 'typing 1.4s infinite 0.2s'
                    }}></span>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#9ca3af',
                      animation: 'typing 1.4s infinite 0.4s'
                    }}></span>
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

            <div style={{
              background: '#fff',
              borderTop: '1px solid #e5e7eb',
              padding: isMobile ? '12px' : '16px',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end',
              flexShrink: 0
            }}>
              <EmojiPickerButton onEmojiClick={handleEmojiClick} />
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                disabled={sending}
                style={{
                  flex: 1,
                  minHeight: '40px',
                  maxHeight: '120px',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'none',
                  outline: 'none',
                  background: '#f9fafb',
                  color: '#1f2937',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.background = '#fff'
                  e.target.style.borderColor = '#3b82f6'
                }}
                onBlur={(e) => {
                  e.target.style.background = '#f9fafb'
                  e.target.style.borderColor = '#e5e7eb'
                }}
              />
              
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: newMessage.trim() && !sending ? '#3b82f6' : '#d1d5db',
                  color: '#fff',
                  border: 'none',
                  cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  if (newMessage.trim() && !sending) {
                    e.target.style.background = '#2563eb'
                    e.target.style.transform = 'scale(1.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (newMessage.trim() && !sending) {
                    e.target.style.background = '#3b82f6'
                    e.target.style.transform = 'scale(1)'
                  }
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default ChatModal


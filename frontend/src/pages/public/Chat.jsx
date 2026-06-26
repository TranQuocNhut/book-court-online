import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, MessageCircle } from 'lucide-react'
import { facilityApi } from '../../api/facilityApi'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { toast } from 'react-toastify'
import useDeviceType from '../../hook/use-device-type'

function Chat() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { isMobile } = useDeviceType()
  const venueId = searchParams.get('venue')
  
  const [facility, setFacility] = useState(null)
  const [owner, setOwner] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isOwnerOnline, setIsOwnerOnline] = useState(false)
  const messagesEndRef = useRef(null)
  const { defaultSocket } = useSocket()

  useEffect(() => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để nhắn tin')
      navigate('/login')
      return
    }

    if (!venueId) {
      toast.error('Không tìm thấy thông tin cơ sở')
      navigate('/')
      return
    }

    fetchFacilityData()
  }, [venueId, isAuthenticated])

  useEffect(() => {
    if (!owner || !defaultSocket) {
      setIsOwnerOnline(false)
      return
    }

    const checkOwnerStatus = () => {
      if (defaultSocket && defaultSocket.connected) {
        defaultSocket.emit('check_user_online', { userId: owner._id || owner.id }, (response) => {
          if (response && response.online !== undefined) {
            setIsOwnerOnline(response.online)
          } else {
            const ownerId = owner._id || owner.id
            const savedStatus = localStorage.getItem(`owner_online_${ownerId}`)
            if (savedStatus) {
              setIsOwnerOnline(savedStatus === 'true')
            } else {
              const randomStatus = Math.random() > 0.4
              setIsOwnerOnline(randomStatus)
              localStorage.setItem(`owner_online_${ownerId}`, String(randomStatus))
            }
          }
        })
      } else {
        setIsOwnerOnline(false)
      }
    }

    checkOwnerStatus()
    const interval = setInterval(checkOwnerStatus, 30000)

    defaultSocket.on('user_online_status', (data) => {
      if (data.userId === (owner._id || owner.id)) {
        setIsOwnerOnline(data.online)
        localStorage.setItem(`owner_online_${owner._id || owner.id}`, String(data.online))
      }
    })

    return () => {
      clearInterval(interval)
      defaultSocket.off('user_online_status')
    }
  }, [owner, defaultSocket])

  const fetchFacilityData = async () => {
    try {
      setLoading(true)
      const result = await facilityApi.getFacilityById(venueId)
      
      if (result.success && result.data) {
        setFacility(result.data)
        if (result.data.owner) {
          setOwner(result.data.owner)
        }
        
        loadMessages()
      } else {
        toast.error('Không tìm thấy thông tin cơ sở')
        navigate('/')
      }
    } catch (error) {
      console.error('Error fetching facility:', error)
      toast.error('Không thể tải thông tin cơ sở')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = () => {
    const savedMessages = localStorage.getItem(`chat_${venueId}`)
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages))
      } catch (error) {
        console.error('Error loading messages:', error)
      }
    }
  }

  const saveMessages = (msgs) => {
    localStorage.setItem(`chat_${venueId}`, JSON.stringify(msgs))
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return

    const message = {
      id: Date.now(),
      text: newMessage.trim(),
      sender: user._id || user.id,
      senderName: user.name,
      timestamp: new Date().toISOString(),
      isOwner: false
    }

    setSending(true)
    setNewMessage('')
    
    const updatedMessages = [...messages, message]
    setMessages(updatedMessages)
    saveMessages(updatedMessages)

    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const ownerReply = {
        id: Date.now() + 1,
        text: `Cảm ơn bạn đã liên hệ với ${facility?.name || 'chúng tôi'}. Chúng tôi sẽ phản hồi sớm nhất có thể!`,
        sender: owner?._id || owner?.id,
        senderName: owner?.name || 'Chủ sân',
        timestamp: new Date().toISOString(),
        isOwner: true
      }

      setTimeout(() => {
        const finalMessages = [...updatedMessages, ownerReply]
        setMessages(finalMessages)
        saveMessages(finalMessages)
      }, 1000)
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Không thể gửi tin nhắn')
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) {
      return 'Vừa xong'
    }
    
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)} phút trước`
    }
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
    
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (loading) {
    return (
      <>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: isMobile ? '0' : '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: isMobile ? '100%' : '800px',
            background: '#fff',
            borderRadius: isMobile ? '0' : '12px',
            boxShadow: isMobile ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ color: '#6b7280' }}>Đang tải...</p>
          </div>
        </div>
      </>
    )
  }

  if (!facility || !owner) {
    return null
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: '#f8fafc',
      display: 'flex',
      justifyContent: 'center',
      padding: isMobile ? '0' : '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: isMobile ? '100%' : '800px',
        height: isMobile ? 'calc(100vh - 64px)' : 'calc(100vh - 104px)',
        background: '#fff',
        borderRadius: isMobile ? '0' : '12px',
        boxShadow: isMobile ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: isMobile ? '12px 16px' : '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#374151',
            transition: 'background 0.2s',
            flexShrink: 0
          }}
          onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          <ArrowLeft size={20} />
        </button>

        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '4px'
          }}>
            <p style={{
              margin: 0,
              fontSize: '13px',
              color: '#6b7280',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {owner.name} {isOwnerOnline ? '• Đang hoạt động' : '• Offline'}
            </p>
          </div>
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: isMobile ? '16px' : '24px',
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
          messages.map((message) => {
            const isMyMessage = message.sender === (user._id || user.id)
            
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
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '14px',
                    flexShrink: 0
                  }}>
                    {message.senderName?.charAt(0)?.toUpperCase() || 'O'}
                  </div>
                )}
                
                <div style={{
                  maxWidth: isMobile ? '75%' : '60%',
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
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '14px',
                    flexShrink: 0
                  }}>
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{
        background: '#fff',
        borderTop: '1px solid #e5e7eb',
        padding: isMobile ? '12px' : '16px',
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-end',
        flexShrink: 0
      }}>
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
      </div>
    </div>
  )
}

export default Chat


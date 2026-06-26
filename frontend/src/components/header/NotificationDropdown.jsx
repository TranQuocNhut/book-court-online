import React from 'react'
import { Bell, CheckCircle, Clock, AlertCircle, Info } from 'lucide-react'
import useClickOutside from '../../hook/use-click-outside'

const NotificationDropdown = ({ 
  isOpen, 
  onClose, 
  notifications, 
  unreadCount, 
  onNotificationClick, 
  onMarkAllAsRead,
  onViewAll,
  loading = false
}) => {
  const dropdownRef = useClickOutside(onClose, isOpen)

  if (!isOpen) return null

  return (
    <>
      <div ref={dropdownRef} style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '8px',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,.15)',
        minWidth: '350px',
        maxWidth: '400px',
        zIndex: 1000,
        overflow: 'hidden',
        animation: 'slideDown 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937',
            margin: 0
          }}>
            Thông báo
          </h3>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#e6f3ff'}
              onMouseLeave={(e) => e.target.style.background = 'none'}
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                border: '2px solid #e5e7eb',
                borderTop: '2px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 12px'
              }} />
              <p style={{ fontSize: '14px', margin: 0 }}>
                Đang tải thông báo...
              </p>
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => {
              const IconComponent = notification.icon
              return (
                <div
                  key={notification.id}
                  onClick={() => onNotificationClick(notification)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    background: notification.isRead ? '#fff' : '#f0f9ff',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = notification.isRead ? '#f8fafc' : '#e0f2fe'}
                  onMouseLeave={(e) => e.currentTarget.style.background = notification.isRead ? '#fff' : '#f0f9ff'}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: `${notification.iconColor}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {notification.icon && <notification.icon size={16} color={notification.iconColor} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: notification.isRead ? '500' : '600',
                        color: '#1f2937',
                        marginBottom: '4px',
                        lineHeight: '1.4'
                      }}>
                        {notification.title}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        lineHeight: '1.4',
                        marginBottom: '6px'
                      }}>
                        {notification.message}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#9ca3af'
                      }}>
                        {notification.time}
                      </div>
                    </div>
                    {!notification.isRead && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        flexShrink: 0,
                        marginTop: '4px'
                      }} />
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <Bell size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p style={{ fontSize: '14px', margin: 0 }}>
                Chưa có thông báo nào
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #e5e7eb',
          background: '#f8fafc',
          textAlign: 'center'
        }}>
          <button
            onClick={onViewAll}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: '6px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#e6f3ff'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            Xem tất cả thông báo
          </button>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}

export default NotificationDropdown

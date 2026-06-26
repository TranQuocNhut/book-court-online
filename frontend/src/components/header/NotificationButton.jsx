import React from 'react'
import { Bell } from 'lucide-react'

const NotificationButton = ({ 
  unreadCount, 
  isOpen, 
  onClick 
}) => {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isOpen ? '#f3f4f6' : 'none',
        border: 'none',
        padding: '8px',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background 0.2s',
        color: '#374151'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
      onMouseLeave={(e) => e.currentTarget.style.background = isOpen ? '#f3f4f6' : 'none'}
      aria-label="Thông báo"
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          background: '#ef4444',
          color: 'white',
          fontSize: '10px',
          fontWeight: '600',
          padding: '2px 5px',
          borderRadius: '10px',
          minWidth: '16px',
          height: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          animation: 'pulse 2s infinite'
        }}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}

export default NotificationButton

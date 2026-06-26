import React from 'react'
import { Bell, ShoppingBag, Ticket, Settings } from 'lucide-react'
import '../../../../styles/Notifications.css'

export default function SidebarMenu({
  categoryFilter,
  categoryCounts,
  categoryUnreadCounts,
  onCategoryChange
}) {
  const menuItems = [
    {
      id: 'all',
      label: 'Tất cả',
      icon: Bell,
      color: '#3b82f6',
      count: categoryCounts.all,
      unreadCount: categoryUnreadCounts.all
    },
    {
      id: 'booking',
      label: 'Đơn đặt sân',
      icon: ShoppingBag,
      color: '#10b981',
      count: categoryCounts.booking,
      unreadCount: categoryUnreadCounts.booking
    },
    {
      id: 'promotion',
      label: 'Khuyến mãi',
      icon: Ticket,
      color: '#f59e0b',
      count: categoryCounts.promotion,
      unreadCount: categoryUnreadCounts.promotion
    },
    {
      id: 'system',
      label: 'Hệ thống',
      icon: Settings,
      color: '#6b7280',
      count: categoryCounts.system,
      unreadCount: categoryUnreadCounts.system
    }
  ]

  return (
    <div className="notifications-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-header-text">
          Danh mục
        </div>
      </div>

      {menuItems.map(item => {
        const Icon = item.icon
        const isActive = categoryFilter === item.id
        
        return (
          <button
            key={item.id}
            onClick={() => onCategoryChange(item.id)}
            className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
            style={{
              background: isActive ? item.color : 'white',
              color: isActive ? 'white' : '#374151',
              border: isActive ? 'none' : '1px solid #e5e7eb'
            }}
          >
            <Icon size={18} />
            <span className="sidebar-menu-label">{item.label}</span>
            <span 
              className="sidebar-menu-count"
              style={{
                background: isActive ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                color: isActive ? 'white' : '#6b7280'
              }}
            >
              {item.count}
            </span>
            {item.unreadCount > 0 && (
              <span 
                className="sidebar-menu-dot"
                style={{
                  background: isActive ? 'white' : item.color
                }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}


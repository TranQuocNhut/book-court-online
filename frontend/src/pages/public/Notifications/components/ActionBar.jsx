import React from 'react'
import { CheckCheck, Trash2 } from 'lucide-react'
import '../../../../styles/Notifications.css'

export default function ActionBar({
  filter,
  filteredNotifications,
  onFilterChange,
  onMarkAllAsRead,
  onDeleteAll
}) {
  const unreadCount = filteredNotifications.filter(n => !n.isRead).length
  const readCount = filteredNotifications.filter(n => n.isRead).length
  const totalCount = filteredNotifications.length

  return (
    <div className="action-bar">
      <div className="filter-buttons-group">
        <button
          onClick={() => onFilterChange('all')}
          className={`filter-button ${filter === 'all' ? 'active' : ''}`}
        >
          Tất cả ({totalCount})
        </button>
        <button
          onClick={() => onFilterChange('unread')}
          className={`filter-button ${filter === 'unread' ? 'active' : ''}`}
        >
          Chưa đọc ({unreadCount})
        </button>
        <button
          onClick={() => onFilterChange('read')}
          className={`filter-button ${filter === 'read' ? 'active' : ''}`}
        >
          Đã đọc ({readCount})
        </button>
      </div>

      <div className="action-buttons-group">
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="action-button action-button-primary"
          >
            <CheckCheck size={16} />
            Đánh dấu tất cả đã đọc
          </button>
        )}

        {totalCount > 0 && (
          <button
            onClick={onDeleteAll}
            className="action-button action-button-danger"
          >
            <Trash2 size={16} />
            Xóa tất cả
          </button>
        )}
      </div>
    </div>
  )
}


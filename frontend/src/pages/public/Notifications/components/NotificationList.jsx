import React from 'react'
import { Bell } from 'lucide-react'
import NotificationItem from './NotificationItem'
import { getCategoryName } from '../utils/filters'
import '../../../../styles/Notifications.css'

export default function NotificationList({
  notifications,
  categoryFilter,
  readFilter,
  onMarkAsRead,
  onDelete,
  onNotificationClick
}) {
  if (notifications.length === 0) {
    const categoryName = getCategoryName(categoryFilter)
    let emptyTitle = ''
    let emptyMessage = ''

    if (readFilter === 'unread') {
      emptyTitle = `Không có thông báo ${categoryName} chưa đọc`
      emptyMessage = `Tất cả thông báo ${categoryName} của bạn đã được đọc`
    } else if (readFilter === 'read') {
      emptyTitle = `Không có thông báo ${categoryName} đã đọc`
      emptyMessage = `Bạn chưa có thông báo ${categoryName} nào đã đọc`
    } else {
      emptyTitle = `Chưa có thông báo ${categoryName} nào`
      emptyMessage = `Các thông báo ${categoryName} mới sẽ xuất hiện ở đây`
    }

    return (
      <div className="notification-empty">
        <Bell size={48} className="empty-icon" />
        <p className="empty-title">{emptyTitle}</p>
        <p className="empty-message">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="notification-list">
      {notifications.map((notification, index) => (
        <NotificationItem
          key={notification.id || notification._id}
          notification={notification}
          index={index}
          total={notifications.length}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
          onClick={() => onNotificationClick(notification)}
        />
      ))}
    </div>
  )
}


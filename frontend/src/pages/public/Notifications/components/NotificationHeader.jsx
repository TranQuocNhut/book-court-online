import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getPageTitle } from '../utils/filters'
import '../../../../styles/Notifications.css'

export default function NotificationHeader({ 
  categoryFilter, 
  filteredNotifications 
}) {
  const navigate = useNavigate()
  
  const unread = filteredNotifications.filter(n => !n.isRead).length
  const total = filteredNotifications.length

  return (
    <div className="notification-header">
      <button
        onClick={() => navigate(-1)}
        className="back-button"
      >
        <ArrowLeft size={20} color="#374151" />
      </button>
      <div className="header-content">
        <h1 className="header-title">
          {getPageTitle(categoryFilter)}
        </h1>
        <p className="header-subtitle">
          {unread > 0
            ? `${unread} thông báo chưa đọc trong ${total} thông báo`
            : `Tất cả ${total} thông báo đã được đọc`}
        </p>
      </div>
    </div>
  )
}


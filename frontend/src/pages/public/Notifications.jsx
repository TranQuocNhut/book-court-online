import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { notificationApi } from '../../api/notificationApi'
import { toast } from 'react-toastify'
import { CheckCircle, DollarSign, XCircle, Star, Wrench, Tag, Clock, Info, AlertTriangle } from 'lucide-react'
import Dialog from '../../components/ui/Dialog'
import SidebarMenu from './Notifications/components/SidebarMenu'
import NotificationHeader from './Notifications/components/NotificationHeader'
import ActionBar from './Notifications/components/ActionBar'
import NotificationList from './Notifications/components/NotificationList'
import { 
  filterNotifications, 
  getCategoryCounts, 
  getCategoryUnreadCounts,
  getCategoryName 
} from './Notifications/utils/filters'
import '../../styles/Notifications.css'

const NotificationsPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { defaultSocket, userSocket, ownerSocket, adminSocket, isConnected } = useSocket()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all') // 'all', 'unread', 'read'
  const [categoryFilter, setCategoryFilter] = useState('all') // 'all', 'booking', 'promotion', 'system'
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false) // Dialog xóa tất cả
  const limit = 20

  // Fetch notifications
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotifications([])
      return
    }

    const fetchNotifications = async () => {
      try {
        setLoading(true)
        const params = {
          page,
          limit,
        }
        
        if (categoryFilter !== 'all') {
          params.type = categoryFilter
        }
        
        if (filter === 'unread') {
          params.isRead = false
        } else if (filter === 'read') {
          params.isRead = true
        }

        const data = await notificationApi.getNotifications(params)
        const notificationsList = data.notifications || data || []
        
        setNotifications(notificationsList)
        setTotal(data.pagination?.total || notificationsList.length)
      } catch (error) {
        console.error('Error fetching notifications:', error)
        toast.error('Không thể tải thông báo')
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [isAuthenticated, user, page, categoryFilter, filter])

  // Listen for real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !user || !isConnected) return

    const handleNewNotification = (data) => {
      if (data.notification) {
        setNotifications(prev => {
          // Check if notification already exists
          const exists = prev.some(n => 
            (n._id || n.id) === (data.notification._id || data.notification.id)
          )
          if (exists) return prev
          
          // Add notification (will be transformed by useMemo)
          return [data.notification, ...prev]
        })
      }
    }

    if (defaultSocket && isConnected) {
      defaultSocket.on('notification:new', handleNewNotification)
    }
    if (userSocket && isConnected) {
      userSocket.on('notification:new', handleNewNotification)
    }
    if ((user.role === 'owner' || user.role === 'admin') && ownerSocket && isConnected) {
      ownerSocket.on('notification:new', handleNewNotification)
    }
    if (user.role === 'admin' && adminSocket && isConnected) {
      adminSocket.on('notification:new', handleNewNotification)
    }

    return () => {
      defaultSocket?.off('notification:new', handleNewNotification)
      userSocket?.off('notification:new', handleNewNotification)
      ownerSocket?.off('notification:new', handleNewNotification)
      adminSocket?.off('notification:new', handleNewNotification)
    }
  }, [isAuthenticated, user, defaultSocket, userSocket, ownerSocket, adminSocket, isConnected])

  // Calculate counts
  const categoryCounts = useMemo(() => getCategoryCounts(notifications), [notifications])
  const categoryUnreadCounts = useMemo(() => getCategoryUnreadCounts(notifications), [notifications])

  // Helper function to get notification icon
  const getNotificationIcon = (type) => {
    const iconMap = {
      booking: CheckCircle,
      payment: DollarSign,
      cancellation: XCircle,
      review: Star,
      maintenance: Wrench,
      promotion: Tag,
      reminder: Clock,
      system: Info,
    }
    return iconMap[type] || Info
  }

  // Helper function to get notification icon color
  const getNotificationIconColor = (type) => {
    const colors = {
      booking: '#10b981',
      payment: '#3b82f6',
      cancellation: '#ef4444',
      review: '#f59e0b',
      maintenance: '#8b5cf6',
      promotion: '#ec4899',
      reminder: '#06b6d4',
      system: '#6b7280',
    }
    return colors[type] || '#6b7280'
  }

  // Transform notifications to include icon component and formatted time
  const transformedNotifications = useMemo(() => {
    return notifications.map(n => ({
      ...n,
      id: n._id || n.id,
      icon: getNotificationIcon(n.type),
      iconColor: getNotificationIconColor(n.type),
      time: n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) : '',
    }))
  }, [notifications])

  // Filter notifications (client-side filtering for display)
  const filteredNotifications = useMemo(() => {
    return filterNotifications(transformedNotifications, {
      categoryFilter,
      readFilter: filter
    })
  }, [transformedNotifications, filter, categoryFilter])

  const handleMarkAsRead = async (id) => {
    try {
      // Find the original notification ID (could be _id or id)
      const notification = notifications.find(n => (n._id || n.id) === id)
      const notificationId = notification?._id || notification?.id || id
      
      await notificationApi.markAsRead(notificationId)
      setNotifications(prev =>
        prev.map(n => (n._id || n.id) === id ? { ...n, isRead: true } : n)
      )
      toast.success('Đã đánh dấu đã đọc')
    } catch (error) {
      console.error('Error marking as read:', error)
      toast.error('Không thể đánh dấu đã đọc')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      toast.success('Đã đánh dấu tất cả là đã đọc')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Không thể đánh dấu tất cả')
    }
  }

  const handleDelete = async (id) => {
    try {
      // Find the original notification ID (could be _id or id)
      const notification = notifications.find(n => (n._id || n.id) === id)
      const notificationId = notification?._id || notification?.id || id
      
      await notificationApi.deleteNotification(notificationId)
      setNotifications(prev => prev.filter(n => (n._id || n.id) !== id))
      toast.success('Đã xóa thông báo')
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Không thể xóa thông báo')
    }
  }

  // Mở dialog xác nhận xóa tất cả
  const handleDeleteAll = () => {
    setShowDeleteAllDialog(true)
  }

  // Xác nhận xóa tất cả thông báo đã đọc
  const confirmDeleteAll = async () => {
    setShowDeleteAllDialog(false)
    
    try {
      const type = categoryFilter !== 'all' ? categoryFilter : null
      await notificationApi.deleteAllRead(type)
      setNotifications(prev => prev.filter(n => !n.isRead))
      toast.success('Đã xóa tất cả thông báo đã đọc')
    } catch (error) {
      console.error('Error deleting all:', error)
      toast.error('Không thể xóa thông báo')
    }
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id || notification.id)
    }
    
    if (notification.metadata?.bookingId) {
      navigate('/profile/bookings')
    } else {
      switch (notification.type) {
        case 'booking':
          navigate('/profile/bookings')
          break
        case 'payment':
          navigate('/profile/bookings')
          break
        default:
          break
      }
    }
  }

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        <SidebarMenu
          categoryFilter={categoryFilter}
          categoryCounts={categoryCounts}
          categoryUnreadCounts={categoryUnreadCounts}
          onCategoryChange={setCategoryFilter}
        />

        <div className="notifications-main">
          <NotificationHeader
            categoryFilter={categoryFilter}
            filteredNotifications={filteredNotifications}
          />

          <ActionBar
            filter={filter}
            filteredNotifications={filteredNotifications}
            onFilterChange={setFilter}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDeleteAll={handleDeleteAll}
          />

          {loading ? (
            <>
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid #e5e7eb',
                  borderTop: '3px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }} />
                <p style={{ fontSize: '14px', margin: 0 }}>
                  Đang tải thông báo...
                </p>
              </div>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </>
          ) : (
            <NotificationList
              notifications={filteredNotifications}
              categoryFilter={categoryFilter}
              readFilter={filter}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
              onNotificationClick={handleNotificationClick}
            />
          )}
        </div>
      </div>

      {/* Dialog xác nhận xóa tất cả thông báo */}
      <Dialog
        open={showDeleteAllDialog}
        onClose={() => setShowDeleteAllDialog(false)}
        title="Xác nhận xóa tất cả thông báo"
        description={`Bạn có chắc chắn muốn xóa tất cả thông báo ${getCategoryName(categoryFilter)} đã đọc?`}
        maxWidth="480px"
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '16px',
            background: '#fef3c7',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, fontSize: '14px', color: '#92400e', lineHeight: '1.6' }}>
              Hành động này sẽ xóa vĩnh viễn tất cả thông báo đã đọc{categoryFilter !== 'all' ? ` thuộc danh mục ${getCategoryName(categoryFilter)}` : ''}. Bạn không thể khôi phục lại sau khi xóa.
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => setShowDeleteAllDialog(false)}
              style={{
                padding: '10px 20px',
                background: '#ffffff',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                color: '#6b7280',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f9fafb'
                e.target.style.borderColor = '#d1d5db'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#ffffff'
                e.target.style.borderColor = '#e5e7eb'
              }}
            >
              Hủy
            </button>
            <button
              onClick={confirmDeleteAll}
              style={{
                padding: '10px 20px',
                background: '#ef4444',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#dc2626'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#ef4444'
              }}
            >
              Xóa tất cả
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default NotificationsPage

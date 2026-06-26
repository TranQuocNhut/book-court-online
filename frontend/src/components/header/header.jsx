import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import useDeviceType from '../../hook/use-device-type'
import useToggle from '../../hook/use-toggle'
import NotificationButton from './NotificationButton'
import NotificationDropdown from './NotificationDropdown'
import UserMenu from './UserMenu'
import NavigationBar from './NavigationBar'
import { notificationApi } from '../../api/notificationApi'
import { toast } from 'react-toastify'
import { Menu, X, CheckCircle, DollarSign, XCircle, Star, Wrench, Tag, Clock, Info, Ticket } from 'lucide-react'

import './Header.css'

function Header() {
  const { isAuthenticated, user, logout, loading } = useAuth()
  const { defaultSocket, userSocket, ownerSocket, adminSocket, isConnected } = useSocket()
  const { isMobile, isTablet } = useDeviceType()
  const [showUserMenu, { toggle: toggleUserMenu, setFalse: closeUserMenu }] = useToggle(false)
  const [showNotificationDropdown, { toggle: toggleNotificationDropdown, setFalse: closeNotificationDropdown }] = useToggle(false)
  const [showMobileMenu, { toggle: toggleMobileMenu, setFalse: closeMobileMenu }] = useToggle(false)
  const [notifications, setNotifications] = useState([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const navigate = useNavigate()

  // Đóng mobile menu khi chuyển từ mobile sang desktop/tablet
  useEffect(() => {
    if (!isMobile && showMobileMenu) {
      closeMobileMenu()
    }
  }, [isMobile, showMobileMenu]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset user menu when authentication state changes
  useEffect(() => {
    if (showUserMenu) {
      closeUserMenu()
    }
  }, [isAuthenticated, user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch notifications on mount and when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotifications([])
      setUnreadNotifications(0)
      return
    }

    const fetchNotifications = async () => {
      try {
        setLoadingNotifications(true)
        const [notificationsData, unreadCountData] = await Promise.all([
          notificationApi.getNotifications({ page: 1, limit: 10 }),
          notificationApi.getUnreadCount(),
        ])

        setNotifications(notificationsData.notifications || notificationsData || [])
        setUnreadNotifications(unreadCountData.unreadCount || 0)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setLoadingNotifications(false)
      }
    }

    fetchNotifications()
  }, [isAuthenticated, user])

  // Listen for real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !user || !isConnected) return

    const handleNewNotification = async (data) => {
      try {
        // If notification object is provided, add it to the list
        if (data.notification) {
          setNotifications(prev => [data.notification, ...prev].slice(0, 10))
        }

        // Update unread count
        if (data.unreadCount !== undefined) {
          setUnreadNotifications(data.unreadCount)
        } else {
          // Fetch unread count if not provided
          const unreadCountData = await notificationApi.getUnreadCount()
          setUnreadNotifications(unreadCountData.unreadCount || 0)
        }

        // Show toast notification
        if (data.notification) {
          toast.info(data.notification.title || 'Có thông báo mới', {
            position: 'top-right',
            autoClose: 3000,
          })
        }
      } catch (error) {
        console.error('Error handling new notification:', error)
      }
    }

    // Listen on default namespace (for user-specific notifications)
    if (defaultSocket && isConnected) {
      defaultSocket.on('notification:new', handleNewNotification)
    }

    // Listen on user namespace
    if (userSocket && isConnected) {
      userSocket.on('notification:new', handleNewNotification)
    }

    // Listen on owner namespace (if user is owner or admin)
    if ((user.role === 'owner' || user.role === 'admin') && ownerSocket && isConnected) {
      ownerSocket.on('notification:new', handleNewNotification)
    }

    // Listen on admin namespace (if user is admin)
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

  // Debug logs
  console.log('🔍 Header - Auth state:', { isAuthenticated, user, loading });

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleUserMenuClick = () => {
    toggleUserMenu()
  }

  const handleProfileClick = () => {
    closeUserMenu()
    navigate('/profile')
  }

  const handleNotificationClick = () => {
    if (isMobile) {
      navigate('/notifications')
      closeUserMenu()
      return
    }
    toggleNotificationDropdown()
    closeUserMenu() // Close user menu if open
  }

  const handleNotificationItemClick = async (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      try {
        await notificationApi.markAsRead(notification._id || notification.id)
        setNotifications(prev =>
          prev.map(n =>
            (n._id || n.id) === (notification._id || notification.id)
              ? { ...n, isRead: true }
              : n
          )
        )
        setUnreadNotifications(prev => Math.max(0, prev - 1))
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }

    // Navigate to relevant page based on notification type
    if (notification.metadata?.bookingId) {
      navigate(`/profile/bookings`)
    } else {
      switch (notification.type) {
        case 'booking':
          navigate('/profile/bookings')
          break
        case 'payment':
          navigate('/profile/bookings')
          break
        default:
          navigate('/notifications')
      }
    }
    closeNotificationDropdown()
  }

  const handleSettingsClick = () => {
    closeUserMenu()
    navigate('/profile/settings')
  }

  const handleBookingHistoryClick = () => {
    closeUserMenu()
    navigate('/profile/bookings')
  }

  const handleTopUpClick = () => {
    closeUserMenu()
    navigate('/wallet')
  }

  const handleTournamentManagementClick = () => {
    closeUserMenu()
    navigate('/profile/tournaments')
  }

  const handleFeedbackClick = () => {
    closeUserMenu()
    navigate('/feedback')
  }

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

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadNotifications(0)
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Không thể đánh dấu tất cả thông báo')
    }
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="header-left">
          {isMobile && (
            <button
              className="mobile-menu-toggle"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}

          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand">
              <img
                src="/Logo.png"
                alt="Booking Sport Logo"
                className="logo-image"
                style={{
                  height: isMobile ? "40px" : isTablet ? "48px" : "56px",
                  width: "auto",
                  objectFit: "contain"
                }}
              />
              <span className="brand-name">Booking sport</span>
            </div>
          </Link>
        </div>

        {!isMobile && (
          <div className="desktop-nav-wrapper">
            <NavigationBar user={user} />
          </div>
        )}

        <div className="auth-actions" style={{ gap: isMobile ? '8px' : isTablet ? '10px' : '12px' }}>
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#6b7280'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #e5e7eb',
                borderTop: '2px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Đang tải...
            </div>
          ) : isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : isTablet ? '10px' : '12px' }}>
              {/* Notification Button with Dropdown */}
              <div style={{ position: 'relative' }}>
                <NotificationButton
                  unreadCount={unreadNotifications}
                  isOpen={showNotificationDropdown}
                  onClick={handleNotificationClick}
                />
                <NotificationDropdown
                  isOpen={showNotificationDropdown}
                  onClose={closeNotificationDropdown}
                  notifications={notifications.map(n => ({
                    id: n._id || n.id,
                    title: n.title,
                    message: n.message,
                    type: n.type,
                    isRead: n.isRead,
                    time: n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }) : '',
                    icon: getNotificationIcon(n.type),
                    iconColor: getNotificationIconColor(n.type),
                    metadata: n.metadata,
                  }))}
                  unreadCount={unreadNotifications}
                  loading={loadingNotifications}
                  onNotificationClick={handleNotificationItemClick}
                  onMarkAllAsRead={markAllAsRead}
                  onViewAll={() => {
                    closeNotificationDropdown()
                    navigate('/notifications')
                  }}
                />
              </div>

              {/* User Menu */}
              <UserMenu
                user={user}
                isOpen={showUserMenu}
                onToggle={handleUserMenuClick}
                onProfileClick={handleProfileClick}
                onLogout={handleLogout}
                onSettingsClick={handleSettingsClick}
                onBookingHistoryClick={handleBookingHistoryClick}
                onTopUpClick={handleTopUpClick}
                onTournamentManagementClick={handleTournamentManagementClick}
                onFeedbackClick={handleFeedbackClick}
              />
            </div>
          ) : (
            <Link
              to="/login"
              className="btn btn-outline"
              style={{
                padding: isMobile ? '8px 12px' : isTablet ? '9px 14px' : undefined,
                fontSize: isMobile ? '14px' : isTablet ? '15px' : undefined
              }}
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Navigation Sidebar */}
      {isMobile && showMobileMenu && (
        <div className="mobile-nav-overlay" onClick={closeMobileMenu}>
          <div className="mobile-nav-menu" onClick={(e) => e.stopPropagation()}>
            <div className="sidebar-header">
              <div className="sidebar-brand">
                <img src="/Logo.png" alt="Logo" className="sidebar-logo" />
                <span className="sidebar-brand-name">Booking Sport</span>
              </div>
              <button
                className="sidebar-close-btn"
                onClick={closeMobileMenu}
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            <div className="sidebar-content">
              <NavigationBar user={user} mobile onLinkClick={closeMobileMenu} />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header


import React, { useState, useEffect, useCallback } from "react";
import { 
  Bell, 
  Search, 
  User, 
  Settings, 
  LogOut, 
  Menu,
  Home,
  MapPin,
  CheckCircle,
  DollarSign,
  XCircle,
  Star,
  Wrench,
  Tag,
  Clock,
  Info
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import { notificationApi } from "../../api/notificationApi";
import { toast } from "react-toastify";
import UserMenu from "../header/UserMenu";
import NotificationDropdown from "../header/NotificationDropdown";

// Helper function to get icon and color based on notification type
const getNotificationIcon = (type) => {
  const iconMap = {
    booking: { icon: Bell, color: "#3b82f6" },
    payment: { icon: DollarSign, color: "#10b981" },
    cancellation: { icon: XCircle, color: "#ef4444" },
    review: { icon: Star, color: "#f59e0b" },
    maintenance: { icon: Wrench, color: "#8b5cf6" },
    promotion: { icon: Tag, color: "#ec4899" },
    reminder: { icon: Clock, color: "#06b6d4" },
    system: { icon: Info, color: "#6b7280" },
  };
  return iconMap[type] || { icon: Bell, color: "#3b82f6" };
};

// Helper function to format time
const formatTime = (dateString) => {
  if (!dateString) return "Vừa xong";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  
  return date.toLocaleDateString('vi-VN', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
};

// Transform API notification to dropdown format
const transformNotification = (notification) => {
  const { icon, color } = getNotificationIcon(notification.type);
  return {
    id: notification._id || notification.id,
    title: notification.title,
    message: notification.message,
    time: formatTime(notification.createdAt),
    type: notification.type,
    icon,
    iconColor: color,
    isRead: notification.isRead || false,
    metadata: notification.metadata || {},
    _original: notification
  };
};

export default function OwnerHeader({ onToggleSidebar, isSidebarOpen }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { ownerSocket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = async () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      await logout();
      navigate("/");
    }
  };

  const handleProfileClick = () => {
    setIsProfileOpen(false);
    navigate("/profile");
  };

  const handleSettingsClick = () => {
    setIsProfileOpen(false);
    navigate("/profile/settings");
  };

  const handleBookingHistoryClick = () => {
    setIsProfileOpen(false);
    navigate("/profile/bookings");
  };

  const handleTopUpClick = () => {
    setIsProfileOpen(false);
    navigate('/wallet');
  };

  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
    setIsProfileOpen(false);
  };

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?._id) return;

    try {
      setLoading(true);
      const data = await notificationApi.getNotifications({ 
        limit: 10,
        page: 1 
      });
      
      const notificationsList = data.notifications || data || [];
      const transformed = notificationsList.map(transformNotification);
      setNotifications(transformed);
      
      // Get unread count
      const unreadData = await notificationApi.getUnreadCount();
      setUnreadCount(unreadData.count || transformed.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!ownerSocket || !isConnected || !user?._id) return;

    const handleNewNotification = (data) => {
      if (data.notification) {
        const transformed = transformNotification(data.notification);
        setNotifications(prev => {
          // Check if notification already exists
          const exists = prev.some(n => n.id === transformed.id);
          if (exists) return prev;
          
          // Add to beginning of list
          return [transformed, ...prev].slice(0, 10);
        });
        
        // Update unread count
        setUnreadCount(prev => prev + 1);
        
        // Show toast
        toast.info(transformed.title, {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    };

    ownerSocket.on('notification:new', handleNewNotification);

    return () => {
      ownerSocket.off('notification:new', handleNewNotification);
    };
  }, [ownerSocket, isConnected, user?._id]);

  const handleNotificationItemClick = async (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      try {
        await notificationApi.markAsRead(notification.id);
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    setIsNotificationOpen(false);
    
    // Navigate based on type and metadata
    if (notification.type === 'booking' && notification.metadata?.bookingId) {
      navigate('/owner/bookings');
    } else if (notification.metadata?.facilityId) {
      navigate('/owner/bookings');
    } else {
      navigate('/owner/notifications');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Không thể đánh dấu tất cả đã đọc');
    }
  };

  const handleViewAllNotifications = () => {
    setIsNotificationOpen(false);
    navigate('/owner/notifications');
  };

  return (
    <div className="flex items-center justify-between w-full">
      {/* Left side - Logo and Menu */}
      <div className="flex items-center justify-start rtl:justify-end">
        <button
          onClick={onToggleSidebar}
          type="button"
          className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
          aria-controls="logo-sidebar"
        >
          <span className="sr-only">Open sidebar</span>
          <Menu size={20} />
        </button>
        <a href="/" className="flex ms-2 md:me-24">
          <img src="/Logo.png" className="h-8 me-3" alt="Dat San Online Logo" />
          <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap">
            Booking sport
          </span>
        </a>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center">
        {/* Notifications */}
        <div className="flex items-center ms-3 relative">
          <button
            onClick={handleNotificationClick}
            type="button"
            className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 relative"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <NotificationDropdown
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
            notifications={notifications}
            unreadCount={unreadCount}
            onNotificationClick={handleNotificationItemClick}
            onMarkAllAsRead={markAllAsRead}
            onViewAll={handleViewAllNotifications}
            loading={loading}
          />
        </div>

        {/* Profile dropdown - Using UserMenu component */}
        <div className="flex items-center ms-3">
          <UserMenu
            user={user}
            isOpen={isProfileOpen}
            onToggle={() => setIsProfileOpen(!isProfileOpen)}
            onProfileClick={handleProfileClick}
            onLogout={handleLogout}
            onSettingsClick={handleSettingsClick}
            onBookingHistoryClick={handleBookingHistoryClick}
            onTopUpClick={handleTopUpClick}
          />
        </div>
      </div>
    </div>
  );
}

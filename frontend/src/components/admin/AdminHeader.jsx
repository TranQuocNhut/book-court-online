import React, { useState } from "react";
import { 
  Bell, 
  Search, 
  User, 
  Settings, 
  LogOut, 
  Menu
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import UserMenu from "../header/UserMenu";
import NotificationDropdown from "../header/NotificationDropdown";

export default function AdminHeader({ onToggleSidebar, isSidebarOpen, currentTabTitle }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      title: "Đơn đặt sân mới",
      message: "Có 3 đơn đặt sân mới cần xử lý", 
      time: "5 phút trước", 
      type: "booking",
      icon: Bell,
      iconColor: "#3b82f6",
      isRead: false
    },
    { 
      id: 2, 
      title: "Bảo trì sân bóng",
      message: "Sân 2 cần bảo trì", 
      time: "1 giờ trước", 
      type: "maintenance",
      icon: Settings,
      iconColor: "#f59e0b",
      isRead: false
    },
    { 
      id: 3, 
      title: "Báo cáo sẵn sàng",
      message: "Báo cáo tháng 1 đã sẵn sàng", 
      time: "2 giờ trước", 
      type: "report",
      icon: User,
      iconColor: "#10b981",
      isRead: true
    },
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

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

  const handleLogoClick = () => {
    navigate("/");
  };

  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
    setIsProfileOpen(false);
  };

  const handleNotificationItemClick = (notification) => {
    // Mark as read if unread
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    );
    setIsNotificationOpen(false);
    // Navigate based on type
    if (notification.type === 'booking') {
      navigate('/admin');
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleViewAllNotifications = () => {
    setIsNotificationOpen(false);
    navigate('/admin');
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
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            handleLogoClick();
          }}
          className="flex ms-2 md:me-24"
        >
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

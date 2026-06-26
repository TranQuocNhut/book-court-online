import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AdminHeader from "../components/admin/AdminHeader";
import {
  LayoutDashboard,
  Building2,
  Calendar,
  UserCheck,
  CreditCard,
  Activity,
  BarChart3,
  Settings,
  FolderTree,
  Ticket,
  MessageSquare,
  ArrowDownCircle,
} from "lucide-react";

export default function AdminLayout({ 
  children
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: "dashboard", path: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { id: "facilities", path: "facilities", label: "Quản lý cơ sở", icon: Building2 },
    { id: "bookings", path: "bookings", label: "Quản lý lịch đặt sân", icon: Calendar },
    { id: "users", path: "users", label: "Quản lý người dùng", icon: UserCheck },
    { id: "payments", path: "payments", label: "Quản lý thanh toán", icon: CreditCard },
    { id: "withdrawals", path: "withdrawals", label: "Quản lý rút tiền", icon: ArrowDownCircle },
    { id: "categories", path: "categories", label: "Quản lý danh mục", icon: FolderTree },
    { id: "promotions", path: "promotions", label: "Quản lý khuyến mãi", icon: Ticket },
    { id: "feedbacks", path: "feedbacks", label: "Quản lý phản hồi", icon: MessageSquare },
    { id: "activity_log", path: "activity_log", label: "Nhật ký hoạt động", icon: Activity },
    { id: "reports", path: "reports", label: "Báo cáo & thống kê", icon: BarChart3 },
    { id: "settings", path: "settings", label: "Cấu hình hệ thống", icon: Settings },
  ];

  // Get current active tab from location
  const getActiveTab = () => {
    const path = location.pathname.split("/").pop();
    if (path === "admin" || path === "") return "dashboard";
    return path || "dashboard";
  };

  const activeTab = getActiveTab();

  const handleTabChange = (path) => {
    navigate(`/admin/${path}`);
  };

  const getCurrentTabTitle = () => {
    const menu = menuItems.find((item) => item.path === activeTab || item.id === activeTab);
    return menu?.label || "";
  };

  const onTabChange = (id) => {
    const menu = menuItems.find((item) => item.id === id);
    if (menu) {
      handleTabChange(menu.path);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar - Fixed Top */}
      <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <AdminHeader
            onToggleSidebar={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
            currentTabTitle={getCurrentTabTitle()}
          />
        </div>
      </nav>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-30 sm:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        id="logo-sidebar"
        className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform bg-white border-r border-gray-200 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Sidebar"
      >
        <div className="h-full px-3 pb-4 overflow-y-auto bg-white">
          <ul className="space-y-2 font-medium">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center p-2 text-gray-900 rounded-lg group ${
                      isActive
                        ? "bg-green-50 text-green-600"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <Icon size={20} className="shrink-0 w-5 h-5 text-gray-500 group-hover:text-gray-900" />
                    <span className="ms-3">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`p-4 mt-14 transition-all duration-300 ${isSidebarOpen ? "sm:ml-64" : ""}`}>
        <div className="p-4">
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
}

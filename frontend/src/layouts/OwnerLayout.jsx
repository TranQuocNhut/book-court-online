import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { facilityApi } from "../api/facilityApi";
import OwnerHeader from "../components/owner/OwnerHeader";
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  CreditCard,
  MessageSquare,
  BarChart3,
  Bell,
  Settings,
  Trophy,
  Gift,
  Coffee,
} from "lucide-react";

export default function OwnerLayout({ children }) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasFacility, setHasFacility] = useState(null); // null = loading, true/false = result
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: "dashboard", path: "dashboard", label: "Bảng điều khiển", icon: LayoutDashboard },
    { id: "courts", path: "courts", label: "Quản lý sân", icon: Building2 },
    { id: "bookings", path: "bookings", label: "Đơn đặt sân", icon: BookOpen },
    { id: "leagues", path: "leagues", label: "Quản lý giải đấu", icon: Trophy },
    { id: "rewards", path: "rewards", label: "Quản lý ưu đãi", icon: Gift },
    { id: "services", path: "services", label: "Quản lý dịch vụ", icon: Coffee },
    { id: "reports", path: "reports", label: "Doanh thu & Thanh toán", icon: CreditCard },
    { id: "reviews", path: "reviews", label: "Đánh giá & Phản hồi", icon: MessageSquare },
    { id: "analytics", path: "analytics", label: "Báo cáo & Thống kê", icon: BarChart3 },
    { id: "notifications", path: "notifications", label: "Quản lý tin nhắn", icon: Bell },
    { id: "settings", path: "settings", label: "Cấu hình & Hệ thống", icon: Settings },
  ];

  useEffect(() => {
    const checkOwnerFacility = async () => {
      // Nếu chưa có user hoặc đang loading auth, bỏ qua
      if (!user || user.role !== "owner" || authLoading) {
        setLoading(false);
        return;
      }

      try {
        const ownerId = user._id || user.id;
        const hasAnyFacility = await facilityApi.checkOwnerHasFacility(ownerId);
        setHasFacility(hasAnyFacility);
      } catch (error) {
        console.error("Error checking facilities:", error);
        // Nếu lỗi, mặc định là chưa có facility để redirect về setup
        setHasFacility(false);
      } finally {
        setLoading(false);
      }
    };

    checkOwnerFacility();
  }, [user, authLoading]);

  // Get current active tab from location
  const getActiveTab = () => {
    const path = location.pathname.split("/").pop();
    if (path === "owner" || path === "") return "dashboard";
    return path || "dashboard";
  };

  const activeTab = getActiveTab();

  const handleTabChange = (path) => {
    navigate(`/owner/${path}`);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Loading state - đợi auth hoặc check facility
  if (authLoading || (loading && hasFacility === null)) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fafb",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #e5e7eb",
              borderTop: "4px solid #3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem",
            }}
          />
          <p style={{ color: "#6b7280", fontSize: "1rem" }}>
            Đang kiểm tra thông tin cơ sở...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Redirect to setup nếu chưa có facility
  if (hasFacility === false) {
    return <Navigate to="/owner/setup" replace />;
  }

  // Nếu đã có facility, render layout với sidebar và header
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar - Fixed Top */}
      <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <OwnerHeader onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
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
                    onClick={() => {
                      const menu = menuItems.find((m) => m.id === item.id);
                      if (menu) {
                        handleTabChange(menu.path);
                      }
                    }}
                    className={`w-full flex items-center p-2 text-gray-900 rounded-lg group ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
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

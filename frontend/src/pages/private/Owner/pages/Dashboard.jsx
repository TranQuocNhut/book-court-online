import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";
import {
  CalendarDays,
  Users2,
  BadgeDollarSign,
  Star,
} from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import { facilityApi } from "../../../../api/facilityApi";
import { analyticsApi } from "../../../../api/analyticsApi";
import { toast } from "react-toastify";
import KpiCard from "../components/Dashboard/KpiCard";
import TrendChart from "../components/Dashboard/TrendChart";
import PieChartCard from "../components/Dashboard/PieChartCard";
import TodaySchedule from "../components/Dashboard/TodaySchedule";

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [facilityId, setFacilityId] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [period, setPeriod] = useState("month");
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Fetch owner facilities
  useEffect(() => {
    const fetchFacilities = async () => {
      if (!user?._id) return;
      try {
        const ownerId = user._id || user.id;
        const result = await facilityApi.getFacilities({ ownerId, status: "opening" });
        if (result.success) {
          const facilitiesList = result.data?.facilities || result.data || [];
          setFacilities(facilitiesList);
          if (facilitiesList.length > 0) {
            const firstFacilityId = facilitiesList[0]._id || facilitiesList[0].id;
            setFacilityId(firstFacilityId);
          }
        }
      } catch (error) {
        console.error("Error fetching facilities:", error);
        toast.error("Không thể tải danh sách cơ sở");
      }
    };
    fetchFacilities();
  }, [user]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboard = async () => {
      if (!facilityId) return;
      try {
        setLoading(true);
        const result = await analyticsApi.getOwnerDashboard(facilityId, period);
        if (result.success) {
          setDashboardData(result.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard:", error);
        toast.error(error.message || "Không thể tải dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [facilityId, period]);

  // Fetch today schedule
  useEffect(() => {
    const fetchTodaySchedule = async () => {
      if (!facilityId) return;
      try {
        setLoadingSchedule(true);
        const result = await analyticsApi.getOwnerTodaySchedule(facilityId);
        if (result.success) {
          setTodaySchedule(result.data.schedule || []);
        }
      } catch (error) {
        console.error("Error fetching today schedule:", error);
        // Không hiển thị error toast vì đây là phần phụ
      } finally {
        setLoadingSchedule(false);
      }
    };
    fetchTodaySchedule();
  }, [facilityId]);

  // Format currency helper
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0 VNĐ";
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + " VNĐ";
  };

  // Transform revenue chart data for TrendChart
  const trendData = dashboardData?.revenueChart
    ? dashboardData.revenueChart.map((item) => ({
        name: new Date(item._id).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
        revenue: item.dailyRevenue, // Use actual revenue amount
        bookings: 0, // Not available in dashboard API
      }))
    : [];

  // Transform booking status for PieChart
  const pieData = dashboardData
    ? [
        { name: "Đã xác nhận", value: dashboardData.totalBookings || 0 },
        { name: "Chờ xác nhận", value: dashboardData.pendingBookings || 0 },
      ]
    : [];
  const pieColors = ["#10b981", "#f59e0b"];


  if (loading && !dashboardData) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <div style={{ textAlign: "center" }}>
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
          <p style={{ color: "#6b7280" }}>Đang tải dữ liệu...</p>
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

  if (!facilityId) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <p style={{ color: "#6b7280" }}>Bạn chưa có cơ sở nào. Vui lòng tạo cơ sở trước.</p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Bảng điều khiển chủ sân</h1>
          {facilities.length > 1 && (
            <select
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 14,
              }}
            >
              {facilities.map((facility) => (
                <option key={facility._id || facility.id} value={facility._id || facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
          )}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          >
            <option value="day">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => toast.info("Tính năng xuất báo cáo đang được phát triển")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#3b82f6",
              color: "#fff",
              border: 0,
              borderRadius: 10,
              padding: "10px 14px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            <Download size={16} /> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0,1fr))",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <KpiCard
          title={`Doanh thu ${period === "day" ? "hôm nay" : period === "week" ? "tuần này" : "tháng này"}`}
          value={formatCurrency(dashboardData?.totalRevenue || 0)}
          icon={<BadgeDollarSign size={20} color="#10b981" />}
        />
        <KpiCard
          title="Tổng số lượt đặt sân"
          value={`${dashboardData?.totalBookings || 0} lượt`}
          icon={<CalendarDays size={20} color="#3b82f6" />}
        />
        <KpiCard
          title="Đơn chờ xác nhận"
          value={`${dashboardData?.pendingBookings || 0} đơn`}
          icon={<Users2 size={20} color="#f59e0b" />}
        />
        <KpiCard
          title="Đánh giá trung bình"
          value={`⭐ ${dashboardData?.averageRating?.toFixed(1) || "0"} / 5.0`}
          icon={<Star size={20} color="#f59e0b" />}
        />
      </div>

      {/* Charts and Schedule row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <TrendChart data={trendData} title="Doanh thu theo ngày" />
        <PieChartCard data={pieData} colors={pieColors} title="Tình trạng đơn" />
      </div>

      {/* Today's Schedule */}
      <TodaySchedule schedule={todaySchedule} />
    </div>
  );
};

export default Dashboard;

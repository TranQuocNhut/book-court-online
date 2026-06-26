import React, { useState, useEffect } from "react";
import { Download, Trophy, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { analyticsApi } from "../../../../api/analyticsApi";
import ReportStats from "../components/Reports/ReportStats";
import ReportPeriodSelector from "../components/Reports/ReportPeriodSelector";
import RevenueChart from "../components/Reports/RevenueChart";
import FacilityStats from "../components/Reports/FacilityStats";
import PeakHoursChart from "../components/Reports/PeakHoursChart";
import TopFacilitiesTable from "../components/Reports/TopFacilitiesTable";
import TopOwnersTable from "../components/Reports/TopOwnersTable";

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    totalRevenue: 0,
    revenueGrowth: 0,
    totalBookings: 0,
    activeFacilities: 0,
    pausedFacilities: 0,
    maintenanceFacilities: 0,
    totalFacilities: 0,
    fillRate: 0,
  });
  
  // Revenue data
  const [revenueData, setRevenueData] = useState([]);
  
  // Facility stats
  const [facilityStats, setFacilityStats] = useState({
    activeFacilities: 0,
    pausedFacilities: 0,
    maintenanceFacilities: 0,
    totalFacilities: 0,
  });
  
  // Peak hours data
  const [peakHoursData, setPeakHoursData] = useState([]);
  
  // Top facilities
  const [topFacilities, setTopFacilities] = useState([]);
  
  // Top owners
  const [topOwners, setTopOwners] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState({
    dashboard: true,
    revenue: true,
    facilityStats: true,
    peakHours: true,
    topFacilities: true,
    topOwners: true,
  });

  // Format giá tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price || 0);
  };

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    try {
      setLoading((prev) => ({ ...prev, dashboard: true }));
      const response = await analyticsApi.getAdminDashboard(selectedPeriod);
      if (response.success) {
        setDashboardStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Không thể tải thống kê tổng quan");
    } finally {
      setLoading((prev) => ({ ...prev, dashboard: false }));
    }
  };

  // Fetch revenue data
  const fetchRevenueData = async () => {
    try {
      setLoading((prev) => ({ ...prev, revenue: true }));
      const response = await analyticsApi.getAdminRevenue(selectedPeriod, selectedYear);
      if (response.success) {
        setRevenueData(response.data.revenueData || []);
      }
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      toast.error("Không thể tải dữ liệu doanh thu");
    } finally {
      setLoading((prev) => ({ ...prev, revenue: false }));
    }
  };

  // Fetch facility stats
  const fetchFacilityStats = async () => {
    try {
      setLoading((prev) => ({ ...prev, facilityStats: true }));
      const response = await analyticsApi.getAdminFacilityStats();
      if (response.success) {
        setFacilityStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching facility stats:", error);
      toast.error("Không thể tải thống kê cơ sở");
    } finally {
      setLoading((prev) => ({ ...prev, facilityStats: false }));
    }
  };

  // Fetch peak hours data
  const fetchPeakHours = async () => {
    try {
      setLoading((prev) => ({ ...prev, peakHours: true }));
      // Lấy dữ liệu 30 ngày gần nhất
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const response = await analyticsApi.getAdminPeakHours(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      if (response.success) {
        setPeakHoursData(response.data.peakHours || []);
      }
    } catch (error) {
      console.error("Error fetching peak hours:", error);
      toast.error("Không thể tải dữ liệu giờ cao điểm");
    } finally {
      setLoading((prev) => ({ ...prev, peakHours: false }));
    }
  };

  // Fetch top facilities
  const fetchTopFacilities = async () => {
    try {
      setLoading((prev) => ({ ...prev, topFacilities: true }));
      // Lấy dữ liệu năm hiện tại
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;
      
      const response = await analyticsApi.getAdminTopFacilities(startDate, endDate, 10);
      if (response.success) {
        setTopFacilities(response.data.facilities || []);
      }
    } catch (error) {
      console.error("Error fetching top facilities:", error);
      toast.error("Không thể tải top cơ sở");
    } finally {
      setLoading((prev) => ({ ...prev, topFacilities: false }));
    }
  };

  // Fetch top owners
  const fetchTopOwners = async () => {
    try {
      setLoading((prev) => ({ ...prev, topOwners: true }));
      // Lấy dữ liệu năm hiện tại
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;
      
      const response = await analyticsApi.getAdminTopOwners(startDate, endDate, 10);
      if (response.success) {
        setTopOwners(response.data.owners || []);
      }
    } catch (error) {
      console.error("Error fetching top owners:", error);
      toast.error("Không thể tải top chủ sân");
    } finally {
      setLoading((prev) => ({ ...prev, topOwners: false }));
    }
  };

  // Fetch all data on mount and when dependencies change
  useEffect(() => {
    fetchDashboardStats();
    fetchFacilityStats();
    fetchPeakHours();
  }, [selectedPeriod]);

  useEffect(() => {
    fetchRevenueData();
    fetchTopFacilities();
    fetchTopOwners();
  }, [selectedPeriod, selectedYear]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Thống kê & Báo cáo</h1>
        <button
          onClick={() => alert("TODO: Xuất báo cáo tổng hợp")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#10b981",
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

      {loading.dashboard ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 40,
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 6px 20px rgba(0,0,0,.06)",
            marginBottom: 24,
          }}
        >
          <Loader2 size={32} className="animate-spin" color="#10b981" />
        </div>
      ) : (
        <ReportStats
          totalRevenue={dashboardStats.totalRevenue}
          revenueGrowth={dashboardStats.revenueGrowth}
          activeFacilities={dashboardStats.activeFacilities}
          totalFacilities={dashboardStats.totalFacilities}
          totalBookings={dashboardStats.totalBookings}
          fillRate={dashboardStats.fillRate}
          formatPrice={formatPrice}
        />
      )}

      {/* Doanh thu theo tháng/quý */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>
            Doanh thu theo {selectedPeriod === "month" ? "tháng" : "quý"}
          </h2>
          <ReportPeriodSelector
            selectedPeriod={selectedPeriod}
            selectedYear={selectedYear}
            onPeriodChange={setSelectedPeriod}
            onYearChange={setSelectedYear}
          />
        </div>
        {loading.revenue ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 350,
            }}
          >
            <Loader2 size={32} className="animate-spin" color="#10b981" />
          </div>
        ) : (
          <RevenueChart data={revenueData} formatPrice={formatPrice} />
        )}
      </div>

      {/* Chi tiết sân hoạt động */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
          Số lượng sân hoạt động
        </h2>
        {loading.facilityStats ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: 40,
            }}
          >
            <Loader2 size={32} className="animate-spin" color="#10b981" />
          </div>
        ) : (
          <FacilityStats
            activeFacilities={facilityStats.activeFacilities}
            pausedFacilities={facilityStats.pausedFacilities}
            hiddenFacilities={facilityStats.maintenanceFacilities}
            totalFacilities={facilityStats.totalFacilities}
          />
        )}
      </div>

      {/* Tỷ lệ đặt sân theo giờ cao điểm */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
          Tỷ lệ đặt sân theo giờ cao điểm
        </h2>
        {loading.peakHours ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 400,
            }}
          >
            <Loader2 size={32} className="animate-spin" color="#10b981" />
          </div>
        ) : (
          <PeakHoursChart data={peakHoursData} formatPrice={formatPrice} />
        )}
      </div>

      {/* Top sân được đặt nhiều nhất */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <Trophy size={24} color="#f59e0b" />
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>
            Top sân được đặt nhiều nhất
          </h2>
        </div>
        {loading.topFacilities ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: 40,
            }}
          >
            <Loader2 size={32} className="animate-spin" color="#10b981" />
          </div>
        ) : (
          <TopFacilitiesTable facilities={topFacilities} formatPrice={formatPrice} />
        )}
      </div>

      {/* Top chủ sân doanh thu cao nhất */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <Trophy size={24} color="#f59e0b" />
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>
            Top chủ sân doanh thu cao nhất
          </h2>
        </div>
        {loading.topOwners ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: 40,
            }}
          >
            <Loader2 size={32} className="animate-spin" color="#10b981" />
          </div>
        ) : (
          <TopOwnersTable owners={topOwners} formatPrice={formatPrice} />
        )}
      </div>
    </div>
  );
};

export default Reports;


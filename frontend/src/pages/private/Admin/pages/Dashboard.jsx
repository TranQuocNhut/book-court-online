import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  CalendarDays,
  Users2,
  BadgeDollarSign,
  UserCheck,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { analyticsApi } from "../../../../api/analyticsApi";

const pieColors = ["#10b981", "#ef4444", "#6366f1"];

const KpiCard = ({ title, value, icon }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 12,
      padding: 16,
      boxShadow: "0 6px 20px rgba(0,0,0,.06)",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}
  >
    <div style={{ background: "#eef7f0", borderRadius: 10, padding: 10 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 13, color: "#6b7280" }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const [range, setRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      totalRevenue: 0,
      totalBookings: 0,
      occupancyRate: 0,
      newUsers: 0,
    },
    trendData: [],
    pieData: [],
    topFacilities: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, [range]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await analyticsApi.getAdminDashboardOverview(range);
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Không thể tải dữ liệu bảng điều khiển");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price || 0);
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <Loader2 size={32} className="animate-spin" color="#10b981" />
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
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Bảng điều khiển</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {["30d", "7d", "Today"].map((k) => (
            <button
              key={k}
              onClick={() => setRange(k)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: range === k ? "#10b981" : "#fff",
                color: range === k ? "#fff" : "#111827",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {k}
            </button>
          ))}
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
          title="Tổng doanh thu"
          value={`${formatPrice(dashboardData.kpis.totalRevenue)} VNĐ / tháng`}
          icon={<BadgeDollarSign size={20} color="#10b981" />}
        />
        <KpiCard
          title="Tổng số lượt đặt sân"
          value={`${dashboardData.kpis.totalBookings.toLocaleString()} lượt`}
          icon={<CalendarDays size={20} color="#3b82f6" />}
        />
        <KpiCard
          title="Tỷ lệ lấp đầy"
          value={`${dashboardData.kpis.occupancyRate}%`}
          icon={<Users2 size={20} color="#6366f1" />}
        />
        <KpiCard
          title="Số người dùng mới"
          value={`+${dashboardData.kpis.newUsers} trong tuần qua`}
          icon={<UserCheck size={20} color="#f59e0b" />}
        />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 6px 20px rgba(0,0,0,.06)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            Biểu đồ doanh thu theo tuần
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={dashboardData.trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div
                        style={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          padding: "12px",
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        {payload.map((entry, index) => {
                          const { name, value, dataKey } = entry;
                          let displayValue = "";
                          let displayLabel = "";

                          if (dataKey === "revenue" || name === "Doanh thu (M VNĐ)") {
                            displayValue = `${value}M VNĐ`;
                            displayLabel = "Doanh thu";
                          } else if (dataKey === "bookings" || name === "Số lượt đặt") {
                            displayValue = `${value} lượt`;
                            displayLabel = "Số lượt đặt";
                          }

                          return (
                            <div
                              key={index}
                              style={{
                                color: entry.color,
                                marginBottom: index < payload.length - 1 ? "8px" : "0",
                              }}
                            >
                              <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                                {displayLabel}
                              </div>
                              <div>{displayValue}</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="#3b82f6" name="Số lượt đặt" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" name="Doanh thu (M VNĐ)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 6px 20px rgba(0,0,0,.06)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Tình trạng đơn</div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={dashboardData.pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {dashboardData.pieData.map((_, i) => (
                  <Cell key={i} fill={pieColors[i % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Facilities */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 18 }}>
          Sân hoạt động nhiều nhất
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {dashboardData.topFacilities.map((facility, index) => (
            <div
              key={facility.name}
              style={{
                background: "#f8fafc",
                borderRadius: 8,
                padding: 12,
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div
                  style={{
                    background: index < 3 ? "#10b981" : "#6b7280",
                    color: "#fff",
                    borderRadius: "50%",
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {index + 1}
                </div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{facility.name}</div>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                {facility.bookings} lượt đặt
              </div>
              <div style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>
                {facility.revenue ? `${formatPrice(facility.revenue)} VNĐ` : "0 VNĐ"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


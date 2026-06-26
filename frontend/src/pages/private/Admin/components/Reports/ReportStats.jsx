import React from "react";
import { TrendingUp, Building2, Clock } from "lucide-react";

const ReportStats = ({
  totalRevenue,
  revenueGrowth,
  activeFacilities,
  totalFacilities,
  totalBookings,
  fillRate,
  formatPrice,
}) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: 16,
        marginBottom: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>
            Tổng doanh thu
          </h3>
          <TrendingUp size={20} color="#10b981" />
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#10b981" }}>
          {formatPrice(totalRevenue)} VNĐ
        </div>
        <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
          <span style={{ color: "#10b981" }}>+{revenueGrowth}%</span> so với kỳ trước
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>
            Sân hoạt động
          </h3>
          <Building2 size={20} color="#3b82f6" />
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#3b82f6" }}>
          {activeFacilities}
        </div>
        <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
          / {totalFacilities} tổng số sân
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>
            Tổng đặt sân
          </h3>
          <Clock size={20} color="#6366f1" />
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#6366f1" }}>
          {totalBookings}
        </div>
        <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
          Đã xác nhận & hoàn thành
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>
            Tỷ lệ lấp đầy
          </h3>
          <TrendingUp size={20} color="#f59e0b" />
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#f59e0b" }}>
          {fillRate}%
        </div>
        <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
          Sân đang hoạt động
        </div>
      </div>
    </div>
  );
};

export default ReportStats;


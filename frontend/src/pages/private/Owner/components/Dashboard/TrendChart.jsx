import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const TrendChart = ({ data, title = "Xu hướng đặt sân & doanh thu" }) => {
  // Format currency for tooltip
  const formatCurrency = (value) => {
    if (!value && value !== 0) return "0 VNĐ";
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value) + " VNĐ";
  };

  // Custom tooltip formatter
  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "8px 12px",
            boxShadow: "0 4px 12px rgba(0,0,0,.1)",
          }}
        >
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: 0, color: entry.color, fontSize: 14 }}>
              {entry.name === "Doanh thu (VNĐ)" 
                ? `${entry.name}: ${formatCurrency(entry.value)}`
                : `${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Format Y-axis for revenue (right axis)
  const formatYAxisRevenue = (value) => {
    if (value >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M`;
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(0)}K`;
    }
    return value.toString();
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 6px 20px rgba(0,0,0,.06)",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" tickFormatter={formatYAxisRevenue} />
          <Tooltip content={customTooltip} />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="#3b82f6" name="Lượt đặt" />
          <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" name="Doanh thu (VNĐ)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;


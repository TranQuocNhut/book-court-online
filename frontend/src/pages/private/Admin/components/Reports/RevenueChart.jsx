import React from "react";
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const RevenueChart = ({ data, formatPrice }) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" />
        <YAxis
          yAxisId="left"
          label={{ value: "Doanh thu (VNĐ)", angle: -90, position: "insideLeft" }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          label={{ value: "Số lượt đặt", angle: 90, position: "insideRight" }}
        />
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

                    // Kiểm tra theo dataKey để chắc chắn
                    if (dataKey === "revenue" || name === "Doanh thu") {
                      displayValue = `${formatPrice(value)} VNĐ`;
                      displayLabel = "Doanh thu";
                    } else if (dataKey === "bookings" || name === "Số lượt đặt") {
                      displayValue = `${value} lượt`;
                      displayLabel = "Số lượt đặt";
                    } else {
                      displayValue = value;
                      displayLabel = name || dataKey;
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
                  {payload[0]?.payload?.period && (
                    <div
                      style={{
                        marginTop: "8px",
                        paddingTop: "8px",
                        borderTop: "1px solid #e5e7eb",
                        fontWeight: 600,
                        fontSize: "14px",
                      }}
                    >
                      {payload[0].payload.period}
                    </div>
                  )}
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />
        <Bar
          yAxisId="left"
          dataKey="revenue"
          fill="#10b981"
          name="Doanh thu"
          radius={[8, 8, 0, 0]}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="bookings"
          stroke="#3b82f6"
          strokeWidth={2}
          name="Số lượt đặt"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;


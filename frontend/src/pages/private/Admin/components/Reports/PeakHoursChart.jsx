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

const PeakHoursChart = ({ data, formatPrice }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} barCategoryGap="5%">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="hour"
          angle={-45}
          textAnchor="end"
          height={80}
          interval={0}
        />
        <YAxis
          yAxisId="left"
          label={{ value: "Số lượt đặt", angle: -90, position: "insideLeft" }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          label={{ value: "Doanh thu (VNĐ)", angle: 90, position: "insideRight" }}
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
                  {payload[0]?.payload?.hour && (
                    <div
                      style={{
                        marginTop: "8px",
                        paddingTop: "8px",
                        borderTop: "1px solid #e5e7eb",
                        fontWeight: 600,
                        fontSize: "14px",
                      }}
                    >
                      {payload[0].payload.hour}
                    </div>
                  )}
                  {payload[0]?.payload?.type && (
                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      Loại: {payload[0].payload.type}
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
          dataKey="bookings"
          fill="#3b82f6"
          name="Số lượt đặt"
          radius={[8, 8, 0, 0]}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="revenue"
          stroke="#10b981"
          strokeWidth={2}
          name="Doanh thu"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default PeakHoursChart;


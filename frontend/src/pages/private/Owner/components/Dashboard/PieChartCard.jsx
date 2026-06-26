import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const PieChartCard = ({ data, colors, title = "Tình trạng đơn" }) => {
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
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={100}
            label
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChartCard;


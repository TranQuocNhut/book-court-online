import React from "react";
import { TrendingUp } from "lucide-react";

const KpiCard = ({ title, value, icon, trend }) => (
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
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, color: "#6b7280" }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
      {trend && (
        <div style={{ fontSize: 12, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
          <TrendingUp size={12} />
          {trend}
        </div>
      )}
    </div>
  </div>
);

export default KpiCard;


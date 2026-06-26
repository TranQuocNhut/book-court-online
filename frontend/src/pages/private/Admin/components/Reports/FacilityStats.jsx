import React from "react";

const FacilityStats = ({
  activeFacilities,
  pausedFacilities,
  hiddenFacilities,
  totalFacilities,
}) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#10b981" }}>
          {activeFacilities}
        </div>
        <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
          Đang hoạt động
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#f59e0b" }}>
          {pausedFacilities}
        </div>
        <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
          Tạm dừng
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#6b7280" }}>
          {hiddenFacilities}
        </div>
        <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
          Đã ẩn
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#374151" }}>
          {totalFacilities}
        </div>
        <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
          Tổng số sân
        </div>
      </div>
    </div>
  );
};

export default FacilityStats;


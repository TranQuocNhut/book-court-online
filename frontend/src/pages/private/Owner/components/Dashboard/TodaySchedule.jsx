import React from "react";

const TodaySchedule = ({ schedule = [] }) => {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 6px 20px rgba(0,0,0,.06)",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 18 }}>
        📅 Lịch sân hôm nay
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {schedule.map((item, index) => (
          <div
            key={index}
            style={{
              background: item.status === "booked" ? "#f0f9ff" : "#f0fdf4",
              border: `1px solid ${item.status === "booked" ? "#3b82f6" : "#10b981"}`,
              borderRadius: 8,
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ 
              fontWeight: 600, 
              color: item.status === "booked" ? "#1e40af" : "#166534",
              fontSize: 14 
            }}>
              {item.time}
            </div>
            <div style={{ 
              fontSize: 12, 
              color: item.status === "booked" ? "#1e40af" : "#166534",
              fontWeight: 600 
            }}>
              {item.status === "booked" ? "Đã đặt" : "Trống"}
            </div>
            {item.customer && (
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                {item.customer}
              </div>
            )}
            <div style={{ fontSize: 11, color: "#6b7280" }}>
              {item.court}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodaySchedule;


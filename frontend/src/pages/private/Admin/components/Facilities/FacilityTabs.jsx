import React from "react";

const FacilityTabs = ({ activeTab, onTabChange, approvedCount, pendingCount, partnerApplicationCount = 0 }) => {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        marginBottom: 20,
        background: "#fff",
        padding: 8,
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
      }}
    >
      <button
        onClick={() => onTabChange("all")}
        style={{
          padding: "10px 20px",
          borderRadius: 8,
          border: "none",
          background: activeTab === "all" ? "#10b981" : "transparent",
          color: activeTab === "all" ? "#fff" : "#6b7280",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 14,
          transition: "all 0.2s",
        }}
      >
        Tất cả ({approvedCount})
      </button>
      <button
        onClick={() => onTabChange("pending")}
        style={{
          padding: "10px 20px",
          borderRadius: 8,
          border: "none",
          background: activeTab === "pending" ? "#10b981" : "transparent",
          color: activeTab === "pending" ? "#fff" : "#6b7280",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 14,
          transition: "all 0.2s",
          position: "relative",
        }}
      >
        Chờ duyệt ({partnerApplicationCount})
        {partnerApplicationCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              background: "#ef4444",
              borderRadius: "50%",
            }}
          />
        )}
      </button>
    </div>
  );
};

export default FacilityTabs;


import React, { useState } from "react";
import SportsCategories from "../components/SportsCategories";
import CourtTypes from "../components/CourtTypes";

const Categories = () => {
  const [activeTab, setActiveTab] = useState("sports"); // "sports" hoặc "courtTypes"

  return (
    <div>
      {/* Tabs */}
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
          onClick={() => setActiveTab("sports")}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            background: activeTab === "sports" ? "#10b981" : "transparent",
            color: activeTab === "sports" ? "#fff" : "#6b7280",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            transition: "all 0.2s",
          }}
        >
          Môn thể thao
        </button>
        <button
          onClick={() => setActiveTab("courtTypes")}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            background: activeTab === "courtTypes" ? "#10b981" : "transparent",
            color: activeTab === "courtTypes" ? "#fff" : "#6b7280",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            transition: "all 0.2s",
          }}
        >
          Loại sân
        </button>
      </div>

      {/* Content */}
      {activeTab === "sports" ? <SportsCategories /> : <CourtTypes />}

    </div>
  );
};

export default Categories;


import React from "react";

const CourtTypeFilters = ({ searchQuery, onSearchChange }) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: 12,
        borderBottom: "1px solid #e5e7eb",
        background: "#fff",
      }}
    >
      <div>
        <label style={{ marginRight: 8 }}>Search:</label>
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm loại sân..."
          style={{
            padding: 8,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
          }}
        />
      </div>
    </div>
  );
};

export default CourtTypeFilters;


import React from "react";

const ReportPeriodSelector = ({ selectedPeriod, selectedYear, onPeriodChange, onYearChange }) => {
  const years = [2023, 2024, 2025, 2026];

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <select
        value={selectedYear}
        onChange={(e) => onYearChange(Number(e.target.value))}
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          fontSize: 14,
        }}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <button
        onClick={() =>
          onPeriodChange(selectedPeriod === "month" ? "quarter" : "month")
        }
        style={{
          padding: "8px 16px",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          background: selectedPeriod === "month" ? "#10b981" : "#fff",
          color: selectedPeriod === "month" ? "#fff" : "#111827",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        {selectedPeriod === "month" ? "Theo tháng" : "Theo quý"}
      </button>
    </div>
  );
};

export default ReportPeriodSelector;


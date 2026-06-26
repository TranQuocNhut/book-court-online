import React from "react";
import { Search } from "lucide-react";

const SearchBar = ({ value, onChange, placeholder = "Tìm kiếm...", style = {} }) => {
  return (
    <div style={{ position: "relative", ...style }}>
      <Search
        size={18}
        style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          color: "#9ca3af",
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px 12px 10px 40px",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          fontSize: 14,
          background: "#fff",
          outline: "none",
          transition: "all 0.2s",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#3b82f6";
          e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#e5e7eb";
          e.target.style.boxShadow = "none";
        }}
      />
    </div>
  );
};

export default SearchBar;


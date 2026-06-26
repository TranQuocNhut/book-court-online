import React from "react";

const ActionButton = ({ bg, Icon, onClick, title, size = 16 }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      background: bg,
      color: "#fff",
      border: 0,
      borderRadius: 8,
      padding: 8,
      marginRight: 6,
      cursor: "pointer",
      transition: "opacity 0.2s",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.opacity = "0.8";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.opacity = "1";
    }}
  >
    <Icon size={size} />
  </button>
);

export default ActionButton;


import React from "react";

const PolicySettings = ({ settings, onInputChange }) => {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          Điều khoản sử dụng
        </h3>
        <textarea
          value={settings.termsOfService}
          onChange={(e) => onInputChange("termsOfService", e.target.value)}
          rows={12}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            fontSize: 14,
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          Chính sách bảo mật
        </h3>
        <textarea
          value={settings.privacyPolicy}
          onChange={(e) => onInputChange("privacyPolicy", e.target.value)}
          rows={12}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            fontSize: 14,
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          Chính sách hoàn tiền
        </h3>
        <textarea
          value={settings.refundPolicy}
          onChange={(e) => onInputChange("refundPolicy", e.target.value)}
          rows={12}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            fontSize: 14,
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
      </div>
    </div>
  );
};

export default PolicySettings;


import React from "react";

const SupportSettings = ({ settings, onInputChange }) => {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 6px 20px rgba(0,0,0,.06)",
      }}
    >
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        Thông tin liên hệ hỗ trợ
      </h3>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
              Email hỗ trợ
            </label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => onInputChange("supportEmail", e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 14,
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
              Số điện thoại
            </label>
            <input
              type="tel"
              value={settings.supportPhone}
              onChange={(e) => onInputChange("supportPhone", e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 14,
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
            Địa chỉ
          </label>
          <input
            type="text"
            value={settings.supportAddress}
            onChange={(e) => onInputChange("supportAddress", e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
            Giờ hỗ trợ
          </label>
          <input
            type="text"
            value={settings.supportHours}
            onChange={(e) => onInputChange("supportHours", e.target.value)}
            placeholder="VD: Thứ 2 - Chủ nhật: 8:00 - 22:00"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SupportSettings;


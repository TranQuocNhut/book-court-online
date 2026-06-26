import React from "react";

const ServiceFeeSettings = ({ settings, onInputChange }) => {
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
        Tỷ lệ phí dịch vụ
      </h3>
      <div style={{ display: "grid", gap: 16 }}>
        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
            Tỷ lệ phí nền tảng (%)
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="number"
              value={settings.serviceFeePercent}
              onChange={(e) =>
                onInputChange("serviceFeePercent", Number(e.target.value))
              }
              min="0"
              max="100"
              step="0.1"
              style={{
                width: 200,
                padding: "12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 14,
              }}
            />
            <span style={{ fontSize: 18, fontWeight: 600, color: "#059669" }}>%</span>
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
            Phí này sẽ được tính trên mỗi đơn đặt sân thành công
          </div>
        </div>

        <div
          style={{
            padding: 16,
            background: "#f9fafb",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Ví dụ:</div>
          <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
            Nếu khách hàng đặt sân với giá <strong>500,000 VNĐ</strong>
            <br />
            Phí nền tảng: {settings.serviceFeePercent}% ={" "}
            <strong>
              {((500000 * settings.serviceFeePercent) / 100).toLocaleString("vi-VN")}{" "}
              VNĐ
            </strong>
            <br />
            Chủ sân nhận được:{" "}
            <strong>
              {(500000 - (500000 * settings.serviceFeePercent) / 100).toLocaleString(
                "vi-VN"
              )}{" "}
              VNĐ
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceFeeSettings;


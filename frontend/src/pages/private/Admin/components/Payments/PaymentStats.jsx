import React from "react";

const PaymentStats = ({ totalPlatformFee, totalAmount, formatPrice, loading = false }) => {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        borderRadius: 12,
        padding: 24,
        marginBottom: 20,
        color: "#fff",
      }}
    >
      <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>
        Phí nền tảng thu được
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 800,
          marginBottom: 4,
        }}
      >
        {loading ? "Đang tải..." : `${formatPrice(totalPlatformFee)} VNĐ`}
      </div>
      <div style={{ fontSize: 13, opacity: 0.8 }}>
        {loading ? "Đang tải dữ liệu..." : `Từ tổng doanh thu ${formatPrice(totalAmount)} VNĐ`}
      </div>
    </div>
  );
};

export default PaymentStats;


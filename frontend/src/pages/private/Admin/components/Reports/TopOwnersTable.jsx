import React from "react";
import { Trophy } from "lucide-react";

const TopOwnersTable = ({ owners, formatPrice }) => {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f9fafb", textAlign: "left" }}>
            {["Hạng", "Tên chủ sân", "Email", "Số cơ sở", "Tổng doanh thu", "Số lượt đặt"].map(
              (h) => (
                <th
                  key={h}
                  style={{
                    padding: 12,
                    fontSize: 13,
                    color: "#6b7280",
                    borderBottom: "1px solid #e5e7eb",
                    fontWeight: 600,
                  }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {owners.map((owner, index) => (
            <tr
              key={owner.id || owner.ownerId}
              style={{
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <td style={{ padding: 12 }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background:
                      index === 0
                        ? "#fbbf24"
                        : index === 1
                        ? "#e5e7eb"
                        : index === 2
                        ? "#f97316"
                        : "#f3f4f6",
                    color: index < 3 ? "#fff" : "#6b7280",
                    textAlign: "center",
                    lineHeight: "28px",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {index + 1}
                </span>
              </td>
              <td style={{ padding: 12, fontWeight: 600 }}>{owner.name || "N/A"}</td>
              <td style={{ padding: 12, color: "#6b7280" }}>{owner.email || "-"}</td>
              <td style={{ padding: 12, color: "#6b7280" }}>
                {owner.facilityCount || (owner.facilities?.length || 0)} cơ sở
              </td>
              <td style={{ padding: 12, fontWeight: 600, color: "#10b981" }}>
                {formatPrice(owner.revenue || 0)} VNĐ
              </td>
              <td style={{ padding: 12, color: "#6b7280" }}>
                {owner.bookings || 0} lượt
              </td>
            </tr>
          ))}
          {owners.length === 0 && (
            <tr>
              <td
                colSpan={6}
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: "#6b7280",
                }}
              >
                Chưa có dữ liệu
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TopOwnersTable;


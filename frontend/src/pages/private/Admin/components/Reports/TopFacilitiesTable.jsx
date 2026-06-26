import React from "react";
import { Trophy } from "lucide-react";

const TopFacilitiesTable = ({ facilities, formatPrice }) => {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f9fafb", textAlign: "left" }}>
            {["Hạng", "Tên sân", "Số lượt đặt", "Doanh thu", "Trung bình/đơn"].map(
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
          {facilities.map((facility, index) => (
            <tr
              key={facility.facilityId || facility.name}
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
              <td style={{ padding: 12, fontWeight: 600 }}>{facility.name || "N/A"}</td>
              <td style={{ padding: 12, color: "#6b7280" }}>
                {facility.bookings || 0} lượt
              </td>
              <td style={{ padding: 12, fontWeight: 600, color: "#10b981" }}>
                {formatPrice(facility.revenue || 0)} VNĐ
              </td>
              <td style={{ padding: 12, color: "#6b7280" }}>
                {facility.bookings > 0
                  ? formatPrice(Math.round((facility.revenue || 0) / facility.bookings))
                  : "0"}{" "}
                VNĐ
              </td>
            </tr>
          ))}
          {facilities.length === 0 && (
            <tr>
              <td
                colSpan={5}
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

export default TopFacilitiesTable;


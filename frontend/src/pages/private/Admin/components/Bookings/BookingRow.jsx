import React from "react";
import { Eye } from "lucide-react";
import { StatusBadge, ActionButton } from "../shared";

const BookingRow = ({ booking, paymentMethodMap, formatPrice, onView }) => {
  const paymentMethod = paymentMethodMap[booking.paymentMethod] || {
    label: booking.paymentMethod || "N/A",
    color: "#6b7280",
    bg: "#f3f4f6",
  };

  return (
    <tr key={booking.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
      <td style={{ padding: 12, fontWeight: 700, color: "#1f2937" }}>
        {booking.id}
      </td>
      <td style={{ padding: 12, fontWeight: 600 }}>{booking.facility}</td>
      <td style={{ padding: 12 }}>
        <div>
          <div style={{ fontWeight: 500 }}>{booking.customer}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{booking.phone}</div>
        </div>
      </td>
      <td style={{ padding: 12 }}>
        <div>
          <div style={{ fontWeight: 600 }}>{booking.date}</div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            {booking.startTime} - {booking.endTime}
          </div>
        </div>
      </td>
      <td style={{ padding: 12 }}>
        <StatusBadge value={booking.status} type="booking" />
      </td>
      <td style={{ padding: 12 }}>
        <span
          style={{
            background: paymentMethod.bg,
            color: paymentMethod.color,
            padding: "4px 8px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {paymentMethod.label}
        </span>
      </td>
      <td style={{ padding: 12, fontWeight: 700, color: "#059669" }}>
        {formatPrice(booking.price)} VNĐ
      </td>
      <td style={{ padding: 12, whiteSpace: "nowrap" }}>
        <ActionButton bg="#06b6d4" Icon={Eye} onClick={() => onView(booking)} title="Xem chi tiết" />
      </td>
    </tr>
  );
};

export default BookingRow;


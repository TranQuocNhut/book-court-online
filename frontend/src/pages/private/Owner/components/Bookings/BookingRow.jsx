import React from "react";
import { Eye, CheckCircle2, XCircle } from "lucide-react";
import { ActionButton } from "../shared";
import StatusBadge from "../shared/StatusBadge";

const BookingRow = ({ booking, handlers }) => {
  return (
    <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
      <td style={{ padding: 12, fontWeight: 700, color: "#1f2937" }}>{booking.id}</td>
      <td style={{ padding: 12 }}>
        <div>
          <div style={{ fontWeight: 600 }}>{booking.customer}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{booking.email}</div>
        </div>
      </td>
      <td style={{ padding: 12 }}>
        <div style={{ fontSize: 14 }}>{booking.phone}</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>Đặt: {booking.bookingDate}</div>
      </td>
      <td style={{ padding: 12 }}>
        <div>
          <div style={{ fontWeight: 600 }}>{booking.court}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{booking.courtType}</div>
        </div>
      </td>
      <td style={{ padding: 12, fontWeight: 600 }}>{booking.date}</td>
      <td style={{ padding: 12, maxWidth: "200px", width: "200px" }}>
        {(() => {
          const timeSlots = booking._original?.timeSlots || 
            (typeof booking.time === 'string' && booking.time !== 'N/A' 
              ? booking.time.split(', ').filter(Boolean) 
              : []);
          
          if (Array.isArray(timeSlots) && timeSlots.length > 0) {
            return (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "4px",
                  maxHeight: "60px",
                  overflow: "hidden",
                }}
                title={timeSlots.join(", ")}
              >
                {timeSlots.slice(0, 3).map((slot, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: "#e6f9f0",
                      color: "#059669",
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      display: "inline-block",
                    }}
                  >
                    {slot.trim()}
                  </span>
                ))}
                {timeSlots.length > 3 && (
                  <span
                    style={{
                      background: "#f3f4f6",
                      color: "#6b7280",
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      display: "inline-block",
                    }}
                    title={`+${timeSlots.length - 3} khung giờ khác: ${timeSlots.slice(3).join(", ")}`}
                  >
                    +{timeSlots.length - 3}
                  </span>
                )}
              </div>
            );
          }
          
          return (
            <span style={{ color: "#059669", fontWeight: 600, fontSize: 12 }}>
              {booking.time || "N/A"}
            </span>
          );
        })()}
      </td>
      <td style={{ padding: 12, fontWeight: 600, color: "#059669" }}>
        {booking.price.toLocaleString()}
      </td>
      <td style={{ padding: 12 }}>
        <span
          style={{
            background:
              booking.pay === "paid"
                ? "#e6f9f0"
                : booking.pay === "pending"
                ? "#fef3c7"
                : "#fee2e2",
            color:
              booking.pay === "paid"
                ? "#059669"
                : booking.pay === "pending"
                ? "#d97706"
                : "#ef4444",
            padding: "4px 8px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {booking.pay === "paid"
            ? "Đã thanh toán"
            : booking.pay === "pending"
            ? "Chờ thanh toán"
            : "Hoàn tiền"}
        </span>
      </td>
      <td style={{ padding: 12 }}>
        <StatusBadge value={booking.status} type="booking" />
      </td>
      <td style={{ padding: 12, maxWidth: "150px" }}>
        {booking.notes ? (
          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={booking.notes}
          >
            {booking.notes}
          </div>
        ) : (
          <span style={{ color: "#9ca3af" }}>-</span>
        )}
      </td>
      <td style={{ padding: 12, whiteSpace: "nowrap" }}>
        <ActionButton
          bg="#06b6d4"
          Icon={Eye}
          onClick={() => handlers.onView(booking)}
          title="Xem"
        />
        {booking.status === "pending" && (
          <ActionButton
            bg="#10b981"
            Icon={CheckCircle2}
            onClick={() => handlers.onConfirm(booking)}
            title="Xác nhận"
          />
        )}
        {/* Không hiển thị nút hủy cho các đơn đã hết hạn hoặc đã hủy */}
        {booking.status !== "cancelled" && booking.status !== "expired" && (
          <ActionButton
            bg="#ef4444"
            Icon={XCircle}
            onClick={() => handlers.onCancel(booking)}
            title="Hủy"
          />
        )}
      </td>
    </tr>
  );
};

export default BookingRow;


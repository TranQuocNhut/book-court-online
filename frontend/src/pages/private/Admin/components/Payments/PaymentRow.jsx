import React from "react";
import { Eye } from "lucide-react";
import { StatusBadge, ActionButton } from "../shared";

const PaymentRow = ({
  payment,
  paymentMethodMap,
  formatPrice,
  onView,
}) => {
  const paymentMethod =
    paymentMethodMap[payment.paymentMethod] || paymentMethodMap["Tiền mặt"];

  return (
    <tr key={payment.transactionId} style={{ borderBottom: "1px solid #f3f4f6" }}>
      <td style={{ padding: 12, fontWeight: 700, color: "#1f2937" }}>
        {payment.transactionId}
      </td>
      <td style={{ padding: 12 }}>
        <div>
          <div style={{ fontWeight: 600 }}>{payment.performer}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            {payment.facility}
          </div>
        </div>
      </td>
      <td style={{ padding: 12, fontWeight: 700, color: "#059669" }}>
        {formatPrice(payment.amount)} VNĐ
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
      <td style={{ padding: 12 }}>
        <StatusBadge value={payment.status} type="payment" />
      </td>
      <td style={{ padding: 12, color: "#6b7280" }}>
        {payment.date} {payment.time}
      </td>
      <td style={{ padding: 12, whiteSpace: "nowrap" }}>
        <ActionButton bg="#06b6d4" Icon={Eye} onClick={() => onView(payment)} title="Xem chi tiết" size={12} />
      </td>
    </tr>
  );
};

export default PaymentRow;


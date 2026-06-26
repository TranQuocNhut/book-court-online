import React from "react";
import PaymentRow from "./PaymentRow";
import { Pagination } from "../shared";

const PaymentTable = ({
  payments,
  page,
  pageSize,
  totalItems,
  paymentMethodMap,
  formatPrice,
  onPageChange,
  onPageSizeChange,
  onView,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const headers = [
    "Mã giao dịch",
    "Người thanh toán / Sân",
    "Số tiền",
    "Phương thức",
    "Trạng thái",
    "Thời gian",
    "Hành động",
  ];

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 6px 20px rgba(0,0,0,.06)",
      }}
    >
      {/* Header với page size selector */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: 12,
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div>
          <label style={{ marginRight: 8 }}>Show</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{
              padding: 6,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span style={{ marginLeft: 8 }}>entries</span>
        </div>
        <div style={{ color: "#6b7280", fontSize: 14 }}>
          Hiển thị {totalItems} kết quả
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", textAlign: "left" }}>
              {headers.map((h) => (
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
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  Không tìm thấy giao dịch nào
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <PaymentRow
                  key={payment.transactionId}
                  payment={payment}
                  paymentMethodMap={paymentMethodMap}
                  formatPrice={formatPrice}
                  onView={onView}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {payments.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={totalItems}
          onPageChange={(p) => onPageChange(p)}
          onPageSizeChange={onPageSizeChange}
          itemsLabel="giao dịch"
        />
      )}
    </div>
  );
};

export default PaymentTable;


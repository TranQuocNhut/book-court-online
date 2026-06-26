import React from "react";
import BookingRow from "./BookingRow";
import { Pagination } from "../shared";

const BookingTable = ({
  bookings,
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
    "Mã đơn đặt sân",
    "Tên sân",
    "Người đặt",
    "Thời gian bắt đầu / kết thúc",
    "Trạng thái",
    "Phương thức thanh toán",
    "Tổng tiền",
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
            {bookings.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  Không tìm thấy đơn đặt sân nào
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
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
      {bookings.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={totalItems}
          onPageChange={(p) => onPageChange(p)}
          onPageSizeChange={onPageSizeChange}
          itemsLabel="đơn đặt sân"
        />
      )}
    </div>
  );
};

export default BookingTable;


import React from "react";
import BookingRow from "./BookingRow";
import Pagination from "../shared/Pagination";

const BookingTable = ({
  bookings = [],
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  onPageSizeChange,
  handlers,
}) => {
  const headers = [
    "Mã đặt",
    "Khách hàng",
    "Liên hệ",
    "Sân",
    "Ngày đặt",
    "Khung giờ",
    "Giá (VNĐ)",
    "Thanh toán",
    "Trạng thái",
    "Ghi chú",
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
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", textAlign: "left" }}>
              {headers.map((h, index) => (
                <th
                  key={h}
                  style={{
                    padding: 12,
                    fontSize: 13,
                    color: "#6b7280",
                    borderBottom: "1px solid #e5e7eb",
                    fontWeight: 600,
                    ...(h === "Khung giờ" && { maxWidth: "200px", width: "200px" }),
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
                <td colSpan={11} style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
                  Không có đơn đặt sân nào
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <BookingRow key={booking.id} booking={booking} handlers={handlers} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {bookings.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          itemsLabel="đơn đặt sân"
        />
      )}
    </div>
  );
};

export default BookingTable;


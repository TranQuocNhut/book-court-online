import React from "react";
import PromotionRow from "./PromotionRow";
import { Pagination } from "../shared";

const PromotionTable = ({
  promotions,
  page,
  pageSize,
  totalItems,
  statusMap,
  getStatus,
  formatDiscount,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const headers = [
    "Mã khuyến mãi",
    "Tên chương trình",
    "Mức giảm",
    "Ngày bắt đầu",
    "Ngày kết thúc",
    "Áp dụng cho",
    "Sử dụng",
    "Trạng thái",
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
            {promotions.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  Không tìm thấy khuyến mãi nào
                </td>
              </tr>
            ) : (
              promotions.map((promotion) => (
                <PromotionRow
                  key={promotion.id}
                  promotion={promotion}
                  statusMap={statusMap}
                  getStatus={getStatus}
                  formatDiscount={formatDiscount}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {promotions.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={totalItems}
          onPageChange={(p) => onPageChange(p)}
          onPageSizeChange={onPageSizeChange}
          itemsLabel="khuyến mãi"
        />
      )}
    </div>
  );
};

export default PromotionTable;


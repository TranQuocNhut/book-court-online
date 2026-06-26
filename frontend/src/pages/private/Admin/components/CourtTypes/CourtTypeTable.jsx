import React from "react";
import CourtTypeFilters from "./CourtTypeFilters";
import CourtTypeRow from "./CourtTypeRow";
import { Pagination } from "../shared";

const CourtTypeTable = ({
  courtTypes,
  loading,
  error,
  page,
  pageSize,
  totalItems,
  searchQuery,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onEdit,
  onDelete,
}) => {
  const categories = courtTypes; // Alias for clarity
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const headers = [
    "Mã",
    "Tên loại sân",
    "Danh mục thể thao",
    "Mô tả",
    "Đặc điểm",
    "Số sân",
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
      <CourtTypeFilters searchQuery={searchQuery} onSearchChange={onSearchChange} />
      
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
            {[5, 10, 20].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span style={{ marginLeft: 8 }}>entries</span>
        </div>
      </div>

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
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: 16,
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  Đang tải...
                </td>
              </tr>
            ) : courtTypes.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: 16,
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  {error || "Không có dữ liệu"}
                </td>
              </tr>
            ) : (
              categories.map((courtType, idx) => (
                <CourtTypeRow
                  key={courtType._id || courtType.id}
                  courtType={courtType}
                  index={idx}
                  page={page}
                  pageSize={pageSize}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && !error && categories.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={totalItems}
          onPageChange={(p) => onPageChange(p)}
          onPageSizeChange={onPageSizeChange}
          itemsLabel="loại sân"
        />
      )}
    </div>
  );
};

export default CourtTypeTable;


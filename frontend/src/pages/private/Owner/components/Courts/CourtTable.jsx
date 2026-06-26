import React from "react";
import { Loader2 } from "lucide-react";
import CourtRow from "./CourtRow";
import Pagination from "../shared/Pagination";

const CourtTable = ({
  courts = [],
  loading = false,
  error = null,
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  onPageSizeChange,
  handlers,
}) => {
  const headers = [
    "Tên sân",
    "Loại",
    "Sức chứa",
    "Giá/giờ",
    "Trạng thái",
    "Bảo trì",
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
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: 24, textAlign: "center" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      color: "#6b7280",
                    }}
                  >
                    <Loader2 size={20} className="animate-spin" style={{ color: "#10b981" }} />
                    <span>Đang tải...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#ef4444" }}>
                  {error}
                </td>
              </tr>
            ) : courts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
                  Không có sân nào
                </td>
              </tr>
            ) : (
              courts.map((court) => (
                <CourtRow key={court._id || court.id} court={court} handlers={handlers} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && !error && courts.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          itemsLabel="sân"
        />
      )}
    </div>
  );
};

export default CourtTable;


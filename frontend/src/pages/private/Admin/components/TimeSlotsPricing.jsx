import React, { useState, useMemo } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { timeSlotsPricingData } from "../data/mockData";
import { ActionButton } from "./shared";

const TimeSlotsPricing = () => {
  const [pricing, setPricing] = useState(timeSlotsPricingData);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredPricing = useMemo(
    () =>
      pricing.filter((r) =>
        [r.facility, r.court, r.sport, r.timeSlot]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ),
    [pricing, searchQuery]
  );

  const totalPages = Math.max(1, Math.ceil(filteredPricing.length / pageSize));
  const pricingSlice = filteredPricing.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " VNĐ";
  };

  const handleEdit = (item) => {
    console.log("Edit pricing:", item);
  };

  const handleDelete = (item) => {
    if (
      window.confirm(
        `Bạn có chắc muốn xóa khung giờ "${item.timeSlot}" của ${item.facility}?`
      )
    ) {
      setPricing((current) => current.filter((p) => p.id !== item.id));
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Khung giờ & Giá</h1>
        <button
          onClick={() => console.log("Add new pricing")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#10b981",
            color: "#fff",
            border: 0,
            borderRadius: 10,
            padding: "10px 14px",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          <Plus size={16} /> Thêm khung giờ
        </button>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
        }}
      >
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
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
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
          <div>
            <label style={{ marginRight: 8 }}>Search:</label>
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm kiếm cơ sở, sân, khung giờ..."
              style={{
                padding: 8,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                {[
                  "Mã",
                  "Cơ sở",
                  "Sân",
                  "Môn thể thao",
                  "Khung giờ",
                  "Giá ngày thường",
                  "Giá cuối tuần",
                  "Trạng thái",
                  "Hành động",
                ].map((h) => (
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
              {pricingSlice.map((r, idx) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 12 }}>
                    {(page - 1) * pageSize + idx + 1}
                  </td>
                  <td style={{ padding: 12, fontWeight: 600 }}>
                    {r.facility}
                  </td>
                  <td style={{ padding: 12 }}>{r.court}</td>
                  <td style={{ padding: 12 }}>{r.sport}</td>
                  <td style={{ padding: 12, fontWeight: 600 }}>
                    {r.timeSlot}
                  </td>
                  <td style={{ padding: 12, color: "#059669", fontWeight: 600 }}>
                    {formatPrice(r.weekdayPrice)}
                  </td>
                  <td style={{ padding: 12, color: "#059669", fontWeight: 600 }}>
                    {formatPrice(r.weekendPrice)}
                  </td>
                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        background:
                          r.status === "active" ? "#e6f9f0" : "#fee2e2",
                        color: r.status === "active" ? "#059669" : "#ef4444",
                        padding: "4px 8px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {r.status === "active" ? "Hoạt động" : "Ngừng hoạt động"}
                    </span>
                  </td>
                  <td style={{ padding: 12, whiteSpace: "nowrap" }}>
                    <ActionButton
                      bg="#22c55e"
                      Icon={Pencil}
                      onClick={() => handleEdit(r)}
                      title="Sửa"
                    />
                    <ActionButton
                      bg="#ef4444"
                      Icon={Trash2}
                      onClick={() => handleDelete(r)}
                      title="Xóa"
                    />
                  </td>
                </tr>
              ))}
              {!pricingSlice.length && (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      padding: 16,
                      textAlign: "center",
                      color: "#6b7280",
                    }}
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: 12,
          }}
        >
          <div>
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, filteredPricing.length)} of{" "}
            {filteredPricing.length} entries
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Previous
            </button>
            <div
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                background: "#10b981",
                color: "#fff",
              }}
            >
              {page}
            </div>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotsPricing;


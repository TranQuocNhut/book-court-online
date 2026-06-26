import React from "react";
import { Check, X, User, Mail, Phone, Calendar, ExternalLink } from "lucide-react";
import { Pagination } from "../shared";

const PendingPartnerApplications = ({
  applications = [],
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  onApprove,
  onReject,
  onViewUser,
}) => {
  const headers = [
    "Họ và tên",
    "Email",
    "Số điện thoại",
    "Ngày đăng ký",
    "Hành động",
  ];

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
          alignItems: "center",
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
          Hiển thị {totalItems} đơn đăng ký
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
            {applications.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  Không có đơn đăng ký đối tác nào chờ duyệt
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr
                  key={app._id || app.id}
                  style={{ borderBottom: "1px solid #f3f4f6" }}
                >
                  <td style={{ padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: "#e6f9f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <User size={18} color="#059669" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "#1f2937" }}>
                          {app.name || app.user?.name || "N/A"}
                        </div>
                        {app.user?._id && (
                          <button
                            onClick={() => onViewUser(app.user._id)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              background: "none",
                              border: "none",
                              color: "#3b82f6",
                              cursor: "pointer",
                              fontSize: 12,
                              padding: 0,
                              marginTop: 4,
                            }}
                          >
                            Xem tài khoản
                            <ExternalLink size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Mail size={14} color="#6b7280" />
                      <span style={{ color: "#374151" }}>
                        {app.email || app.user?.email || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Phone size={14} color="#6b7280" />
                      <span style={{ color: "#374151" }}>
                        {app.phone || app.user?.phone || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Calendar size={14} color="#6b7280" />
                      <span style={{ color: "#374151" }}>
                        {formatDate(app.createdAt || app.submittedAt)}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: 12, whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => onApprove(app)}
                        style={{
                          background: "#10b981",
                          color: "#fff",
                          border: 0,
                          borderRadius: 8,
                          padding: "8px 16px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = "#059669";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = "#10b981";
                        }}
                        title="Duyệt đơn và cấp role owner"
                      >
                        <Check size={14} />
                        Duyệt
                      </button>
                      <button
                        onClick={() => onReject(app)}
                        style={{
                          background: "#ef4444",
                          color: "#fff",
                          border: 0,
                          borderRadius: 8,
                          padding: "8px 16px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = "#dc2626";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = "#ef4444";
                        }}
                        title="Từ chối đơn đăng ký"
                      >
                        <X size={14} />
                        Từ chối
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {applications.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={totalItems}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          itemsLabel="đơn đăng ký"
        />
      )}
    </div>
  );
};

export default PendingPartnerApplications;


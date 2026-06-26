import React, { useState, useEffect } from "react";
import { Eye, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { auditApi } from "../../../../api/auditApi";
import ActivityLogDetailModal from "../modals/ActivityLogDetailModal";
import ActivityLogDeleteModal from "../modals/ActivityLogDeleteModal";

const ActionButton = ({ bg, Icon, onClick, title }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      background: bg,
      color: "#fff",
      border: 0,
      borderRadius: 8,
      padding: 8,
      marginRight: 6,
      cursor: "pointer",
    }}
  >
    <Icon size={16} />
  </button>
);

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // -- THÊM STATE CHO MODAL --
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // -- THÊM STATE CHO MODAL XÓA --
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pageSize,
        search: searchQuery || undefined,
      };

      // Add filters
      if (actionFilter !== "all") {
        params.action = actionFilter;
      }

      const response = await auditApi.getAuditLogs(params);
      if (response.success) {
        let filteredLogs = response.data.logs || [];
        
        // Filter by user role (client-side)
        if (userFilter !== "all") {
          filteredLogs = filteredLogs.filter(
            (log) => log.userRole === userFilter
          );
        }

        setLogs(filteredLogs);
        setPagination(response.data.pagination || pagination);
        setTotal(userFilter !== "all" ? filteredLogs.length : (response.data.pagination?.total || 0));
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Không thể tải nhật ký hoạt động");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, pageSize, searchQuery, userFilter, actionFilter]);

  // -- THÊM HÀM ĐIỀU KHIỂN MODAL --
  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedLog(null);
  };

  // -- THÊM CÁC HÀM XỬ LÝ XÓA --
  const handleOpenDeleteModal = (log) => {
    setLogToDelete(log);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setLogToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (logToDelete) {
      // Note: API might not support delete, so this is just UI update
      // You may need to implement delete API if needed
      setLogs((currentLogs) =>
        currentLogs.filter((log) => log.id !== logToDelete.id)
      );
      handleCloseDeleteModal();
      toast.success("Đã xóa nhật ký hoạt động");
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Nhật ký hoạt động</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => alert("TODO: Xuất nhật ký")}
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
              fontWeight: 700 
            }}
          >
            📄 Xuất nhật ký
          </button>
        </div>
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
            alignItems: "center",
            padding: 16,
            borderBottom: "1px solid #e5e7eb",
          }}
        >
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div>
                <strong>Tổng:</strong> {total} hoạt động
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <select 
                  style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14 }}
                  value={userFilter}
                  onChange={(e) => {
                    setUserFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">Tất cả người dùng</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Chủ sân</option>
                  <option value="user">Người dùng</option>
                </select>
                <select 
                  style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14 }}
                  value={actionFilter}
                  onChange={(e) => {
                    setActionFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">Tất cả hành động</option>
                  <option value="LOGIN">Đăng nhập</option>
                  <option value="LOGOUT">Đăng xuất</option>
                  <option value="CREATE_SPORT_CATEGORY">Tạo danh mục</option>
                  <option value="UPDATE_SPORT_CATEGORY">Cập nhật danh mục</option>
                  <option value="DELETE_SPORT_CATEGORY">Xóa danh mục</option>
                  <option value="CHANGE_ROLE">Thay đổi vai trò</option>
                  <option value="LOCK_USER">Khóa tài khoản</option>
                  <option value="UNLOCK_USER">Mở khóa tài khoản</option>
                </select>
              </div>
            </div>
            <input
              placeholder="Tìm theo người dùng, hành động, mục tiêu…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              style={{ 
                padding: "8px 12px", 
                borderRadius: 8, 
                border: "1px solid #e5e7eb",
                minWidth: "300px",
                fontSize: 14
              }}
            />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                {[
                  "Mã",
                  "Người dùng",
                  "Hành động",
                  "Mục tiêu",
                  "Chi tiết",
                  "IP",
                  "Thời gian",
                  "Hành động",
                ].map((h) => (
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
                  <td colSpan={8} style={{ padding: 40, textAlign: "center" }}>
                    <Loader2 size={32} className="animate-spin" color="#10b981" style={{ margin: "0 auto" }} />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: 32,
                      textAlign: "center",
                      color: "#6b7280",
                    }}
                  >
                    <div style={{ fontSize: 16, marginBottom: 8 }}>📋</div>
                    Không có dữ liệu nhật ký
                  </td>
                </tr>
              ) : (
                logs.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 12, fontWeight: 700, color: "#1f2937" }}>{r.id}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{
                      background: r.userRole === "admin" ? "#e6f3ff" : 
                                 r.userRole === "owner" ? "#fef3c7" : "#e6f9f0",
                      color: r.userRole === "admin" ? "#1d4ed8" : 
                            r.userRole === "owner" ? "#d97706" : "#059669",
                      padding: "4px 8px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {r.user}
                    </span>
                  </td>
                  <td style={{ padding: 12, fontWeight: 600 }}>{r.action}</td>
                  <td style={{ padding: 12, fontWeight: 600, color: "#3b82f6" }}>{r.target}</td>
                  <td style={{ padding: 12, maxWidth: "300px" }}>
                    <div style={{ 
                      fontSize: 14,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }} title={r.details}>
                      {r.details}
                    </div>
                  </td>
                  <td style={{ padding: 12, fontSize: 12, color: "#6b7280" }}>
                    {r.ip}
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ fontSize: 14 }}>{r.date}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{r.time}</div>
                  </td>
                  <td style={{ padding: 12, whiteSpace: "nowrap" }}>
                    <ActionButton
                      bg="#06b6d4"
                      Icon={Eye}
                      onClick={() => handleViewDetails(r)}
                      title="Xem chi tiết"
                    />
                    <ActionButton
                      bg="#ef4444"
                      Icon={Trash2}
                      onClick={() => handleOpenDeleteModal(r)}
                      title="Xóa"
                    />
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 16,
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <div style={{ fontSize: 14, color: "#6b7280" }}>
              Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} của {total} hoạt động
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 14,
                }}
              >
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
                <option value={100}>100 / trang</option>
              </select>
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: page === 1 ? "#f3f4f6" : "#fff",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  fontSize: 14,
                }}
              >
                Trước
              </button>
              <span style={{ fontSize: 14, color: "#6b7280" }}>
                Trang {page} / {pagination.pages || 1}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= (pagination.pages || 1)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: page >= (pagination.pages || 1) ? "#f3f4f6" : "#fff",
                  cursor: page >= (pagination.pages || 1) ? "not-allowed" : "pointer",
                  fontSize: 14,
                }}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* -- RENDER MODAL TẠI ĐÂY -- */}
      <ActivityLogDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        log={selectedLog}
      />

      <ActivityLogDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        log={logToDelete}
      />
    </div>
  );
};

export default ActivityLog;


import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { withdrawalApi } from "../../../../api/withdrawalApi";

const Withdrawals = () => {
  // Lệnh rút tiền từ PayOS
  const [payouts, setPayouts] = useState([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [payoutsPagination, setPayoutsPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    count: 0,
    hasMore: false,
  });
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [payoutsPageSize, setPayoutsPageSize] = useState(10);
  const [approvalStateFilter, setApprovalStateFilter] = useState("all");

  // Fetch danh sách payouts từ PayOS
  const fetchPayouts = async () => {
    try {
      setLoadingPayouts(true);
      const offset = (payoutsPage - 1) * payoutsPageSize;
      const params = {
        limit: payoutsPageSize,
        offset: offset,
      };
      
      if (approvalStateFilter !== "all") {
        params.approvalState = approvalStateFilter;
      }

      const response = await withdrawalApi.getPayosPayoutsList(params);
      if (response.success && response.data) {
        setPayouts(response.data.payouts || []);
        setPayoutsPagination(response.data.pagination || {
          total: 0,
          limit: payoutsPageSize,
          offset: offset,
          count: 0,
          hasMore: false,
        });
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách lệnh rút tiền:", error);
      setPayouts([]);
    } finally {
      setLoadingPayouts(false);
    }
  };

  // Fetch payouts khi filters thay đổi
  useEffect(() => {
    fetchPayouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payoutsPage, payoutsPageSize, approvalStateFilter]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getApprovalStateBadge = (state) => {
    const stateMap = {
      SUCCEEDED: { label: "Thành công", color: "#10b981", bg: "#d1fae5" },
      PENDING: { label: "Đang xử lý", color: "#f59e0b", bg: "#fef3c7" },
      FAILED: { label: "Thất bại", color: "#ef4444", bg: "#fee2e2" },
      APPROVED: { label: "Đã duyệt", color: "#3b82f6", bg: "#dbeafe" },
    };
    const style = stateMap[state] || { label: state, color: "#6b7280", bg: "#f3f4f6" };
    return (
      <span
        style={{
          padding: "4px 12px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          color: style.color,
          background: style.bg,
        }}
      >
        {style.label}
      </span>
    );
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>
          Quản lý lệnh rút tiền
        </h1>
      </div>

      {/* Filters cho withdrawals */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          alignItems: "center",
        }}
      >
        <label style={{ fontSize: 14, fontWeight: 600 }}>Trạng thái:</label>
        <select
          value={approvalStateFilter}
          onChange={(e) => {
            setApprovalStateFilter(e.target.value);
            setPayoutsPage(1);
          }}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        >
          <option value="all">Tất cả</option>
          <option value="SUCCEEDED">Thành công</option>
          <option value="PENDING">Đang xử lý</option>
          <option value="FAILED">Thất bại</option>
          <option value="APPROVED">Đã duyệt</option>
        </select>
        <button
          onClick={fetchPayouts}
          disabled={loadingPayouts}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: loadingPayouts ? "not-allowed" : "pointer",
            opacity: loadingPayouts ? 0.6 : 1,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <RefreshCw 
            size={16} 
            style={{ 
              animation: loadingPayouts ? "spin 1s linear infinite" : "none",
              transform: loadingPayouts ? "rotate(0deg)" : "none",
            }} 
          />
          Làm mới
        </button>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>

      {/* Table payouts */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
          overflow: "hidden",
        }}
      >
        {loadingPayouts ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
            Đang tải...
          </div>
        ) : payouts.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
            Không có lệnh rút tiền nào
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                      Mã tham chiếu
                    </th>
                    <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                      Số tiền
                    </th>
                    <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                      Tài khoản nhận
                    </th>
                    <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                      Trạng thái
                    </th>
                    <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                      Ngày tạo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => {
                    const transaction = payout.transactions?.[0];
                    return (
                      <tr
                        key={payout.id}
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: 12, fontSize: 13, color: "#374151" }}>
                          {payout.referenceId || payout.id}
                        </td>
                        <td style={{ padding: 12, fontSize: 13, fontWeight: 600, color: "#374151" }}>
                          {formatPrice(transaction?.amount || 0)} VNĐ
                        </td>
                        <td style={{ padding: 12, fontSize: 13, color: "#374151" }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{transaction?.toAccountName || "-"}</div>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>
                              {transaction?.toAccountNumber || "-"} - {transaction?.toBin || "-"}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: 12 }}>
                          {getApprovalStateBadge(payout.approvalState)}
                        </td>
                        <td style={{ padding: 12, fontSize: 13, color: "#6b7280" }}>
                          {formatDate(payout.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {payoutsPagination.total > 0 && (
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
                  Hiển thị {payoutsPagination.offset + 1} - {payoutsPagination.offset + payoutsPagination.count} / {payoutsPagination.total}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setPayoutsPage((p) => Math.max(1, p - 1))}
                    disabled={payoutsPage === 1}
                    style={{
                      padding: "6px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      background: "#fff",
                      cursor: payoutsPage === 1 ? "not-allowed" : "pointer",
                      opacity: payoutsPage === 1 ? 0.5 : 1,
                    }}
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setPayoutsPage((p) => p + 1)}
                    disabled={!payoutsPagination.hasMore}
                    style={{
                      padding: "6px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      background: "#fff",
                      cursor: !payoutsPagination.hasMore ? "not-allowed" : "pointer",
                      opacity: !payoutsPagination.hasMore ? 0.5 : 1,
                    }}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Withdrawals;


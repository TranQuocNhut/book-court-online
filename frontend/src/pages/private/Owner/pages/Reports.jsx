import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download, Wallet, ArrowUpRight, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import { facilityApi } from "../../../../api/facilityApi";
import { analyticsApi } from "../../../../api/analyticsApi";
import { withdrawalApi } from "../../../../api/withdrawalApi";
import { userApi } from "../../../../api/userApi";
import { toast } from "react-toastify";

const Reports = () => {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState("revenue");
  const [loading, setLoading] = useState(true);
  const [facilityId, setFacilityId] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [courtData, setCourtData] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split("T")[0], // First day of current month
    endDate: new Date().toISOString().split("T")[0], // Today
  });
  
  // Withdrawal states
  const [balance, setBalance] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    bankAccount: {
      accountNumber: "",
      accountName: "",
      bankCode: "",
      bankName: "",
    },
  });
  
  // Bank list
  const banks = [
    { code: "VCB", name: "Vietcombank" },
    { code: "TCB", name: "Techcombank" },
    { code: "VTB", name: "Vietinbank" },
    { code: "ACB", name: "ACB" },
    { code: "TPB", name: "TPBank" },
    { code: "VPB", name: "VPBank" },
    { code: "MSB", name: "Maritime Bank" },
    { code: "HDB", name: "HDBank" },
    { code: "VIB", name: "VIB" },
    { code: "SHB", name: "SHB" },
    { code: "EIB", name: "Eximbank" },
    { code: "BID", name: "BIDV" },
    { code: "MBB", name: "MBBank" },
    { code: "STB", name: "Sacombank" },
  ];

  // Fetch owner facilities
  useEffect(() => {
    const fetchFacilities = async () => {
      if (!user?._id) return;
      try {
        const ownerId = user._id || user.id;
        const result = await facilityApi.getFacilities({ ownerId, status: "opening" });
        if (result.success) {
          const facilitiesList = result.data?.facilities || result.data || [];
          setFacilities(facilitiesList);
          if (facilitiesList.length > 0) {
            const firstFacilityId = facilitiesList[0]._id || facilitiesList[0].id;
            setFacilityId(firstFacilityId);
          }
        }
      } catch (error) {
        console.error("Error fetching facilities:", error);
        toast.error("Không thể tải danh sách cơ sở");
      }
    };
    fetchFacilities();
  }, [user]);

  // Fetch revenue data
  useEffect(() => {
    const fetchRevenue = async () => {
      if (!facilityId || selectedReport !== "revenue") return;
      try {
        setLoading(true);
        const result = await analyticsApi.getOwnerRevenue(
          facilityId,
          dateRange.startDate,
          dateRange.endDate
        );
        if (result.success) {
          setRevenueData(result.data);
        }
      } catch (error) {
        console.error("Error fetching revenue:", error);
        toast.error(error.message || "Không thể tải dữ liệu doanh thu");
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, [facilityId, dateRange, selectedReport]);

  // Fetch court data
  useEffect(() => {
    const fetchCourts = async () => {
      if (!facilityId || selectedReport !== "revenue") return;
      try {
        const result = await analyticsApi.getOwnerCourts(facilityId);
        if (result.success) {
          setCourtData(result.data);
        }
      } catch (error) {
        console.error("Error fetching courts:", error);
      }
    };
    fetchCourts();
  }, [facilityId, selectedReport]);

  // Fetch withdrawal balance and history
  useEffect(() => {
    const fetchWithdrawalData = async () => {
      if (selectedReport !== "transaction") return;
      try {
        setWithdrawalLoading(true);
        const [balanceResult, historyResult, bankAccountResult] = await Promise.all([
          withdrawalApi.getBalance(),
          withdrawalApi.getHistory({ page: 1, limit: 10 }),
          userApi.getBankAccount().catch(() => ({ success: false, data: { bankAccount: null } })),
        ]);
        
        if (balanceResult.success) {
          setBalance(balanceResult.data);
        }
        if (historyResult.success) {
          setWithdrawals(historyResult.data.withdrawals || []);
        }
        // Auto-fill form if bank account exists
        if (bankAccountResult.success && bankAccountResult.data.bankAccount) {
          setWithdrawForm(prev => ({
            ...prev,
            bankAccount: bankAccountResult.data.bankAccount,
          }));
        }
      } catch (error) {
        console.error("Error fetching withdrawal data:", error);
        toast.error(error.message || "Không thể tải dữ liệu rút tiền");
      } finally {
        setWithdrawalLoading(false);
      }
    };
    fetchWithdrawalData();
  }, [selectedReport]);

  // Transform revenue data for charts
  const dailyRevenueChartData = revenueData?.dailyData
    ? revenueData.dailyData.map((item) => ({
        date: new Date(item._id).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
        revenue: item.total / 1e6, // Convert to millions
        bookings: item.count,
      }))
    : [];

  const courtRevenueChartData = courtData
    ? courtData.map((court) => ({
        court: court.name || `Sân ${court.courtNumber || ""}`,
        revenue: court.totalRevenue || 0,
        bookings: court.totalBookings || 0,
      }))
    : [];

  const renderRevenueReport = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Báo cáo doanh thu</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          />
          <span>đến</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          />
          <button
            onClick={() => toast.info("Tính năng xuất báo cáo đang được phát triển")}
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
            <Download size={16}/> Xuất báo cáo
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "4px solid #e5e7eb",
                borderTop: "4px solid #3b82f6",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 1rem",
              }}
            />
            <p style={{ color: "#6b7280" }}>Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: 20,
                boxShadow: "0 6px 20px rgba(0,0,0,.06)",
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                Tổng doanh thu: {revenueData ? (revenueData.totalRevenue / 1e6).toFixed(1) : "0"}M VNĐ
              </h3>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                Tổng lượt đặt: {revenueData?.totalBookings || 0} lượt
              </h3>
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: 20,
                boxShadow: "0 6px 20px rgba(0,0,0,.06)",
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Doanh thu theo sân</h3>
              {courtRevenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={courtRevenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="court" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? `${(value / 1e6).toFixed(1)}M VNĐ` : `${value} lượt`,
                        name === 'revenue' ? 'Doanh thu' : 'Số lượt đặt'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" name="Doanh thu" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: "#6b7280", textAlign: "center", padding: "40px" }}>Chưa có dữ liệu</p>
              )}
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 6px 20px rgba(0,0,0,.06)",
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Doanh thu hàng ngày</h3>
            {dailyRevenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyRevenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? `${value.toFixed(1)}M VNĐ` : `${value} lượt`,
                      name === 'revenue' ? 'Doanh thu' : 'Số lượt đặt'
                    ]}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" name="Doanh thu (M VNĐ)" />
                  <Line yAxisId="right" type="monotone" dataKey="bookings" stroke="#3b82f6" name="Số lượt đặt" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: "#6b7280", textAlign: "center", padding: "40px" }}>Chưa có dữ liệu trong khoảng thời gian này</p>
            )}
          </div>
        </>
      )}
    </div>
  );

  // Handle withdrawal form submit
  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    if (!withdrawForm.amount || !withdrawForm.bankAccount.accountNumber || 
        !withdrawForm.bankAccount.accountName || !withdrawForm.bankAccount.bankCode) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const amount = parseInt(withdrawForm.amount.replace(/\D/g, ""));
    if (amount < 10000) {
      toast.error("Số tiền rút tối thiểu là 10,000 VNĐ");
      return;
    }

    if (balance && amount > balance.availableBalance) {
      toast.error("Số dư không đủ");
      return;
    }

    try {
      setWithdrawalLoading(true);
      const result = await withdrawalApi.requestWithdrawal({
        amount,
        bankAccount: {
          ...withdrawForm.bankAccount,
          bankName: withdrawForm.bankAccount.bankName || 
                   banks.find(b => b.code === withdrawForm.bankAccount.bankCode)?.name || 
                   withdrawForm.bankAccount.bankCode,
        },
      });

      if (result.success) {
        toast.success("Yêu cầu rút tiền đã được tạo thành công");
        setShowWithdrawForm(false);
        setWithdrawForm({
          amount: "",
          bankAccount: {
            accountNumber: "",
            accountName: "",
            bankCode: "",
            bankName: "",
          },
        });
        // Refresh data
        const [balanceResult, historyResult] = await Promise.all([
          withdrawalApi.getBalance(),
          withdrawalApi.getHistory({ page: 1, limit: 10 }),
        ]);
        if (balanceResult.success) setBalance(balanceResult.data);
        if (historyResult.success) setWithdrawals(historyResult.data.withdrawals || []);
      }
    } catch (error) {
      toast.error(error.message || "Không thể tạo yêu cầu rút tiền");
    } finally {
      setWithdrawalLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount || 0);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { icon: Clock, color: "#f59e0b", bg: "#fef3c7", text: "Đang chờ" },
      processing: { icon: Clock, color: "#3b82f6", bg: "#dbeafe", text: "Đang xử lý" },
      success: { icon: CheckCircle, color: "#10b981", bg: "#d1fae5", text: "Thành công" },
      failed: { icon: XCircle, color: "#ef4444", bg: "#fee2e2", text: "Thất bại" },
      cancelled: { icon: AlertCircle, color: "#6b7280", bg: "#f3f4f6", text: "Đã hủy" },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 12px",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
          color: config.color,
          background: config.bg,
        }}
      >
        <Icon size={14} />
        {config.text}
      </span>
    );
  };

  const renderTransactionReport = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Quản lý rút tiền</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {!showWithdrawForm && (
            <button
              onClick={() => setShowWithdrawForm(true)}
              disabled={!balance || balance.availableBalance < 10000}
              style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: 8, 
                background: balance && balance.availableBalance >= 10000 ? "#10b981" : "#9ca3af", 
                color: "#fff", 
                border: 0, 
                borderRadius: 10, 
                padding: "10px 16px", 
                cursor: balance && balance.availableBalance >= 10000 ? "pointer" : "not-allowed", 
                fontWeight: 600,
                transition: "all 0.2s",
              }}
            >
              <ArrowUpRight size={16} /> Rút tiền
            </button>
          )}
          <button
            onClick={() => toast.info("Tính năng xuất báo cáo đang được phát triển")}
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 8, 
              background: "#fff", 
              color: "#111827", 
              border: "1px solid #e5e7eb", 
              borderRadius: 10, 
              padding: "10px 14px", 
              cursor: "pointer", 
              fontWeight: 600 
            }}
          >
            <Download size={16}/> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: 12, padding: 24, boxShadow: "0 6px 20px rgba(0,0,0,.1)", color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <Wallet size={24} />
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Số dư khả dụng</h3>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
            {withdrawalLoading ? "..." : formatCurrency(balance?.availableBalance || 0)} VNĐ
          </div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>Có thể rút ngay</div>
        </div>
        
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 6px 20px rgba(0,0,0,.06)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#6b7280" }}>Tổng doanh thu</h3>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#3b82f6" }}>
            {withdrawalLoading ? "..." : formatCurrency(balance?.totalRevenue || 0)} VNĐ
          </div>
          <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>Từ tất cả booking</div>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 6px 20px rgba(0,0,0,.06)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#6b7280" }}>Đã rút</h3>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#10b981" }}>
            {withdrawalLoading ? "..." : formatCurrency(balance?.totalWithdrawn || 0)} VNĐ
          </div>
          <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>Tổng số tiền đã rút</div>
        </div>
      </div>

      {/* Withdrawal Form */}
      {showWithdrawForm && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 6px 20px rgba(0,0,0,.06)", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Yêu cầu rút tiền</h3>
            <button
              onClick={() => {
                setShowWithdrawForm(false);
                setWithdrawForm({
                  amount: "",
                  bankAccount: {
                    accountNumber: "",
                    accountName: "",
                    bankCode: "",
                    bankName: "",
                  },
                });
              }}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 24,
                cursor: "pointer",
                color: "#6b7280",
                padding: 0,
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleWithdraw}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#374151" }}>
                Số tiền rút (VNĐ) <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                value={withdrawForm.amount}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setWithdrawForm({ ...withdrawForm, amount: value });
                }}
                placeholder="Nhập số tiền (tối thiểu 10,000 VNĐ)"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 16,
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#10b981")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
              {withdrawForm.amount && (
                <div style={{ marginTop: 8, fontSize: 14, color: "#6b7280" }}>
                  {formatCurrency(parseInt(withdrawForm.amount.replace(/\D/g, "") || 0))} VNĐ
                </div>
              )}
              {balance && (
                <div style={{ marginTop: 8, fontSize: 14, color: "#6b7280" }}>
                  Số dư khả dụng: <strong>{formatCurrency(balance.availableBalance)} VNĐ</strong>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#374151" }}>
                  Ngân hàng <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={withdrawForm.bankAccount.bankCode}
                  onChange={(e) => {
                    const selectedBank = banks.find(b => b.code === e.target.value);
                    setWithdrawForm({
                      ...withdrawForm,
                      bankAccount: {
                        ...withdrawForm.bankAccount,
                        bankCode: e.target.value,
                        bankName: selectedBank?.name || "",
                      },
                    });
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    fontSize: 16,
                    outline: "none",
                    background: "#fff",
                  }}
                  required
                >
                  <option value="">Chọn ngân hàng</option>
                  {banks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#374151" }}>
                  Số tài khoản <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={withdrawForm.bankAccount.accountNumber}
                  onChange={(e) =>
                    setWithdrawForm({
                      ...withdrawForm,
                      bankAccount: { ...withdrawForm.bankAccount, accountNumber: e.target.value },
                    })
                  }
                  placeholder="Nhập số tài khoản"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    fontSize: 16,
                    outline: "none",
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#374151" }}>
                Tên chủ tài khoản <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                value={withdrawForm.bankAccount.accountName}
                onChange={(e) =>
                  setWithdrawForm({
                    ...withdrawForm,
                    bankAccount: { ...withdrawForm.bankAccount, accountName: e.target.value },
                  })
                }
                placeholder="Nhập tên chủ tài khoản (viết hoa, không dấu)"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 16,
                  outline: "none",
                }}
                required
              />
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setShowWithdrawForm(false);
                  setWithdrawForm({
                    amount: "",
                    bankAccount: {
                      accountNumber: "",
                      accountName: "",
                      bankCode: "",
                      bankName: "",
                    },
                  });
                }}
                style={{
                  padding: "12px 24px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  color: "#374151",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={withdrawalLoading}
                style={{
                  padding: "12px 24px",
                  borderRadius: 8,
                  border: "none",
                  background: withdrawalLoading ? "#9ca3af" : "#10b981",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: withdrawalLoading ? "not-allowed" : "pointer",
                }}
              >
                {withdrawalLoading ? "Đang xử lý..." : "Xác nhận rút tiền"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Withdrawal History */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 6px 20px rgba(0,0,0,.06)" }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Lịch sử rút tiền</h3>
        {withdrawalLoading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "4px solid #e5e7eb",
                borderTop: "4px solid #3b82f6",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto",
              }}
            />
          </div>
        ) : withdrawals.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
            Chưa có lịch sử rút tiền
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, color: "#374151" }}>Ngày</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, color: "#374151" }}>Số tiền</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#374151" }}>Ngân hàng</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, color: "#374151" }}>Số tài khoản</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, color: "#374151" }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal._id || withdrawal.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px", color: "#6b7280" }}>
                      {new Date(withdrawal.createdAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td style={{ padding: "12px", fontWeight: 600, color: "#111827" }}>
                      {formatCurrency(withdrawal.amount)} VNĐ
                    </td>
                    <td style={{ padding: "12px", color: "#6b7280" }}>
                      {withdrawal.bankAccount?.bankName || withdrawal.bankAccount?.bankCode || "-"}
                    </td>
                    <td style={{ padding: "12px", color: "#6b7280", fontFamily: "monospace" }}>
                      {withdrawal.bankAccount?.accountNumber || "-"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {getStatusBadge(withdrawal.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  if (!facilityId) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <p style={{ color: "#6b7280" }}>Bạn chưa có cơ sở nào. Vui lòng tạo cơ sở trước.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Doanh thu & Thanh toán</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {facilities.length > 1 && (
            <select
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 14,
              }}
            >
              {facilities.map((facility) => (
                <option key={facility._id || facility.id} value={facility._id || facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setSelectedReport("revenue")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: selectedReport === "revenue" ? "#10b981" : "#fff",
              color: selectedReport === "revenue" ? "#fff" : "#111827",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Doanh thu
          </button>
          <button
            onClick={() => setSelectedReport("transaction")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: selectedReport === "transaction" ? "#10b981" : "#fff",
              color: selectedReport === "transaction" ? "#fff" : "#111827",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Giao dịch
          </button>
        </div>
      </div>

      {selectedReport === "revenue" && renderRevenueReport()}
      {selectedReport === "transaction" && renderTransactionReport()}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Reports;


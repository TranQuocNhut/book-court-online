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
import { Download } from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import { facilityApi } from "../../../../api/facilityApi";
import { analyticsApi } from "../../../../api/analyticsApi";
import { toast } from "react-toastify";
import { occupancyData, peakHoursData, loyalCustomersData, cancellationData } from "../data/mockData";

const Analytics = () => {
  const { user } = useAuth();
  const [selectedAnalytics, setSelectedAnalytics] = useState("occupancy");
  const [facilityId, setFacilityId] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [courtStats, setCourtStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [peakHoursData, setPeakHoursData] = useState(null);
  const [loyalCustomersData, setLoyalCustomersData] = useState(null);
  const [cancellationData, setCancellationData] = useState(null);
  const [loadingPeakHours, setLoadingPeakHours] = useState(false);
  const [loadingLoyalCustomers, setLoadingLoyalCustomers] = useState(false);
  const [loadingCancellation, setLoadingCancellation] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split("T")[0], // First day of current month
    endDate: new Date().toISOString().split("T")[0], // Today
  });

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

  // Fetch court statistics
  useEffect(() => {
    const fetchCourtStats = async () => {
      if (!facilityId || selectedAnalytics !== "occupancy") return;
      try {
        setLoading(true);
        const result = await analyticsApi.getOwnerCourts(
          facilityId,
          dateRange.startDate,
          dateRange.endDate
        );
        if (result.success) {
          setCourtStats(result.data);
        }
      } catch (error) {
        console.error("Error fetching court stats:", error);
        toast.error(error.message || "Không thể tải dữ liệu tỷ lệ lấp đầy");
      } finally {
        setLoading(false);
      }
    };
    fetchCourtStats();
  }, [facilityId, dateRange, selectedAnalytics]);

  // Fetch peak hours data
  useEffect(() => {
    const fetchPeakHours = async () => {
      if (!facilityId || selectedAnalytics !== "peak") return;
      try {
        setLoadingPeakHours(true);
        const result = await analyticsApi.getOwnerPeakHours(
          facilityId,
          dateRange.startDate,
          dateRange.endDate
        );
        if (result.success) {
          setPeakHoursData(result.data.peakHours || []);
        }
      } catch (error) {
        console.error("Error fetching peak hours:", error);
        toast.error(error.message || "Không thể tải dữ liệu giờ cao điểm");
      } finally {
        setLoadingPeakHours(false);
      }
    };
    fetchPeakHours();
  }, [facilityId, dateRange, selectedAnalytics]);

  // Fetch loyal customers data
  useEffect(() => {
    const fetchLoyalCustomers = async () => {
      if (!facilityId || selectedAnalytics !== "loyal") return;
      try {
        setLoadingLoyalCustomers(true);
        const result = await analyticsApi.getOwnerLoyalCustomers(facilityId);
        if (result.success) {
          setLoyalCustomersData(result.data || []);
        }
      } catch (error) {
        console.error("Error fetching loyal customers:", error);
        toast.error(error.message || "Không thể tải dữ liệu khách hàng trung thành");
      } finally {
        setLoadingLoyalCustomers(false);
      }
    };
    fetchLoyalCustomers();
  }, [facilityId, selectedAnalytics]);

  // Fetch cancellation data
  useEffect(() => {
    const fetchCancellation = async () => {
      if (!facilityId || selectedAnalytics !== "cancellation") return;
      try {
        setLoadingCancellation(true);
        const result = await analyticsApi.getOwnerCancellations(
          facilityId,
          dateRange.startDate,
          dateRange.endDate
        );
        if (result.success) {
          setCancellationData(result.data.cancellations || []);
        }
      } catch (error) {
        console.error("Error fetching cancellation:", error);
        toast.error(error.message || "Không thể tải dữ liệu tỷ lệ hủy");
      } finally {
        setLoadingCancellation(false);
      }
    };
    fetchCancellation();
  }, [facilityId, dateRange, selectedAnalytics]);

  // Transform court stats for occupancy chart
  const occupancyChartData = courtStats
    ? courtStats.map((court) => {
        const occupancyRate = court.occupancyRate || 0;
        return {
          court: court.name || `Sân ${court.courtNumber || ""}`,
          totalSlots: court.availableSlots || 0,
          bookedSlots: court.totalTimeSlots || 0,
          occupancyRate: parseFloat(occupancyRate),
          performance: parseFloat(occupancyRate) > 70 ? "Tốt" : parseFloat(occupancyRate) > 50 ? "Trung bình" : "Thấp",
        };
      })
    : occupancyData;

  const renderOccupancyAnalytics = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Phân tích tỷ lệ lấp đầy</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
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
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 6px 20px rgba(0,0,0,.06)",
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Tỷ lệ lấp đầy theo sân</h3>
          {occupancyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={occupancyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="court" angle={-45} textAnchor="end" height={80} />
                <YAxis 
                  tickFormatter={(value) => `${value}%`}
                  label={{ value: 'Tỷ lệ (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'occupancyRate' ? `${value}%` : `${value} slot`,
                    name === 'occupancyRate' ? 'Tỷ lệ lấp đầy' : name === 'bookedSlots' ? 'Slots đã đặt' : 'Tổng slots'
                  ]}
                />
                <Legend />
                <Bar dataKey="occupancyRate" fill="#10b981" name="Tỷ lệ lấp đầy (%)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: "#6b7280", textAlign: "center", padding: "40px" }}>Chưa có dữ liệu</p>
          )}
        </div>
      )}
    </div>
  );

  const renderPeakHoursAnalytics = () => {
    // Transform data for chart (group by hour ranges)
    const chartData = peakHoursData
      ? peakHoursData.map((item) => ({
          hour: item.hour,
          bookings: item.bookings,
          revenue: item.revenue / 1e6, // Convert to millions
          type: item.type,
        }))
      : [];

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Phân tích giờ cao điểm</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
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

        {loadingPeakHours ? (
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
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 6px 20px rgba(0,0,0,.06)",
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Doanh thu theo giờ</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? `${value.toFixed(1)}M VNĐ` : `${value} lượt`,
                      name === 'revenue' ? 'Doanh thu' : 'Số lượt đặt'
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#10b981" name="Doanh thu (M VNĐ)" />
                  <Bar yAxisId="right" dataKey="bookings" fill="#3b82f6" name="Số lượt đặt" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: "#6b7280", textAlign: "center", padding: "40px" }}>Chưa có dữ liệu</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderLoyalCustomersAnalytics = () => {
    const customers = loyalCustomersData || [];

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Phân tích khách hàng trung thành</h2>
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

        {loadingLoyalCustomers ? (
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
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 6px 20px rgba(0,0,0,.06)",
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Top khách hàng trung thành</h3>
            {customers.length > 0 ? (
              <div style={{ display: "grid", gap: 12 }}>
                {customers.map((customer, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 16,
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      background: index < 3 ? "#f0f9ff" : "#fff",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                        {customer.customer}
                      </div>
                      <div style={{ fontSize: 14, color: "#6b7280" }}>
                        {customer.totalBookings} lượt đặt • {(customer.totalSpent / 1e6).toFixed(1)}M VNĐ
                      </div>
                      {customer.lastBooking && (
                        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                          Lần cuối: {new Date(customer.lastBooking).toLocaleDateString("vi-VN")}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        color: customer.tier === "VIP" ? "#f59e0b" : 
                              customer.tier === "Gold" ? "#10b981" : "#6b7280"
                      }}>
                        {customer.tier}
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        {customer.loyaltyScore} điểm
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#6b7280", textAlign: "center", padding: "40px" }}>Chưa có dữ liệu</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCancellationAnalytics = () => {
    const cancellations = cancellationData || [];

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Phân tích tỷ lệ hủy</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
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

        {loadingCancellation ? (
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
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 6px 20px rgba(0,0,0,.06)",
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Tỷ lệ hủy theo sân</h3>
            {cancellations.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cancellations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="court" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'cancellationRate' || name === 'noShowRate' ? `${value}%` : `${value} lượt`,
                      name === 'cancellationRate' ? 'Tỷ lệ hủy' : name === 'noShowRate' ? 'Tỷ lệ không đến' : 'Số lượt'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="cancellationRate" fill="#ef4444" name="Tỷ lệ hủy (%)" />
                  <Bar dataKey="noShowRate" fill="#f59e0b" name="Tỷ lệ không đến (%)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: "#6b7280", textAlign: "center", padding: "40px" }}>Chưa có dữ liệu</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Báo cáo & Thống kê</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setSelectedAnalytics("occupancy")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: selectedAnalytics === "occupancy" ? "#10b981" : "#fff",
              color: selectedAnalytics === "occupancy" ? "#fff" : "#111827",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Tỷ lệ lấp đầy
          </button>
          <button
            onClick={() => setSelectedAnalytics("peak")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: selectedAnalytics === "peak" ? "#10b981" : "#fff",
              color: selectedAnalytics === "peak" ? "#fff" : "#111827",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Giờ cao điểm
          </button>
          <button
            onClick={() => setSelectedAnalytics("loyal")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: selectedAnalytics === "loyal" ? "#10b981" : "#fff",
              color: selectedAnalytics === "loyal" ? "#fff" : "#111827",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Khách hàng trung thành
          </button>
          <button
            onClick={() => setSelectedAnalytics("cancellation")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: selectedAnalytics === "cancellation" ? "#10b981" : "#fff",
              color: selectedAnalytics === "cancellation" ? "#fff" : "#111827",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Tỷ lệ hủy
          </button>
        </div>
      </div>

      {selectedAnalytics === "occupancy" && renderOccupancyAnalytics()}
      {selectedAnalytics === "peak" && renderPeakHoursAnalytics()}
      {selectedAnalytics === "loyal" && renderLoyalCustomersAnalytics()}
      {selectedAnalytics === "cancellation" && renderCancellationAnalytics()}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Analytics;

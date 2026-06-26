import React, { useState, useMemo, useEffect } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { bookingApi } from "../../../../api/bookingApi";
import { toast } from "react-toastify";
import BookingDetailModal from "../modals/BookingDetailModal";
import BookingFilters from "../components/Bookings/BookingFilters";
import BookingTable from "../components/Bookings/BookingTable";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Bộ lọc
  const [statusFilter, setStatusFilter] = useState("all");
  const [facilityFilter, setFacilityFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  // Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Fetch bookings từ API
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const params = {
          page,
          limit: pageSize,
        };

        if (statusFilter !== "all") {
          params.status = statusFilter;
        }

        if (dateFilter) {
          params.date = dateFilter;
        }

        if (searchQuery) {
          params.search = searchQuery;
        }

        const result = await bookingApi.getAllBookings(params);
        if (result.success) {
          // Transform data từ API sang format của component
          const transformedBookings = result.data.bookings.map((booking) => {
            const firstSlot = booking.timeSlots?.[0] || "";
            const [startTime] = firstSlot.split("-");
            const lastSlot = booking.timeSlots?.[booking.timeSlots.length - 1] || "";
            const [, endTime] = lastSlot.split("-");

            return {
              id: booking.bookingCode || booking._id,
              _id: booking._id,
              customer: booking.user?.name || booking.contactInfo?.name || "Khách vãng lai",
              phone: booking.user?.phone || booking.contactInfo?.phone || "",
              email: booking.user?.email || booking.contactInfo?.email || "",
              facility: booking.facility?.name || "",
              facilityId: booking.facility?._id || booking.facility,
              court: booking.court?.name || "",
              date: new Date(booking.date).toISOString().split("T")[0],
              startTime: startTime || "",
              endTime: endTime || "",
              time: booking.timeSlots?.join(", ") || "",
              timeSlots: booking.timeSlots || [],
              price: booking.totalAmount || 0,
              status: booking.status || "pending",
              pay: booking.paymentStatus || "pending",
              paymentMethod: booking.paymentMethod === "momo" ? "Momo" : 
                            booking.paymentMethod === "vnpay" ? "VNPay" : 
                            booking.paymentMethod === "cash" ? "Tiền mặt" : booking.paymentMethod || "",
              bookingDate: new Date(booking.createdAt).toISOString().split("T")[0],
              bookingTime: new Date(booking.createdAt).toTimeString().split(" ")[0].substring(0, 5),
              notes: booking.notes || booking.ownerNotes || "",
              cancellationReason: booking.cancellationReason || null,
              cancelledAt: booking.cancelledAt || null,
              user: booking.user,
              courtData: booking.court,
              facilityData: booking.facility,
            };
          });

          setBookings(transformedBookings);
          setTotalItems(result.data.pagination?.total || 0);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast.error(error.message || "Không thể tải danh sách đặt sân");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [page, pageSize, statusFilter, dateFilter, searchQuery]);

  // Lấy danh sách duy nhất (cần fetch riêng hoặc từ API)
  const uniqueFacilities = useMemo(() => {
    return [...new Set(bookings.map((b) => b.facility).filter(Boolean))].sort();
  }, [bookings]);

  const uniqueCustomers = useMemo(() => {
    return [...new Set(bookings.map((b) => b.customer).filter(Boolean))].sort();
  }, [bookings]);

  // Payment method map (statusMap không còn cần vì đã dùng StatusBadge từ shared)

  const paymentMethodMap = {
    Momo: { label: "Momo", color: "#ea4c89", bg: "#fce7f3" },
    VNPay: { label: "VNPay", color: "#0052d9", bg: "#e6f0ff" },
    "Tiền mặt": { label: "Tiền mặt", color: "#059669", bg: "#e6f9f0" },
  };

  // Lọc dữ liệu (client-side filtering cho facility và customer vì API chưa hỗ trợ)
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesFacility =
        facilityFilter === "all" || booking.facility === facilityFilter;

      const matchesCustomer =
        customerFilter === "all" || booking.customer === customerFilter;

      return matchesFacility && matchesCustomer;
    });
  }, [bookings, facilityFilter, customerFilter]);

  // Handlers
  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedBooking(null);
  };

  // Hàm xuất Excel/CSV
  const exportToCSV = () => {
    const headers = [
      "Mã đơn đặt sân",
      "Tên sân",
      "Người đặt",
      "Thời gian bắt đầu",
      "Thời gian kết thúc",
      "Trạng thái",
      "Phương thức thanh toán",
      "Tổng tiền (VNĐ)",
    ];

    const rows = filteredBookings.map((booking) => [
      booking.id,
      booking.facility,
      booking.customer,
      `${booking.date} ${booking.startTime || ""}`,
      `${booking.date} ${booking.endTime || ""}`,
      booking.status === "confirmed" ? "Đã xác nhận" :
      booking.status === "pending" ? "Chờ xác nhận" :
      booking.status === "completed" ? "Đã hoàn thành" :
      booking.status === "cancelled" ? "Đã hủy" : booking.status,
      booking.paymentMethod || "N/A",
      booking.price.toLocaleString("vi-VN"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `danh-sach-dat-san-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    exportToCSV();
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setFacilityFilter("all");
    setCustomerFilter("all");
    setDateFilter("");
    setSearchQuery("");
    setPage(1);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price);
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
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Quản lý đặt sân</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={exportToCSV}
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
              fontSize: 14,
            }}
          >
            <Download size={16} /> Xuất CSV
          </button>
          <button
            onClick={exportToExcel}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#059669",
              color: "#fff",
              border: 0,
              borderRadius: 10,
              padding: "10px 14px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            <FileSpreadsheet size={16} /> Xuất Excel
          </button>
        </div>
      </div>

      <BookingFilters
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        facilityFilter={facilityFilter}
        customerFilter={customerFilter}
        dateFilter={dateFilter}
        uniqueFacilities={uniqueFacilities}
        uniqueCustomers={uniqueCustomers}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        onStatusChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        onFacilityChange={(value) => {
          setFacilityFilter(value);
          setPage(1);
        }}
        onCustomerChange={(value) => {
          setCustomerFilter(value);
          setPage(1);
        }}
        onDateChange={(value) => {
          setDateFilter(value);
          setPage(1);
        }}
        onReset={resetFilters}
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
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
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        <BookingTable
          bookings={filteredBookings}
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          paymentMethodMap={paymentMethodMap}
          formatPrice={formatPrice}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          onView={handleViewDetails}
        />
      )}

      <BookingDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        booking={selectedBooking}
      />
    </div>
  );
};

export default Bookings;


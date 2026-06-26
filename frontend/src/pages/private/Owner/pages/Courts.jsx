import React, { useState, useEffect, useMemo } from "react";
// DÒNG ĐÃ SỬA
import { Plus, List, LayoutGrid } from "lucide-react";
import { courtApi } from "../../../../api/courtApi";
import { facilityApi } from "../../../../api/facilityApi";
import { useAuth } from "../../../../contexts/AuthContext";
import AddCourtModal from "../modals/AddCourtModal";
import DetailCourtModal from "../modals/DetailCourtModal";
import ActivateCourtModal from "../modals/ActivateCourtModal";
import EditCourtModal from "../modals/EditCourtModal";
import DeleteCourtModal from "../modals/DeleteCourtModal";
import SetMaintenanceModal from "../modals/SetMaintenanceModal";
import ScheduleMaintenanceModal from "../modals/ScheduleMaintenanceModal";
import CourtStats from "../components/Courts/CourtStats";
import CourtFilters from "../components/Courts/CourtFilters";
import CourtTable from "../components/Courts/CourtTable";
import CourtDiagram from "../components/Courts/CourtDiagram";
import CourtServiceModal from "../modals/CourtServiceModal";

const Courts = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // local courts state
  const [courts, setCourts] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityFilter, setSelectedFacilityFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // ---  State cho bộ lọc Thể loại ---
  const [selectedSportFilter, setSelectedSportFilter] = useState("all");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // added state for detail modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSetMaintenanceOpen, setIsSetMaintenanceOpen] = useState(false);
  const [isScheduleMaintenanceOpen, setIsScheduleMaintenanceOpen] =
    useState(false);

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  const [viewMode, setViewMode] = useState("list");

  // Fetch facilities and courts
  useEffect(() => {
    if (user) {
      fetchFacilities();
      fetchCourts();
    }
  }, [user]);

  const fetchFacilities = async () => {
    try {
      if (!user) return;
      const ownerId = user._id || user.id;
      const result = await facilityApi.getFacilities({ ownerId });
      if (result.success && result.data?.facilities) {
        setFacilities(result.data.facilities);
      }
    } catch (err) {
      console.error("Error fetching facilities:", err);
    }
  };

  const fetchCourts = async () => {
    setLoading(true);
    setError("");
    try {
      if (!user) return;
      const ownerId = user._id || user.id;

      // Get facilities of owner first
      const facilitiesResult = await facilityApi.getFacilities({
        ownerId,
        limit: 100,
      });
      if (
        !facilitiesResult.success ||
        !facilitiesResult.data?.facilities?.length
      ) {
        setCourts([]);
        setLoading(false);
        return;
      }

      const facilities = facilitiesResult.data.facilities;
      const facilityIds = facilities.map((f) => f._id || f.id);

      // Fetch courts for all facilities - try to fetch all at once if possible
      const allCourts = [];
      for (const facilityId of facilityIds) {
        try {
          const result = await courtApi.getCourts({
            facility: facilityId,
            limit: 100,
          });
          if (result.success && result.data?.courts) {
            allCourts.push(...result.data.courts);
          }
        } catch (err) {
          console.error(
            `Error fetching courts for facility ${facilityId}:`,
            err
          );
        }
      }

      setCourts(allCourts);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách sân");
      console.error("Error fetching courts:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Tự động lấy danh sách Thể loại (Sport Types) ---
  const sportTypes = useMemo(() => {
    if (!courts) return [];
    const allTypes = courts.map(c => c.type).filter(Boolean);
    return [...new Set(allTypes)];
  }, [courts]);

  // --- CẬP NHẬT 3: Cập nhật logic lọc của 'filteredCourts' ---
  const filteredCourts = useMemo(
    () =>
      courts.filter((c) => {
        const matchesSearch =
          !searchQuery ||
          [c.name, c.type, c.description, c.status]
            .join(" ")
            .toLowerCase()
            .includes(searchQuery.toLowerCase());

        const matchesFacility =
          selectedFacilityFilter === "all" ||
          c.facility?._id === selectedFacilityFilter ||
          c.facility === selectedFacilityFilter;

        const matchesStatus =
          selectedStatusFilter === "all" || c.status === selectedStatusFilter;

        // --- Dòng logic mới cho Thể loại ---
        const matchesSport =
          selectedSportFilter === "all" || c.type === selectedSportFilter;

        // --- Thêm 'matchesSport' vào điều kiện return ---
        return matchesSearch && matchesFacility && matchesStatus && matchesSport;
      }),
    // --- Thêm 'selectedSportFilter' vào danh sách dependencies ---
    [searchQuery, courts, selectedFacilityFilter, selectedStatusFilter, selectedSportFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredCourts.length / pageSize));
  const courtSlice = filteredCourts.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleSaveCourt = async (updatedCourt) => {
    // Refresh list sau khi Add hoặc Edit thành công
    // AddCourtModal và EditCourtModal đã tự gọi API rồi
    try {
      await fetchCourts();
      setIsModalOpen(false);
      setSelectedCourt(null);
    } catch (err) {
      console.error("Error refreshing courts:", err);
    }
  };

  // --- THAY ĐỔI: LOGIC LƯU DỊCH VỤ ---
  const handleSaveService = async (courtToUpdate, cart) => {
    // 1. Tính toán tổng tiền từ giỏ hàng
    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    // 2. Tạo đối tượng chi tiết booking mới
    // (LƯU Ý: Modal của bạn chưa có chọn giờ, nên tôi tạm hard-code '90 min')
    const newBookingDetails = {
      time: "90 min", // Dữ liệu giả, vì modal chưa có
      total: total,   // Dữ liệu thật từ giỏ hàng
    };

    // 3. Cập nhật danh sách 'courts' trong state
    // Điều này sẽ tự động kích hoạt re-render
    setCourts(currentCourts => 
      currentCourts.map(c => 
        // Tìm đúng sân đã chọn
        c._id === courtToUpdate._id 
          // Cập nhật sân đó
          ? { ...c, status: 'booked', bookingDetails: newBookingDetails } 
          // Giữ nguyên các sân khác
          : c 
      )
    );

    // 4. Đóng modal
    // (Chúng ta không cần alert hay console.log nữa)
    setIsServiceModalOpen(false);
    setSelectedCourt(null);

    // TRONG TƯƠNG LAI: Bạn sẽ gọi API để lưu vào database ở đây
    // try {
    //   await bookingApi.createBooking({ ... });
    // } catch(err) { ... }
  };
  // --- KẾT THÚC HÀM MỚI ---


  // Handlers for actions
  const handlers = {
    onView: (court) => {
      setSelectedCourt(court);
      setIsDetailOpen(true);
    },
    onEdit: (court) => {
      setSelectedCourt(court);
      setIsModalOpen(true);
    },
    onActivate: (court) => {
      setSelectedCourt(court);
      setIsActivateOpen(true);
    },
    onSetMaintenance: (court) => {
      setSelectedCourt(court);
      setIsSetMaintenanceOpen(true);
    },
    onScheduleMaintenance: (court) => {
      setSelectedCourt(court);
      setIsScheduleMaintenanceOpen(true);
    },
    onDelete: (court) => {
      setSelectedCourt(court);
      setIsDeleteOpen(true);
    },
    onOpenServiceModal: (court) => {
      setSelectedCourt(court);
      setIsServiceModalOpen(true);
    },
  };

  const activeTabStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "#10b981",
    color: "#fff",
    border: "1px solid #10b981",
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
    transition: "all 0.2s",
  };

  const inactiveTabStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "#fff",
    color: "#333",
    border: "1px solid #ddd",
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 500,
    transition: "all 0.2s",
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
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Quản lý sân</h1>
        <button
          onClick={() => {
            setSelectedCourt(null);
            setIsModalOpen(true);
          }}
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
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.background = "#059669")}
          onMouseLeave={(e) => (e.target.style.background = "#10b981")}
        >
          <Plus size={16} /> Thêm sân mới
        </button>
      </div>

      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <button
          onClick={() => setViewMode("list")}
          style={viewMode === "list" ? activeTabStyle : inactiveTabStyle}
        >
          <List size={16} /> Xem danh sách
        </button>
        <button
          onClick={() => setViewMode("diagram")}
          style={viewMode === "diagram" ? activeTabStyle : inactiveTabStyle}
        >
          <LayoutGrid size={16} /> Xem sơ đồ
        </button>
      </div>

      {/* Summary Cards */}
      <CourtStats courts={filteredCourts} />

      {/* Filters */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
          marginBottom: 16,
        }}
      >
        {/* --- CẬP NHẬT 4: Truyền props mới cho CourtFilters --- */}
        <CourtFilters
          searchQuery={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          facilities={facilities}
          selectedFacilityFilter={selectedFacilityFilter}
          onFacilityFilterChange={(value) => {
            setSelectedFacilityFilter(value);
            setPage(1);
          }}
          selectedStatusFilter={selectedStatusFilter}
          onStatusFilterChange={(value) => {
            setSelectedStatusFilter(value);
            setPage(1);
          }}

          // --- Props mới cho bộ lọc Thể loại ---
          sportTypes={sportTypes}
          selectedSportFilter={selectedSportFilter}
          onSportFilterChange={(value) => {
            setSelectedSportFilter(value);
            setPage(1); // Reset trang khi lọc
          }}
          // ---
          
          totalCount={filteredCourts.length}
        />
      </div>

      {/* Table */}
      {viewMode === "list" && (
        <CourtTable
          courts={courtSlice} // Danh sách dùng 'courtSlice' để phân trang
          loading={loading}
          error={error}
          page={page}
          pageSize={pageSize}
          total={filteredCourts.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          handlers={handlers}
        />
      )}

      {viewMode === "diagram" && (
        <CourtDiagram
          courts={filteredCourts} // Sơ đồ dùng 'filteredCourts' để hiển thị TẤT CẢ sân đã lọc
          loading={loading}
          error={error}
          handlers={handlers}
          facilities={facilities} // Truyền facilities để có thể nhóm sân theo cụm
          selectedFacility={selectedFacilityFilter} // Truyền bộ lọc để biết đang xem cụm nào
        />
      )}

      {/* ... (Các modal khác giữ nguyên) ... */}
      
      <AddCourtModal
        isOpen={isModalOpen && !selectedCourt}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCourt(null);
        }}
        onSave={handleSaveCourt}
      />

      <EditCourtModal
        isOpen={isModalOpen && !!selectedCourt}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCourt(null);
        }}
        initialData={selectedCourt}
        onSave={handleSaveCourt}
      />

      <ActivateCourtModal
        isOpen={isActivateOpen}
        onClose={() => {
          setIsActivateOpen(false);
          setSelectedCourt(null);
        }}
        court={selectedCourt}
        onConfirm={async (c) => {
          try {
            const courtId = c._id || c.id;
            await courtApi.updateStatus(courtId, "active");
            await fetchCourts();
          } catch (err) {
            alert(err.message || "Không thể kích hoạt sân");
          }
        }}
      />

      <DeleteCourtModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedCourt(null);
        }}
        court={selectedCourt}
        onConfirm={async (c) => {
          try {
            const courtId = c._id || c.id;
            await courtApi.deleteCourt(courtId);
            await fetchCourts();
          } catch (err) {
            alert(err.message || "Không thể xóa sân");
          }
        }}
      />

      <DetailCourtModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedCourt(null);
        }}
        court={selectedCourt || {}}
      />

      <SetMaintenanceModal
        isOpen={isSetMaintenanceOpen}
        onClose={() => {
          setIsSetMaintenanceOpen(false);
          setSelectedCourt(null);
        }}
        court={selectedCourt}
        onConfirm={async (c) => {
          try {
            const courtId = c._id || c.id;
            await courtApi.updateStatus(courtId, "maintenance");
            if (c.maintenance) {
              await courtApi.updateCourt(courtId, {
                maintenance: c.maintenance,
              });
            }
            await fetchCourts();
          } catch (err) {
            alert(err.message || "Không thể đặt bảo trì");
          }
        }}
      />

      <ScheduleMaintenanceModal
        isOpen={isScheduleMaintenanceOpen}
        onClose={() => {
          setIsScheduleMaintenanceOpen(false);
          setSelectedCourt(null);
        }}
        court={selectedCourt}
        onConfirm={async (c) => {
          try {
            const courtId = c._id || c.id;
            const updateData = {};
            if (c.maintenance) updateData.maintenance = c.maintenance;
            if (c.status) updateData.status = c.status;
            await courtApi.updateCourt(courtId, updateData);
            await fetchCourts();
          } catch (err) {
            alert(err.message || "Không thể lên lịch bảo trì");
          }
        }}
      />

      {/* 'onSave' đã được kích hoạt và truyền vào hàm mới */}
      <CourtServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => {
          setIsServiceModalOpen(false);
          setSelectedCourt(null);
        }}
        court={selectedCourt}
        onSave={handleSaveService} 
      />
    </div>
  );
};

export default Courts;
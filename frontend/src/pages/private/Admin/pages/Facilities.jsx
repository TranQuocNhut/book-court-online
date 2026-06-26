import React, { useState, useMemo, useEffect } from "react";
import { getProvinces, getDistrictsByProvince } from "../../../../api/provinceApi";
import { userApi } from "../../../../api/userApi";
import { facilityApi } from "../../../../api/facilityApi";
import { toast } from "react-toastify";
import ApproveFacilityModal from "../modals/ApproveFacilityModal";
import RejectFacilityModal from "../modals/RejectFacilityModal";
import UserDetailModal from "../components/Users/UserDetailModal";
import FacilityFilters from "../components/Facilities/FacilityFilters";
import FacilityTable from "../components/Facilities/FacilityTable";
import FacilityDetailModal from "../components/Facilities/FacilityDetailModal";

const Facilities = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalFacilities, setTotalFacilities] = useState(0);

  // Filters
  const [cityFilter, setCityFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sportFilter, setSportFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");


  // Provinces và districts từ API
  const [provinces, setProvinces] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);

  // Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [loadingOwner, setLoadingOwner] = useState(false);

  // Status map - map với status từ API
  const statusMap = {
    opening: { label: "Đang hoạt động", color: "#059669", bg: "#e6f9f0" },
    closed: { label: "Đã đóng", color: "#dc2626", bg: "#fee2e2" },
    maintenance: { label: "Bảo trì", color: "#d97706", bg: "#fef3c7" },
    pending: { label: "Chờ duyệt", color: "#dc2626", bg: "#fee2e2" },
    // Legacy support
    active: { label: "Đang hoạt động", color: "#059669", bg: "#e6f9f0" },
    paused: { label: "Tạm dừng", color: "#d97706", bg: "#fef3c7" },
    hidden: { label: "Đã ẩn", color: "#6b7280", bg: "#f3f4f6" },
  };

  // Fetch provinces từ API
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const result = await getProvinces();
        
        if (result.success && result.data && result.data.length > 0) {
          setProvinces(result.data);
        } else {
          console.warn('No provinces data received');
          setProvinces([]);
          if (result.error) {
            toast.error(result.error);
          }
        }
      } catch (error) {
        console.error('Error fetching provinces:', error);
        setProvinces([]);
        toast.error('Không thể tải danh sách tỉnh thành. Vui lòng thử lại sau.');
      } finally {
        setLoadingProvinces(false);
      }
    };
    
    fetchProvinces();
  }, []);

  // Fetch facilities từ API
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true);
        const params = {
          page,
          limit: pageSize,
        };

        if (searchQuery) {
          params.search = searchQuery;
        }

        if (statusFilter !== "all") {
          params.status = statusFilter;
        }

        if (cityFilter !== "all") {
          params.city = cityFilter;
        }

        if (districtFilter !== "all") {
          params.district = districtFilter;
        }

        if (sportFilter !== "all") {
          params.sport = sportFilter;
        }

        if (dateFilter) {
          params.date = dateFilter;
        }

        const result = await facilityApi.getAllFacilities(params);
        
        if (result.success && result.data) {
          // Transform data từ API để match với format hiện tại
          const transformedFacilities = result.data.facilities.map((f) => ({
            id: f._id,
            _id: f._id,
            name: f.name,
            address: f.address,
            owner: f.owner?.name || "N/A", // String name để hiển thị
            ownerId: f.owner?._id || f.owner,
            ownerObject: f.owner, // Giữ nguyên owner object để dùng cho modal
            phone: f.phoneNumber,
            email: f.owner?.email || "N/A",
            courts: 0, // TODO: Có thể tính từ courts array nếu có
            sports: f.types || [],
            pricePerHour: f.pricePerHour || 0,
            status: f.status || "opening",
            createdAt: f.createdAt ? new Date(f.createdAt).toLocaleDateString("vi-VN") : "N/A",
            joinDate: f.createdAt ? new Date(f.createdAt).toLocaleDateString("vi-VN") : "N/A",
            totalBookings: 0, // TODO: Có thể tính từ bookings nếu cần
            revenue: 0, // TODO: Có thể tính từ bookings nếu cần
            approvalStatus: f.status === "opening" ? "approved" : f.status === "closed" ? "rejected" : "pending",
          }));
          
          setFacilities(transformedFacilities);
          setTotalFacilities(result.data.pagination?.total || 0);
        } else {
          toast.error(result.message || "Không thể tải danh sách cơ sở");
          setFacilities([]);
        }
      } catch (error) {
        console.error("Error fetching facilities:", error);
        toast.error(error.message || "Không thể tải danh sách cơ sở");
        setFacilities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, [page, pageSize, searchQuery, statusFilter, cityFilter, districtFilter, sportFilter, dateFilter]);

  // Get unique cities từ provinces API
  const uniqueCities = useMemo(() => {
    if (!provinces || provinces.length === 0) return [];
    return provinces.map(p => p.name).sort();
  }, [provinces]);

  // Districts filtered by selected city (từ API)
  const filteredDistricts = useMemo(() => {
    if (cityFilter === "all" || !provinces || provinces.length === 0) {
      return [];
    }
    // Lấy districts từ province đã chọn
    const districts = getDistrictsByProvince(cityFilter, provinces);
    return districts.map(d => d.name).sort();
  }, [cityFilter, provinces]);

  const uniqueSports = useMemo(() => {
    const sports = new Set();
    facilities.forEach((f) => {
      if (f.sports && Array.isArray(f.sports)) {
        f.sports.forEach((sport) => sports.add(sport));
      } else if (f.types && Array.isArray(f.types)) {
        // Fallback nếu API trả về types thay vì sports
        f.types.forEach((type) => sports.add(type));
      }
    });
    return Array.from(sports).sort();
  }, [facilities]);

  // Vì API đã filter, nên không cần filter lại ở frontend
  // Chỉ cần slice nếu cần (nhưng API đã paginate rồi)
  const filteredFacilities = facilities;
  const totalPages = Math.max(
    1,
    Math.ceil(totalFacilities / pageSize)
  );
  const facilitySlice = filteredFacilities;

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  // Reset filters
  const handleResetFilters = () => {
    setCityFilter("all");
    setDistrictFilter("all");
    setStatusFilter("all");
    setSportFilter("all");
    setDateFilter("");
    setSearchQuery("");
    setPage(1);
  };

  // Reset district khi city thay đổi
  const handleCityChange = (value) => {
    setCityFilter(value);
    setDistrictFilter("all"); // Reset district khi đổi city
    setPage(1);
  };

  // Handlers
  const handleViewDetails = (facility) => {
    setSelectedFacility(facility);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedFacility(null);
  };

  const handleApprove = (facility) => {
    setSelectedFacility(facility);
    setIsApproveModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedFacility) return;

    try {
      const facilityId = selectedFacility._id || selectedFacility.id;
      const result = await facilityApi.approveFacility(facilityId);
      
      if (result.success) {
        toast.success("Duyệt cơ sở thành công");
        // Refresh danh sách
        setPage(1);
        // Cập nhật local state
      setFacilities((current) =>
        current.map((f) =>
            (f._id === facilityId || f.id === facilityId)
            ? {
                ...f,
                  status: "opening",
                approvalStatus: "approved",
              }
            : f
        )
      );
      } else {
        toast.error(result.message || "Không thể duyệt cơ sở");
    }
    } catch (error) {
      console.error("Error approving facility:", error);
      toast.error(error.message || "Không thể duyệt cơ sở");
    } finally {
    setIsApproveModalOpen(false);
    setSelectedFacility(null);
    }
  };

  const handleReject = (facility) => {
    setSelectedFacility(facility);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async (rejectionReason = "") => {
    if (!selectedFacility) return;

    try {
      const facilityId = selectedFacility._id || selectedFacility.id;
      const result = await facilityApi.rejectFacility(facilityId, rejectionReason);
      
      if (result.success) {
        toast.success("Từ chối cơ sở thành công");
        // Refresh danh sách
        setPage(1);
        // Cập nhật local state
      setFacilities((current) =>
          current.map((f) =>
            (f._id === facilityId || f.id === facilityId)
              ? {
                  ...f,
                  status: "closed",
                  approvalStatus: "rejected",
                }
              : f
          )
        );
      } else {
        toast.error(result.message || "Không thể từ chối cơ sở");
      }
    } catch (error) {
      console.error("Error rejecting facility:", error);
      toast.error(error.message || "Không thể từ chối cơ sở");
    } finally {
      setIsRejectModalOpen(false);
      setSelectedFacility(null);
    }
  };

  const handleNavigateToOwner = async (ownerId, facility) => {
    // Lấy owner ID từ facility (có thể là ownerId hoặc ownerObject._id nếu đã populate)
    let actualOwnerId = ownerId;
    
    if (!actualOwnerId && facility) {
      // Nếu facility có ownerObject (đã populate)
      if (facility.ownerObject && typeof facility.ownerObject === 'object') {
        actualOwnerId = facility.ownerObject._id || facility.ownerObject.id;
      } else if (facility.ownerId) {
        actualOwnerId = facility.ownerId;
      }
    }

    if (!actualOwnerId) {
      toast.error("Không tìm thấy thông tin chủ sân");
      return;
    }

    try {
      setLoadingOwner(true);
      const result = await userApi.getUserById(actualOwnerId);
      if (result.success) {
        // API trả về { user, facilities }
        const ownerData = result.data.user || result.data;
        setSelectedOwner(ownerData);
        setIsOwnerModalOpen(true);
      } else {
        toast.error(result.message || "Không thể tải thông tin chủ sân");
      }
    } catch (error) {
      console.error("Error fetching owner:", error);
      toast.error(error.message || "Không thể tải thông tin chủ sân");
    } finally {
      setLoadingOwner(false);
    }
  };

  const handleCloseOwnerModal = () => {
    setIsOwnerModalOpen(false);
    setSelectedOwner(null);
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
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Quản lý cơ sở</h1>
      </div>

      <FacilityFilters
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
            cityFilter={cityFilter}
            onCityChange={handleCityChange}
            districtFilter={districtFilter}
            onDistrictChange={(value) => {
              setDistrictFilter(value);
              setPage(1);
            }}
            statusFilter={statusFilter}
            onStatusChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            sportFilter={sportFilter}
            onSportChange={(value) => {
              setSportFilter(value);
              setPage(1);
            }}
            dateFilter={dateFilter}
            onDateChange={(value) => {
              setDateFilter(value);
          setPage(1);
        }}
            onReset={handleResetFilters}
            uniqueCities={uniqueCities}
            filteredDistricts={filteredDistricts}
            uniqueSports={uniqueSports}
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
          Đang tải dữ liệu...
        </div>
      ) : (
        <FacilityTable
          facilities={facilitySlice}
          page={page}
          pageSize={pageSize}
          totalItems={totalFacilities}
          statusMap={statusMap}
          formatPrice={formatPrice}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          onView={handleViewDetails}
          onApprove={handleApprove}
          onReject={handleReject}
          onNavigateToOwner={handleNavigateToOwner}
        />
      )}

      <FacilityDetailModal
        isOpen={isDetailModalOpen}
        facility={selectedFacility}
        statusMap={statusMap}
        formatPrice={formatPrice}
        onClose={handleCloseModal}
      />

      <ApproveFacilityModal
        isOpen={isApproveModalOpen}
        onClose={() => {
          setIsApproveModalOpen(false);
          setSelectedFacility(null);
        }}
        onConfirm={handleConfirmApprove}
        facility={selectedFacility}
      />

      <RejectFacilityModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setSelectedFacility(null);
        }}
        onConfirm={(reason) => {
          handleConfirmReject(reason);
        }}
        facility={selectedFacility}
      />

      <UserDetailModal
        isOpen={isOwnerModalOpen}
        user={selectedOwner}
        onClose={handleCloseOwnerModal}
      />
    </div>
  );
};

export default Facilities;


import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import { promotionApi } from "../../../../api/promotionApi";
import { facilityApi } from "../../../../api/facilityApi";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";
import PromotionFilters from "../components/Promotions/PromotionFilters";
import PromotionTable from "../components/Promotions/PromotionTable";
import PromotionAddEditModal from "../components/Promotions/PromotionAddEditModal";

// Transform promotion from API format to component format (moved outside to prevent re-creation)
const transformPromotionFromAPI = (promo) => {
    const applicableFacilities = promo.isAllFacilities
      ? ["Tất cả sân"]
      : promo.applicableFacilities && Array.isArray(promo.applicableFacilities)
      ? promo.applicableFacilities.map((f) => (typeof f === "object" ? f.name : f))
      : [];

    return {
      id: promo._id,
      _id: promo._id,
      code: promo.code,
      name: promo.name,
      description: promo.description,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      startDate: promo.startDate ? new Date(promo.startDate).toISOString().split("T")[0] : "",
      endDate: promo.endDate ? new Date(promo.endDate).toISOString().split("T")[0] : "",
      applicableFacilities,
      applicableAreas: promo.applicableAreas || [],
      status: promo.computedStatus || promo.status,
      usageCount: promo.usageCount || 0,
      maxUsage: promo.maxUsage,
      createdAt: promo.createdAt ? new Date(promo.createdAt).toISOString().split("T")[0] : "",
      _original: promo, // Keep original for API calls
    };
};

const Promotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [selectedFacilities, setSelectedFacilities] = useState(["Tất cả sân"]);

  // Transform promotion to API format
  const transformPromotionToAPI = useCallback((promo) => {
    const applicableFacilities =
      promo.applicableFacilities && promo.applicableFacilities.includes("Tất cả sân")
        ? []
        : promo.applicableFacilities
            ?.map((name) => {
              const facility = facilities.find((f) => f.name === name);
              return facility?._id || facility?.id;
            })
            .filter((id) => id) || [];

    return {
      code: promo.code,
      name: promo.name,
      description: promo.description,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      startDate: promo.startDate,
      endDate: promo.endDate,
      applicableFacilities,
      applicableAreas: promo.applicableAreas || [],
      maxUsage: promo.maxUsage || null,
    };
  }, [facilities]);

  // Fetch promotions and facilities
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [promotionsResult, facilitiesResult] = await Promise.all([
          promotionApi.getPromotions({
            page,
            limit: pageSize,
            status: statusFilter !== "all" ? statusFilter : undefined,
          }),
          facilityApi.getFacilities({ limit: 1000 }), // Get all facilities for dropdown
        ]);

        if (promotionsResult.success) {
          const transformedPromotions = promotionsResult.data.promotions.map(transformPromotionFromAPI);
          setPromotions(transformedPromotions);
          setTotal(promotionsResult.data.pagination.total);
        }

        if (facilitiesResult.success) {
          setFacilities(facilitiesResult.data.facilities || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(error.message || "Có lỗi xảy ra khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, pageSize, statusFilter]);

  // Get unique facilities
  const uniqueFacilities = useMemo(() => {
    return ["Tất cả sân", ...facilities.map((f) => f.name)].sort();
  }, [facilities]);

  // Check status based on dates
  const getStatus = (promotion) => {
    const today = new Date().toISOString().split("T")[0];
    if (promotion.status === "expired") return "expired";
    if (promotion.endDate < today) return "expired";
    if (promotion.startDate > today) return "pending";
    return "active";
  };

  // Filter data (client-side search)
  const filteredPromotions = useMemo(() => {
    if (!searchQuery) return promotions;
    
    return promotions.filter((promotion) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        promotion.code.toLowerCase().includes(searchLower) ||
        promotion.name.toLowerCase().includes(searchLower) ||
        promotion.applicableFacilities.join(" ").toLowerCase().includes(searchLower)
      );
    });
  }, [promotions, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const promotionSlice = filteredPromotions;

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const formatDiscount = (promotion) => {
    if (promotion.discountType === "percentage") {
      return `${promotion.discountValue}%`;
    }
    return `${formatPrice(promotion.discountValue)} VNĐ`;
  };

  const statusMap = {
    active: { label: "Còn hạn", color: "#059669", bg: "#e6f9f0" },
    expired: { label: "Hết hạn", color: "#6b7280", bg: "#f3f4f6" },
    pending: { label: "Sắp diễn ra", color: "#d97706", bg: "#fef3c7" },
  };

  // Handlers
  const handleAdd = () => {
    setSelectedPromotion(null);
    setSelectedFacilities(["Tất cả sân"]);
    setIsAddModalOpen(true);
  };

  const handleEdit = (promotion) => {
    setSelectedPromotion(promotion);
    const facilities = promotion.applicableFacilities && promotion.applicableFacilities.length > 0
      ? promotion.applicableFacilities
      : ["Tất cả sân"];
    setSelectedFacilities(facilities);
    setIsEditModalOpen(true);
  };

  const handleDelete = (promotion) => {
    setSelectedPromotion(promotion);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPromotion) return;

    try {
      const promotionId = selectedPromotion._id || selectedPromotion.id;
      await promotionApi.deletePromotion(promotionId);
      
      toast.success("Xóa khuyến mãi thành công");
      setPromotions((current) => current.filter((p) => p.id !== selectedPromotion.id));
      setIsDeleteModalOpen(false);
      setSelectedPromotion(null);
      
      // Refresh data
      const result = await promotionApi.getPromotions({
        page,
        limit: pageSize,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      if (result.success) {
        const transformed = result.data.promotions.map(transformPromotionFromAPI);
        setPromotions(transformed);
        setTotal(result.data.pagination.total);
      }
    } catch (error) {
      console.error("Error deleting promotion:", error);
      toast.error(error.message || "Có lỗi xảy ra khi xóa khuyến mãi");
    }
  };

  const handleSave = async (promotionData) => {
    try {
      const apiData = transformPromotionToAPI(promotionData);

      if (selectedPromotion) {
        // Edit
        const promotionId = selectedPromotion._id || selectedPromotion.id;
        await promotionApi.updatePromotion(promotionId, apiData);
        toast.success("Cập nhật khuyến mãi thành công");
        setIsEditModalOpen(false);
      } else {
        // Add
        await promotionApi.createPromotion(apiData);
        toast.success("Tạo khuyến mãi thành công");
        setIsAddModalOpen(false);
      }

      setSelectedPromotion(null);
      setSelectedFacilities(["Tất cả sân"]);

      // Refresh data
      const result = await promotionApi.getPromotions({
        page,
        limit: pageSize,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      if (result.success) {
        const transformed = result.data.promotions.map(transformPromotionFromAPI);
        setPromotions(transformed);
        setTotal(result.data.pagination.total);
      }
    } catch (error) {
      console.error("Error saving promotion:", error);
      toast.error(error.message || "Có lỗi xảy ra khi lưu khuyến mãi");
    }
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
    setPage(1);
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
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Quản lý khuyến mãi</h1>
        <button
          onClick={handleAdd}
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
          <Plus size={16} /> Tạo khuyến mãi
        </button>
      </div>

      <PromotionFilters
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        onStatusChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        onReset={resetFilters}
      />

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
          Đang tải...
        </div>
      ) : (
        <PromotionTable
          promotions={promotionSlice}
          page={page}
          pageSize={pageSize}
          totalItems={total}
          statusMap={statusMap}
          getStatus={getStatus}
          formatDiscount={formatDiscount}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <PromotionAddEditModal
        isOpen={isAddModalOpen}
        isEdit={false}
        promotion={null}
        selectedFacilities={selectedFacilities}
        uniqueFacilities={uniqueFacilities}
        onFacilitiesChange={setSelectedFacilities}
        onSave={handleSave}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedPromotion(null);
          setSelectedFacilities(["Tất cả sân"]);
        }}
      />

      <PromotionAddEditModal
        isOpen={isEditModalOpen}
        isEdit={true}
        promotion={selectedPromotion}
        selectedFacilities={selectedFacilities}
        uniqueFacilities={uniqueFacilities}
        onFacilitiesChange={setSelectedFacilities}
        onSave={handleSave}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPromotion(null);
          setSelectedFacilities(["Tất cả sân"]);
        }}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedPromotion(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Xóa chương trình khuyến mãi"
        message="Bạn có chắc muốn xóa chương trình khuyến mãi"
        itemName={selectedPromotion?.name}
        warningMessage="Hành động này không thể hoàn tác."
      />
    </div>
  );
};

export default Promotions;


import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { categoryApi } from "../../../../api/categoryApi";
import CourtTypeModal from "../modals/CourtTypeModal";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";
import CourtTypeTable from "./CourtTypes/CourtTypeTable";

const CourtTypes = () => {
  const [courtTypes, setCourtTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCourtType, setSelectedCourtType] = useState(null);
  const [error, setError] = useState("");

  // Fetch court types
  useEffect(() => {
    fetchCourtTypes();
  }, [searchQuery]);

  const fetchCourtTypes = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (searchQuery) {
        params.search = searchQuery;
      }
      const result = await categoryApi.getCourtTypes(params);
      setCourtTypes(result.data || []);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách loại sân");
      console.error("Error fetching court types:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourtTypes = courtTypes.filter((r) =>
    [r.name, r.description, r.sportCategory?.name, r.status]
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCourtTypes.length / pageSize)
  );
  const courtTypeSlice = filteredCourtTypes.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleAdd = () => {
    setSelectedCourtType(null);
    setIsModalOpen(true);
  };

  const handleEdit = (courtType) => {
    setSelectedCourtType(courtType);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      if (selectedCourtType) {
        await categoryApi.updateCourtType(selectedCourtType._id, formData);
      } else {
        await categoryApi.createCourtType(formData);
      }
      await fetchCourtTypes();
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = (courtType) => {
    setSelectedCourtType(courtType);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedCourtType) {
      try {
        await categoryApi.deleteCourtType(selectedCourtType._id);
        await fetchCourtTypes();
        setIsDeleteModalOpen(false);
        setSelectedCourtType(null);
      } catch (err) {
        alert(err.message || "Không thể xóa loại sân");
        setIsDeleteModalOpen(false);
        setSelectedCourtType(null);
      }
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
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Loại sân thể thao</h1>
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
          <Plus size={16} /> Thêm loại sân
        </button>
      </div>

      <CourtTypeTable
        courtTypes={courtTypeSlice}
        loading={loading}
        error={error}
        page={page}
        pageSize={pageSize}
        totalItems={filteredCourtTypes.length}
        searchQuery={searchQuery}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CourtTypeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCourtType(null);
        }}
        onSave={handleSave}
        courtType={selectedCourtType}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedCourtType(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Xóa loại sân"
        message="Bạn có chắc muốn xóa loại sân"
        itemName={selectedCourtType?.name}
        warningMessage="Hành động này không thể hoàn tác."
      />
    </div>
  );
};

export default CourtTypes;


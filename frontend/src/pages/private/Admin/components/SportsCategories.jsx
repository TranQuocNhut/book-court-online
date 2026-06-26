import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { categoryApi } from "../../../../api/categoryApi";
import SportCategoryModal from "../modals/SportCategoryModal";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";
import SportCategoryTable from "./SportsCategories/SportCategoryTable";

const SportsCategories = () => {
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [error, setError] = useState("");

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, [searchQuery]);

  const fetchCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (searchQuery) {
        params.search = searchQuery;
      }
      const result = await categoryApi.getSportCategories(params);
      setCategories(result.data || []);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách danh mục");
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((r) =>
    [r.name, r.description, r.status]
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / pageSize)
  );
  const categorySlice = filteredCategories.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleAdd = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      if (selectedCategory) {
        await categoryApi.updateSportCategory(selectedCategory._id, formData);
      } else {
        await categoryApi.createSportCategory(formData);
      }
      await fetchCategories();
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = (category) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedCategory) {
      try {
        await categoryApi.deleteSportCategory(selectedCategory._id);
        await fetchCategories();
        setIsDeleteModalOpen(false);
        setSelectedCategory(null);
      } catch (err) {
        alert(err.message || "Không thể xóa danh mục");
        setIsDeleteModalOpen(false);
        setSelectedCategory(null);
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
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Danh mục môn thể thao</h1>
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
          <Plus size={16} /> Thêm danh mục
        </button>
      </div>

      <SportCategoryTable
        categories={categorySlice}
        loading={loading}
        error={error}
        page={page}
        pageSize={pageSize}
        totalItems={filteredCategories.length}
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

      <SportCategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCategory(null);
        }}
        onSave={handleSave}
        category={selectedCategory}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedCategory(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Xóa danh mục"
        message="Bạn có chắc muốn xóa danh mục"
        itemName={selectedCategory?.name}
        warningMessage="Hành động này không thể hoàn tác."
      />
    </div>
  );
};

export default SportsCategories;


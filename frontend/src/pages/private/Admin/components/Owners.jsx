import React, { useState, useMemo } from "react";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { ownerData } from "../data/mockData";
import OwnerDetailModal from "../modals/OwnerDetailModal";
import OwnerEditModal from "../modals/OwnerEditModal";
import OwnerDeleteModal from "../modals/OwnerDeleteModal";
import OwnerAddModal from "../modals/OwnerAddModal";
import { ActionButton } from "./shared";

const Owners = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [owners, setOwners] = useState(ownerData);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [ownerToEdit, setOwnerToEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredOwners = useMemo(
    () =>
      owners.filter((r) =>
        [r.name, r.email, r.phone, r.facility, r.status]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ),
    [owners, searchQuery]
  );

  const handleViewDetails = (owner) => {
    setSelectedOwner(owner);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOwner(null);
  };

  const handleOpenEditModal = (owner) => {
    setOwnerToEdit(owner);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setOwnerToEdit(null);
  };

  const handleSaveOwner = (updatedOwner) => {
    setOwners(currentOwners =>
      currentOwners.map(o =>
        o.id === updatedOwner.id ? updatedOwner : o
      )
    );
    handleCloseEditModal();
  };

  const handleOpenDeleteModal = (owner) => {
    setOwnerToDelete(owner);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setOwnerToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (ownerToDelete) {
      setOwners((currentOwners) =>
        currentOwners.filter((o) => o.id !== ownerToDelete.id)
      );
      handleCloseDeleteModal();
    }
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleAddNewOwner = (newOwner) => {
    setOwners((currentOwners) => [newOwner, ...currentOwners]);
    handleCloseAddModal();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Quản lý chủ sân</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleOpenAddModal}
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
            <Plus size={16}/> Thêm chủ sân
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
              <strong>Tổng:</strong> {filteredOwners.length} chủ sân
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <select 
                style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14 }}
                onChange={(e) => {
                  if (e.target.value === "all") {
                    setSearchQuery("");
                  } else {
                    setSearchQuery(e.target.value);
                  }
                }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>
          </div>
          <input
            placeholder="Tìm theo tên, email, SĐT, sân…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
                  "Họ tên",
                  "Liên hệ",
                  "Sân",
                  "Ngày tham gia",
                  "Doanh thu",
                  "Hoa hồng",
                  "Trạng thái",
                  "Đăng nhập cuối",
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
              {filteredOwners.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 12, fontWeight: 700, color: "#1f2937" }}>{r.id}</td>
                  <td style={{ padding: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ fontSize: 14 }}>{r.phone}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{r.email}</div>
                  </td>
                  <td style={{ padding: 12, fontWeight: 600 }}>{r.facility}</td>
                  <td style={{ padding: 12 }}>{r.joinDate}</td>
                  <td style={{ padding: 12, fontWeight: 600, color: "#059669" }}>
                    {(r.totalRevenue / 1e6).toFixed(1)}M VNĐ
                  </td>
                  <td style={{ padding: 12, fontWeight: 600, color: "#f59e0b" }}>
                    {(r.commission / 1e6).toFixed(1)}M VNĐ
                  </td>
                  <td style={{ padding: 12 }}>
                    <span style={{
                      background: r.status === "active" ? "#e6f9f0" : "#fee2e2",
                      color: r.status === "active" ? "#059669" : "#ef4444",
                      padding: "4px 8px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                    }}>
                      {r.status === "active" ? "Hoạt động" : "Không hoạt động"}
                    </span>
                  </td>
                  <td style={{ padding: 12, fontSize: 12, color: "#6b7280" }}>
                    {r.lastLogin}
                  </td>
                  <td style={{ padding: 12, whiteSpace: "nowrap" }}>
                    <ActionButton
                      bg="#06b6d4"
                      Icon={Eye}
                      onClick={() => handleViewDetails(r)}
                      title="Xem chi tiết"
                    />
                    <ActionButton
                      bg="#22c55e"
                      Icon={Pencil}
                      onClick={() => handleOpenEditModal(r)}
                      title="Sửa"
                    />
                    <ActionButton
                      bg="#ef4444"
                      Icon={Trash2}
                      onClick={() => handleOpenDeleteModal(r)}
                      title="Xóa"
                    />
                  </td>
                </tr>
              ))}
              {!filteredOwners.length && (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      padding: 32,
                      textAlign: "center",
                      color: "#6b7280",
                    }}
                  >
                    <div style={{ fontSize: 16, marginBottom: 8 }}>👨‍💼</div>
                    Không có dữ liệu chủ sân
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OwnerDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        owner={selectedOwner}
      />

      <OwnerEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveOwner}
        owner={ownerToEdit}
      />

      <OwnerDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        owner={ownerToDelete}
      />

      <OwnerAddModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSave={handleAddNewOwner}
      />
    </div>
  );
};

export default Owners;


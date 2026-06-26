import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { categoryApi } from "../../../../api/categoryApi";

const FormInput = ({ label, value, name, onChange, readOnly = false, type = "text", textarea = false }) => {
  const InputComponent = textarea ? "textarea" : "input";
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          color: "#374151",
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <InputComponent
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        rows={textarea ? 4 : undefined}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid #d1d5db",
          fontSize: 14,
          background: readOnly ? "#f3f4f6" : "#fff",
          boxSizing: "border-box",
          fontFamily: "inherit",
          resize: textarea ? "vertical" : "none",
        }}
      />
    </div>
  );
};

const FormSelect = ({ label, value, name, onChange, options }) => (
  <div style={{ marginBottom: 16 }}>
    <label
      style={{
        display: "block",
        fontSize: 13,
        color: "#374151",
        fontWeight: 600,
        marginBottom: 6,
      }}
    >
      {label}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #d1d5db",
        fontSize: 14,
        background: "#fff",
        boxSizing: "border-box",
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const CourtTypeModal = ({ isOpen, onClose, onSave, courtType = null }) => {
  const [formData, setFormData] = useState({
    name: "",
    sportCategory: "",
    description: "",
    features: "",
    status: "active",
    order: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sportCategories, setSportCategories] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchSportCategories();
      if (courtType) {
        setFormData({
          name: courtType.name || "",
          sportCategory: courtType.sportCategory?._id || courtType.sportCategory || "",
          description: courtType.description || "",
          features: Array.isArray(courtType.features) ? courtType.features.join(", ") : (courtType.features || ""),
          status: courtType.status || "active",
          order: courtType.order || 0,
        });
      } else {
        setFormData({
          name: "",
          sportCategory: "",
          description: "",
          features: "",
          status: "active",
          order: 0,
        });
      }
      setError("");
    }
  }, [courtType, isOpen]);

  const fetchSportCategories = async () => {
    try {
      const result = await categoryApi.getSportCategories({ status: "active" });
      setSportCategories(result.data || []);
    } catch (err) {
      console.error("Error fetching sport categories:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "order" ? parseInt(value) || 0 : value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!formData.name.trim()) {
      setError("Tên loại sân là bắt buộc");
      setLoading(false);
      return;
    }

    if (!formData.sportCategory) {
      setError("Danh mục thể thao là bắt buộc");
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        features: formData.features
          ? formData.features.split(",").map((f) => f.trim()).filter((f) => f)
          : [],
      };
      await onSave(submitData);
      onClose();
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi lưu loại sân");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          width: "90%",
          maxWidth: 600,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            {courtType ? "Sửa loại sân" : "Thêm loại sân mới"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              color: "#6b7280",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          {error && (
            <div
              style={{
                background: "#fee2e2",
                color: "#dc2626",
                padding: "12px",
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          <FormInput
            label="Tên loại sân *"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />

          <FormSelect
            label="Danh mục thể thao *"
            name="sportCategory"
            value={formData.sportCategory}
            onChange={handleChange}
            options={[
              { value: "", label: "Chọn danh mục" },
              ...sportCategories.map((cat) => ({
                value: cat._id,
                label: cat.name,
              })),
            ]}
          />

          <FormInput
            label="Mô tả"
            name="description"
            value={formData.description}
            onChange={handleChange}
            textarea={true}
          />

          <FormInput
            label="Đặc điểm (phân cách bằng dấu phẩy)"
            name="features"
            value={formData.features}
            onChange={handleChange}
            placeholder="Ví dụ: Cỏ nhân tạo, Trong nhà, Có đèn"
          />

          <FormSelect
            label="Trạng thái"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={[
              { value: "active", label: "Hoạt động" },
              { value: "inactive", label: "Ngừng hoạt động" },
            ]}
          />

          <FormInput
            label="Thứ tự hiển thị"
            name="order"
            type="number"
            value={formData.order}
            onChange={handleChange}
          />

          {/* Actions */}
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "flex-end",
              marginTop: 24,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
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
              disabled={loading}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: "#10b981",
                color: "#fff",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Save size={16} />
              {loading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourtTypeModal;


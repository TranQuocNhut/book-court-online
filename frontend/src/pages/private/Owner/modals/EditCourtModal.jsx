import React, { useState, useEffect } from "react";
import { X, Save, Loader } from "lucide-react";
import { toast } from "react-toastify";
import useClickOutside from "../../../../hook/use-click-outside";
import useBodyScrollLock from "../../../../hook/use-body-scroll-lock";
import useEscapeKey from "../../../../hook/use-escape-key";
import { courtApi } from "../../../../api/courtApi";
import { categoryApi } from "../../../../api/categoryApi";


const EditCourtModal = ({ isOpen, onClose, initialData = {}, onSave }) => {

  useBodyScrollLock(isOpen)

  useEscapeKey(onClose, isOpen)
  
  const modalRef = useClickOutside(onClose, isOpen)

  const [formData, setFormData] = useState({
    name: "",
    sportCategory: "",
    courtType: "",
    capacity: "",
    price: "",
    status: "active",
  });
  
  const [sportCategories, setSportCategories] = useState([]);
  const [courtTypes, setCourtTypes] = useState([]);
  const [loadingCourtTypes, setLoadingCourtTypes] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch sport categories when modal opens
  useEffect(() => {
    const fetchSportCategories = async () => {
      if (!isOpen) return;
      
      try {
        const result = await categoryApi.getSportCategories({ status: "active" });
        if (result.success && result.data) {
          setSportCategories(Array.isArray(result.data) ? result.data : []);
        }
      } catch (error) {
        console.error("Error fetching sport categories:", error);
      }
    };

    fetchSportCategories();
  }, [isOpen]);

  // Load initial data and set sport category and court type
  useEffect(() => {
    const loadInitialData = async () => {
      if (!isOpen || !initialData) return;

      setLoadingInitialData(true);
      try {
        // Get courtType from initialData (could be populated or just ID)
        const courtTypeId = initialData.courtType?._id || initialData.courtType || null;
        let sportCategoryId = null;

        // If courtType is populated with sportCategory
        if (initialData.courtType?.sportCategory) {
          sportCategoryId = initialData.courtType.sportCategory._id || initialData.courtType.sportCategory;
        } else if (courtTypeId) {
          // Fetch court type to get sport category
          try {
            const courtTypeResult = await categoryApi.getCourtTypeById(courtTypeId);
            if (courtTypeResult.success && courtTypeResult.data) {
              const courtType = courtTypeResult.data;
              sportCategoryId = courtType.sportCategory?._id || courtType.sportCategory;
            }
          } catch (error) {
            console.error("Error fetching court type:", error);
          }
        }

        // Set form data
        setFormData({
          name: initialData.name || "",
          sportCategory: sportCategoryId || "",
          courtType: courtTypeId || "",
          capacity: initialData.capacity?.toString() || "",
          price: initialData.price?.toString() || "",
          status: initialData.status || "active",
        });
        setErrors({});
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setLoadingInitialData(false);
      }
    };

    loadInitialData();
  }, [isOpen, initialData]);

  // Fetch court types when sport category is selected
  useEffect(() => {
    const fetchCourtTypes = async () => {
      if (!formData.sportCategory) {
        setCourtTypes([]);
        return;
      }

      setLoadingCourtTypes(true);
      try {
        const result = await categoryApi.getCourtTypes({ 
          sportCategory: formData.sportCategory,
          status: "active" 
        });
        
        if (result.success && result.data) {
          setCourtTypes(Array.isArray(result.data) ? result.data : []);
        } else {
          setCourtTypes([]);
        }
      } catch (error) {
        console.error("Error fetching court types:", error);
        setCourtTypes([]);
      } finally {
        setLoadingCourtTypes(false);
      }
    };

    fetchCourtTypes();
  }, [formData.sportCategory]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If sport category changes, reset court type
    if (name === "sportCategory") {
      setFormData((prev) => ({ 
        ...prev, 
        [name]: value,
        courtType: "" // Reset court type when sport category changes
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Tên sân là bắt buộc";
    }
    
    if (!formData.sportCategory) {
      newErrors.sportCategory = "Môn thể thao là bắt buộc";
    }
    
    if (!formData.courtType) {
      newErrors.courtType = "Loại sân là bắt buộc";
    }
    
    if (!formData.capacity || Number(formData.capacity) < 1) {
      newErrors.capacity = "Sức chứa phải lớn hơn 0";
    }
    
    if (!formData.price || Number(formData.price) < 0) {
      newErrors.price = "Giá thuê không hợp lệ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    const courtId = initialData._id || initialData.id;
    if (!courtId) {
      toast.error("Không tìm thấy ID sân");
      return;
    }

    setLoading(true);

    try {
      // Get court type name for backward compatibility
      const selectedCourtType = courtTypes.find(ct => ct._id === formData.courtType);
      const courtTypeName = selectedCourtType?.name || "";

      const courtData = {
        name: formData.name.trim(),
        type: courtTypeName, // Keep for backward compatibility
        courtType: formData.courtType, // New field
        sportCategory: formData.sportCategory, // Sport category for filtering
        capacity: Number(formData.capacity),
        price: Number(formData.price),
        status: formData.status || "active",
      };

      const result = await courtApi.updateCourt(courtId, courtData);

      if (result.success && result.data) {
        const court = result.data;
        toast.success(result.message || "Cập nhật sân thành công!");

        if (onSave && typeof onSave === 'function') {
          onSave(court);
        }

        onClose();
      } else {
        throw new Error(result.message || "Có lỗi xảy ra khi cập nhật sân");
      }
    } catch (error) {
      console.error("Error updating court:", error);
      
      let errorMessage = "Có lỗi xảy ra khi cập nhật sân";
      
      if (error.status === 0) {
        errorMessage = "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.";
      } else {
        errorMessage = error.message || errorMessage;
        
        if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
          const validationErrors = error.errors.map(err => err.msg || err.message || err).join(", ");
          errorMessage = validationErrors || errorMessage;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "24px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Chỉnh sửa sân</h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#6b7280",
              padding: "4px",
            }}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          {loadingInitialData && (
            <div style={{ padding: "24px", textAlign: "center" }}>
              <Loader size={24} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
              <p style={{ color: "#6b7280", fontSize: 14 }}>Đang tải thông tin...</p>
            </div>
          )}

          {!loadingInitialData && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#374151" }}>
                  Tên sân *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: errors.name ? "2px solid #ef4444" : "2px solid #e5e7eb",
                    fontSize: 15,
                  }}
                  placeholder="VD: Sân bóng đá A1"
                />
                {errors.name && (
                  <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.name}</p>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#374151" }}>
                  Môn thể thao *
                </label>
                <select
                  name="sportCategory"
                  value={formData.sportCategory}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: errors.sportCategory ? "2px solid #ef4444" : "2px solid #e5e7eb",
                    fontSize: 15,
                    cursor: "pointer",
                  }}
                >
                  <option value="">Chọn môn thể thao</option>
                  {sportCategories.map((category) => (
                    <option key={category._id || category.id} value={category._id || category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.sportCategory && (
                  <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.sportCategory}</p>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#374151" }}>
                  Loại sân *
                </label>
                <select
                  name="courtType"
                  value={formData.courtType}
                  onChange={handleChange}
                  required
                  disabled={!formData.sportCategory || loadingCourtTypes}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: errors.courtType ? "2px solid #ef4444" : "2px solid #e5e7eb",
                    fontSize: 15,
                    cursor: !formData.sportCategory || loadingCourtTypes ? "not-allowed" : "pointer",
                    opacity: !formData.sportCategory || loadingCourtTypes ? 0.6 : 1,
                    background: !formData.sportCategory || loadingCourtTypes ? "#f3f4f6" : "#fff",
                  }}
                >
                  <option value="">
                    {loadingCourtTypes 
                      ? "Đang tải loại sân..." 
                      : !formData.sportCategory 
                        ? "Vui lòng chọn môn thể thao trước" 
                        : "Chọn loại sân"}
                  </option>
                  {courtTypes.map((courtType) => (
                    <option key={courtType._id || courtType.id} value={courtType._id || courtType.id}>
                      {courtType.name}
                    </option>
                  ))}
                </select>
                {errors.courtType && (
                  <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.courtType}</p>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#374151" }}>
                    Sức chứa (Số người) *
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    required
                    min="1"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 10,
                      border: errors.capacity ? "2px solid #ef4444" : "2px solid #e5e7eb",
                      fontSize: 15,
                    }}
                    placeholder="VD: 5"
                  />
                  {errors.capacity && (
                    <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.capacity}</p>
                  )}
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#374151" }}>
                    Giá/giờ (VNĐ) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 10,
                      border: errors.price ? "2px solid #ef4444" : "2px solid #e5e7eb",
                      fontSize: 15,
                    }}
                    placeholder="VD: 150000"
                  />
                  {errors.price && (
                    <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.price}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {!loadingInitialData && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#374151" }}>
                Trạng thái *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "2px solid #e5e7eb",
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                <option value="active">Hoạt động</option>
                <option value="maintenance">Bảo trì</option>
                <option value="inactive">Tạm ngưng</option>
              </select>
            </div>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading || loadingInitialData}
              style={{
                padding: "12px 24px",
                background: "#fff",
                color: "#374151",
                border: "2px solid #e5e7eb",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: loading || loadingInitialData ? "not-allowed" : "pointer",
                opacity: loading || loadingInitialData ? 0.5 : 1,
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || loadingInitialData}
              style={{
                padding: "12px 24px",
                background: loading || loadingInitialData
                  ? "#9ca3af"
                  : "linear-gradient(135deg, #3b82f6, #2563eb)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: loading || loadingInitialData ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <Loader size={18} style={{ animation: "spin 1s linear infinite" }} />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
          
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </form>
      </div>
    </div>
  );
};

export default EditCourtModal;
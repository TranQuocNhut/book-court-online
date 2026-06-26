import React, { useState, useEffect } from "react";
import { Plus, X, Loader } from "lucide-react";
import { toast } from "react-toastify";
import useClickOutside from "../../../../hook/use-click-outside";
import useBodyScrollLock from "../../../../hook/use-body-scroll-lock";
import useEscapeKey from "../../../../hook/use-escape-key";
import { courtApi } from "../../../../api/courtApi";
import { facilityApi } from "../../../../api/facilityApi";
import { categoryApi } from "../../../../api/categoryApi";
import { useAuth } from "../../../../contexts/AuthContext";

const AddCourtModal = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuth();
  
  useBodyScrollLock(isOpen)
  useEscapeKey(onClose, isOpen)
  const modalRef = useClickOutside(onClose, isOpen)
  
  const [formData, setFormData] = useState({
    name: "",
    sportCategory: "",
    courtType: "",
    capacity: "",
    price: "",
  });

  const [facilityId, setFacilityId] = useState(null);
  const [sportCategories, setSportCategories] = useState([]);
  const [courtTypes, setCourtTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingFacility, setLoadingFacility] = useState(true);
  const [loadingCourtTypes, setLoadingCourtTypes] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: "", sportCategory: "", courtType: "", capacity: "", price: "" });
      setErrors({});
      setCourtTypes([]);
    }
  }, [isOpen]);

  // Fetch facility and sport categories when modal opens
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !user) return;
      
      setLoadingFacility(true);
      try {
        // Fetch facility
        const ownerId = user._id || user.id;
        const facilityResult = await facilityApi.getFacilities({ ownerId, limit: 1 });
        
        if (facilityResult.success && facilityResult.data?.facilities?.length > 0) {
          const facility = facilityResult.data.facilities[0];
          setFacilityId(facility._id || facility.id);
        } else {
          toast.error("Bạn chưa có cơ sở. Vui lòng tạo cơ sở trước.");
          onClose();
          return;
        }

        // Fetch sport categories
        const categoriesResult = await categoryApi.getSportCategories({ status: "active" });
        if (categoriesResult.success && categoriesResult.data) {
          setSportCategories(Array.isArray(categoriesResult.data) ? categoriesResult.data : []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Không thể lấy thông tin cơ sở");
        onClose();
      } finally {
        setLoadingFacility(false);
      }
    };

    fetchData();
  }, [isOpen, user, onClose]);

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
        toast.error("Không thể lấy danh sách loại sân");
        setCourtTypes([]);
      } finally {
        setLoadingCourtTypes(false);
      }
    };

    fetchCourtTypes();
  }, [formData.sportCategory]);

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
    if (!formData.name.trim()) newErrors.name = "Tên sân là bắt buộc";
    if (!formData.sportCategory) newErrors.sportCategory = "Môn thể thao là bắt buộc";
    if (!formData.courtType) newErrors.courtType = "Loại sân là bắt buộc";
    if (!formData.capacity || Number(formData.capacity) < 1) newErrors.capacity = "Sức chứa phải lớn hơn 0";
    if (!formData.price || Number(formData.price) < 0) newErrors.price = "Giá thuê không hợp lệ";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    if (!facilityId) {
      toast.error("Không tìm thấy cơ sở");
      return;
    }

    setLoading(true);

    try {
      // Get court type name for backward compatibility
      const selectedCourtType = courtTypes.find(ct => ct._id === formData.courtType);
      const courtTypeName = selectedCourtType?.name || "";

      const courtData = {
        facility: facilityId,
        name: formData.name.trim(),
        type: courtTypeName, // Keep for backward compatibility
        courtType: formData.courtType, // New field
        sportCategory: formData.sportCategory, // Sport category for filtering
        capacity: Number(formData.capacity),
        price: Number(formData.price),
      };
      const result = await courtApi.createCourt(courtData);

      if (result.success && result.data) {
        const court = result.data;
        toast.success(result.message || "Thêm sân thành công!");
        setFormData({ name: "", sportCategory: "", courtType: "", capacity: "", price: "" });
        setErrors({});
        if (onSave && typeof onSave === 'function') {
          onSave(court);
        }
        onClose();
      } else {
        throw new Error(result.message || "Có lỗi xảy ra khi tạo sân");
      }
    } catch (error) {
      console.error("Error creating court:", error);
      let errorMessage = "Có lỗi xảy ra khi tạo sân";
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

  if (!isOpen) return null;

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
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Thêm sân mới</h2>
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          {loadingFacility && (
            <div style={{ padding: "24px", textAlign: "center" }}>
              <Loader size={24} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
              <p style={{ color: "#6b7280", fontSize: 14 }}>Đang tải thông tin...</p>
            </div>
          )}

          {!loadingFacility && facilityId && (
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

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading || loadingFacility}
              style={{
                padding: "12px 24px",
                background: "#fff",
                color: "#374151",
                border: "2px solid #e5e7eb",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: loading || loadingFacility ? "not-allowed" : "pointer",
                opacity: loading || loadingFacility ? 0.5 : 1,
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || loadingFacility || !facilityId}
              style={{
                padding: "12px 24px",
                background: loading || loadingFacility || !facilityId
                  ? "#9ca3af"
                  : "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: loading || loadingFacility || !facilityId ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <Loader size={18} style={{ animation: "spin 1s linear infinite" }} />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Thêm sân
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

export default AddCourtModal;
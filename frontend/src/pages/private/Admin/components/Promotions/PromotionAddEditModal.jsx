import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getProvinces } from "../../../../../api/provinceApi";

const PromotionAddEditModal = ({
  isOpen,
  isEdit,
  promotion,
  selectedFacilities,
  uniqueFacilities,
  onFacilitiesChange,
  onSave,
  onClose,
}) => {
  const [provinces, setProvinces] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [districts, setDistricts] = useState([]);
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);

  // Fetch provinces when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchProvinces = async () => {
        try {
          setLoadingProvinces(true);
          const result = await getProvinces();
          if (result.success && result.data) {
            setProvinces(result.data);
          }
        } catch (error) {
          console.error("Error fetching provinces:", error);
        } finally {
          setLoadingProvinces(false);
        }
      };
      fetchProvinces();
    }
  }, [isOpen]);

  // Initialize selected areas from promotion data
  useEffect(() => {
    if (isOpen && promotion?.applicableAreas && promotion.applicableAreas.length > 0) {
      // Parse existing areas (format: "Quận 1", "Quận 2", etc.)
      setSelectedDistricts(promotion.applicableAreas);
    } else if (isOpen) {
      setSelectedDistricts([]);
      setSelectedProvince("");
    }
  }, [isOpen, promotion]);

  // Update districts when province changes
  useEffect(() => {
    if (selectedProvince) {
      const province = provinces.find((p) => p.name === selectedProvince);
      if (province && province.districts) {
        setDistricts(province.districts);
      } else {
        setDistricts([]);
      }
    } else {
      setDistricts([]);
    }
  }, [selectedProvince, provinces]);

  const handleProvinceChange = (e) => {
    setSelectedProvince(e.target.value);
    setSelectedDistricts([]); // Reset selected districts when province changes
  };

  const handleDistrictToggle = (districtName) => {
    setSelectedDistricts((prev) => {
      if (prev.includes(districtName)) {
        return prev.filter((d) => d !== districtName);
      } else {
        return [...prev, districtName];
      }
    });
  };

  const handleRemoveDistrict = (districtName) => {
    setSelectedDistricts((prev) => prev.filter((d) => d !== districtName));
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const promotionData = {
      code: formData.get("code").toUpperCase(),
      name: formData.get("name"),
      discountType: formData.get("discountType"),
      discountValue: Number(formData.get("discountValue")),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      applicableFacilities:
        selectedFacilities.length > 0 ? selectedFacilities : ["Tất cả sân"],
      applicableAreas: selectedDistricts,
      maxUsage: formData.get("maxUsage")
        ? Number(formData.get("maxUsage"))
        : null,
      usageCount: promotion?.usageCount || 0,
    };
    onSave(promotionData);
  };

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
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          maxWidth: "600px",
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 0 }}>
            {isEdit ? "Sửa chương trình khuyến mãi" : "Tạo chương trình khuyến mãi mới"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 13,
                  color: "#374151",
                  fontWeight: 600,
                }}
              >
                Mã khuyến mãi *
              </label>
              <input
                name="code"
                defaultValue={promotion?.code || ""}
                required
                placeholder="VD: HELLO2025"
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 14,
                  textTransform: "uppercase",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 13,
                  color: "#374151",
                  fontWeight: 600,
                }}
              >
                Tên chương trình *
              </label>
              <input
                name="name"
                defaultValue={promotion?.name || ""}
                required
                placeholder="VD: Khuyến mãi chào năm mới"
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 14,
                }}
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 13,
                    color: "#374151",
                    fontWeight: 600,
                  }}
                >
                  Loại giảm giá *
                </label>
                <select
                  name="discountType"
                  defaultValue={promotion?.discountType || "percentage"}
                  required
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    fontSize: 14,
                  }}
                >
                  <option value="percentage">Theo phần trăm (%)</option>
                  <option value="fixed">Theo số tiền (VNĐ)</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 13,
                    color: "#374151",
                    fontWeight: 600,
                  }}
                >
                  Mức giảm *
                </label>
                <input
                  name="discountValue"
                  type="number"
                  defaultValue={promotion?.discountValue || ""}
                  required
                  min="1"
                  placeholder="20 hoặc 50000"
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    fontSize: 14,
                  }}
                />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 13,
                    color: "#374151",
                    fontWeight: 600,
                  }}
                >
                  Ngày bắt đầu *
                </label>
                <input
                  name="startDate"
                  type="date"
                  defaultValue={promotion?.startDate || ""}
                  required
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 13,
                    color: "#374151",
                    fontWeight: 600,
                  }}
                >
                  Ngày kết thúc *
                </label>
                <input
                  name="endDate"
                  type="date"
                  defaultValue={promotion?.endDate || ""}
                  required
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    fontSize: 14,
                  }}
                />
              </div>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 13,
                  color: "#374151",
                  fontWeight: 600,
                }}
              >
                Áp dụng cho sân *
              </label>
              <select
                name="applicableFacilities"
                multiple
                size={5}
                value={selectedFacilities}
                onChange={(e) => {
                  const values = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
                  onFacilitiesChange(values);
                }}
                required
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 14,
                }}
              >
                {uniqueFacilities.map((facility) => (
                  <option key={facility} value={facility}>
                    {facility}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                Giữ Ctrl/Cmd để chọn nhiều sân, hoặc chọn "Tất cả sân"
              </div>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 13,
                  color: "#374151",
                  fontWeight: 600,
                }}
              >
                Áp dụng cho khu vực (tùy chọn)
              </label>
              
              {/* Province Select */}
              <select
                value={selectedProvince}
                onChange={handleProvinceChange}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 14,
                  marginBottom: 12,
                }}
                disabled={loadingProvinces}
              >
                <option value="">Chọn tỉnh/thành phố</option>
                {provinces.map((province) => (
                  <option key={province.code} value={province.name}>
                    {province.name}
                  </option>
                ))}
              </select>

              {/* Districts Multi-select */}
              {selectedProvince && districts.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      marginBottom: 8,
                      fontWeight: 500,
                    }}
                  >
                    Chọn quận/huyện (có thể chọn nhiều):
                  </div>
                  <div
                    style={{
                      maxHeight: "150px",
                      overflowY: "auto",
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      padding: 8,
                      background: "#f9fafb",
                    }}
                  >
                    {districts.map((district) => (
                      <label
                        key={district.code}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "6px 8px",
                          cursor: "pointer",
                          borderRadius: 4,
                          marginBottom: 4,
                          background: selectedDistricts.includes(district.name)
                            ? "#e0f2fe"
                            : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedDistricts.includes(district.name)) {
                            e.currentTarget.style.background = "#f3f4f6";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedDistricts.includes(district.name)) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDistricts.includes(district.name)}
                          onChange={() => handleDistrictToggle(district.name)}
                          style={{
                            marginRight: 8,
                            cursor: "pointer",
                          }}
                        />
                        <span style={{ fontSize: 13, color: "#374151" }}>
                          {district.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Districts Display */}
              {selectedDistricts.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      marginBottom: 8,
                      fontWeight: 500,
                    }}
                  >
                    Đã chọn ({selectedDistricts.length}):
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      padding: 8,
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      background: "#f9fafb",
                      minHeight: 40,
                    }}
                  >
                    {selectedDistricts.map((district) => (
                      <span
                        key={district}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 10px",
                          background: "#10b981",
                          color: "#fff",
                          borderRadius: 16,
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {district}
                        <button
                          type="button"
                          onClick={() => handleRemoveDistrict(district)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#fff",
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            fontSize: 14,
                            lineHeight: 1,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = "0.7";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = "1";
                          }}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!selectedProvince && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                    fontStyle: "italic",
                  }}
                >
                  Chọn tỉnh/thành phố để hiển thị danh sách quận/huyện
                </div>
              )}
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 13,
                  color: "#374151",
                  fontWeight: 600,
                }}
              >
                Số lượt sử dụng tối đa (tùy chọn)
              </label>
              <input
                name="maxUsage"
                type="number"
                defaultValue={promotion?.maxUsage || ""}
                min="1"
                placeholder="Để trống nếu không giới hạn"
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 14,
                }}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 24,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
                background: "#fff",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              style={{
                padding: "10px 20px",
                background: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {isEdit ? "Cập nhật" : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromotionAddEditModal;


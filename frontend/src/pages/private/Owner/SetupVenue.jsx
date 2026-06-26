import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  MapPin,
  Phone,
  Clock,
  Camera,
  Upload,
  Save,
  X,
  FileText,
  Building2,
  ScrollText,
  CircleDot,
  Target,
  Loader,
} from "lucide-react";
import { facilityApi } from "../../../api/facilityApi";
import { getProvinces } from "../../../api/provinceApi";
import { categoryApi } from "../../../api/categoryApi";

const SetupVenue = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", // Tên cơ sở
    address: "", // Địa chỉ chi tiết (số nhà, tên đường)
    city: "", // Tỉnh/Thành phố
    district: "", // Quận/Huyện
    phoneNumber: "", // Số điện thoại
    priceRange: {
      min: "", // Giá tối thiểu
      max: "", // Giá tối đa
    },
    timeSlotDuration: 60, // Khung giờ: 30 hoặc 60 phút (mặc định 60)
    types: [], // Mảng các loại cơ sở (required, ít nhất 1 loại)
    description: "", // Mô tả
    services: [], // Tiện ích
    operatingHours: {
      monday: { isOpen: true, open: "06:00", close: "22:00" },
      tuesday: { isOpen: true, open: "06:00", close: "22:00" },
      wednesday: { isOpen: true, open: "06:00", close: "22:00" },
      thursday: { isOpen: true, open: "06:00", close: "22:00" },
      friday: { isOpen: true, open: "06:00", close: "22:00" },
      saturday: { isOpen: true, open: "06:00", close: "22:00" },
      sunday: { isOpen: true, open: "06:00", close: "22:00" },
    },
  });

  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [sportCategories, setSportCategories] = useState([]); // Danh sách loại sân từ API
  const [loadingSportCategories, setLoadingSportCategories] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [customService, setCustomService] = useState(""); // Input cho tiện ích tùy chỉnh
  const [customServices, setCustomServices] = useState([]); // Danh sách tiện ích custom đã thêm

  const facilities = [
    "Nhà tắm",
    "Phòng thay đồ",
    "Căng tin",
    "Bãi đỗ xe",
    "WiFi",
    "Điều hòa",
    "Nhân viên",
    "An ninh 24/7",
  ];

  // Fetch provinces data from API
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
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
        console.error("Error fetching provinces:", error);
        setProvinces([]);
        toast.error('Không thể tải danh sách tỉnh thành. Vui lòng thử lại sau.');
      }
    };
    fetchProvinces();
  }, []);

  // Fetch sport categories from API (do admin thêm vào)
  useEffect(() => {
    const fetchSportCategories = async () => {
      setLoadingSportCategories(true);
      try {
        const result = await categoryApi.getSportCategories({ status: 'active' });
        
        if (result.success && result.data && result.data.length > 0) {
          // Lấy tên của các sport categories
          const categoryNames = result.data.map(cat => cat.name);
          setSportCategories(categoryNames);
        } else {
          console.warn('No sport categories received');
          setSportCategories([]);
          toast.warning('Không có loại sân thể thao nào. Vui lòng liên hệ admin.');
        }
      } catch (error) {
        console.error("Error fetching sport categories:", error);
        setSportCategories([]);
        toast.error('Không thể tải danh sách loại sân. Vui lòng thử lại sau.');
      } finally {
        setLoadingSportCategories(false);
      }
    };
    fetchSportCategories();
  }, []);

  // Fetch districts when city/province changes
  useEffect(() => {
    if (formData.city && provinces.length > 0) {
      const province = provinces.find((p) => p.name === formData.city);
      if (province && province.districts) {
        setDistricts(province.districts);
      } else {
        setDistricts([]);
      }
    } else {
      setDistricts([]);
    }
  }, [formData.city, provinces]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Reset district when city changes
      if (name === "city") {
        updated.district = "";
      }
      return updated;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePriceRangeChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        [field]: value,
      },
    }));
    if (errors.priceRange) {
      setErrors((prev) => ({ ...prev, priceRange: "" }));
    }
  };

  const handleCheckbox = (field, value) => {
    setFormData((prev) => {
      const currentArray = prev[field] || [];
      if (currentArray.includes(value)) {
        return {
          ...prev,
          [field]: currentArray.filter((item) => item !== value),
        };
      }
      return { ...prev, [field]: [...currentArray, value] };
    });
  };

  const handleAddCustomService = () => {
    if (customService.trim()) {
      const trimmedService = customService.trim();
      // Kiểm tra xem đã có trong danh sách chưa (cả preset và custom)
      if (
        !formData.services.includes(trimmedService) &&
        !customServices.includes(trimmedService)
      ) {
        setCustomServices((prev) => [...prev, trimmedService]);
        setFormData((prev) => ({
          ...prev,
          services: [...prev.services, trimmedService],
        }));
        setCustomService("");
      } else {
        toast.warning("Tiện ích này đã được thêm");
      }
    }
  };

  const handleRemoveCustomService = (service) => {
    setCustomServices((prev) => prev.filter((s) => s !== service));
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s !== service),
    }));
  };

  const handleOperatingHoursChange = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: field === "isOpen" ? value : value,
        },
      },
    }));
  };

  const applyToAllDays = (field, value) => {
    setFormData((prev) => {
      const updatedHours = { ...prev.operatingHours };
      Object.keys(updatedHours).forEach((day) => {
        updatedHours[day] = {
          ...updatedHours[day],
          [field]: field === "isOpen" ? value : value,
        };
      });
      return {
        ...prev,
        operatingHours: updatedHours,
      };
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = 5 - images.length;
    if (files.length > remainingSlots) {
      toast.warning(`Chỉ có thể tải lên tối đa ${remainingSlots} ảnh`);
      files.splice(remainingSlots);
    }
    setImages((prev) => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Tính toán tiến trình hoàn thành
  const calculateProgress = () => {
    const steps = [
      // Thông tin cơ bản (40%)
      {
        weight: 40,
        completed: 
          formData.name.trim() !== "" &&
          formData.address.trim() !== "" &&
          formData.city.trim() !== "" &&
          formData.district.trim() !== "" &&
          formData.types.length > 0 &&
          formData.priceRange.min !== "" &&
          formData.priceRange.max !== "" &&
          !isNaN(formData.priceRange.min) &&
          !isNaN(formData.priceRange.max) &&
          parseFloat(formData.priceRange.min) >= 0 &&
          parseFloat(formData.priceRange.max) >= 0 &&
          parseFloat(formData.priceRange.max) >= parseFloat(formData.priceRange.min)
      },
      // Thông tin liên hệ (15%)
      {
        weight: 15,
        completed: formData.phoneNumber.trim() !== "" && /^[0-9]{10,11}$/.test(formData.phoneNumber)
      },
      // Mô tả (15%)
      {
        weight: 15,
        completed: formData.description.trim() !== ""
      },
      // Tiện ích (10% - tùy chọn nhưng có điểm)
      {
        weight: 10,
        completed: formData.services.length > 0
      },
      // Giờ hoạt động (15% - kiểm tra ít nhất 1 ngày mở cửa)
      {
        weight: 15,
        completed: Object.values(formData.operatingHours).some(day => day.isOpen)
      },
      // Hình ảnh (5% - tùy chọn)
      {
        weight: 5,
        completed: images.length > 0
      }
    ];

    const totalWeight = steps.reduce((sum, step) => sum + step.weight, 0);
    const completedWeight = steps.reduce((sum, step) => sum + (step.completed ? step.weight : 0), 0);
    
    return Math.round((completedWeight / totalWeight) * 100);
  };

  const progress = calculateProgress();

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Vui lòng nhập tên cơ sở";
    if (!formData.address.trim()) newErrors.address = "Vui lòng nhập địa chỉ";
    if (!formData.city.trim()) newErrors.city = "Vui lòng chọn Tỉnh/Thành phố";
    if (!formData.district.trim())
      newErrors.district = "Vui lòng chọn Quận/Huyện";
    if (!formData.phoneNumber.trim())
      newErrors.phoneNumber = "Vui lòng nhập số điện thoại";
    if (!/^[0-9]{10,11}$/.test(formData.phoneNumber))
      newErrors.phoneNumber = "Số điện thoại phải có 10-11 chữ số";
    if (!formData.types || formData.types.length === 0)
      newErrors.types = "Vui lòng chọn ít nhất một loại cơ sở";
    if (!formData.priceRange.min || formData.priceRange.min === "")
      newErrors.priceRange = "Vui lòng nhập giá tối thiểu";
    else if (isNaN(formData.priceRange.min) || parseFloat(formData.priceRange.min) < 0)
      newErrors.priceRange = "Giá tối thiểu phải là số và lớn hơn hoặc bằng 0";
    else if (!formData.priceRange.max || formData.priceRange.max === "")
      newErrors.priceRange = "Vui lòng nhập giá tối đa";
    else if (isNaN(formData.priceRange.max) || parseFloat(formData.priceRange.max) < 0)
      newErrors.priceRange = "Giá tối đa phải là số và lớn hơn hoặc bằng 0";
    else if (parseFloat(formData.priceRange.max) < parseFloat(formData.priceRange.min))
      newErrors.priceRange = "Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu";
    if (!formData.description.trim())
      newErrors.description = "Vui lòng nhập mô tả";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Upload images to Cloudinary
  const uploadImagesToCloudinary = async (facilityId) => {
    if (images.length === 0) return [];

    setUploadingImages(true);

    try {
      const result = await facilityApi.uploadImages(facilityId, images);
      return result.data?.images || [];
    } catch (error) {
      console.error("Error uploading images:", error);
      const errorMessage = error.message || "Có lỗi khi upload ảnh. Bạn có thể upload ảnh sau trong trang quản lý cơ sở.";
      toast.error(errorMessage);
      throw error; // Re-throw để caller biết có lỗi
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setLoading(true);

    try {
      // Ghép địa chỉ đầy đủ
      const fullAddress = `${formData.address}, ${formData.district}, ${formData.city}`;

      // Chuẩn bị dữ liệu để gửi API
      const facilityData = {
        name: formData.name.trim(),
        address: fullAddress,
        types: formData.types, // Mảng các loại cơ sở
        phoneNumber: formData.phoneNumber.trim(),
        priceRange: {
          min: parseFloat(formData.priceRange.min),
          max: parseFloat(formData.priceRange.max),
        },
        timeSlotDuration: formData.timeSlotDuration, // Khung giờ: 30 hoặc 60 phút
        description: formData.description.trim(),
        services: formData.services.length > 0 ? formData.services : undefined,
        operatingHours: formData.operatingHours,
        // images sẽ upload sau khi tạo facility
      };

      console.log("Creating facility with data:", facilityData);

      // Gọi API tạo facility
      const result = await facilityApi.createFacility(facilityData);

      console.log("Facility creation response:", result);

      if (result.success && result.data) {
        const facility = result.data;
        const facilityId = facility._id || facility.id;
        
        console.log("Facility created successfully:", facilityId);
        toast.success(result.message || "Tạo cơ sở thành công!");

        // Upload ảnh nếu có
        if (images.length > 0 && facilityId) {
          try {
            await uploadImagesToCloudinary(facilityId);
            toast.success("Upload ảnh thành công!");
          } catch (uploadError) {
            // Lỗi upload ảnh không ngăn chặn việc redirect
            // Owner có thể upload ảnh sau
            console.error("Failed to upload images:", uploadError);
          }
        }

        // Redirect về owner panel
        setTimeout(() => {
          navigate("/owner");
        }, 1000);
      } else {
        throw new Error(result.message || "Có lỗi xảy ra khi tạo cơ sở");
      }
    } catch (error) {
      console.error("Error creating facility:", error);
      
      // Xử lý lỗi từ handleApiError
      let errorMessage = "Có lỗi xảy ra khi tạo cơ sở";
      
      if (error.status === 0) {
        // Network error
        errorMessage = "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.";
      } else {
        errorMessage = error.message || errorMessage;
        
        // Hiển thị lỗi validation nếu có
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
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              background: "linear-gradient(135deg, #10b981, #059669)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            <Building2 size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>
              Thiết lập cơ sở của bạn
            </h1>
            <p style={{ color: "#6b7280", margin: "4px 0 0 0" }}>
              Nhập thông tin cơ sở để bắt đầu quản lý
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: 8
          }}>
            <span style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: "#6b7280" 
            }}>
              Tiến trình hoàn thành
            </span>
            <span style={{ 
              fontSize: 14, 
              fontWeight: 700, 
              color: "#10b981" 
            }}>
              {progress}%
            </span>
          </div>
          <div
            style={{
              background: "#e5e7eb",
              height: 8,
              borderRadius: 4,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                height: "100%",
                width: `${progress}%`,
                transition: "width 0.4s ease",
                borderRadius: 4,
              }}
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Thông tin cơ bản */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 6px 20px rgba(0,0,0,.06)",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FileText size={20} color="#3b82f6" /> Thông tin cơ bản
          </h2>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 600,
                color: errors.name ? "#ef4444" : "#374151",
              }}
            >
              Tên cơ sở *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="VD: Sân bóng đá ABC"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 10,
                border: `2px solid ${errors.name ? "#ef4444" : "#e5e7eb"}`,
                fontSize: 15,
                transition: "border-color 0.2s",
              }}
            />
            {errors.name && (
              <div style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>
                {errors.name}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 600,
                color: errors.address ? "#ef4444" : "#374151",
              }}
            >
              Địa chỉ chi tiết *
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Số nhà, tên đường"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 10,
                border: `2px solid ${errors.address ? "#ef4444" : "#e5e7eb"}`,
                fontSize: 15,
                transition: "border-color 0.2s",
              }}
            />
            {errors.address && (
              <div style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>
                {errors.address}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 600,
                  color: errors.city ? "#ef4444" : "#374151",
                }}
              >
                Thành phố/Tỉnh *
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `2px solid ${errors.city ? "#ef4444" : "#e5e7eb"}`,
                  fontSize: 15,
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  backgroundSize: "16px",
                  paddingRight: "40px",
                }}
              >
                <option value="">Chọn Tỉnh/Thành phố</option>
                {provinces.map((province) => (
                  <option key={province.code} value={province.name}>
                    {province.name}
                  </option>
                ))}
              </select>
              {errors.city && (
                <div style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>
                  {errors.city}
                </div>
              )}
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 600,
                  color: errors.district ? "#ef4444" : "#374151",
                }}
              >
                Quận/Huyện *
              </label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                disabled={!formData.city}
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `2px solid ${errors.district ? "#ef4444" : "#e5e7eb"}`,
                  fontSize: 15,
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  backgroundSize: "16px",
                  paddingRight: "40px",
                  opacity: formData.city ? 1 : 0.6,
                  cursor: formData.city ? "pointer" : "not-allowed",
                }}
              >
                <option value="">Chọn Quận/Huyện</option>
                {districts.map((district) => (
                  <option key={district.code} value={district.name}>
                    {district.name}
                  </option>
                ))}
              </select>
              {errors.district && (
                <div style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>
                  {errors.district}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 600,
                color: errors.priceRange ? "#ef4444" : "#374151",
              }}
            >
              Khoảng giá (VNĐ) *
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#6b7280" }}>
                  Giá tối thiểu
                </label>
                <input
                  type="number"
                  value={formData.priceRange.min}
                  onChange={(e) => handlePriceRangeChange("min", e.target.value)}
                  placeholder="VD: 1050"
                  min="0"
                  step="1000"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: `2px solid ${errors.priceRange ? "#ef4444" : "#e5e7eb"}`,
                    fontSize: 15,
                    transition: "border-color 0.2s",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#6b7280" }}>
                  Giá tối đa
                </label>
                <input
                  type="number"
                  value={formData.priceRange.max}
                  onChange={(e) => handlePriceRangeChange("max", e.target.value)}
                  placeholder="VD: 10500"
                  min="0"
                  step="1000"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: `2px solid ${errors.priceRange ? "#ef4444" : "#e5e7eb"}`,
                    fontSize: 15,
                    transition: "border-color 0.2s",
                  }}
                />
              </div>
            </div>
            {errors.priceRange && (
              <div style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>
                {errors.priceRange}
              </div>
            )}
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              Khoảng giá cho mỗi khung giờ (đơn vị: VNĐ). Sẽ hiển thị dạng "X - Y VND/khung giờ"
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 600,
                color: "#374151",
              }}
            >
              Khung giờ đặt sân *
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "16px",
                  border: `2px solid ${
                    formData.timeSlotDuration === 30 ? "#3b82f6" : "#e5e7eb"
                  }`,
                  borderRadius: 10,
                  cursor: "pointer",
                  background:
                    formData.timeSlotDuration === 30 ? "#dbeafe" : "#fff",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (formData.timeSlotDuration !== 30) {
                    e.currentTarget.style.borderColor = "#9ca3af";
                  }
                }}
                onMouseLeave={(e) => {
                  if (formData.timeSlotDuration !== 30) {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }
                }}
              >
                <input
                  type="radio"
                  name="timeSlotDuration"
                  value={30}
                  checked={formData.timeSlotDuration === 30}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      timeSlotDuration: parseInt(e.target.value),
                    }))
                  }
                  style={{
                    width: 18,
                    height: 18,
                    cursor: "pointer",
                    accentColor: "#3b82f6",
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: formData.timeSlotDuration === 30 ? 600 : 400,
                      color:
                        formData.timeSlotDuration === 30 ? "#1e40af" : "#374151",
                    }}
                  >
                    30 phút
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      marginTop: 2,
                    }}
                  >
                    Khách đặt sân theo khung 30 phút
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "16px",
                  border: `2px solid ${
                    formData.timeSlotDuration === 60 ? "#3b82f6" : "#e5e7eb"
                  }`,
                  borderRadius: 10,
                  cursor: "pointer",
                  background:
                    formData.timeSlotDuration === 60 ? "#dbeafe" : "#fff",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (formData.timeSlotDuration !== 60) {
                    e.currentTarget.style.borderColor = "#9ca3af";
                  }
                }}
                onMouseLeave={(e) => {
                  if (formData.timeSlotDuration !== 60) {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }
                }}
              >
                <input
                  type="radio"
                  name="timeSlotDuration"
                  value={60}
                  checked={formData.timeSlotDuration === 60}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      timeSlotDuration: parseInt(e.target.value),
                    }))
                  }
                  style={{
                    width: 18,
                    height: 18,
                    cursor: "pointer",
                    accentColor: "#3b82f6",
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: formData.timeSlotDuration === 60 ? 600 : 400,
                      color:
                        formData.timeSlotDuration === 60 ? "#1e40af" : "#374151",
                    }}
                  >
                    1 giờ
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      marginTop: 2,
                    }}
                  >
                    Khách đặt sân theo khung 1 giờ
                  </div>
                </div>
              </label>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              Chọn khung giờ mà khách hàng có thể đặt sân (30 phút hoặc 1 giờ)
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label
              style={{
                display: "block",
                marginBottom: 12,
                fontWeight: 600,
                color: errors.types ? "#ef4444" : "#374151",
              }}
            >
              Loại cơ sở * (có thể chọn nhiều loại)
            </label>
            {loadingSportCategories ? (
              <div
                style={{
                  padding: "24px",
                  textAlign: "center",
                  borderRadius: 10,
                  border: "2px solid #e5e7eb",
                  backgroundColor: "#f9fafb",
                  color: "#6b7280",
                }}
              >
                <Loader size={20} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
                <div>Đang tải danh sách loại sân...</div>
              </div>
            ) : sportCategories.length === 0 ? (
              <div
                style={{
                  padding: "24px",
                  textAlign: "center",
                  borderRadius: 10,
                  border: "2px solid #fef3c7",
                  backgroundColor: "#fef3c7",
                  color: "#92400e",
                }}
              >
                Không có loại sân thể thao nào. Vui lòng liên hệ admin để thêm loại sân.
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: 12,
                    padding: "16px",
                    borderRadius: 10,
                    border: `2px solid ${errors.types ? "#ef4444" : "#e5e7eb"}`,
                    backgroundColor: "#f9fafb",
                  }}
                >
                  {sportCategories.map((categoryName) => (
                    <label
                      key={categoryName}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        padding: "8px 12px",
                        borderRadius: 8,
                        backgroundColor: formData.types.includes(categoryName) ? "#dbeafe" : "#fff",
                        border: `2px solid ${formData.types.includes(categoryName) ? "#3b82f6" : "#e5e7eb"}`,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (!formData.types.includes(categoryName)) {
                          e.currentTarget.style.borderColor = "#9ca3af";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!formData.types.includes(categoryName)) {
                          e.currentTarget.style.borderColor = "#e5e7eb";
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.types.includes(categoryName)}
                        onChange={() => handleCheckbox("types", categoryName)}
                        style={{
                          width: 18,
                          height: 18,
                          cursor: "pointer",
                          accentColor: "#3b82f6",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: formData.types.includes(categoryName) ? 600 : 400,
                          color: formData.types.includes(categoryName) ? "#1e40af" : "#374151",
                        }}
                      >
                        {categoryName}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.types && (
                  <div style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>
                    {errors.types}
                  </div>
                )}
                {formData.types.length > 0 && (
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                    Đã chọn: {formData.types.join(", ")}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Liên hệ */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 6px 20px rgba(0,0,0,.06)",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Phone size={20} color="#059669" /> Thông tin liên hệ
          </h2>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 600,
                color: errors.phoneNumber ? "#ef4444" : "#374151",
              }}
            >
              Số điện thoại *
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="VD: 0901234567"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 10,
                border: `2px solid ${errors.phoneNumber ? "#ef4444" : "#e5e7eb"}`,
                fontSize: 15,
              }}
            />
            {errors.phoneNumber && (
              <div style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>
                {errors.phoneNumber}
              </div>
            )}
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              Số điện thoại liên hệ của cơ sở (10-11 chữ số)
            </div>
          </div>
        </div>

        {/* Mô tả */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 6px 20px rgba(0,0,0,.06)",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <ScrollText size={20} color="#7c3aed" /> Mô tả cơ sở
          </h2>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 600,
                color: errors.description ? "#ef4444" : "#374151",
              }}
            >
              Mô tả chi tiết *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả về cơ sở của bạn..."
              rows={4}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 10,
                border: `2px solid ${errors.description ? "#ef4444" : "#e5e7eb"}`,
                fontSize: 15,
                resize: "vertical",
              }}
            />
            {errors.description && (
              <div style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>
                {errors.description}
              </div>
            )}
          </div>
        </div>

        {/* Tiện ích */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 6px 20px rgba(0,0,0,.06)",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Target size={20} color="#10b981" /> Tiện ích
          </h2>

          {/* Tiện ích có sẵn */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                marginBottom: 12,
                fontSize: 14,
                fontWeight: 600,
                color: "#6b7280",
              }}
            >
              Tiện ích có sẵn
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              {facilities.map((facility) => (
                <label
                  key={facility}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px",
                    border: `2px solid ${
                      formData.services.includes(facility) ? "#10b981" : "#e5e7eb"
                    }`,
                    borderRadius: 10,
                    cursor: "pointer",
                    background: formData.services.includes(facility)
                      ? "#f0fdf4"
                      : "#fff",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.services.includes(facility)}
                    onChange={() => handleCheckbox("services", facility)}
                    style={{ margin: 0 }}
                  />
                  <span>{facility}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Thêm tiện ích tùy chỉnh */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                marginBottom: 12,
                fontSize: 14,
                fontWeight: 600,
                color: "#6b7280",
              }}
            >
              Thêm tiện ích khác
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={customService}
                onChange={(e) => setCustomService(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomService();
                  }
                }}
                placeholder="Nhập tên tiện ích và nhấn Enter hoặc nút Thêm"
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "2px solid #e5e7eb",
                  fontSize: 15,
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomService}
                disabled={!customService.trim()}
                style={{
                  padding: "12px 24px",
                  background: customService.trim()
                    ? "linear-gradient(135deg, #10b981, #059669)"
                    : "#e5e7eb",
                  color: customService.trim() ? "#fff" : "#9ca3af",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: customService.trim() ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                Thêm
              </button>
            </div>
          </div>

          {/* Hiển thị tiện ích custom đã thêm */}
          {customServices.length > 0 && (
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#6b7280",
                }}
              >
                Tiện ích tùy chỉnh đã thêm
              </label>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {customServices.map((service) => (
                  <div
                    key={service}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      background: "#f0fdf4",
                      border: "2px solid #10b981",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#059669",
                    }}
                  >
                    <span>{service}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomService(service)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 2,
                        display: "flex",
                        alignItems: "center",
                        color: "#059669",
                      }}
                      title="Xóa"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Giờ hoạt động */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 6px 20px rgba(0,0,0,.06)",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Clock size={20} color="#f59e0b" /> Giờ hoạt động
          </h2>

          {/* Áp dụng cho tất cả các ngày */}
          <div
            style={{
              marginBottom: 20,
              padding: 16,
              background: "#fef3c7",
              borderRadius: 10,
              border: "1px solid #fde68a",
            }}
          >
            <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 600, color: "#92400e" }}>
              Áp dụng cho tất cả các ngày
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => applyToAllDays("isOpen", true)}
                style={{
                  padding: "8px 16px",
                  background: "#fbbf24",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Mở cửa tất cả
              </button>
              <button
                type="button"
                onClick={() => applyToAllDays("isOpen", false)}
                style={{
                  padding: "8px 16px",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Đóng cửa tất cả
              </button>
              <input
                type="time"
                onChange={(e) => applyToAllDays("open", e.target.value)}
                defaultValue="06:00"
                style={{
                  padding: "8px 12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <span style={{ display: "flex", alignItems: "center", fontSize: 13, color: "#6b7280" }}>
                đến
              </span>
              <input
                type="time"
                onChange={(e) => applyToAllDays("close", e.target.value)}
                defaultValue="22:00"
                style={{
                  padding: "8px 12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
            </div>
          </div>

          {/* Danh sách các ngày */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { key: "monday", label: "Thứ Hai" },
              { key: "tuesday", label: "Thứ Ba" },
              { key: "wednesday", label: "Thứ Tư" },
              { key: "thursday", label: "Thứ Năm" },
              { key: "friday", label: "Thứ Sáu" },
              { key: "saturday", label: "Thứ Bảy" },
              { key: "sunday", label: "Chủ Nhật" },
            ].map((day) => (
              <div
                key={day.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: 16,
                  background: formData.operatingHours[day.key].isOpen
                    ? "#f0fdf4"
                    : "#f9fafb",
                  borderRadius: 10,
                  border: `2px solid ${
                    formData.operatingHours[day.key].isOpen ? "#10b981" : "#e5e7eb"
                  }`,
                }}
              >
                <div style={{ minWidth: 100, fontWeight: 600, color: "#374151" }}>
                  {day.label}
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.operatingHours[day.key].isOpen}
                    onChange={(e) =>
                      handleOperatingHoursChange(day.key, "isOpen", e.target.checked)
                    }
                    style={{
                      width: 18,
                      height: 18,
                      cursor: "pointer",
                    }}
                  />
                  <span style={{ fontSize: 14, color: "#6b7280" }}>
                    {formData.operatingHours[day.key].isOpen ? "Mở cửa" : "Đóng cửa"}
                  </span>
                </label>
                {formData.operatingHours[day.key].isOpen && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginLeft: "auto",
                    }}
                  >
                    <input
                      type="time"
                      value={formData.operatingHours[day.key].open}
                      onChange={(e) =>
                        handleOperatingHoursChange(day.key, "open", e.target.value)
                      }
                      style={{
                        padding: "8px 12px",
                        border: "2px solid #e5e7eb",
                        borderRadius: 8,
                        fontSize: 14,
                        background: "#fff",
                      }}
                    />
                    <span style={{ fontSize: 14, color: "#6b7280" }}>đến</span>
                    <input
                      type="time"
                      value={formData.operatingHours[day.key].close}
                      onChange={(e) =>
                        handleOperatingHoursChange(day.key, "close", e.target.value)
                      }
                      style={{
                        padding: "8px 12px",
                        border: "2px solid #e5e7eb",
                        borderRadius: 8,
                        fontSize: 14,
                        background: "#fff",
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hình ảnh */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 6px 20px rgba(0,0,0,.06)",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Camera size={20} color="#ef4444" /> Hình ảnh cơ sở (Tối đa 5 ảnh)
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: 16,
            }}
          >
            {images.map((image, index) => (
              <div key={index} style={{ position: "relative" }}>
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Upload ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: 10,
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 28,
                    height: 28,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            {images.length < 5 && (
              <label
                style={{
                  border: "2px dashed #cbd5e1",
                  borderRadius: 10,
                  padding: "40px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "#f9fafb",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s",
                }}
              >
                <Upload size={32} color="#9ca3af" />
                <span style={{ color: "#6b7280", fontSize: 14 }}>
                  Tải ảnh lên
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
              </label>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
            Ảnh sẽ được upload sau khi tạo cơ sở thành công
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ display: "flex", gap: 16, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => navigate("/owner")}
            disabled={loading}
            style={{
              padding: "14px 32px",
              background: "#fff",
              color: "#374151",
              border: "2px solid #e5e7eb",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: loading ? 0.5 : 1,
            }}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading || uploadingImages}
            style={{
              padding: "14px 32px",
              background:
                loading || uploadingImages
                  ? "#9ca3af"
                  : "linear-gradient(135deg, #10b981, #059669)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading || uploadingImages ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s",
              boxShadow:
                loading || uploadingImages
                  ? "none"
                  : "0 4px 12px rgba(16, 185, 129, 0.3)",
            }}
          >
            {loading || uploadingImages ? (
              <>
                <Loader size={20} style={{ animation: "spin 1s linear infinite" }} />
                {uploadingImages ? "Đang upload ảnh..." : "Đang tạo cơ sở..."}
              </>
            ) : (
              <>
                <Save size={20} />
                Lưu & Tiếp tục
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
  );
};

export default SetupVenue;

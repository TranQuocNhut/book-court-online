import React, { useState, useEffect } from "react";
import { Save, RefreshCw, Loader, CreditCard, Plus, X, Trophy } from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import { facilityApi } from "../../../../api/facilityApi";
import { userApi } from "../../../../api/userApi";
import { categoryApi } from "../../../../api/categoryApi";
import { toast } from "react-toastify";

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [facilityId, setFacilityId] = useState(null);
  const [settings, setSettings] = useState({
    facilityName: "",
    facilityDescription: "",
    contactPhone: "",
    address: "",
    priceRange: {
      min: "",
      max: "",
    },
    timeSlotDuration: 60,
    operatingHours: {
      monday: { isOpen: true, open: "06:00", close: "22:00" },
      tuesday: { isOpen: true, open: "06:00", close: "22:00" },
      wednesday: { isOpen: true, open: "06:00", close: "22:00" },
      thursday: { isOpen: true, open: "06:00", close: "22:00" },
      friday: { isOpen: true, open: "06:00", close: "22:00" },
      saturday: { isOpen: true, open: "06:00", close: "22:00" },
      sunday: { isOpen: true, open: "06:00", close: "22:00" },
    },
    autoConfirm: false,
    emailNotifications: true,
    smsNotifications: false,
    maintenanceMode: false,
  });

  const [activeTab, setActiveTab] = useState("general");
  const [bankAccount, setBankAccount] = useState({
    accountNumber: "",
    accountName: "",
    bankCode: "",
    bankName: "",
  });
  const [bankAccountLoading, setBankAccountLoading] = useState(false);
  
  // Sport categories management
  const [sportCategories, setSportCategories] = useState([]); // Available sport categories from admin
  const [facilitySports, setFacilitySports] = useState([]); // Sports currently in facility
  const [newSportInput, setNewSportInput] = useState(""); // Input for adding new sport
  const [selectedSportCategory, setSelectedSportCategory] = useState(""); // Selected from dropdown
  const [loadingSports, setLoadingSports] = useState(false);
  const [savingSports, setSavingSports] = useState(false);
  
  // Bank list
  const banks = [
    { code: "VCB", name: "Vietcombank" },
    { code: "TCB", name: "Techcombank" },
    { code: "VTB", name: "Vietinbank" },
    { code: "ACB", name: "ACB" },
    { code: "TPB", name: "TPBank" },
    { code: "VPB", name: "VPBank" },
    { code: "MSB", name: "Maritime Bank" },
    { code: "HDB", name: "HDBank" },
    { code: "VIB", name: "VIB" },
    { code: "SHB", name: "SHB" },
    { code: "EIB", name: "Eximbank" },
    { code: "BID", name: "BIDV" },
    { code: "MBB", name: "MBBank" },
    { code: "STB", name: "Sacombank" },
  ];

  // Fetch facility data
  useEffect(() => {
    const fetchFacility = async () => {
      if (!user?._id) return;
      
      setLoading(true);
      try {
        const ownerId = user._id || user.id;
        const result = await facilityApi.getFacilities({ ownerId, limit: 1 });
        
        if (result.success) {
          const facilities = result.data?.facilities || result.data || [];
          if (facilities.length > 0) {
            const facility = facilities[0];
            const facilityIdValue = facility._id || facility.id;
            setFacilityId(facilityIdValue);
            
            // Load operating hours from facility
            const defaultOperatingHours = {
              monday: { isOpen: true, open: "06:00", close: "22:00" },
              tuesday: { isOpen: true, open: "06:00", close: "22:00" },
              wednesday: { isOpen: true, open: "06:00", close: "22:00" },
              thursday: { isOpen: true, open: "06:00", close: "22:00" },
              friday: { isOpen: true, open: "06:00", close: "22:00" },
              saturday: { isOpen: true, open: "06:00", close: "22:00" },
              sunday: { isOpen: true, open: "06:00", close: "22:00" },
            };
            
            const operatingHours = facility.operatingHours || defaultOperatingHours;
            
            setSettings({
              facilityName: facility.name || "",
              facilityDescription: facility.description || "",
              contactPhone: facility.phoneNumber || "",
              address: facility.address || "",
              priceRange: {
                min: facility.priceRange?.min || facility.pricePerHour || "",
                max: facility.priceRange?.max || facility.pricePerHour || "",
              },
              timeSlotDuration: facility.timeSlotDuration || 60,
              operatingHours: {
                monday: operatingHours.monday || defaultOperatingHours.monday,
                tuesday: operatingHours.tuesday || defaultOperatingHours.tuesday,
                wednesday: operatingHours.wednesday || defaultOperatingHours.wednesday,
                thursday: operatingHours.thursday || defaultOperatingHours.thursday,
                friday: operatingHours.friday || defaultOperatingHours.friday,
                saturday: operatingHours.saturday || defaultOperatingHours.saturday,
                sunday: operatingHours.sunday || defaultOperatingHours.sunday,
              },
              autoConfirm: false,
              emailNotifications: true,
              smsNotifications: false,
              maintenanceMode: facility.status === "maintenance",
            });
            
            // Load facility sports
            if (facility.types && Array.isArray(facility.types)) {
              setFacilitySports(facility.types);
            }
          } else {
            toast.warning("Bạn chưa có cơ sở nào. Vui lòng tạo cơ sở trước.");
          }
        }
      } catch (error) {
        console.error("Error fetching facility:", error);
        toast.error("Không thể tải thông tin cơ sở");
      } finally {
        setLoading(false);
      }
    };

    fetchFacility();
  }, [user]);

  // Fetch bank account
  useEffect(() => {
    const fetchBankAccount = async () => {
      if (!user?._id || user.role !== "owner") return;
      try {
        setBankAccountLoading(true);
        const result = await userApi.getBankAccount();
        if (result.success && result.data.bankAccount) {
          setBankAccount(result.data.bankAccount);
        }
      } catch (error) {
        console.error("Error fetching bank account:", error);
      } finally {
        setBankAccountLoading(false);
      }
    };
    fetchBankAccount();
  }, [user]);

  // Fetch available sport categories
  useEffect(() => {
    const fetchSportCategories = async () => {
      try {
        setLoadingSports(true);
        const result = await categoryApi.getSportCategories({ status: "active" });
        if (result.success && result.data) {
          setSportCategories(Array.isArray(result.data) ? result.data : []);
        }
      } catch (error) {
        console.error("Error fetching sport categories:", error);
        toast.error("Không thể tải danh sách môn thể thao");
      } finally {
        setLoadingSports(false);
      }
    };
    fetchSportCategories();
  }, []);

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOperatingHoursChange = (day, field, value) => {
    setSettings(prev => ({
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
    setSettings(prev => {
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

  const handleSave = async () => {
    if (!facilityId) {
      toast.error("Không tìm thấy cơ sở để cập nhật");
      return;
    }

    // Validate required fields
    if (!settings.facilityName.trim()) {
      toast.error("Vui lòng nhập tên cơ sở");
      return;
    }
    if (!settings.contactPhone.trim()) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }
    if (!settings.address.trim()) {
      toast.error("Vui lòng nhập địa chỉ");
      return;
    }
    if (!settings.priceRange.min || !settings.priceRange.max) {
      toast.error("Vui lòng nhập đầy đủ khoảng giá");
      return;
    }
    if (parseFloat(settings.priceRange.min) < 0 || parseFloat(settings.priceRange.max) < 0) {
      toast.error("Giá phải lớn hơn hoặc bằng 0");
      return;
    }
    if (parseFloat(settings.priceRange.max) < parseFloat(settings.priceRange.min)) {
      toast.error("Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu");
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        name: settings.facilityName.trim(),
        description: settings.facilityDescription.trim(),
        phoneNumber: settings.contactPhone.trim(),
        address: settings.address.trim(),
        priceRange: {
          min: parseFloat(settings.priceRange.min),
          max: parseFloat(settings.priceRange.max),
        },
        timeSlotDuration: settings.timeSlotDuration,
        operatingHours: settings.operatingHours,
        status: settings.maintenanceMode ? "maintenance" : "opening",
      };

      const result = await facilityApi.updateFacility(facilityId, updateData);
      
      if (result.success) {
        toast.success("Cập nhật thông tin cơ sở thành công!");
      } else {
        throw new Error(result.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error updating facility:", error);
      toast.error(error.message || "Không thể cập nhật thông tin cơ sở");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Bạn có chắc chắn muốn reset về dữ liệu ban đầu?")) {
      // Reload facility data
      window.location.reload();
    }
  };

  const renderGeneralSettings = () => {
    if (loading) {
      return (
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          minHeight: "400px",
          background: "#fff",
          borderRadius: 12,
          padding: 24
        }}>
          <div style={{ textAlign: "center" }}>
            <Loader size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <div style={{ color: "#6b7280" }}>Đang tải thông tin cơ sở...</div>
          </div>
        </div>
      );
    }

    if (!facilityId) {
      return (
        <div style={{ 
          background: "#fff", 
          borderRadius: 12, 
          padding: 24, 
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
          textAlign: "center"
        }}>
          <div style={{ color: "#6b7280", fontSize: 16 }}>
            Bạn chưa có cơ sở nào. Vui lòng tạo cơ sở trước khi cấu hình.
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: "grid", gap: 24 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 6px 20px rgba(0,0,0,.06)" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Thông tin cơ sở</h3>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Tên cơ sở *</label>
              <input
                type="text"
                value={settings.facilityName}
                onChange={(e) => handleInputChange("facilityName", e.target.value)}
                placeholder="Nhập tên cơ sở"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 14
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Mô tả cơ sở</label>
              <textarea
                value={settings.facilityDescription}
                onChange={(e) => handleInputChange("facilityDescription", e.target.value)}
                rows={3}
                placeholder="Nhập mô tả về cơ sở"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 14,
                  resize: "vertical"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Số điện thoại *</label>
              <input
                type="tel"
                value={settings.contactPhone}
                onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                placeholder="VD: 0901234567"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 14
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Khoảng giá (VNĐ) *</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#6b7280" }}>
                    Giá tối thiểu
                  </label>
                  <input
                    type="number"
                    value={settings.priceRange.min}
                    onChange={(e) => handleInputChange("priceRange", { ...settings.priceRange, min: e.target.value })}
                    placeholder="VD: 1050"
                    min="0"
                    step="1000"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      fontSize: 14
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#6b7280" }}>
                    Giá tối đa
                  </label>
                  <input
                    type="number"
                    value={settings.priceRange.max}
                    onChange={(e) => handleInputChange("priceRange", { ...settings.priceRange, max: e.target.value })}
                    placeholder="VD: 10500"
                    min="0"
                    step="1000"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      fontSize: 14
                    }}
                  />
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                Khoảng giá cho mỗi khung giờ. Sẽ hiển thị dạng "X - Y VND/khung giờ"
              </div>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Địa chỉ *</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Nhập địa chỉ cơ sở"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 14
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Khung giờ đặt sân *</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px",
                    border: `2px solid ${settings.timeSlotDuration === 30 ? "#3b82f6" : "#e5e7eb"}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    background: settings.timeSlotDuration === 30 ? "#dbeafe" : "#fff",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="radio"
                    name="timeSlotDuration"
                    value={30}
                    checked={settings.timeSlotDuration === 30}
                    onChange={(e) => handleInputChange("timeSlotDuration", parseInt(e.target.value))}
                    style={{
                      width: 18,
                      height: 18,
                      cursor: "pointer",
                      accentColor: "#3b82f6",
                    }}
                  />
                  <span style={{ fontWeight: settings.timeSlotDuration === 30 ? 600 : 400 }}>
                    30 phút
                  </span>
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px",
                    border: `2px solid ${settings.timeSlotDuration === 60 ? "#3b82f6" : "#e5e7eb"}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    background: settings.timeSlotDuration === 60 ? "#dbeafe" : "#fff",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="radio"
                    name="timeSlotDuration"
                    value={60}
                    checked={settings.timeSlotDuration === 60}
                    onChange={(e) => handleInputChange("timeSlotDuration", parseInt(e.target.value))}
                    style={{
                      width: 18,
                      height: 18,
                      cursor: "pointer",
                      accentColor: "#3b82f6",
                    }}
                  />
                  <span style={{ fontWeight: settings.timeSlotDuration === 60 ? 600 : 400 }}>
                    1 giờ
                  </span>
                </label>
              </div>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 12, fontWeight: 600 }}>Giờ hoạt động *</label>
              
              {/* Áp dụng cho tất cả các ngày */}
              <div
                style={{
                  marginBottom: 16,
                  padding: 12,
                  background: "#fef3c7",
                  borderRadius: 8,
                  border: "1px solid #fde68a",
                }}
              >
                <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: "#92400e" }}>
                  Áp dụng cho tất cả các ngày
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => applyToAllDays("isOpen", true)}
                    style={{
                      padding: "6px 12px",
                      background: "#fbbf24",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 12,
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
                      padding: "6px 12px",
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 12,
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
                      padding: "6px 10px",
                      border: "2px solid #e5e7eb",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                  <span style={{ fontSize: 12, color: "#6b7280" }}>đến</span>
                  <input
                    type="time"
                    onChange={(e) => applyToAllDays("close", e.target.value)}
                    defaultValue="22:00"
                    style={{
                      padding: "6px 10px",
                      border: "2px solid #e5e7eb",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                </div>
              </div>

              {/* Danh sách các ngày */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                      gap: 12,
                      padding: 12,
                      background: settings.operatingHours[day.key].isOpen
                        ? "#f0fdf4"
                        : "#f9fafb",
                      borderRadius: 8,
                      border: `2px solid ${
                        settings.operatingHours[day.key].isOpen ? "#10b981" : "#e5e7eb"
                      }`,
                    }}
                  >
                    <div style={{ minWidth: 90, fontWeight: 600, color: "#374151", fontSize: 14 }}>
                      {day.label}
                    </div>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={settings.operatingHours[day.key].isOpen}
                        onChange={(e) =>
                          handleOperatingHoursChange(day.key, "isOpen", e.target.checked)
                        }
                        style={{
                          width: 16,
                          height: 16,
                          cursor: "pointer",
                        }}
                      />
                      <span style={{ fontSize: 13, color: "#6b7280" }}>
                        {settings.operatingHours[day.key].isOpen ? "Mở cửa" : "Đóng cửa"}
                      </span>
                    </label>
                    {settings.operatingHours[day.key].isOpen && (
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
                          value={settings.operatingHours[day.key].open}
                          onChange={(e) =>
                            handleOperatingHoursChange(day.key, "open", e.target.value)
                          }
                          style={{
                            padding: "6px 10px",
                            border: "2px solid #e5e7eb",
                            borderRadius: 6,
                            fontSize: 13,
                            background: "#fff",
                          }}
                        />
                        <span style={{ fontSize: 13, color: "#6b7280" }}>đến</span>
                        <input
                          type="time"
                          value={settings.operatingHours[day.key].close}
                          onChange={(e) =>
                            handleOperatingHoursChange(day.key, "close", e.target.value)
                          }
                          style={{
                            padding: "6px 10px",
                            border: "2px solid #e5e7eb",
                            borderRadius: 6,
                            fontSize: 13,
                            background: "#fff",
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNotificationSettings = () => (
    <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 6px 20px rgba(0,0,0,.06)" }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Cài đặt thông báo</h3>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Tự động xác nhận đặt sân</div>
            <div style={{ fontSize: 14, color: "#6b7280" }}>Tự động xác nhận các đặt sân mà không cần phê duyệt thủ công</div>
          </div>
          <label style={{ position: "relative", display: "inline-block", width: 60, height: 34 }}>
            <input
              type="checkbox"
              checked={settings.autoConfirm}
              onChange={(e) => handleInputChange("autoConfirm", e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: "absolute",
              cursor: "pointer",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: settings.autoConfirm ? "#10b981" : "#ccc",
              transition: ".4s",
              borderRadius: 34,
            }}>
              <span style={{
                position: "absolute",
                content: '""',
                height: 26,
                width: 26,
                left: 4,
                bottom: 4,
                backgroundColor: "white",
                transition: ".4s",
                borderRadius: "50%",
                transform: settings.autoConfirm ? "translateX(26px)" : "translateX(0px)"
              }} />
            </span>
          </label>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Thông báo email</div>
            <div style={{ fontSize: 14, color: "#6b7280" }}>Gửi thông báo qua email cho khách hàng</div>
          </div>
          <label style={{ position: "relative", display: "inline-block", width: 60, height: 34 }}>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => handleInputChange("emailNotifications", e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: "absolute",
              cursor: "pointer",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: settings.emailNotifications ? "#10b981" : "#ccc",
              transition: ".4s",
              borderRadius: 34,
            }}>
              <span style={{
                position: "absolute",
                content: '""',
                height: 26,
                width: 26,
                left: 4,
                bottom: 4,
                backgroundColor: "white",
                transition: ".4s",
                borderRadius: "50%",
                transform: settings.emailNotifications ? "translateX(26px)" : "translateX(0px)"
              }} />
            </span>
          </label>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Thông báo SMS</div>
            <div style={{ fontSize: 14, color: "#6b7280" }}>Gửi thông báo qua SMS cho khách hàng</div>
          </div>
          <label style={{ position: "relative", display: "inline-block", width: 60, height: 34 }}>
            <input
              type="checkbox"
              checked={settings.smsNotifications}
              onChange={(e) => handleInputChange("smsNotifications", e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: "absolute",
              cursor: "pointer",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: settings.smsNotifications ? "#10b981" : "#ccc",
              transition: ".4s",
              borderRadius: 34,
            }}>
              <span style={{
                position: "absolute",
                content: '""',
                height: 26,
                width: 26,
                left: 4,
                bottom: 4,
                backgroundColor: "white",
                transition: ".4s",
                borderRadius: "50%",
                transform: settings.smsNotifications ? "translateX(26px)" : "translateX(0px)"
              }} />
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 6px 20px rgba(0,0,0,.06)" }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Cài đặt hệ thống</h3>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Chế độ bảo trì</div>
            <div style={{ fontSize: 14, color: "#6b7280" }}>Tạm thời đóng cơ sở để bảo trì</div>
          </div>
          <label style={{ position: "relative", display: "inline-block", width: 60, height: 34 }}>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => handleInputChange("maintenanceMode", e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: "absolute",
              cursor: "pointer",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: settings.maintenanceMode ? "#ef4444" : "#ccc",
              transition: ".4s",
              borderRadius: 34,
            }}>
              <span style={{
                position: "absolute",
                content: '""',
                height: 26,
                width: 26,
                left: 4,
                bottom: 4,
                backgroundColor: "white",
                transition: ".4s",
                borderRadius: "50%",
                transform: settings.maintenanceMode ? "translateX(26px)" : "translateX(0px)"
              }} />
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  const handleBankAccountChange = (field, value) => {
    setBankAccount(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveBankAccount = async () => {
    if (!bankAccount.accountNumber || !bankAccount.accountName || !bankAccount.bankCode) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setBankAccountLoading(true);
      const result = await userApi.updateBankAccount({
        accountNumber: bankAccount.accountNumber,
        accountName: bankAccount.accountName,
        bankCode: bankAccount.bankCode,
        bankName: bankAccount.bankName || banks.find(b => b.code === bankAccount.bankCode)?.name || bankAccount.bankCode,
      });

      if (result.success) {
        toast.success("Lưu thông tin tài khoản ngân hàng thành công");
        // Update user context if needed
      }
    } catch (error) {
      toast.error(error.message || "Không thể lưu thông tin tài khoản ngân hàng");
    } finally {
      setBankAccountLoading(false);
    }
  };

  // Sport categories management functions
  const handleAddSportFromDropdown = () => {
    if (!selectedSportCategory) {
      toast.error("Vui lòng chọn môn thể thao");
      return;
    }
    
    const selectedCategory = sportCategories.find(
      cat => (cat._id || cat.id) === selectedSportCategory
    );
    
    if (!selectedCategory) {
      toast.error("Môn thể thao không hợp lệ");
      return;
    }
    
    const sportName = selectedCategory.name;
    
    if (facilitySports.includes(sportName)) {
      toast.warning("Môn thể thao này đã có trong danh sách");
      return;
    }
    
    setFacilitySports([...facilitySports, sportName]);
    setSelectedSportCategory("");
    toast.success(`Đã thêm "${sportName}" vào danh sách`);
  };

  const handleAddCustomSport = () => {
    const sportName = newSportInput.trim();
    
    if (!sportName) {
      toast.error("Vui lòng nhập tên môn thể thao");
      return;
    }
    
    if (facilitySports.includes(sportName)) {
      toast.warning("Môn thể thao này đã có trong danh sách");
      setNewSportInput("");
      return;
    }
    
    setFacilitySports([...facilitySports, sportName]);
    setNewSportInput("");
    toast.success(`Đã thêm "${sportName}" vào danh sách`);
  };

  const handleRemoveSport = (sportName) => {
    if (facilitySports.length <= 1) {
      toast.error("Cơ sở phải có ít nhất một môn thể thao");
      return;
    }
    
    setFacilitySports(facilitySports.filter(sport => sport !== sportName));
    toast.success(`Đã xóa "${sportName}" khỏi danh sách`);
  };

  const handleSaveSports = async () => {
    if (!facilityId) {
      toast.error("Không tìm thấy cơ sở để cập nhật");
      return;
    }

    if (facilitySports.length === 0) {
      toast.error("Cơ sở phải có ít nhất một môn thể thao");
      return;
    }

    setSavingSports(true);
    try {
      const result = await facilityApi.updateFacility(facilityId, {
        types: facilitySports,
      });

      if (result.success) {
        toast.success("Cập nhật môn thể thao thành công!");
      } else {
        throw new Error(result.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error updating facility sports:", error);
      toast.error(error.message || "Không thể cập nhật môn thể thao");
    } finally {
      setSavingSports(false);
    }
  };

  const renderSportCategoriesSettings = () => {
    if (loading) {
      return (
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          minHeight: "400px",
          background: "#fff",
          borderRadius: 12,
          padding: 24
        }}>
          <div style={{ textAlign: "center" }}>
            <Loader size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <div style={{ color: "#6b7280" }}>Đang tải thông tin cơ sở...</div>
          </div>
        </div>
      );
    }

    if (!facilityId) {
      return (
        <div style={{ 
          background: "#fff", 
          borderRadius: 12, 
          padding: 24, 
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
          textAlign: "center"
        }}>
          <div style={{ color: "#6b7280", fontSize: 16 }}>
            Bạn chưa có cơ sở nào. Vui lòng tạo cơ sở trước khi cấu hình.
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: "grid", gap: 24 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 6px 20px rgba(0,0,0,.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <Trophy size={24} color="#10b981" />
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Quản lý môn thể thao</h3>
          </div>
          
          <div style={{ marginBottom: 20, padding: 16, background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
            <div style={{ fontSize: 14, color: "#166534", lineHeight: 1.6 }}>
              <strong>Lưu ý:</strong> Bạn có thể chọn môn thể thao từ danh sách có sẵn hoặc nhập tùy ý môn thể thao mới. 
              Cơ sở phải có ít nhất một môn thể thao.
            </div>
          </div>

          {/* Current sports list */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 12, fontWeight: 600, color: "#374151" }}>
              Môn thể thao hiện tại ({facilitySports.length})
            </label>
            {facilitySports.length === 0 ? (
              <div style={{ 
                padding: 16, 
                background: "#f9fafb", 
                borderRadius: 8, 
                border: "1px dashed #d1d5db",
                textAlign: "center",
                color: "#6b7280"
              }}>
                Chưa có môn thể thao nào. Vui lòng thêm môn thể thao.
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {facilitySports.map((sport, index) => (
                  <div
                    key={index}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      background: "#10b981",
                      color: "#fff",
                      borderRadius: 20,
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    <span>{sport}</span>
                    <button
                      onClick={() => handleRemoveSport(sport)}
                      disabled={facilitySports.length <= 1}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(255, 255, 255, 0.3)",
                        color: "#fff",
                        cursor: facilitySports.length <= 1 ? "not-allowed" : "pointer",
                        opacity: facilitySports.length <= 1 ? 0.5 : 1,
                        fontSize: 12,
                        padding: 0,
                      }}
                      title="Xóa môn thể thao"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add sport from dropdown */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#374151" }}>
              Thêm từ danh sách có sẵn
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <select
                value={selectedSportCategory}
                onChange={(e) => setSelectedSportCategory(e.target.value)}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 14,
                  outline: "none",
                  background: "#fff",
                }}
                disabled={loadingSports}
              >
                <option value="">Chọn môn thể thao...</option>
                {sportCategories
                  .filter(cat => !facilitySports.includes(cat.name))
                  .map((category) => (
                    <option key={category._id || category.id} value={category._id || category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
              <button
                onClick={handleAddSportFromDropdown}
                disabled={!selectedSportCategory || loadingSports}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "12px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: !selectedSportCategory || loadingSports ? "#9ca3af" : "#3b82f6",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: !selectedSportCategory || loadingSports ? "not-allowed" : "pointer",
                  fontSize: 14,
                }}
              >
                <Plus size={16} />
                Thêm
              </button>
            </div>
          </div>

          {/* Add custom sport */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#374151" }}>
              Thêm môn thể thao tùy ý
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={newSportInput}
                onChange={(e) => setNewSportInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddCustomSport();
                  }
                }}
                placeholder="Nhập tên môn thể thao (VD: Bóng rổ, Bóng chuyền...)"
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 14,
                  outline: "none",
                }}
              />
              <button
                onClick={handleAddCustomSport}
                disabled={!newSportInput.trim()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "12px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: !newSportInput.trim() ? "#9ca3af" : "#10b981",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: !newSportInput.trim() ? "not-allowed" : "pointer",
                  fontSize: 14,
                }}
              >
                <Plus size={16} />
                Thêm
              </button>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
              Bạn có thể nhập bất kỳ tên môn thể thao nào bạn muốn
            </div>
          </div>

          {/* Save button */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
            <button
              onClick={handleSaveSports}
              disabled={savingSports || facilitySports.length === 0}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                borderRadius: 8,
                border: "none",
                background: savingSports || facilitySports.length === 0
                  ? "#9ca3af"
                  : "#10b981",
                color: "#fff",
                fontWeight: 600,
                cursor: savingSports || facilitySports.length === 0
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {savingSports ? (
                <>
                  <Loader size={16} style={{ animation: "spin 1s linear infinite" }} />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Lưu môn thể thao
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderBankAccountSettings = () => (
    <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 6px 20px rgba(0,0,0,.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <CreditCard size={24} color="#10b981" />
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Tài khoản ngân hàng</h3>
      </div>
      <div style={{ marginBottom: 20, padding: 16, background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
        <div style={{ fontSize: 14, color: "#166534", lineHeight: 1.6 }}>
          <strong>Lưu ý:</strong> Thông tin tài khoản ngân hàng sẽ được sử dụng để rút tiền. 
          Vui lòng đảm bảo thông tin chính xác để tránh lỗi khi rút tiền.
        </div>
      </div>

      <div style={{ display: "grid", gap: 20 }}>
        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#374151" }}>
            Ngân hàng <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <select
            value={bankAccount.bankCode}
            onChange={(e) => {
              const selectedBank = banks.find(b => b.code === e.target.value);
              handleBankAccountChange("bankCode", e.target.value);
              handleBankAccountChange("bankName", selectedBank?.name || "");
            }}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 16,
              outline: "none",
              background: "#fff",
            }}
          >
            <option value="">Chọn ngân hàng</option>
            {banks.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#374151" }}>
            Số tài khoản <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="text"
            value={bankAccount.accountNumber}
            onChange={(e) => handleBankAccountChange("accountNumber", e.target.value)}
            placeholder="Nhập số tài khoản"
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 16,
              outline: "none",
              fontFamily: "monospace",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#374151" }}>
            Tên chủ tài khoản <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="text"
            value={bankAccount.accountName}
            onChange={(e) => handleBankAccountChange("accountName", e.target.value)}
            placeholder="Nhập tên chủ tài khoản (viết hoa, không dấu)"
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 16,
              outline: "none",
            }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
            Ví dụ: NGUYEN VAN A
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
          <button
            onClick={handleSaveBankAccount}
            disabled={bankAccountLoading || !bankAccount.accountNumber || !bankAccount.accountName || !bankAccount.bankCode}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              borderRadius: 8,
              border: "none",
              background: bankAccountLoading || !bankAccount.accountNumber || !bankAccount.accountName || !bankAccount.bankCode
                ? "#9ca3af"
                : "#10b981",
              color: "#fff",
              fontWeight: 600,
              cursor: bankAccountLoading || !bankAccount.accountNumber || !bankAccount.accountName || !bankAccount.bankCode
                ? "not-allowed"
                : "pointer",
            }}
          >
            {bankAccountLoading ? (
              <>
                <Loader size={16} style={{ animation: "spin 1s linear infinite" }} />
                Đang lưu...
              </>
            ) : (
              <>
                <Save size={16} />
                Lưu thông tin
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Cấu hình & Hệ thống</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleReset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#6b7280",
              color: "#fff",
              border: 0,
              borderRadius: 10,
              padding: "10px 14px",
              cursor: "pointer",
              fontWeight: 700
            }}
          >
            <RefreshCw size={16}/> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || !facilityId}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: saving || loading || !facilityId ? "#9ca3af" : "#10b981",
              color: "#fff",
              border: 0,
              borderRadius: 10,
              padding: "10px 14px",
              cursor: saving || loading || !facilityId ? "not-allowed" : "pointer",
              fontWeight: 700,
              opacity: saving || loading || !facilityId ? 0.6 : 1
            }}
          >
            {saving ? (
              <>
                <Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> Đang lưu...
              </>
            ) : (
              <>
                <Save size={16}/> Lưu cài đặt
              </>
            )}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[
          { id: "general", label: "Cài đặt chung" },
          { id: "sports", label: "Môn thể thao" },
          { id: "notifications", label: "Thông báo" },
          { id: "bankAccount", label: "Tài khoản ngân hàng" },
          { id: "system", label: "Hệ thống" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: activeTab === tab.id ? "#10b981" : "#fff",
              color: activeTab === tab.id ? "#fff" : "#111827",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "general" && renderGeneralSettings()}
      {activeTab === "sports" && renderSportCategoriesSettings()}
      {activeTab === "notifications" && renderNotificationSettings()}
      {activeTab === "bankAccount" && renderBankAccountSettings()}
      {activeTab === "system" && renderSystemSettings()}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Settings;

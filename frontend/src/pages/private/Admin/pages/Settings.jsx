import React, { useState, useEffect } from "react";
import { Save, RefreshCw, Loader2 } from "lucide-react";
import ResetSettingsModal from "../modals/ResetSettingsModal";
import SettingsTabs from "../components/Settings/SettingsTabs";
import ServiceFeeSettings from "../components/Settings/ServiceFeeSettings";
import PolicySettings from "../components/Settings/PolicySettings";
import SupportSettings from "../components/Settings/SupportSettings";
import { systemConfigApi } from "../../../../api/systemConfigApi";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("serviceFee");
  const [settings, setSettings] = useState({
    // Service Fee
    serviceFeePercent: 10,

    // Policy & Terms
    termsOfService: "Điều khoản sử dụng...",
    privacyPolicy: "Chính sách bảo mật...",
    refundPolicy: "Chính sách hoàn tiền...",

    // Support Contact
    supportEmail: "support@datsanonline.com",
    supportPhone: "1900123456",
    supportAddress: "123 Đường ABC, Quận 1, TP.HCM",
    supportHours: "Thứ 2 - Chủ nhật: 8:00 - 22:00",
  });

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Load system config khi component mount
  useEffect(() => {
    const loadSystemConfig = async () => {
      setIsLoading(true);
      try {
        const result = await systemConfigApi.getSystemConfig();
        if (result.success && result.data) {
          setSettings((prev) => ({
            ...prev,
            serviceFeePercent: result.data.serviceFeePercent || 10,
          }));
        }
      } catch (error) {
        console.error("Lỗi khi tải cấu hình hệ thống:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSystemConfig();
  }, []);

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };


  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      // Chỉ lưu serviceFeePercent vào backend
      const result = await systemConfigApi.updateSystemConfig({
        serviceFeePercent: settings.serviceFeePercent,
      });

      if (result.success) {
        setSaveMessage({
          type: "success",
          text: "Đã lưu cấu hình phí dịch vụ thành công!",
        });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({
          type: "error",
          text: result.message || "Không thể lưu cấu hình",
        });
        setTimeout(() => setSaveMessage(null), 5000);
      }
    } catch (error) {
      console.error("Lỗi khi lưu cấu hình:", error);
      setSaveMessage({
        type: "error",
        text: error.message || "Đã xảy ra lỗi khi lưu cấu hình",
      });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = () => {
    setSettings({
      serviceFeePercent: 10,
      termsOfService: "Điều khoản sử dụng...",
      privacyPolicy: "Chính sách bảo mật...",
      refundPolicy: "Chính sách hoàn tiền...",
      supportEmail: "support@datsanonline.com",
      supportPhone: "1900123456",
      supportAddress: "123 Đường ABC, Quận 1, TP.HCM",
      supportHours: "Thứ 2 - Chủ nhật: 8:00 - 22:00",
    });
    setIsResetModalOpen(false);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Cấu hình hệ thống</h1>
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
              fontWeight: 700,
            }}
          >
            <RefreshCw size={16} /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || activeTab !== "serviceFee"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background:
                isSaving || activeTab !== "serviceFee"
                  ? "#9ca3af"
                  : "#10b981",
              color: "#fff",
              border: 0,
              borderRadius: 10,
              padding: "10px 14px",
              cursor:
                isSaving || activeTab !== "serviceFee"
                  ? "not-allowed"
                  : "pointer",
              fontWeight: 700,
              opacity: isSaving || activeTab !== "serviceFee" ? 0.6 : 1,
            }}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <Save size={16} /> Lưu cài đặt
              </>
            )}
          </button>
        </div>
      </div>

      <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "serviceFee" && (
        <>
          {isLoading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px",
                gap: 12,
                color: "#6b7280",
              }}
            >
              <Loader2 size={20} className="animate-spin" />
              <span>Đang tải cấu hình...</span>
            </div>
          ) : (
            <>
              {saveMessage && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    marginBottom: 16,
                    background:
                      saveMessage.type === "success"
                        ? "#d1fae5"
                        : "#fee2e2",
                    color:
                      saveMessage.type === "success"
                        ? "#065f46"
                        : "#991b1b",
                    border: `1px solid ${
                      saveMessage.type === "success"
                        ? "#10b981"
                        : "#ef4444"
                    }`,
                  }}
                >
                  {saveMessage.text}
                </div>
              )}
              <ServiceFeeSettings
                settings={settings}
                onInputChange={handleInputChange}
              />
            </>
          )}
        </>
      )}
      {activeTab === "policy" && (
        <PolicySettings settings={settings} onInputChange={handleInputChange} />
      )}
      {activeTab === "support" && (
        <SupportSettings settings={settings} onInputChange={handleInputChange} />
      )}

      <ResetSettingsModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
      />
    </div>
  );
};

export default Settings;


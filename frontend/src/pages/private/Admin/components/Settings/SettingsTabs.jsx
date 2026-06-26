import React from "react";
import { FileText, Phone } from "lucide-react";

const SettingsTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: "serviceFee", label: "Phí dịch vụ", icon: FileText },
    { id: "policy", label: "Chính sách & Điều khoản", icon: FileText },
    { id: "support", label: "Liên hệ hỗ trợ", icon: Phone },
  ];

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: activeTab === tab.id ? "#10b981" : "#fff",
              color: activeTab === tab.id ? "#fff" : "#111827",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default SettingsTabs;


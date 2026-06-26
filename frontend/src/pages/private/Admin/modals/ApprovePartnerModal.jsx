import React, { useState } from "react";
import { X, CheckCircle, User, Mail, Phone } from "lucide-react";
import useClickOutside from "../../../../hook/use-click-outside";
import useBodyScrollLock from "../../../../hook/use-body-scroll-lock";
import useEscapeKey from "../../../../hook/use-escape-key";

const ApprovePartnerModal = ({ isOpen, onClose, onConfirm, application }) => {
  useBodyScrollLock(isOpen);
  useEscapeKey(onClose, isOpen);
  const modalRef = useClickOutside(onClose, isOpen);

  if (!isOpen || !application) return null;

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
          maxWidth: "520px",
          overflow: "hidden",
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#e6f9f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle size={20} color="#10b981" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#111827" }}>
              Duyệt đơn đăng ký đối tác
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#6b7280",
              padding: "4px",
            }}
            aria-label="Đóng"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px" }}>
          <p style={{ fontSize: 15, color: "#374151", marginBottom: 20, lineHeight: 1.6 }}>
            Bạn có chắc muốn duyệt đơn đăng ký đối tác này? Người dùng sẽ được cấp quyền <strong>Owner</strong> và có thể tạo cơ sở.
          </p>

          {/* Thông tin đơn đăng ký */}
          <div
            style={{
              background: "#f9fafb",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <User size={16} color="#6b7280" />
                <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>
                  Họ và tên
                </span>
              </div>
              <div style={{ fontSize: 15, color: "#1f2937", fontWeight: 500 }}>
                {application.name || application.user?.name || "N/A"}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Mail size={16} color="#6b7280" />
                <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>
                  Email
                </span>
              </div>
              <div style={{ fontSize: 15, color: "#1f2937", fontWeight: 500 }}>
                {application.email || application.user?.email || "N/A"}
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Phone size={16} color="#6b7280" />
                <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>
                  Số điện thoại
                </span>
              </div>
              <div style={{ fontSize: 15, color: "#1f2937", fontWeight: 500 }}>
                {application.phone || application.user?.phone || "N/A"}
              </div>
            </div>
          </div>

          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
            Sau khi duyệt, người dùng sẽ nhận được thông báo và có thể đăng nhập với quyền Owner.
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            padding: "20px 24px",
            borderTop: "1px solid #e5e7eb",
            background: "#f9fafb",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              background: "#fff",
              color: "#374151",
              border: "2px solid #e5e7eb",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "#d1d5db";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "#e5e7eb";
            }}
          >
            Hủy
          </button>
          <button
            onClick={() => {
              if (onConfirm) onConfirm();
            }}
            style={{
              padding: "10px 24px",
              background: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#059669";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#10b981";
            }}
          >
            Duyệt và cấp quyền Owner
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovePartnerModal;


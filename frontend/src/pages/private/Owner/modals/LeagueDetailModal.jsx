import React from "react";
import { X, Calendar, Users, MapPin, Building2, Trophy, FileText } from "lucide-react";
import useClickOutside from "../../../../hook/use-click-outside";
import useBodyScrollLock from "../../../../hook/use-body-scroll-lock";
import useEscapeKey from "../../../../hook/use-escape-key";

const LeagueDetailModal = ({ isOpen, onClose, league = {} }) => {
  // Lock body scroll
  useBodyScrollLock(isOpen);
  
  // Handle escape key
  useEscapeKey(onClose, isOpen);
  
  // Handle click outside
  const modalRef = useClickOutside(onClose, isOpen);

  if (!isOpen || !league) return null;

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
          maxWidth: "700px",
          maxHeight: "90vh",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
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
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#111827" }}>
              Chi tiết giải đấu
            </h2>
            <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0 0" }}>
              {league.name}
            </p>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Basic Info */}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 12 }}>
                Thông tin cơ bản
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Trophy size={18} color="#6b7280" />
                  <div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Tên giải đấu</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
                      {league.name || "N/A"}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Users size={18} color="#6b7280" />
                  <div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Môn thể thao</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
                      {league.sport || "N/A"}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <FileText size={18} color="#6b7280" />
                  <div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Hình thức</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
                      {league.format || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Date & Location */}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 12 }}>
                Thời gian & Địa điểm
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Calendar size={18} color="#6b7280" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Ngày bắt đầu</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
                      {league.startDate
                        ? new Date(league.startDate).toLocaleDateString("vi-VN")
                        : "N/A"}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Ngày kết thúc</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
                      {league.endDate
                        ? new Date(league.endDate).toLocaleDateString("vi-VN")
                        : "N/A"}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Building2 size={18} color="#6b7280" />
                  <div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Cơ sở</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
                      {league.facility?.name || league.location || "Chưa chọn cơ sở"}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <MapPin size={18} color="#6b7280" />
                  <div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Sân</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
                      {league.courtId?.name || (league.courtId ? "Đã chốt sân" : "Chưa chốt sân")}
                    </div>
                  </div>
                </div>
                {league.address && (
                  <div style={{ marginLeft: 30, fontSize: 14, color: "#6b7280" }}>
                    {league.address}
                  </div>
                )}
              </div>
            </div>

            {/* Participants */}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 12 }}>
                Thông tin tham gia
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>Số đội tối đa</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
                    {league.maxParticipants || "N/A"}
                  </div>
                </div>
                {league.creator && (
                  <div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Người tạo</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
                      {league.creator.name || league.creator.email || "N/A"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {league.description && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 12 }}>
                  Mô tả
                </h3>
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, margin: 0 }}>
                  {league.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
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
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeagueDetailModal;


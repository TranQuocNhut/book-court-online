import React, { useState, useEffect } from "react";
import { X, MapPin } from "lucide-react";
import useClickOutside from "../../../../hook/use-click-outside";
import useBodyScrollLock from "../../../../hook/use-body-scroll-lock";
import useEscapeKey from "../../../../hook/use-escape-key";
import { courtApi } from "../../../../api/courtApi";

const AssignCourtModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  league = {},
  facilityId = null
}) => {
  // Lock body scroll
  useBodyScrollLock(isOpen);
  
  // Handle escape key
  useEscapeKey(onClose, isOpen);
  
  // Handle click outside
  const modalRef = useClickOutside(onClose, isOpen);

  const [courts, setCourts] = useState([]);
  const [selectedCourtId, setSelectedCourtId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && facilityId) {
      fetchCourts();
    } else if (isOpen && !facilityId) {
      // Reset courts if no facilityId
      setCourts([]);
    }
  }, [isOpen, facilityId]);

  const fetchCourts = async () => {
    if (!facilityId) {
      setCourts([]);
      return;
    }
    
    try {
      setLoading(true);
      // Ensure facilityId is a string
      const facilityIdStr = String(facilityId);
      const result = await courtApi.getCourts({ facility: facilityIdStr });
      if (result.success) {
        setCourts(result.data?.courts || result.data || []);
      } else {
        console.error("Failed to fetch courts:", result.message);
        setCourts([]);
      }
    } catch (error) {
      console.error("Error fetching courts:", error);
      setCourts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedCourtId) {
      return;
    }
    if (onConfirm) onConfirm(selectedCourtId);
    setSelectedCourtId("");
    if (onClose) onClose();
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
          maxWidth: "480px",
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
                background: "#e6effe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MapPin size={20} color="#3b82f6" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#111827" }}>
              Chốt sân cho giải đấu
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
          <p style={{ fontSize: 15, color: "#374151", marginBottom: 16, lineHeight: 1.6 }}>
            Chọn sân cho giải đấu <strong>{league.name}</strong>
          </p>
          {!facilityId ? (
            <div style={{ 
              padding: "16px", 
              background: "#fef3c7", 
              borderRadius: 8, 
              border: "1px solid #fde68a",
              color: "#92400e"
            }}>
              <p style={{ margin: 0, fontSize: 14 }}>
                <strong>Lưu ý:</strong> Giải đấu này chưa được gán cơ sở. Vui lòng kiểm tra lại thông tin giải đấu.
              </p>
            </div>
          ) : (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Chọn sân <span style={{ color: "#ef4444" }}>*</span>
              </label>
              {loading ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
                  Đang tải...
                </div>
              ) : (
                <select
                  value={selectedCourtId}
                  onChange={(e) => setSelectedCourtId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e5e7eb",
                    borderRadius: 8,
                    fontSize: 14,
                    color: "#111827",
                    fontFamily: "inherit",
                    outline: "none",
                    cursor: "pointer",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                  }}
                >
                  <option value="">-- Chọn sân --</option>
                  {courts.map((court) => (
                    <option key={court._id || court.id} value={court._id || court.id}>
                      {court.name} {court.type ? `(${court.type})` : ""}
                    </option>
                  ))}
                </select>
              )}
              {courts.length === 0 && !loading && facilityId && (
                <p style={{ fontSize: 13, color: "#ef4444", marginTop: 8 }}>
                  Không có sân nào trong cơ sở này. Vui lòng thêm sân vào cơ sở trước.
                </p>
              )}
            </div>
          )}
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
            onClick={handleConfirm}
            disabled={!selectedCourtId || loading}
            style={{
              padding: "10px 24px",
              background: selectedCourtId && !loading ? "#3b82f6" : "#d1d5db",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: selectedCourtId && !loading ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (selectedCourtId && !loading) {
                e.target.style.background = "#2563eb";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedCourtId && !loading) {
                e.target.style.background = "#3b82f6";
              }
            }}
          >
            Chốt sân
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignCourtModal;


import React, { useState, useEffect } from "react";
import { X, Image as ImageIcon, Info, DollarSign, Building2, Calendar, Wrench } from "lucide-react";
import useClickOutside from "../../../../hook/use-click-outside";
import useBodyScrollLock from "../../../../hook/use-body-scroll-lock";
import useEscapeKey from "../../../../hook/use-escape-key";
import { courtApi } from "../../../../api/courtApi";

// Helper để lấy URL ảnh (hỗ trợ cả string và object format)
const getImageUrl = (image) => {
  if (!image) return null;
  if (typeof image === 'string') return image;
  if (typeof image === 'object' && image.url) return image.url;
  return null;
};


const DetailCourtModal = ({ isOpen, onClose, court = {} }) => {
  // Lock body scroll
  useBodyScrollLock(isOpen)
  
  // Handle escape key
  useEscapeKey(onClose, isOpen)
  
  // Handle click outside
  const modalRef = useClickOutside(onClose, isOpen)

  const [courtData, setCourtData] = useState(court);
  const [loading, setLoading] = useState(false);
  const [idx, setIdx] = useState(0);

  // Fetch full court details từ API nếu có court ID
  useEffect(() => {
    const fetchCourtDetails = async () => {
      if (!isOpen || !court?._id && !court?.id) {
        setCourtData(court);
        return;
      }

      setLoading(true);
      try {
        const courtId = court._id || court.id;
        const result = await courtApi.getCourtById(courtId);
        
        if (result.success && result.data) {
          setCourtData(result.data);
        } else {
          setCourtData(court); // Fallback to passed court data
        }
      } catch (error) {
        console.error("Error fetching court details:", error);
        setCourtData(court); // Fallback to passed court data
      } finally {
        setLoading(false);
      }
    };

    fetchCourtDetails();
  }, [isOpen, court]);

  if (!isOpen) return null;

  // Extract data from courtData
  const {
    images = [],
    name = "",
    type = "",
    capacity = "",
    price = "",
    status = "active",
    maintenance = "",
    facility = null,
    createdAt = null,
    updatedAt = null,
  } = courtData;

  // Convert images to array of URLs
  const imageUrls = Array.isArray(images) 
    ? images.map(img => getImageUrl(img)).filter(Boolean)
    : [];

  const handlePrev = (e) => {
    e.stopPropagation();
    setIdx((i) => (i <= 0 ? imageUrls.length - 1 : i - 1));
  };
  const handleNext = (e) => {
    e.stopPropagation();
    setIdx((i) => (i >= imageUrls.length - 1 ? 0 : i + 1));
  };

  // Định nghĩa màu sắc trạng thái nhất quán
  const statusMap = {
    active: { bg: "#dcfce7", color: "#059669", text: "Hoạt động" },
    maintenance: { bg: "#fef3c7", color: "#d97706", text: "Bảo trì" },
    inactive: { bg: "#fee2e2", color: "#ef4444", text: "Tạm ngưng" },
  };
  const statusConfig = statusMap[status] || statusMap.inactive;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Chưa có thông tin";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "Chưa có thông tin";
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
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
              Chi tiết sân
          </h2>
            {name && (
              <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0 0" }}>
                {name}
              </p>
            )}
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
        <div
          style={{
            padding: "24px",
            background: "#f9fafb",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  border: "4px solid #e5e7eb",
                  borderTop: "4px solid #3b82f6",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 16px",
                }}
              />
              <p style={{ color: "#6b7280", fontSize: 14 }}>Đang tải thông tin...</p>
            </div>
          ) : (
            <>
              {/* Hình ảnh */}
              {imageUrls.length > 0 && (
                <div
                    style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 16,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 16,
                    }}
                  >
                    <ImageIcon size={20} color="#3b82f6" />
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#374151" }}>
                      Hình ảnh ({imageUrls.length})
                    </h3>
                  </div>
                  <div
                    style={{
                      position: "relative",
                      borderRadius: 10,
                      overflow: "hidden",
                      background: "#f3f4f6",
                    }}
                  >
                    <img
                      src={imageUrls[idx]}
                      alt={`${name} ${idx + 1}`}
                      style={{
                        width: "100%",
                        height: 360,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    {imageUrls.length > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      style={{
                        position: "absolute",
                            left: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "rgba(0,0,0,0.6)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            cursor: "pointer",
                            width: 40,
                            height: 40,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 24,
                            fontWeight: "bold",
                          }}
                          aria-label="Ảnh trước"
                    >
                      ‹
                    </button>
                    <button
                      onClick={handleNext}
                      style={{
                        position: "absolute",
                            right: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "rgba(0,0,0,0.6)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            cursor: "pointer",
                            width: 40,
                            height: 40,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 24,
                            fontWeight: "bold",
                          }}
                          aria-label="Ảnh sau"
                    >
                      ›
                    </button>
                        <div
                          style={{
                            position: "absolute",
                            bottom: 12,
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "rgba(0,0,0,0.5)",
                            color: "#fff",
                            padding: "4px 12px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {idx + 1} / {imageUrls.length}
                        </div>
                  </>
                )}
              </div>
                  {/* Thumbnails */}
                  {imageUrls.length > 1 && (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 12,
                        flexWrap: "wrap",
                        justifyContent: "center",
                      }}
                    >
                      {imageUrls.map((url, i) => (
                        <button
                          key={i}
                          onClick={() => setIdx(i)}
                          style={{
                            border: idx === i ? "3px solid #3b82f6" : "2px solid #e5e7eb",
                            padding: 0,
                            borderRadius: 8,
                            overflow: "hidden",
                            cursor: "pointer",
                            width: 80,
                            height: 60,
                            background: "#fff",
                            opacity: idx === i ? 1 : 0.7,
                            transition: "all 0.2s",
                          }}
                        >
                          <img
                            src={url}
                            alt={`Thumbnail ${i + 1}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                    </button>
                  ))}
                </div>
              )}
            </div>
              )}

              {/* Thông tin cơ bản */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 16,
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 20,
                  }}
                >
                  <Info size={20} color="#3b82f6" />
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#374151" }}>
                    Thông tin cơ bản
                  </h3>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>
                      Tên sân
                    </label>
                    <div style={{ fontSize: 15, color: "#111827", fontWeight: 500 }}>
                      {name || "Chưa có thông tin"}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>
                      Loại sân
                    </label>
                    <div style={{ fontSize: 15, color: "#111827", fontWeight: 500 }}>
                      {type || "Chưa có thông tin"}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>
                      Sức chứa
                    </label>
                    <div style={{ fontSize: 15, color: "#111827", fontWeight: 500 }}>
                      {capacity ? `${capacity} người` : "Chưa có thông tin"}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>
                      Giá/giờ
                    </label>
                    <div style={{ fontSize: 15, color: "#111827", fontWeight: 500 }}>
                      {formatCurrency(price)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trạng thái & Bảo trì */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 16,
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 20,
                  }}
                >
                  <Wrench size={20} color="#f59e0b" />
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#374151" }}>
                    Trạng thái & Bảo trì
                  </h3>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>
                      Trạng thái
                    </label>
                    <span
                      style={{
                        display: "inline-block",
                        background: statusConfig.bg,
                        color: statusConfig.color,
                        padding: "6px 12px",
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {statusConfig.text}
                    </span>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>
                      Lịch bảo trì
                    </label>
                    <div style={{ fontSize: 14, color: "#111827" }}>
                      {maintenance && maintenance !== "Không có lịch bảo trì"
                        ? maintenance
                        : "Không có lịch bảo trì"}
                    </div>
                  </div>
            </div>
          </div>

              {/* Cơ sở & Thời gian */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 16,
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 20,
                  }}
                >
                  <Building2 size={20} color="#10b981" />
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#374151" }}>
                    Thông tin bổ sung
                  </h3>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  {facility && (
                    <div>
                      <label style={{ display: "block", fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>
                        Cơ sở
                      </label>
                      <div style={{ fontSize: 15, color: "#111827", fontWeight: 500 }}>
                        {typeof facility === 'object' ? facility.name : facility}
                      </div>
                    </div>
                  )}
                  {createdAt && (
                    <div>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>
                        <Calendar size={14} />
                        Ngày tạo
                      </label>
                      <div style={{ fontSize: 14, color: "#111827" }}>
                        {formatDate(createdAt)}
                      </div>
                    </div>
                  )}
                  {updatedAt && updatedAt !== createdAt && (
                    <div>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>
                        <Calendar size={14} />
                        Cập nhật lần cuối
                      </label>
                      <div style={{ fontSize: 14, color: "#111827" }}>
                        {formatDate(updatedAt)}
                      </div>
                    </div>
                  )}
            </div>
          </div>
            </>
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
            background: "#fff",
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

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default DetailCourtModal;
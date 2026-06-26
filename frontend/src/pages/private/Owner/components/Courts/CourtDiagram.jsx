import React from "react";
import { Clock, Zap, Wrench, Edit, DollarSign, Timer } from "lucide-react"; 
const getStatusColor = (status) => {
  switch (status) {
    case "active":
      return { bg: "#e0f2fe", border: "#0ea5e9", text: "#0c4a6e" };
    case "booked":
      return { bg: "#fee2e2", border: "#ef4444", text: "#991b1b" };
    case "maintenance":
      return { bg: "#fef9c3", border: "#eab308", text: "#854d0e" };
    case "inactive":
      return { bg: "#f3f4f6", border: "#9ca3af", text: "#4b5563" };
    default:
      return { bg: "#f3f4f6", border: "#9ca3af", text: "#4b5563" };
  }
};

const CourtCard = ({ court, handlers }) => {
  const colors = getStatusColor(court.status);

  return (
    <div
      onClick={() => handlers.onOpenServiceModal(court)} 
      style={{
        border: `2px solid ${colors.border}`,
        backgroundColor: colors.bg,
        color: colors.text,
        borderRadius: 8,
        padding: 12,
        minHeight: 120,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 4px 10px rgba(0,0,0,.05)",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 8px 15px rgba(0,0,0,.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,.05)";
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{court.name}</h4>
          <p style={{ fontSize: 13, margin: "4px 0" }}>{court.type}</p>
        </div>
        <button
          title="Chỉnh sửa sân"
          onClick={(e) => {
            e.stopPropagation(); 
            handlers.onEdit(court);
          }}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 4,
            color: colors.text,
            zIndex: 2,
          }}
        >
          <Edit size={16} />
        </button>
      </div>

      <div>

        {court.status === 'active' && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 'bold' }}><Zap size={14} color="#0ea5e9" /> Đang trống</span>}

        {court.status === 'maintenance' && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 'bold' }}><Wrench size={14} color="#eab308" /> Bảo trì</span>}

        {court.status === 'inactive' && <span style={{ fontSize: 13, fontWeight: 'bold' }}>Tạm ngưng</span>}
        
        {court.status === 'booked' && (

          <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: '4px' }}>

            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 'bold', color: colors.text }}>
              <Clock size={14} /> Đang chơi
            </span>
            
            {court.bookingDetails ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' /* <-- Đã xóa paddingLeft: 20 */ }}>

                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 'bold', color: colors.text }}>
                  <Timer size={13} /> 
                  {court.bookingDetails.time} 
                </span>

                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 'bold', color: colors.text }}>
                  <DollarSign size={13} /> 
                  {court.bookingDetails.total.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
            ) : (
              <div style={{ fontSize: 12 }}>...</div> 
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const CourtDiagram = ({ courts, loading, error, handlers, facilities, selectedFacility }) => {
  if (loading) return <p>Đang tải sơ đồ sân...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!courts || courts.length === 0) {
    return (
      <div style={{ background: '#fff', padding: 20, borderRadius: 12, textAlign: 'center' }}>
        <h4>Không tìm thấy sân nào</h4>
        <p>Hãy thử thay đổi bộ lọc hoặc thêm sân mới.</p>
      </div>
    );
  }
  const facilitiesToDisplay =
    selectedFacility === "all"
      ? facilities
      : facilities.filter((f) => f._id === selectedFacility);
  return (
    <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 6px 20px rgba(0,0,0,.06)", padding: 20 }}>
      {facilitiesToDisplay.map((facility) => {
        const courtsInFacility = courts.filter(c => (c.facility?._id || c.facility) === facility._id);
        if(courtsInFacility.length === 0) return null;
        return (
          <div key={facility._id} style={{ marginBottom: 24 }}>
            <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: 8 }}>
              {facility.name}
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 16,
                marginTop: 16
              }}
            >
              {courtsInFacility.map((court) => (
                <CourtCard key={court._id} court={court} handlers={handlers} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CourtDiagram;
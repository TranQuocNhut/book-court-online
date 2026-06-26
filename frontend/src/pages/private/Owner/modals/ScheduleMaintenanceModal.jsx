import React, { useEffect, useState } from "react";

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalBox = {
  width: 560,
  background: "#fff",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 10px 40px rgba(2,6,23,0.15)",
};

const ScheduleMaintenanceModal = ({ isOpen, onClose, court, onConfirm }) => {
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isTimepickerOpen, setIsTimepickerOpen] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState("start");
  const [selectedSlot, setSelectedSlot] = useState("12:00");

  useEffect(() => {
    if (isOpen && court) {
      setStartDate("");
      setStartTime("");
      setEndDate("");
      setEndTime("");
      setNote("");
      setError("");
    }
  }, [isOpen, court]);

  if (!isOpen) return null;

  const handleSave = () => {
    setError("");
    if (startDate && endDate) {
      const start = new Date(`${startDate}T${startTime || "00:00"}`);
      const end = new Date(`${endDate}T${endTime || "23:59"}`);
      if (end < start) {
        setError("Thời gian kết thúc phải lớn hơn hoặc bằng thời gian bắt đầu.");
        return;
      }
    }

    let parts = [];
    if (startDate) parts.push(`từ ${startDate}${startTime ? ` ${startTime}` : ""}`);
    if (endDate) parts.push(`đến ${endDate}${endTime ? ` ${endTime}` : ""}`);
    const when = parts.length ? parts.join(" ") : "";
    const maintenanceText = when ? `Bảo trì ${when}${note ? ` — ${note}` : ""}` : `${note || "Bảo trì"}`;

    // Kiểm tra xem thời gian bảo trì đã bắt đầu chưa
    let newStatus = court.status; // Giữ nguyên status hiện tại
    if (startDate) {
      const startDateTime = new Date(`${startDate}T${startTime || "00:00"}`);
      const now = new Date();
      
      // Chỉ set status = "maintenance" nếu thời gian bảo trì đã bắt đầu
      if (startDateTime <= now) {
        // Nếu đã qua thời gian kết thúc, có thể set về active hoặc giữ maintenance
        if (endDate) {
          const endDateTime = new Date(`${endDate}T${endTime || "23:59"}`);
          if (endDateTime < now) {
            // Đã qua thời gian bảo trì, có thể set về active
            newStatus = "active";
          } else {
            // Đang trong thời gian bảo trì
            newStatus = "maintenance";
          }
        } else {
          // Có ngày bắt đầu nhưng không có ngày kết thúc, và đã bắt đầu
          newStatus = "maintenance";
        }
      }
      // Nếu thời gian bắt đầu là tương lai, giữ nguyên status (có thể là "active")
    } else {
      // Không có ngày bắt đầu, coi như đang bảo trì ngay
      newStatus = "maintenance";
    }

    const updated = { ...court, maintenance: maintenanceText || "Đang bảo trì", status: newStatus };
    if (onConfirm) onConfirm(updated);
    if (onClose) onClose();
  };

  return (
    <div style={overlay}>
      <div style={modalBox}>
        <h3 style={{ margin: 0, marginBottom: 8 }}>Lên lịch bảo trì</h3>
        <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 12 }}>Sân: {court?.name || "-"}</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Ngày bắt đầu</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e5e7eb" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Giờ bắt đầu (tùy chọn)</label>
            <button
              type="button"
              onClick={() => {
                setTimePickerTarget("start");
                setSelectedSlot(startTime || "12:00");
                setIsTimepickerOpen(true);
              }}
              style={{ 
                width: "100%", 
                padding: "10px 16px", 
                borderRadius: 8, 
                border: "1px solid #e5e7eb", 
                background: "#fff", 
                cursor: "pointer",
                textAlign: "left",
                fontSize: 14,
                color: startTime ? "#111827" : "#9ca3af"
              }}
            >
              {startTime || "Chọn giờ bắt đầu"}
            </button>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Ngày kết thúc</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e5e7eb" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Giờ kết thúc (tùy chọn)</label>
            <button
              type="button"
              onClick={() => {
                setTimePickerTarget("end");
                setSelectedSlot(endTime || "12:00");
                setIsTimepickerOpen(true);
              }}
              style={{ 
                width: "100%", 
                padding: "10px 16px", 
                borderRadius: 8, 
                border: "1px solid #e5e7eb", 
                background: "#fff", 
                cursor: "pointer",
                textAlign: "left",
                fontSize: 14,
                color: endTime ? "#111827" : "#9ca3af"
              }}
            >
              {endTime || "Chọn giờ kết thúc"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Ghi chú (tùy chọn)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lý do bảo trì, phần việc, người phụ trách..." style={{ width: "100%", minHeight: 80, padding: 8, borderRadius: 8, border: "1px solid #e5e7eb" }} />
        </div>

        {error && <div style={{ color: "#ef4444", marginTop: 8 }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
          <button onClick={() => onClose && onClose()} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer" }}>Đóng</button>
          <button onClick={handleSave} style={{ padding: "8px 12px", borderRadius: 8, border: 0, background: "#10b981", color: "#fff", cursor: "pointer", fontWeight: 700 }}>Lưu</button>
        </div>

        {/* Timepicker modal - tùy chỉnh thời gian */}
        {isTimepickerOpen && (
          <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
            <div style={{ background: "rgba(0,0,0,0.45)", position: "absolute", inset: 0 }} onClick={() => setIsTimepickerOpen(false)} />
            <div style={{ position: "relative", width: "400px", background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 30px 60px rgba(2,6,23,0.18)", zIndex: 10001 }}>
              {/* Header */}
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>
                  Chọn giờ {timePickerTarget === "start" ? "bắt đầu" : "kết thúc"}
                </h3>
              </div>

              {/* Time input - tùy chỉnh tự do */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 14, marginBottom: 8, color: '#6b7280', fontWeight: 600 }}>
                  Nhập giờ tùy chỉnh
                </label>
                <input
                  type="time"
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: "2px solid #e5e7eb",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#111827",
                    background: "#fff",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "2px solid #2563eb";
                  }}
                  onBlur={(e) => {
                    e.target.style.border = "2px solid #e5e7eb";
                  }}
                />
              </div>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }}></div>
                <span style={{ padding: "0 12px", fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>HOẶC CHỌN NHANH</span>
                <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }}></div>
              </div>

              {/* Time slots - chọn nhanh */}
              <div style={{ fontSize: 14, marginBottom: 12, color: '#6b7280', fontWeight: 600 }}>Chọn nhanh</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20, maxHeight: '200px', overflowY: 'auto', padding: '8px' }}>
                {[
                  ['06:00','06:00'],['06:30','06:30'],['07:00','07:00'],['07:30','07:30'],
                  ['08:00','08:00'],['08:30','08:30'],['09:00','09:00'],['09:30','09:30'],
                  ['10:00','10:00'],['10:30','10:30'],['11:00','11:00'],['11:30','11:30'],
                  ['12:00','12:00'],['12:30','12:30'],['13:00','13:00'],['13:30','13:30'],
                  ['14:00','14:00'],['14:30','14:30'],['15:00','15:00'],['15:30','15:30'],
                  ['16:00','16:00'],['16:30','16:30'],['17:00','17:00'],['17:30','17:30'],
                  ['18:00','18:00'],['18:30','18:30'],['19:00','19:00'],['19:30','19:30'],
                  ['20:00','20:00'],['20:30','20:30'],['21:00','21:00'],['21:30','21:30'],
                  ['22:00','22:00'],['22:30','22:30'],['23:00','23:00'],['23:30','23:30']
                ].map(([val,label]) => {
                  const active = selectedSlot === val;
                  return (
                    <button 
                      key={val} 
                      onClick={() => setSelectedSlot(val)} 
                      style={{ 
                        padding: '12px 8px', 
                        borderRadius: 10, 
                        border: active ? '2px solid #2563eb' : '1px solid #e5e7eb', 
                        background: active ? '#eff6ff' : '#fff', 
                        cursor: 'pointer', 
                        boxShadow: active ? '0 4px 12px rgba(37,99,235,0.15)' : 'none',
                        transition: 'all 0.2s',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }} 
                      aria-pressed={active}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.target.style.border = '1px solid #2563eb';
                          e.target.style.background = '#f0f9ff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.target.style.border = '1px solid #e5e7eb';
                          e.target.style.background = '#fff';
                        }
                      }}
                    >
                      <div style={{ fontSize: 14, color: active ? '#2563eb' : '#374151', fontWeight: active ? 700 : 500 }}>{label}</div>
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button 
                  type="button" 
                  onClick={() => { setIsTimepickerOpen(false); }} 
                  style={{ 
                    padding: "10px 18px", 
                    borderRadius: 10, 
                    border: "1px solid #e5e7eb", 
                    background: "#fff", 
                    cursor: "pointer", 
                    fontWeight: 600,
                    fontSize: 14,
                    color: "#374151"
                  }}
                >
                  Hủy
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    // Chỉ apply giờ đã chọn
                    if (timePickerTarget === "start") {
                      setStartTime(selectedSlot);
                    } else {
                      setEndTime(selectedSlot);
                    }
                    setIsTimepickerOpen(false);
                  }} 
                  style={{ 
                    padding: "10px 18px", 
                    borderRadius: 10, 
                    border: 0, 
                    background: "#2563eb", 
                    color: "#fff", 
                    cursor: "pointer", 
                    fontWeight: 700, 
                    fontSize: 14,
                    boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
                  }}
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleMaintenanceModal;

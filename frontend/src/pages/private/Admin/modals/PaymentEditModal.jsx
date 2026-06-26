import React, { useState, useEffect } from "react";
import { X, Save, User, DollarSign, List, Building } from "lucide-react";

// Component con cho Tiêu đề Card
const CardHeader = ({ Icon, title }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "16px 20px",
      borderBottom: "1px solid #e5e7eb",
      color: "#374151",
    }}
  >
    <Icon size={18} />
    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h3>
  </div>
);

// Component con cho Input
const FormInput = ({ label, value, name, onChange, readOnly = false, type = "text" }) => (
  <div style={{ marginBottom: 16 }}>
    <label
      style={{
        display: "block",
        fontSize: 13,
        color: "#374151",
        fontWeight: 600,
        marginBottom: 6,
      }}
    >
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #d1d5db",
        fontSize: 14,
        background: readOnly ? "#f3f4f6" : "#fff",
        boxSizing: "border-box",
      }}
    />
  </div>
);

// Component con cho Select
const FormSelect = ({ label, value, name, onChange, options }) => (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          color: "#374151",
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid #d1d5db",
          fontSize: 14,
          background: "#fff",
          boxSizing: "border-box",
        }}
      >
        {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

// Component Modal chính
const PaymentEditModal = ({ isOpen, onClose, onSave, payment }) => {
  const [formData, setFormData] = useState(null);

  // Cập nhật form data khi `payment` prop thay đổi
  useEffect(() => {
    if (payment) {
      setFormData({ ...payment });
    }
  }, [payment]);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (name === "amount") {
        setFormData(prev => ({ ...prev, amount: parseInt(value) || 0 }));
    } else {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
    }
  };

  // Xử lý lưu
  const handleSave = () => {
    onSave(formData);
  };

  if (!isOpen || !formData) return null;

  return (
    // Backdrop
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1010, // Ở trên modal chi tiết
      }}
      onClick={onClose}
    >
      {/* Nội dung Modal */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,.1)",
          width: "90%",
          maxWidth: "550px",
          maxHeight: "90vh",
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
            padding: "16px 24px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h2
            style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#1f2937" }}
          >
            Chỉnh sửa thanh toán:{" "}
            <span style={{ color: "#3b82f6" }}>{formData.id}</span>
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: 0,
              cursor: "pointer",
              color: "#6b7280",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body (Nền xám) */}
        <div
          style={{
            padding: 24,
            background: "#f9fafb",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {/* Card 1: Thông tin giao dịch */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
            <CardHeader Icon={List} title="Thông tin giao dịch" />
            <div style={{ padding: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                    <FormInput label="Mã Giao dịch (Hệ thống)" value={formData.id} readOnly={true} />
                    <FormInput label="Mã Đặt sân" value={formData.bookingId} readOnly={true} />
                </div>
                <FormInput label="Mã Giao dịch (Bên T3)" value={formData.transactionId} readOnly={true} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                    <FormInput label="Ngày" value={formData.date} readOnly={true} />
                    <FormInput label="Giờ" value={formData.time} readOnly={true} />
                </div>
            </div>
          </div>

          {/* Card 2: Thông tin thanh toán */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
            <CardHeader Icon={DollarSign} title="Thông tin thanh toán" />
            <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
              <FormInput label="Số tiền (VNĐ)" name="amount" value={formData.amount} onChange={handleChange} type="number" />
              <FormSelect
                label="Phương thức"
                name="method"
                value={formData.method}
                onChange={handleChange}
                options={[
                    { value: "bank_transfer", label: "Chuyển khoản" },
                    { value: "momo", label: "MoMo" },
                    { value: "vnpay", label: "VNPay" },
                ]}
              />
              <FormSelect
                label="Trạng thái"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={[
                    { value: "completed", label: "Hoàn thành" },
                    { value: "pending", label: "Chờ xử lý" },
                    { value: "failed", label: "Thất bại" },
                    { value: "refunded", label: "Hoàn tiền" },
                ]}
              />
            </div>
          </div>

          {/* Card 3: Thông tin bên liên quan */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
            <CardHeader Icon={User} title="Thông tin bên liên quan" />
            <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
              <FormInput label="Khách hàng" value={formData.customer} readOnly={true} />
              <FormInput label="Sân" value={formData.facility} readOnly={true} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            padding: "16px 24px",
            borderTop: "1px solid #e5e7eb",
            background: "#fff",
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "#fff",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: "8px 14px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSave}
            style={{
              background: "#3b82f6", // Màu xanh dương
              color: "#fff",
              border: 0,
              borderRadius: 8,
              padding: "8px 14px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Save size={16} />
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentEditModal;
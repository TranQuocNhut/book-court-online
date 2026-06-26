import React from "react";
import { Clock5, CheckCircle2, XCircle, Power, PowerOff, Wrench, AlertCircle, Ban } from "lucide-react";

const StatusBadge = ({ value, type = "booking" }) => {
  // Booking status map
  const bookingMap = {
    pending: {
      bg: "#e6effe",
      color: "#4338ca",
      icon: <Clock5 size={14} />,
      label: "Chờ xác nhận",
    },
    pending_payment: {
      bg: "#fef3c7",
      color: "#d97706",
      icon: <Clock5 size={14} />,
      label: "Chờ thanh toán",
    },
    hold: {
      bg: "#fef3c7",
      color: "#d97706",
      icon: <Clock5 size={14} />,
      label: "Đang giữ chỗ",
    },
    confirmed: {
      bg: "#e6f9f0",
      color: "#059669",
      icon: <CheckCircle2 size={14} />,
      label: "Đã xác nhận",
    },
    expired: {
      bg: "#fee2e2",
      color: "#dc2626",
      icon: <XCircle size={14} />,
      label: "Hết hạn",
    },
    cancelled: {
      bg: "#fee2e2",
      color: "#ef4444",
      icon: <XCircle size={14} />,
      label: "Đã hủy",
    },
    completed: {
      bg: "#e6f9f0",
      color: "#059669",
      icon: <CheckCircle2 size={14} />,
      label: "Đã hoàn thành",
    },
  };

  // Court status map
  const courtMap = {
    active: {
      bg: "#e6f9f0",
      color: "#059669",
      icon: <Power size={14} />,
      label: "Đang hoạt động",
    },
    inactive: {
      bg: "#fee2e2",
      color: "#ef4444",
      icon: <PowerOff size={14} />,
      label: "Ngưng hoạt động",
    },
    maintenance: {
      bg: "#fef3c7",
      color: "#d97706",
      icon: <Wrench size={14} />,
      label: "Bảo trì",
    },
  };

  // Staff status map
  const staffMap = {
    active: {
      bg: "#e6f9f0",
      color: "#059669",
      icon: <CheckCircle2 size={14} />,
      label: "Đang hoạt động",
    },
    inactive: {
      bg: "#fee2e2",
      color: "#ef4444",
      icon: <PowerOff size={14} />,
      label: "Đã khóa",
    },
  };

  // User status map
  const userMap = {
    active: {
      bg: "#e6f9f0",
      color: "#059669",
      icon: <CheckCircle2 size={14} />,
      label: "Hoạt động",
    },
    locked: {
      bg: "#fee2e2",
      color: "#ef4444",
      icon: <Ban size={14} />,
      label: "Đã khóa",
    },
    deleted: {
      bg: "#f3f4f6",
      color: "#6b7280",
      icon: <AlertCircle size={14} />,
      label: "Đã xóa",
    },
  };

  // Payment status map
  const paymentMap = {
    pending: {
      bg: "#fef3c7",
      color: "#d97706",
      icon: <Clock5 size={14} />,
      label: "Chờ xử lý",
    },
    completed: {
      bg: "#e6f9f0",
      color: "#059669",
      icon: <CheckCircle2 size={14} />,
      label: "Hoàn thành",
    },
    failed: {
      bg: "#fee2e2",
      color: "#ef4444",
      icon: <XCircle size={14} />,
      label: "Thất bại",
    },
    refunded: {
      bg: "#fee2e2",
      color: "#ef4444",
      icon: <XCircle size={14} />,
      label: "Đã hoàn tiền",
    },
  };

  // Facility status map
  const facilityMap = {
    active: {
      bg: "#e6f9f0",
      color: "#059669",
      icon: <CheckCircle2 size={14} />,
      label: "Hoạt động",
    },
    inactive: {
      bg: "#fee2e2",
      color: "#ef4444",
      icon: <PowerOff size={14} />,
      label: "Ngưng hoạt động",
    },
    pending: {
      bg: "#fef3c7",
      color: "#d97706",
      icon: <Clock5 size={14} />,
      label: "Chờ duyệt",
    },
  };

  let map;
  switch (type) {
    case "booking":
      map = bookingMap;
      break;
    case "court":
      map = courtMap;
      break;
    case "staff":
      map = staffMap;
      break;
    case "user":
      map = userMap;
      break;
    case "payment":
      map = paymentMap;
      break;
    case "facility":
      map = facilityMap;
      break;
    default:
      map = bookingMap;
  }

  const config = map[value] || map[Object.keys(map)[0]];

  return (
    <span
      style={{
        background: config.bg,
        color: config.color,
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {config.icon}
      {config.label}
    </span>
  );
};

export default StatusBadge;


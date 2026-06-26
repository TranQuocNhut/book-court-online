import React from "react";
import { Eye, Pencil, Power, PowerOff, Wrench, Trash2 } from "lucide-react";
import { ActionButton } from "../shared";
import StatusBadge from "../shared/StatusBadge";

const CourtRow = ({ court, handlers }) => {
  return (
    <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
      <td style={{ padding: 12, fontWeight: 600 }}>{court.name}</td>
      <td style={{ padding: 12 }}>{court.type}</td>
      <td style={{ padding: 12 }}>{court.capacity} người</td>
      <td style={{ padding: 12, fontWeight: 600, color: "#059669" }}>
        {(court.price || 0).toLocaleString()} VNĐ
      </td>
      <td style={{ padding: 12 }}>
        <StatusBadge value={court.status} type="court" />
      </td>
      <td style={{ padding: 12, fontSize: 12, color: "#6b7280" }}>
        {court.maintenance || "-"}
      </td>
      <td style={{ padding: 12, whiteSpace: "nowrap" }}>
        <ActionButton
          bg="#06b6d4"
          Icon={Eye}
          onClick={() => handlers.onView(court)}
          title="Xem"
        />
        <ActionButton
          bg="#22c55e"
          Icon={Pencil}
          onClick={() => handlers.onEdit(court)}
          title="Sửa"
        />
        {court.status === "active" ? (
          <ActionButton
            bg="#f59e0b"
            Icon={PowerOff}
            onClick={() => handlers.onSetMaintenance(court)}
            title="Đặt bảo trì"
          />
        ) : (
          <ActionButton
            bg="#10b981"
            Icon={Power}
            onClick={() => handlers.onActivate(court)}
            title="Kích hoạt"
          />
        )}
        <ActionButton
          bg="#6b7280"
          Icon={Wrench}
          onClick={() => handlers.onScheduleMaintenance(court)}
          title="Lên lịch bảo trì"
        />
        <ActionButton
          bg="#ef4444"
          Icon={Trash2}
          onClick={() => handlers.onDelete(court)}
          title="Xóa"
        />
      </td>
    </tr>
  );
};

export default CourtRow;


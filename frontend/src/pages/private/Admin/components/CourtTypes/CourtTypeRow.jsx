import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ActionButton, StatusBadge } from "../shared";

const CourtTypeRow = ({
  courtType,
  index,
  page,
  pageSize,
  onEdit,
  onDelete,
}) => {
  return (
    <tr key={courtType._id || courtType.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
      <td style={{ padding: 12 }}>{(page - 1) * pageSize + index + 1}</td>
      <td style={{ padding: 12, fontWeight: 600 }}>{courtType.name}</td>
      <td style={{ padding: 12 }}>
        {courtType.sportCategory?.name || "N/A"}
      </td>
      <td style={{ padding: 12, color: "#6b7280" }}>
        {courtType.description || "-"}
      </td>
      <td style={{ padding: 12, color: "#6b7280" }}>
        {Array.isArray(courtType.features) && courtType.features.length > 0
          ? courtType.features.join(", ")
          : "-"}
      </td>
      <td style={{ padding: 12 }}>{courtType.courts || 0}</td>
      <td style={{ padding: 12 }}>
        <StatusBadge value={courtType.status === "active" ? "active" : "inactive"} type="court" />
      </td>
      <td style={{ padding: 12, whiteSpace: "nowrap" }}>
        <ActionButton
          bg="#22c55e"
          Icon={Pencil}
          onClick={() => onEdit(courtType)}
          title="Sửa"
        />
        <ActionButton
          bg="#ef4444"
          Icon={Trash2}
          onClick={() => onDelete(courtType)}
          title="Xóa"
        />
      </td>
    </tr>
  );
};

export default CourtTypeRow;


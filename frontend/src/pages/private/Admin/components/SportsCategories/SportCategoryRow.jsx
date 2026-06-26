import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ActionButton, StatusBadge } from "../shared";

const SportCategoryRow = ({
  category,
  index,
  page,
  pageSize,
  onEdit,
  onDelete,
}) => {
  return (
    <tr key={category._id || category.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
      <td style={{ padding: 12 }}>{(page - 1) * pageSize + index + 1}</td>
      <td style={{ padding: 12 }}></td>
      <td style={{ padding: 12, fontWeight: 600 }}>{category.name}</td>
      <td style={{ padding: 12, color: "#6b7280" }}>
        {category.description}
      </td>
      <td style={{ padding: 12 }}>{category.facilities || 0}</td>
      <td style={{ padding: 12 }}>
        <StatusBadge value={category.status === "active" ? "active" : "inactive"} type="court" />
      </td>
      <td style={{ padding: 12, whiteSpace: "nowrap" }}>
        <ActionButton
          bg="#22c55e"
          Icon={Pencil}
          onClick={() => onEdit(category)}
          title="Sửa"
        />
        <ActionButton
          bg="#ef4444"
          Icon={Trash2}
          onClick={() => onDelete(category)}
          title="Xóa"
        />
      </td>
    </tr>
  );
};

export default SportCategoryRow;


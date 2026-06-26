import React from "react";
import { Pencil, Trash2, Percent, DollarSign } from "lucide-react";
import { ActionButton } from "../shared";

const PromotionRow = ({
  promotion,
  statusMap,
  getStatus,
  formatDiscount,
  onEdit,
  onDelete,
}) => {
  const currentStatus = getStatus(promotion);
  const status = statusMap[currentStatus] || statusMap.active;

  return (
    <tr
      key={promotion.id}
      style={{
        borderBottom: "1px solid #f3f4f6",
        opacity: currentStatus === "expired" ? 0.6 : 1,
      }}
    >
      <td style={{ padding: 12, fontWeight: 700, color: "#1f2937" }}>
        {promotion.code}
      </td>
      <td style={{ padding: 12, fontWeight: 600 }}>{promotion.name}</td>
      <td style={{ padding: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontWeight: 700,
            color: "#059669",
          }}
        >
          {promotion.discountType === "percentage" ? (
            <Percent size={16} />
          ) : (
            <DollarSign size={16} />
          )}
          {formatDiscount(promotion)}
        </div>
      </td>
      <td style={{ padding: 12, color: "#6b7280" }}>{promotion.startDate}</td>
      <td style={{ padding: 12, color: "#6b7280" }}>{promotion.endDate}</td>
      <td style={{ padding: 12 }}>
        <div style={{ maxWidth: "200px" }}>
          {promotion.applicableFacilities[0] === "Tất cả sân" ? (
            <span
              style={{
                background: "#e6f9f0",
                color: "#059669",
                padding: "4px 8px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Tất cả sân
            </span>
          ) : (
            <div
              style={{
                fontSize: 12,
                color: "#6b7280",
              }}
              title={promotion.applicableFacilities.join(", ")}
            >
              {promotion.applicableFacilities.length > 1
                ? `${promotion.applicableFacilities[0]} (+${promotion.applicableFacilities.length - 1})`
                : promotion.applicableFacilities[0]}
            </div>
          )}
          {promotion.applicableAreas && promotion.applicableAreas.length > 0 && (
            <div
              style={{
                fontSize: 11,
                color: "#9ca3af",
                marginTop: 4,
              }}
            >
              {promotion.applicableAreas.join(", ")}
            </div>
          )}
        </div>
      </td>
      <td style={{ padding: 12 }}>
        <div>
          <div style={{ fontWeight: 600 }}>{promotion.usageCount} lượt</div>
          {promotion.maxUsage && (
            <div
              style={{
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              / {promotion.maxUsage} tối đa
            </div>
          )}
        </div>
      </td>
      <td style={{ padding: 12 }}>
        <span
          style={{
            background: status.bg,
            color: status.color,
            padding: "4px 8px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {status.label}
        </span>
      </td>
      <td style={{ padding: 12, whiteSpace: "nowrap" }}>
        <ActionButton
          bg="#22c55e"
          Icon={Pencil}
          onClick={() => onEdit(promotion)}
          title="Sửa"
        />
        <ActionButton
          bg="#ef4444"
          Icon={Trash2}
          onClick={() => onDelete(promotion)}
          title="Xóa"
        />
      </td>
    </tr>
  );
};

export default PromotionRow;


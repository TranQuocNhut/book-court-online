import React from 'react'
import '../../../../styles/Promotion.css'

export default function PromotionSidebar({ filters, onFilterChange, promotionCounts }) {
  return (
    <div className="promotion-sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">Ưu đãi</h3>
        <div className="filter-group">
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filters.voucher || false}
              onChange={(e) => onFilterChange('voucher', e.target.checked)}
            />
            <span className="checkbox-label">
              Phiếu giảm giá
              {promotionCounts.voucher > 0 && (
                <span className="filter-count">({promotionCounts.voucher})</span>
              )}
            </span>
          </label>

          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filters.limitedTime || false}
              onChange={(e) => onFilterChange('limitedTime', e.target.checked)}
            />
            <span className="checkbox-label">
              Khuyến mãi có thời hạn
              {promotionCounts.limitedTime > 0 && (
                <span className="filter-count">({promotionCounts.limitedTime})</span>
              )}
            </span>
          </label>

          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filters.specialCampaign || false}
              onChange={(e) => onFilterChange('specialCampaign', e.target.checked)}
            />
            <span className="checkbox-label">
              Chiến dịch đặc biệt
              {promotionCounts.specialCampaign > 0 && (
                <span className="filter-count">({promotionCounts.specialCampaign})</span>
              )}
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}


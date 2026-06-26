import React from 'react'
import { FiGrid, FiList, FiNavigation, FiTag, FiStar } from 'react-icons/fi'
import '../../../../styles/Facilities.css'

export default function ViewControls({
  quick,
  view,
  onQuickChange,
  onViewChange,
  filterNearby,
  onToggleNearby,
  maxDistance,
  onMaxDistanceChange,
  userLocation,
  isMobile
}) {
  const QuickButton = ({ value, label, icon: Icon }) => (
    <button
      onClick={() => onQuickChange(value)}
      className={`quick-filter-button ${quick === value ? 'active' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      {Icon && <Icon size={14} />}
      {label}
    </button>
  )

  return (
    <div className="view-toggle-row">
      <div className="quick-buttons-wrapper">
        <div className="quick-buttons-group">
          <button
            onClick={onToggleNearby}
            className={`quick-filter-button ${filterNearby ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: userLocation ? 1 : 0.6,
              cursor: userLocation ? 'pointer' : 'not-allowed'
            }}
            disabled={!userLocation}
            title={!userLocation ? 'Không thể lấy vị trí của bạn' : filterNearby ? 'Tắt lọc theo vị trí' : 'Tìm sân gần tôi'}
          >
            <FiNavigation size={14} />
            Gần tôi
          </button>
          {filterNearby && (
            <select
              value={maxDistance}
              onChange={(e) => onMaxDistanceChange(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: '#fff',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                marginLeft: '8px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <option value={5}>5km</option>
              <option value={10}>10km</option>
              <option value={20}>20km</option>
              <option value={50}>50km</option>
            </select>
          )}
          <QuickButton value="cheap" label="Giá tốt" icon={FiTag} />
          <QuickButton value="top" label="Đánh giá cao" icon={FiStar} />
        </div>
        {!isMobile && (
          <div className="view-toggle-group">
            <button
              onClick={() => onViewChange("grid")}
              className={`view-toggle-btn ${view === "grid" ? 'active' : ''}`}
            >
              <FiGrid />
            </button>
            <button
              onClick={() => onViewChange("list")}
              className={`view-toggle-btn ${view === "list" ? 'active' : ''}`}
            >
              <FiList />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


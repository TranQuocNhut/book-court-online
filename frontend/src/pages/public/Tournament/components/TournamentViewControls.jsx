import React from 'react'
import { Grid3x3, List } from 'lucide-react'

const TournamentViewControls = ({ 
  viewMode, 
  onViewModeChange,
  sort,
  onSortChange
}) => {
  return (
    <div className="view-toggle-row">
      <div className="quick-buttons-wrapper">
        <div className="quick-buttons-group">
          {/* Sort dropdown */}
          <select
            value={sort || 'default'}
            onChange={(e) => onSortChange(e.target.value)}
            className="sport-select"
          >
            <option value="default">Sắp xếp</option>
            <option value="updated">Mới cập nhật</option>
            <option value="views">Nhiều người xem</option>
          </select>
        </div>
        <div className="view-toggle-group">
          <button 
            onClick={() => onViewModeChange('grid')}
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            title="Hiển thị dạng lưới"
          >
            <Grid3x3 size={18} />
          </button>
          <button 
            onClick={() => onViewModeChange('list')}
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            title="Hiển thị dạng danh sách"
          >
            <List size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default TournamentViewControls


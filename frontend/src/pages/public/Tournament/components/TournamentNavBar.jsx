import React from 'react'
import { Search, ChevronDown, Grid3x3, List } from 'lucide-react'

const TournamentNavBar = ({ 
  searchQuery, 
  onSearchChange, 
  onSearch, 
  filters, 
  onFilterChange,
  tournaments,
  viewMode,
  onViewModeChange
}) => {
  // Get unique values for filters
  const sports = [...new Set(tournaments.map(t => t.sport))].filter(Boolean)
  const locations = [...new Set(tournaments.map(t => t.location))].filter(Boolean)

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch()
    }
  }

  return (
    <div className="tournament-nav-bar">
      <div className="tournament-nav-content">
        {/* Search Input */}
        <div className="tournament-search-input-wrapper">
          <input
            type="text"
            className="tournament-search-input"
            placeholder="Tên giải đấu, tên người quản lý"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>

        {/* Search Button */}
        <button 
          className="tournament-search-button"
          onClick={onSearch}
        >
          <Search size={20} />
        </button>

        {/* Filter Dropdowns */}
        <div className="tournament-filter-dropdown">
          <select
            value={filters.sport}
            onChange={(e) => onFilterChange('sport', e.target.value)}
            className="tournament-filter-select"
          >
            <option value="all">Môn Thi Đấu</option>
            {sports.map(sport => (
              <option key={sport} value={sport}>{sport}</option>
            ))}
          </select>
          <ChevronDown size={16} className="dropdown-icon" />
        </div>

        <div className="tournament-filter-dropdown">
          <select
            value={filters.format || 'all'}
            onChange={(e) => onFilterChange('format', e.target.value)}
            className="tournament-filter-select"
          >
            <option value="all">Hình Thức</option>
            <option value="single">Đơn</option>
            <option value="team">Đội</option>
            <option value="mixed">Hỗn hợp</option>
          </select>
          <ChevronDown size={16} className="dropdown-icon" />
        </div>

        <div className="tournament-filter-dropdown">
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="tournament-filter-select"
          >
            <option value="all">Trạng Thái</option>
            <option value="upcoming">Đang đăng ký</option>
            <option value="starting">Sắp diễn ra</option>
            <option value="ongoing">Đang diễn ra</option>
            <option value="completed">Đã kết thúc</option>
          </select>
          <ChevronDown size={16} className="dropdown-icon" />
        </div>

        <div className="tournament-filter-dropdown">
          <select
            value={filters.sort || 'newest'}
            onChange={(e) => onFilterChange('sort', e.target.value)}
            className="tournament-filter-select"
          >
            <option value="newest">Sắp Xếp</option>
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="prize-high">Giải thưởng cao</option>
            <option value="prize-low">Giải thưởng thấp</option>
            <option value="participants-high">Nhiều người tham gia</option>
          </select>
          <ChevronDown size={16} className="dropdown-icon" />
        </div>

        {/* View Mode Toggle */}
        <div className="tournament-view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => onViewModeChange('grid')}
            title="Hiển thị dạng lưới"
          >
            <Grid3x3 size={18} />
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => onViewModeChange('list')}
            title="Hiển thị dạng danh sách"
          >
            <List size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default TournamentNavBar


import React, { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { categoryApi } from '../../../../api/categoryApi'
import { toast } from 'react-toastify'

const TournamentFilterBar = ({ 
  filters, 
  onFilterChange,
  tournaments,
  searchQuery,
  onSearchChange,
  onSearch
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch()
    }
  }
  const [sportCategories, setSportCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  // Fetch sport categories from API
  useEffect(() => {
    const fetchSportCategories = async () => {
      try {
        setLoadingCategories(true)
        const result = await categoryApi.getSportCategories({ status: 'active' })
        if (result.success && result.data) {
          setSportCategories(result.data)
        }
      } catch (error) {
        console.error('Error fetching sport categories:', error)
        toast.error('Không thể tải danh sách môn thể thao')
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchSportCategories()
  }, [])

  const hasActiveFilters = filters.status !== 'all' || 
                           filters.sport !== 'all' || 
                           (filters.format && filters.format !== 'all')

  const handleClearFilters = () => {
    if (filters.status !== 'all') onFilterChange('status', 'all')
    if (filters.sport !== 'all') onFilterChange('sport', 'all')
    if (filters.format && filters.format !== 'all') onFilterChange('format', 'all')
  }

  return (
    <div className="filter-row">
      {/* Search Input */}
      <div className="search-input-wrapper">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Tìm kiếm theo tên giải đấu..."
          className="search-input"
        />
      </div>

      {/* Sport Filter */}
      <div className="filter-select-wrapper">
        <select
          value={filters.sport}
          onChange={(e) => onFilterChange('sport', e.target.value)}
          className="province-select"
          disabled={loadingCategories}
        >
          <option value="all">Tất cả Môn Thi Đấu</option>
          {sportCategories.map(category => (
            <option key={category._id || category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-select-wrapper">
        <select
          value={filters.format || 'all'}
          onChange={(e) => onFilterChange('format', e.target.value)}
          className="district-select"
        >
          <option value="all">Tất cả Hình Thức</option>
          <option value="single-elimination">Loại trực tiếp</option>
          <option value="round-robin">Vòng tròn</option>
        </select>
      </div>

      <div className="filter-select-wrapper">
        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="district-select"
        >
          <option value="all">Tất cả Trạng Thái</option>
          <option value="upcoming">Đang đăng ký</option>
          <option value="starting">Sắp diễn ra</option>
          <option value="ongoing">Đang diễn ra</option>
          <option value="completed">Đã kết thúc</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button
          className="clear-filter-btn"
          onClick={handleClearFilters}
        >
          Xóa bộ lọc
        </button>
      )}
    </div>
  )
}

export default TournamentFilterBar


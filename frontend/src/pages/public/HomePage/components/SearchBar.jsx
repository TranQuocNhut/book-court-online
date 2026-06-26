import React from 'react'
import { Search, MapPin, Building2 } from 'lucide-react'
import TypeWriter from '../../../../components/ui/TypeWriter'
import '../../../../styles/HomePage.css'

export default function SearchBar({
  selectedSport,
  selectedProvince,
  selectedDistrict,
  provinces,
  districts,
  loading,
  onSportChange,
  onProvinceChange,
  onDistrictChange,
  onSearch
}) {
  return (
    <div className="search-bar">
      <div className="search-bar-header">
        <Search size={20} style={{ flexShrink: 0 }} />
        <TypeWriter 
          text="Tìm kiếm sân phù hợp ngay" 
          speed={40}
        />
      </div>
      
      <div className="search-bar-filters">
        <div className="filter-group">
          <Building2 
            size={20} 
            className="filter-icon" 
          />
          <select 
            value={selectedSport}
            onChange={(e) => onSportChange(e.target.value)}
            className="filter-select"
          >
            <option value="">Môn thể thao</option>
            <option value="football">Bóng đá</option>
            <option value="badminton">Cầu lông</option>
            <option value="tennis">Tennis</option>
            <option value="pickleball">Pickleball</option>
          </select>
        </div>
        
        <div className="filter-group">
          <MapPin 
            size={20} 
            className="filter-icon" 
          />
          <select 
            value={selectedProvince}
            onChange={(e) => onProvinceChange(e.target.value)}
            className="filter-select"
          >
            <option value="">Tỉnh/Thành phố</option>
            {provinces.map((province) => (
              <option key={province.code} value={province.name}>
                {province.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <Building2 
            size={20} 
            className={`filter-icon ${!selectedProvince ? 'disabled' : ''}`}
          />
          <select 
            value={selectedDistrict}
            onChange={(e) => onDistrictChange(e.target.value)}
            disabled={!selectedProvince}
            className={`filter-select ${!selectedProvince ? 'disabled' : ''}`}
          >
            <option value="">Quận/Huyện</option>
            {districts.map((district) => (
              <option key={district.code} value={district.name}>
                {district.name}
              </option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={onSearch}
          disabled={loading}
          className="search-button"
        >
          {loading ? (
            <>
              <div className="spinner" />
              Đang tìm...
            </>
          ) : (
            <>
              <Search size={20} />
              Tìm kiếm ngay
            </>
          )}
        </button>
      </div>
    </div>
  )
}


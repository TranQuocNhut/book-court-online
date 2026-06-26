import React from 'react'
import { sportChips } from '../mockData'
import '../../../../styles/Facilities.css'

export default function FilterBar({
  provinces,
  districts,
  selectedProvince,
  selectedDistrict,
  sport,
  onProvinceChange,
  onDistrictChange,
  onSportChange,
  onClearFilters
}) {
  return (
    <div className="filter-row">
      <select 
        className="sport-select"
        value={sport} 
        onChange={e => onSportChange(e.target.value)}
      >
        {sportChips.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <select 
        className="province-select"
        value={selectedProvince} 
        onChange={e => onProvinceChange(e.target.value)}
      >
        <option value="">Tất cả Tỉnh/Thành phố</option>
        {provinces.map((province) => (
          <option key={province.code} value={province.name}>
            {province.name}
          </option>
        ))}
      </select>
      <select 
        className="district-select"
        value={selectedDistrict} 
        onChange={e => onDistrictChange(e.target.value)}
        disabled={!selectedProvince}
      >
        <option value="">Tất cả Quận/Huyện</option>
        {districts.map((district) => (
          <option key={district.code} value={district.name}>
            {district.name}
          </option>
        ))}
      </select>
      {(selectedProvince || selectedDistrict || (sport && sport !== 'Tất cả')) && (
        <button
          className="clear-filter-btn"
          onClick={onClearFilters}
        >
          Xóa bộ lọc
        </button>
      )}
    </div>
  )
}


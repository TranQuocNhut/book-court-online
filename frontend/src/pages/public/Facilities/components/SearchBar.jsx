import React from 'react'
import { FiSearch } from 'react-icons/fi'
import '../../../../styles/Facilities.css'

export default function SearchBar({ query, onQueryChange }) {
  return (
    <div className="search-bar-row">
      <div className="search-input-wrapper">
        <FiSearch className="search-icon" />
        <input
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder="Tìm kiếm theo tên sân..."
          className="search-input"
        />
      </div>
    </div>
  )
}


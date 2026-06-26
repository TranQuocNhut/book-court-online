import React from 'react'
import { Search } from 'lucide-react'

const TournamentSearchBar = ({ searchQuery, onSearchChange, onSearch }) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch()
    }
  }

  return (
    <div className="search-bar-row">
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
    </div>
  )
}

export default TournamentSearchBar


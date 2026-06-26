import React from 'react'

const OverviewTab = ({ tournament }) => {
  if (!tournament) return null

  return (
    <div className="overview-section">
      <div className="section-card">
        <h2>Mô tả giải đấu</h2>
        <p className="description-text">{tournament.fullDescription || tournament.description}</p>
      </div>
    </div>
  )
}

export default OverviewTab


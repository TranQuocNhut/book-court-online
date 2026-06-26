import React from 'react'
import { Trophy } from 'lucide-react'

const TournamentHero = () => {
  return (
    <div className="tournament-hero">
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-icon">
          <Trophy size={48} />
        </div>
        <h1 className="hero-title">Giải Đấu Thể Thao</h1>
        <p className="hero-description">
          Tham gia các giải đấu thể thao hấp dẫn, cạnh tranh và giành giải thưởng giá trị
        </p>
      </div>
    </div>
  )
}

export default TournamentHero


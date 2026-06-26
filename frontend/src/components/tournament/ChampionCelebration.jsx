import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { getChampion, getChampionName } from '../../utils/tournamentHelpers'
import './ChampionCelebration.css'

const ChampionCelebration = ({ tournament, onClose }) => {
  const [show, setShow] = useState(true)
  const champion = getChampion(tournament)
  const championName = getChampionName(tournament)

  // Không tự động đóng - chỉ đóng khi người dùng bấm nút đóng

  const handleClose = () => {
    setShow(false)
    setTimeout(() => {
      if (onClose) onClose()
    }, 300) // Đợi animation fade out
  }

  if (!show || !champion) return null

  return (
    <div className="champion-celebration-overlay" onClick={handleClose}>
      <div className="champion-celebration-content" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button 
          className="champion-celebration-close"
          onClick={handleClose}
          aria-label="Đóng"
        >
          <X size={24} />
        </button>

        {/* Fireworks particles - chạy liên tục */}
        <div className="fireworks-container">
          {[...Array(100)].map((_, i) => {
            const angle = Math.random() * 360
            const distance = 100 + Math.random() * 200
            const radian = (angle * Math.PI) / 180
            const x = Math.cos(radian) * distance
            const y = Math.sin(radian) * distance
            // Delay ngẫu nhiên để tạo hiệu ứng liên tục
            const delay = Math.random() * 4
            // Duration ngắn hơn để particles xuất hiện thường xuyên hơn
            const duration = 1.5 + Math.random() * 1.5
            
            return (
              <div 
                key={i} 
                className="firework-particle firework-continuous" 
                style={{
                  '--delay': `${delay}s`,
                  '--duration': `${duration}s`,
                  '--angle': `${angle}deg`,
                  '--distance': `${distance}px`,
                  '--x': `${x}px`,
                  '--y': `${y}px`,
                  '--color': i % 2 === 0 ? '#00d4ff' : '#00ff88',
                  '--iteration': 'infinite'
                }} 
              />
            )
          })}
        </div>

        {/* Congratulatory message */}
        <div className="champion-message">
          <h2 className="champion-title">
            Chúc mừng nhà đương kim vô địch của giải đấu!
          </h2>
        </div>

        {/* Champion logo */}
        <div className="champion-logo-container">
          {champion.logo ? (
            <img 
              src={champion.logo} 
              alt={championName}
              className="champion-logo"
              onError={(e) => {
                // Fallback nếu logo không load được
                e.target.style.display = 'none'
                const fallback = e.target.parentElement.querySelector('.champion-logo-fallback')
                if (fallback) fallback.style.display = 'flex'
              }}
            />
          ) : null}
          <div 
            className="champion-logo-fallback"
            style={{ display: champion.logo ? 'none' : 'flex' }}
          >
            <img 
              src="/team.png" 
              alt={championName}
              className="champion-logo-default"
            />
          </div>
          <div className="champion-ribbon">
            <div className="ribbon-left"></div>
            <div className="ribbon-center"></div>
            <div className="ribbon-right"></div>
          </div>
        </div>

        {/* Champion name */}
        <div className="champion-name">
          {championName}
        </div>
      </div>
    </div>
  )
}

export default ChampionCelebration


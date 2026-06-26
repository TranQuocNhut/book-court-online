import React from 'react'
import { stats } from '../constants'
import '../../../../styles/Partner.css'

export default function StatsSection() {
  return (
    <section className="stats-section">
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-item" data-aos="fade-up" data-aos-delay={index * 100}>
            <div className="stat-number">
              {stat.number}
            </div>
            <div className="stat-label">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}


import React from 'react'
import AchievementCard from '../components/AchievementCard'
import UpcomingBookingCard from '../components/UpcomingBookingCard'
import { mockAchievements, mockUpcomingBookings } from '../mockData'

export default function OverviewTab() {
  return (
    <div className="overview-section">
      {/* Thành tích */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '600' }}>Thành tích</h3>
        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#6b7280' }}>
          Các cột mốc bạn đã đạt được
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {mockAchievements.map(achievement => (
            <AchievementCard 
              key={achievement.id}
              title={achievement.title}
              description={achievement.description}
              isUnlocked={achievement.isUnlocked}
            />
          ))}
        </div>
      </div>

      {/* Lịch đặt sắp tới */}
      <div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '600' }}>Lịch đặt sắp tới</h3>
        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#6b7280' }}>
          Các sân bạn sẽ chơi trong thời gian tới
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mockUpcomingBookings.map(booking => (
            <UpcomingBookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      </div>
    </div>
  )
}


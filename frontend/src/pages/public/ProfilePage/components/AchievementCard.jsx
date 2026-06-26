import React from 'react'
import { Award } from 'lucide-react'

export default function AchievementCard({ title, description, isUnlocked }) {
  return (
    <div style={{
      background: isUnlocked ? '#e0f2fe' : '#f3f4f6',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      border: `1px solid ${isUnlocked ? '#bae6fd' : '#e5e7eb'}`,
      opacity: isUnlocked ? 1 : 0.7
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: isUnlocked ? '#22c55e' : '#9ca3af',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff'
        }}>
          <Award size={24} />
        </div>
        <div>
          <h4 style={{ 
            margin: '0 0 4px 0', 
            fontSize: '16px', 
            fontWeight: '600', 
            color: isUnlocked ? '#0c4a6e' : '#374151' 
          }}>
            {title}
          </h4>
          <p style={{ 
            margin: 0, 
            fontSize: '13px', 
            color: isUnlocked ? '#075985' : '#6b7280' 
          }}>
            {description}
          </p>
        </div>
      </div>
      {isUnlocked && (
        <button style={{
          background: '#22c55e',
          color: '#fff',
          border: 'none',
          padding: '6px 16px',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'default'
        }}>
          Đã mở
        </button>
      )}
    </div>
  )
}


import React from 'react'

export default function StatCard({ icon: Icon, label, value, bgColor, iconColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ 
        background: bgColor, 
        padding: '12px', 
        borderRadius: '8px',
        color: iconColor
      }}>
        <Icon size={24} />
      </div>
      <div>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>{label}</div>
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>{value}</div>
      </div>
    </div>
  )
}


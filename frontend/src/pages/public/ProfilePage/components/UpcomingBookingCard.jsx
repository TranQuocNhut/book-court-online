import React from 'react'

export default function UpcomingBookingCard({ booking }) {
  return (
    <div style={{
      background: '#eff6ff',
      borderRadius: '12px',
      padding: '16px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '600', color: '#1e40af' }}>
          {booking.name}
        </h4>
        <p style={{ margin: 0, fontSize: '14px', color: '#3b82f6' }}>
          {booking.date} • {booking.time}
        </p>
      </div>
      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
        <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e40af' }}>
          {booking.price}
        </div>
        <button style={{
          background: '#3b82f6',
          color: '#fff',
          border: 'none',
          padding: '4px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'default'
        }}>
          Sắp diễn ra
        </button>
      </div>
    </div>
  )
}


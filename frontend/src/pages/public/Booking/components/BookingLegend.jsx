  import React from 'react'

export default function BookingLegend() {
  return (
    <div style={{
      background: '#fff',
      padding: '16px 24px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      gap: '24px',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '20px',
          height: '20px',
          background: '#fff',
          border: '1px solid #d1d5db',
          borderRadius: '4px'
        }}></div>
        <span style={{ fontSize: '14px', color: '#374151' }}>Trống</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '20px',
          height: '20px',
          background: '#10b981',
          borderRadius: '4px'
        }}></div>
        <span style={{ fontSize: '14px', color: '#374151' }}>Đã chọn</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '20px',
          height: '20px',
          background: '#ef4444',
          borderRadius: '4px'
        }}></div>
        <span style={{ fontSize: '14px', color: '#374151' }}>Đã đặt</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '20px',
          height: '20px',
          background: '#9ca3af',
          borderRadius: '4px',
          opacity: 0.6
        }}></div>
        <span style={{ fontSize: '14px', color: '#374151' }}>Quá thời gian đặt sân</span>
      </div>
    </div>
  )
}


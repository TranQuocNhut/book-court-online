import React from 'react'
import { Maximize2 } from 'lucide-react'

export default function BookingHeader({ venueName }) {
  return (
    <div style={{ 
      background: '#fff', 
      padding: '20px 24px', 
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
          Đặt sân - {venueName}
        </h1>
      </div>
      <button style={{
        background: 'none',
        border: 'none',
        padding: '8px',
        borderRadius: '8px',
        cursor: 'pointer',
        color: '#6b7280'
      }}>
        <Maximize2 size={20} />
      </button>
    </div>
  )
}


import React from 'react'
import { courts, generateTimeSlots } from '../mockData'
import { getSlotStatus } from '../utils/bookingHelpers'

export default function BookingGrid({ selectedDate, selectedSlots, onSlotSelect }) {
  const timeSlots = generateTimeSlots()

  const handleSlotClick = (courtId, timeSlot) => {
    const slotKey = `${courtId}-${timeSlot}`
    const status = getSlotStatus(courtId, timeSlot, selectedSlots, selectedDate)
    
    if (status === 'booked' || status === 'past') return
    
    if (selectedSlots.includes(slotKey)) {
      onSlotSelect(selectedSlots.filter(slot => slot !== slotKey))
    } else {
      onSlotSelect([...selectedSlots, slotKey])
    }
  }

  return (
    <div style={{
      background: '#fff',
      padding: '24px',
      overflowX: 'auto'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `120px repeat(${timeSlots.length}, 80px)`,
        gap: '0',
        background: '#e5e7eb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        minWidth: 'fit-content'
      }}>
        {/* Header row with time slots */}
        <div style={{
          background: '#f3f4f6',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '600',
          color: '#374151',
          fontSize: '14px',
          border: '1px solid #e5e7eb'
        }}>
          Sân
        </div>
        {timeSlots.map((time) => (
          <div key={time} style={{
            background: '#f3f4f6',
            padding: '12px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            color: '#374151',
            fontSize: '12px',
            position: 'relative',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '0',
              transform: 'translateX(-50%)',
              background: '#f3f4f6',
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: '600',
              color: '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '2px',
              zIndex: 10,
              whiteSpace: 'nowrap'
            }}>
              {time}
            </div>
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              transform: 'translateX(-50%)',
              width: '0',
              height: '0',
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid #f59e0b'
            }}></div>
          </div>
        ))}

        {/* Court rows */}
        {courts.map((court) => (
          <React.Fragment key={court.id}>
            {/* Court name */}
            <div style={{
              background: '#ecfdf5',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600',
              color: '#059669',
              fontSize: '14px',
              border: '1px solid #e5e7eb'
            }}>
              {court.name}
            </div>
            
            {/* Time slots for this court */}
            {timeSlots.map((time) => {
              const status = getSlotStatus(court.id, time, selectedSlots, selectedDate)
              return (
                <button
                  key={`${court.id}-${time}`}
                  onClick={() => handleSlotClick(court.id, time)}
                  style={{
                    background: status === 'booked' ? '#ef4444' : 
                              status === 'selected' ? '#10b981' : 
                              status === 'past' ? '#9ca3af' : '#fff',
                    border: '1px solid #e5e7eb',
                    padding: '12px 8px',
                    cursor: status === 'booked' || status === 'past' ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    minHeight: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: status === 'past' ? 0.6 : 1
                  }}
                  disabled={status === 'booked' || status === 'past'}
                  onMouseEnter={(e) => {
                    if (status === 'available') {
                      e.target.style.background = '#e0f2fe'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (status === 'available') {
                      e.target.style.background = '#fff'
                    }
                  }}
                >
                </button>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}


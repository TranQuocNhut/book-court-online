import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import useClickOutside from '../../../../hook/use-click-outside'
import useBodyScrollLock from '../../../../hook/use-body-scroll-lock'
import useEscapeKey from '../../../../hook/use-escape-key'
import { generateCalendarDays } from '../utils/dateHelpers'

export default function CalendarModal({ selectedDate, onDateSelect, onClose }) {
  const [calendarDate, setCalendarDate] = React.useState(selectedDate)
  
  // Lock body scroll
  useBodyScrollLock(true)
  
  // Handle escape key
  useEscapeKey(onClose, true)
  
  // Handle click outside
  const modalRef = useClickOutside(onClose, true)

  const handleMonthChange = (direction) => {
    const newDate = new Date(calendarDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCalendarDate(newDate)
  }

  const handleDateSelect = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    
    if (date >= today) {
      onDateSelect(date)
      onClose()
    }
  }

  const calendarDays = generateCalendarDays(calendarDate)

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px'
      }} 
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '320px',
          width: '100%'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Calendar Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <button
            onClick={() => handleMonthChange('prev')}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            <ChevronLeft size={16} />
          </button>
          
          <span style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            {calendarDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
          </span>
          
          <button 
            onClick={() => handleMonthChange('next')}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Calendar Days Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
          marginBottom: '8px'
        }}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div key={day} style={{
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              padding: '8px 4px'
            }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px'
        }}>
          {calendarDays.map((day, index) => {
            const isSelected = day.date.toDateString() === selectedDate.toDateString()
            return (
              <button
                key={index}
                onClick={() => !day.isPast && handleDateSelect(day.date)}
                disabled={day.isPast}
                style={{
                  background: isSelected ? '#1f2937' : 
                             day.isToday ? '#f3f4f6' : 'transparent',
                  color: isSelected ? '#fff' : 
                         day.isPast ? '#d1d5db' :
                         day.isCurrentMonth ? '#1f2937' : '#9ca3af',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 4px',
                  fontSize: '14px',
                  fontWeight: isSelected ? '600' : '400',
                  cursor: day.isPast ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: day.isPast ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && !day.isPast) {
                    e.target.style.background = '#f3f4f6'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && !day.isPast) {
                    e.target.style.background = day.isToday ? '#f3f4f6' : 'transparent'
                  }
                }}
              >
                {day.date.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}


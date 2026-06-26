import React from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { formatDate } from '../utils/dateHelpers'

export default function DateNavigation({ selectedDate, onDateChange, onShowCalendar }) {
  const handleDateChange = (direction) => {
    const newDate = new Date(selectedDate)
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    newDate.setHours(0, 0, 0, 0)
    
    if (newDate >= today) {
      onDateChange(newDate)
    }
  }

  return (
    <div style={{
      background: '#fff',
      padding: '16px 24px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '16px'
    }}>
      <button
        onClick={() => handleDateChange('prev')}
        style={{
          background: 'none',
          border: 'none',
          padding: '8px',
          borderRadius: '8px',
          cursor: 'pointer',
          color: '#6b7280'
        }}
      >
        <ChevronLeft size={20} />
      </button>
      
      <button
        onClick={onShowCalendar}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '8px',
          cursor: 'pointer',
          color: '#1f2937',
          fontSize: '16px',
          fontWeight: '600',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#f3f4f6'
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'none'
        }}
      >
        <Calendar size={20} color="#6b7280" />
        <span>{formatDate(selectedDate)}</span>
      </button>
      
      <button
        onClick={() => handleDateChange('next')}
        style={{
          background: 'none',
          border: 'none',
          padding: '8px',
          borderRadius: '8px',
          cursor: 'pointer',
          color: '#6b7280'
        }}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}


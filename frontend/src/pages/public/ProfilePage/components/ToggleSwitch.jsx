import React from 'react'

export default function ToggleSwitch({ checked, onChange, label, description }) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'flex-start', 
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid #f3f4f6',
      gap: '16px'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '4px' }}>
          {label}
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          {description}
        </div>
      </div>
      <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer', flexShrink: 0 }}>
        <input 
          type="checkbox" 
          checked={checked}
          onChange={onChange}
          style={{ opacity: 0, width: 0, height: 0 }} 
        />
        <span style={{
          position: 'absolute',
          cursor: 'pointer',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: checked ? '#3b82f6' : '#d1d5db',
          borderRadius: '24px',
          transition: '0.4s'
        }}>
          <span style={{
            position: 'absolute',
            content: '',
            height: '18px',
            width: '18px',
            left: checked ? '23px' : '3px',
            bottom: '3px',
            background: 'white',
            borderRadius: '50%',
            transition: '0.4s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}></span>
        </span>
      </label>
    </div>
  )
}


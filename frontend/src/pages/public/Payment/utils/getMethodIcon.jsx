import React from 'react'
import { FiDollarSign } from 'react-icons/fi'

export const getMethodIcon = (method) => {
  if (method.iconType === 'image') {
    return (
      <img 
        src={method.iconSrc} 
        alt={method.iconAlt} 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain', 
          borderRadius: (method.id === 'momo' || method.id === 'wallet') ? '8px' : '0'
        }} 
      />
    )
  }
  
  if (method.iconType === 'icon') {
    if (method.iconComponent === 'FiDollarSign') {
      return <FiDollarSign size={method.iconSize || 28} color={method.iconColor || '#22c55e'} />
    }
  }
  
  return null
}


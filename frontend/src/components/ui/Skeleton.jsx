import React from 'react'

export default function Skeleton({ className = '', style = {}, children }) {
  return (
    <div
      className={className}
      style={{
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'loading 1.5s infinite',
        borderRadius: '8px',
        ...style
      }}
    >
      {children}
      <style>
        {`
          @keyframes loading {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }
        `}
      </style>
    </div>
  )
}

export function SkeletonVenueCard() {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #e5e7eb'
    }}>
      {/* Image Skeleton */}
      <Skeleton style={{ width: '100%', height: '200px' }} />
      
      {/* Content Skeleton */}
      <div style={{ padding: '16px' }}>
        {/* Badge */}
        <Skeleton style={{ width: '80px', height: '24px', marginBottom: '12px', borderRadius: '12px' }} />
        
        {/* Title */}
        <Skeleton style={{ width: '100%', height: '20px', marginBottom: '8px' }} />
        
        {/* Address */}
        <Skeleton style={{ width: '70%', height: '16px', marginBottom: '12px' }} />
        
        {/* Info Row */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
          <Skeleton style={{ width: '60px', height: '16px' }} />
          <Skeleton style={{ width: '80px', height: '16px' }} />
        </div>
        
        {/* Price and Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton style={{ width: '120px', height: '20px', borderRadius: '8px' }} />
          <Skeleton style={{ width: '100px', height: '36px', borderRadius: '8px' }} />
        </div>
      </div>
    </div>
  )
}

export function SkeletonVenueCardList() {
  return (
    <div style={{
      display: 'flex',
      background: '#fff',
      border: '1px solid #eef2f7',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      {/* Image Section */}
      <div style={{ width: '200px', height: '150px', flexShrink: 0 }}>
        <Skeleton style={{ width: '100%', height: '100%' }} />
      </div>
      
      {/* Content Section */}
      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {/* Tags */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <Skeleton style={{ width: '80px', height: '24px', borderRadius: '12px' }} />
            <Skeleton style={{ width: '70px', height: '24px', borderRadius: '12px' }} />
          </div>
          
          {/* Title */}
          <Skeleton style={{ width: '250px', height: '24px', marginBottom: '12px' }} />
          
          {/* Address */}
          <Skeleton style={{ width: '180px', height: '16px', marginBottom: '8px' }} />
          
          {/* Hours */}
          <Skeleton style={{ width: '120px', height: '16px' }} />
        </div>
        
        {/* Bottom */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <Skeleton style={{ width: '150px', height: '20px' }} />
          <Skeleton style={{ width: '120px', height: '40px', borderRadius: '10px' }} />
        </div>
      </div>
    </div>
  )
}


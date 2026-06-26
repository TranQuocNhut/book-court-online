import React, { useState } from 'react'

export default function VenueGallery({ images = [] }) {
  const [mainImage, setMainImage] = useState(images[0] || '/sports-meeting.webp')
  const displayImages = images.length > 0 ? images : ['/sports-meeting.webp', '/all-sports-banner.webp', '/pngtree-sports-poster-background.jpg']

  return (
    <div>
      {/* Main Image */}
      <div style={{
        backgroundImage: `url(${mainImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '12px',
        height: '400px',
        marginBottom: '12px',
        border: '2px solid #e5e7eb',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)'
        }} />
      </div>

      {/* Thumbnail Images */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {displayImages.map((img, index) => (
          <div
            key={index}
            onClick={() => setMainImage(img)}
            style={{
              backgroundImage: `url(${img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '8px',
              height: '80px',
              width: '120px',
              cursor: 'pointer',
              border: mainImage === img ? '3px solid #3b82f6' : '2px solid #e5e7eb',
              transition: 'all 0.2s',
              boxShadow: mainImage === img ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
              opacity: mainImage === img ? 1 : 0.7
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '1'
              e.target.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              if (mainImage !== img) {
                e.target.style.opacity = '0.7'
              }
              e.target.style.transform = 'scale(1)'
            }}
          />
        ))}
      </div>
    </div>
  )
}


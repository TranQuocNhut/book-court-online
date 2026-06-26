import React from 'react'
import { Star, MapPin, Phone, Clock, Wifi, Car, Coffee, Shield, Tag } from 'lucide-react'
import useDeviceType from '../../../../hook/use-device-type'

export default function VenueInfo({ venueData }) {
  const { isMobile, isTablet } = useDeviceType()
  
  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ 
          fontSize: isMobile ? '20px' : isTablet ? '22px' : '24px', 
          fontWeight: '700', 
          color: '#1f2937', 
          margin: '0 0 8px 0' 
        }}>
          {venueData.name}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Star size={16} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
          <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
            {venueData.rating} ({venueData.reviewCount} đánh giá)
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={16} style={{ color: '#6b7280' }} />
          <span style={{ fontSize: '14px', color: '#374151' }}>{venueData.address}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Phone size={16} style={{ color: '#6b7280' }} />
          <span style={{ fontSize: '14px', color: '#374151' }}>{venueData.phone}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tag size={16} style={{ color: '#3b82f6' }} />
          <span style={{ fontSize: '14px', color: '#3b82f6', fontWeight: '700' }}>{venueData.price}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} style={{ color: '#6b7280' }} />
          <span style={{ fontSize: '14px', color: '#374151' }}>Giờ hoạt động: {venueData.operatingHours}</span>
        </div>
      </div>

      {venueData.services && venueData.services.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 8px 0' }}>
            Tiện ích
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {venueData.services.map((service, index) => {
              const getIcon = (service) => {
                if (service.includes('WiFi') || service.includes('Internet') || service.includes('Wifi')) return <Wifi size={12} />
                if (service.includes('Parking') || service.includes('Bãi đỗ') || service.includes('Gửi xe')) return <Car size={12} />
                if (service.includes('Cafe') || service.includes('Đồ uống') || service.includes('Quán nước')) return <Coffee size={12} />
                if (service.includes('Bảo vệ') || service.includes('An ninh') || service.includes('Security')) return <Shield size={12} />
                return null
              }
              
              return (
                <span key={index} style={{
                  background: '#ecfdf5',
                  color: '#059669',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {getIcon(service)}
                  {service}
                </span>
              )
            })}
          </div>
        </div>
      )}
      
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 8px 0' }}>
          Mô tả
        </h3>
        <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5', margin: 0 }}>
          {venueData.description}
        </p>
      </div>
    </div>
  )
}


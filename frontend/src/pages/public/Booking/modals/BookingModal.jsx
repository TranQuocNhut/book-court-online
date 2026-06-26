import React, { useState } from 'react'
import { formatDate } from '../utils/dateHelpers'
import { MapPin, Grid3x3, Tag } from 'lucide-react'
import useClickOutside from '../../../../hook/use-click-outside'
import useBodyScrollLock from '../../../../hook/use-body-scroll-lock'
import useEscapeKey from '../../../../hook/use-escape-key'

export default function BookingModal({ 
  selectedDate, 
  selectedSlots, 
  selectedCourt, 
  selectedFieldType, 
  venueData, 
  courts, 
  promotionData,
  onClose, 
  onSubmit 
}) {
  // Lock body scroll
  useBodyScrollLock(true)
  
  // Handle escape key
  useEscapeKey(onClose, true)
  
  // Handle click outside
  const modalRef = useClickOutside(onClose, true)

  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    notes: ''
  })

  const handleFormChange = (e) => {
    setBookingForm({
      ...bookingForm,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!bookingForm.name.trim()) {
      alert('Vui lòng nhập tên người đặt')
      return
    }
    
    if (!bookingForm.phone.trim()) {
      alert('Vui lòng nhập số điện thoại')
      return
    }

    // Validate phone format (10-11 digits)
    const phoneRegex = /^[0-9]{10,11}$/
    if (!phoneRegex.test(bookingForm.phone.replace(/\s/g, ''))) {
      alert('Số điện thoại không hợp lệ. Vui lòng nhập 10-11 chữ số')
      return
    }
    
    // Pass contactInfo to parent
    onSubmit({
      name: bookingForm.name.trim(),
      phone: bookingForm.phone.replace(/\s/g, ''),
      notes: bookingForm.notes.trim() || undefined
    })
  }

  // Get selected court data
  const selectedCourtData = courts?.find(c => (c.id || c._id) === selectedCourt)
  const courtPrice = selectedCourtData?.price || parseInt(venueData.pricePerHour || venueData.price.replace(/[^\d]/g, ''))

  // Calculate subtotal
  const calculateSubtotal = () => {
    if (!selectedSlots.length) return 0
    return selectedSlots.length * courtPrice
  }

  // Calculate discount
  const discountAmount = promotionData?.discountAmount || 0

  // Calculate final total
  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    return Math.max(0, subtotal - discountAmount)
  }

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
        zIndex: 1000,
        padding: '20px'
      }} 
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        style={{
          background: '#fff',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
            Xác nhận đặt sân
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>
        
        {/* Modal Content */}
        <div style={{ padding: '24px' }}>
          {/* Booking Summary */}
          <div style={{
            background: '#f9fafb',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>
              Thông tin đặt sân
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="#6b7280" />
                  <span style={{ color: '#6b7280' }}>Sân:</span>
                </div>
                <span style={{ fontWeight: '500' }}>
                  {courts && selectedCourt 
                    ? (courts.find(c => (c.id || c._id) === selectedCourt)?.name || 'Sân đã chọn')
                    : selectedCourt || 'Chưa chọn'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Grid3x3 size={14} color="#6b7280" />
                  <span style={{ color: '#6b7280' }}>Loại sân:</span>
                </div>
                <span style={{ fontWeight: '500' }}>{selectedFieldType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280' }}>Địa điểm:</span>
                <span style={{ fontWeight: '500' }}>{venueData.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280' }}>Ngày:</span>
                <span style={{ fontWeight: '500' }}>{formatDate(selectedDate)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280' }}>Số khung giờ:</span>
                <span style={{ fontWeight: '500' }}>{selectedSlots.length} khung giờ</span>
              </div>
              {/* Promotion Info */}
              {promotionData && promotionData.promotion && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: '#e6f9f0',
                  borderRadius: '6px',
                  marginTop: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tag size={14} style={{ color: '#059669' }} />
                    <span style={{ fontSize: '13px', color: '#059669', fontWeight: '500' }}>
                      {promotionData.promotion.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '13px', color: '#059669', fontWeight: '600' }}>
                    {promotionData.code}
                  </span>
                </div>
              )}

              <div style={{ 
                height: '1px', 
                background: '#e5e7eb', 
                margin: '12px 0' 
              }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Tạm tính:</span>
                <span style={{ fontWeight: '500', fontSize: '14px', color: '#374151' }}>
                  {calculateSubtotal().toLocaleString('vi-VN')} VNĐ
                </span>
              </div>

              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: '#059669', fontSize: '14px' }}>Giảm giá:</span>
                  <span style={{ fontWeight: '500', fontSize: '14px', color: '#059669' }}>
                    -{discountAmount.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                <span style={{ color: '#1f2937', fontWeight: '600', fontSize: '16px' }}>Tổng cộng:</span>
                <span style={{ fontWeight: '700', color: '#059669', fontSize: '18px' }}>
                  {calculateTotal().toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
              Thông tin liên hệ
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Tên người đặt *
                </label>
                <input
                  type="text"
                  name="name"
                  value={bookingForm.name}
                  onChange={handleFormChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  placeholder="Nhập tên của bạn"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={bookingForm.phone}
                  onChange={handleFormChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  placeholder="Nhập số điện thoại"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Ghi chú cho chủ sân
                </label>
                <textarea
                  name="notes"
                  value={bookingForm.notes}
                  onChange={handleFormChange}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                  placeholder="Ghi chú (nếu có)"
                />
              </div>
            </div>
            
            <div style={{
              background: '#ecfdf5',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ color: '#059669' }}>✓</span>
              <span style={{ fontSize: '14px', color: '#059669' }}>
                Thông tin đơn hàng sẽ được gửi đến số điện thoại và email tài khoản của bạn.
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={onClose}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: '#fff',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Quay lại
              </button>
              <button 
                type="submit" 
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#3b82f6',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Tiếp tục
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


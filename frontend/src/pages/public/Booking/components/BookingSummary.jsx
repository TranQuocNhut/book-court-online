import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { formatDate } from '../utils/dateHelpers'
import { Calendar, Clock, DollarSign, CheckCircle, Tag, MapPin, Grid3x3, X, MessageCircle } from 'lucide-react'
import { promotionApi } from '../../../../api/promotionApi'
import ChatModal from './ChatModal'
import useToggle from '../../../../hook/use-toggle'

export default function BookingSummary({
  selectedDate,
  selectedSlots,
  selectedCourt,
  selectedFieldType,
  courts,
  timeSlotsData,
  onBookNow,
  venueId,
  timeSlotDuration = 60, // Khung giờ đặt sân (30 hoặc 60 phút)
  onPromotionChange, // Callback to pass promotion data to parent
  selectedServices = [] // Array of selected services
}) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [showChatModal, { toggle: toggleChatModal, setFalse: closeChatModal }] = useToggle(false)

  const [promoCode, setPromoCode] = useState('')
  const [appliedPromotion, setAppliedPromotion] = useState(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [promoApplied, setPromoApplied] = useState(false)
  const [validating, setValidating] = useState(false)
  const [autoAppliedFromUrl, setAutoAppliedFromUrl] = useState(false) // Track if auto-applied from URL

  // Get selected court data
  const selectedCourtData = courts?.find(c => (c.id || c._id) === selectedCourt)
  const courtPrice = selectedCourtData?.price || 0

  // Calculate court total amount based on selected slots
  // Use actual price from court or timeSlotsData
  const calculateCourtTotal = () => {
    if (!selectedSlots.length) return 0

    // If we have timeSlotsData with prices, use that
    if (timeSlotsData && timeSlotsData.length > 0) {
      return selectedSlots.reduce((total, slotKey) => {
        // Parse slot key: format is "YYYY-MM-DD-HH:MM"
        const parts = slotKey.split('-')
        const actualTime = parts[3] // Get "HH:MM"
        const slot = timeSlotsData.find(s => s.time === actualTime)
        return total + (slot?.price || courtPrice || 0)
      }, 0)
    }

    // Fallback: use court price * number of slots (each slot is 1 hour)
    return courtPrice * selectedSlots.length
  }

  // Calculate services total
  const calculateServicesTotal = () => {
    return selectedServices.reduce((total, item) => {
      return total + (item.totalPrice || 0)
    }, 0)
  }

  // Calculate total (court + services)
  const calculateTotal = () => {
    return calculateCourtTotal() + calculateServicesTotal()
  }

  // Check for promo code in URL params
  useEffect(() => {
    const promoFromUrl = searchParams.get('promo')
    if (promoFromUrl && !promoApplied && !autoAppliedFromUrl && venueId) {
      setPromoCode(promoFromUrl.toUpperCase())
      // Auto-apply promo from URL
      const applyPromo = async () => {
        try {
          setValidating(true)
          const result = await promotionApi.validatePromotionCode(
            promoFromUrl.toUpperCase(),
            venueId || null,
            null
          )

          if (result.success && result.data.valid && result.data.promotion) {
            const promotion = result.data.promotion
            const subtotal = calculateTotal() // Includes services
            const discount = calculateDiscount(promotion, subtotal)

            setAppliedPromotion(promotion)
            setDiscountAmount(discount)
            setPromoApplied(true)
            setAutoAppliedFromUrl(true) // Mark as auto-applied from URL

            if (onPromotionChange) {
              onPromotionChange({
                code: promoFromUrl.toUpperCase(),
                promotion: promotion,
                discountAmount: discount
              })
            }
          }
        } catch (error) {
          console.error('Error validating promotion from URL:', error)
        } finally {
          setValidating(false)
        }
      }

      // Delay to ensure component is fully mounted
      setTimeout(applyPromo, 100)
    }
  }, [searchParams, venueId, promoApplied, autoAppliedFromUrl])

  // Calculate discount amount based on promotion
  const calculateDiscount = (promotion, subtotal) => {
    if (!promotion) return 0

    if (promotion.discountType === 'percentage') {
      const discount = (subtotal * promotion.discountValue) / 100
      return Math.round(discount)
    } else {
      // fixed amount
      return Math.min(promotion.discountValue, subtotal)
    }
  }

  // Handle promo code apply
  const handleApplyPromo = async (code = null) => {
    const codeToValidate = code || promoCode.trim().toUpperCase()

    if (!codeToValidate) {
      toast.error('Vui lòng nhập mã khuyến mãi')
      return
    }

    try {
      setValidating(true)

      // Validate promotion code with API
      const result = await promotionApi.validatePromotionCode(
        codeToValidate,
        venueId || null,
        null // area - can be enhanced later
      )

      if (result.success && result.data.valid && result.data.promotion) {
        const promotion = result.data.promotion
        const subtotal = calculateTotal()
        const discount = calculateDiscount(promotion, subtotal)

        setAppliedPromotion(promotion)
        setDiscountAmount(discount)
        setPromoApplied(true)
        setPromoCode(codeToValidate)

        // Notify parent component
        if (onPromotionChange) {
          onPromotionChange({
            code: codeToValidate,
            promotion: promotion,
            discountAmount: discount
          })
        }

        toast.success(`Áp dụng mã khuyến mãi "${codeToValidate}" thành công!`)
      } else {
        const reason = result.data?.reason || 'Mã khuyến mãi không hợp lệ'
        toast.error(reason)
        setAppliedPromotion(null)
        setDiscountAmount(0)
        setPromoApplied(false)

        if (onPromotionChange) {
          onPromotionChange(null)
        }
      }
    } catch (error) {
      console.error('Error validating promotion:', error)
      toast.error(error.message || 'Có lỗi xảy ra khi kiểm tra mã khuyến mãi')
      setAppliedPromotion(null)
      setDiscountAmount(0)
      setPromoApplied(false)

      if (onPromotionChange) {
        onPromotionChange(null)
      }
    } finally {
      setValidating(false)
    }
  }

  // Handle remove promotion
  const handleRemovePromo = () => {
    setPromoCode('')
    setAppliedPromotion(null)
    setDiscountAmount(0)
    setPromoApplied(false)

    if (onPromotionChange) {
      onPromotionChange(null)
    }

    toast.info('Đã xóa mã khuyến mãi')
  }

  // Calculate final total with discount
  const finalTotal = () => {
    const total = calculateTotal()
    return Math.max(0, total - discountAmount)
  }

  // Update discount when total changes
  useEffect(() => {
    if (appliedPromotion && promoApplied) {
      const subtotal = calculateTotal()
      const newDiscount = calculateDiscount(appliedPromotion, subtotal)
      setDiscountAmount(newDiscount)

      if (onPromotionChange) {
        onPromotionChange({
          code: promoCode,
          promotion: appliedPromotion,
          discountAmount: newDiscount
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlots, timeSlotsData, appliedPromotion, promoApplied, promoCode])

  return (
    <div className="booking-summary-card">
      {/* Header */}
      <h3 className="summary-title">
        Tóm tắt đặt sân
      </h3>

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} style={{ color: '#6b7280' }} />
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Sân:</span>
          </div>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            {courts && selectedCourt
              ? (courts.find(c => (c.id || c._id) === selectedCourt)?.name || 'Chưa chọn sân')
              : 'Chưa chọn sân'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Grid3x3 size={16} style={{ color: '#6b7280' }} />
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Loại sân:</span>
          </div>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            {selectedFieldType}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} style={{ color: '#6b7280' }} />
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Ngày đặt:</span>
          </div>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            {formatDate(selectedDate)}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} style={{ color: '#6b7280' }} />
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Khung giờ:</span>
          </div>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            {selectedSlots.length > 0
              ? (() => {
                const totalMinutes = selectedSlots.length * (timeSlotDuration || 60)
                const hours = Math.floor(totalMinutes / 60)
                const minutes = totalMinutes % 60

                if (hours === 0) {
                  return `${minutes} phút`
                } else if (minutes === 0) {
                  return `${hours} giờ`
                } else {
                  return `${hours} giờ ${minutes} phút`
                }
              })()
              : 'Chưa chọn khung giờ'}
          </span>
        </div>

        {/* Time Slots Detail */}
        {selectedSlots.length > 0 && (
          <div style={{ margin: '8px 0' }}>
            <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500', marginBottom: '8px' }}>
              Khung giờ
            </div>
            {selectedSlots.map((slot, index) => {
              // Parse slot key: format is "YYYY-MM-DD-HH:MM"
              const parts = slot.split('-')
              const actualTime = parts[3] // Get "HH:MM"

              // Get slot data from timeSlotsData or use court price
              let slotPrice = courtPrice
              let endTime = ''

              if (timeSlotsData && timeSlotsData.length > 0) {
                const slotData = timeSlotsData.find(s => s.time === actualTime)
                if (slotData) {
                  slotPrice = slotData.price || courtPrice
                  endTime = slotData.endTime || ''
                } else {
                  // Calculate end time based on timeSlotDuration
                  const [hours, minutes] = actualTime.split(':').map(Number)
                  const slotDurationMinutes = timeSlotDuration || 60
                  const totalMinutes = hours * 60 + minutes + slotDurationMinutes
                  const endHours = Math.floor(totalMinutes / 60) % 24
                  const endMinutes = totalMinutes % 60
                  endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
                }
              } else {
                // Fallback: calculate end time based on timeSlotDuration
                const [hours, minutes] = actualTime.split(':').map(Number)
                const slotDurationMinutes = timeSlotDuration || 60
                const totalMinutes = hours * 60 + minutes + slotDurationMinutes
                const endHours = Math.floor(totalMinutes / 60) % 24
                const endMinutes = totalMinutes % 60
                endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
              }

              return (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                  fontSize: '14px',
                  color: '#374151'
                }}>
                  <span>{actualTime} - {endTime}</span>
                  <span style={{ fontWeight: '500' }}>
                    {slotPrice.toLocaleString('vi-VN')} VND
                  </span>
                </div>
              )
            })}
            <div style={{
              height: '1px',
              background: '#e5e7eb',
              margin: '8px 0'
            }}></div>
          </div>
        )}

        {/* Services Detail */}
        {selectedServices && selectedServices.length > 0 && (
          <div style={{ margin: '8px 0' }}>
            <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500', marginBottom: '8px' }}>
              Dịch vụ
            </div>
            {selectedServices.map((item, index) => {
              const service = item.service || {}
              const serviceName = service.name || 'Dịch vụ'
              const quantity = item.quantity || 1
              const price = service.price || 0
              const totalPrice = item.totalPrice || (price * quantity)

              return (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                  fontSize: '14px',
                  color: '#374151'
                }}>
                  <span>
                    {serviceName} {quantity > 1 ? `x${quantity}` : ''}
                  </span>
                  <span style={{ fontWeight: '500' }}>
                    {totalPrice.toLocaleString('vi-VN')} VND
                  </span>
                </div>
              )
            })}
            <div style={{
              height: '1px',
              background: '#e5e7eb',
              margin: '8px 0'
            }}></div>
          </div>
        )}

        <div style={{
          height: '1px',
          background: '#e5e7eb',
          margin: '8px 0'
        }}></div>

        {/* Promo Code Section */}
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={14} style={{ color: '#6b7280' }} />
            Mã khuyến mãi
          </div>
          <div className="promo-code-container" style={{
            display: 'flex',
            gap: '8px'
          }}>
            <input
              type="text"
              placeholder="Nhập mã khuyến mãi"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              disabled={promoApplied}
              className="promo-code-input"
              style={{
                flex: '1 1 auto',
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                background: promoApplied ? '#f3f4f6' : '#fff',
                transition: 'all 0.2s'
              }}
            />
            <button
              onClick={() => handleApplyPromo()}
              disabled={promoApplied || !promoCode.trim() || validating}
              className="promo-code-button"
              style={{
                flex: '0 0 auto',
                padding: '10px 16px',
                background: promoApplied || !promoCode.trim() || validating ? '#d1d5db' : '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: promoApplied || !promoCode.trim() || validating ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {validating ? '...' : promoApplied ? 'Đã áp dụng' : 'Áp dụng'}
            </button>
          </div>
          {promoApplied && appliedPromotion && (
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: '#e6f9f0',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                <CheckCircle size={14} style={{ color: '#059669' }} />
                <div style={{ fontSize: '13px', color: '#059669' }}>
                  <div style={{ fontWeight: '600' }}>{appliedPromotion.name}</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    {appliedPromotion.discountType === 'percentage'
                      ? `Giảm ${appliedPromotion.discountValue}%`
                      : `Giảm ${appliedPromotion.discountValue.toLocaleString('vi-VN')} VNĐ`}
                  </div>
                </div>
              </div>
              <button
                onClick={handleRemovePromo}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#6b7280'
                }}
                title="Xóa mã khuyến mãi"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        <div style={{
          height: '1px',
          background: '#e5e7eb',
          margin: '12px 0'
        }}></div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>Tạm tính:</span>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            {calculateTotal().toLocaleString('vi-VN')} VNĐ
          </span>
        </div>
        {selectedServices && selectedServices.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>
            <span>(Trong đó: Sân {calculateCourtTotal().toLocaleString('vi-VN')} VNĐ + Dịch vụ {calculateServicesTotal().toLocaleString('vi-VN')} VNĐ)</span>
          </div>
        )}

        {promoApplied && discountAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#059669' }}>Giảm giá:</span>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#059669' }}>
              -{discountAmount.toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={16} style={{ color: '#1f2937' }} />
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>Tổng cộng:</span>
          </div>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#059669' }}>
            {finalTotal().toLocaleString('vi-VN')} VNĐ
          </span>
        </div>
      </div>

      {/* Book Now Button */}
      {/* Check if all required fields are selected: field type, court, and time slots */}
      {(() => {
        const isComplete = selectedFieldType && selectedCourt && selectedSlots.length > 0
        return (
          <>
            <button
              onClick={onBookNow}
              disabled={!isComplete}
              style={{
                width: '100%',
                background: isComplete ? '#374151' : '#9ca3af',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isComplete ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}
              onMouseEnter={(e) => {
                if (isComplete) {
                  e.target.style.background = '#1f2937'
                }
              }}
              onMouseLeave={(e) => {
                if (isComplete) {
                  e.target.style.background = '#374151'
                }
              }}
              title={!isComplete ? 'Vui lòng chọn đầy đủ: loại sân, sân và khung giờ' : ''}
            >
              <CheckCircle size={16} />
              Xác nhận đặt sân
            </button>

            <button
              onClick={() => {
                if (venueId) {
                  toggleChatModal()
                } else {
                  toast.info('Không tìm thấy thông tin chủ sân')
                }
              }}
              style={{
                width: '100%',
                background: '#fff',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f9fafb'
                e.target.style.borderColor = '#d1d5db'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#fff'
                e.target.style.borderColor = '#e5e7eb'
              }}
              title="Nhắn tin với chủ sân"
            >
              <MessageCircle size={16} />
              Nhắn tin với chủ sân
            </button>
          </>
        )
      })()}

      {/* Terms */}
      <p style={{
        fontSize: '12px',
        color: '#6b7280',
        textAlign: 'center',
        margin: '12px 0 0 0',
        lineHeight: '1.4'
      }}>
        Bằng việc đặt sân, bạn đồng ý với điều khoản sử dụng của chúng tôi
      </p>

      {/* Chat Modal */}
      <ChatModal
        isOpen={showChatModal}
        onClose={closeChatModal}
        venueId={venueId}
      />
    </div>
  )
}

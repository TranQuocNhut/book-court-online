import React, { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import useClickOutside from '../../../../hook/use-click-outside'
import useBodyScrollLock from '../../../../hook/use-body-scroll-lock'
import useEscapeKey from '../../../../hook/use-escape-key'
import { toast } from 'react-toastify'

const ReportBookingModal = ({ isOpen, onClose, booking, onSubmit }) => {
  useBodyScrollLock(isOpen)
  useEscapeKey(onClose, isOpen)
  const modalRef = useClickOutside(onClose, isOpen)

  const [formData, setFormData] = useState({
    subject: '',
    content: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Danh sách chủ đề khiếu nại
  const subjectOptions = [
    { value: '', label: 'Chọn chủ đề khiếu nại' },
    { value: 'service_quality', label: 'Chất lượng dịch vụ' },
    { value: 'facility_issue', label: 'Vấn đề về cơ sở vật chất' },
    { value: 'staff_behavior', label: 'Thái độ nhân viên' },
    { value: 'booking_error', label: 'Lỗi đặt sân' },
    { value: 'payment_issue', label: 'Vấn đề thanh toán' },
    { value: 'refund_request', label: 'Yêu cầu hoàn tiền' },
    { value: 'other', label: 'Khác' },
  ]

  if (!isOpen || !booking) return null

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.subject || formData.subject === '') {
      toast.error('Vui lòng chọn chủ đề khiếu nại')
      return
    }
    if (!formData.content.trim()) {
      toast.error('Vui lòng nhập nội dung khiếu nại')
      return
    }

    setIsSubmitting(true)
    try {
      // TODO: Integrate with actual report API
      console.log('Submitting report:', {
        bookingId: booking._original?._id || booking.id,
        bookingCode: booking.bookingCode,
        subject: formData.subject,
        content: formData.content,
        venue: booking.venue,
        date: booking.date,
        time: booking.time,
      })

      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API call

      if (onSubmit) {
        onSubmit({
          bookingId: booking._original?._id || booking.id,
          bookingCode: booking.bookingCode,
          subject: formData.subject,
          content: formData.content,
        })
      }

      toast.success('Đơn khiếu nại đã được gửi thành công. Admin sẽ xem xét sớm nhất.')
      setFormData({ subject: '', content: '' })
      onClose()
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error(error.message || 'Không thể gửi đơn khiếu nại. Vui lòng thử lại sau.')
    } finally {
      setIsSubmitting(false)
    }
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
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        style={{
          background: '#fff',
          borderRadius: 16,
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertCircle size={20} color="#d97706" />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#111827' }}>
                Gửi khiếu nại
              </h3>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0 0' }}>
                Mã đặt sân: {booking.bookingCode || `#${booking.id}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px',
            }}
            aria-label="Đóng"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Booking Info */}
          <div
            style={{
              background: '#f9fafb',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: '8px' }}>Thông tin đặt sân</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
              {booking.venue}
            </div>
            <div style={{ fontSize: 14, color: '#374151' }}>
              {new Date(booking.date).toLocaleDateString('vi-VN')} - {booking.time}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label
                htmlFor="subject"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                }}
              >
                Chủ đề khiếu nại <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                id="subject"
                required
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '15px',
                  background: '#fff',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                disabled={isSubmitting}
              >
                {subjectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="content"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                }}
              >
                Nội dung khiếu nại <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                id="content"
                required
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                rows="6"
                placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '15px',
                  resize: 'vertical',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                disabled={isSubmitting}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '12px',
                background: '#fef3c7',
                borderRadius: 8,
              }}
            >
              <AlertCircle size={16} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: '#92400e', margin: 0, lineHeight: 1.5 }}>
                Đơn khiếu nại của bạn sẽ được gửi đến admin để xem xét. Vui lòng cung cấp thông tin chi tiết để chúng tôi có thể hỗ trợ bạn tốt nhất.
              </p>
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12,
                paddingTop: '8px',
                borderTop: '1px solid #e5e7eb',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  padding: '10px 24px',
                  background: '#fff',
                  color: '#374151',
                  border: '2px solid #e5e7eb',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) e.target.style.borderColor = '#d1d5db'
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) e.target.style.borderColor = '#e5e7eb'
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.subject || !formData.content.trim()}
                style={{
                  padding: '10px 24px',
                  background:
                    isSubmitting || !formData.subject || !formData.content.trim()
                      ? '#d1d5db'
                      : '#d97706',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor:
                    isSubmitting || !formData.subject || !formData.content.trim()
                      ? 'not-allowed'
                      : 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting && formData.subject && formData.content.trim()) {
                    e.target.style.background = '#b45309'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting && formData.subject && formData.content.trim()) {
                    e.target.style.background = '#d97706'
                  }
                }}
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi khiếu nại'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ReportBookingModal


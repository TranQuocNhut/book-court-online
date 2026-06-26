import React, { useState, useRef, useEffect } from 'react'
import { bookingApi } from '../../../../api/bookingApi'
import { reviewApi } from '../../../../api/reviewApi'
import { toast } from 'react-toastify'
import Dialog from '../../../../components/ui/Dialog'
import CreateReviewModal from '../modals/CreateReviewModal'
import ReportBookingModal from '../modals/ReportBookingModal'
import { QRCodeSVG } from 'qrcode.react'
import html2canvas from 'html2canvas'
import { Download, Star, Loader, AlertCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'

// Component hiển thị khung giờ compact
const TimeSlotsDisplay = ({ timeSlots }) => {
  const [showAll, setShowAll] = useState(false)
  const MAX_VISIBLE = 6 // Số khung giờ hiển thị ban đầu

  if (!timeSlots || timeSlots.length === 0) {
    return <span style={{ color: '#6b7280', fontSize: '14px' }}>N/A</span>
  }

  const visibleSlots = showAll ? timeSlots : timeSlots.slice(0, MAX_VISIBLE)
  const hasMore = timeSlots.length > MAX_VISIBLE

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '4px',
        maxWidth: '100%',
        lineHeight: '1.4'
      }}>
        {visibleSlots.map((slot, index) => (
          <span
            key={index}
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              background: '#e6f9f0',
              color: '#059669',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            {slot.trim()}
          </span>
        ))}
        {hasMore && !showAll && (
          <span style={{ 
            fontSize: '12px', 
            color: '#6b7280', 
            alignSelf: 'center',
            padding: '2px 4px'
          }}>
            +{timeSlots.length - MAX_VISIBLE} khung giờ
          </span>
        )}
      </div>
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            fontSize: '12px',
            cursor: 'pointer',
            padding: '2px 0',
            width: 'fit-content',
            fontWeight: '500'
          }}
        >
          {showAll ? (
            <>
              <ChevronUp size={14} />
              Thu gọn
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              Xem tất cả ({timeSlots.length} khung giờ)
            </>
          )}
        </button>
      )}
    </div>
  )
}

export default function BookingsTab() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState(null) // Review đang được edit
  const [cancelReason, setCancelReason] = useState('')
  const [otherReason, setOtherReason] = useState('')
  const [bookingReviews, setBookingReviews] = useState({}) // Map bookingId -> review
  const [refreshKey, setRefreshKey] = useState(0)
  const ticketRef = useRef(null)
  const [refundInfo, setRefundInfo] = useState(null) // Thông tin hoàn tiền
  const [showConfirmCancel, setShowConfirmCancel] = useState(false) // Xác nhận lại khi hủy 12-24h hoặc <12h

  // Pagination state
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const cancelReasons = [
    { value: 'change_of_plan', label: 'Thay đổi kế hoạch' },
    { value: 'wrong_booking', label: 'Đặt nhầm thông tin' },
    { value: 'weather', label: 'Thời tiết không thuận lợi' },
    { value: 'other', label: 'Lý do khác' }
  ]

  const getPaymentIconSrc = (method) => {
    const normalized = (method || '').toLowerCase()
    if (normalized.includes('momo')) return '/MoMo_Logo.png'
    if (normalized.includes('vnpay')) return '/Vnpay.jpg'
    return ''
  }

  const openCancelModal = (booking) => {
    setSelectedBooking(booking)
    setShowCancelModal(true)
    setCancelReason('')
    setOtherReason('')
    setShowConfirmCancel(false)
    
    // Tính toán thông tin hoàn tiền
    if (booking && booking.paymentStatus === 'paid' && booking._original) {
      try {
        const bookingData = booking._original
        // Lấy totalAmount từ _original hoặc parse từ price string
        let totalAmount = bookingData.totalAmount
        if (!totalAmount && booking.price) {
          // Parse từ string "1.000.000 VNĐ" hoặc "1,000,000 VNĐ"
          const priceStr = booking.price.toString().replace(/[^\d]/g, '')
          totalAmount = parseInt(priceStr) || 0
        }
        if (!totalAmount) totalAmount = 0
        
        const date = bookingData.date || booking.date
        const timeSlots = bookingData.timeSlots || (booking.time ? booking.time.split(', ') : [])
        
        if (date && timeSlots && timeSlots.length > 0 && totalAmount > 0) {
          // Tính thời gian vào sân
          const bookingDate = new Date(date)
          const firstTimeSlot = timeSlots[0]
          const [startTime] = firstTimeSlot.split("-")
          const [hours, minutes] = startTime.split(":").map(Number)
          bookingDate.setHours(hours, minutes, 0, 0)
          
          const now = new Date()
          const hoursUntilBooking = (bookingDate - now) / (1000 * 60 * 60)
          
          let refundAmount = 0
          let refundPercentage = 0
          let refundMessage = ""
          let warningLevel = "none" // "none", "partial", "no_refund"
          
          if (hoursUntilBooking >= 24) {
            // Hủy 24+ giờ trước: hoàn 100%
            refundAmount = totalAmount
            refundPercentage = 100
            refundMessage = "Hủy trước 24 giờ: Hoàn 100%"
            warningLevel = "none"
          } else if (hoursUntilBooking >= 12) {
            // Hủy 12-24 giờ trước: hoàn 50%
            refundAmount = totalAmount * 0.5
            refundPercentage = 50
            refundMessage = "Hủy trước 12-24 giờ: Chỉ hoàn 50%"
            warningLevel = "partial"
          } else if (hoursUntilBooking >= 0) {
            // Hủy dưới 12 giờ: không hoàn tiền
            refundAmount = 0
            refundPercentage = 0
            refundMessage = "Hủy dưới 12 giờ: Không hoàn tiền"
            warningLevel = "no_refund"
          } else {
            // Đã qua giờ vào sân
            refundAmount = 0
            refundPercentage = 0
            refundMessage = "Đã qua giờ vào sân: Không hoàn tiền"
            warningLevel = "no_refund"
          }
          
          setRefundInfo({
            refundAmount,
            refundPercentage,
            refundMessage,
            warningLevel,
            hoursUntilBooking: Math.max(0, hoursUntilBooking),
            totalAmount: totalAmount
          })
        } else {
          setRefundInfo(null)
        }
      } catch (error) {
        console.error("Error calculating refund:", error)
        setRefundInfo(null)
      }
    } else {
      setRefundInfo(null)
    }
  }

  const openDetailModal = (booking) => {
    setSelectedBooking(booking)
    setShowDetailModal(true)
  }

  const openEditReviewModal = (booking) => {
    const bookingId = booking._original?._id?.toString() || booking.id
    const review = bookingReviews[bookingId]
    if (review) {
      setSelectedBooking(booking)
      setSelectedReview(review)
      setShowReviewModal(true)
    }
  }

  const openReportModal = (booking) => {
    setSelectedBooking(booking)
    setShowReportModal(true)
  }

  const handleReviewSuccess = () => {
    // Refresh reviews after create/update
    setRefreshKey(prev => prev + 1)
    setSelectedReview(null)
  }

  const handleConfirmCancel = async () => {
    if (!cancelReason || !selectedBooking) return

    // Nếu hủy từ 12-24 giờ hoặc dưới 12 giờ, cần xác nhận lại
    if (refundInfo && (refundInfo.warningLevel === 'partial' || refundInfo.warningLevel === 'no_refund')) {
      if (!showConfirmCancel) {
        setShowConfirmCancel(true)
        return
      }
    }

    // Lấy label của lý do hủy (hoặc otherReason nếu là 'other')
    let finalReason = ''
    if (cancelReason === 'other') {
      finalReason = otherReason.trim()
      if (!finalReason) {
        toast.error('Vui lòng nhập lý do hủy')
        return
      }
    } else {
      // Map value sang label
      const reasonObj = cancelReasons.find(r => r.value === cancelReason)
      finalReason = reasonObj ? reasonObj.label : cancelReason
    }

    try {
      const bookingId = selectedBooking._original?._id || selectedBooking._original?.id || selectedBooking.id
      // Truyền lý do hủy (label) vào API
      const result = await bookingApi.cancelBooking(bookingId, finalReason)
      
      // Hiển thị thông tin hoàn tiền nếu có
      if (result.success && result.data?.refundAmount > 0) {
        const refundAmount = result.data.refundAmount
        const refundStatus = result.data.refundStatus || "completed"
        
        if (refundStatus === "completed") {
          toast.success(
            `Hủy đặt sân thành công. Đã hoàn tiền ${refundAmount.toLocaleString('vi-VN')} VNĐ vào ví của bạn.`,
            { autoClose: 5000 }
          )
        } else {
          toast.success(
            `Hủy đặt sân thành công. Sẽ hoàn tiền ${refundAmount.toLocaleString('vi-VN')} VNĐ vào ví của bạn.`,
            { autoClose: 5000 }
          )
        }
      } else {
        toast.success('Hủy đặt sân thành công')
      }
      
      setRefreshKey(prev => prev + 1) // Refresh bookings
      setShowCancelModal(false)
      setSelectedBooking(null)
      setCancelReason('')
      setOtherReason('')
      setRefundInfo(null)
      setShowConfirmCancel(false)
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast.error(error.message || 'Không thể hủy đặt sân')
    }
  }

  const handleDownloadTicket = async () => {
    if (!ticketRef.current || !selectedBooking) return

    try {
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false
      })

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `ve-dat-san-${selectedBooking.id}-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 'image/png')
    } catch (error) {
      console.error('Error generating ticket:', error)
      alert('Có lỗi xảy ra khi tải vé. Vui lòng thử lại.')
    }
  }

  const generateQRCodeValue = (booking) => {
    // Generate QR code with booking information
    return JSON.stringify({
      id: booking.id,
      bookingCode: booking.bookingCode || booking.id,
      venue: booking.venue,
      date: booking.date,
      time: booking.time,
      sport: booking.sport
    })
  }
  // Fetch bookings from API
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        const result = await bookingApi.getMyBookings({ page, limit })

        if (result.success && result.data?.bookings) {
          // Update pagination info
          if (result.data.pagination) {
            setTotal(result.data.pagination.total)
            setTotalPages(result.data.pagination.pages || Math.ceil(result.data.pagination.total / limit))
          }

          // Transform API bookings to component format
          const transformedBookings = result.data.bookings.map(booking => {
            // Format time slots
            const timeSlots = booking.timeSlots || []
            const timeDisplay = timeSlots.length > 0
              ? timeSlots.join(', ')
              : 'N/A'

            // Format price
            const price = booking.totalAmount
              ? new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                minimumFractionDigits: 0
              }).format(booking.totalAmount)
              : '0 VNĐ'

            // Get facility image
            const imageUrl = booking.facility?.images?.[0]?.url || null

            // Check if booking has ended (date + time slots)
            const now = new Date()
            const today = new Date(now)
            today.setHours(0, 0, 0, 0)

            const bookingDate = new Date(booking.date)
            bookingDate.setHours(0, 0, 0, 0)

            let hasBookingEnded = false

            // If booking date is in the past, it has ended
            if (bookingDate < today) {
              hasBookingEnded = true
            }
            // If booking date is today, check if the last time slot has ended
            else if (bookingDate.getTime() === today.getTime()) {
              if (timeSlots.length > 0) {
                // Get the last time slot (usually the one with latest end time)
                const lastSlot = timeSlots[timeSlots.length - 1]
                const [startTime, endTime] = lastSlot.split('-')
                const [endHour, endMinute] = endTime.split(':').map(Number)

                // Create date object for booking end time
                const bookingEndTime = new Date(bookingDate)
                bookingEndTime.setHours(endHour, endMinute, 0, 0)

                // Check if current time has passed the end time
                hasBookingEnded = now >= bookingEndTime
              } else {
                // If no time slots, consider it ended if date is today and current time is past noon
                hasBookingEnded = now.getHours() >= 12
              }
            }
            // If booking date is in the future, it hasn't ended
            else {
              hasBookingEnded = false
            }

            // Map status dựa trên paymentStatus và paymentMethod
            // Chỉ hiển thị "completed" khi:
            // 1. Thanh toán tiền mặt: status = "confirmed" VÀ paymentStatus = "paid"
            // 2. Thanh toán online: paymentStatus = "paid"
            let status = booking.status
            const paymentStatus = booking.paymentStatus || 'pending'
            const paymentMethod = booking.paymentMethod || null

            // Kiểm tra điều kiện để hiển thị "completed"
            const canReview =
              (paymentMethod === 'cash' && status === 'confirmed' && paymentStatus === 'paid') ||
              (paymentMethod !== 'cash' && paymentStatus === 'paid')

            if (canReview) {
              status = 'completed'
            } else if (status === 'pending' || status === 'confirmed') {
              status = 'upcoming'
            }

            return {
              id: booking._id || booking.id,
              bookingCode: booking.bookingCode,
              venue: booking.facility?.name || 'Chưa có tên',
              sport: booking.court?.type?.name || booking.court?.type || 'Chưa xác định',
              date: booking.date,
              time: timeDisplay,
              location: booking.facility?.address || booking.facility?.location?.address || '',
              price: price,
              paymentMethod: paymentMethod,
              paymentStatus: paymentStatus, // Lưu paymentStatus để dùng cho validation
              status: status, // Status đã được map (upcoming/completed/cancelled)
              originalStatus: booking.status, // Lưu status gốc từ API để dùng cho điều kiện hiển thị nút
              imageUrl: imageUrl,
              isPastDate: hasBookingEnded, // Store flag to check if booking has ended
              bookingDate: bookingDate, // Store booking date for comparison
              _original: booking // Store original for API calls
            }
          })

          setBookings(transformedBookings)
        }
      } catch (error) {
        console.error('Error fetching bookings:', error)
        toast.error('Không thể tải danh sách đặt sân')
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [refreshKey, page, limit])

  // Fetch reviews to check which bookings have been reviewed
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const result = await reviewApi.getMyReviews({ limit: 100 })
        if (result.reviews) {
          const reviewsMap = {}
          result.reviews.forEach(review => {
            // Handle both populated and non-populated booking field
            const bookingId = review.booking?._id
              ? review.booking._id.toString()
              : review.booking?.id?.toString()
                ? review.booking.id.toString()
                : typeof review.booking === 'string'
                  ? review.booking
                  : null

            if (bookingId) {
              reviewsMap[bookingId] = review
            }
          })
          setBookingReviews(reviewsMap)
        }
      } catch (error) {
        console.error('Error fetching reviews:', error)
      }
    }
    fetchReviews()
  }, [refreshKey])

  const getStatusBadge = (status) => {
    // Map các status mới
    const statusLabels = {
      'pending': 'Chờ xác nhận',
      'pending_payment': 'Chờ thanh toán',
      'hold': 'Đang giữ chỗ',
      'confirmed': 'Đã xác nhận',
      'expired': 'Hết hạn',
      'cancelled': 'Đã hủy',
      'completed': 'Đã hoàn thành',
      'upcoming': 'Sắp tới'
    }

    const statusClasses = {
      'pending': 'status-upcoming',
      'pending_payment': 'status-upcoming',
      'hold': 'status-upcoming',
      'confirmed': 'status-upcoming',
      'expired': 'status-cancelled',
      'cancelled': 'status-cancelled',
      'completed': 'status-completed',
      'upcoming': 'status-upcoming'
    }

    const label = statusLabels[status] || status
    const className = statusClasses[status] || 'status-upcoming'

    return <span className={`status-badge ${className}`}>
      {label}
    </span>
  }

  return (
    <div className="bookings-section">
      <div className="section-header">
        <h3>Lịch sử đặt sân</h3>
        <span className="total-bookings">Tổng cộng: {total} lần đặt</span>
      </div>

      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px 20px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <Loader
            size={32}
            style={{
              color: '#3b82f6',
              animation: 'spin 1s linear infinite'
            }}
          />
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Đang tải danh sách đặt sân...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#6b7280'
        }}>
          <p style={{ fontSize: '16px', margin: 0 }}>Chưa có lịch sử đặt sân</p>
          <p style={{ fontSize: '14px', margin: '8px 0 0 0', color: '#9ca3af' }}>
            Đặt sân ngay để bắt đầu trải nghiệm
          </p>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map(booking => (
            <div key={booking.id} className="booking-card" style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
              {/* Thumbnail */}
              <div style={{ width: '120px', minWidth: '120px', height: '90px', borderRadius: '8px', overflow: 'hidden', background: '#f3f4f6' }}>
                {booking.imageUrl ? (
                  <img src={booking.imageUrl} alt={booking.venue} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '12px' }}>No image</div>
                )}
              </div>

              {/* Content */}
              <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between', gap: '12px' }}>
                <div className="booking-info">
                  <h4>{booking.venue}</h4>
                  <p className="booking-sport">{booking.sport}</p>
                  <div style={{ marginBottom: '8px' }}>
                    <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#374151' }}>
                      {new Date(booking.date).toLocaleDateString('vi-VN')}
                    </p>
                    <TimeSlotsDisplay timeSlots={booking._original?.timeSlots || (booking.time ? booking.time.split(', ') : [])} />
                  </div>
                  {booking.location && (
                    <p className="booking-location" style={{ color: '#6b7280' }}>{booking.location}</p>
                  )}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                    <span className="booking-price" style={{ fontWeight: 600 }}>{booking.price}</span>
                    {booking.paymentMethod && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 8px', background: '#eef2ff', color: '#4338ca', borderRadius: '999px' }}>
                        {getPaymentIconSrc(booking.paymentMethod) ? (
                          <img src={getPaymentIconSrc(booking.paymentMethod)} alt={booking.paymentMethod}
                            style={{ width: '16px', height: '16px', objectFit: 'contain', borderRadius: '3px' }} />
                        ) : (
                          <span role="img" aria-label="cash">💵</span>
                        )}
                        <span style={{ fontSize: '12px' }}>{booking.paymentMethod}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="booking-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', minWidth: '160px', gap: '8px' }}>
                  <div>
                    {getStatusBadge(booking.status)}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {/* Nút Chi tiết - không hiển thị cho đơn đã hủy */}
                    {booking.status !== 'cancelled' && booking.status !== 'expired' && (
                      <button
                        className="btn btn-outline small"
                        onClick={() => openDetailModal(booking)}
                        style={{
                          height: '32px',
                          minWidth: '90px',
                          padding: '0 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          whiteSpace: 'nowrap',
                          boxSizing: 'border-box'
                        }}
                      >
                        Chi tiết
                      </button>
                    )}
                    {/* Only show cancel button if booking is upcoming/pending/pending_payment/hold/confirmed AND date hasn't passed */}
                    {(() => {
                      // Lấy status gốc từ booking
                      const originalStatus = booking.originalStatus || booking._original?.status || booking.status
                      const displayStatus = booking.status
                      
                      // Có thể hủy nếu:
                      // 1. Status hiển thị là upcoming (đã được map từ pending/confirmed)
                      // 2. Hoặc status gốc là pending, pending_payment, hold, confirmed
                      // 3. VÀ chưa qua ngày đặt sân
                      // 4. VÀ không phải cancelled hoặc expired
                      const canCancel = (
                        displayStatus === 'upcoming' ||
                        originalStatus === 'pending' ||
                        originalStatus === 'pending_payment' ||
                        originalStatus === 'hold' ||
                        originalStatus === 'confirmed'
                      ) && 
                      originalStatus !== 'cancelled' &&
                      originalStatus !== 'expired' &&
                      !booking.isPastDate
                      
                      return canCancel
                    })() && (
                      <button
                        className="btn btn-outline small"
                        onClick={() => openCancelModal(booking)}
                        style={{
                          height: '32px',
                          minWidth: '90px',
                          padding: '0 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          whiteSpace: 'nowrap',
                          boxSizing: 'border-box'
                        }}
                      >
                        Hủy đặt
                      </button>
                    )}
                    {(() => {
                      // Kiểm tra điều kiện để hiển thị nút đánh giá
                      // 1. Thanh toán tiền mặt: status = "completed" (đã được set từ canReview) VÀ paymentStatus = "paid"
                      // 2. Thanh toán online: status = "completed" VÀ paymentStatus = "paid"
                      const canReview = booking.status === 'completed' && booking.paymentStatus === 'paid'
                      const hasReview = bookingReviews[booking.id] || bookingReviews[booking._original?._id?.toString()]

                      return canReview && !hasReview
                    })() && (
                        <button
                          className="btn small"
                          onClick={() => {
                            setSelectedBooking(booking)
                            setSelectedReview(null) // Đảm bảo không có review khi tạo mới
                            setShowReviewModal(true)
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            border: 'none',
                            height: '32px',
                            minWidth: '90px',
                            padding: '0 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap',
                            boxSizing: 'border-box'
                          }}
                        >
                          <Star size={14} fill="#fff" />
                          Đánh giá
                        </button>
                      )}
                    {(() => {
                      // Kiểm tra điều kiện để hiển thị badge "Đã đánh giá"
                      const canReview = booking.status === 'completed' && booking.paymentStatus === 'paid'
                      const hasReview = bookingReviews[booking.id] || bookingReviews[booking._original?._id?.toString()]

                      return canReview && hasReview
                    })() && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            padding: '0 10px',
                            height: '32px',
                            minWidth: '90px',
                            background: '#f0f9ff',
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: '#3b82f6',
                            border: '1px solid #bae6fd',
                            whiteSpace: 'nowrap',
                            boxSizing: 'border-box'
                          }}>
                            <Star size={14} fill="#fbbf24" color="#fbbf24" />
                            <span>Đã đánh giá</span>
                          </div>
                          <button
                            className="btn btn-outline small"
                            onClick={() => openEditReviewModal(booking)}
                            style={{
                              height: '32px',
                              minWidth: '90px',
                              padding: '0 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              whiteSpace: 'nowrap',
                              boxSizing: 'border-box'
                            }}
                          >
                            Chỉnh sửa
                          </button>
                        </div>
                      )}
                    {/* Nút Khiếu nại - chỉ hiển thị cho booking đã hoàn thành */}
                    {booking.status === 'completed' && (
                      <button
                        className="btn btn-outline small"
                        onClick={() => openReportModal(booking)}
                        title="Khiếu nại"
                        style={{
                          height: '32px',
                          width: '32px',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#d97706',
                          borderColor: '#fbbf24',
                          flexShrink: 0,
                          boxSizing: 'border-box'
                        }}
                      >
                        <AlertCircle size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && bookings.length > 0 && totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            <label className="pagination-text">Hiển thị</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value))
                setPage(1) // Reset to first page when changing page size
              }}
              className="pagination-select"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="pagination-text">kết quả</span>
            <span className="pagination-text">
              Hiển thị {(page - 1) * limit + 1} đến {Math.min(page * limit, total)} trong tổng số {total} bản ghi
            </span>
          </div>

          <div className="pagination-controls">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="pagination-btn"
            >
              <ChevronLeft size={16} />
              Trước
            </button>

            <div className="pagination-current">
              {page} / {totalPages}
            </div>

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="pagination-btn"
            >
              Sau
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      <Dialog
        open={showCancelModal}
        onClose={() => {
          setShowCancelModal(false)
          setShowConfirmCancel(false)
          setRefundInfo(null)
        }}
        title="Hủy đặt sân"
        description={selectedBooking ? `${selectedBooking.venue} - ${new Date(selectedBooking.date).toLocaleDateString('vi-VN')} ${selectedBooking.time}` : ''}
        maxWidth="520px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Cảnh báo về chính sách hoàn tiền */}
          {refundInfo && selectedBooking?.paymentStatus === 'paid' && (
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              border: refundInfo.warningLevel === 'no_refund' 
                ? '2px solid #ef4444' 
                : refundInfo.warningLevel === 'partial'
                ? '2px solid #f59e0b'
                : '2px solid #10b981',
              background: refundInfo.warningLevel === 'no_refund'
                ? '#fef2f2'
                : refundInfo.warningLevel === 'partial'
                ? '#fffbeb'
                : '#ecfdf5'
            }}>
              <div style={{
                fontWeight: 600,
                fontSize: '15px',
                marginBottom: '8px',
                color: refundInfo.warningLevel === 'no_refund'
                  ? '#dc2626'
                  : refundInfo.warningLevel === 'partial'
                  ? '#d97706'
                  : '#059669'
              }}>
                {refundInfo.warningLevel === 'no_refund' && '⚠️ Cảnh báo: Không hoàn tiền'}
                {refundInfo.warningLevel === 'partial' && '⚠️ Cảnh báo: Chỉ hoàn 50%'}
                {refundInfo.warningLevel === 'none' && '✓ Thông tin hoàn tiền'}
              </div>
              <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Thời gian còn lại:</strong> {Math.floor(refundInfo.hoursUntilBooking)} giờ {Math.floor((refundInfo.hoursUntilBooking % 1) * 60)} phút
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Chính sách:</strong> {refundInfo.refundMessage}
                </div>
                {refundInfo.refundAmount > 0 ? (
                  <div style={{
                    padding: '12px',
                    background: '#fff',
                    borderRadius: '6px',
                    marginTop: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#059669', marginBottom: '4px' }}>
                      Số tiền hoàn: {refundInfo.refundAmount.toLocaleString('vi-VN')} VNĐ ({refundInfo.refundPercentage}%)
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Tổng tiền: {refundInfo.totalAmount.toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '12px',
                    background: '#fff',
                    borderRadius: '6px',
                    marginTop: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#dc2626' }}>
                      Không được hoàn tiền
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      Tổng tiền: {refundInfo.totalAmount.toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Xác nhận lại khi hủy 12-24h hoặc <12h */}
          {showConfirmCancel && refundInfo && (refundInfo.warningLevel === 'partial' || refundInfo.warningLevel === 'no_refund') && (
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '2px solid #ef4444'
            }}>
              <div style={{ fontWeight: 700, fontSize: '16px', color: '#dc2626', marginBottom: '8px' }}>
                Xác nhận lại
              </div>
              <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
                {refundInfo.warningLevel === 'no_refund' ? (
                  <p style={{ margin: 0 }}>
                    Bạn có chắc chắn muốn hủy đặt sân? <strong style={{ color: '#dc2626' }}>Bạn sẽ không được hoàn tiền</strong> vì hủy dưới 12 giờ trước giờ vào sân.
                  </p>
                ) : (
                  <p style={{ margin: 0 }}>
                    Bạn có chắc chắn muốn hủy đặt sân? <strong style={{ color: '#d97706' }}>Bạn chỉ được hoàn {refundInfo.refundPercentage}% số tiền</strong> ({refundInfo.refundAmount.toLocaleString('vi-VN')} VNĐ) vì hủy từ 12-24 giờ trước giờ vào sân.
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <div style={{ fontWeight: 600, marginBottom: '8px' }}>Chọn lý do hủy</div>
            <div style={{ display: 'grid', gap: '8px' }}>
              {cancelReasons.map(r => (
                <label key={r.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="cancelReason"
                    value={r.value}
                    checked={cancelReason === r.value}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {cancelReason === 'other' && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>Mô tả lý do</div>
              <textarea
                rows={3}
                placeholder="Nhập lý do hủy..."
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
            </div>
          )}

          <p style={{ margin: 0, color: '#6b7280' }}>Hành động này không thể hoàn tác.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button 
              className="btn btn-outline" 
              onClick={() => {
                setShowCancelModal(false)
                setShowConfirmCancel(false)
                setRefundInfo(null)
              }}
            >
              Đóng
            </button>
            <button
              className="btn"
              onClick={handleConfirmCancel}
              disabled={
                !cancelReason || (cancelReason === 'other' && !otherReason.trim())
              }
              style={{ 
                opacity: !cancelReason || (cancelReason === 'other' && !otherReason.trim()) ? 0.6 : 1,
                background: refundInfo?.warningLevel === 'no_refund' ? '#dc2626' : refundInfo?.warningLevel === 'partial' ? '#f59e0b' : undefined
              }}
            >
              {showConfirmCancel ? 'Xác nhận hủy' : 'Tiếp tục'}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Booking Detail Modal */}
      <Dialog
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Chi tiết đặt sân"
        description="Thông tin chi tiết về lần đặt"
        maxWidth="560px"
      >
        {selectedBooking && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Image preview full width */}
            {selectedBooking.imageUrl && (
              <div style={{ gridColumn: '1 / -1', borderRadius: '12px', overflow: 'hidden' }}>
                <img src={selectedBooking.imageUrl} alt={selectedBooking.venue} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
              </div>
            )}

            <div>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>Sân</div>
              <div style={{ fontWeight: 600 }}>{selectedBooking.venue}</div>
            </div>
            <div>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>Môn</div>
              <div>{selectedBooking.sport}</div>
            </div>
            {selectedBooking.location && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Vị trí</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>{selectedBooking.location}</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedBooking.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#ef4444', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Xem bản đồ
                  </a>
                </div>
              </div>
            )}
            <div>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>Ngày</div>
              <div>{new Date(selectedBooking.date).toLocaleDateString('vi-VN')}</div>
            </div>
            <div>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>Giờ</div>
              <div>{selectedBooking.time}</div>
            </div>
            <div>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>Trạng thái</div>
              <div>{selectedBooking.status === 'upcoming' ? 'Sắp tới' : selectedBooking.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}</div>
            </div>
            <div>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>Giá</div>
              <div>{selectedBooking.price}</div>
            </div>
            {selectedBooking.paymentMethod && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ color: '#6b7280', fontSize: '12px' }}>Phương thức thanh toán</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  {getPaymentIconSrc(selectedBooking.paymentMethod) ? (
                    <img src={getPaymentIconSrc(selectedBooking.paymentMethod)} alt={selectedBooking.paymentMethod}
                      style={{ width: '18px', height: '18px', objectFit: 'contain', borderRadius: '4px' }} />
                  ) : (
                    <span role="img" aria-label="cash">💵</span>
                  )}
                  <span>{selectedBooking.paymentMethod}</span>
                </div>
              </div>
            )}
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button
                className="btn btn-outline"
                onClick={handleDownloadTicket}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={16} />
                Lưu vé
              </button>
              <button className="btn btn-outline" onClick={() => setShowDetailModal(false)}>Đóng</button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Ticket Template (Hidden, used for download) */}
      {selectedBooking && (
        <div
          ref={ticketRef}
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            width: '600px',
            background: '#ffffff',
            padding: '32px',
            fontFamily: 'Arial, sans-serif'
          }}
        >
          <div style={{ border: '2px solid #1f2937', borderRadius: '12px', padding: '24px', background: '#ffffff' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '2px solid #e5e7eb', paddingBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#1f2937' }}>VÉ ĐẶT SÂN</h2>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>Booking Sport</p>
            </div>

            {/* Main Content */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
              {/* Left - Booking Info */}
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Tên sân</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{selectedBooking.venue}</div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Môn thể thao</div>
                  <div style={{ fontSize: '16px', color: '#1f2937' }}>{selectedBooking.sport}</div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Ngày & Giờ</div>
                  <div style={{ fontSize: '16px', color: '#1f2937' }}>
                    {new Date(selectedBooking.date).toLocaleDateString('vi-VN')} - {selectedBooking.time}
                  </div>
                </div>
                {selectedBooking.location && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Địa chỉ</div>
                    <div style={{ fontSize: '14px', color: '#1f2937' }}>{selectedBooking.location}</div>
                  </div>
                )}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Giá</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#16a34a' }}>{selectedBooking.price}</div>
                </div>
                {selectedBooking.paymentMethod && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Phương thức thanh toán</div>
                    <div style={{ fontSize: '14px', color: '#1f2937' }}>{selectedBooking.paymentMethod}</div>
                  </div>
                )}
              </div>

              {/* Right - QR Code */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  background: '#ffffff',
                  padding: '16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <QRCodeSVG
                    value={generateQRCodeValue(selectedBooking)}
                    size={150}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
                  Mã đặt sân: {selectedBooking.bookingCode || `#${selectedBooking.id}`}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '16px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                Vui lòng mang theo vé này khi đến sân
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
                Trạng thái: {selectedBooking.status === 'upcoming' ? 'Sắp tới' : selectedBooking.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Review Modal */}
      <CreateReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false)
          setSelectedBooking(null)
          setSelectedReview(null)
        }}
        booking={selectedReview ? null : (selectedBooking ? {
          ...selectedBooking,
          _id: selectedBooking._original?._id || selectedBooking._original?.id || selectedBooking.id,
          id: selectedBooking._original?._id || selectedBooking._original?.id || selectedBooking.id
        } : null)}
        review={selectedReview ? {
          ...selectedReview,
          _id: selectedReview._id || selectedReview.id,
          id: selectedReview._id || selectedReview.id
        } : null}
        onSuccess={(review) => {
          // Update state to hide "Đánh giá" button or update review
          if (selectedBooking) {
            const bookingId = selectedBooking._original?._id?.toString() || selectedBooking._original?.id?.toString() || selectedBooking.id
            if (bookingId) {
              setBookingReviews(prev => ({
                ...prev,
                [bookingId]: review
              }))
            }
          }
          handleReviewSuccess()
          setShowReviewModal(false)
          setSelectedBooking(null)
          setSelectedReview(null)
        }}
      />

      {/* Report Booking Modal */}
      <ReportBookingModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false)
          setSelectedBooking(null)
        }}
        booking={selectedBooking}
        onSubmit={(reportData) => {
          console.log('Report submitted:', reportData)
          // TODO: Handle report submission
          setShowReportModal(false)
          setSelectedBooking(null)
        }}
      />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}


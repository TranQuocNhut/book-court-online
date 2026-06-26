import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { bookingApi } from '../api/bookingApi'
import { toast } from 'react-toastify'
import { useAuth } from '../contexts/AuthContext'

const PAYMENT_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

function PendingBookingNotification() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()
  const [pendingBooking, setPendingBooking] = useState(null)
  const [remainingTime, setRemainingTime] = useState(0)
  const [isChecking, setIsChecking] = useState(true)

  // Check if user is on payment page
  const isOnPaymentPage = location.pathname === '/payment'

  const handleAutoCancel = useCallback(async (bookingId, localStorageKey) => {
    try {
      await bookingApi.cancelBooking(bookingId)
      localStorage.removeItem(localStorageKey)
      setPendingBooking(null)
      toast.error('Đã hết thời gian thanh toán. Booking đã được tự động hủy.')
    } catch (error) {
      console.error('Error auto-cancelling booking:', error)
      localStorage.removeItem(localStorageKey)
      setPendingBooking(null)
    }
  }, [])

  // Check for pending bookings
  const checkPendingBooking = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setIsChecking(false)
      return
    }
      try {
        // Check localStorage for pending bookings
        const keys = Object.keys(localStorage)
        const pendingKeys = keys.filter(key => key.startsWith('pending_booking_'))

        if (pendingKeys.length === 0) {
          setIsChecking(false)
          return
        }

        // Get the most recent pending booking
        let latestPending = null
        let latestTime = 0

        for (const key of pendingKeys) {
          try {
            const data = JSON.parse(localStorage.getItem(key))
            if (data && data.expiresAt > Date.now()) {
              if (data.createdAt > latestTime) {
                latestTime = data.createdAt
                latestPending = { key, data }
              }
            } else {
              // Expired, remove from localStorage
              localStorage.removeItem(key)
            }
          } catch (e) {
            // Invalid data, remove
            localStorage.removeItem(key)
          }
        }

        if (latestPending) {
          // Verify booking still exists and is pending
          try {
            const bookingResult = await bookingApi.getBookingById(latestPending.data.bookingId)
            
            if (bookingResult.success && bookingResult.data) {
              const booking = bookingResult.data
              
              // Check if booking is still pending and payment is pending
              if (booking.status === 'pending' && booking.paymentStatus === 'pending') {
                // Check if user owns this booking
                const bookingUserId = booking.user?._id || booking.user
                if (String(bookingUserId) === String(user._id)) {
                  setPendingBooking(latestPending.data)
                  
                  // Calculate remaining time
                  const elapsed = Date.now() - latestPending.data.createdAt
                  const remaining = PAYMENT_TIMEOUT_MS - elapsed
                  if (remaining > 0) {
                    setRemainingTime(remaining)
                    
                    // Start countdown
                    const interval = setInterval(() => {
                      const newRemaining = PAYMENT_TIMEOUT_MS - (Date.now() - latestPending.data.createdAt)
                      if (newRemaining > 0) {
                        setRemainingTime(newRemaining)
                      } else {
                        // Expired, auto cancel
                        clearInterval(interval)
                        handleAutoCancel(latestPending.data.bookingId, latestPending.key)
                      }
                    }, 1000)
                    
                    return () => clearInterval(interval)
                  } else {
                    // Already expired
                    handleAutoCancel(latestPending.data.bookingId, latestPending.key)
                  }
                }
              } else {
                // Booking is no longer pending, remove from localStorage
                localStorage.removeItem(latestPending.key)
              }
            }
          } catch (error) {
            // Booking not found or error, remove from localStorage
            localStorage.removeItem(latestPending.key)
          }
        }
      } catch (error) {
        console.error('Error checking pending booking:', error)
      } finally {
        setIsChecking(false)
      }
    }, [isAuthenticated, user, handleAutoCancel])

  useEffect(() => {
    checkPendingBooking()
    
    // Check periodically
    const interval = setInterval(checkPendingBooking, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [checkPendingBooking])

  const handleContinuePayment = () => {
    if (pendingBooking) {
      navigate('/payment', {
        state: { bookingData: pendingBooking.bookingInfo }
      })
    }
  }

  const handleCancelBooking = async () => {
    if (!pendingBooking) return

    const bookingId = pendingBooking.bookingId
    const pendingBookingKey = `pending_booking_${bookingId}`

    try {
      const result = await bookingApi.cancelBooking(bookingId)
      if (result.success) {
        // Clear from localStorage
        localStorage.removeItem(pendingBookingKey)
        const startTimeKey = `payment_start_time_${bookingId}`
        localStorage.removeItem(startTimeKey)
        
        // Clear state
        setPendingBooking(null)
        toast.success('Đã hủy đặt sân thành công')
      } else {
        toast.error('Không thể hủy đặt sân. Vui lòng thử lại.')
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast.error('Không thể hủy đặt sân. Vui lòng thử lại.')
    }
  }

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Don't show notification if checking, no pending booking, or already on payment page
  if (isChecking || !pendingBooking || isOnPaymentPage) return null

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: '20px',
      maxWidth: '400px',
      border: '2px solid #f59e0b'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <div style={{
          fontSize: '24px'
        }}>
          ⚠️
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '8px'
          }}>
            Bạn có đơn đặt sân đang chờ thanh toán
          </div>
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '12px'
          }}>
            Thời gian còn lại: <strong style={{ color: '#f59e0b' }}>{formatTime(remainingTime)}</strong>
          </div>
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={handleContinuePayment}
              style={{
                flex: 1,
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Tiếp tục thanh toán
            </button>
            <button
              onClick={handleCancelBooking}
              style={{
                background: 'transparent',
                color: '#dc2626',
                border: '1px solid #dc2626',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Hủy thanh toán
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PendingBookingNotification


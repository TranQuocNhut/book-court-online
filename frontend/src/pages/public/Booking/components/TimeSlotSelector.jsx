import React, { useState, useEffect } from 'react'
import { Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import useDeviceType from '../../../../hook/use-device-type'
import useClickOutside from '../../../../hook/use-click-outside'
import useToggle from '../../../../hook/use-toggle'
import { formatDate, generateCalendarDays, formatDateToYYYYMMDD } from '../utils/dateHelpers'
import { bookingApi } from '../../../../api/bookingApi'
import { toast } from 'react-toastify'

export default function TimeSlotSelector({
  selectedDate,
  onDateChange,
  selectedSlots,
  onSlotSelect,
  selectedCourt,
  venuePrice,
  onTimeSlotsDataChange,
  lockedSlots = {},
  onSlotLock,
  onSlotUnlock,
  currentUserId,
  bookedSlots = new Set()
}) {
  const { isMobile, isTablet } = useDeviceType()
  const [showDatePicker, { toggle: toggleDatePicker, setFalse: closeDatePicker }] = useToggle(false)
  const [bookedTimes, setBookedTimes] = useState([])
  const [timeSlots, setTimeSlots] = useState([])
  const [originalTimeSlots, setOriginalTimeSlots] = useState([]) // Store original availability from API
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [showSkeleton, setShowSkeleton] = useState(false)

  const datePickerRef = useClickOutside(() => closeDatePicker(), showDatePicker)

  // Fetch availability from API when court or date changes
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedCourt || !selectedDate) {
        // Reset to default if no court selected
        const defaultSlots = [
          { time: '06:00', endTime: '07:00', price: venuePrice || 200000 },
          { time: '07:00', endTime: '08:00', price: venuePrice || 200000 },
          { time: '08:00', endTime: '09:00', price: venuePrice || 200000 },
          { time: '09:00', endTime: '10:00', price: venuePrice || 250000 },
          { time: '10:00', endTime: '11:00', price: venuePrice || 250000 },
          { time: '11:00', endTime: '12:00', price: venuePrice || 250000 },
          { time: '12:00', endTime: '13:00', price: venuePrice || 250000 },
          { time: '13:00', endTime: '14:00', price: venuePrice || 250000 },
          { time: '14:00', endTime: '15:00', price: venuePrice || 300000 },
          { time: '15:00', endTime: '16:00', price: venuePrice || 300000 },
          { time: '16:00', endTime: '17:00', price: venuePrice || 300000 },
          { time: '17:00', endTime: '18:00', price: venuePrice || 350000 },
          { time: '18:00', endTime: '19:00', price: venuePrice || 350000 },
          { time: '19:00', endTime: '20:00', price: venuePrice || 350000 },
          { time: '20:00', endTime: '21:00', price: venuePrice || 350000 },
          { time: '21:00', endTime: '22:00', price: venuePrice || 300000 }
        ]
        setTimeSlots(defaultSlots)
        if (onTimeSlotsDataChange) {
          onTimeSlotsDataChange(defaultSlots)
        }
        setBookedTimes([])
        return
      }

      setLoadingAvailability(true)
      setShowSkeleton(true)

      // Add minimum delay to show skeleton loading (improve UX)
      const minLoadingTime = 300 // 300ms minimum loading time
      const startTime = Date.now()

      try {
        // Format date to YYYY-MM-DD in local timezone (not UTC)
        const dateStr = formatDateToYYYYMMDD(selectedDate)

        const result = await bookingApi.getAvailability(selectedCourt, dateStr)

        // Calculate remaining time to meet minimum loading time
        const elapsedTime = Date.now() - startTime
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime)

        // Wait for remaining time if needed
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime))
        }

        if (result.success && result.data) {
          const slots = result.data.slots || []

          // Transform API response to timeSlots format
          const transformedSlots = slots.map(slot => {
            const [startTime, endTime] = slot.slot.split('-')
            const timeSlotStr = `${startTime}-${endTime}`
            const dateStr = formatDateToYYYYMMDD(selectedDate)
            const lockKey = selectedCourt ? `${selectedCourt}_${dateStr}_${timeSlotStr}` : null

            // Check if slot is in bookedSlots (from socket events)
            const isBookedFromSocket = lockKey && bookedSlots.has(lockKey)

            return {
              time: startTime,
              endTime: endTime,
              price: slot.price || venuePrice || 200000,
              available: isBookedFromSocket ? false : slot.available
            }
          })

          setTimeSlots(transformedSlots)
          setOriginalTimeSlots(transformedSlots) // Store original availability

          // Pass time slots data to parent component for price calculation
          if (onTimeSlotsDataChange) {
            onTimeSlotsDataChange(transformedSlots)
          }

          // Get booked times (not available)
          const booked = slots
            .filter(slot => !slot.available)
            .map(slot => slot.time)
          setBookedTimes(booked)
        }
      } catch (error) {
        console.error('Error fetching availability:', error)
        // Fallback to default slots on error
        const defaultSlots = [
          { time: '06:00', endTime: '07:00', price: venuePrice || 200000 },
          { time: '07:00', endTime: '08:00', price: venuePrice || 200000 },
          { time: '08:00', endTime: '09:00', price: venuePrice || 200000 },
          { time: '09:00', endTime: '10:00', price: venuePrice || 250000 },
          { time: '10:00', endTime: '11:00', price: venuePrice || 250000 },
          { time: '11:00', endTime: '12:00', price: venuePrice || 250000 },
          { time: '12:00', endTime: '13:00', price: venuePrice || 250000 },
          { time: '13:00', endTime: '14:00', price: venuePrice || 250000 },
          { time: '14:00', endTime: '15:00', price: venuePrice || 300000 },
          { time: '15:00', endTime: '16:00', price: venuePrice || 300000 },
          { time: '16:00', endTime: '17:00', price: venuePrice || 300000 },
          { time: '17:00', endTime: '18:00', price: venuePrice || 350000 },
          { time: '18:00', endTime: '19:00', price: venuePrice || 350000 },
          { time: '19:00', endTime: '20:00', price: venuePrice || 350000 },
          { time: '20:00', endTime: '21:00', price: venuePrice || 350000 },
          { time: '21:00', endTime: '22:00', price: venuePrice || 300000 }
        ]
        setTimeSlots(defaultSlots)
        if (onTimeSlotsDataChange) {
          onTimeSlotsDataChange(defaultSlots)
        }
        setBookedTimes([])
      } finally {
        setLoadingAvailability(false)
        // Small delay before hiding skeleton for smooth transition
        setTimeout(() => {
          setShowSkeleton(false)
        }, 150)
      }
    }

    fetchAvailability()
  }, [selectedCourt, selectedDate, venuePrice])

  // Update timeSlots when bookedSlots changes (from socket events)
  useEffect(() => {
    if (!selectedCourt || !selectedDate || timeSlots.length === 0 || originalTimeSlots.length === 0) return

    const dateStr = formatDateToYYYYMMDD(selectedDate)

    setTimeSlots(prev => prev.map((slot, index) => {
      const timeSlotStr = `${slot.time}-${slot.endTime}`
      const lockKey = `${selectedCourt}_${dateStr}_${timeSlotStr}`
      const isBookedFromSocket = bookedSlots.has(lockKey)

      // Find original slot from API
      const originalSlot = originalTimeSlots.find(os => os.time === slot.time && os.endTime === slot.endTime)
      const originalAvailable = originalSlot ? originalSlot.available : slot.available

      // If slot is booked from socket, mark as unavailable
      if (isBookedFromSocket) {
        return { ...slot, available: false }
      }

      // If slot is not in bookedSlots anymore (cancelled), restore original availability
      // This handles the case where slot was booked via socket and then cancelled
      return { ...slot, available: originalAvailable }
    }))
  }, [bookedSlots, selectedCourt, selectedDate, originalTimeSlots])

  const handleSlotClick = (timeSlot) => {
    // Require court to be selected before allowing slot selection
    if (!selectedCourt) {
      toast.warning('Vui lòng chọn sân trước khi chọn khung giờ')
      return
    }

    const dateStr = formatDateToYYYYMMDD(selectedDate)
    const slotKey = `${dateStr}-${timeSlot.time}`
    const timeSlotStr = `${timeSlot.time}-${timeSlot.endTime}`
    const lockKey = `${selectedCourt}_${dateStr}_${timeSlotStr}`
    const slotLock = lockedSlots[lockKey]

    // Check if locked by another user
    if (slotLock?.isLockedByOther) {
      toast.warning('Slot này đang được người khác giữ chỗ')
      return
    }

    if (selectedSlots.includes(slotKey)) {
      // Unlock slot when user deselects
      if (onSlotUnlock && slotLock?.isLockedByMe) {
        onSlotUnlock(timeSlotStr)
      }
      onSlotSelect(selectedSlots.filter(slot => slot !== slotKey))
    } else {
      // Lock slot when user selects
      if (onSlotLock) {
        onSlotLock(timeSlotStr)
      }
      onSlotSelect([...selectedSlots, slotKey])
    }
  }

  const isSlotSelected = (timeSlot) => {
    const dateStr = formatDateToYYYYMMDD(selectedDate)
    const slotKey = `${dateStr}-${timeSlot.time}`
    return selectedSlots.includes(slotKey)
  }

  const calculateTotal = () => {
    return selectedSlots.reduce((total, slotKey) => {
      const time = slotKey.split('-')[2] // Get time from key
      const slot = timeSlots.find(s => s.time === time)
      return total + (slot?.price || 0)
    }, 0)
  }

  const isSlotBooked = (timeSlot) => {
    // Check if slot is in bookedSlots (from socket events)
    if (selectedCourt) {
      const dateStr = formatDateToYYYYMMDD(selectedDate)
      const timeSlotStr = `${timeSlot.time}-${timeSlot.endTime}`
      const lockKey = `${selectedCourt}_${dateStr}_${timeSlotStr}`
      if (bookedSlots.has(lockKey)) {
        return true
      }
    }

    // Use available property from API if available, otherwise fallback to bookedTimes
    if (timeSlot.hasOwnProperty('available')) {
      return !timeSlot.available
    }
    return bookedTimes.includes(timeSlot.time)
  }

  const isPastTime = (timeSlot) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())

    // If selected date is in the future, no slots are past
    if (selectedDateOnly > today) return false

    // If selected date is in the past, all slots are past
    if (selectedDateOnly < today) return true

    // If selected date is today, check if time slot is in the past
    const [hours] = timeSlot.time.split(':').map(Number)
    const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, 0)

    return slotTime < now
  }

  const getSlotStatus = (timeSlot) => {
    const dateStr = formatDateToYYYYMMDD(selectedDate)
    const timeSlotStr = `${timeSlot.time}-${timeSlot.endTime}`
    const lockKey = selectedCourt ? `${selectedCourt}_${dateStr}_${timeSlotStr}` : null
    const slotLock = lockKey ? lockedSlots[lockKey] : null

    if (isPastTime(timeSlot) || isSlotBooked(timeSlot)) return 'booked'
    if (slotLock?.isLockedByOther) return 'locked' // Locked by another user
    if (isSlotSelected(timeSlot)) return 'selected'
    return 'available'
  }

  return (
    <div style={{
      background: '#fff',
      padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
      borderRadius: '12px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <Clock size={isMobile ? 18 : isTablet ? 19 : 20} color="#374151" />
            <h3 style={{ margin: 0, fontSize: isMobile ? '16px' : isTablet ? '17px' : '18px', fontWeight: '600', color: '#1f2937' }}>
              Chọn khung giờ
            </h3>
          </div>

          {/* Date Picker */}
          <div ref={datePickerRef} style={{ position: 'relative', marginBottom: '16px' }}>
            <button
              onClick={toggleDatePicker}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                background: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#6b7280',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#9ca3af'
                e.currentTarget.style.background = '#f9fafb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.background = '#fff'
              }}
            >
              <Calendar size={16} />
              {formatDate(selectedDate)}
            </button>

            {/* Calendar Picker - Dropdown */}
            {showDatePicker && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '8px',
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  zIndex: 1000,
                  border: '1px solid #e5e7eb',
                  maxWidth: '320px',
                  width: '100%'
                }}
              >
                {/* Calendar Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedDate)
                      newDate.setMonth(newDate.getMonth() - 1)
                      onDateChange(newDate)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#6b7280'
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    {selectedDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                  </span>

                  <button
                    onClick={() => {
                      const newDate = new Date(selectedDate)
                      newDate.setMonth(newDate.getMonth() + 1)
                      onDateChange(newDate)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#6b7280'
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Calendar Days Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '4px',
                  marginBottom: '8px'
                }}>
                  {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                    <div key={day} style={{
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#6b7280',
                      padding: '8px 4px'
                    }}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '4px'
                }}>
                  {generateCalendarDays(selectedDate).map((day, index) => {
                    const isSelected = day.date.toDateString() === selectedDate.toDateString()
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (!day.isPast) {
                            onDateChange(day.date)
                            closeDatePicker()
                          }
                        }}
                        disabled={day.isPast}
                        style={{
                          background: isSelected ? '#1f2937' :
                            day.isToday ? '#f3f4f6' : 'transparent',
                          color: isSelected ? '#fff' :
                            day.isPast ? '#d1d5db' :
                              day.isCurrentMonth ? '#1f2937' : '#9ca3af',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 4px',
                          fontSize: '14px',
                          fontWeight: isSelected ? '600' : '400',
                          cursor: day.isPast ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                          opacity: day.isPast ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected && !day.isPast) {
                            e.target.style.background = '#f3f4f6'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected && !day.isPast) {
                            e.target.style.background = day.isToday ? '#f3f4f6' : 'transparent'
                          }
                        }}
                      >
                        {day.date.getDate()}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Time Slots Grid */}
        <div style={{ marginBottom: '20px' }}>
          {(loadingAvailability || showSkeleton) && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
              gap: '12px'
            }}>
              {Array.from({ length: 16 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '16px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: '#f9fafb',
                    minHeight: '90px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Skeleton shimmer effect */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
                      animation: 'shimmer 1.5s infinite'
                    }}
                  />
                  <div
                    style={{
                      width: '60%',
                      height: '16px',
                      background: '#e5e7eb',
                      borderRadius: '4px',
                      position: 'relative',
                      zIndex: 1
                    }}
                  />
                  <div
                    style={{
                      width: '40%',
                      height: '14px',
                      background: '#e5e7eb',
                      borderRadius: '4px',
                      position: 'relative',
                      zIndex: 1
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          {!loadingAvailability && !showSkeleton && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
              gap: '12px',
              animation: 'fadeIn 0.3s ease-in'
            }}>
              {timeSlots.map((slot) => {
                const status = getSlotStatus(slot)
                const isSelected = status === 'selected'
                const isBooked = status === 'booked'
                const isLockedByOther = status === 'locked'
                const isDisabled = !selectedCourt || isBooked || isLockedByOther

                return (
                  <button
                    key={slot.time}
                    onClick={() => !isDisabled && handleSlotClick(slot)}
                    disabled={isDisabled}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '16px 12px',
                      border: isSelected ? '2px solid #000' :
                        isLockedByOther ? '2px solid #ffc107' :
                          '1px solid #e5e7eb',
                      borderRadius: '8px',
                      background: isSelected ? '#000' :
                        isBooked ? '#f5f5f5' :
                          isLockedByOther ? '#fff3cd' : '#fff',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: !selectedCourt ? 0.6 : 1,
                      transition: 'all 0.2s',
                      minHeight: '90px'
                    }}
                    onMouseEnter={(e) => {
                      if (status === 'available') {
                        e.currentTarget.style.borderColor = '#9ca3af'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (status === 'available') {
                        e.currentTarget.style.borderColor = '#e5e7eb'
                      }
                    }}
                  >
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: isSelected ? '#fff' :
                        isBooked ? '#9ca3af' :
                          isLockedByOther ? '#856404' : '#1f2937'
                    }}>
                      {slot.time} - {slot.endTime}
                    </div>

                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: isSelected ? '#fff' :
                        isBooked ? '#9ca3af' :
                          isLockedByOther ? '#856404' : '#374151'
                    }}>
                      {!selectedCourt ? 'Chọn sân trước' :
                        isBooked ? 'Đã đặt' :
                          isLockedByOther ? 'Đang giữ chỗ' :
                            `${slot.price.toLocaleString('vi-VN')} đ`}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Add CSS animations */}
        <style>{`
          @keyframes shimmer {
            0% {
              left: -100%;
            }
            100% {
              left: 100%;
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        {/* Legend */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          gap: isMobile ? '12px' : '24px',
          paddingTop: '16px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '16px',
              height: '16px',
              background: '#000',
              borderRadius: '4px'
            }}></div>
            <span style={{ fontSize: '14px', color: '#374151' }}>Đã chọn</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '16px',
              height: '16px',
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '4px'
            }}></div>
            <span style={{ fontSize: '14px', color: '#374151' }}>Còn trống</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '16px',
              height: '16px',
              background: '#f5f5f5',
              border: '1px solid #e5e7eb',
              borderRadius: '4px'
            }}></div>
            <span style={{ fontSize: '14px', color: '#374151' }}>Đã đặt</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '16px',
              height: '16px',
              background: '#fff3cd',
              border: '2px solid #ffc107',
              borderRadius: '4px'
            }}></div>
            <span style={{ fontSize: '14px', color: '#374151' }}>Đang giữ chỗ</span>
          </div>
        </div>

      </div>
    </div>
  )
}


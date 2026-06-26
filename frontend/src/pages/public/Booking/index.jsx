import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import VenueGallery from './components/VenueGallery'
import '../../../styles/Booking.css'
import VenueInfo from './components/VenueInfo'
import MapDisplay from '../../../components/map/MapDisplay'
import ReviewsSection from './components/ReviewsSection'
import CourtAndFieldTypeSelector from './components/CourtAndFieldTypeSelector'
import TimeSlotSelector from './components/TimeSlotSelector'
import ServiceSelector from './components/ServiceSelector'
import BookingSummary from './components/BookingSummary'
import CalendarModal from './modals/CalendarModal'
import BookingModal from './modals/BookingModal'
import { useAuth } from '../../../contexts/AuthContext'
import { useSocket } from '../../../contexts/SocketContext'
import { toast } from 'react-toastify'

// Custom hooks
import { useFacilityData } from './hooks/useFacilityData'
import { useCourtData } from './hooks/useCourtData'
import { useSlotLocking } from './hooks/useSlotLocking'
import { useAutoDeselect } from './hooks/useAutoDeselect'
import { useSlotCleanup } from './hooks/useSlotCleanup'
import { useBookingSubmission } from './hooks/useBookingSubmission'
import { useUnlockOnUnmount } from './hooks/useUnlockOnUnmount'

function Booking() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const venueId = searchParams.get('venue')
  const { user, isAuthenticated } = useAuth()
  const { defaultSocket, isConnected, joinFacility, leaveFacility, joinCourt, leaveCourt } = useSocket()

  // Local UI state
  const [selectedSportCategory, setSelectedSportCategory] = useState(null)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })
  const [selectedSlots, setSelectedSlots] = useState([])
  const [selectedFieldType, setSelectedFieldType] = useState(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [contactInfo, setContactInfo] = useState(null)
  const [timeSlotsData, setTimeSlotsData] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsPage, setReviewsPage] = useState(1)
  const [promotionData, setPromotionData] = useState(null) // { code, promotion, discountAmount }
  const [selectedServices, setSelectedServices] = useState([]) // Array of { serviceId, service, quantity, totalPrice }

  // Custom hooks - tất cả logic phức tạp ở đây
  const {
    venueData,
    loading,
    error,
    reviews,
    reviewsStats,
    reviewsTotal,
    sportCategories,
    timeSlotDuration,
    setVenueData,
    setReviews,
    setReviewsStats,
    setReviewsTotal
  } = useFacilityData(venueId)

  const {
    courts,
    courtTypes,
    selectedCourt,
    setSelectedCourt
  } = useCourtData(venueId, selectedSportCategory, selectedFieldType)

  const {
    lockedSlots,
    bookedSlots,
    setLockedSlots,
    setBookedSlots,
    handleSlotLock: handleSlotLockBase,
    handleSlotUnlock,
    lockedSlotsByMeRef
  } = useSlotLocking(
    venueId,
    selectedCourt,
    selectedDate,
    user,
    defaultSocket,
    isAuthenticated,
    { isConnected, joinFacility, leaveFacility, joinCourt, leaveCourt }
  )

  // Wrapper for handleSlotLock to pass setSelectedSlots
  const handleSlotLock = (timeSlot) => {
    handleSlotLockBase(timeSlot, setSelectedSlots)
  }

  const { slotTimeoutRef } = useAutoDeselect(
    selectedSlots,
    selectedCourt,
    selectedDate,
    timeSlotDuration,
    defaultSocket,
    isAuthenticated,
    setSelectedSlots
  )

  useSlotCleanup(
    selectedCourt,
    selectedDate,
    lockedSlots,
    bookedSlots,
    defaultSocket,
    isAuthenticated,
    setLockedSlots,
    setBookedSlots,
    lockedSlotsByMeRef,
    setSelectedSlots,
    slotTimeoutRef
  )

  useUnlockOnUnmount(defaultSocket, isAuthenticated, lockedSlotsByMeRef, slotTimeoutRef)

  const { handleBookingSubmit, isProcessing } = useBookingSubmission(
    venueData,
    selectedCourt,
    selectedFieldType,
    selectedSlots,
    selectedDate,
    courts,
    timeSlotDuration,
    promotionData,
    contactInfo,
    user,
    venueId,
    setShowBookingModal,
    slotTimeoutRef,
    isAuthenticated,
    timeSlotsData,
    selectedServices
  )

  // Reset field type when sport category changes
  useEffect(() => {
    if (selectedSportCategory) {
      setSelectedFieldType(null)
    }
  }, [selectedSportCategory])

  // Scroll to top when component mounts or venue changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [venueId, venueData])

  // Reset slots when date changes
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate)
    setSelectedSlots([])
  }

  const handleBookNow = () => {
    // Validate all required fields before showing booking modal
    if (!selectedFieldType) {
      toast.error('Vui lòng chọn loại sân')
      return
    }

    if (!selectedCourt) {
      toast.error('Vui lòng chọn sân')
      return
    }

    if (selectedSlots.length === 0) {
      toast.error('Vui lòng chọn khung giờ')
      return
    }

    // All validations passed, show booking modal
    setShowBookingModal(true)
  }

  // Loading state
  if (loading) {
    return (
      <div className="booking-loading">
        <div className="spinner"></div>
        <div className="booking-loading-text">
          Đang tải thông tin cơ sở...
        </div>
      </div>
    )
  }

  // Error state
  if (error || !venueData) {
    return (
      <div className="booking-error">
        <div className="booking-error-text">
          {error || 'Không tìm thấy cơ sở'}
        </div>
        <button
          onClick={() => navigate('/')}
          className="back-home-btn"
        >
          Về trang chủ
        </button>
      </div>
    )
  }

  return (
    <div className="booking-page">
      {/* Gallery Section */}
      <div className="booking-container gallery-section-wrapper">
        <div className="gallery-card">
          <VenueGallery images={venueData.images} />
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="booking-container">
        <div className="booking-layout">
          {/* Left Column - Venue Info */}
          <div className="booking-left-column">
            {/* Venue Details Card */}
            <div className="venue-info-card">
              <VenueInfo venueData={venueData} />
            </div>

            {/* Court and Field Type Selector */}
            <CourtAndFieldTypeSelector
              courts={courts}
              courtTypes={courtTypes}
              sportCategories={sportCategories}
              selectedSportCategory={selectedSportCategory}
              onSportCategoryChange={setSelectedSportCategory}
              selectedCourt={selectedCourt}
              onCourtChange={setSelectedCourt}
              selectedFieldType={selectedFieldType}
              onFieldTypeChange={setSelectedFieldType}
              loading={loading}
            />

            {/* Time Slot Selector */}
            <TimeSlotSelector
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              selectedSlots={selectedSlots}
              onSlotSelect={setSelectedSlots}
              selectedCourt={selectedCourt}
              venuePrice={venueData.pricePerHour}
              onTimeSlotsDataChange={setTimeSlotsData}
              lockedSlots={lockedSlots}
              onSlotLock={handleSlotLock}
              onSlotUnlock={handleSlotUnlock}
              bookedSlots={bookedSlots}
              currentUserId={user?._id}
            />

            {/* Service Selector */}
            <ServiceSelector
              facilityId={venueId}
              selectedSportCategory={selectedSportCategory}
              selectedServices={selectedServices}
              onServicesChange={setSelectedServices}
            />
          </div>

          {/* Right Column - Booking Summary */}
          <div className="booking-right-column">
            <BookingSummary
              selectedDate={selectedDate}
              selectedSlots={selectedSlots}
              selectedCourt={selectedCourt}
              selectedFieldType={selectedFieldType}
              courts={courts}
              timeSlotsData={timeSlotsData}
              onBookNow={handleBookNow}
              venueId={venueId}
              timeSlotDuration={timeSlotDuration}
              onPromotionChange={setPromotionData}
              selectedServices={selectedServices}
            />
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="booking-container map-section">
        <div className="section-card">
          <h3 className="section-title">
            Vị trí sân
          </h3>
          <MapDisplay venueData={venueData} />
        </div>
      </div>

      {/* Reviews Section */}
      <div className="booking-container reviews-section">
        <div className="section-card">
          <ReviewsSection
            reviews={reviews}
            venueRating={reviewsStats.averageRating || venueData.rating || 0}
            totalReviews={reviewsStats.totalReviews || 0}
            loading={reviewsLoading}
            facilityId={venueId}
            onPageChange={setReviewsPage}
            onRatingFilterChange={(rating) => {
              // Will be handled by ReviewsSection component
            }}
          />
        </div>
      </div>

      {/* Modals */}
      {showCalendar && (
        <CalendarModal
          selectedDate={selectedDate}
          onDateSelect={handleDateChange}
          onClose={() => setShowCalendar(false)}
        />
      )}
      {showBookingModal && (
        <BookingModal
          selectedDate={selectedDate}
          selectedSlots={selectedSlots}
          selectedCourt={selectedCourt}
          selectedFieldType={selectedFieldType}
          venueData={venueData}
          courts={courts}
          promotionData={promotionData}
          onClose={() => {
            setShowBookingModal(false)
            setContactInfo(null)
          }}
          onSubmit={(contactInfoData) => {
            setContactInfo(contactInfoData)
            handleBookingSubmit()
          }}
          timeSlotsData={timeSlotsData}
        />
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="processing-overlay">
          <div className="spinner"></div>
          <div className="processing-text">
            Đang chuyển đến trang thanh toán...
          </div>
        </div>
      )}
    </div>
  )
}
export default Booking


// Custom hook to handle booking submission
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { bookingApi } from '../../../../api/bookingApi';
import { formatDateToYYYYMMDD } from '../utils/dateHelpers';
import { formatTimeSlots } from '../utils/timeSlotHelpers';
import { calculateTotalAmount } from '../utils/priceHelpers';

/**
 * Custom hook to handle booking submission
 * @param {Object} venueData - Venue data
 * @param {string} selectedCourt - Selected court ID
 * @param {string} selectedFieldType - Selected field type
 * @param {Array} selectedSlots - Array of selected slot keys
 * @param {Date} selectedDate - Selected date
 * @param {Array} courts - Array of court objects
 * @param {number} timeSlotDuration - Time slot duration in minutes
 * @param {Object} promotionData - Promotion data
 * @param {Object} contactInfo - Contact information
 * @param {Object} user - Current user object
 * @param {string} venueId - Facility ID
 * @param {Function} setShowBookingModal - State setter for booking modal
 * @param {Object} slotTimeoutRef - Ref for timeout
 * @param {Array} timeSlotsData - Time slots data
 * @param {Array} selectedServices - Selected services array
 * @returns {Object} { handleBookingSubmit, isProcessing }
 */
export const useBookingSubmission = (
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
  timeSlotsData = [],
  selectedServices = []
) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBookingSubmit = async () => {
    // Validate all required fields
    if (!venueData) {
      toast.error('Không tìm thấy thông tin cơ sở');
      return;
    }
    
    if (!selectedFieldType) {
      toast.error('Vui lòng chọn loại sân');
      return;
    }
    
    if (!selectedCourt) {
      toast.error('Vui lòng chọn sân');
      return;
    }
    
    if (selectedSlots.length === 0) {
      toast.error('Vui lòng chọn khung giờ');
      return;
    }

    // Check authentication
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đặt sân');
      navigate('/login');
      return;
    }

    // Clear timeout when user confirms booking
    if (slotTimeoutRef?.current) {
      clearTimeout(slotTimeoutRef.current);
      slotTimeoutRef.current = null;
    }

    setIsProcessing(true);
    setShowBookingModal(false);

    try {
      // Get court data
      const selectedCourtData = courts.find(c => (c.id || c._id) === selectedCourt);
      if (!selectedCourtData) {
        toast.error('Không tìm thấy thông tin sân');
        setIsProcessing(false);
        return;
      }

      const formattedTimeSlots = formatTimeSlots(selectedSlots, timeSlotDuration);

      // Calculate services total
      const servicesTotal = selectedServices.reduce((sum, item) => {
        return sum + (item.totalPrice || 0)
      }, 0)

      // Prepare booking data for API
      const courtSubtotal = calculateTotalAmount(selectedCourt, selectedSlots, courts, venueData);
      const subtotal = courtSubtotal + servicesTotal; // Include services in subtotal
      const discount = promotionData?.discountAmount || 0;
      const finalTotal = Math.max(0, subtotal - discount);

      // Format services for API
      const services = selectedServices.map(item => ({
        serviceId: item.serviceId,
        quantity: item.quantity,
        price: item.service?.price || 0
      }))

      const bookingPayload = {
        courtId: selectedCourt,
        facilityId: venueId,
        date: formatDateToYYYYMMDD(selectedDate), // Format: YYYY-MM-DD in local timezone
        timeSlots: formattedTimeSlots,
        contactInfo: contactInfo || {
          name: user?.name || '',
          phone: user?.phone || '',
          email: user?.email || '',
          notes: ''
        },
        totalAmount: subtotal, // Subtotal before discount (includes services)
        promotionCode: promotionData?.code || null,
        discountAmount: discount,
        services: services.length > 0 ? services : undefined // Include services if any
      };

      // Create booking via API
      const result = await bookingApi.createBooking(bookingPayload);

      if (result.success) {
        // API returns { booking: {...}, paymentPending: true }
        const booking = result.data?.booking || result.data;
        const courtName = selectedCourtData.name;

        // Get bookingId
        const bookingId = booking?._id || booking?.id;
        
        if (!bookingId) {
          toast.error('Không thể lấy ID booking. Vui lòng thử lại.');
          setIsProcessing(false);
          return;
        }
    
        // Prepare booking data to pass to payment page
        const bookingInfo = {
          bookingId: bookingId,
          venueId: venueData.id,
          venueName: venueData.name,
          sport: venueData.sport,
          courtId: selectedCourt,
          courtNumber: courtName,
          fieldType: selectedFieldType,
          date: selectedDate.toLocaleDateString('vi-VN'),
          time: formattedTimeSlots.join(', '),
          duration: selectedSlots.length,
          pricePerHour: selectedCourtData.price || venueData.pricePerHour,
          courtSubtotal: courtSubtotal,
          servicesTotal: servicesTotal,
          subtotal: subtotal,
          serviceFee: 0,
          discount: promotionData?.discountAmount || 0,
          promotionCode: promotionData?.code || null,
          promotion: promotionData?.promotion || null,
          total: finalTotal,
          selectedSlots: selectedSlots,
          timeSlotsData: timeSlotsData,
          selectedServices: selectedServices,
          venueData: venueData,
          booking: booking
        };

        // Save pending booking to localStorage for recovery if user leaves payment page
        const pendingBookingKey = `pending_booking_${bookingId}`;
        const pendingBookingData = {
          bookingId: bookingId,
          bookingInfo: bookingInfo,
          createdAt: Date.now(),
          expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
        };
        localStorage.setItem(pendingBookingKey, JSON.stringify(pendingBookingData));

        toast.success('Đặt sân thành công! Đang chuyển đến trang thanh toán...');

        // Navigate to payment with booking data
        navigate('/payment', { 
          state: { bookingData: bookingInfo } 
        });
      } else {
        throw new Error(result.message || 'Có lỗi xảy ra khi đặt sân');
      }
    } catch (error) {
      const errorMessage = error.message || 'Có lỗi xảy ra khi đặt sân. Vui lòng thử lại.';
      toast.error(errorMessage);
      setIsProcessing(false);
      setShowBookingModal(true); // Reopen modal on error
    }
  };

  return {
    handleBookingSubmit,
    isProcessing
  };
};


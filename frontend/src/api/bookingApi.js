import { api, handleApiError, handleApiSuccess } from './axiosClient';

export const bookingApi = {
  /**
   * Tạo booking mới
   * @param {Object} bookingData - Dữ liệu booking
   * @param {string} bookingData.courtId - ID của sân
   * @param {string} bookingData.facilityId - ID của cơ sở
   * @param {string} bookingData.date - Ngày đặt (ISO string hoặc Date)
   * @param {Array<string>} bookingData.timeSlots - Mảng các khung giờ (format: "HH:MM-HH:MM")
   * @param {Object} bookingData.contactInfo - Thông tin liên hệ
   * @param {string} bookingData.contactInfo.name - Tên người đặt
   * @param {string} bookingData.contactInfo.phone - Số điện thoại
   * @param {string} [bookingData.contactInfo.email] - Email (optional)
   * @param {string} [bookingData.contactInfo.notes] - Ghi chú (optional)
   * @param {number} [bookingData.totalAmount] - Tổng tiền (optional, sẽ tính tự động nếu không có)
   */
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/bookings', bookingData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lấy danh sách bookings của user hiện tại
   * @param {Object} params - Query parameters
   * @param {number} [params.page] - Số trang
   * @param {number} [params.limit] - Số lượng mỗi trang
   * @param {string} [params.status] - Filter theo status
   */
  getMyBookings: async (params = {}) => {
    try {
      const response = await api.get('/bookings/my-bookings', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lấy chi tiết booking theo ID
   * @param {string} bookingId - ID của booking
   */
  getBookingById: async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lấy danh sách slots và tính khả dụng của sân
   * @param {string} courtId - ID của sân
   * @param {string} date - Ngày kiểm tra (ISO string hoặc Date, format: YYYY-MM-DD)
   * @param {string} [timeStart] - Giờ bắt đầu (optional, default: "06:00")
   * @param {string} [timeEnd] - Giờ kết thúc (optional, default: "22:00")
   */
  getAvailability: async (courtId, date, timeStart, timeEnd) => {
    try {
      const params = { courtId, date };
      if (timeStart) params.timeStart = timeStart;
      if (timeEnd) params.timeEnd = timeEnd;
      
      const response = await api.get('/bookings/availability', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Kiểm tra tính khả dụng của các time slots cụ thể
   * @param {string} courtId - ID của sân
   * @param {string} date - Ngày kiểm tra (ISO string hoặc Date)
   * @param {Array<string>} timeSlots - Mảng các khung giờ cần kiểm tra (format: "HH:MM-HH:MM")
   */
  checkAvailability: async (courtId, date, timeSlots) => {
    try {
      // First get all availability
      const availabilityResult = await bookingApi.getAvailability(courtId, date);
      if (!availabilityResult.success) {
        throw new Error(availabilityResult.message || 'Không thể kiểm tra tính khả dụng');
      }

      // Check if all requested time slots are available
      const slots = availabilityResult.data?.slots || [];
      const allAvailable = timeSlots.every(requestedSlot => {
        const slot = slots.find(s => s.slot === requestedSlot);
        return slot && slot.available;
      });

      return {
        success: true,
        data: {
          available: allAvailable,
          slots: slots.filter(s => timeSlots.includes(s.slot))
        }
      };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Hủy booking
   * @param {string} bookingId - ID của booking
   * @param {string} reason - Lý do hủy (optional)
   */
  cancelBooking: async (bookingId, reason) => {
    try {
      const response = await api.patch(`/bookings/${bookingId}/cancel`, { reason });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lấy danh sách bookings của facility (cho owner)
   * @param {string} facilityId - ID của facility
   * @param {Object} params - Query parameters (page, limit, status, date, search)
   */
  getFacilityBookings: async (facilityId, params = {}) => {
    try {
      const response = await api.get(`/bookings/facility/${facilityId}`, { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Cập nhật trạng thái booking (cho owner)
   * @param {string} bookingId - ID của booking
   * @param {string} status - Trạng thái mới ('pending', 'confirmed', 'cancelled', 'completed')
   * @param {string} [notes] - Ghi chú (optional)
   */
  updateBookingStatus: async (bookingId, status, notes) => {
    try {
      const response = await api.patch(`/bookings/${bookingId}/status`, { status, notes });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Cập nhật phương thức thanh toán cho booking
   * @param {string} bookingId - ID của booking
   * @param {string} paymentMethod - Phương thức thanh toán ('momo', 'vnpay', 'cash')
   */
  updatePaymentMethod: async (bookingId, paymentMethod) => {
    try {
      const response = await api.patch(`/bookings/${bookingId}/payment-method`, { paymentMethod });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Lấy tất cả bookings (chỉ admin)
   * @param {Object} params - Query parameters (page, limit, status, paymentStatus, date, startDate, endDate, facilityId, search)
   */
  getAllBookings: async (params = {}) => {
    try {
      const response = await api.get('/bookings/admin/all', { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Tạo walk-in booking (chỉ owner/admin)
   * @param {Object} bookingData - Dữ liệu booking
   * @param {string} bookingData.courtId - ID của sân
   * @param {string} bookingData.facilityId - ID của cơ sở
   * @param {string} bookingData.date - Ngày đặt (ISO string hoặc Date)
   * @param {Array<string>} bookingData.timeSlots - Mảng các khung giờ (format: "HH:MM-HH:MM")
   * @param {Object} bookingData.contactInfo - Thông tin liên hệ khách hàng
   * @param {string} bookingData.contactInfo.name - Tên khách hàng (required)
   * @param {string} [bookingData.contactInfo.phone] - Số điện thoại (optional)
   * @param {string} [bookingData.contactInfo.email] - Email (optional)
   * @param {string} [bookingData.contactInfo.notes] - Ghi chú (optional)
   * @param {number} [bookingData.totalAmount] - Tổng tiền (optional, sẽ tính tự động nếu không có)
   * @param {string} [bookingData.promotionCode] - Mã khuyến mãi (optional)
   * @param {number} [bookingData.discountAmount] - Số tiền giảm giá (optional)
   */
  createWalkInBooking: async (bookingData) => {
    try {
      const response = await api.post('/bookings/walk-in', bookingData);
      return handleApiSuccess(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};


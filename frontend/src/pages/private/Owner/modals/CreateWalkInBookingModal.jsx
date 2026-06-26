import React, { useState, useEffect, useRef } from "react";
import { X, Calendar, Clock, User, Plus } from "lucide-react";
import { bookingApi } from "../../../../api/bookingApi";
import { courtApi } from "../../../../api/courtApi";
import { toast } from "react-toastify";
import useClickOutside from "../../../../hook/use-click-outside";
import useBodyScrollLock from "../../../../hook/use-body-scroll-lock";
import useEscapeKey from "../../../../hook/use-escape-key";
import { useSocket } from "../../../../contexts/SocketContext";
import { useAuth } from "../../../../contexts/AuthContext";

const CreateWalkInBookingModal = ({ isOpen, onClose, facilityId, onSuccess }) => {
  useBodyScrollLock(isOpen);
  useEscapeKey(onClose, isOpen);
  const modalRef = useClickOutside(onClose, isOpen);
  
  const { defaultSocket, isConnected, joinFacility, leaveFacility } = useSocket();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [courts, setCourts] = useState([]);
  const [loadingCourts, setLoadingCourts] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Real-time state: track locked and booked slots
  const [lockedSlots, setLockedSlots] = useState({}); // key: "courtId_date_timeSlot"
  const [bookedSlots, setBookedSlots] = useState(new Set()); // Set of "courtId_date_timeSlot"
  const originalSlotsRef = useRef([]); // Store original slots from API

  // Booking type: 'fixed' (theo khung giờ cố định) hoặc 'flexible' (thời gian linh hoạt)
  const [bookingType, setBookingType] = useState('fixed');
  
  // Form state
  const [formData, setFormData] = useState({
    courtId: "",
    date: "",
    selectedTimeSlots: [],
    // Flexible booking fields
    startTimeHour: "",
    startTimeMinute: "",
    duration: "", // Duration in minutes
    contactInfo: {
      name: "",
    },
    totalAmount: 0,
    promotionCode: "",
    discountAmount: 0,
  });

  // Fetch courts when facility changes
  useEffect(() => {
    if (isOpen && facilityId) {
      fetchCourts();
    }
  }, [isOpen, facilityId]);

  // Join facility room when modal opens
  useEffect(() => {
    if (isOpen && facilityId && isConnected && defaultSocket) {
      joinFacility(facilityId, 'default');
      
      return () => {
        leaveFacility(facilityId, 'default');
      };
    }
  }, [isOpen, facilityId, isConnected, defaultSocket, joinFacility, leaveFacility]);

  // Listen to socket events for real-time updates
  useEffect(() => {
    if (!isOpen || !defaultSocket || !isConnected || !formData.courtId || !formData.date) {
      return;
    }

    // Generate lock key helper
    const generateLockKey = (courtId, date, timeSlot) => {
      const dateStr = typeof date === 'string' ? date : date.split('T')[0];
      return `${courtId}_${dateStr}_${timeSlot}`;
    };

    // Handle slot locked event
    const handleSlotLocked = (data) => {
      const { courtId, date, timeSlot } = data;
      
      // Only care about slots for the selected court and date
      if (courtId !== formData.courtId) return;
      
      const dateStr = typeof date === 'string' ? date : date.split('T')[0];
      if (dateStr !== formData.date) return;
      
      const lockKey = generateLockKey(courtId, dateStr, timeSlot);
      setLockedSlots(prev => ({
        ...prev,
        [lockKey]: { ...data, isLocked: true }
      }));
      
      // Update available slots immediately
      setAvailableSlots(prev => prev.map(slot => {
        if (slot.slot === timeSlot) {
          return { ...slot, available: false, isLocked: true };
        }
        return slot;
      }));
    };

    // Handle slot unlocked event
    const handleSlotUnlocked = (data) => {
      const { courtId, date, timeSlot } = data;
      
      if (courtId !== formData.courtId) return;
      
      const dateStr = typeof date === 'string' ? date : date.split('T')[0];
      if (dateStr !== formData.date) return;
      
      const lockKey = generateLockKey(courtId, dateStr, timeSlot);
      setLockedSlots(prev => {
        const newState = { ...prev };
        delete newState[lockKey];
        return newState;
      });
      
      // Check if slot is still booked, if not, mark as available
      const bookedKey = generateLockKey(courtId, dateStr, timeSlot);
      if (!bookedSlots.has(bookedKey)) {
        // Check original availability from API
        const originalSlot = originalSlotsRef.current.find(s => s.slot === timeSlot);
        const shouldBeAvailable = originalSlot ? originalSlot.available : true;
        
        setAvailableSlots(prev => prev.map(slot => {
          if (slot.slot === timeSlot) {
            return { ...slot, available: shouldBeAvailable, isLocked: false };
          }
          return slot;
        }));
      }
    };

    // Handle slot booked event
    const handleSlotBooked = (data) => {
      const { courtId, date, timeSlots } = data;
      
      if (courtId !== formData.courtId) return;
      
      const dateStr = typeof date === 'string' ? date : date.split('T')[0];
      if (dateStr !== formData.date) return;
      
      // Mark all time slots as booked
      timeSlots.forEach(timeSlot => {
        const bookedKey = generateLockKey(courtId, dateStr, timeSlot);
        setBookedSlots(prev => new Set([...prev, bookedKey]));
        
        // Remove from locked slots if present
        setLockedSlots(prev => {
          const newState = { ...prev };
          delete newState[bookedKey];
          return newState;
        });
        
        // Update available slots immediately
        setAvailableSlots(prev => prev.map(slot => {
          if (slot.slot === timeSlot) {
            return { ...slot, available: false, isBooked: true, isLocked: false };
          }
          return slot;
        }));
      });
    };

    // Handle slot cancelled event
    const handleSlotCancelled = (data) => {
      const { courtId, date, timeSlots } = data;
      
      if (courtId !== formData.courtId) return;
      
      const dateStr = typeof date === 'string' ? date : date.split('T')[0];
      if (dateStr !== formData.date) return;
      
      // Remove from booked slots
      timeSlots.forEach(timeSlot => {
        const bookedKey = generateLockKey(courtId, dateStr, timeSlot);
        setBookedSlots(prev => {
          const newSet = new Set(prev);
          newSet.delete(bookedKey);
          return newSet;
        });
        
        // Check if slot is locked, if not, restore original availability
        const lockKey = generateLockKey(courtId, dateStr, timeSlot);
        const isStillLocked = lockedSlots[lockKey];
        
        // Check original availability from API
        const originalSlot = originalSlotsRef.current.find(s => s.slot === timeSlot);
        const shouldBeAvailable = originalSlot ? originalSlot.available : true;
        
        if (!isStillLocked) {
          setAvailableSlots(prev => prev.map(slot => {
            if (slot.slot === timeSlot) {
              return { ...slot, available: shouldBeAvailable, isBooked: false };
            }
            return slot;
          }));
        }
      });
    };


    // Register event listeners
    defaultSocket.on('booking:slot:locked', handleSlotLocked);
    defaultSocket.on('booking:slot:unlocked', handleSlotUnlocked);
    defaultSocket.on('booking:slot:booked', handleSlotBooked);
    defaultSocket.on('booking:slot:cancelled', handleSlotCancelled);

    // Cleanup
    return () => {
      defaultSocket.off('booking:slot:locked', handleSlotLocked);
      defaultSocket.off('booking:slot:unlocked', handleSlotUnlocked);
      defaultSocket.off('booking:slot:booked', handleSlotBooked);
      defaultSocket.off('booking:slot:cancelled', handleSlotCancelled);
    };
  }, [isOpen, defaultSocket, isConnected, formData.courtId, formData.date, bookedSlots, lockedSlots]);

  // Fetch available slots when court and date change
  useEffect(() => {
    if (isOpen && formData.courtId && formData.date) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
      setLockedSlots({});
      setBookedSlots(new Set());
      originalSlotsRef.current = [];
      setFormData((prev) => ({ ...prev, selectedTimeSlots: [] }));
    }
  }, [isOpen, formData.courtId, formData.date]);

  const fetchCourts = async () => {
    if (!facilityId) return;
    
    setLoadingCourts(true);
    try {
      const result = await courtApi.getCourts({ facility: facilityId, status: "active" });
      if (result.success) {
        setCourts(result.data?.courts || []);
      } else {
        toast.error("Không thể tải danh sách sân");
      }
    } catch (error) {
      console.error("Error fetching courts:", error);
      toast.error("Không thể tải danh sách sân");
    } finally {
      setLoadingCourts(false);
    }
  };

  // Helper function to check if a time slot is in the past
  const isTimeSlotInPast = (timeSlot, selectedDate) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Parse selected date (YYYY-MM-DD format)
    const [year, month, day] = selectedDate.split('-').map(Number);
    const selectedDateOnly = new Date(year, month - 1, day);
    
    // If selected date is in the future, no slots are past
    if (selectedDateOnly > today) return false;
    
    // If selected date is in the past, all slots are past
    if (selectedDateOnly < today) return true;
    
    // If selected date is today, check if time slot start time is in the past
    // Parse time slot format: "HH:MM-HH:MM"
    const [startTime] = timeSlot.split('-');
    const [hours, minutes] = startTime.split(':').map(Number);
    const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    
    return slotTime < now;
  };

  const fetchAvailableSlots = async () => {
    if (!formData.courtId || !formData.date) return;

    setLoadingSlots(true);
    try {
      const result = await bookingApi.getAvailability(
        formData.courtId,
        formData.date
      );
      if (result.success) {
        const slots = result.data?.slots || [];
        
        // Store original slots
        originalSlotsRef.current = slots;
        
        // Apply real-time locked/booked status and check if past slots
        const dateStr = formData.date;
        const updatedSlots = slots.map(slot => {
          const lockKey = `${formData.courtId}_${dateStr}_${slot.slot}`;
          const isLocked = lockedSlots[lockKey];
          const isBooked = bookedSlots.has(lockKey);
          const isPast = isTimeSlotInPast(slot.slot, dateStr);
          
          return {
            ...slot,
            available: isPast ? false : (isBooked ? false : (isLocked ? false : slot.available)),
            isLocked: !!isLocked,
            isBooked: isBooked,
            isPast: isPast
          };
        });
        
        setAvailableSlots(updatedSlots);
      } else {
        toast.error("Không thể tải khung giờ");
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      toast.error("Không thể tải khung giờ");
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("contactInfo.")) {
      const field = name.replace("contactInfo.", "");
      setFormData((prev) => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSlotToggle = (slot) => {
    if (!slot.available || slot.isPast || slot.isBooked || slot.isLocked) return;

    setFormData((prev) => {
      const isSelected = prev.selectedTimeSlots.includes(slot.slot);
      let newSelectedSlots;
      
      if (isSelected) {
        newSelectedSlots = prev.selectedTimeSlots.filter((s) => s !== slot.slot);
      } else {
        newSelectedSlots = [...prev.selectedTimeSlots, slot.slot];
      }

      // Calculate total amount
      const selectedCourt = courts.find((c) => c._id === prev.courtId || c.id === prev.courtId);
      const pricePerHour = selectedCourt?.price || 0;
      const newTotalAmount = newSelectedSlots.length * pricePerHour - prev.discountAmount;

      return {
        ...prev,
        selectedTimeSlots: newSelectedSlots,
        totalAmount: Math.max(0, newTotalAmount),
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.courtId) {
      toast.error("Vui lòng chọn sân");
      return;
    }

    if (!formData.date) {
      toast.error("Vui lòng chọn ngày");
      return;
    }

    if (bookingType === 'fixed') {
      if (formData.selectedTimeSlots.length === 0) {
        toast.error("Vui lòng chọn ít nhất 1 khung giờ");
        return;
      }
    } else {
      // Flexible booking validation
      if (!formData.startTimeHour || formData.startTimeHour === "") {
        toast.error("Vui lòng chọn giờ bắt đầu");
        return;
      }
      if (formData.startTimeMinute === "" || formData.startTimeMinute === null) {
        toast.error("Vui lòng chọn phút bắt đầu");
        return;
      }
      if (!formData.duration || parseInt(formData.duration) <= 0) {
        toast.error("Vui lòng nhập thời lượng (phút)");
        return;
      }
    }

    if (!formData.contactInfo.name.trim()) {
      toast.error("Vui lòng nhập tên khách hàng");
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        courtId: formData.courtId,
        facilityId: facilityId,
        date: formData.date,
        contactInfo: {
          name: formData.contactInfo.name.trim(),
        },
        totalAmount: formData.totalAmount,
        ...(formData.promotionCode && { promotionCode: formData.promotionCode }),
        ...(formData.discountAmount > 0 && { discountAmount: formData.discountAmount }),
      };

      // Add booking type specific data
      if (bookingType === 'fixed') {
        bookingData.timeSlots = formData.selectedTimeSlots;
      } else {
        // Flexible booking
        bookingData.startTimeHour = parseInt(formData.startTimeHour);
        bookingData.startTimeMinute = parseInt(formData.startTimeMinute);
        bookingData.duration = parseInt(formData.duration);
      }

      const result = await bookingApi.createWalkInBooking(bookingData);

      if (result.success) {
        toast.success("Tạo đặt sân trực tiếp thành công!");
        
        // Reset form
        setBookingType('fixed');
        setFormData({
          courtId: "",
          date: "",
          selectedTimeSlots: [],
          startTimeHour: "",
          startTimeMinute: "",
          duration: "",
          contactInfo: {
            name: "",
          },
          totalAmount: 0,
          promotionCode: "",
          discountAmount: 0,
        });
        setAvailableSlots([]);

        if (onSuccess) {
          await onSuccess(result.data?.booking);
        }
        if (onClose) onClose();
      } else {
        toast.error(result.message || "Không thể tạo đặt sân");
      }
    } catch (error) {
      console.error("Error creating walk-in booking:", error);
      toast.error(error.message || "Không thể tạo đặt sân");
    } finally {
      setLoading(false);
    }
  };

  // Get selected court price
  const selectedCourt = courts.find((c) => c._id === formData.courtId || c.id === formData.courtId);
  const pricePerHour = selectedCourt?.price || 0;
  
  // Calculate subtotal based on booking type
  let subtotal = 0;
  if (bookingType === 'fixed') {
    subtotal = formData.selectedTimeSlots.length * pricePerHour;
  } else {
    // Flexible booking: tính theo giờ (làm tròn lên)
    const durationMinutes = parseInt(formData.duration) || 0;
    const hours = Math.ceil(durationMinutes / 60);
    subtotal = hours * pricePerHour;
  }
  
  const total = Math.max(0, subtotal - formData.discountAmount);
  
  // Update totalAmount when subtotal or discount changes
  useEffect(() => {
    const newTotal = Math.max(0, subtotal - formData.discountAmount);
    if (formData.totalAmount !== newTotal) {
      setFormData(prev => ({ ...prev, totalAmount: newTotal }));
    }
  }, [subtotal, formData.discountAmount, bookingType, formData.selectedTimeSlots.length, formData.duration]);

  // Format date for input (YYYY-MM-DD)
  const today = new Date().toISOString().split("T")[0];

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: "700px",
          maxHeight: "90vh",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "24px",
            borderBottom: "1px solid #e5e7eb",
            position: "sticky",
            top: 0,
            background: "#fff",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#dbeafe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus size={20} color="#2563eb" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#111827" }}>
              Đặt sân trực tiếp (Walk-in)
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#6b7280",
              padding: "4px",
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: "24px", flex: 1, overflow: "auto" }}>
          {/* Court Selection */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
              Chọn sân <span style={{ color: "#ef4444" }}>*</span>
            </label>
            {loadingCourts ? (
              <div style={{ padding: "12px", textAlign: "center", color: "#6b7280" }}>
                Đang tải danh sách sân...
              </div>
            ) : (
              <select
                name="courtId"
                value={formData.courtId}
                onChange={handleInputChange}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "2px solid #e5e7eb",
                  fontSize: 14,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">-- Chọn sân --</option>
                {courts.map((court) => (
                  <option key={court._id || court.id} value={court._id || court.id}>
                    {court.name} - {court.price?.toLocaleString()} VNĐ/giờ
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date Selection */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
              <Calendar size={16} />
              Ngày đặt <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              min={today}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "2px solid #e5e7eb",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          {/* Booking Type Selection */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
              Loại đặt sân <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: 12 }}>
              <label
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 8,
                  border: `2px solid ${bookingType === 'fixed' ? '#2563eb' : '#e5e7eb'}`,
                  background: bookingType === 'fixed' ? '#dbeafe' : '#fff',
                  cursor: "pointer",
                  textAlign: "center",
                  fontSize: 14,
                  fontWeight: bookingType === 'fixed' ? 600 : 400,
                  color: bookingType === 'fixed' ? '#2563eb' : '#374151',
                }}
              >
                <input
                  type="radio"
                  name="bookingType"
                  value="fixed"
                  checked={bookingType === 'fixed'}
                  onChange={(e) => {
                    setBookingType(e.target.value);
                    setFormData(prev => ({ ...prev, selectedTimeSlots: [] }));
                  }}
                  style={{ marginRight: 8, cursor: "pointer" }}
                />
                Khung giờ cố định
              </label>
              <label
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 8,
                  border: `2px solid ${bookingType === 'flexible' ? '#2563eb' : '#e5e7eb'}`,
                  background: bookingType === 'flexible' ? '#dbeafe' : '#fff',
                  cursor: "pointer",
                  textAlign: "center",
                  fontSize: 14,
                  fontWeight: bookingType === 'flexible' ? 600 : 400,
                  color: bookingType === 'flexible' ? '#2563eb' : '#374151',
                }}
              >
                <input
                  type="radio"
                  name="bookingType"
                  value="flexible"
                  checked={bookingType === 'flexible'}
                  onChange={(e) => {
                    setBookingType(e.target.value);
                    setFormData(prev => ({ ...prev, selectedTimeSlots: [] }));
                  }}
                  style={{ marginRight: 8, cursor: "pointer" }}
                />
                Thời gian linh hoạt
              </label>
            </div>
          </div>

          {/* Time Slots Selection (Fixed) */}
          {bookingType === 'fixed' && formData.courtId && formData.date && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                <Clock size={16} />
                Khung giờ <span style={{ color: "#ef4444" }}>*</span>
              </label>
              {loadingSlots ? (
                <div style={{ padding: "12px", textAlign: "center", color: "#6b7280" }}>
                  Đang tải khung giờ...
                </div>
              ) : availableSlots.length === 0 ? (
                <div style={{ padding: "12px", textAlign: "center", color: "#6b7280", background: "#f9fafb", borderRadius: 8 }}>
                  Không có khung giờ khả dụng
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: 8,
                    maxHeight: "200px",
                    overflow: "auto",
                    padding: "8px",
                    border: "2px solid #e5e7eb",
                    borderRadius: 8,
                  }}
                >
                  {availableSlots.map((slot) => {
                    const isSelected = formData.selectedTimeSlots.includes(slot.slot);
                    const isAvailable = slot.available;
                    const isLocked = slot.isLocked;
                    const isBooked = slot.isBooked;
                    const isPast = slot.isPast;

                    // Determine status and styling
                    let borderColor = "#e5e7eb";
                    let backgroundColor = "#fff";
                    let color = "#111827";
                    let cursor = "pointer";
                    let title = "";

                    if (isPast) {
                      borderColor = "#d1d5db";
                      backgroundColor = "#f3f4f6";
                      color = "#9ca3af";
                      cursor = "not-allowed";
                      title = "Đã qua thời gian";
                    } else if (isSelected) {
                      borderColor = "#2563eb";
                      backgroundColor = "#dbeafe";
                      color = "#111827";
                    } else if (isBooked) {
                      borderColor = "#fca5a5";
                      backgroundColor = "#fee2e2";
                      color = "#991b1b";
                      cursor = "not-allowed";
                      title = "Đã được đặt";
                    } else if (isLocked) {
                      borderColor = "#fbbf24";
                      backgroundColor = "#fef3c7";
                      color = "#92400e";
                      cursor = "not-allowed";
                      title = "Đang được giữ chỗ";
                    } else if (!isAvailable) {
                      borderColor = "#f3f4f6";
                      backgroundColor = "#f9fafb";
                      color = "#9ca3af";
                      cursor = "not-allowed";
                      title = "Không khả dụng";
                    }

                    return (
                       <button
                         key={slot.slot}
                         type="button"
                         onClick={() => handleSlotToggle(slot)}
                         disabled={!isAvailable || isBooked || isLocked || isPast}
                         title={title || (isSelected ? "Đã chọn" : "Chọn khung giờ này")}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 8,
                          border: `2px solid ${borderColor}`,
                          background: backgroundColor,
                          color: color,
                          fontSize: 13,
                          fontWeight: isSelected ? 600 : 400,
                          cursor: cursor,
                          transition: "all 0.2s",
                          position: "relative",
                        }}
                      >
                        {slot.slot}
                        {isLocked && (
                          <span
                            style={{
                              position: "absolute",
                              top: 2,
                              right: 2,
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "#f59e0b",
                              border: "1px solid #fff",
                            }}
                            title="Đang được giữ chỗ"
                          />
                        )}
                        {isBooked && (
                          <span
                            style={{
                              position: "absolute",
                              top: 2,
                              right: 2,
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "#ef4444",
                              border: "1px solid #fff",
                            }}
                            title="Đã được đặt"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Flexible Booking Input */}
          {bookingType === 'flexible' && formData.courtId && formData.date && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                <Clock size={16} />
                Thời gian đặt sân <span style={{ color: "#ef4444" }}>*</span>
              </label>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {/* Start Hour */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#6b7280", marginBottom: 4 }}>
                    Giờ bắt đầu
                  </label>
                  <select
                    name="startTimeHour"
                    value={formData.startTimeHour}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "2px solid #e5e7eb",
                      fontSize: 14,
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">--</option>
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {String(i).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Minute */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#6b7280", marginBottom: 4 }}>
                    Phút bắt đầu
                  </label>
                  <select
                    name="startTimeMinute"
                    value={formData.startTimeMinute}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "2px solid #e5e7eb",
                      fontSize: 14,
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">--</option>
                    <option value="0">00</option>
                    <option value="15">15</option>
                    <option value="30">30</option>
                    <option value="45">45</option>
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#6b7280", marginBottom: 4 }}>
                    Thời lượng (phút)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                    min="15"
                    step="15"
                    placeholder="60"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "2px solid #e5e7eb",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Display end time */}
              {formData.startTimeHour !== "" && formData.startTimeMinute !== "" && formData.duration && (
                <div style={{ marginTop: 12, padding: "10px", background: "#f0f9ff", borderRadius: 8, fontSize: 13, color: "#0369a1" }}>
                  <strong>Thời gian kết thúc dự kiến:</strong>{" "}
                  {(() => {
                    const startHour = parseInt(formData.startTimeHour);
                    const startMin = parseInt(formData.startTimeMinute);
                    const durationMins = parseInt(formData.duration);
                    const totalStartMins = startHour * 60 + startMin;
                    const totalEndMins = totalStartMins + durationMins;
                    const endHour = Math.floor(totalEndMins / 60);
                    const endMin = totalEndMins % 60;
                    return `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Customer Info */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <User size={16} />
              Thông tin khách hàng
            </h4>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                Tên khách hàng <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                name="contactInfo.name"
                value={formData.contactInfo.name}
                onChange={handleInputChange}
                required
                placeholder="Nhập tên khách hàng"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "2px solid #e5e7eb",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>

          </div>

          {/* Summary */}
          {((bookingType === 'fixed' && formData.selectedTimeSlots.length > 0) ||
            (bookingType === 'flexible' && formData.startTimeHour !== "" && formData.startTimeMinute !== "" && formData.duration)) && (
            <div
              style={{
                background: "#f9fafb",
                borderRadius: 8,
                padding: 16,
                marginBottom: 24,
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 12 }}>
                Tóm tắt
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.8 }}>
                {bookingType === 'fixed' ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Số khung giờ:</span>
                      <span>{formData.selectedTimeSlots.length}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Giá/giờ:</span>
                      <span>{pricePerHour.toLocaleString()} VNĐ</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Thời gian bắt đầu:</span>
                      <span>
                        {String(formData.startTimeHour).padStart(2, '0')}:
                        {String(formData.startTimeMinute).padStart(2, '0')}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Thời lượng:</span>
                      <span>{formData.duration} phút ({Math.ceil(parseInt(formData.duration) / 60)} giờ)</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Giá/giờ:</span>
                      <span>{pricePerHour.toLocaleString()} VNĐ</span>
                    </div>
                  </>
                )}
                {formData.discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#059669" }}>
                    <span>Giảm giá:</span>
                    <span>-{formData.discountAmount.toLocaleString()} VNĐ</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, color: "#111827", marginTop: 8, paddingTop: 8, borderTop: "1px solid #e5e7eb" }}>
                  <span>Tổng tiền:</span>
                  <span>{total.toLocaleString()} VNĐ</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              paddingTop: 20,
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: "10px 24px",
                background: "#fff",
                color: "#374151",
                border: "2px solid #e5e7eb",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 24px",
                background: loading ? "#9ca3af" : "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Đang tạo..." : "Tạo đặt sân"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWalkInBookingModal;


import { timeSlotPrices } from '../constants'

export const convertSelectedSlotsToSlots = (selectedSlots, timeSlotsData = null, pricePerHour = null) => {
  if (!selectedSlots || selectedSlots.length === 0) return []
  
  const timeMap = {
    '22:00': '23:00', '21:00': '22:00', '20:00': '21:00',
    '19:00': '20:00', '18:00': '19:00', '17:00': '18:00',
    '16:00': '17:00', '15:00': '16:00', '14:00': '15:00',
    '13:00': '14:00', '12:00': '13:00', '11:00': '12:00',
    '10:00': '11:00', '09:00': '10:00', '08:00': '09:00',
    '07:00': '08:00', '06:00': '07:00'
  }
  
  return selectedSlots.map(slotKey => {
    const parts = slotKey.split('-')
    const time = parts[3] // Get "HH:MM" from slotKey format "YYYY-MM-DD-HH:MM"
    
    // Calculate default end time
    const [hours, minutes] = time.split(':').map(Number)
    const nextHourNum = (hours + 1) % 24
    const defaultNextHour = `${String(nextHourNum).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    
    let nextHour = defaultNextHour
    let price = 0
    
    // Priority 1: Use timeSlotsData from API if available (most accurate)
    if (timeSlotsData && Array.isArray(timeSlotsData) && timeSlotsData.length > 0) {
      const slotData = timeSlotsData.find(s => s.time === time)
      if (slotData && slotData.price) {
        price = slotData.price
        nextHour = slotData.endTime || defaultNextHour
      }
    }
    
    // Priority 2: Use pricePerHour from court if price not found in timeSlotsData
    if (!price || price === 0) {
      if (pricePerHour && pricePerHour > 0) {
        price = pricePerHour
        nextHour = defaultNextHour
      }
    }
    
    // Final fallback: Only use mock data if both timeSlotsData and pricePerHour are unavailable
    // This should not happen in production if data is passed correctly
    if (!price || price === 0) {
      const slotData = timeSlotPrices.find(s => s.time === time)
      price = slotData?.price || 150000
    }
    
    return {
      time: time,
      nextTime: nextHour,
      price: price
    }
  })
}

export const calculateTotals = (slots, rawBookingData) => {
  if (slots.length === 0) {
    return {
      subtotal: rawBookingData.subtotal || 0,
      serviceFee: rawBookingData.serviceFee || 0,
      total: rawBookingData.total || 0
    }
  }
  
  const subtotal = slots.reduce((sum, slot) => sum + slot.price, 0)
  const serviceFee = 0 // Phí dịch vụ mặc định 0 (chưa có API)
  const total = subtotal + serviceFee - (rawBookingData.discount || 0)
  
  return { subtotal, serviceFee, total }
}

export const formatBookingData = (rawBookingData, slots, totals) => {
  return {
    ...rawBookingData,
    slots,
    subtotal: rawBookingData.subtotal && rawBookingData.subtotal > 0 
      ? rawBookingData.subtotal 
      : totals.subtotal,
    serviceFee: 0, // Phí dịch vụ mặc định 0 (chưa có API)
    total: (rawBookingData.subtotal && rawBookingData.subtotal > 0 
      ? rawBookingData.subtotal 
      : totals.subtotal) + 0 - (rawBookingData.discount || 0) // Total = subtotal + serviceFee (0) - discount
  }
}


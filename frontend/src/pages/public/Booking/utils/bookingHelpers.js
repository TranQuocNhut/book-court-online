// Booking helper functions
import { getBookedSlots } from '../mockData'
import { isTimeSlotInPast } from './dateHelpers'

export const getBookingStatus = (courtId, timeSlot) => {
  const bookedSlots = getBookedSlots()
  const isBooked = bookedSlots.some(slot => slot.court === courtId && slot.time === timeSlot)
  return isBooked ? 'booked' : 'available'
}

export const getSlotStatus = (courtId, timeSlot, selectedSlots, selectedDate) => {
  const slotKey = `${courtId}-${timeSlot}`
  const isSelected = selectedSlots.includes(slotKey)
  const isBooked = getBookingStatus(courtId, timeSlot) === 'booked'
  const isPastTime = isTimeSlotInPast(timeSlot, selectedDate)
  
  if (isPastTime) return 'past'
  if (isBooked) return 'booked'
  if (isSelected) return 'selected'
  return 'available'
}

export const getRatingStars = (rating) => {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}


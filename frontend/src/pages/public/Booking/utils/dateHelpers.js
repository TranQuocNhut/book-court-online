// Date helper functions

/**
 * Format date to YYYY-MM-DD in local timezone (not UTC)
 * This prevents timezone issues when converting dates
 */
export const formatDateToYYYYMMDD = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const formatDate = (date) => {
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  const dayName = days[date.getDay()]
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${dayName}, ${day}/${month}/${year}`
}

export const generateCalendarDays = (date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())
  
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    currentDate.setHours(0, 0, 0, 0)
    
    days.push({
      date: currentDate,
      isCurrentMonth: currentDate.getMonth() === month,
      isToday: currentDate.toDateString() === today.toDateString(),
      isPast: currentDate < today
    })
  }
  
  return days
}

export const isTimeSlotInPast = (timeSlot, selectedDate) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
  
  // If selected date is in the future, no slots are past
  if (selectedDateOnly > today) return false
  
  // If selected date is in the past, all slots are past
  if (selectedDateOnly < today) return true
  
  // If selected date is today, check if time slot is in the past
  const [hours, minutes] = timeSlot.split(':').map(Number)
  const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
  
  return slotTime < now
}


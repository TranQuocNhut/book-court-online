/**
 * Helper functions cho booking operations
 */

/**
 * Generate timeSlots array từ startTime và endTime Date objects
 * @param {Date} startTime - Thời gian bắt đầu
 * @param {Date} endTime - Thời gian kết thúc
 * @param {Number} slotDuration - Độ dài mỗi slot (phút), mặc định 60
 * @returns {Array<String>} - Array các time slots dạng ["HH:MM-HH:MM"]
 */
export function generateTimeSlotsFromRange(startTime, endTime, slotDuration = 60) {
  if (!startTime || !endTime) return [];
  
  const start = startTime instanceof Date ? new Date(startTime) : new Date(startTime);
  const end = endTime instanceof Date ? new Date(endTime) : new Date(endTime);
  
  if (start >= end) return [];
  
  const slots = [];
  let currentTime = new Date(start);
  
  while (currentTime < end) {
    const slotStart = new Date(currentTime);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);
    
    // Nếu slotEnd vượt quá endTime, chỉ lấy đến endTime
    if (slotEnd > end) {
      // Vẫn thêm slot cuối nếu có thời gian >= 30 phút
      const remainingMinutes = (end - slotStart) / (1000 * 60);
      if (remainingMinutes >= 30) {
        const startStr = `${String(slotStart.getHours()).padStart(2, '0')}:${String(slotStart.getMinutes()).padStart(2, '0')}`;
        const endStr = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
        slots.push(`${startStr}-${endStr}`);
      }
      break;
    }
    
    const startStr = `${String(slotStart.getHours()).padStart(2, '0')}:${String(slotStart.getMinutes()).padStart(2, '0')}`;
    const endStr = `${String(slotEnd.getHours()).padStart(2, '0')}:${String(slotEnd.getMinutes()).padStart(2, '0')}`;
    
    slots.push(`${startStr}-${endStr}`);
    
    currentTime = slotEnd;
  }
  
  return slots;
}

/**
 * Helper: Chuyển đổi time string (HH:MM) sang phút
 * @param {String} timeStr - Time string dạng "HH:MM"
 * @returns {Number|null} - Số phút từ 00:00, hoặc null nếu invalid
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 + minutes;
  } catch (error) {
    return null;
  }
}

/**
 * Helper: Chuyển đổi phút sang time string
 * @param {Number} minutes - Số phút từ 00:00
 * @returns {String} - Time string dạng "HH:MM"
 */
export function minutesToTime(minutes) {
  if (typeof minutes !== 'number' || isNaN(minutes)) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}


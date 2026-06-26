/**
 * Time Parser - Phân tích biểu thức thời gian tiếng Việt
 * Hỗ trợ các cụm từ như: "Tối thứ 3 tuần sau", "Chiều nay tầm 5h-7h", "Ngày mai 18h", etc.
 */

/**
 * Parse Vietnamese time expressions to structured date/time
 * @param {string} text - Text containing time expression
 * @returns {Object|null} { date: Date, timeRange: { start: string, end: string }, dayOfWeek: number } or null
 */
export const parseTimeExpression = (text) => {
  const lowerText = text.toLowerCase().trim();
  const now = new Date();
  
  // Initialize result
  let targetDate = new Date(now);
  targetDate.setHours(0, 0, 0, 0);
  
  let timeRange = null;
  let dayOfWeek = null;
  
  // Day of week mapping (Vietnamese)
  const dayMap = {
    'chủ nhật': 0, 'cn': 0,
    'thứ hai': 1, 'thứ 2': 1, 't2': 1,
    'thứ ba': 2, 'thứ 3': 2, 't3': 2,
    'thứ tư': 3, 'thứ 4': 3, 't4': 3,
    'thứ năm': 4, 'thứ 5': 4, 't5': 4,
    'thứ sáu': 5, 'thứ 6': 5, 't6': 5,
    'thứ bảy': 6, 'thứ 7': 6, 't7': 6,
  };
  
  // Time period mapping
  const timePeriodMap = {
    'sáng': { start: '06:00', end: '12:00' },
    'chiều': { start: '12:00', end: '18:00' },
    'tối': { start: '18:00', end: '22:00' },
    'đêm': { start: '20:00', end: '23:00' },
    'trưa': { start: '11:00', end: '14:00' },
  };
  
  // Parse relative dates
  if (lowerText.includes('hôm nay') || lowerText.includes('hôm nay')) {
    targetDate = new Date(now);
    targetDate.setHours(0, 0, 0, 0);
  } else if (lowerText.includes('ngày mai') || lowerText.includes('mai')) {
    targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + 1);
    targetDate.setHours(0, 0, 0, 0);
  } else if (lowerText.includes('ngày kia')) {
    targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + 2);
    targetDate.setHours(0, 0, 0, 0);
  } else if (lowerText.includes('tuần sau')) {
    // Find day of week if mentioned
    let dayFound = null;
    for (const [key, value] of Object.entries(dayMap)) {
      if (lowerText.includes(key)) {
        dayFound = value;
        dayOfWeek = value;
        break;
      }
    }
    
    // Calculate next week's date
    const daysUntilNextWeek = 7 - now.getDay() + (dayFound !== null ? dayFound : now.getDay());
    targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + daysUntilNextWeek);
    targetDate.setHours(0, 0, 0, 0);
  } else if (lowerText.includes('tuần này')) {
    // Find day of week if mentioned
    let dayFound = null;
    for (const [key, value] of Object.entries(dayMap)) {
      if (lowerText.includes(key)) {
        dayFound = value;
        dayOfWeek = value;
        break;
      }
    }
    
    if (dayFound !== null) {
      const currentDay = now.getDay();
      let daysToAdd = dayFound - currentDay;
      if (daysToAdd < 0) {
        daysToAdd += 7; // Next week
      }
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysToAdd);
      targetDate.setHours(0, 0, 0, 0);
    }
  } else {
    // Check for specific day of week
    for (const [key, value] of Object.entries(dayMap)) {
      if (lowerText.includes(key)) {
        dayOfWeek = value;
        const currentDay = now.getDay();
        let daysToAdd = value - currentDay;
        
        // If it's past today, move to next week
        if (daysToAdd <= 0) {
          daysToAdd += 7;
        }
        
        targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + daysToAdd);
        targetDate.setHours(0, 0, 0, 0);
        break;
      }
    }
  }
  
  // Parse time periods (sáng, chiều, tối)
  for (const [period, range] of Object.entries(timePeriodMap)) {
    if (lowerText.includes(period)) {
      timeRange = { ...range };
      break;
    }
  }
  
  // Parse specific time ranges (e.g., "5h-7h", "17h-19h", "tầm 18h-20h")
  const timeRangePattern = /(\d{1,2})\s*(?:h|giờ|:)?\s*-?\s*(\d{1,2})\s*(?:h|giờ)/;
  const timeRangeMatch = lowerText.match(timeRangePattern);
  
  if (timeRangeMatch) {
    const startHour = parseInt(timeRangeMatch[1], 10);
    const endHour = parseInt(timeRangeMatch[2], 10);
    
    if (startHour >= 0 && startHour <= 23 && endHour >= 0 && endHour <= 23 && endHour > startHour) {
      timeRange = {
        start: `${String(startHour).padStart(2, '0')}:00`,
        end: `${String(endHour).padStart(2, '0')}:00`
      };
    }
  }
  
  // Parse single time (e.g., "18h", "8 giờ", "tầm 5h")
  if (!timeRange) {
    const singleTimePattern = /(\d{1,2})\s*(?:h|giờ)/;
    const singleTimeMatch = lowerText.match(singleTimePattern);
    
    if (singleTimeMatch) {
      const hour = parseInt(singleTimeMatch[1], 10);
      if (hour >= 0 && hour <= 23) {
        // Create a 1-hour slot
        const startHour = hour;
        const endHour = (hour + 1) % 24;
        timeRange = {
          start: `${String(startHour).padStart(2, '0')}:00`,
          end: `${String(endHour).padStart(2, '0')}:00`
        };
      }
    }
  }
  
  // If no time range found but there's a time period, use default ranges
  if (!timeRange) {
    if (lowerText.includes('sáng')) {
      timeRange = timePeriodMap['sáng'];
    } else if (lowerText.includes('chiều')) {
      timeRange = timePeriodMap['chiều'];
    } else if (lowerText.includes('tối')) {
      timeRange = timePeriodMap['tối'];
    }
  }
  
  return {
    date: targetDate,
    timeRange: timeRange,
    dayOfWeek: dayOfWeek !== null ? dayOfWeek : targetDate.getDay(),
    hasTimeInfo: timeRange !== null
  };
};

/**
 * Check if text contains availability query
 * @param {string} text - Text to check
 * @returns {boolean}
 */
export const isAvailabilityQuery = (text) => {
  const lowerText = text.toLowerCase();
  
  const availabilityKeywords = [
    'còn sân',
    'sân trống',
    'sân nào trống',
    'có sân',
    'kiểm tra sân',
    'sân còn',
    'trống',
    'available',
    'availability',
    'còn chỗ',
    'còn slot'
  ];
  
  return availabilityKeywords.some(keyword => lowerText.includes(keyword));
};

/**
 * Extract court/facility mention from text (if any)
 * @param {string} text - Text to analyze
 * @returns {Object} { facilityMention: string|null, courtMention: string|null }
 */
export const extractMentions = (text) => {
  const lowerText = text.toLowerCase();
  
  // Try to find facility or court mentions
  // This is basic - can be enhanced with NLP
  const facilityPattern = /(?:cơ sở|sân|facility)\s+([a-z0-9]+)/i;
  const courtPattern = /(?:sân số|sân)\s+(\d+)/i;
  
  let facilityMention = null;
  let courtMention = null;
  
  const facilityMatch = text.match(facilityPattern);
  if (facilityMatch) {
    facilityMention = facilityMatch[1];
  }
  
  const courtMatch = text.match(courtPattern);
  if (courtMatch) {
    courtMention = courtMatch[1];
  }
  
  return { facilityMention, courtMention };
};

export default {
  parseTimeExpression,
  isAvailabilityQuery,
  extractMentions
};


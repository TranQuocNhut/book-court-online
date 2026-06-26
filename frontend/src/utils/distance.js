/**
 * Tính khoảng cách giữa 2 điểm địa lý bằng công thức Haversine
 * @param {number} lat1 - Vĩ độ điểm 1
 * @param {number} lon1 - Kinh độ điểm 1
 * @param {number} lat2 - Vĩ độ điểm 2
 * @param {number} lon2 - Kinh độ điểm 2
 * @returns {number} Khoảng cách tính bằng km
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return null
  }

  const R = 6371 // Bán kính Trái Đất (km)
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return distance
}

/**
 * Chuyển đổi độ sang radian
 */
function toRad(degrees) {
  return degrees * (Math.PI / 180)
}

/**
 * Format khoảng cách để hiển thị
 * @param {number} distance - Khoảng cách (km)
 * @returns {string} Khoảng cách đã format
 */
export function formatDistance(distance) {
  if (distance === null || distance === undefined) {
    return null
  }
  
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`
  }
  
  return `${distance.toFixed(1)}km`
}


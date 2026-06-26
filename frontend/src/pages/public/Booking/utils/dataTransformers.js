// Data transformation helper functions
import { formatPrice } from './priceHelpers';

/**
 * Format operating hours for display
 * @param {Object} hours - Operating hours object with day keys
 * @returns {string} Formatted operating hours string
 */
export const formatOperatingHours = (hours) => {
  if (!hours) return '06:00 - 22:00';
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[new Date().getDay()];
  const todayHours = hours[today];
  
  if (todayHours && todayHours.isOpen) {
    return `${todayHours.open} - ${todayHours.close}`;
  }
  
  // Fallback: return first available day
  for (const day of days) {
    if (hours[day] && hours[day].isOpen) {
      return `${hours[day].open} - ${hours[day].close}`;
    }
  }
  
  return '06:00 - 22:00';
};

/**
 * Transform facility data to venue format for components
 * @param {Object} facility - Facility data from API
 * @returns {Object} Transformed venue data
 */
export const transformFacilityToVenue = (facility) => {
  // Get images array
  const images = facility.images && facility.images.length > 0
    ? facility.images.map(img => img.url)
    : ['/sports-meeting.webp'];

  return {
    id: facility._id || facility.id,
    name: facility.name,
    address: facility.address,
    rating: facility.averageRating || facility.rating || 0,
    reviewCount: facility.reviewCount || 0,
    phone: facility.phoneNumber || '',
    price: formatPrice(facility.priceRange, facility.pricePerHour),
    pricePerHour: facility.pricePerHour || 0,
    priceRange: facility.priceRange || null,
    timeSlotDuration: facility.timeSlotDuration || 60, // Khung giờ đặt sân
    operatingHours: formatOperatingHours(facility.operatingHours),
    capacity: facility.capacity || 'N/A',
    facilities: facility.types || [],
    services: facility.services || [],
    description: facility.description || 'Không có mô tả',
    images: images,
    location: facility.location || null,
    sport: facility.types?.[0] || 'Bóng đá'
  };
};


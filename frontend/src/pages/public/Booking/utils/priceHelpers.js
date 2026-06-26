// Price helper functions

/**
 * Format price range or price per hour for display
 * @param {Object} priceRange - { min: number, max: number }
 * @param {number} pricePerHour - Price per hour
 * @returns {string} Formatted price string
 */
export const formatPrice = (priceRange, pricePerHour) => {
  // Ưu tiên sử dụng priceRange nếu có
  if (priceRange && priceRange.min !== undefined && priceRange.max !== undefined) {
    const minFormatted = new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(priceRange.min);
    const maxFormatted = new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(priceRange.max);
    return `${minFormatted} - ${maxFormatted} VND`;
  }
  // Fallback về pricePerHour nếu không có priceRange
  if (pricePerHour) {
    const formatted = new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(pricePerHour);
    return `${formatted} VND`;
  }
  return '0 VND';
};

/**
 * Calculate total amount based on selected slots
 * @param {string} selectedCourt - Selected court ID
 * @param {Array} selectedSlots - Array of selected slot keys
 * @param {Array} courts - Array of court objects
 * @param {Object} venueData - Venue data with pricePerHour
 * @returns {number} Total amount
 */
export const calculateTotalAmount = (selectedCourt, selectedSlots, courts, venueData) => {
  if (!selectedCourt || selectedSlots.length === 0) return 0;
  
  // Get court data to get price
  const selectedCourtData = courts.find(c => (c.id || c._id) === selectedCourt);
  const pricePerHour = selectedCourtData?.price || venueData?.pricePerHour || 0;
  
  if (!pricePerHour) return 0;
  
  // Each slot is 1 hour, so multiply by pricePerHour
  return selectedSlots.length * pricePerHour;
};

/**
 * Calculate discount amount based on promotion
 * @param {Object} promotion - Promotion object
 * @param {number} subtotal - Subtotal amount
 * @returns {number} Discount amount
 */
export const calculateDiscount = (promotion, subtotal) => {
  if (!promotion) return 0;

  if (promotion.discountType === 'percentage') {
    const discount = (subtotal * promotion.discountValue) / 100;
    return Math.round(discount);
  } else {
    // fixed amount
    return Math.min(promotion.discountValue, subtotal);
  }
};


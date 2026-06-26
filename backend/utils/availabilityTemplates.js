/**
 * Availability Templates - Văn mẫu cho chatbot khi kiểm tra sân trống
 * AI chỉ lọc và gợi ý dữ liệu, không tự tạo nội dung
 */

/**
 * Template: Yêu cầu chọn cơ sở
 */
export const askFacilityTemplate = () => {
  return {
    message: 'Bạn muốn kiểm tra sân trống tại cơ sở nào? Vui lòng chọn hoặc nhập tên cơ sở.',
    type: 'ask_facility',
    actions: [
      { type: 'text', label: 'Tìm cơ sở gần đây', value: 'tìm cơ sở gần đây' },
      { type: 'text', label: 'Xem danh sách cơ sở', value: 'xem danh sách cơ sở' }
    ]
  };
};

/**
 * Template: Yêu cầu chọn ngày
 */
export const askDateTemplate = (facilityName = null) => {
  const facilityText = facilityName ? `tại ${facilityName} ` : '';
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const formatDateShort = (date) => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return `${days[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
  };

  return {
    message: `Bạn muốn kiểm tra sân trống ${facilityText}vào ngày nào?`,
    type: 'ask_date',
    actions: [
      { type: 'date', label: `Hôm nay (${formatDateShort(today)})`, value: 'hôm nay' },
      { type: 'date', label: `Ngày mai (${formatDateShort(tomorrow)})`, value: 'ngày mai' },
      { type: 'date', label: 'Chọn ngày khác', value: 'datepicker', action: 'open_datepicker' }
    ]
  };
};

/**
 * Template: Yêu cầu chọn khung giờ
 */
export const askTimeTemplate = (facilityName = null, date = null) => {
  const facilityText = facilityName ? `tại ${facilityName} ` : '';
  const dateText = date ? `vào ${formatDate(date)} ` : '';
  
  return {
    message: `Bạn muốn kiểm tra sân trống ${facilityText}${dateText}trong khung giờ nào?`,
    type: 'ask_time',
    actions: [
      { type: 'time', label: 'Sáng (6h-12h)', value: 'sáng' },
      { type: 'time', label: 'Chiều (12h-18h)', value: 'chiều' },
      { type: 'time', label: 'Tối (18h-22h)', value: 'tối' },
      { type: 'time', label: 'Chọn khung giờ khác', value: 'timepicker', action: 'open_timepicker' }
    ]
  };
};

/**
 * Template: Yêu cầu cả ngày và giờ
 */
export const askDateTimeTemplate = (facilityName = null) => {
  const facilityText = facilityName ? `tại ${facilityName} ` : '';
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const formatDateShort = (date) => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return `${days[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
  };

  return {
    message: `Bạn muốn kiểm tra sân trống ${facilityText}vào thời gian nào?`,
    type: 'ask_datetime',
    actions: [
      { type: 'datetime', label: `Chiều hôm nay (${formatDateShort(today)})`, value: 'chiều hôm nay' },
      { type: 'datetime', label: `Tối hôm nay (${formatDateShort(today)})`, value: 'tối hôm nay' },
      { type: 'datetime', label: `Tối mai (${formatDateShort(tomorrow)})`, value: 'tối ngày mai' },
      { type: 'datetime', label: 'Chọn ngày và giờ khác', value: 'datetimepicker', action: 'open_datetimepicker' }
    ]
  };
};

/**
 * Template: Kết quả có sân trống
 */
export const availableCourtsTemplate = (data) => {
  const { courts = [], date, timeRange, facilityName = null } = data;
  const facilityText = facilityName ? `tại ${facilityName} ` : '';
  const dateText = date ? formatDate(date) : '';
  const timeText = timeRange ? formatTimeRange(timeRange) : '';

  let message = `✅ Tìm thấy ${courts.length} sân còn trống ${facilityText}vào ${dateText} ${timeText}:\n\n`;

  courts.slice(0, 5).forEach((court, index) => {
    message += `${index + 1}. ${court.court.name}`;
    if (court.facility.name && !facilityName) {
      message += ` - ${court.facility.name}`;
    }
    message += `\n   📍 ${court.facility.address || 'Địa chỉ: Đang cập nhật'}`;
    message += `\n   💰 ${court.totalPrice.toLocaleString('vi-VN')}đ`;
    message += `\n   ⏰ Khung giờ: ${court.availableSlots.join(', ')}`;
    message += `\n   🔖 ID sân: ${court.court.id}\n\n`;
  });

  if (courts.length > 5) {
    message += `... và ${courts.length - 5} sân khác.\n\n`;
  }

  message += '💡 Bạn có thể chọn sân để đặt ngay.';

  return {
    message,
    type: 'available_courts',
    data: {
      courts: courts.slice(0, 10),
      date,
      timeRange,
      facilityName
    },
    actions: courts.length > 0 ? [
      { type: 'button', label: 'Đặt sân ngay', action: 'book_court', courtId: courts[0].court.id },
      { type: 'button', label: 'Xem thêm sân', action: 'view_more_courts' }
    ] : []
  };
};

/**
 * Template: Không có sân trống - có gợi ý
 */
export const noAvailableWithAlternativesTemplate = (data) => {
  const { alternatives = [], date, timeRange, facilityName = null } = data;
  const facilityText = facilityName ? `tại ${facilityName} ` : '';
  const dateText = date ? formatDate(date) : '';
  const timeText = timeRange ? formatTimeRange(timeRange) : '';

  let message = `😔 Tiếc quá, không còn sân trống ${facilityText}vào ${dateText} ${timeText}.\n\n`;

  if (alternatives.length > 0) {
    message += '💡 Nhưng tôi có một số gợi ý thay thế cho bạn:\n\n';

    alternatives.slice(0, 3).forEach((alt, index) => {
      const altDateText = formatDate(alt.date);
      const isSameDate = alt.date.getTime() === date?.getTime();

      message += `${index + 1}. ${alt.court.name}`;
      if (alt.facility.name && !facilityName) {
        message += ` - ${alt.facility.name}`;
      }
      message += `\n`;

      if (!isSameDate) {
        message += `   ⏰ Ngày khác: ${altDateText}\n`;
      }

      if (alt.slots && alt.slots.length > 0) {
        message += `   🎯 Khung giờ có sẵn: ${alt.slots.join(', ')}\n`;
      } else if (alt.slot) {
        message += `   🎯 Khung giờ có sẵn: ${alt.slot}\n`;
      }

      const price = alt.court.price * (alt.slots?.length || 1);
      message += `   💰 Giá: ${price.toLocaleString('vi-VN')}đ`;
      message += `\n   🔖 ID sân: ${alt.court.id}\n\n`;
    });

    message += '💡 Bạn có muốn chọn một trong các khung giờ này không?';
  } else {
    message += 'Hiện tại không có khung giờ thay thế phù hợp. Vui lòng thử ngày khác hoặc liên hệ trực tiếp với cơ sở.';
  }

  return {
    message,
    type: 'no_available_with_alternatives',
    data: {
      alternatives: alternatives.slice(0, 5),
      date,
      timeRange,
      facilityName
    },
    actions: alternatives.length > 0 ? [
      { type: 'button', label: 'Chọn khung giờ thay thế', action: 'select_alternative', alternatives: alternatives.slice(0, 3) },
      { type: 'button', label: 'Tìm ngày khác', action: 'search_other_date' }
    ] : [
      { type: 'button', label: 'Tìm ngày khác', action: 'search_other_date' },
      { type: 'button', label: 'Liên hệ cơ sở', action: 'contact_facility', facilityId: alternatives[0]?.facility?.id }
    ]
  };
};

/**
 * Template: Không tìm thấy sân phù hợp
 */
export const noCourtsFoundTemplate = (facilityName = null) => {
  const facilityText = facilityName ? `tại ${facilityName} ` : '';
  
  return {
    message: `Không tìm thấy sân nào phù hợp ${facilityText}với yêu cầu của bạn. Vui lòng thử lại với thông tin khác.`,
    type: 'no_courts_found',
    actions: [
      { type: 'button', label: 'Tìm cơ sở khác', action: 'search_other_facility' },
      { type: 'button', label: 'Xem danh sách cơ sở', action: 'view_facilities' }
    ]
  };
};

/**
 * Template: Cơ sở không hoạt động
 */
export const facilityClosedTemplate = (facilityName, date = null) => {
  const dateText = date ? ` vào ${formatDate(date)}` : '';
  
  return {
    message: `Cơ sở ${facilityName} không hoạt động${dateText}. Vui lòng chọn ngày khác hoặc liên hệ trực tiếp với cơ sở.`,
    type: 'facility_closed',
    actions: [
      { type: 'button', label: 'Chọn ngày khác', action: 'select_other_date' },
      { type: 'button', label: 'Liên hệ cơ sở', action: 'contact_facility', facilityName }
    ]
  };
};

/**
 * Format ngày thành string tiếng Việt
 */
const formatDate = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayName = days[d.getDay()];
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  
  return `${dayName}, ngày ${day}/${month}/${year}`;
};

/**
 * Format time range thành string
 */
const formatTimeRange = (timeRange) => {
  if (!timeRange || !timeRange.start || !timeRange.end) return '';
  const start = timeRange.start.replace(':', 'h');
  const end = timeRange.end.replace(':', 'h');
  return `từ ${start} đến ${end}`;
};

export default {
  askFacilityTemplate,
  askDateTemplate,
  askTimeTemplate,
  askDateTimeTemplate,
  availableCourtsTemplate,
  noAvailableWithAlternativesTemplate,
  noCourtsFoundTemplate,
  facilityClosedTemplate
};


/**
 * Message Filter - Lọc tin nhắn trước khi gửi tới AI
 * Loại bỏ từ vô nghĩa, ký tự đặc biệt, spam
 */

// Danh sách từ spam phổ biến (có thể mở rộng)
const SPAM_WORDS = [
  'spam', 'advertisement', 'quảng cáo', 'click here', 'buy now',
  'free money', 'tiền miễn phí', 'nhận ngay', 'không cần vốn',
  'làm giàu nhanh', 'kiếm tiền online', 'đa cấp', 'mlm'
];

// Ký tự đặc biệt được phép (dấu câu tiếng Việt)
const ALLOWED_SPECIAL_CHARS = /[.,!?;:()\-'"]/g;

// Ký tự đặc biệt không được phép
const INVALID_CHARS = /[<>{}[\]\\|`~@#$%^&*+=_]/g;

// Pattern để phát hiện ký tự lặp lại quá nhiều (ví dụ: aaaa, 1111)
const REPEATED_CHARS = /(.)\1{4,}/g;

// Pattern để phát hiện URL
const URL_PATTERN = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

// Pattern để phát hiện email
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Pattern để phát hiện số điện thoại (có thể là spam)
const PHONE_PATTERN = /(\+84|0)[0-9]{9,10}/g;

/**
 * Loại bỏ ký tự đặc biệt không cần thiết
 */
const removeInvalidChars = (text) => {
  // Loại bỏ ký tự đặc biệt không hợp lệ
  let cleaned = text.replace(INVALID_CHARS, ' ');
  
  // Loại bỏ ký tự lặp lại quá nhiều (giữ lại tối đa 2 ký tự)
  cleaned = cleaned.replace(REPEATED_CHARS, '$1$1');
  
  return cleaned;
};

/**
 * Loại bỏ URL và email (có thể là spam)
 */
const removeLinks = (text) => {
  let cleaned = text.replace(URL_PATTERN, '');
  cleaned = cleaned.replace(EMAIL_PATTERN, '');
  return cleaned;
};

/**
 * Loại bỏ số điện thoại (có thể là spam)
 */
const removePhoneNumbers = (text) => {
  return text.replace(PHONE_PATTERN, '');
};

/**
 * Kiểm tra từ spam
 */
const containsSpamWords = (text) => {
  const lowerText = text.toLowerCase();
  return SPAM_WORDS.some(spamWord => lowerText.includes(spamWord.toLowerCase()));
};

/**
 * Loại bỏ khoảng trắng thừa
 */
const normalizeWhitespace = (text) => {
  return text
    .replace(/\s+/g, ' ') // Nhiều khoảng trắng thành 1
    .replace(/\n{3,}/g, '\n\n') // Nhiều dòng trống thành 2
    .trim();
};

/**
 * Loại bỏ emoji và ký tự đặc biệt không phải ASCII
 * (Giữ lại ký tự tiếng Việt)
 */
const removeEmojis = (text) => {
  // Giữ lại ký tự tiếng Việt và ASCII
  return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
};

/**
 * Kiểm tra tin nhắn có quá ngắn hoặc quá dài (có thể là spam)
 */
const isValidLength = (text) => {
  const length = text.trim().length;
  // Tin nhắn hợp lệ: từ 1 đến 500 ký tự
  return length >= 1 && length <= 500;
};

/**
 * Loại bỏ ký tự không in được
 */
const removeNonPrintableChars = (text) => {
  // Giữ lại: chữ cái, số, dấu câu, khoảng trắng, ký tự tiếng Việt
  return text.replace(/[^\p{L}\p{N}\s.,!?;:()\-'"]/gu, '');
};

/**
 * Lọc tin nhắn chính
 * @param {string} message - Tin nhắn cần lọc
 * @returns {Object} { filtered: string, isValid: boolean, reason: string }
 */
export const filterMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return {
      filtered: '',
      isValid: false,
      reason: 'Tin nhắn không hợp lệ'
    };
  }

  let filtered = message;

  // 1. Loại bỏ ký tự không in được
  filtered = removeNonPrintableChars(filtered);

  // 2. Loại bỏ emoji
  filtered = removeEmojis(filtered);

  // 3. Loại bỏ URL và email
  filtered = removeLinks(filtered);

  // 4. Loại bỏ số điện thoại
  filtered = removePhoneNumbers(filtered);

  // 5. Loại bỏ ký tự đặc biệt không hợp lệ
  filtered = removeInvalidChars(filtered);

  // 6. Chuẩn hóa khoảng trắng
  filtered = normalizeWhitespace(filtered);

  // 7. Kiểm tra độ dài
  if (!isValidLength(filtered)) {
    return {
      filtered: filtered,
      isValid: false,
      reason: filtered.length < 1 ? 'Tin nhắn quá ngắn' : 'Tin nhắn quá dài'
    };
  }

  // 8. Kiểm tra từ spam
  if (containsSpamWords(filtered)) {
    return {
      filtered: filtered,
      isValid: false,
      reason: 'Tin nhắn chứa nội dung spam'
    };
  }

  // 9. Kiểm tra tin nhắn chỉ chứa ký tự đặc biệt hoặc số
  const hasValidContent = /[a-zA-ZÀ-ỹ]/.test(filtered);
  if (!hasValidContent) {
    return {
      filtered: filtered,
      isValid: false,
      reason: 'Tin nhắn không chứa nội dung hợp lệ'
    };
  }

  return {
    filtered: filtered,
    isValid: true,
    reason: null
  };
};

/**
 * Lọc và validate tin nhắn, trả về tin nhắn đã lọc hoặc lỗi
 * @param {string} message - Tin nhắn cần lọc
 * @returns {string} Tin nhắn đã lọc
 * @throws {Error} Nếu tin nhắn không hợp lệ
 */
export const validateAndFilter = (message) => {
  const result = filterMessage(message);
  
  if (!result.isValid) {
    throw new Error(result.reason || 'Tin nhắn không hợp lệ');
  }
  
  return result.filtered;
};

export default { filterMessage, validateAndFilter };


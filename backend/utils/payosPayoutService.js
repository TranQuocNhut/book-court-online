import crypto from "crypto";
import { config } from "../config/config.js";

const PAYOS_API_BASE = "https://api-merchant.payos.vn";

// Set connect timeout cho undici (Node.js fetch implementation)
// Undici có connect timeout mặc định là 10s, cần set environment variable
// Lưu ý: Cần set trước khi import fetch
if (!process.env.UNDICI_CONNECT_TIMEOUT) {
  process.env.UNDICI_CONNECT_TIMEOUT = "30000"; // 30 giây
}

// Cache undici Agent để tái sử dụng
let undiciAgentCache = null;

/**
 * Lấy hoặc tạo undici Agent với connect timeout
 * @returns {Object|null} - Undici Agent hoặc null nếu không có
 */
const getUndiciAgent = async () => {
  if (undiciAgentCache) {
    return undiciAgentCache;
  }
  
  try {
    const { Agent } = await import('undici');
    undiciAgentCache = new Agent({
      connect: {
        timeout: 30000, // 30 giây cho connect timeout
      },
    });
    return undiciAgentCache;
  } catch (error) {
    // Nếu không có undici, sẽ dùng fetch mặc định
    return null;
  }
};

/**
 * Fetch với timeout
 * @param {string} url - URL để fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout trong milliseconds (mặc định 30s)
 * @returns {Promise<Response>}
 */
const fetchWithTimeout = async (url, options, timeout = 30000) => {
  // Tạo AbortController để hủy request khi timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  try {
    // Thêm signal vào options để có thể abort
    // Nếu đã có signal trong options, tạo signal kết hợp
    let finalSignal = controller.signal;
    if (options.signal) {
      // Tạo signal kết hợp để hủy khi một trong hai bị abort
      const combinedController = new AbortController();
      const abort = () => combinedController.abort();
      controller.signal.addEventListener('abort', abort);
      options.signal.addEventListener('abort', abort);
      finalSignal = combinedController.signal;
    }
    
    // Undici (Node.js fetch) có connectTimeout mặc định là 10s
    // Sử dụng undici Agent để set connectTimeout chính xác
    let fetchOptions = {
      ...options,
      signal: finalSignal,
    };
    
    // Lấy undici Agent nếu có để set connectTimeout
    const agent = await getUndiciAgent();
    if (agent) {
      fetchOptions.dispatcher = agent;
    }
    
    // Gọi fetch với timeout
    const response = await fetch(url, fetchOptions);
    
    // Clear timeout nếu request thành công
    clearTimeout(timeoutId);
    
    return response;
  } catch (error) {
    // Clear timeout khi có lỗi
    clearTimeout(timeoutId);
    
    // Xử lý lỗi timeout
    if (error.name === 'AbortError' || error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.name === 'TimeoutError' || error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
      throw new Error(`Request timeout - PayOS API không phản hồi trong ${timeout}ms. Vui lòng thử lại sau.`);
    }
    
    // Re-throw các lỗi khác
    throw error;
  }
};

/**
 * Tạo chữ ký (signature) cho PayOS Payout API
 * Theo tài liệu PayOS: https://payos.vn/docs/api/
 * - Sắp xếp keys theo alphabet
 * - Format: key=value&key2=value2
 * - Values cần encodeURI (trừ array/object dùng JSON.stringify)
 * @param {Object} data - Dữ liệu cần ký
 * @param {string} checksumKey - Checksum key từ PayOS
 * @returns {string} - Signature
 */
const createSignature = (data, checksumKey) => {
  // Sắp xếp keys theo alphabet
  const sortedKeys = Object.keys(data).sort();
  
  // Tạo string theo format key=value&key2=value2
  // Theo tài liệu PayOS: tất cả values đều cần encodeURI
  const dataString = sortedKeys
    .map((key) => {
      let value = data[key];
      
      // Xử lý null/undefined - thay bằng chuỗi rỗng
      if (value === null || value === undefined) {
        value = '';
      }
      // Xử lý array/object - chuyển thành JSON string rồi encodeURI
      else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        value = JSON.stringify(value);
      }
      // Giá trị thông thường - chuyển thành string
      else {
        value = String(value);
      }
      
      // Tất cả values đều cần encodeURI
      return `${key}=${encodeURI(value)}`;
    })
    .join("&");
  
  // Tạo HMAC SHA256
  const signature = crypto
    .createHmac("sha256", checksumKey)
    .update(dataString)
    .digest("hex");
  
  return signature;
};

/**
 * Tạo lệnh chi đơn (Single Payout)
 * @param {Object} params
 * @param {string} params.referenceId - Mã tham chiếu duy nhất
 * @param {number} params.amount - Số tiền (VNĐ)
 * @param {string} params.description - Mô tả (tối đa 25 ký tự)
 * @param {string} params.toBin - Mã BIN ngân hàng (6 chữ số, ví dụ: "970415" cho Techcombank)
 * @param {string} params.toAccountNumber - Số tài khoản ngân hàng
 * @param {string} params.category - Danh mục (optional, ví dụ: "salary", "bonus")
 * @returns {Promise<object>} - Kết quả từ PayOS
 */
export const createSinglePayout = async ({
  referenceId,
  amount,
  description,
  toBin,
  toAccountNumber,
  category = "salary",
}) => {
  try {
    // Theo tài liệu PayOS Payout API, category là Array of strings
    const requestData = {
      referenceId,
      amount: Math.round(amount), // Đảm bảo là số nguyên
      description: description.substring(0, 25), // Tối đa 25 ký tự
      toBin,
      toAccountNumber,
      category: [category], // Array of strings theo tài liệu PayOS
    };

    // Tạo signature
    const signature = createSignature(requestData, config.payos.payout.checksumKey);

    // Tạo idempotency key (sử dụng referenceId để đảm bảo unique)
    const idempotencyKey = referenceId || `IDEMPOTENCY_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Gọi API PayOS với timeout
    const response = await fetchWithTimeout(
      `${PAYOS_API_BASE}/v1/payouts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": config.payos.payout.clientId,
          "x-api-key": config.payos.payout.apiKey,
          "x-signature": signature,
          "x-idempotency-key": idempotencyKey, // Header bắt buộc cho PayOS Payout API
        },
        body: JSON.stringify(requestData),
      },
      30000 // 30 giây timeout
    );

    // Kiểm tra HTTP status code trước
    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ [PAYOS PAYOUT] HTTP Error ${response.status}:`, text);
      
      // Xử lý các lỗi HTTP cụ thể
      if (response.status === 429) {
        throw new Error("PayOS API: Quá nhiều requests. Vui lòng thử lại sau.");
      }
      if (response.status === 403) {
        throw new Error(
          `IP_WHITELIST_ERROR: Địa chỉ IP server chưa được whitelist trong PayOS. Vui lòng liên hệ admin để thêm IP vào danh sách cho phép.`
        );
      }
      throw new Error(
        `PayOS API HTTP Error (Status: ${response.status}): ${text.substring(0, 200)}`
      );
    }

    // Parse JSON response
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      const text = await response.text();
      console.error("❌ [PAYOS PAYOUT] JSON Parse Error:", text);
      throw new Error(
        `PayOS API trả về response không hợp lệ: ${text.substring(0, 200)}`
      );
    }

    // Kiểm tra PayOS response code
    if (result.code !== "00") {
      // Xử lý đặc biệt cho lỗi 403 (IP whitelist)
      if (result.code === "403" || response.status === 403) {
        throw new Error(
          `IP_WHITELIST_ERROR: Địa chỉ IP server chưa được whitelist trong PayOS. Vui lòng liên hệ admin để thêm IP vào danh sách cho phép. (Code: ${result.code})`
        );
      }
      throw new Error(
        `PayOS Error: ${result.desc || result.message} (Code: ${result.code})`
      );
    }

    return {
      success: true,
      data: result.data,
      payoutId: result.data.id,
      referenceId: result.data.referenceId,
    };
  } catch (error) {
    console.error("Lỗi khi tạo lệnh chi PayOS:", error);
    throw error;
  }
};

/**
 * Lấy thông tin lệnh chi
 * @param {string} payoutId - ID của lệnh chi từ PayOS
 * @returns {Promise<object>} - Thông tin lệnh chi
 */
export const getPayoutInfo = async (payoutId) => {
  try {
    const response = await fetchWithTimeout(
      `${PAYOS_API_BASE}/v1/payouts/${payoutId}`,
      {
        method: "GET",
        headers: {
          "x-client-id": config.payos.payout.clientId,
          "x-api-key": config.payos.payout.apiKey,
        },
      },
      30000
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `PayOS API HTTP Error (Status: ${response.status}): ${text.substring(0, 200)}`
      );
    }

    const result = await response.json();

    if (result.code !== "00") {
      throw new Error(
        `PayOS Error: ${result.desc || result.message} (Code: ${result.code})`
      );
    }

    return result.data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin lệnh chi:", error);
    throw error;
  }
};

/**
 * Lấy danh sách lệnh chi từ PayOS
 * @param {Object} params - Tham số lọc
 * @param {number} [params.limit=10] - Số lượng kết quả trên mỗi trang
 * @param {number} [params.offset=0] - Vị trí bắt đầu
 * @param {string} [params.referenceId] - Mã tham chiếu để lọc
 * @param {string} [params.approvalState] - Trạng thái phê duyệt (SUCCEEDED, PENDING, FAILED, etc.)
 * @param {string|string[]} [params.category] - Danh mục để lọc (có thể là string hoặc array)
 * @param {string} [params.fromDate] - Lọc từ ngày (ISO 8601 format, ví dụ: 2024-01-15T10:30:00.000Z)
 * @param {string} [params.toDate] - Lọc đến ngày (ISO 8601 format)
 * @returns {Promise<object>} - Danh sách payouts và pagination
 */
export const getPayoutsList = async ({
  limit = 10,
  offset = 0,
  referenceId,
  approvalState,
  category,
  fromDate,
  toDate,
} = {}) => {
  try {
    // Xây dựng query parameters
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append("limit", limit.toString());
    if (offset) queryParams.append("offset", offset.toString());
    if (referenceId) queryParams.append("referenceId", referenceId);
    if (approvalState) queryParams.append("approvalState", approvalState);
    if (category) {
      // Nếu category là array, join bằng dấu phẩy
      const categoryValue = Array.isArray(category) ? category.join(",") : category;
      queryParams.append("category", categoryValue);
    }
    if (fromDate) queryParams.append("fromDate", fromDate);
    if (toDate) queryParams.append("toDate", toDate);

    const queryString = queryParams.toString();
    const url = `${PAYOS_API_BASE}/v1/payouts${queryString ? `?${queryString}` : ""}`;

    // Gọi API PayOS với timeout
    const response = await fetchWithTimeout(
      url,
      {
        method: "GET",
        headers: {
          "x-client-id": config.payos.payout.clientId,
          "x-api-key": config.payos.payout.apiKey,
        },
      },
      30000 // 30 giây timeout
    );

    // Kiểm tra HTTP status code
    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ [PAYOS PAYOUT] HTTP Error ${response.status}:`, text);
      
      if (response.status === 429) {
        throw new Error("PayOS API: Quá nhiều requests. Vui lòng thử lại sau.");
      }
      if (response.status === 403) {
        throw new Error(
          `IP_WHITELIST_ERROR: Địa chỉ IP server chưa được whitelist trong PayOS. Vui lòng liên hệ admin để thêm IP vào danh sách cho phép.`
        );
      }
      throw new Error(
        `PayOS API HTTP Error (Status: ${response.status}): ${text.substring(0, 200)}`
      );
    }

    // Parse JSON response
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      const text = await response.text();
      console.error("❌ [PAYOS PAYOUT] JSON Parse Error:", text);
      throw new Error(
        `PayOS API trả về response không hợp lệ: ${text.substring(0, 200)}`
      );
    }

    // Kiểm tra PayOS response code
    if (result.code !== "00") {
      if (result.code === "403" || response.status === 403) {
        throw new Error(
          `IP_WHITELIST_ERROR: Địa chỉ IP server chưa được whitelist trong PayOS. Vui lòng liên hệ admin để thêm IP vào danh sách cho phép. (Code: ${result.code})`
        );
      }
      throw new Error(
        `PayOS Error: ${result.desc || result.message} (Code: ${result.code})`
      );
    }

    return {
      success: true,
      payouts: result.data?.payouts || [],
      pagination: result.data?.pagination || {
        total: 0,
        limit: limit,
        offset: offset,
        count: 0,
        hasMore: false,
      },
    };
  } catch (error) {
    console.error("Lỗi khi lấy danh sách lệnh chi PayOS:", error);
    throw error;
  }
};

/**
 * Ước tính chi phí cho lệnh chi
 * Theo tài liệu PayOS: https://payos.vn/docs/api/#tag/payout/operation/estimate-credit
 * Format khác với createSinglePayout - yêu cầu payouts array
 * @param {Object} params
 * @param {string} params.referenceId - Mã tham chiếu
 * @param {number} params.amount - Số tiền
 * @param {string} params.description - Mô tả
 * @param {string} params.toBin - Mã BIN ngân hàng
 * @param {string} params.toAccountNumber - Số tài khoản
 * @param {string} params.category - Danh mục (optional)
 * @returns {Promise<number>} - Chi phí ước tính (VNĐ)
 */
export const estimatePayoutFee = async ({
  referenceId,
  amount,
  description,
  toBin,
  toAccountNumber,
  category = "salary",
  validateDestination = false, // Optional, mặc định false
}) => {
  try {
    // Theo tài liệu PayOS, estimate-credit API yêu cầu format:
    // - referenceId (string, required)
    // - category (Array of strings, optional) - có thể có nhiều category
    // - validateDestination (boolean, optional)
    // - payouts (Array of PayoutItem, required)
    // Format mẫu từ PayOS:
    // {
    //   "referenceId": "batch_payout_123",
    //   "category": ["salary", "bonus"],
    //   "validateDestination": true,
    //   "payouts": [{
    //     "referenceId": "payout_123",
    //     "amount": 100000,
    //     "description": "Thanh toán lương tháng 1",
    //     "toBin": "970415",
    //     "toAccountNumber": "123456789"
    //   }]
    // }
    const requestData = {
      referenceId,
      category: Array.isArray(category) ? category : [category], // Hỗ trợ cả array và string
      validateDestination: validateDestination, // Có thể set từ parameter
      payouts: [
        {
          referenceId: `${referenceId}_ITEM_0`, // ReferenceId cho từng payout item
          amount: Math.round(amount),
          description: description.substring(0, 25),
          toBin,
          toAccountNumber,
        },
      ],
    };

    const signature = createSignature(requestData, config.payos.payout.checksumKey);

    // Theo tài liệu PayOS, estimate-credit chỉ cần x-signature, không cần x-idempotency-key
    const response = await fetchWithTimeout(
      `${PAYOS_API_BASE}/v1/payouts/estimate-credit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": config.payos.payout.clientId,
          "x-api-key": config.payos.payout.apiKey,
          "x-signature": signature, // Chỉ cần x-signature cho estimate-credit
        },
        body: JSON.stringify(requestData),
      },
      30000 // 30 giây timeout cho estimate
    );

    // Kiểm tra HTTP status code trước
    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ [PAYOS ESTIMATE] HTTP Error ${response.status}:`, text);
      
      // Xử lý các lỗi HTTP cụ thể
      if (response.status === 429) {
        throw new Error("PayOS API: Quá nhiều requests. Vui lòng thử lại sau.");
      }
      if (response.status === 403) {
        throw new Error(
          `IP_WHITELIST_ERROR: Địa chỉ IP server chưa được whitelist trong PayOS.`
        );
      }
      throw new Error(
        `PayOS API HTTP Error (Status: ${response.status}): ${text.substring(0, 200)}`
      );
    }

    // Parse JSON response
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      const text = await response.text();
      console.error("❌ [PAYOS ESTIMATE] JSON Parse Error:", text);
      throw new Error(
        `PayOS API trả về response không hợp lệ: ${text.substring(0, 200)}`
      );
    }

    if (result.code !== "00") {
      throw new Error(
        `PayOS Error: ${result.desc || result.message} (Code: ${result.code})`
      );
    }

    // Format response từ PayOS:
    // {
    //   "code": "00",
    //   "desc": "success",
    //   "data": {
    //     "estimateCredit": 5000
    //   }
    // }
    // Trả về phí ước tính (VNĐ), mặc định 0 nếu không có
    const estimateCredit = result.data?.estimateCredit;
    return estimateCredit !== undefined && estimateCredit !== null ? estimateCredit : 0;
  } catch (error) {
    // Estimate fee là optional, không cần log error
    // Vẫn throw để caller biết và xử lý
    throw error;
  }
};

/**
 * Lấy số dư tài khoản chi
 * @returns {Promise<object>} - Thông tin số dư
 */
export const getPayoutBalance = async () => {
  try {
    const response = await fetch(
      `${PAYOS_API_BASE}/v1/payouts-account/balance`,
      {
        method: "GET",
        headers: {
          "x-client-id": config.payos.payout.clientId,
          "x-api-key": config.payos.payout.apiKey,
        },
      }
    );

    const result = await response.json();

    if (result.code !== "00") {
      throw new Error(
        `PayOS Error: ${result.desc || result.message} (Code: ${result.code})`
      );
    }

    return result.data;
  } catch (error) {
    console.error("Lỗi khi lấy số dư:", error);
    throw error;
  }
};

/**
 * Map mã ngân hàng Việt Nam sang BIN code
 * @param {string} bankCode - Mã ngân hàng (VCB, TCB, VTB, etc.)
 * @returns {string} - BIN code (6 chữ số)
 */
export const getBankBin = (bankCode) => {
  const bankBinMap = {
    VCB: "970436", // Vietcombank
    TCB: "970415", // Techcombank
    VTB: "970421", // Vietinbank
    ACB: "970416", // ACB
    TPB: "970423", // TPBank
    VPB: "970432", // VPBank
    MSB: "970426", // Maritime Bank
    HDB: "970437", // HDBank
    VIB: "970441", // VIB
    SHB: "970443", // SHB
    EIB: "970431", // Eximbank
    BID: "970418", // BIDV
    MBB: "970422", // MBBank
    STB: "970403", // Sacombank
    // Thêm các ngân hàng khác nếu cần
  };

  return bankBinMap[bankCode.toUpperCase()] || null;
};


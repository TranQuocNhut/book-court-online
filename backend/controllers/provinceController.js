import asyncHandler from "express-async-handler";
import axios from "axios";

// Đưa nguồn GitHub lên làm ưu tiên số 1 vì nó cực kỳ ổn định
const STABLE_DATA_URL = "https://raw.githubusercontent.com/kenzouno1/DiaGioiHanhChinhVN/master/data.json";

export const getProvinces = asyncHandler(async (req, res) => {
  try {
    console.log("Fetching provinces from stable source...");
    
    const response = await axios.get(STABLE_DATA_URL, { timeout: 10000 });
    const rawData = response.data;

    // Dữ liệu từ GitHub kenzouno1 có cấu trúc: Array [Province -> Districts -> Wards]
    // Chúng ta cần chuẩn hóa một chút để FE không bị lỗi khi tìm .districts
    const formattedData = rawData.map(province => ({
      name: province.Name,
      code: province.Id,
      districts: (province.Districts || []).map(district => ({
        name: district.Name,
        code: district.Id,
        wards: (district.Wards || []).map(ward => ({
          name: ward.Name,
          code: ward.Id
        }))
      }))
    }));

    return res.json({
      success: true,
      data: formattedData,
    });

  } catch (error) {
    console.error("Lỗi lấy dữ liệu tỉnh thành:", error.message);
    
    // Nếu ngay cả GitHub cũng lỗi (hiếm), trả về lỗi 500
    return res.status(500).json({
      success: false,
      data: [],
      error: "Không thể tải danh sách tỉnh thành. Hệ thống đang bận.",
    });
  }
});
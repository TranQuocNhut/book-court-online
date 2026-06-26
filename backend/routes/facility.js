// routes/facility.js
import express from "express";
import mongoose from "mongoose";
import Facility from "../models/Facility.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import {
  authenticateToken,
  authorize,
  requireAdmin,
} from "../middleware/auth.js";
import { logAudit } from "../utils/auditLogger.js";
import { uploadFacilityImage, cloudinaryUtils } from "../config/cloudinary.js";
import { geocodeAddress } from "../utils/goongService.js";

const router = express.Router();

// === MIDDLEWARE TÙY CHỈNH CHO ROUTE NÀY ===

// Middleware kiểm tra quyền sở hữu (Chỉ Owner của cơ sở)
const checkOwnership = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy cơ sở" });
    }

    const facility = await Facility.findById(req.params.id);

    if (!facility) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy cơ sở" });
    }

    // Kiểm tra xem user có phải là chủ sở hữu không
    if (facility.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập",
      });
    }

    req.facility = facility; // Gán facility vào request để dùng ở route sau
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware kiểm tra quyền sở hữu HOẶC Admin
const checkOwnershipOrAdmin = async (req, res, next) => {
  try {
    if (req.user.role === "admin") {
      return next(); // Admin có toàn quyền
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy cơ sở" });
    }

    const facility = await Facility.findById(req.params.id);

    if (!facility) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy cơ sở" });
    }

    // Kiểm tra xem user có phải là chủ sở hữu không
    if (facility.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập",
      });
    }

    req.facility = facility;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware để tự động lấy tọa độ từ địa chỉ
const autoGeocode = async (req, res, next) => {
  try {
    // Chỉ geocode nếu có address và một trong các điều kiện sau:
    // 1. Chưa có location coordinates
    // 2. Có flag addressChanged từ client
    // 3. Address thực sự thay đổi so với database
    if (req.body.address) {
      let shouldGeocode = false;
      
      // Kiểm tra nếu có flag addressChanged từ client
      if (req.body.addressChanged) {
        shouldGeocode = true;
      }
      // Kiểm tra nếu chưa có location coordinates
      else if (!req.body.location?.coordinates) {
        // So sánh với address hiện tại trong database (nếu có facility)
        if (req.facility) {
          const currentAddress = req.facility.address?.trim() || '';
          const newAddress = req.body.address.trim();
          if (currentAddress !== newAddress) {
            shouldGeocode = true;
          }
        } else {
          // Nếu chưa có facility (create), luôn geocode
          shouldGeocode = true;
        }
      }
      
      if (shouldGeocode) {
        try {
          // Thêm timeout wrapper để tránh request bị treo quá lâu
          const geocodePromise = geocodeAddress(req.body.address);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Geocode timeout after 8 seconds')), 8000)
          );
          
          const geocodeResult = await Promise.race([geocodePromise, timeoutPromise]);
          
          // Format theo GeoJSON: [longitude, latitude]
          if (geocodeResult.lng && geocodeResult.lat) {
            req.body.location = {
              type: 'Point',
              coordinates: [geocodeResult.lng, geocodeResult.lat]
            };
          } else {
            // Xóa location nếu không có tọa độ hợp lệ
            delete req.body.location;
          }

          // Có thể cập nhật lại address với formatted_address từ Goong (tùy chọn)
          // req.body.address = geocodeResult.formatted_address;
        } catch (error) {
          // Nếu không lấy được tọa độ, xóa location để tránh lỗi và tiếp tục request
          console.warn('Không thể lấy tọa độ từ Goong API:', error.message);
          delete req.body.location;
          // Không throw error, tiếp tục xử lý request mà không có location
        }
      }
    }
    
    // Validate location từ client: chỉ set nếu có coordinates hợp lệ
    if (req.body.location) {
      if (req.body.location.coordinates && Array.isArray(req.body.location.coordinates) && req.body.location.coordinates.length === 2) {
        const [lng, lat] = req.body.location.coordinates;
        // Validate range
        if (lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
          req.body.location = {
            type: 'Point',
            coordinates: [lng, lat]
          };
        } else {
          // Tọa độ không hợp lệ, xóa location
          delete req.body.location;
        }
      } else {
        // Location không có coordinates hợp lệ, xóa để tránh lỗi
        delete req.body.location;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// === CÁC API ENDPOINTS ===

/**
 * BE: POST /api/facilities
 * Tạo cơ sở mới (Chỉ cho Owner)
 */
router.post(
  "/",
  authenticateToken,
  authorize("owner"), // Chỉ 'owner' mới được tạo
  autoGeocode, // Middleware tự động lấy tọa độ từ địa chỉ
  async (req, res, next) => {
    try {
      const facility = new Facility({
        ...req.body,
        owner: req.user._id, // Gán chủ sở hữu là user đang đăng nhập
      });

      await facility.save();

      // (Tùy chọn) Ghi log
      // logAudit("CREATE_FACILITY", req.user._id, req, { facilityId: facility._id });

      res.status(201).json({ success: true, data: facility });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * BE: GET /api/facilities
 * Lấy danh sách cơ sở (Public, có filter)
 */
router.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter
    const query = {};
    // Xử lý filter theo type/types
    if (req.query.types) {
      // Hỗ trợ filter theo nhiều types (types=a,b,c)
      const typesArray = Array.isArray(req.query.types) 
        ? req.query.types 
        : req.query.types.split(',').map(t => t.trim()).filter(t => t);
      if (typesArray.length > 0) {
        query.types = { $in: typesArray };
      }
    } else if (req.query.type) {
      // Tìm kiếm facilities có types chứa type được chỉ định
      query.types = { $in: [req.query.type] };
    }
    if (req.query.address) {
      // Tìm kiếm address với pattern chính xác hơn
      // Escape special regex characters
      const addressPattern = req.query.address
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special regex characters
      
      // Tối ưu pattern để tránh match sai:
      // - "Quận 1" không match "Quận 10", "Quận 11"
      // - Match "Quận 1" trong "123, Quận 1, Hà Nội", "Quận 1, Hà Nội"
      // Pattern: match ở đầu string, sau dấu phẩy/dấu cách, hoặc không có số trước
      // Và kết thúc bằng dấu phẩy/dấu cách, cuối string, hoặc không có số sau
      // Điều này đảm bảo "Quận 1" không match "Quận 10" (vì có số 0 sau)
      const regexPattern = `(^|[, ]|[^0-9])${addressPattern}([, ]|[^0-9]|$)`;
      query.address = { $regex: regexPattern, $options: "i" };
    }
    if (req.query.ownerId) {
      query.owner = req.query.ownerId;
    }

    query.status = "opening"; // Mặc định chỉ lấy sân đang mở

    // Tìm kiếm theo khoảng cách nếu có tọa độ
    let hasLocationFilter = false;
    let locationQuery = {};
    if (req.query.lat && req.query.lng) {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      const maxDistance = parseFloat(req.query.maxDistance) || 10000; // mặc định 10km (meters)

      hasLocationFilter = true;
      
      // For find() - use $near (automatically sorts by distance)
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat]
          },
          $maxDistance: maxDistance
        }
      };

      // For countDocuments() - use $geoWithin (doesn't require sorting)
      // Create a bounding circle using $centerSphere
      const radiusInRadians = maxDistance / 6378100; // Earth radius in meters
      locationQuery = {
        location: {
          $geoWithin: {
            $centerSphere: [[lng, lat], radiusInRadians]
          }
        }
      };
    }

    let queryBuilder = Facility.find(query)
      .populate("owner", "name email avatar");

    // Sort theo khoảng cách nếu tìm theo vị trí, không thì sort theo createdAt
    // Note: $near automatically sorts by distance, so we don't need to add sort
    if (!hasLocationFilter) {
      queryBuilder.sort({ createdAt: -1 });
    }

    const facilities = await queryBuilder
      .skip(skip)
      .limit(limit);

    // For count, use locationQuery if we have location filter, otherwise use the same query
    // Note: countDocuments doesn't support $near, so we use $geoWithin instead
    let countQuery = { ...query };
    if (hasLocationFilter) {
      // Remove $near from query and use $geoWithin for count
      delete countQuery.location;
      countQuery = { ...countQuery, ...locationQuery };
    }
    const total = await Facility.countDocuments(countQuery);

    // Get facility IDs
    const facilityIds = facilities.map(f => f._id);

    // Calculate average ratings for all facilities in one aggregation (only if there are facilities)
    let ratingMap = new Map();
    if (facilityIds.length > 0) {
      const ratingResults = await Review.aggregate([
        {
          $match: {
            facility: { $in: facilityIds },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: "$facility",
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ]);

      // Create a map of facilityId -> rating stats
      ratingResults.forEach((result) => {
        ratingMap.set(result._id.toString(), {
          averageRating: Math.round(result.averageRating * 10) / 10,
          totalReviews: result.totalReviews,
        });
      });
    }

    // Add averageRating to each facility
    const facilitiesWithRatings = facilities.map((facility) => {
      const ratingData = ratingMap.get(facility._id.toString());
      return {
        ...facility.toObject(),
        averageRating: ratingData?.averageRating || 0,
        totalReviews: ratingData?.totalReviews || 0,
      };
    });

    res.json({
      success: true,
      data: {
        facilities: facilitiesWithRatings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * BE: GET /api/facilities/featured
 * Lấy danh sách sân thể thao nổi bật (Public)
 * Sort theo rating, limit 4
 */
router.get("/featured", async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 4;

    // Lấy tất cả facilities đang mở
    const facilities = await Facility.find({ status: "opening" })
      .populate("owner", "name email avatar")
      .limit(100); // Lấy nhiều hơn để tính rating, sau đó sort và limit

    // Get facility IDs
    const facilityIds = facilities.map(f => f._id);

    // Calculate average ratings for all facilities
    let ratingMap = new Map();
    if (facilityIds.length > 0) {
      const ratingResults = await Review.aggregate([
        {
          $match: {
            facility: { $in: facilityIds },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: "$facility",
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ]);

      // Create a map of facilityId -> rating stats
      ratingResults.forEach((result) => {
        ratingMap.set(result._id.toString(), {
          averageRating: Math.round(result.averageRating * 10) / 10,
          totalReviews: result.totalReviews,
        });
      });
    }

    // Add averageRating to each facility and sort by rating
    const facilitiesWithRatings = facilities
      .map((facility) => {
        const ratingData = ratingMap.get(facility._id.toString());
        return {
          ...facility.toObject(),
          averageRating: ratingData?.averageRating || 0,
          totalReviews: ratingData?.totalReviews || 0,
        };
      })
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, limit);

    res.json({
      success: true,
      data: {
        facilities: facilitiesWithRatings,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * BE: GET /api/facilities/recent
 * Lấy danh sách sân thể thao gần đây (Public)
 * Sort theo createdAt, limit 8
 */
router.get("/recent", async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const skip = parseInt(req.query.skip) || 0;

    // Lấy facilities đang mở, sort theo createdAt mới nhất
    const facilities = await Facility.find({ status: "opening" })
      .populate("owner", "name email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get facility IDs
    const facilityIds = facilities.map(f => f._id);

    // Calculate average ratings for all facilities
    let ratingMap = new Map();
    if (facilityIds.length > 0) {
      const ratingResults = await Review.aggregate([
        {
          $match: {
            facility: { $in: facilityIds },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: "$facility",
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ]);

      // Create a map of facilityId -> rating stats
      ratingResults.forEach((result) => {
        ratingMap.set(result._id.toString(), {
          averageRating: Math.round(result.averageRating * 10) / 10,
          totalReviews: result.totalReviews,
        });
      });
    }

    // Add averageRating to each facility
    const facilitiesWithRatings = facilities.map((facility) => {
      const ratingData = ratingMap.get(facility._id.toString());
      return {
        ...facility.toObject(),
        averageRating: ratingData?.averageRating || 0,
        totalReviews: ratingData?.totalReviews || 0,
      };
    });

    res.json({
      success: true,
      data: {
        facilities: facilitiesWithRatings,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * BE: GET /api/facilities/popular-cities
 * Lấy top 6 thành phố có nhiều cơ sở nhất (Public)
 */
router.get("/popular-cities", async (req, res, next) => {
  try {
    // Sử dụng aggregation để group theo thành phố và đếm số lượng facilities
    const popularCitiesRaw = await Facility.aggregate([
      {
        $match: {
          status: "opening", // Chỉ lấy các cơ sở đang mở
        },
      },
      {
        $project: {
          // Extract thành phố từ address (thường là phần cuối sau dấu phẩy cuối)
          // Format address thường: "Số nhà, Đường, Quận/Huyện, Thành phố"
          fullCity: {
            $trim: {
              input: {
                $arrayElemAt: [
                  {
                    $split: ["$address", ","],
                  },
                  -1, // Lấy phần tử cuối cùng (thành phố đầy đủ)
                ],
              },
            },
          },
        },
      },
      {
        $group: {
          _id: "$fullCity",
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gt: 0 }, // Chỉ lấy các thành phố có ít nhất 1 cơ sở
        },
      },
      {
        $sort: { count: -1 }, // Sort theo số lượng giảm dần
      },
      {
        $limit: 6, // Chỉ lấy top 6
      },
    ]);

    // Normalize tên thành phố (loại bỏ "Thành phố", "TP.", "Tỉnh" prefix)
    const normalizeCityName = (cityName) => {
      if (!cityName) return "";
      return cityName
        .replace(/^Thành phố\s+/i, "")
        .replace(/^TP\.\s*/i, "")
        .replace(/^Tỉnh\s+/i, "")
        .trim();
    };

    const popularCities = popularCitiesRaw.map((city) => ({
      name: normalizeCityName(city._id),
      fullName: city._id,
      count: city.count,
    }));

    res.json({
      success: true,
      data: popularCities,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * BE: GET /api/facilities/:id
 * Chi tiết cơ sở (Public)
 */
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy cơ sở" });
    }

    const facility = await Facility.findById(req.params.id).populate(
      "owner",
      "name email avatar"
    );

    if (!facility) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy cơ sở" });
    }

    res.json({ success: true, data: facility });
  } catch (error) {
    next(error);
  }
});

/**
 * BE: PUT /api/facilities/:id
 * Cập nhật cơ sở (Chỉ Owner sở hữu)
 */
router.put(
  "/:id",
  authenticateToken,
  checkOwnership, // Middleware kiểm tra đúng chủ sở hữu
  autoGeocode, // Middleware tự động lấy tọa độ từ địa chỉ
  async (req, res, next) => {
    try {
      // Không cho phép cập nhật owner
      delete req.body.owner;

      const updatedFacility = await Facility.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate("owner", "name email avatar");

      // (Tùy chọn) Ghi log
      // logAudit("UPDATE_FACILITY", req.user._id, req, { facilityId: updatedFacility._id });

      res.json({
        success: true,
        message: "Cập nhật cơ sở thành công",
        data: updatedFacility,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * BE: DELETE /api/facilities/:id
 * Xóa cơ sở (Owner sở hữu hoặc Admin)
 */
router.delete(
  "/:id",
  authenticateToken,
  checkOwnershipOrAdmin, // Middleware kiểm tra chủ sở hữu HOẶC Admin
  async (req, res, next) => {
    try {
      await Facility.findByIdAndDelete(req.params.id);

      // (Tùy chọn) Ghi log
      // logAudit("DELETE_FACILITY", req.user._id, req, { facilityId: req.params.id });

      res.json({ success: true, message: "Xóa cơ sở thành công" });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * BE: POST /api/facilities/:id/upload
 * Upload ảnh cho cơ sở (Tối đa 5 ảnh, chỉ Owner)
 */
router.post(
  "/:id/upload",
  authenticateToken,
  checkOwnership,
  uploadFacilityImage.array("images", 5), // Tối đa 5 ảnh
  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng chọn ít nhất 1 ảnh",
        });
      }

      // Lấy danh sách ảnh hiện tại
      const facility = await Facility.findById(req.params.id);
      const currentImages = facility.images || [];

      // Tạo mảng ảnh mới từ req.files
      const newImages = req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));

      // Kiểm tra tổng số ảnh không vượt quá 5
      const totalImages = currentImages.length + newImages.length;
      if (totalImages > 5) {
        // Xóa các ảnh mới upload trên Cloudinary
        for (const img of newImages) {
          await cloudinaryUtils.deleteImage(img.publicId);
        }
        return res.status(400).json({
          success: false,
          message: "Tổng số ảnh không được vượt quá 5",
        });
      }

      // Cập nhật facility với ảnh mới
      facility.images = [...currentImages, ...newImages];
      await facility.save();

      res.json({
        success: true,
        message: "Upload ảnh thành công",
        data: facility,
      });
    } catch (error) {
      // Nếu có lỗi, xóa các ảnh đã upload trên Cloudinary
      if (req.files) {
        for (const file of req.files) {
          try {
            await cloudinaryUtils.deleteImage(file.filename);
          } catch (deleteError) {
            console.error("Error cleaning up uploaded files:", deleteError);
          }
        }
      }
      next(error);
    }
  }
);

/**
 * BE: DELETE /api/facilities/:id/images/:imageId
 * Xóa ảnh khỏi cơ sở (chỉ Owner)
 */
router.delete(
  "/:id/images/:imageId",
  authenticateToken,
  checkOwnership,
  async (req, res, next) => {
    try {
      const facility = await Facility.findById(req.params.id);
      if (!facility) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy cơ sở",
        });
      }

      const imageToDelete = facility.images.id(req.params.imageId);
      if (!imageToDelete) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy ảnh",
        });
      }

      // Xóa ảnh trên Cloudinary
      if (imageToDelete.publicId) {
        try {
          await cloudinaryUtils.deleteImage(imageToDelete.publicId);
        } catch (deleteError) {
          console.error("Error deleting image from Cloudinary:", deleteError);
        }
      }

      // Xóa ảnh khỏi mảng
      facility.images.pull(req.params.imageId);
      await facility.save();

      res.json({
        success: true,
        message: "Xóa ảnh thành công",
      });
    } catch (error) {
      next(error);
    }
  }
);

// === ADMIN ONLY ROUTES ===

/**
 * BE: GET /api/facilities/admin/all
 * Lấy tất cả cơ sở với filters và pagination (chỉ Admin)
 */
router.get(
  "/admin/all",
  authenticateToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = {};

      // Status filter
      if (req.query.status) {
        filter.status = req.query.status;
      }

      // Search functionality
      if (req.query.search) {
        const searchTerm = req.query.search.trim();
        filter.$or = [
          { name: { $regex: searchTerm, $options: "i" } },
          { address: { $regex: searchTerm, $options: "i" } },
          { phoneNumber: { $regex: searchTerm, $options: "i" } },
        ];
      }

      // City/Province filter (từ address)
      if (req.query.city && req.query.city !== "all") {
        filter.address = { $regex: req.query.city, $options: "i" };
      }

      // District filter (từ address)
      if (req.query.district && req.query.district !== "all") {
        if (filter.address && typeof filter.address === "object") {
          // Nếu đã có city filter, combine với district
          filter.$and = [
            { address: filter.address },
            { address: { $regex: req.query.district, $options: "i" } },
          ];
          delete filter.address;
        } else {
          filter.address = { $regex: req.query.district, $options: "i" };
        }
      }

      // Sport filter (từ types)
      if (req.query.sport && req.query.sport !== "all") {
        filter.types = { $in: [req.query.sport] };
      }

      // Date filter (createdAt)
      if (req.query.date) {
        const specificDate = new Date(req.query.date);
        specificDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(specificDate);
        nextDay.setDate(nextDay.getDate() + 1);
        filter.createdAt = { $gte: specificDate, $lt: nextDay };
      } else if (req.query.startDate && req.query.endDate) {
        const startDate = new Date(req.query.startDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt = { $gte: startDate, $lte: endDate };
      }

      // Fetch facilities
      const facilities = await Facility.find(filter)
        .populate("owner", "name email phone avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Facility.countDocuments(filter);

      // Get stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayCount = await Facility.countDocuments({
        ...filter,
        createdAt: { $gte: today, $lt: tomorrow },
      });

      const pendingCount = await Facility.countDocuments({
        ...filter,
        status: "pending",
      });

      const activeCount = await Facility.countDocuments({
        ...filter,
        status: "opening",
      });

      res.json({
        success: true,
        data: {
          facilities,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
          stats: {
            total,
            today: todayCount,
            pending: pendingCount,
            active: activeCount,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * BE: PUT /api/facilities/:id/approve
 * Duyệt cơ sở (chỉ Admin)
 */
router.put(
  "/:id/approve",
  authenticateToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy cơ sở",
        });
      }

      const facility = await Facility.findById(req.params.id);
      if (!facility) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy cơ sở",
        });
      }

      facility.status = "opening";
      await facility.save();

      await logAudit(
        "APPROVE_FACILITY",
        req.user._id,
        req,
        {
          facilityId: facility._id,
          facilityName: facility.name,
        }
      );

      res.json({
        success: true,
        message: "Duyệt cơ sở thành công",
        data: facility,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * BE: PUT /api/facilities/:id/reject
 * Từ chối cơ sở (chỉ Admin)
 */
router.put(
  "/:id/reject",
  authenticateToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy cơ sở",
        });
      }

      const facility = await Facility.findById(req.params.id);
      if (!facility) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy cơ sở",
        });
      }

      const { reason } = req.body;

      facility.status = "closed";
      await facility.save();

      await logAudit(
        "REJECT_FACILITY",
        req.user._id,
        req,
        {
          facilityId: facility._id,
          facilityName: facility.name,
          reason: reason || null,
        }
      );

      res.json({
        success: true,
        message: "Từ chối cơ sở thành công",
        data: facility,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/facilities/:id/tournament-fee-config
 * Lấy cấu hình phí giải đấu từ owner của facility (Public)
 */
router.get("/:id/tournament-fee-config", async (req, res, next) => {
  try {
    const facilityId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(facilityId)) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cơ sở",
      });
    }

    // Tìm facility và populate owner
    const facility = await Facility.findById(facilityId).populate("owner", "_id");
    
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cơ sở",
      });
    }

    if (!facility.owner) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chủ sở hữu cơ sở",
      });
    }

    // Lấy cấu hình phí từ owner
    const owner = await User.findById(facility.owner._id || facility.owner).select("tournamentFeeConfig");
    
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chủ sở hữu",
      });
    }

    // Trả về cấu hình hoặc giá trị mặc định
    const rawConfig = owner.tournamentFeeConfig || {
      registrationFee: 0,
      internalTournamentFees: {
        serviceFee: 0,
        courtTypeFees: new Map(),
        refereeFee: 0,
      },
    };

    // Build config object manually để đảm bảo Map được convert đúng
    const config = {
      registrationFee: rawConfig.registrationFee || 0,
      internalTournamentFees: {
        serviceFee: rawConfig.internalTournamentFees?.serviceFee || 0,
        refereeFee: rawConfig.internalTournamentFees?.refereeFee || 0,
        courtTypeFees: {}
      }
    };

    // Convert Map to Object - xử lý cả Map instance và plain object từ MongoDB
    const rawCourtTypeFees = rawConfig.internalTournamentFees?.courtTypeFees;
    if (rawCourtTypeFees) {
      if (rawCourtTypeFees instanceof Map) {
        // Nếu là Map instance, convert sang Object
        config.internalTournamentFees.courtTypeFees = Object.fromEntries(
          rawCourtTypeFees
        );
      } else if (typeof rawCourtTypeFees === 'object' && 
                 rawCourtTypeFees !== null &&
                 !Array.isArray(rawCourtTypeFees)) {
        // Nếu đã là plain object (sau khi load từ MongoDB), giữ nguyên
        config.internalTournamentFees.courtTypeFees = rawCourtTypeFees;
      }
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

import asyncHandler from "express-async-handler";
import Service from "../models/Service.js";
import SportCategory from "../models/SportCategory.js";

// Owner: Lấy tất cả dịch vụ của owner
export const getAllServices = asyncHandler(async (req, res) => {
  const { type, isActive } = req.query;

  const query = { owner: req.user._id };

  if (type) {
    query.type = type;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === "true" || isActive === true;
  }

  const services = await Service.find(query)
    .populate("sportCategory", "name")
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    data: services,
  });
});

// Owner: Tạo dịch vụ mới
export const createService = asyncHandler(async (req, res) => {
  const { name, description, price, type, sportCategory, image, isActive } =
    req.body;

  if (!name || !price || !type) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng điền đầy đủ thông tin bắt buộc (tên, giá, loại)",
    });
  }

  // Validate sportCategory for EQUIPMENT type
  if (type === "EQUIPMENT" && !sportCategory) {
    return res.status(400).json({
      success: false,
      message: "Dịch vụ thuê dụng cụ cần chọn môn thể thao",
    });
  }

  // Validate sportCategory exists if provided
  if (sportCategory) {
    const category = await SportCategory.findById(sportCategory);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Môn thể thao không tồn tại",
      });
    }
  }

  const service = await Service.create({
    name,
    description,
    price: parseFloat(price),
    type,
    sportCategory: type === "EQUIPMENT" ? sportCategory : null,
    owner: req.user._id,
    image: image || null,
    isActive: isActive !== undefined ? isActive : true,
  });

  const populatedService = await Service.findById(service._id).populate(
    "sportCategory",
    "name"
  );

  res.json({
    success: true,
    message: "Tạo dịch vụ thành công",
    data: populatedService,
  });
});

// Owner: Cập nhật dịch vụ
export const updateService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, price, type, sportCategory, image, isActive } =
    req.body;

  const service = await Service.findById(id);

  if (!service) {
    return res.status(404).json({
      success: false,
      message: "Dịch vụ không tồn tại",
    });
  }

  // Check ownership
  if (service.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền chỉnh sửa dịch vụ này",
    });
  }

  // Validate sportCategory for EQUIPMENT type
  if (type === "EQUIPMENT" && !sportCategory) {
    return res.status(400).json({
      success: false,
      message: "Dịch vụ thuê dụng cụ cần chọn môn thể thao",
    });
  }

  // Validate sportCategory exists if provided
  if (sportCategory) {
    const category = await SportCategory.findById(sportCategory);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Môn thể thao không tồn tại",
      });
    }
  }

  // Update fields
  if (name !== undefined) service.name = name;
  if (description !== undefined) service.description = description;
  if (price !== undefined) service.price = parseFloat(price);
  if (type !== undefined) {
    service.type = type;
    // Reset sportCategory if type is not EQUIPMENT
    if (type !== "EQUIPMENT") {
      service.sportCategory = null;
    } else if (sportCategory) {
      service.sportCategory = sportCategory;
    }
  }
  if (sportCategory !== undefined && type === "EQUIPMENT") {
    service.sportCategory = sportCategory;
  }
  if (image !== undefined) service.image = image;
  if (isActive !== undefined) service.isActive = isActive;

  await service.save();

  const populatedService = await Service.findById(service._id).populate(
    "sportCategory",
    "name"
  );

  res.json({
    success: true,
    message: "Cập nhật dịch vụ thành công",
    data: populatedService,
  });
});

// Owner: Xóa dịch vụ
export const deleteService = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const service = await Service.findById(id);

  if (!service) {
    return res.status(404).json({
      success: false,
      message: "Dịch vụ không tồn tại",
    });
  }

  // Check ownership
  if (service.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền xóa dịch vụ này",
    });
  }

  await Service.findByIdAndDelete(id);

  res.json({
    success: true,
    message: "Xóa dịch vụ thành công",
  });
});

// Owner: Toggle active status
export const toggleActive = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const service = await Service.findById(id);

  if (!service) {
    return res.status(404).json({
      success: false,
      message: "Dịch vụ không tồn tại",
    });
  }

  // Check ownership
  if (service.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền thay đổi trạng thái dịch vụ này",
    });
  }

  service.isActive = !service.isActive;
  await service.save();

  const populatedService = await Service.findById(service._id).populate(
    "sportCategory",
    "name"
  );

  res.json({
    success: true,
    message: service.isActive
      ? "Đã kích hoạt dịch vụ"
      : "Đã vô hiệu hóa dịch vụ",
    data: populatedService,
  });
});

// Public: Lấy dịch vụ theo facility (qua owner của facility)
export const getServicesByFacility = asyncHandler(async (req, res) => {
  const { facilityId } = req.params;
  const { type, sportCategory } = req.query;

  // Import Facility model
  const Facility = (await import("../models/Facility.js")).default;

  // Get facility to find owner
  const facility = await Facility.findById(facilityId);
  if (!facility) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy cơ sở",
    });
  }

  // Build query
  const query = { 
    owner: facility.owner,
    isActive: true // Chỉ lấy dịch vụ đang hoạt động
  };

  if (type) {
    query.type = type;
  }

  if (sportCategory) {
    query.sportCategory = sportCategory;
  }

  const services = await Service.find(query)
    .populate("sportCategory", "name")
    .sort({ type: 1, createdAt: -1 })
    .lean();

  res.json({
    success: true,
    data: services,
  });
});


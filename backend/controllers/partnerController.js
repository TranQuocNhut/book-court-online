import PartnerApplication from "../models/PartnerApplication.js";
import User from "../models/User.js";
import { logAudit } from "../utils/auditLogger.js";
import asyncHandler from "express-async-handler";

/**
 * POST /api/partner-applications
 * Tạo đơn đăng ký đối tác
 */
export const createPartnerApplication = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;
  const userId = req.user._id;

  // Validation
  if (!name || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng điền đầy đủ thông tin",
    });
  }

  // Kiểm tra user đã có đơn đăng ký pending chưa
  const existingPending = await PartnerApplication.findOne({
    user: userId,
    status: "pending",
  });

  if (existingPending) {
    return res.status(400).json({
      success: false,
      message: "Bạn đã có đơn đăng ký đang chờ duyệt",
    });
  }

  // Kiểm tra user đã là owner chưa
  const user = await User.findById(userId);
  if (user.role === "owner") {
    return res.status(400).json({
      success: false,
      message: "Bạn đã là đối tác rồi",
    });
  }

  // Tạo đơn đăng ký
  const application = new PartnerApplication({
    user: userId,
    name,
    email,
    phone,
    status: "pending",
  });

  await application.save();

  // Populate user để trả về
  await application.populate("user", "name email phone avatar");

  await logAudit("CREATE_PARTNER_APPLICATION", userId, req, {
    applicationId: application._id,
  });

  res.status(201).json({
    success: true,
    message: "Đơn đăng ký đã được gửi thành công. Chúng tôi sẽ liên hệ với bạn sớm nhất.",
    data: application,
  });
});

/**
 * GET /api/partner-applications/admin/all
 * Lấy tất cả đơn đăng ký đối tác (chỉ Admin)
 */
export const getAllPartnerApplications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Filter
  const filter = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Search
  if (req.query.search) {
    const searchTerm = req.query.search.trim();
    filter.$or = [
      { name: { $regex: searchTerm, $options: "i" } },
      { email: { $regex: searchTerm, $options: "i" } },
      { phone: { $regex: searchTerm, $options: "i" } },
    ];
  }

  // Fetch applications
  const applications = await PartnerApplication.find(filter)
    .populate("user", "name email phone avatar role")
    .populate("reviewedBy", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await PartnerApplication.countDocuments(filter);

  // Stats
  const pendingCount = await PartnerApplication.countDocuments({
    ...filter,
    status: "pending",
  });

  res.json({
    success: true,
    data: {
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total,
        pending: pendingCount,
      },
    },
  });
});

/**
 * PUT /api/partner-applications/:id/approve
 * Duyệt đơn đăng ký đối tác (chỉ Admin)
 */
export const approvePartnerApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user._id;

  const application = await PartnerApplication.findById(id).populate("user");

  if (!application) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy đơn đăng ký",
    });
  }

  if (application.status !== "pending") {
    return res.status(400).json({
      success: false,
      message: "Đơn đăng ký này đã được xử lý",
    });
  }

  // Cập nhật role của user thành "owner"
  const user = await User.findById(application.user._id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy người dùng",
    });
  }

  user.role = "owner";
  await user.save();

  // Cập nhật trạng thái đơn đăng ký
  application.status = "approved";
  application.reviewedBy = adminId;
  application.reviewedAt = new Date();
  await application.save();

  await logAudit("APPROVE_PARTNER_APPLICATION", adminId, req, {
    applicationId: application._id,
    userId: user._id,
  });

  res.json({
    success: true,
    message: "Duyệt đơn đăng ký và cấp quyền Owner thành công",
    data: application,
  });
});

/**
 * PUT /api/partner-applications/:id/reject
 * Từ chối đơn đăng ký đối tác (chỉ Admin)
 */
export const rejectPartnerApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user._id;

  const application = await PartnerApplication.findById(id);

  if (!application) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy đơn đăng ký",
    });
  }

  if (application.status !== "pending") {
    return res.status(400).json({
      success: false,
      message: "Đơn đăng ký này đã được xử lý",
    });
  }

  // Cập nhật trạng thái đơn đăng ký
  application.status = "rejected";
  application.rejectionReason = reason || null;
  application.reviewedBy = adminId;
  application.reviewedAt = new Date();
  await application.save();

  await logAudit("REJECT_PARTNER_APPLICATION", adminId, req, {
    applicationId: application._id,
    reason: reason || null,
  });

  res.json({
    success: true,
    message: "Từ chối đơn đăng ký thành công",
    data: application,
  });
});


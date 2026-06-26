// routes/league.js
import express from "express";
import mongoose from "mongoose";
import League from "../models/League.js";
import Facility from "../models/Facility.js";
import Court from "../models/Court.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import CourtType from "../models/CourtType.js";
import {
  authenticateToken,
  requireAdmin,
  authorize,
} from "../middleware/auth.js";
import { logAudit } from "../utils/auditLogger.js";
import { uploadLeagueImage, uploadTeamLogo, cloudinaryUtils } from "../config/cloudinary.js";
import ExcelJS from "exceljs";
import multer from "multer";
import { 
  extractSheetId, 
  getSheetData, 
  getSheetNames,
  parseTeamsFromRows,
  parseMembersFromRows 
} from "../utils/googleSheetsService.js";
import { debit } from "../utils/walletService.js";
import { createNotification } from "../utils/notificationService.js";
import { emitToUser } from "../socket/index.js";
import { isSlotLocked } from "../socket/bookingSocket.js";
import asyncHandler from "express-async-handler";

const router = express.Router();

// Public route để lấy danh sách giải đấu public (không cần đăng nhập)
/**
 * GET /api/leagues/public
 * Lấy danh sách giải đấu công khai
 * Public (không cần đăng nhập)
 */
router.get("/public", async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      sport, 
      format,
      search,
      sort = 'createdAt' // createdAt, views, startDate
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    // Lấy giải đấu PUBLIC và:
    // - Đã được approve (approvalStatus: "approved")
    // - Hoặc chưa có approvalStatus (null) - giải không cần duyệt
    // - Hoặc có approvalStatus: "pending" nhưng không có facility (owner tự tạo, không cần duyệt)
    const query = {
      type: "PUBLIC",
      $or: [
        { approvalStatus: "approved" },
        { approvalStatus: null },
        { 
          approvalStatus: "pending",
          facility: null // Giải do owner tạo không có facility (tự quản lý)
        }
      ]
    };
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by sport
    if (sport && sport !== 'all') {
      query.sport = sport;
    }
    
    // Filter by format
    if (format && format !== 'all') {
      const formatMapping = {
        'single-elimination': 'Loại Trực Tiếp',
        'round-robin': 'Vòng tròn',
        'knockout': 'Loại Trực Tiếp'
      };
      query.format = formatMapping[format] || format;
    }
    
    // Search by name
    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }
    
    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'views':
        sortOption = { views: -1 };
        break;
      case 'startDate':
        sortOption = { startDate: 1 };
        break;
      case 'updated':
        sortOption = { updatedAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
    
    const leagues = await League.find(query)
      .populate("creator", "name email avatar")
      .populate("facility", "name address")
      .select("-teams -matches") // Không trả về teams và matches để giảm dữ liệu
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await League.countDocuments(query);
    
    res.json({
      success: true,
      data: leagues,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/leagues/:id/register/template
 * Tải file mẫu Excel để thêm thành viên khi đăng ký
 * Public (cần đăng nhập)
 */
router.get("/:id/register/template", authenticateToken, async (req, res, next) => {
  try {
    const league = await League.findById(req.params.id);
    if (!league) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giải đấu",
      });
    }

    const isFootball = league.sport === 'Bóng đá';
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách thành viên');

    // Định nghĩa cột dựa trên môn thể thao
    if (isFootball) {
      worksheet.columns = [
        { header: 'Số áo', key: 'jerseyNumber', width: 15 },
        { header: 'Họ tên đầy đủ', key: 'name', width: 30 },
        { header: 'Số điện thoại', key: 'phone', width: 20 },
        { header: 'Vị trí thi đấu', key: 'position', width: 25 }
      ];
    } else {
      worksheet.columns = [
        { header: 'Họ tên đầy đủ', key: 'name', width: 30 },
        { header: 'Số điện thoại', key: 'phone', width: 20 },
        { header: 'Vị trí thi đấu', key: 'position', width: 25 }
      ];
    }

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Thêm dữ liệu mẫu
    if (isFootball) {
      worksheet.addRow(['1', 'Nguyễn Văn A', '0123456789', 'Thủ môn']);
      worksheet.addRow(['2', 'Trần Thị B', '0987654321', 'Hậu vệ']);
      worksheet.addRow(['3', 'Lê Văn C', '0111222333', 'Tiền vệ']);
      worksheet.addRow(['4', 'Phạm Thị D', '0444555666', 'Tiền đạo']);
    } else {
      worksheet.addRow(['Nguyễn Văn A', '0123456789', 'Khác']);
      worksheet.addRow(['Trần Thị B', '0987654321', 'Khác']);
      worksheet.addRow(['Lê Văn C', '0111222333', 'Khác']);
      worksheet.addRow(['Phạm Thị D', '0444555666', 'Khác']);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="mau-danh-sach-thanh-vien.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/leagues/:id/register
 * Đăng ký tham gia giải đấu (tạo đội mới)
 * Public (cần đăng nhập)
 */
router.post("/:id/register", authenticateToken, async (req, res, next) => {
  try {
    const leagueId = req.params.id;
    const userId = req.user._id;
    const { teamData, members } = req.body;

    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giải đấu",
      });
    }

    // Kiểm tra giải đấu có cho phép đăng ký không
    if (!league.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: "Giải đấu không cho phép đăng ký",
      });
    }

    // So sánh đến cuối ngày hết hạn (23:59:59)
    const deadlineDate = new Date(league.registrationDeadline);
    deadlineDate.setHours(23, 59, 59, 999); // Set về cuối ngày
    if (deadlineDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Đã hết hạn đăng ký",
      });
    }

    // Kiểm tra số đội đã đăng ký
    if (league.participants >= league.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: "Giải đấu đã đủ số đội tham gia",
      });
    }

    // Kiểm tra user đã đăng ký chưa
    const existingTeam = league.teams.find(team => 
      team.contactPhone === teamData.contactPhone || 
      (team.members && team.members.some(m => m.phone === teamData.contactPhone))
    );

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã đăng ký tham gia giải đấu này",
      });
    }

    // Tạo team ID mới
    const newTeamId = league.teams.length > 0 
      ? Math.max(...league.teams.map(t => t.id || 0)) + 1 
      : 1;

    // Tạo đội mới
    const newTeam = {
      id: newTeamId,
      teamNumber: teamData.teamNumber || `#${newTeamId}`,
      contactPhone: teamData.contactPhone || '',
      contactName: teamData.contactName || '',
      logo: null,
      logoPublicId: null,
      registrationStatus: "pending", // Mặc định là đang xét
      registeredAt: new Date(),
      wins: 0,
      draws: 0,
      losses: 0,
      members: members || []
    };

    // Thêm đội vào danh sách
    league.teams.push(newTeam);
    league.participants = league.teams.length;

    await league.save();

    // Log audit
    await logAudit(
      "REGISTER_TO_LEAGUE",
      userId,
      req,
      {
        leagueId: leagueId,
        leagueName: league.name,
        teamId: newTeamId,
        teamName: teamData.teamNumber
      }
    );

    res.json({
      success: true,
      message: "Đăng ký tham gia giải đấu thành công",
      data: {
        team: newTeam,
        league: league
      }
    });
  } catch (error) {
    next(error);
  }
});

// Tất cả các route ở đây đều yêu cầu đăng nhập
router.use(authenticateToken);

// Cấu hình multer cho upload file Excel
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV'));
    }
  }
});

/**
 * POST /api/leagues/:id/register/parse-members
 * Parse Excel file để lấy danh sách thành viên khi đăng ký
 * Public (cần đăng nhập)
 */
router.post("/:id/register/parse-members", authenticateToken, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Không có file được upload",
      });
    }

    const league = await League.findById(req.params.id);
    if (!league) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giải đấu",
      });
    }

    const isFootball = league.sport === 'Bóng đá';
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet(1) || workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({
        success: false,
        message: "File Excel không hợp lệ",
      });
    }

    const members = [];
    const minMembers = league.membersPerTeam || 0;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      let member = {
        name: '',
        phone: '',
        position: '',
        jerseyNumber: '',
        avatar: null
      };

      if (isFootball) {
        const jerseyNumber = row.getCell(1).value?.toString()?.trim() || '';
        const name = row.getCell(2).value?.toString()?.trim() || '';
        const phone = row.getCell(3).value?.toString()?.trim() || '';
        const position = row.getCell(4).value?.toString()?.trim() || '';

        if (name) {
          member.jerseyNumber = jerseyNumber;
          member.name = name;
          member.phone = phone;
          member.position = position;
          members.push(member);
        }
      } else {
        const name = row.getCell(1).value?.toString()?.trim() || '';
        const phone = row.getCell(2).value?.toString()?.trim() || '';
        const position = row.getCell(3).value?.toString()?.trim() || '';

        if (name) {
          member.name = name;
          member.phone = phone;
          member.position = position;
          members.push(member);
        }
      }
    });

    if (members.length === 0) {
      return res.status(400).json({
        success: false,
        message: "File không chứa dữ liệu hợp lệ",
      });
    }

    if (members.length < minMembers) {
      return res.status(400).json({
        success: false,
        message: `Cần ít nhất ${minMembers} thành viên. File chỉ có ${members.length} thành viên.`,
      });
    }

    res.json({
      success: true,
      data: members,
      message: `Đã parse ${members.length} thành viên từ file`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Middleware kiểm tra quyền sở hữu (Chỉ người tạo giải đấu)
 */
const checkOwnership = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giải đấu",
      });
    }

    const league = await League.findById(req.params.id);

    if (!league) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giải đấu",
      });
    }

    // Kiểm tra xem user có phải là người tạo không
    if (league.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập",
      });
    }

    req.league = league; // Gán league vào request để dùng ở route sau
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware kiểm tra quyền sở hữu hoặc admin
 */
const checkOwnershipOrAdmin = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giải đấu",
      });
    }

    const league = await League.findById(req.params.id);

    if (!league) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giải đấu",
      });
    }

    // Kiểm tra xem user có phải là người tạo hoặc admin không
    const isOwner = league.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập",
      });
    }

    req.league = league;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/leagues
 * Lấy danh sách tất cả giải đấu nội bộ của người dùng
 * User
 */
router.get("/", async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Lấy tất cả giải đấu mà user là người tạo
    const leagues = await League.find({ creator: userId })
      .sort({ createdAt: -1 })
      .select("-teams -matches") // Không trả về teams và matches để giảm dữ liệu
      .lean();

    res.json({
      success: true,
      data: leagues,
      count: leagues.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/leagues/:id
 * Lấy thông tin chi tiết 1 giải đấu
 * User
 */
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giải đấu",
      });
    }

    const league = await League.findById(req.params.id)
      .populate("creator", "name email avatar")
      .populate({
        path: "facility",
        select: "name address owner",
        populate: {
          path: "owner",
          select: "name email _id"
        }
      })
      .populate("courtId", "name")
      .populate("courtType", "_id name")
      .populate("approvedBy", "name email")
      .lean();

    // Populate courtId trong matches (batch query để tối ưu)
    if (league && league.matches && league.matches.length > 0) {
      const courtIds = league.matches
        .map(m => m.courtId)
        .filter(id => id)
        .map(id => typeof id === 'object' && id._id ? id._id : id)
        .filter((id, index, self) => {
          const idStr = id?.toString();
          return idStr && self.findIndex(s => s?.toString() === idStr) === index;
        }); // Remove duplicates
      
      if (courtIds.length > 0) {
        const courts = await Court.find({ _id: { $in: courtIds } })
          .select("name type")
          .lean();
        
        const courtMap = new Map();
        courts.forEach(court => {
          courtMap.set(court._id.toString(), court);
        });
        
        // Map courts back to matches
        league.matches.forEach(match => {
          if (match.courtId) {
            const courtIdStr = typeof match.courtId === 'object' && match.courtId._id
              ? match.courtId._id.toString()
              : match.courtId.toString();
            const court = courtMap.get(courtIdStr);
            if (court) {
              match.courtId = court;
            }
          }
        });
      }
    }

    if (!league) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giải đấu",
      });
    }

    // Tăng số lượt xem
    await League.findByIdAndUpdate(req.params.id, {
      $inc: { views: 1 },
    });

    res.json({
      success: true,
      data: league,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/leagues
 * Tạo giải đấu nội bộ (PRIVATE)
 * User
 */
router.post("/", async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      name,
      format,
      sport,
      phone,
      tournamentType,
      membersPerTeam,
      image,
      banner,
      startDate,
      endDate,
      location,
      address,
      maxParticipants,
      prize,
      description,
      fullDescription,
      registrationDeadline,
      teams,
      matches,
      type, // PUBLIC or PRIVATE
      courtType, // Loại sân được chọn
      // Cấu hình cho vòng tròn
      numRounds,
      winPoints,
      drawPoints,
      lossPoints,
    } = req.body;

    // Validation
    if (!name || !format || !sport || !startDate || !endDate || !maxParticipants) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
    }

    // Kiểm tra ngày hợp lệ
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Ngày kết thúc phải sau ngày bắt đầu",
      });
    }

    // Xác định approvalStatus: tự động duyệt nếu user là owner của facility
    let approvalStatus = undefined;
    let facilityId = req.body.facility || null;
    
    if (facilityId) {
      // Kiểm tra xem user có phải là owner của facility không
      const facility = await Facility.findById(facilityId).lean();
      if (facility) {
        // Nếu user là owner của facility, tự động duyệt
        if (facility.owner && facility.owner.toString() === userId.toString()) {
          approvalStatus = "approved";
          // Lưu thông tin người duyệt (chính owner)
          req.body.approvedBy = userId;
        } else {
          // Nếu không phải owner, chờ duyệt
          approvalStatus = "pending";
        }
      } else {
        // Facility không tồn tại, không set approvalStatus
        approvalStatus = undefined;
      }
    }

    // Tạo giải đấu mới
    const newLeague = new League({
      name,
      creator: userId,
      creatorName: req.user.name || req.user.email,
      phone: phone || null,
      tournamentType: tournamentType || "individual",
      membersPerTeam: membersPerTeam ? parseInt(membersPerTeam) : null,
      format,
      sport,
      courtType: courtType || null, // Lưu loại sân được chọn
      facility: facilityId || null, // Lưu facility ID
      image: image || null,
      banner: banner || image || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location: location || null,
      address: address || null,
      maxParticipants: parseInt(maxParticipants),
      prize: prize || null,
      status: "upcoming",
      description: description || null,
      fullDescription: fullDescription || description || null,
      registrationDeadline: registrationDeadline
        ? new Date(registrationDeadline)
        : null,
      teams: teams || [],
      matches: matches || [],
      type: type || "PRIVATE", // Nhận type từ request body, mặc định là PRIVATE
      approvalStatus: approvalStatus,
      approvedBy: req.body.approvedBy || undefined, // Lưu người duyệt nếu tự động duyệt
      // Cấu hình cho vòng tròn
      numRounds: numRounds || 1,
      winPoints: winPoints !== undefined ? winPoints : 3,
      drawPoints: drawPoints !== undefined ? drawPoints : 1,
      lossPoints: lossPoints !== undefined ? lossPoints : 0,
    });

    await newLeague.save();

    // Log audit
    await logAudit(
      "CREATE_LEAGUE",
      userId,
      req,
      {
        leagueId: newLeague._id,
        leagueName: name,
      }
    );

    // Nếu tự động duyệt (owner tạo giải), log audit
    if (approvalStatus === "approved" && req.body.approvedBy) {
      await logAudit(
        "APPROVE_LEAGUE",
        userId,
        req,
        {
          leagueId: newLeague._id,
          leagueName: name,
          autoApproved: true, // Đánh dấu là tự động duyệt
        }
      );
    }

    res.status(201).json({
      success: true,
      message: approvalStatus === "approved" 
        ? "Tạo và tự động duyệt giải đấu thành công" 
        : "Tạo giải đấu thành công",
      data: newLeague,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0].message,
      });
    }
    next(error);
  }
});

/**
 * PUT /api/leagues/:id
 * Cập nhật thông tin giải đấu
 * User (người tạo)
 */
router.put("/:id", checkOwnership, async (req, res, next) => {
  try {
    const {
      name,
      format,
      sport,
      phone,
      tournamentType,
      membersPerTeam,
      image,
      banner,
      startDate,
      endDate,
      location,
      address,
      maxParticipants,
      prize,
      status,
      description,
      fullDescription,
      registrationDeadline,
      teams,
      matches,
      type, // PUBLIC or PRIVATE
      courtType, // Loại sân được chọn
    } = req.body;

    const updateData = {};

    // Chỉ cập nhật các trường được gửi lên
    if (name !== undefined) updateData.name = name;
    if (format !== undefined) updateData.format = format;
    if (sport !== undefined) updateData.sport = sport;
    if (phone !== undefined) updateData.phone = phone;
    if (tournamentType !== undefined) {
      if (!["team", "individual"].includes(tournamentType)) {
        return res.status(400).json({
          success: false,
          message: "Loại giải đấu không hợp lệ (phải là 'team' hoặc 'individual')",
        });
      }
      updateData.tournamentType = tournamentType;
    }
    if (membersPerTeam !== undefined) {
      const members = parseInt(membersPerTeam);
      if (members < 2 || members > 20) {
        return res.status(400).json({
          success: false,
          message: "Số lượng người mỗi đội phải từ 2 đến 20",
        });
      }
      updateData.membersPerTeam = members;
    }
    if (image !== undefined) updateData.image = image;
    if (banner !== undefined) updateData.banner = banner;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (location !== undefined) updateData.location = location;
    if (address !== undefined) updateData.address = address;
    if (maxParticipants !== undefined)
      updateData.maxParticipants = parseInt(maxParticipants);
    if (prize !== undefined) updateData.prize = prize;
    if (status !== undefined) {
      if (!["upcoming", "ongoing", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Trạng thái không hợp lệ",
        });
      }
      updateData.status = status;
    }
    if (description !== undefined) updateData.description = description;
    if (fullDescription !== undefined)
      updateData.fullDescription = fullDescription;
    if (registrationDeadline !== undefined)
      updateData.registrationDeadline = registrationDeadline
        ? new Date(registrationDeadline)
        : null;
    if (teams !== undefined) updateData.teams = teams;
    if (matches !== undefined) updateData.matches = matches;
    if (type !== undefined) {
      if (!["PUBLIC", "PRIVATE"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Type không hợp lệ (phải là 'PUBLIC' hoặc 'PRIVATE')",
        });
      }
      updateData.type = type;
    }
    if (courtType !== undefined) updateData.courtType = courtType || null;
    if (req.body.facility !== undefined) {
      if (req.body.facility === null || req.body.facility === '') {
        updateData.facility = null;
      } else {
        updateData.facility = req.body.facility;
      }
    }
    if (req.body.approvalStatus !== undefined) {
      if (!["pending", "approved", "rejected"].includes(req.body.approvalStatus)) {
        return res.status(400).json({
          success: false,
          message: "Trạng thái duyệt không hợp lệ (phải là 'pending', 'approved', hoặc 'rejected')",
        });
      }
      updateData.approvalStatus = req.body.approvalStatus;
    }

    // Kiểm tra ngày hợp lệ nếu có cả startDate và endDate
    if (updateData.startDate && updateData.endDate) {
      if (updateData.startDate >= updateData.endDate) {
        return res.status(400).json({
          success: false,
          message: "Ngày kết thúc phải sau ngày bắt đầu",
        });
      }
    } else if (updateData.startDate && req.league.endDate) {
      if (updateData.startDate >= req.league.endDate) {
        return res.status(400).json({
          success: false,
          message: "Ngày kết thúc phải sau ngày bắt đầu",
        });
      }
    } else if (updateData.endDate && req.league.startDate) {
      if (req.league.startDate >= updateData.endDate) {
        return res.status(400).json({
          success: false,
          message: "Ngày kết thúc phải sau ngày bắt đầu",
        });
      }
    }

    const updatedLeague = await League.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("creator", "name email avatar")
      .lean();

    // Log audit
    await logAudit(
      "UPDATE_LEAGUE",
      req.user._id,
      req,
      {
        leagueId: req.params.id,
        leagueName: updatedLeague.name,
        updatedFields: Object.keys(updateData),
      }
    );

    res.json({
      success: true,
      message: "Cập nhật giải đấu thành công",
      data: updatedLeague,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0].message,
      });
    }
    next(error);
  }
});

/**
 * DELETE /api/leagues/:id
 * Xóa giải đấu
 * User (người tạo) hoặc Admin
 */
router.delete("/:id", checkOwnershipOrAdmin, async (req, res, next) => {
  try {
    const leagueId = req.params.id;
    const leagueName = req.league.name;

    await League.findByIdAndDelete(leagueId);

    // Log audit
    await logAudit(
      "DELETE_LEAGUE",
      req.user._id,
      req,
      {
        leagueId: leagueId,
        leagueName: leagueName,
      }
    );

    res.json({
      success: true,
      message: "Xóa giải đấu thành công",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/leagues/:id/teams/:teamId
 * Xóa một đội khỏi giải đấu
 * User (người tạo)
 */
router.delete("/:id/teams/:teamId", checkOwnership, async (req, res, next) => {
  try {
    const leagueId = req.params.id;
    const teamIdParam = req.params.teamId;
    const teamId = parseInt(teamIdParam);
    const isTeamIdNumber = !isNaN(teamId);

    const league = await League.findById(leagueId);

    if (!league) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giải đấu",
      });
    }

    const minTeams = 4;
    const validTeams = league.teams.filter(
      (team) => team.teamNumber || team.contactPhone || team.contactName
    );
    
    if (validTeams.length > 0 && validTeams.length <= minTeams) {
      return res.status(400).json({
        success: false,
        message: `Phải có ít nhất ${minTeams} đội tham gia`,
      });
    }
    
    if (league.teams.length === 0 && league.maxParticipants <= minTeams) {
      return res.status(400).json({
        success: false,
        message: `Phải có ít nhất ${minTeams} đội`,
      });
    }

    const teamIndex = league.teams.findIndex(
      (team) => {
        if (isTeamIdNumber) {
          const teamIdNum = typeof team.id === 'number' ? team.id : (team.id ? parseInt(team.id) : null);
          if (teamIdNum !== null && !isNaN(teamIdNum) && teamIdNum === teamId) {
            return true;
          }
        }
        
        const teamIdStr = team._id?.toString();
        if (teamIdStr && teamIdStr === teamIdParam) {
          return true;
        }
        
        return false;
      }
    );

    if (teamIndex === -1) {
      if (isTeamIdNumber && league.maxParticipants > minTeams) {
        league.maxParticipants = Math.max(minTeams, league.maxParticipants - 1);
        await league.save();
        
        await logAudit("DELETE_TEAM", req.user._id, req, {
          leagueId: leagueId,
          leagueName: league.name,
          teamId: teamId,
          action: "decreased_maxParticipants",
        });

        return res.json({
          success: true,
          message: "Xóa đội thành công (giảm số đội tối đa)",
          data: league,
        });
      }
      
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đội",
      });
    }

    league.teams.splice(teamIndex, 1);
    
    if (league.maxParticipants > minTeams && league.teams.length < league.maxParticipants) {
      league.maxParticipants = Math.max(minTeams, league.teams.length);
    }
    
    await league.save();

    await logAudit("DELETE_TEAM", req.user._id, req, {
      leagueId: leagueId,
      leagueName: league.name,
      teamId: teamId,
    });

    res.json({
      success: true,
      message: "Xóa đội thành công",
      data: league,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/leagues/:id/upload
 * Upload image cho giải đấu
 * User (người tạo)
 */
router.post(
  "/:id/upload",
  checkOwnership,
  uploadLeagueImage.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Không có file ảnh được upload",
        });
      }

      const imageUrl = req.file.path; // Cloudinary URL

      // Cập nhật image và banner của league
      const updatedLeague = await League.findByIdAndUpdate(
        req.params.id,
        {
          image: imageUrl,
          banner: imageUrl, // Dùng chung image cho banner
        },
        {
          new: true,
          runValidators: true,
        }
      )
        .populate("creator", "name email avatar")
        .lean();

      // Log audit
      await logAudit(
        "UPLOAD_LEAGUE_IMAGE",
        req.user._id,
        req,
        {
          leagueId: req.params.id,
          leagueName: updatedLeague.name,
        }
      );

      res.json({
        success: true,
        message: "Upload ảnh thành công",
        data: {
          image: imageUrl,
          imageUrl: imageUrl,
          league: updatedLeague,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/leagues/:id/teams/template
 * Tải file mẫu Excel cho danh sách đội
 * User (người tạo)
 */
router.get("/:id/teams/template", checkOwnership, async (req, res, next) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách đội');

    worksheet.columns = [
      { header: 'Tên đội', key: 'teamNumber', width: 20 },
      { header: 'SĐT liên hệ', key: 'contactPhone', width: 20 },
      { header: 'Tên người liên hệ', key: 'contactName', width: 30 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    worksheet.addRow({ teamNumber: '#1', contactPhone: '0123456789', contactName: 'Nguyễn Văn A' });
    worksheet.addRow({ teamNumber: '#2', contactPhone: '0987654321', contactName: 'Trần Thị B' });
    worksheet.addRow({ teamNumber: '#3', contactPhone: '0111222333', contactName: 'Lê Văn C' });
    worksheet.addRow({ teamNumber: '#4', contactPhone: '0444555666', contactName: 'Phạm Thị D' });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="mau-danh-sach-doi.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/leagues/:id/teams/import
 * Import danh sách đội từ file Excel
 * User (người tạo)
 */
router.post(
  "/:id/teams/import",
  checkOwnership,
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Không có file được upload",
        });
      }

      const league = await League.findById(req.params.id);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);

      const worksheet = workbook.getWorksheet(1) || workbook.worksheets[0];
      if (!worksheet) {
        return res.status(400).json({
          success: false,
          message: "File Excel không hợp lệ",
        });
      }

      const teams = [];
      const minTeams = 4;

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const teamNumber = row.getCell(1).value?.toString()?.trim() || '';
        const contactPhone = row.getCell(2).value?.toString()?.trim() || '';
        const contactName = row.getCell(3).value?.toString()?.trim() || '';

        if (teamNumber || contactPhone || contactName) {
          teams.push({
            id: teams.length + 1,
            teamNumber: teamNumber || `#${teams.length + 1}`,
            contactPhone: contactPhone,
            contactName: contactName,
            logo: null,
            wins: 0,
            draws: 0,
            losses: 0,
            members: []
          });
        }
      });

      if (teams.length === 0) {
        return res.status(400).json({
          success: false,
          message: "File không chứa dữ liệu hợp lệ",
        });
      }

      if (teams.length < minTeams) {
        return res.status(400).json({
          success: false,
          message: `Phải có ít nhất ${minTeams} đội`,
        });
      }

      league.teams = teams;
      league.maxParticipants = Math.max(league.maxParticipants, teams.length);
      await league.save();

      await logAudit("IMPORT_TEAMS", req.user._id, req, {
        leagueId: req.params.id,
        leagueName: league.name,
        teamsCount: teams.length,
      });

      res.json({
        success: true,
        message: `Đã import ${teams.length} đội thành công`,
        data: league,
      });
    } catch (error) {
      if (error.message.includes('Chỉ chấp nhận')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }
);

/**
 * POST /api/leagues/:id/teams/import-from-sheets
 * Import danh sách đội từ Google Sheets
 * User (người tạo)
 */
router.post(
  "/:id/teams/import-from-sheets",
  checkOwnership,
  async (req, res, next) => {
    try {
      const { sheetUrl, sheetName, range } = req.body;

      if (!sheetUrl) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp Google Sheets URL",
        });
      }

      const sheetId = extractSheetId(sheetUrl);
      if (!sheetId) {
        return res.status(400).json({
          success: false,
          message: "Google Sheets URL không hợp lệ",
        });
      }

      const league = await League.findById(req.params.id);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }

      // Determine range: use sheetName if provided, otherwise use default
      const sheetRange = sheetName 
        ? `${sheetName}!A:Z` 
        : range || 'A:Z';

      // Get data from Google Sheets
      const rows = await getSheetData(sheetId, sheetRange);

      if (!rows || rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Google Sheets không chứa dữ liệu",
        });
      }

      // Parse teams from rows
      const teams = parseTeamsFromRows(rows);

      if (teams.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Không tìm thấy dữ liệu đội hợp lệ trong Google Sheets",
        });
      }

      const minTeams = 4;
      if (teams.length < minTeams) {
        return res.status(400).json({
          success: false,
          message: `Phải có ít nhất ${minTeams} đội`,
        });
      }

      league.teams = teams;
      league.maxParticipants = Math.max(league.maxParticipants, teams.length);
      await league.save();

      await logAudit("IMPORT_TEAMS_FROM_SHEETS", req.user._id, req, {
        leagueId: req.params.id,
        leagueName: league.name,
        teamsCount: teams.length,
        sheetUrl: sheetUrl,
      });

      res.json({
        success: true,
        message: `Đã import ${teams.length} đội từ Google Sheets thành công`,
        data: league,
      });
    } catch (error) {
      console.error('Error importing teams from Google Sheets:', error);
      next(error);
    }
  }
);

/**
 * GET /api/leagues/:id/sheets/preview
 * Preview Google Sheets data (get sheet names and sample data)
 * User (người tạo)
 */
router.get(
  "/:id/sheets/preview",
  checkOwnership,
  async (req, res, next) => {
    try {
      const { sheetUrl } = req.query;

      if (!sheetUrl) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp Google Sheets URL",
        });
      }

      const sheetId = extractSheetId(sheetUrl);
      if (!sheetId) {
        return res.status(400).json({
          success: false,
          message: "Google Sheets URL không hợp lệ",
        });
      }

      // Get sheet names
      const sheetNames = await getSheetNames(sheetId);

      // Get sample data from first sheet
      const firstSheetName = sheetNames[0]?.title || 'Sheet1';
      const sampleData = await getSheetData(sheetId, `${firstSheetName}!A1:Z10`);

      res.json({
        success: true,
        data: {
          sheetNames: sheetNames,
          sampleData: sampleData,
          firstSheetName: firstSheetName,
        },
      });
    } catch (error) {
      console.error('Error previewing Google Sheets:', error);
      next(error);
    }
  }
);

/**
 * PUT /api/leagues/:id/teams/:teamId/members/:memberIndex
 * Cập nhật thông tin thành viên
 * User (người tạo)
 */
router.put(
  "/:id/teams/:teamId/members/:memberIndex",
  checkOwnership,
  async (req, res, next) => {
    try {
      const leagueId = req.params.id;
      const teamIdParam = req.params.teamId;
      const memberIndex = parseInt(req.params.memberIndex);
      const { jerseyNumber, name, phone, position, avatar } = req.body;

      if (isNaN(memberIndex) || memberIndex < 0) {
        return res.status(400).json({
          success: false,
          message: "Chỉ số thành viên không hợp lệ",
        });
      }

      const league = await League.findById(leagueId);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }

      const teamId = parseInt(teamIdParam);
      const isTeamIdNumber = !isNaN(teamId);

      const teamIndex = league.teams.findIndex((team) => {
        if (isTeamIdNumber) {
          const teamIdNum = typeof team.id === 'number' ? team.id : (team.id ? parseInt(team.id) : null);
          if (teamIdNum !== null && !isNaN(teamIdNum) && teamIdNum === teamId) {
            return true;
          }
        }
        const teamIdStr = team._id?.toString();
        if (teamIdStr && teamIdStr === teamIdParam) {
          return true;
        }
        return false;
      });

      if (teamIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đội",
        });
      }

      const team = league.teams[teamIndex];
      if (!team.members || !Array.isArray(team.members)) {
        team.members = [];
      }

      if (memberIndex >= team.members.length) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thành viên",
        });
      }

      // Cập nhật thông tin thành viên
      const updatedMember = { ...team.members[memberIndex] };
      
      if (jerseyNumber !== undefined) updatedMember.jerseyNumber = jerseyNumber;
      if (name !== undefined) updatedMember.name = name;
      if (phone !== undefined) updatedMember.phone = phone;
      if (position !== undefined) updatedMember.position = position;
      if (avatar !== undefined) updatedMember.avatar = avatar;

      team.members[memberIndex] = updatedMember;
      league.teams[teamIndex] = team;

      await league.save();

      await logAudit("UPDATE_MEMBER", req.user._id, req, {
        leagueId: leagueId,
        leagueName: league.name,
        teamId: teamIdParam,
        memberIndex: memberIndex,
        memberName: updatedMember.name,
      });

      res.json({
        success: true,
        message: "Cập nhật thành viên thành công",
        data: league,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/leagues/:id/teams/:teamId/members/:memberIndex
 * Xóa thành viên khỏi đội
 * User (người tạo)
 */
router.delete(
  "/:id/teams/:teamId/members/:memberIndex",
  checkOwnership,
  async (req, res, next) => {
    try {
      const leagueId = req.params.id;
      const teamIdParam = req.params.teamId;
      const memberIndex = parseInt(req.params.memberIndex);

      if (isNaN(memberIndex) || memberIndex < 0) {
        return res.status(400).json({
          success: false,
          message: "Chỉ số thành viên không hợp lệ",
        });
      }

      const league = await League.findById(leagueId);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }

      const teamId = parseInt(teamIdParam);
      const isTeamIdNumber = !isNaN(teamId);

      const teamIndex = league.teams.findIndex((team) => {
        if (isTeamIdNumber) {
          const teamIdNum = typeof team.id === 'number' ? team.id : (team.id ? parseInt(team.id) : null);
          if (teamIdNum !== null && !isNaN(teamIdNum) && teamIdNum === teamId) {
            return true;
          }
        }
        const teamIdStr = team._id?.toString();
        if (teamIdStr && teamIdStr === teamIdParam) {
          return true;
        }
        return false;
      });

      if (teamIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đội",
        });
      }

      const team = league.teams[teamIndex];
      if (!team.members || !Array.isArray(team.members)) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thành viên",
        });
      }

      if (memberIndex >= team.members.length) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thành viên",
        });
      }

      const memberName = team.members[memberIndex]?.name || '';

      // Xóa thành viên
      team.members.splice(memberIndex, 1);
      league.teams[teamIndex] = team;

      await league.save();

      await logAudit("DELETE_MEMBER", req.user._id, req, {
        leagueId: leagueId,
        leagueName: league.name,
        teamId: teamIdParam,
        memberIndex: memberIndex,
        memberName: memberName,
      });

      res.json({
        success: true,
        message: "Xóa thành viên thành công",
        data: league,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/leagues/:id/teams/:teamId/members/template
 * Tải file mẫu Excel để thêm thành viên
 * User (người tạo)
 */
router.get(
  "/:id/teams/:teamId/members/template",
  checkOwnership,
  async (req, res, next) => {
    try {
      const league = await League.findById(req.params.id);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }

      const isFootball = league.sport === 'Bóng đá';
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách thành viên');

      // Định nghĩa cột dựa trên môn thể thao
      if (isFootball) {
        worksheet.columns = [
          { header: 'Số áo', key: 'jerseyNumber', width: 15 },
          { header: 'Họ tên đầy đủ', key: 'name', width: 30 },
          { header: 'Số điện thoại', key: 'phone', width: 20 },
          { header: 'Vị trí thi đấu', key: 'position', width: 25 }
        ];
      } else {
        worksheet.columns = [
          { header: 'Họ tên đầy đủ', key: 'name', width: 30 },
          { header: 'Số điện thoại', key: 'phone', width: 20 },
          { header: 'Vị trí thi đấu', key: 'position', width: 25 }
        ];
      }

      // Style header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Thêm dữ liệu mẫu
      if (isFootball) {
        worksheet.addRow(['1', 'Nguyễn Văn A', '0123456789', 'Thủ môn']);
        worksheet.addRow(['2', 'Trần Thị B', '0987654321', 'Hậu vệ']);
        worksheet.addRow(['3', 'Lê Văn C', '0111222333', 'Tiền vệ']);
        worksheet.addRow(['4', 'Phạm Thị D', '0444555666', 'Tiền đạo']);
      } else {
        worksheet.addRow(['Nguyễn Văn A', '0123456789', 'Khác']);
        worksheet.addRow(['Trần Thị B', '0987654321', 'Khác']);
        worksheet.addRow(['Lê Văn C', '0111222333', 'Khác']);
        worksheet.addRow(['Phạm Thị D', '0444555666', 'Khác']);
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="mau-danh-sach-thanh-vien.xlsx"');

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/leagues/:id/teams/:teamId/members/import
 * Import danh sách thành viên từ file Excel
 * User (người tạo)
 */
router.post(
  "/:id/teams/:teamId/members/import",
  checkOwnership,
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Không có file được upload",
        });
      }

      const league = await League.findById(req.params.id);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }

      const teamIdParam = req.params.teamId;
      const teamId = parseInt(teamIdParam);
      const isTeamIdNumber = !isNaN(teamId);

      const teamIndex = league.teams.findIndex((team) => {
        if (isTeamIdNumber) {
          const teamIdNum = typeof team.id === 'number' ? team.id : (team.id ? parseInt(team.id) : null);
          if (teamIdNum !== null && !isNaN(teamIdNum) && teamIdNum === teamId) {
            return true;
          }
        }
        const teamIdStr = team._id?.toString();
        if (teamIdStr && teamIdStr === teamIdParam) {
          return true;
        }
        return false;
      });

      if (teamIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đội",
        });
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);

      const worksheet = workbook.getWorksheet(1) || workbook.worksheets[0];
      if (!worksheet) {
        return res.status(400).json({
          success: false,
          message: "File Excel không hợp lệ",
        });
      }

      const isFootball = league.sport === 'Bóng đá';
      const members = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        let jerseyNumber = '';
        let name = '';
        let phone = '';
        let position = '';

        if (isFootball) {
          jerseyNumber = row.getCell(1).value?.toString()?.trim() || '';
          name = row.getCell(2).value?.toString()?.trim() || '';
          phone = row.getCell(3).value?.toString()?.trim() || '';
          position = row.getCell(4).value?.toString()?.trim() || '';
        } else {
          name = row.getCell(1).value?.toString()?.trim() || '';
          phone = row.getCell(2).value?.toString()?.trim() || '';
          position = row.getCell(3).value?.toString()?.trim() || '';
        }

        if (name) {
          const member = {
            name: name,
            phone: phone || '',
            position: position || '',
            avatar: null
          };

          if (isFootball && jerseyNumber) {
            member.jerseyNumber = jerseyNumber;
          }

          members.push(member);
        }
      });

      if (members.length === 0) {
        return res.status(400).json({
          success: false,
          message: "File không chứa dữ liệu hợp lệ",
        });
      }

      // Thêm thành viên vào đội
      const team = league.teams[teamIndex];
      if (!team.members || !Array.isArray(team.members)) {
        team.members = [];
      }

      team.members = [...team.members, ...members];
      league.teams[teamIndex] = team;

      await league.save();

      await logAudit("IMPORT_MEMBERS", req.user._id, req, {
        leagueId: req.params.id,
        leagueName: league.name,
        teamId: teamIdParam,
        membersCount: members.length,
      });

      res.json({
        success: true,
        message: `Đã import ${members.length} thành viên thành công`,
        data: league,
      });
    } catch (error) {
      if (error.message.includes('Chỉ chấp nhận')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }
);

/**
 * POST /api/leagues/:id/teams/:teamId/members/import-from-sheets
 * Import danh sách thành viên từ Google Sheets
 * User (người tạo)
 */
router.post(
  "/:id/teams/:teamId/members/import-from-sheets",
  checkOwnership,
  async (req, res, next) => {
    try {
      const { sheetUrl, sheetName, range } = req.body;

      if (!sheetUrl) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp Google Sheets URL",
        });
      }

      const sheetId = extractSheetId(sheetUrl);
      if (!sheetId) {
        return res.status(400).json({
          success: false,
          message: "Google Sheets URL không hợp lệ",
        });
      }

      const league = await League.findById(req.params.id);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }

      const teamIdParam = req.params.teamId;
      const teamId = parseInt(teamIdParam);
      const isTeamIdNumber = !isNaN(teamId);

      const teamIndex = league.teams.findIndex((team) => {
        if (isTeamIdNumber) {
          const teamIdNum = typeof team.id === 'number' ? team.id : (team.id ? parseInt(team.id) : null);
          if (teamIdNum !== null && !isNaN(teamIdNum) && teamIdNum === teamId) {
            return true;
          }
        }
        const teamIdStr = team._id?.toString();
        if (teamIdStr && teamIdStr === teamIdParam) {
          return true;
        }
        return false;
      });

      if (teamIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đội",
        });
      }

      // Determine range
      const sheetRange = sheetName 
        ? `${sheetName}!A:Z` 
        : range || 'A:Z';

      // Get data from Google Sheets
      const rows = await getSheetData(sheetId, sheetRange);

      if (!rows || rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Google Sheets không chứa dữ liệu",
        });
      }

      const isFootball = league.sport === 'Bóng đá';
      const members = parseMembersFromRows(rows, isFootball);

      if (members.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Không tìm thấy dữ liệu thành viên hợp lệ trong Google Sheets",
        });
      }

      // Add members to team
      const team = league.teams[teamIndex];
      if (!team.members || !Array.isArray(team.members)) {
        team.members = [];
      }

      team.members = [...team.members, ...members];
      league.teams[teamIndex] = team;

      await league.save();

      await logAudit("IMPORT_MEMBERS_FROM_SHEETS", req.user._id, req, {
        leagueId: req.params.id,
        leagueName: league.name,
        teamId: teamIdParam,
        membersCount: members.length,
        sheetUrl: sheetUrl,
      });

      res.json({
        success: true,
        message: `Đã import ${members.length} thành viên từ Google Sheets thành công`,
        data: league,
      });
    } catch (error) {
      console.error('Error importing members from Google Sheets:', error);
      next(error);
    }
  }
);

/**
 * POST /api/leagues/:id/teams/:teamId/logo
 * Upload logo cho đội
 * User (người tạo)
 */
router.post(
  "/:id/teams/:teamId/logo",
  checkOwnership,
  uploadTeamLogo.single("logo"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Không có file ảnh được upload",
        });
      }

      const leagueId = req.params.id;
      const teamIdParam = req.params.teamId;
      const logoUrl = req.file.path; // Cloudinary URL
      const logoPublicId = req.file.filename; // Cloudinary public_id

      const league = await League.findById(leagueId);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }

      const teamId = parseInt(teamIdParam);
      const isTeamIdNumber = !isNaN(teamId);

      const teamIndex = league.teams.findIndex((team) => {
        if (isTeamIdNumber) {
          const teamIdNum = typeof team.id === 'number' ? team.id : (team.id ? parseInt(team.id) : null);
          if (teamIdNum !== null && !isNaN(teamIdNum) && teamIdNum === teamId) {
            return true;
          }
        }
        const teamIdStr = team._id?.toString();
        if (teamIdStr && teamIdStr === teamIdParam) {
          return true;
        }
        return false;
      });

      if (teamIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đội",
        });
      }

      const team = league.teams[teamIndex];
      
      // Xóa logo cũ từ Cloudinary nếu có
      if (team.logoPublicId) {
        try {
          await cloudinaryUtils.deleteImage(team.logoPublicId);
        } catch (deleteError) {
        }
      }

      // Cập nhật logo mới
      team.logo = logoUrl;
      team.logoPublicId = logoPublicId;
      league.teams[teamIndex] = team;

      await league.save();

      await logAudit("UPLOAD_TEAM_LOGO", req.user._id, req, {
        leagueId: leagueId,
        leagueName: league.name,
        teamId: teamIdParam,
        teamNumber: team.teamNumber,
      });

      res.json({
        success: true,
        message: "Upload logo thành công",
        data: {
          logo: logoUrl,
          league: league,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/leagues/:id/teams/:teamId/logo
 * Xóa logo của đội
 * User (người tạo)
 */
router.delete(
  "/:id/teams/:teamId/logo",
  checkOwnership,
  async (req, res, next) => {
    try {
      const leagueId = req.params.id;
      const teamIdParam = req.params.teamId;

      const league = await League.findById(leagueId);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }

      const teamId = parseInt(teamIdParam);
      const isTeamIdNumber = !isNaN(teamId);

      const teamIndex = league.teams.findIndex((team) => {
        if (isTeamIdNumber) {
          const teamIdNum = typeof team.id === 'number' ? team.id : (team.id ? parseInt(team.id) : null);
          if (teamIdNum !== null && !isNaN(teamIdNum) && teamIdNum === teamId) {
            return true;
          }
        }
        const teamIdStr = team._id?.toString();
        if (teamIdStr && teamIdStr === teamIdParam) {
          return true;
        }
        return false;
      });

      if (teamIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đội",
        });
      }

      const team = league.teams[teamIndex];

      // Xóa logo từ Cloudinary nếu có
      if (team.logoPublicId) {
        try {
          await cloudinaryUtils.deleteImage(team.logoPublicId);
        } catch (deleteError) {
        }
      }

      // Xóa logo trong database
      team.logo = null;
      team.logoPublicId = null;
      league.teams[teamIndex] = team;

      await league.save();

      await logAudit("DELETE_TEAM_LOGO", req.user._id, req, {
        leagueId: leagueId,
        leagueName: league.name,
        teamId: teamIdParam,
        teamNumber: team.teamNumber,
      });

      res.json({
        success: true,
        message: "Xóa logo thành công",
        data: league,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/leagues/:id/draw-matches
 * Bốc thăm ngẫu nhiên các cặp đấu
 * User (người tạo)
 */
router.post(
  "/:id/draw-matches",
  checkOwnership,
  async (req, res, next) => {
    try {
      const leagueId = req.params.id;
      const { stage = "round1", clearExisting = false } = req.body;

      const league = await League.findById(leagueId);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }

      // Lấy danh sách đội hợp lệ (có thông tin đầy đủ)
      const validTeams = league.teams.filter(
        (team) => team.teamNumber || team.contactPhone || team.contactName
      );

      if (validTeams.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Cần ít nhất 2 đội để bốc thăm",
        });
      }

      // Xáo trộn ngẫu nhiên danh sách đội bằng Fisher-Yates shuffle algorithm
      const shuffledTeams = [...validTeams];
      for (let i = shuffledTeams.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledTeams[i], shuffledTeams[j]] = [shuffledTeams[j], shuffledTeams[i]];
      }

      // Kiểm tra format giải đấu
      const isRoundRobin = league.format === 'Vòng tròn' || league.format === 'round-robin' || stage === 'round-robin';

      // Chia thành các cặp đấu
      const matches = [];
      let hasBye = false;
      let byeTeam = null;

      if (isRoundRobin) {
        // Round-robin: tạo tất cả các cặp đấu (mỗi đội đấu với tất cả đội khác) × số lượt
        const numRounds = league.numRounds || 1;
        const numTeams = validTeams.length;
        let matchNumber = 1;
        
        // Tính số trận đấu mỗi vòng dựa trên số đội
        // Với n đội: tổng số trận = n*(n-1)/2
        // Chia đều thành các vòng, mỗi vòng có thể có tối đa Math.floor(n/2) trận (nếu n chẵn) hoặc Math.floor(n/2) trận (nếu n lẻ)
        // Nhưng để linh hoạt hơn, ta tính dựa trên số đội: nếu <= 4 đội thì 2 trận/vòng, nếu > 4 đội thì Math.floor(n/2) trận/vòng
        const totalMatchesPerLeg = (numTeams * (numTeams - 1)) / 2;
        let matchesPerRound;
        if (numTeams <= 4) {
          matchesPerRound = 2; // Với ít đội, mỗi vòng 2 trận
        } else if (numTeams <= 6) {
          matchesPerRound = Math.floor(numTeams / 2); // Với 5-6 đội, mỗi vòng có thể có 2-3 trận
        } else {
          matchesPerRound = Math.floor(numTeams / 2); // Với nhiều đội hơn, mỗi vòng có thể có nhiều trận hơn
        }
        
        // Tạo tất cả các cặp đấu cho 1 lượt (cơ sở cho tất cả các lượt)
        const basePairs = [];
        for (let i = 0; i < shuffledTeams.length; i++) {
          for (let j = i + 1; j < shuffledTeams.length; j++) {
            basePairs.push({
              team1Id: shuffledTeams[i].id !== null && shuffledTeams[i].id !== undefined ? shuffledTeams[i].id : shuffledTeams[i]._id,
              team2Id: shuffledTeams[j].id !== null && shuffledTeams[j].id !== undefined ? shuffledTeams[j].id : shuffledTeams[j]._id,
            });
          }
        }
        
        // Helper function để xáo trộn mảng bằng Fisher-Yates shuffle
        const shuffleArray = (array) => {
          const shuffled = [...array];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return shuffled;
        };
        
        // Tạo matches cho từng lượt với thứ tự ngẫu nhiên khác nhau
        for (let round = 1; round <= numRounds; round++) {
          // Xáo trộn lại các cặp đấu cho mỗi lượt để có thứ tự ngẫu nhiên khác nhau
          const shuffledPairs = shuffleArray(basePairs);
          
          // Chia allPairs thành các vòng nhỏ
          const totalRoundsPerLeg = Math.ceil(shuffledPairs.length / matchesPerRound);
          
          for (let subRound = 1; subRound <= totalRoundsPerLeg; subRound++) {
            const startIndex = (subRound - 1) * matchesPerRound;
            const endIndex = Math.min(startIndex + matchesPerRound, shuffledPairs.length);
            const roundPairs = shuffledPairs.slice(startIndex, endIndex);
            
            // Tạo stage name: round-robin-round1-v1, round-robin-round1-v2, ... (nếu numRounds > 1)
            // hoặc round-robin-v1, round-robin-v2, ... (nếu numRounds = 1)
            // Luôn bắt đầu từ 'round-robin' base, không phụ thuộc vào giá trị của stage variable
            let roundStage;
            if (numRounds > 1) {
              roundStage = `round-robin-round${round}-v${subRound}`;
            } else {
              roundStage = `round-robin-v${subRound}`;
            }
            
            roundPairs.forEach(pair => {
              matches.push({
                stage: roundStage,
                matchNumber: matchNumber++,
                team1Id: pair.team1Id,
                team2Id: pair.team2Id,
                date: null,
                time: null,
                score1: null,
                score2: null,
              });
            });
          }
        }
      } else {
        // Single-elimination: Bước 1 - Chuẩn hóa số lượng đội lên power of 2
        const numTeams = shuffledTeams.length;
        
        // Helper function: Tính power of 2 gần nhất (làm tròn lên)
        const getNextPowerOf2 = (n) => {
          if (n <= 1) return 1;
          if (n <= 2) return 2;
          if (n <= 4) return 4;
          if (n <= 8) return 8;
          if (n <= 16) return 16;
          if (n <= 32) return 32;
          if (n <= 64) return 64;
          // Nếu lớn hơn 64, tính toán động
          let power = 1;
          while (power < n) {
            power *= 2;
          }
          return power;
        };

        const numSlots = getNextPowerOf2(numTeams);
        const numByeSlots = numSlots - numTeams;
        hasBye = numByeSlots > 0;

        // Tạo bracketSlots với độ dài đúng bằng numSlots (power of 2)
        // Sử dụng thuật toán Seeding để rải đều các BYE slots, tránh tập trung ở cuối
        const bracketSlots = new Array(numSlots).fill(null);
        
        if (numByeSlots === 0) {
          // Không có BYE, điền tất cả teams
          shuffledTeams.forEach((team, index) => {
            bracketSlots[index] = team;
          });
        } else {
          // Có BYE: Sử dụng thuật toán Seeding để rải đều
          // Tính khoảng cách giữa các BYE slots để rải đều
          const byeInterval = Math.floor(numSlots / (numByeSlots + 1));
          
          // Tạo mảng vị trí sẽ đặt BYE (rải đều)
          const byePositions = [];
          for (let i = 0; i < numByeSlots; i++) {
            // Rải đều BYE vào các vị trí cách đều nhau
            // Sử dụng công thức: (i + 1) * (numSlots / (numByeSlots + 1))
            const position = Math.floor((i + 1) * (numSlots / (numByeSlots + 1)));
            byePositions.push(position);
          }
          
          // Điền teams vào các vị trí không phải BYE
          let teamIndex = 0;
          for (let i = 0; i < numSlots; i++) {
            if (byePositions.includes(i)) {
              // Vị trí này là BYE, giữ nguyên null
              bracketSlots[i] = null;
            } else {
              // Vị trí này là team thật
              if (teamIndex < shuffledTeams.length) {
                bracketSlots[i] = shuffledTeams[teamIndex];
                teamIndex++;
              } else {
                // Nếu hết teams nhưng vẫn còn slot, đặt BYE
                bracketSlots[i] = null;
              }
            }
          }
          
          // Đảm bảo không có 2 BYE liên tiếp trong cùng một match (cặp slot)
          // Điều chỉnh nếu cần: nếu slot chẵn và slot lẻ đều là BYE, swap một trong hai
          for (let i = 0; i < numSlots; i += 2) {
            const slot1 = bracketSlots[i];
            const slot2 = bracketSlots[i + 1];
            
            // Nếu cả 2 slot trong cùng một match đều là BYE, swap với slot tiếp theo có team
            if (slot1 === null && slot2 === null) {
              // Tìm slot tiếp theo có team để swap
              for (let j = i + 2; j < numSlots; j++) {
                if (bracketSlots[j] !== null) {
                  // Swap: đặt team vào slot1, BYE vào slot j
                  bracketSlots[i] = bracketSlots[j];
                  bracketSlots[j] = null;
                  break;
                }
              }
            }
          }
        }

        // Tính toán tất cả các vòng cần thiết dựa trên số slot (power of 2)
        const allRounds = [];
        let currentTeams = numSlots;
        
        while (currentTeams > 1) {
          const currentNumMatches = Math.floor(currentTeams / 2);
          
          allRounds.push({
            stage: null, // Sẽ đặt tên sau dựa trên vị trí
            numMatches: currentNumMatches,
            numTeams: currentTeams
          });
          
          currentTeams = currentNumMatches;
        }

        // Đặt tên vòng theo thứ tự từ đầu (round1, round2, round3, semi, final)
        // Quy tắc: final (2 đội), semi (4 đội), round3 (8 đội), các vòng trước đó là round1, round2, ...
        allRounds.forEach((round, index) => {
          if (round.numTeams === 2) {
            round.stage = 'final';
          } else if (round.numTeams === 4) {
            round.stage = 'semi';
          } else if (round.numTeams === 8) {
            round.stage = 'round3';
          } else {
            // Các vòng trước đó: round1, round2, ...
            // Tính số vòng từ đầu (không tính final, semi, round3)
            const roundPosition = index + 1;
            round.stage = `round${roundPosition}`;
          }
        });

        // Tạo matches cho tất cả các vòng (từ đầu đến cuối)
        const allMatchesByRound = []; // Lưu matches theo từng vòng để dễ xử lý

        // Tạo matches cho tất cả các vòng
        allRounds.forEach((round, roundIndex) => {
          const roundMatches = [];

          if (roundIndex === 0) {
            // Vòng đầu tiên: gán teams thật và BYE từ bracketSlots
            for (let i = 0; i < round.numMatches; i++) {
              const slotIndex1 = i * 2;
              const slotIndex2 = i * 2 + 1;
              
              // Lấy team hoặc BYE từ bracketSlots (đảm bảo độ dài đúng bằng numSlots)
              const team1 = bracketSlots[slotIndex1]; // Có thể là team hoặc null (BYE)
              const team2 = bracketSlots[slotIndex2]; // Có thể là team hoặc null (BYE)

              const matchHasBye = !team1 || !team2;
              let team1Id = null;
              let team2Id = null;
              let score1 = null;
              let score2 = null;

              if (team1 && team2) {
                // Cả 2 đội đều thật
                team1Id = team1.id !== null && team1.id !== undefined ? team1.id : team1._id;
                team2Id = team2.id !== null && team2.id !== undefined ? team2.id : team2._id;
              } else if (team1 && !team2) {
                // Team1 thật, Team2 là BYE -> Team1 tự động thắng
                team1Id = team1.id !== null && team1.id !== undefined ? team1.id : team1._id;
                team2Id = "BYE";
                score1 = 1; // Tự động thắng
                score2 = 0;
              } else if (!team1 && team2) {
                // Team1 là BYE, Team2 thật -> Team2 tự động thắng
                team1Id = "BYE";
                team2Id = team2.id !== null && team2.id !== undefined ? team2.id : team2._id;
                score1 = 0;
                score2 = 1; // Tự động thắng
              } else {
                // Cả 2 đều là BYE (double BYE) - Trường hợp này có thể xảy ra với power of 2
                // Ví dụ: 6 đội -> 8 slots, match cuối cùng sẽ là BYE vs BYE
                // Trong trường hợp này, match này không nên tồn tại hoặc cần được skip
                // Ta sẽ không tạo match này (skip), và điều chỉnh nextMatchId của match trước
                // Hoặc đơn giản hơn: tạo match nhưng đánh dấu là double BYE và tự động skip
                team1Id = "BYE";
                team2Id = "BYE";
                // Không set score, match này sẽ được skip trong propagation
                // Match này sẽ không có winner, và vòng tiếp theo sẽ nhận BYE hoặc null
              }

              // Tính nextMatchId
              let nextMatchId = null;
              if (roundIndex < allRounds.length - 1) {
                const nextRound = allRounds[roundIndex + 1];
                // Match 1,2 -> Match 1 (team1, team2)
                // Match 3,4 -> Match 2 (team1, team2)
                const nextMatchNumber = Math.floor(i / 2) + 1;
                nextMatchId = `${nextRound.stage}_${nextMatchNumber}`;
              }

              const match = {
                stage: round.stage,
                matchNumber: i + 1,
                team1Id: team1Id,
                team2Id: team2Id,
                date: null,
                time: null,
                score1: score1,
                score2: score2,
                nextMatchId: nextMatchId,
                hasBye: matchHasBye,
              };

              roundMatches.push(match);
            }
          } else {
            // Các vòng sau: tạo matches với teamId = null (sẽ được cập nhật sau khi có kết quả)
            for (let i = 0; i < round.numMatches; i++) {
              // Tính nextMatchId
              let nextMatchId = null;
              if (roundIndex < allRounds.length - 1) {
                const nextRound = allRounds[roundIndex + 1];
                const nextMatchNumber = Math.floor(i / 2) + 1;
                nextMatchId = `${nextRound.stage}_${nextMatchNumber}`;
              }

              const match = {
                stage: round.stage,
                matchNumber: i + 1,
                team1Id: null, // Sẽ được cập nhật sau khi có kết quả vòng trước
                team2Id: null, // Sẽ được cập nhật sau khi có kết quả vòng trước
                date: null,
                time: null,
                score1: null,
                score2: null,
                nextMatchId: nextMatchId,
                hasBye: false,
              };

              roundMatches.push(match);
            }
          }

          allMatchesByRound.push(roundMatches);
          matches.push(...roundMatches);
        })

        // Xử lý tự động thắng cho các trận có BYE ở vòng đầu tiên
        // Điền đội thắng vào vòng tiếp theo ngay lập tức (Propagation)
        if (allMatchesByRound.length > 0) {
          const firstRoundMatches = allMatchesByRound[0];
          
          firstRoundMatches.forEach(match => {
            // Bỏ qua match double BYE (cả 2 đều là BYE)
            if (match.team1Id === "BYE" && match.team2Id === "BYE") {
              // Match này không có winner, và vòng tiếp theo sẽ nhận BYE hoặc null
              // Nếu match này có nextMatchId, ta cần xử lý đặc biệt
              if (match.nextMatchId) {
                const [nextStage, nextMatchNumber] = match.nextMatchId.split('_');
                const nextMatch = matches.find(m => 
                  m.stage === nextStage && m.matchNumber === parseInt(nextMatchNumber)
                );
                
                if (nextMatch) {
                  // Đặt BYE vào match tiếp theo
                  const isOddMatch = match.matchNumber % 2 === 1;
                  if (isOddMatch && !nextMatch.team1Id) {
                    nextMatch.team1Id = "BYE";
                    nextMatch.hasBye = true;
                  } else if (!isOddMatch && !nextMatch.team2Id) {
                    nextMatch.team2Id = "BYE";
                    nextMatch.hasBye = true;
                  }
                  
                  // Nếu match tiếp theo cũng trở thành double BYE, ta cần xử lý tiếp
                  // (sẽ được xử lý trong lần lặp tiếp theo hoặc trong updateMatchResult)
                  // Đảm bảo match tiếp theo được cập nhật trong mảng matches
                  const nextMatchIndex = matches.findIndex(m => 
                    m.stage === nextStage && m.matchNumber === parseInt(nextMatchNumber)
                  );
                  if (nextMatchIndex !== -1) {
                    matches[nextMatchIndex] = nextMatch;
                  }
                }
              }
              return; // Skip match double BYE
            }
            
            if (match.hasBye && match.score1 !== null && match.score2 !== null) {
              // Xác định đội thắng (loại bỏ BYE)
              const winnerId = match.score1 > match.score2 
                ? (match.team1Id !== "BYE" ? match.team1Id : null)
                : (match.team2Id !== "BYE" ? match.team2Id : null);
              
              if (winnerId && winnerId !== "BYE" && match.nextMatchId) {
                // Tìm match tiếp theo
                const [nextStage, nextMatchNumber] = match.nextMatchId.split('_');
                const nextMatch = matches.find(m => 
                  m.stage === nextStage && m.matchNumber === parseInt(nextMatchNumber)
                );

                if (nextMatch) {
                  // Xác định vị trí team (team1 hoặc team2) dựa trên matchNumber
                  // Match 1, 2 -> Match 1 vòng tiếp theo (team1, team2)
                  // Match 3, 4 -> Match 2 vòng tiếp theo (team1, team2)
                  // Match 5, 6 -> Match 3 vòng tiếp theo (team1, team2)
                  const isOddMatch = match.matchNumber % 2 === 1;
                  if (isOddMatch) {
                    // Match lẻ (1, 3, 5...) -> team1 ở vòng tiếp theo
                    nextMatch.team1Id = winnerId;
                  } else {
                    // Match chẵn (2, 4, 6...) -> team2 ở vòng tiếp theo
                    nextMatch.team2Id = winnerId;
                  }
                  
                  // Đảm bảo match tiếp theo được cập nhật trong mảng matches
                  const nextMatchIndex = matches.findIndex(m => 
                    m.stage === nextStage && m.matchNumber === parseInt(nextMatchNumber)
                  );
                  if (nextMatchIndex !== -1) {
                    matches[nextMatchIndex] = nextMatch;
                  }
                }
              }
            }
          });
        }
      }

      // Cập nhật matches trong league
      let updatedMatches;
      if (clearExisting) {
        if (isRoundRobin) {
          // Round-robin: xóa tất cả matches có stage bắt đầu bằng "round-robin"
          updatedMatches = (league.matches || []).filter(m => {
            return !m.stage || !m.stage.startsWith('round-robin');
          });
          updatedMatches = [...updatedMatches, ...matches];
        } else {
          // Single-elimination: xóa TẤT CẢ các matches của single-elimination
          // (vì bốc thăm tạo matches cho tất cả các vòng)
          const singleEliminationStages = ['round1', 'round2', 'round3', 'round4', 'semi', 'final'];
          updatedMatches = (league.matches || []).filter(m => !singleEliminationStages.includes(m.stage));
          updatedMatches = [...updatedMatches, ...matches];
        }
      } else {
        // Thêm matches mới, loại bỏ trùng lặp
        updatedMatches = [...(league.matches || []), ...matches];
        // Loại bỏ các match trùng lặp (cùng stage và matchNumber)
        const matchMap = new Map();
        updatedMatches.forEach(match => {
          const key = `${match.stage}_${match.matchNumber}`;
          if (!matchMap.has(key)) {
            matchMap.set(key, match);
          }
        });
        updatedMatches = Array.from(matchMap.values());
      }

      league.matches = updatedMatches;
      await league.save();

      await logAudit("DRAW_MATCHES", req.user._id, req, {
        leagueId: leagueId,
        leagueName: league.name,
        stage: stage,
        matchesCount: matches.length,
        teamsCount: validTeams.length,
        hasBye: hasBye,
      });

      // Tính số lượng BYE slots cho response (chỉ cho single-elimination)
      let byeInfo = null;
      let byeMessage = '';
      if (hasBye && !isRoundRobin) {
        // Lấy thông tin từ biến đã tính toán trước đó
        const firstRoundStage = matches.length > 0 ? matches[0].stage : null;
        const byeMatches = matches.filter(m => m.hasBye && m.stage === firstRoundStage);
        const numByeSlots = byeMatches.length;
        
        byeInfo = {
          numByeSlots: numByeSlots,
          numTeams: validTeams.length,
          byeMatches: byeMatches.map(m => ({
            matchNumber: m.matchNumber,
            stage: m.stage,
            hasAutoWin: m.score1 !== null && m.score2 !== null,
            winnerId: m.score1 > m.score2 ? m.team1Id : (m.score2 > m.score1 ? m.team2Id : null)
          }))
        };
        
        byeMessage = ` (${numByeSlots} slot BYE)`;
      }

      res.json({
        success: true,
        message: `Đã bốc thăm ${matches.length} cặp đấu thành công${byeMessage}`,
        data: {
          league: league,
          matches: matches,
          byeInfo: byeInfo,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/leagues/:id/matches/schedule
 * Cập nhật lịch đấu (date, time) cho các matches
 * User (người tạo)
 */
router.put(
  "/:id/matches/schedule",
  checkOwnership,
  async (req, res, next) => {
    try {
      const leagueId = req.params.id;
      const { schedules } = req.body;

      if (!Array.isArray(schedules)) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu lịch đấu không hợp lệ",
        });
      }

      const league = await League.findById(leagueId);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }

      // Helper: Chuyển đổi time string sang minutes
      const timeToMinutes = (timeStr) => {
        if (!timeStr) return null;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      // Helper: Kiểm tra overlap giữa 2 khoảng thời gian
      const hasTimeOverlap = (start1, end1, start2, end2) => {
        if (!start1 || !end1 || !start2 || !end2) return false;
        const s1 = timeToMinutes(start1);
        const e1 = timeToMinutes(end1);
        const s2 = timeToMinutes(start2);
        const e2 = timeToMinutes(end2);
        if (s1 === null || e1 === null || s2 === null || e2 === null) return false;
        return !(e1 <= s2 || s1 >= e2);
      };

      // Helper: So sánh 2 ngày (chỉ so sánh ngày, không so sánh giờ)
      const isSameDate = (date1, date2) => {
        if (!date1 || !date2) return false;
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
      };

      // Kiểm tra xung đột trước khi cập nhật
      const conflicts = [];
      const warnings = [];

      // Bước 1: Kiểm tra xung đột giữa các schedules trong cùng request
      for (let i = 0; i < schedules.length; i++) {
        const schedule1 = schedules[i];
        const { stage: stage1, matchNumber: matchNumber1, date: date1, time: time1, endTime: endTime1, courtId: courtId1 } = schedule1;
        
        if (!date1 || !time1) continue; // Bỏ qua nếu chưa có date/time

        // Tìm match hiện tại để lấy thông tin đội
        const currentMatch1 = league.matches.find((m) => {
          const stageMatch = m.stage === stage1;
          const numberMatch = m.matchNumber === matchNumber1 || 
                             m.matchNumber === parseInt(matchNumber1) ||
                             parseInt(m.matchNumber) === matchNumber1;
          return stageMatch && numberMatch;
        });

        if (!currentMatch1) continue;

        const team1Id1 = currentMatch1.team1Id;
        const team2Id1 = currentMatch1.team2Id;

        // So sánh với các schedules khác trong cùng request
        for (let j = i + 1; j < schedules.length; j++) {
          const schedule2 = schedules[j];
          const { stage: stage2, matchNumber: matchNumber2, date: date2, time: time2, endTime: endTime2, courtId: courtId2 } = schedule2;
          
          if (!date2 || !time2) continue; // Bỏ qua nếu chưa có date/time

          // Bỏ qua nếu cùng một match
          if (stage1 === stage2 && matchNumber1 === matchNumber2) continue;

          // Tìm match thứ 2 để lấy thông tin đội
          const currentMatch2 = league.matches.find((m) => {
            const stageMatch = m.stage === stage2;
            const numberMatch = m.matchNumber === matchNumber2 || 
                               m.matchNumber === parseInt(matchNumber2) ||
                               parseInt(m.matchNumber) === matchNumber2;
            return stageMatch && numberMatch;
          });

          if (!currentMatch2) continue;

          const team1Id2 = currentMatch2.team1Id;
          const team2Id2 = currentMatch2.team2Id;

          // Kiểm tra xung đột cùng sân
          if (courtId1 && courtId2 && 
              courtId1.toString() === courtId2.toString() &&
              isSameDate(date1, date2)) {
            const endTime1Final = endTime1 || time1;
            const endTime2Final = endTime2 || time2;
            if (hasTimeOverlap(time1, endTime1Final, time2, endTime2Final)) {
              conflicts.push({
                type: 'court',
                match: { stage: stage1, matchNumber: matchNumber1 },
                conflictWith: {
                  stage: stage2,
                  matchNumber: matchNumber2
                },
                message: `Xung đột sân: Trận ${stage1}-${matchNumber1} và ${stage2}-${matchNumber2} cùng sân và cùng thời gian`
              });
            }
          }

          // Kiểm tra xung đột cùng đội
          if (isSameDate(date1, date2)) {
            const endTime1Final = endTime1 || time1;
            const endTime2Final = endTime2 || time2;
            if (hasTimeOverlap(time1, endTime1Final, time2, endTime2Final)) {
              // Kiểm tra team1Id của match1 với team1Id và team2Id của match2
              if (team1Id1 && team1Id1 !== "BYE") {
                if ((team1Id2 && team1Id1.toString() === team1Id2.toString() && team1Id2 !== "BYE") ||
                    (team2Id2 && team1Id1.toString() === team2Id2.toString() && team2Id2 !== "BYE")) {
                  conflicts.push({
                    type: 'team',
                    match: { stage: stage1, matchNumber: matchNumber1 },
                    conflictWith: {
                      stage: stage2,
                      matchNumber: matchNumber2
                    },
                    teamId: team1Id1,
                    message: `Xung đột đội: Đội ${team1Id1} thi đấu 2 trận cùng lúc (${stage1}-${matchNumber1} và ${stage2}-${matchNumber2})`
                  });
                }
              }
              // Kiểm tra team2Id của match1 với team1Id và team2Id của match2
              if (team2Id1 && team2Id1 !== "BYE") {
                if ((team1Id2 && team2Id1.toString() === team1Id2.toString() && team1Id2 !== "BYE") ||
                    (team2Id2 && team2Id1.toString() === team2Id2.toString() && team2Id2 !== "BYE")) {
                  conflicts.push({
                    type: 'team',
                    match: { stage: stage1, matchNumber: matchNumber1 },
                    conflictWith: {
                      stage: stage2,
                      matchNumber: matchNumber2
                    },
                    teamId: team2Id1,
                    message: `Xung đột đội: Đội ${team2Id1} thi đấu 2 trận cùng lúc (${stage1}-${matchNumber1} và ${stage2}-${matchNumber2})`
                  });
                }
              }
            }
          }
        }
      }

      // Bước 2: Kiểm tra xung đột với các matches đã có trong database
      for (const { stage, matchNumber, date, time, endTime, courtId } of schedules) {
        if (!date || !time) continue; // Bỏ qua nếu chưa có date/time

        // Tìm match hiện tại
        const currentMatch = league.matches.find((m) => {
          const stageMatch = m.stage === stage;
          const numberMatch = m.matchNumber === matchNumber || 
                             m.matchNumber === parseInt(matchNumber) ||
                             parseInt(m.matchNumber) === matchNumber;
          return stageMatch && numberMatch;
        });

        if (!currentMatch) continue;

        // Lấy thông tin đội của match hiện tại
        const team1Id = currentMatch.team1Id;
        const team2Id = currentMatch.team2Id;

        // Kiểm tra xung đột với các matches khác trong tournament (đã có trong DB)
        for (const otherMatch of league.matches) {
          // Bỏ qua chính nó
          if (otherMatch.stage === stage && otherMatch.matchNumber === currentMatch.matchNumber) {
            continue;
          }

          // Bỏ qua nếu match khác chưa có lịch
          if (!otherMatch.date || !otherMatch.time) {
            continue;
          }

          // Kiểm tra xung đột cùng sân
          if (courtId && otherMatch.courtId && 
              courtId.toString() === otherMatch.courtId.toString() &&
              isSameDate(date, otherMatch.date)) {
            const otherEndTime = otherMatch.endTime || otherMatch.time;
            const scheduleEndTime = endTime || time;
            if (hasTimeOverlap(time, scheduleEndTime, otherMatch.time, otherEndTime)) {
              conflicts.push({
                type: 'court',
                match: { stage, matchNumber },
                conflictWith: {
                  stage: otherMatch.stage,
                  matchNumber: otherMatch.matchNumber
                },
                message: `Xung đột sân: Trận ${stage}-${matchNumber} và ${otherMatch.stage}-${otherMatch.matchNumber} cùng sân và cùng thời gian`
              });
            }
          }

          // Kiểm tra xung đột cùng đội
          if (isSameDate(date, otherMatch.date)) {
            const otherEndTime = otherMatch.endTime || otherMatch.time;
            const scheduleEndTime = endTime || time;
            if (hasTimeOverlap(time, scheduleEndTime, otherMatch.time, otherEndTime)) {
              // Kiểm tra team1Id
              if (team1Id && team1Id !== "BYE") {
                if ((otherMatch.team1Id && team1Id.toString() === otherMatch.team1Id.toString() && otherMatch.team1Id !== "BYE") ||
                    (otherMatch.team2Id && team1Id.toString() === otherMatch.team2Id.toString() && otherMatch.team2Id !== "BYE")) {
                  conflicts.push({
                    type: 'team',
                    match: { stage, matchNumber },
                    conflictWith: {
                      stage: otherMatch.stage,
                      matchNumber: otherMatch.matchNumber
                    },
                    teamId: team1Id,
                    message: `Xung đột đội: Đội ${team1Id} thi đấu 2 trận cùng lúc (${stage}-${matchNumber} và ${otherMatch.stage}-${otherMatch.matchNumber})`
                  });
                }
              }
              // Kiểm tra team2Id
              if (team2Id && team2Id !== "BYE") {
                if ((otherMatch.team1Id && team2Id.toString() === otherMatch.team1Id.toString() && otherMatch.team1Id !== "BYE") ||
                    (otherMatch.team2Id && team2Id.toString() === otherMatch.team2Id.toString() && otherMatch.team2Id !== "BYE")) {
                  conflicts.push({
                    type: 'team',
                    match: { stage, matchNumber },
                    conflictWith: {
                      stage: otherMatch.stage,
                      matchNumber: otherMatch.matchNumber
                    },
                    teamId: team2Id,
                    message: `Xung đột đội: Đội ${team2Id} thi đấu 2 trận cùng lúc (${stage}-${matchNumber} và ${otherMatch.stage}-${otherMatch.matchNumber})`
                  });
                }
              }
            }
          }
        }

        // Kiểm tra xung đột với bookings
        if (courtId && date && time) {
          const bookingDate = new Date(date);
          bookingDate.setHours(0, 0, 0, 0);
          
          const matchStartMinutes = timeToMinutes(time);
          const matchEndMinutes = timeToMinutes(endTime || time);
          
          // Tìm các bookings có thể xung đột
          const existingBookings = await Booking.find({
            court: courtId,
            date: bookingDate,
            status: { $in: ["pending_payment", "hold", "confirmed"] },
            $or: [
              { holdUntil: { $exists: false } },
              { holdUntil: { $gt: new Date() } },
              { status: "confirmed" },
            ],
          }).lean();

          for (const booking of existingBookings) {
            for (const slot of (booking.timeSlots || [])) {
              const [slotStart, slotEnd] = slot.split('-');
              const slotStartMinutes = timeToMinutes(slotStart);
              const slotEndMinutes = timeToMinutes(slotEnd);
              
              if (matchStartMinutes !== null && matchEndMinutes !== null &&
                  slotStartMinutes !== null && slotEndMinutes !== null) {
                if (!(matchEndMinutes <= slotStartMinutes || matchStartMinutes >= slotEndMinutes)) {
                  warnings.push({
                    type: 'booking',
                    match: { stage, matchNumber },
                    message: `Cảnh báo: Sân đã có booking từ ${slotStart} đến ${slotEnd} vào ngày ${date}`
                  });
                }
              }
            }
          }
        }
      }

      // Nếu có xung đột nghiêm trọng (conflicts), trả về lỗi
      if (conflicts.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Phát hiện xung đột lịch đấu",
          conflicts: conflicts,
          warnings: warnings
        });
      }

      let updatedCount = 0;
      const notFoundMatches = [];
      
      for (const { stage, matchNumber, date, time, endTime, courtId } of schedules) {
        // Tìm match với nhiều cách so sánh
        const matchIndex = league.matches.findIndex((m) => {
          const stageMatch = m.stage === stage;
          const numberMatch = m.matchNumber === matchNumber || 
                             m.matchNumber === parseInt(matchNumber) ||
                             parseInt(m.matchNumber) === matchNumber;
          return stageMatch && numberMatch;
        });

        if (matchIndex !== -1) {
          const oldMatch = league.matches[matchIndex];
          const oldDate = oldMatch.date;
          const oldTime = oldMatch.time;
          const oldCourtId = oldMatch.courtId;

          // Cập nhật match
          if (date !== undefined) {
            league.matches[matchIndex].date = date ? new Date(date) : null;
          }
          if (time !== undefined) {
            league.matches[matchIndex].time = time || null;
          }
          if (endTime !== undefined) {
            league.matches[matchIndex].endTime = endTime || null;
          }
          if (courtId !== undefined) {
            league.matches[matchIndex].courtId = courtId || null;
          }

          // Nếu xóa lịch đấu (date hoặc time = null), xóa hold booking cũ
          const newDate = league.matches[matchIndex].date;
          const newTime = league.matches[matchIndex].time;
          if ((!newDate || !newTime) && oldDate && oldTime) {
            // Xóa hold booking cũ
            await Booking.deleteMany({
              league: leagueId,
              "matchInfo.stage": stage,
              "matchInfo.matchNumber": matchNumber,
              status: "hold"
            });
          }

          updatedCount++;
        } else {
          notFoundMatches.push({ stage, matchNumber });
        }
      }

      if (updatedCount === 0 && schedules.length > 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy matches để cập nhật. Vui lòng bốc thăm trước.",
          details: {
            requested: schedules,
            notFound: notFoundMatches,
            availableMatches: league.matches.map(m => ({
              stage: m.stage,
              matchNumber: m.matchNumber
            }))
          }
        });
      }

      await league.save();

      // Tạo hold bookings cho các matches đã được schedule
      const createdBookings = [];
      console.log(`[HOLD_BOOKING] Bắt đầu tạo hold bookings cho ${schedules.length} matches`);
      
      for (const { stage, matchNumber, date, time, endTime, courtId } of schedules) {
        if (!date || !time || !courtId) {
          console.log(`[HOLD_BOOKING] Bỏ qua match ${stage}-${matchNumber}: thiếu date/time/courtId`, { date, time, courtId });
          continue;
        }

        // Tìm match đã được cập nhật
        const updatedMatch = league.matches.find((m) => {
          const stageMatch = m.stage === stage;
          const numberMatch = m.matchNumber === matchNumber || 
                             m.matchNumber === parseInt(matchNumber) ||
                             parseInt(m.matchNumber) === matchNumber;
          return stageMatch && numberMatch;
        });

        if (!updatedMatch || !updatedMatch.date || !updatedMatch.time || !updatedMatch.courtId) {
          console.log(`[HOLD_BOOKING] Bỏ qua match ${stage}-${matchNumber}: không tìm thấy hoặc thiếu thông tin`, {
            found: !!updatedMatch,
            hasDate: !!updatedMatch?.date,
            hasTime: !!updatedMatch?.time,
            hasCourtId: !!updatedMatch?.courtId
          });
          continue;
        }
        
        console.log(`[HOLD_BOOKING] Xử lý match ${stage}-${matchNumber}:`, {
          date: updatedMatch.date,
          time: updatedMatch.time,
          endTime: updatedMatch.endTime,
          courtId: updatedMatch.courtId
        });

        // Kiểm tra xem đã có hold booking cho match này chưa
        const existingHoldBooking = await Booking.findOne({
          league: leagueId,
          "matchInfo.stage": stage,
          "matchInfo.matchNumber": matchNumber,
          status: "hold"
        });
        
        console.log(`[HOLD_BOOKING] Match ${stage}-${matchNumber}:`, {
          existingHoldBooking: existingHoldBooking ? existingHoldBooking._id : null,
          leagueId: leagueId.toString()
        });

        // Lấy facility để lấy timeSlotDuration (dùng chung cho cả update và create)
        const courtForBooking = await Court.findById(updatedMatch.courtId).populate('facility').lean();
        if (!courtForBooking || !courtForBooking.facility) continue;
        
        const facility = typeof courtForBooking.facility === 'object' 
          ? courtForBooking.facility 
          : await Facility.findById(courtForBooking.facility).lean();
        const slotDuration = facility?.timeSlotDuration || 60; // Mặc định 60 phút

        // Helper functions
        const timeToMinutes = (timeStr) => {
          if (!timeStr) return null;
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + minutes;
        };

        const minutesToTime = (minutes) => {
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        };

        // Tạo time slots từ time và endTime
        const bookingDate = new Date(updatedMatch.date);
        bookingDate.setHours(0, 0, 0, 0);
        const timeSlots = [];
        const startTime = updatedMatch.time;
        
        // Tính endTime: nếu không có endTime, dùng matchDuration (mặc định 90 phút)
        let finalEndTime = updatedMatch.endTime;
        if (!finalEndTime && startTime) {
          const matchDuration = 90; // Mặc định 90 phút
          const startMinutes = timeToMinutes(startTime);
          if (startMinutes !== null) {
            const endMinutes = startMinutes + matchDuration;
            finalEndTime = minutesToTime(endMinutes);
          } else {
            finalEndTime = startTime; // Fallback
          }
        } else if (!finalEndTime) {
          finalEndTime = startTime; // Fallback
        }
        
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(finalEndTime);
        
        console.log(`[HOLD_BOOKING] Tính time slots cho match ${stage}-${matchNumber}:`, {
          startTime,
          endTime: updatedMatch.endTime,
          finalEndTime,
          startMinutes,
          endMinutes,
          slotDuration
        });
        
        if (startMinutes !== null && endMinutes !== null && startMinutes < endMinutes) {
          let currentMinutes = startMinutes;
          while (currentMinutes < endMinutes) {
            const slotStart = minutesToTime(currentMinutes);
            // Tính slotEnd: nếu currentMinutes + slotDuration vượt quá endMinutes thì dùng endMinutes
            const nextSlotEnd = currentMinutes + slotDuration;
            const slotEnd = minutesToTime(Math.min(nextSlotEnd, endMinutes));
            timeSlots.push(`${slotStart}-${slotEnd}`);
            
            // Tăng currentMinutes lên slotDuration để tạo slot tiếp theo
            currentMinutes += slotDuration;
            
            // Nếu slot vừa tạo đã đến endMinutes thì dừng
            if (nextSlotEnd >= endMinutes) {
              break;
            }
          }
          
          // Đảm bảo slot cuối cùng cover đến endMinutes nếu chưa đủ
          if (timeSlots.length > 0) {
            const lastSlot = timeSlots[timeSlots.length - 1];
            const [lastSlotStart, lastSlotEnd] = lastSlot.split('-');
            const lastSlotEndMinutes = timeToMinutes(lastSlotEnd);
            if (lastSlotEndMinutes !== null && lastSlotEndMinutes < endMinutes) {
              // Slot cuối chưa đến endTime, tạo thêm slot để cover
              timeSlots[timeSlots.length - 1] = `${lastSlotStart}-${minutesToTime(endMinutes)}`;
            }
          }
        } else {
          console.warn(`[HOLD_BOOKING] Không thể tạo time slots: startMinutes=${startMinutes}, endMinutes=${endMinutes}`);
        }
        
        console.log(`[HOLD_BOOKING] Time slots đã tạo cho match ${stage}-${matchNumber} (${startTime} - ${finalEndTime}):`, timeSlots);

        if (existingHoldBooking) {
          // Cập nhật booking hiện có nếu thời gian thay đổi
          console.log(`[HOLD_BOOKING] Cập nhật hold booking cho match ${stage}-${matchNumber}:`, {
            bookingId: existingHoldBooking._id,
            oldDate: existingHoldBooking.date,
            newDate: bookingDate,
            oldTimeSlots: existingHoldBooking.timeSlots,
            newTimeSlots: timeSlots,
            oldCourt: existingHoldBooking.court,
            newCourt: updatedMatch.courtId
          });
          
          existingHoldBooking.date = bookingDate;
          existingHoldBooking.timeSlots = timeSlots;
          existingHoldBooking.court = updatedMatch.courtId;
          await existingHoldBooking.save();
          createdBookings.push(existingHoldBooking._id);
          
          console.log(`[HOLD_BOOKING] Đã cập nhật hold booking ${existingHoldBooking._id} cho match ${stage}-${matchNumber}`);
        } else {
          // Tạo hold booking mới

          // Tạo hold booking (không hết hạn - holdUntil = null hoặc rất xa)
          const facilityId = typeof courtForBooking.facility === 'object' 
            ? (courtForBooking.facility._id || courtForBooking.facility.id || courtForBooking.facility)
            : courtForBooking.facility;

          const holdBooking = new Booking({
            user: req.user._id,
            court: updatedMatch.courtId,
            facility: facilityId,
            date: bookingDate,
            timeSlots: timeSlots,
            contactInfo: {
              name: league.creatorName || req.user.name || "Giải đấu",
              phone: league.phone || req.user.phone || "",
              email: req.user.email || "",
              notes: `Trận đấu ${stage}-${matchNumber} - ${league.name}`
            },
            totalAmount: 0, // Tournament booking không tính phí
            status: "hold", // Hold booking
            holdUntil: null, // Không hết hạn (sẽ được chốt bằng nút "Chốt lịch")
            league: leagueId,
            matchInfo: {
              stage: stage,
              matchNumber: matchNumber
            }
          });

          console.log(`[HOLD_BOOKING] Tạo hold booking mới cho match ${stage}-${matchNumber}:`, {
            courtId: updatedMatch.courtId.toString(),
            facilityId: facilityId?.toString(),
            date: bookingDate,
            timeSlots: timeSlots,
            status: "hold",
            holdUntil: null,
            league: leagueId.toString(),
            matchInfo: { stage, matchNumber }
          });

          await holdBooking.save();
          createdBookings.push(holdBooking._id);
          
          console.log(`[HOLD_BOOKING] Đã tạo hold booking ${holdBooking._id} cho match ${stage}-${matchNumber}:`, {
            bookingId: holdBooking._id.toString(),
            courtId: holdBooking.court.toString(),
            facilityId: holdBooking.facility.toString(),
            date: holdBooking.date,
            timeSlots: holdBooking.timeSlots,
            status: holdBooking.status,
            holdUntil: holdBooking.holdUntil,
            league: holdBooking.league.toString(),
            matchInfo: holdBooking.matchInfo
          });
          
          // Verify booking đã được lưu
          const verifyBooking = await Booking.findById(holdBooking._id).lean();
          console.log(`[HOLD_BOOKING] Verify booking sau khi save:`, {
            found: !!verifyBooking,
            courtId: verifyBooking?.court?.toString(),
            date: verifyBooking?.date,
            status: verifyBooking?.status
          });
        }
      }
      
      console.log(`[HOLD_BOOKING] Tổng kết: Đã tạo/cập nhật ${createdBookings.length} hold bookings`);

      await logAudit("UPDATE_MATCH_SCHEDULE", req.user._id, req, {
        leagueId: leagueId,
        leagueName: league.name,
        schedulesCount: schedules.length,
        bookingsCreated: createdBookings.length
      });

      res.json({
        success: true,
        message: warnings.length > 0 
          ? "Cập nhật lịch đấu thành công (có cảnh báo)" 
          : "Cập nhật lịch đấu thành công",
        data: league,
        warnings: warnings.length > 0 ? warnings : undefined,
        bookingsCreated: createdBookings.length
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/leagues/:id/matches/:matchId/suggest-time
 * Gợi ý thời gian tối ưu cho một match cụ thể
 * User (người tạo)
 */
router.get(
  "/:id/matches/:matchId/suggest-time",
  checkOwnership,
  async (req, res, next) => {
    try {
      const leagueId = req.params.id;
      const matchId = req.params.matchId; // Format: "stage_matchNumber" hoặc chỉ matchNumber
      const preferredDate = req.query.preferredDate;
      const matchDuration = parseInt(req.query.matchDuration) || 90;
      const breakTime = parseInt(req.query.breakTime) || 30;

      const league = await League.findById(leagueId);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }

      if (!league.facility) {
        return res.status(400).json({
          success: false,
          message: "Giải đấu chưa có cơ sở thể thao",
        });
      }

      // Parse matchId
      let stage, matchNumber;
      if (matchId.includes('_')) {
        const parts = matchId.split('_');
        stage = parts[0];
        matchNumber = parseInt(parts[1]);
      } else {
        matchNumber = parseInt(matchId);
        // Tìm match trong league để lấy stage
        const tempMatch = league.matches.find(m => 
          m.matchNumber === matchNumber || 
          m.matchNumber === parseInt(matchNumber) ||
          parseInt(m.matchNumber) === matchNumber
        );
        if (tempMatch) {
          stage = tempMatch.stage;
        }
      }

      // Tìm match với nhiều cách so sánh
      const match = league.matches.find((m) => {
        const stageMatch = stage ? m.stage === stage : true;
        const numberMatch = m.matchNumber === matchNumber || 
                           m.matchNumber === parseInt(matchNumber) ||
                           parseInt(m.matchNumber) === matchNumber;
        return stageMatch && numberMatch;
      });

      if (!match) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy trận đấu",
          details: {
            matchId,
            stage,
            matchNumber,
            availableMatches: league.matches.map(m => ({
              stage: m.stage,
              matchNumber: m.matchNumber
            }))
          }
        });
      }

      // Lấy facility và courts
      const facility = await Facility.findById(league.facility).lean();
      if (!facility) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy cơ sở thể thao",
        });
      }

      // Lấy danh sách sân, filter theo courtType nếu có
      const courtQuery = {
        facility: facility._id,
        status: 'active'
      };

      if (league.courtType) {
        const courtTypeId = typeof league.courtType === 'object' && league.courtType._id
          ? league.courtType._id
          : league.courtType;
        
        if (mongoose.Types.ObjectId.isValid(courtTypeId)) {
          const courtType = await CourtType.findById(courtTypeId).lean();
          if (courtType) {
            courtQuery.$or = [
              { courtType: new mongoose.Types.ObjectId(courtTypeId) },
              { type: courtType.name }
            ];
          } else {
            courtQuery.courtType = new mongoose.Types.ObjectId(courtTypeId);
          }
        }
      }

      const courts = await Court.find(courtQuery).lean();
      if (courts.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Không có sân phù hợp",
        });
      }

      // Helper functions
      const timeToMinutes = (timeStr) => {
        if (!timeStr) return null;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const minutesToTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      };

      // Helper: Kiểm tra overlap giữa 2 khoảng thời gian
      const hasTimeOverlap = (start1, end1, start2, end2) => {
        const start1Min = timeToMinutes(start1);
        const end1Min = timeToMinutes(end1);
        const start2Min = timeToMinutes(start2);
        const end2Min = timeToMinutes(end2);
        
        if (start1Min === null || end1Min === null || start2Min === null || end2Min === null) {
          return false;
        }
        
        // Có overlap nếu: start1 < end2 && start2 < end1
        return !(end1Min <= start2Min || start1Min >= end2Min);
      };

      // Helper: Thu thập tất cả các time slots đã được sử dụng (bookings, matches, socket locks)
      // Bỏ qua match hiện tại nếu được chỉ định
      const getOccupiedTimeSlots = async (courtId, date, excludeMatch = null) => {
        const occupiedSlots = [];
        const bookingDate = new Date(date);
        bookingDate.setHours(0, 0, 0, 0);
        const now = new Date();
        
        // 1. Lấy bookings
        const startOfDay = new Date(bookingDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(bookingDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        const existingBookings = await Booking.find({
          court: courtId,
          date: {
            $gte: startOfDay,
            $lte: endOfDay
          },
          status: { $in: ["pending_payment", "hold", "confirmed"] },
          $or: [
            { holdUntil: { $exists: false } },
            { holdUntil: { $gt: now } },
            { status: "confirmed" },
          ],
        }).lean();
        
        for (const booking of existingBookings) {
          for (const slot of (booking.timeSlots || [])) {
            const [slotStart, slotEnd] = slot.split('-');
            occupiedSlots.push({
              type: 'booking',
              start: slotStart,
              end: slotEnd,
              id: booking._id,
              status: booking.status
            });
          }
        }
        
        // 2. Lấy matches đã được sắp lịch trong tournament (cùng sân, cùng ngày)
        // Bỏ qua match hiện tại nếu được chỉ định
        for (const otherMatch of league.matches) {
          // Bỏ qua chính match đang tìm suggestions
          if (excludeMatch) {
            if (otherMatch._id && excludeMatch._id && otherMatch._id.toString() === excludeMatch._id.toString()) continue;
            if (otherMatch.stage === excludeMatch.stage && otherMatch.matchNumber === excludeMatch.matchNumber) continue;
          }
          
          if (!otherMatch.date || !otherMatch.time || !otherMatch.courtId) continue;
          
          const otherDate = new Date(otherMatch.date);
          otherDate.setHours(0, 0, 0, 0);
          const matchDate = new Date(date);
          matchDate.setHours(0, 0, 0, 0);
          const sameDate = otherDate.getTime() === matchDate.getTime();
          const sameCourt = otherMatch.courtId.toString() === courtId.toString();
          
          if (sameDate && sameCourt) {
            const otherEndTime = otherMatch.endTime || otherMatch.time;
            occupiedSlots.push({
              type: 'match',
              start: otherMatch.time,
              end: otherEndTime,
              stage: otherMatch.stage,
              matchNumber: otherMatch.matchNumber
            });
          }
        }
        
        return occupiedSlots;
      };

      const isCourtAvailable = async (courtId, date, startTime, endTime) => {
        const bookingDate = new Date(date);
        bookingDate.setHours(0, 0, 0, 0);
        const dateStr = bookingDate.toISOString().split('T')[0];
        
        // Kiểm tra socket locks (realtime availability)
        const timeSlotStr = `${startTime}-${endTime}`;
        const lock = isSlotLocked(courtId.toString(), dateStr, timeSlotStr);
        
        if (lock) {
          console.log(`[AUTO_SCHEDULE_AVAILABILITY] Sân ${courtId} KHÔNG khả dụng do đang bị lock realtime:`, {
            lockUserId: lock.userId,
            lockedAt: new Date(lock.lockedAt).toISOString(),
            expiresAt: new Date(lock.expiresAt).toISOString(),
            requestedTime: `${startTime}-${endTime}`
          });
          return false;
        }
        
        // Thu thập tất cả các time slots đã được sử dụng (bỏ qua match hiện tại)
        const occupiedSlots = await getOccupiedTimeSlots(courtId, date, match);
        
        // Kiểm tra overlap với tất cả các slots đã sử dụng
        for (const occupiedSlot of occupiedSlots) {
          if (hasTimeOverlap(startTime, endTime, occupiedSlot.start, occupiedSlot.end)) {
            console.log(`[AUTO_SCHEDULE_AVAILABILITY] Sân ${courtId} KHÔNG khả dụng do overlap với ${occupiedSlot.type}:`, {
              requestedTime: `${startTime}-${endTime}`,
              occupiedTime: `${occupiedSlot.start}-${occupiedSlot.end}`,
              type: occupiedSlot.type,
              id: occupiedSlot.id || `${occupiedSlot.stage}-${occupiedSlot.matchNumber}`
            });
            return false;
          }
        }
        
        return true;
      };

      const getOperatingHours = (date) => {
        const dayOfWeek = date.getDay();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayOfWeek];
        const hours = facility.operatingHours?.[dayName];
        
        if (!hours || !hours.isOpen) {
          return null;
        }

        return {
          open: hours.open || "06:00",
          close: hours.close || "22:00"
        };
      };

      // Tìm thời gian tối ưu
      const suggestions = [];
      const startDate = preferredDate ? new Date(preferredDate) : new Date(league.startDate || Date.now());
      const endDate = new Date(league.endDate || Date.now());
      endDate.setHours(23, 59, 59);

      // Đảm bảo startDate không quá khứ
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        startDate.setTime(today.getTime());
      }

      let currentDate = new Date(startDate);
      const maxSuggestions = 10;
      let foundCount = 0;
      const maxDaysToCheck = 30; // Giới hạn tìm trong 30 ngày
      let daysChecked = 0;

      while (currentDate <= endDate && foundCount < maxSuggestions && daysChecked < maxDaysToCheck) {
        daysChecked++;
        const operatingHours = getOperatingHours(currentDate);
        if (!operatingHours) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        const openMinutes = timeToMinutes(operatingHours.open);
        const closeMinutes = timeToMinutes(operatingHours.close);
        
        if (openMinutes === null || closeMinutes === null) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        let currentTimeMinutes = openMinutes;

        while (currentTimeMinutes + matchDuration <= closeMinutes && foundCount < maxSuggestions) {
          const startTime = minutesToTime(currentTimeMinutes);
          const endTime = minutesToTime(currentTimeMinutes + matchDuration);

          // Thử từng sân
          for (const court of courts) {
            try {
              const isAvailable = await isCourtAvailable(
                court._id,
                currentDate,
                startTime,
                endTime
              );

              if (isAvailable) {
                suggestions.push({
                  date: new Date(currentDate).toISOString().split('T')[0],
                  time: startTime,
                  endTime: endTime,
                  courtId: court._id.toString(),
                  courtName: court.name,
                  courtType: court.type
                });
                foundCount++;
                break; // Tìm thấy một slot, chuyển sang thời gian tiếp theo
              }
            } catch (err) {
              console.error(`Error checking availability for court ${court._id}:`, err);
              // Tiếp tục với sân tiếp theo
            }
          }

          currentTimeMinutes += matchDuration + breakTime;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      res.json({
        success: true,
        data: {
          match: {
            stage: match.stage,
            matchNumber: match.matchNumber
          },
          suggestions: suggestions.slice(0, maxSuggestions)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/leagues/:id/confirm-schedule
 * Chốt lịch thi đấu - chuyển các hold bookings thành confirmed bookings
 * User (người tạo)
 */
router.post(
  "/:id/confirm-schedule",
  checkOwnership,
  async (req, res, next) => {
    try {
      const leagueId = req.params.id;
      const league = await League.findById(leagueId);

      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }

      if (!league.facility) {
        return res.status(400).json({
          success: false,
          message: "Giải đấu chưa có cơ sở thể thao",
        });
      }

      // Tìm tất cả hold bookings của giải đấu này
      const holdBookings = await Booking.find({
        league: leagueId,
        status: "hold"
      });
      
      console.log(`[CONFIRM_SCHEDULE] Tìm thấy ${holdBookings.length} hold bookings cho league ${leagueId}:`, {
        bookings: holdBookings.map(b => ({
          id: b._id,
          court: b.court,
          date: b.date,
          timeSlots: b.timeSlots,
          matchInfo: b.matchInfo
        }))
      });

      if (holdBookings.length === 0) {
        console.log(`[CONFIRM_SCHEDULE] Không có hold bookings để chốt cho league ${leagueId}`);
        return res.status(400).json({
          success: false,
          message: "Không có lịch đấu nào cần chốt",
        });
      }

      // Chuyển tất cả hold bookings thành confirmed
      const confirmedBookings = [];
      const failedBookings = [];

      for (const booking of holdBookings) {
        try {
          // Kiểm tra lại availability trước khi confirm
          const bookingDate = new Date(booking.date);
          bookingDate.setHours(0, 0, 0, 0);
          const now = new Date();

          // Kiểm tra xem có bookings khác đã chiếm slot này không (ngoài booking hiện tại)
          const conflictingBookings = await Booking.find({
            _id: { $ne: booking._id },
            court: booking.court,
            date: bookingDate,
            status: { $in: ["pending_payment", "hold", "confirmed"] },
            timeSlots: { $in: booking.timeSlots },
            $or: [
              { holdUntil: { $exists: false } },
              { holdUntil: { $gt: now } },
              { status: "confirmed" },
            ],
          });

          if (conflictingBookings.length > 0) {
            failedBookings.push({
              bookingId: booking._id,
              matchInfo: booking.matchInfo,
              reason: "Slot đã bị chiếm bởi booking khác"
            });
            continue;
          }

          // Chuyển sang confirmed
          console.log(`[CONFIRM_SCHEDULE] Chuyển booking ${booking._id} từ hold sang confirmed:`, {
            court: booking.court,
            date: booking.date,
            timeSlots: booking.timeSlots,
            matchInfo: booking.matchInfo
          });
          
          booking.status = "confirmed";
          booking.holdUntil = undefined; // Xóa holdUntil vì đã confirmed
          booking.paymentStatus = "paid"; // Tournament booking coi như đã thanh toán
          await booking.save();

          // Cập nhật date và time vào match trong league
          if (booking.matchInfo && booking.matchInfo.stage && booking.matchInfo.matchNumber !== undefined) {
            const matchIndex = league.matches.findIndex((m) => {
              const stageMatch = m.stage === booking.matchInfo.stage;
              const numberMatch = m.matchNumber === booking.matchInfo.matchNumber || 
                                 m.matchNumber === parseInt(booking.matchInfo.matchNumber) ||
                                 parseInt(m.matchNumber) === booking.matchInfo.matchNumber;
              return stageMatch && numberMatch;
            });

            if (matchIndex !== -1) {
              // Cập nhật date từ booking
              if (booking.date) {
                league.matches[matchIndex].date = new Date(booking.date);
              }

              // Cập nhật time từ timeSlots đầu tiên
              if (booking.timeSlots && booking.timeSlots.length > 0) {
                const firstSlot = booking.timeSlots[0];
                // Parse time từ slot: format thường là "HH:MM-HH:MM"
                let timeStr = '';
                if (firstSlot.includes('-')) {
                  const parts = firstSlot.split('-');
                  // Format "HH:MM-HH:MM" -> lấy phần đầu (start time)
                  if (parts.length === 2 && parts[0].includes(':')) {
                    timeStr = parts[0];
                  } else if (parts.length >= 4) {
                    // Format "YYYY-MM-DD-HH:MM" -> lấy phần cuối
                    timeStr = parts[parts.length - 1];
                  } else if (parts.length === 2) {
                    // Fallback: lấy phần đầu
                    timeStr = parts[0];
                  }
                } else if (firstSlot.includes(':')) {
                  // Format chỉ có "HH:MM"
                  timeStr = firstSlot;
                }

                if (timeStr && timeStr.includes(':')) {
                  league.matches[matchIndex].time = timeStr;
                }

                // Cập nhật endTime từ slot cuối cùng nếu có
                const lastSlot = booking.timeSlots[booking.timeSlots.length - 1];
                if (lastSlot.includes('-')) {
                  const parts = lastSlot.split('-');
                  if (parts.length === 2 && parts[1].includes(':')) {
                    // Format "HH:MM-HH:MM" -> lấy phần cuối (end time)
                    league.matches[matchIndex].endTime = parts[1];
                  } else if (parts.length >= 4 && parts[parts.length - 1].includes(':')) {
                    // Format "YYYY-MM-DD-HH:MM" -> lấy phần cuối
                    league.matches[matchIndex].endTime = parts[parts.length - 1];
                  }
                }
              }

              console.log(`[CONFIRM_SCHEDULE] Đã cập nhật match ${booking.matchInfo.stage}-${booking.matchInfo.matchNumber}:`, {
                date: league.matches[matchIndex].date,
                time: league.matches[matchIndex].time,
                endTime: league.matches[matchIndex].endTime
              });
            } else {
              console.warn(`[CONFIRM_SCHEDULE] Không tìm thấy match ${booking.matchInfo.stage}-${booking.matchInfo.matchNumber} trong league`);
            }
          }

          confirmedBookings.push({
            bookingId: booking._id,
            matchInfo: booking.matchInfo
          });
          
          console.log(`[CONFIRM_SCHEDULE] Đã confirm booking ${booking._id}`);
        } catch (error) {
          console.error(`Error confirming booking ${booking._id}:`, error);
          failedBookings.push({
            bookingId: booking._id,
            matchInfo: booking.matchInfo,
            reason: error.message || "Lỗi không xác định"
          });
        }
      }

      // Lưu league sau khi cập nhật tất cả matches
      await league.save();

      await logAudit("CONFIRM_SCHEDULE", req.user._id, req, {
        leagueId: leagueId,
        leagueName: league.name,
        confirmedCount: confirmedBookings.length,
        failedCount: failedBookings.length
      });

      res.json({
        success: true,
        message: `Đã chốt ${confirmedBookings.length}/${holdBookings.length} lịch đấu`,
        data: {
          confirmed: confirmedBookings,
          failed: failedBookings.length > 0 ? failedBookings : undefined
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/leagues/:id/matches/:stage/:matchNumber/schedule
 * Hủy lịch đấu cho một trận cụ thể - xóa date/time/courtId và hủy bookings (hold + confirmed)
 * User (người tạo)
 */
router.delete(
  "/:id/matches/:stage/:matchNumber/schedule",
  checkOwnership,
  async (req, res, next) => {
    try {
      const leagueId = req.params.id;
      const stage = req.params.stage;
      const matchNumber = parseInt(req.params.matchNumber);

      const league = await League.findById(leagueId);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }

      // Tìm match
      const matchIndex = league.matches.findIndex((m) => {
        const stageMatch = m.stage === stage;
        const numberMatch = m.matchNumber === matchNumber || 
                           m.matchNumber === parseInt(matchNumber) ||
                           parseInt(m.matchNumber) === matchNumber;
        return stageMatch && numberMatch;
      });

      if (matchIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy trận đấu",
        });
      }

      // Hủy tất cả bookings (hold và confirmed) của match này
      const deletedBookings = await Booking.deleteMany({
        league: leagueId,
        "matchInfo.stage": stage,
        "matchInfo.matchNumber": matchNumber,
        status: { $in: ["hold", "confirmed"] }
      });

      // Xóa date, time, endTime, courtId khỏi match
      league.matches[matchIndex].date = null;
      league.matches[matchIndex].time = null;
      league.matches[matchIndex].endTime = null;
      league.matches[matchIndex].courtId = null;

      await league.save();

      await logAudit("CANCEL_MATCH_SCHEDULE", req.user._id, req, {
        leagueId: leagueId,
        leagueName: league.name,
        stage: stage,
        matchNumber: matchNumber,
        deletedBookingsCount: deletedBookings.deletedCount
      });

      res.json({
        success: true,
        message: "Đã hủy lịch đấu cho trận này",
        data: {
          deletedBookingsCount: deletedBookings.deletedCount
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/leagues/:id/schedule/all
 * Hủy toàn bộ lịch đấu đã chốt - xóa date/time/courtId của tất cả matches và hủy tất cả confirmed bookings
 * User (người tạo)
 */
router.delete(
  "/:id/schedule/all",
  checkOwnership,
  async (req, res, next) => {
    try {
      const leagueId = req.params.id;

      const league = await League.findById(leagueId);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }

      // Hủy tất cả confirmed bookings của giải đấu này
      const deletedBookings = await Booking.deleteMany({
        league: leagueId,
        status: "confirmed"
      });

      // Xóa date, time, endTime, courtId khỏi tất cả matches
      let updatedMatchesCount = 0;
      for (let i = 0; i < league.matches.length; i++) {
        if (league.matches[i].date || league.matches[i].time || league.matches[i].courtId) {
          league.matches[i].date = null;
          league.matches[i].time = null;
          league.matches[i].endTime = null;
          league.matches[i].courtId = null;
          updatedMatchesCount++;
        }
      }

      await league.save();

      await logAudit("CANCEL_ALL_SCHEDULE", req.user._id, req, {
        leagueId: leagueId,
        leagueName: league.name,
        deletedBookingsCount: deletedBookings.deletedCount,
        updatedMatchesCount: updatedMatchesCount
      });

      res.json({
        success: true,
        message: `Đã hủy toàn bộ lịch đấu. Đã xóa ${updatedMatchesCount} lịch đấu và ${deletedBookings.deletedCount} booking đã chốt.`,
        data: {
          deletedBookingsCount: deletedBookings.deletedCount,
          updatedMatchesCount: updatedMatchesCount
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/leagues/:id/auto-schedule
 * Tự động sắp xếp lịch đấu dựa trên sân có sẵn, khoảng cách giữa các trận, và gợi ý thời gian
 * User (người tạo)
 */
router.post(
  "/:id/auto-schedule",
  checkOwnership,
  async (req, res, next) => {
    try {
      const leagueId = req.params.id;
      const { 
        startDate, 
        endDate, 
        matchDuration = 90, // Thời lượng thi đấu chính thức mỗi trận (phút), mặc định 90 phút
        breakTime = 30, // Thời gian nghỉ giữa hiệp/giữa các trận (phút), mặc định 30 phút
        totalMatchTime, // Tổng thời gian trận đấu (matchDuration + breakTime), nếu không có sẽ tính tự động
        matchesPerDay, // Số lượng trận đấu mỗi ngày (tùy chọn)
        matchesPerRound, // Số lượng trận đấu mỗi vòng (tùy chọn)
        preferredStartTime = "08:00", // Giờ bắt đầu khung giờ hoạt động
        preferredEndTime = "22:00" // Giờ kết thúc khung giờ hoạt động
      } = req.body;

      // Tính tổng thời gian trận đấu (bao gồm thời gian thi đấu chính thức + thời gian nghỉ)
      const totalTimePerMatch = totalMatchTime || (matchDuration + breakTime);

      const league = await League.findById(leagueId)
        .populate("facility")
        .populate("courtId");
      
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }

      if (!league.facility) {
        return res.status(400).json({
          success: false,
          message: "Giải đấu chưa có cơ sở thể thao. Vui lòng chọn cơ sở trước.",
        });
      }

      const facility = typeof league.facility === 'object' 
        ? league.facility 
        : await Facility.findById(league.facility);

      if (!facility) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy cơ sở thể thao",
        });
      }

      // Lấy danh sách sân từ facility, filter theo courtType nếu tournament có
      const courtQuery = {
        facility: facility._id,
        status: 'active'
      };

      // Nếu tournament có courtType, chỉ lấy các sân thuộc loại đó
      if (league.courtType) {
        const courtTypeId = typeof league.courtType === 'object' && league.courtType._id
          ? league.courtType._id
          : league.courtType;
        
        if (mongoose.Types.ObjectId.isValid(courtTypeId)) {
          // Tìm courtType để lấy tên (fallback matching)
          const courtType = await CourtType.findById(courtTypeId).lean();
          
          if (courtType) {
            // Match theo courtType ID hoặc type name
            courtQuery.$or = [
              { courtType: new mongoose.Types.ObjectId(courtTypeId) },
              { type: courtType.name }
            ];
          } else {
            // Fallback: chỉ match theo ID
            courtQuery.courtType = new mongoose.Types.ObjectId(courtTypeId);
          }
        }
      }

      const courts = await Court.find(courtQuery).populate('facility').lean();

      if (courts.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cơ sở không có sân nào. Vui lòng thêm sân trước.",
        });
      }

      // Lấy timeSlotDuration từ facility (khung giờ cố định của sân)
      const slotDuration = facility.timeSlotDuration || 60; // Mặc định 60 phút

      // Lấy tất cả matches chưa có lịch hoặc có thể override
      const matches = league.matches || [];
      if (matches.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Chưa có trận đấu nào. Vui lòng bốc thăm trước.",
        });
      }

      // Xác định khoảng thời gian
      const scheduleStartDate = startDate 
        ? new Date(startDate) 
        : new Date(league.startDate);
      const scheduleEndDate = endDate 
        ? new Date(endDate) 
        : new Date(league.endDate);

      // Lấy giờ hoạt động của facility
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

      // Helper: Chuyển đổi time string (HH:MM) sang phút
      const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      // Helper: Chuyển đổi phút sang time string
      const minutesToTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      };

      // Helper: Kiểm tra xem khung giờ trận đấu có khớp với timeSlotDuration không
      // Trận đấu phải bắt đầu và kết thúc đúng với các khung giờ cố định của sân
      const isTimeSlotAligned = (startTime, endTime, slotDuration) => {
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);
        if (startMinutes === null || endMinutes === null) return false;

        // Kiểm tra startTime có khớp với khung giờ cố định không
        // StartTime phải là bội số của slotDuration tính từ 00:00
        const startMinutesFromMidnight = startMinutes;
        if (startMinutesFromMidnight % slotDuration !== 0) {
          return false; // Không khớp với khung giờ cố định
        }

        // Kiểm tra endTime có khớp với khung giờ cố định không
        const endMinutesFromMidnight = endMinutes;
        if (endMinutesFromMidnight % slotDuration !== 0) {
          return false; // Không khớp với khung giờ cố định
        }

        // Kiểm tra duration có là bội số của slotDuration không
        const duration = endMinutes - startMinutes;
        if (duration % slotDuration !== 0) {
          return false; // Thời lượng không khớp với khung giờ cố định
        }

        return true;
      };

      // Helper: Kiểm tra overlap giữa 2 khoảng thời gian
      // Trả về true nếu có overlap, false nếu không
      const hasTimeOverlap = (start1, end1, start2, end2) => {
        const start1Min = timeToMinutes(start1);
        const end1Min = timeToMinutes(end1);
        const start2Min = timeToMinutes(start2);
        const end2Min = timeToMinutes(end2);
        
        if (start1Min === null || end1Min === null || start2Min === null || end2Min === null) {
          return false;
        }
        
        // Có overlap nếu: start1 < end2 && start2 < end1
        // Tức là: không phải (end1 <= start2 || start1 >= end2)
        return !(end1Min <= start2Min || start1Min >= end2Min);
      };

      // Helper: Thu thập tất cả các time slots đã được sử dụng (bookings, matches, socket locks)
      const getOccupiedTimeSlots = async (courtId, date) => {
        const occupiedSlots = [];
        const bookingDate = new Date(date);
        bookingDate.setHours(0, 0, 0, 0);
        const now = new Date();
        const dateStr = bookingDate.toISOString().split('T')[0];
        
        // 1. Lấy bookings
        const startOfDay = new Date(bookingDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(bookingDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        const existingBookings = await Booking.find({
          court: courtId,
          date: {
            $gte: startOfDay,
            $lte: endOfDay
          },
          status: { $in: ["pending_payment", "hold", "confirmed"] },
          $or: [
            { holdUntil: { $exists: false } },
            { holdUntil: { $gt: now } },
            { status: "confirmed" },
          ],
        }).lean();
        
        for (const booking of existingBookings) {
          for (const slot of (booking.timeSlots || [])) {
            const [slotStart, slotEnd] = slot.split('-');
            occupiedSlots.push({
              type: 'booking',
              start: slotStart,
              end: slotEnd,
              id: booking._id,
              status: booking.status
            });
          }
        }
        
        // 2. Lấy matches đã được sắp lịch trong tournament (cùng sân, cùng ngày)
        for (const otherMatch of league.matches) {
          if (!otherMatch.date || !otherMatch.time || !otherMatch.courtId) continue;
          
          const otherDate = new Date(otherMatch.date);
          otherDate.setHours(0, 0, 0, 0);
          const matchDate = new Date(date);
          matchDate.setHours(0, 0, 0, 0);
          const sameDate = otherDate.getTime() === matchDate.getTime();
          const sameCourt = otherMatch.courtId.toString() === courtId.toString();
          
          if (sameDate && sameCourt) {
            const otherEndTime = otherMatch.endTime || otherMatch.time;
            occupiedSlots.push({
              type: 'match',
              start: otherMatch.time,
              end: otherEndTime,
              stage: otherMatch.stage,
              matchNumber: otherMatch.matchNumber
            });
          }
        }
        
        // 3. Kiểm tra socket locks (realtime)
        // Lấy tất cả các khung giờ có thể bị lock
        // Vì socket locks chỉ có thể lock một slot cụ thể, ta sẽ kiểm tra khi cần
        
        return occupiedSlots;
      };

      // Helper: Kiểm tra sân có sẵn tại thời điểm cụ thể
      // Sử dụng kỹ thuật Overlap Checking
      const isCourtAvailable = async (courtId, date, startTime, endTime) => {
        // Kiểm tra xem khung giờ có khớp với timeSlotDuration không
        if (!isTimeSlotAligned(startTime, endTime, slotDuration)) {
          console.log(`[AUTO_SCHEDULE_AVAILABILITY] Sân ${courtId} KHÔNG khả dụng do khung giờ không khớp với timeSlotDuration:`, {
            requestedTime: `${startTime}-${endTime}`,
            slotDuration: slotDuration,
            message: `Khung giờ phải khớp với các khung giờ cố định ${slotDuration} phút (ví dụ: 8:00-9:00, 9:00-10:00)`
          });
          return false;
        }
        
        const bookingDate = new Date(date);
        bookingDate.setHours(0, 0, 0, 0);
        const dateStr = bookingDate.toISOString().split('T')[0];
        
        // Kiểm tra socket locks (realtime availability)
        const timeSlotStr = `${startTime}-${endTime}`;
        const lock = isSlotLocked(courtId.toString(), dateStr, timeSlotStr);
        
        if (lock) {
          console.log(`[AUTO_SCHEDULE_AVAILABILITY] Sân ${courtId} KHÔNG khả dụng do đang bị lock realtime:`, {
            lockUserId: lock.userId,
            lockedAt: new Date(lock.lockedAt).toISOString(),
            expiresAt: new Date(lock.expiresAt).toISOString(),
            requestedTime: `${startTime}-${endTime}`
          });
          return false;
        }
        
        // Thu thập tất cả các time slots đã được sử dụng
        const occupiedSlots = await getOccupiedTimeSlots(courtId, date);
        
        // Kiểm tra overlap với tất cả các slots đã sử dụng
        for (const occupiedSlot of occupiedSlots) {
          if (hasTimeOverlap(startTime, endTime, occupiedSlot.start, occupiedSlot.end)) {
            console.log(`[AUTO_SCHEDULE_AVAILABILITY] Sân ${courtId} KHÔNG khả dụng do overlap với ${occupiedSlot.type}:`, {
              requestedTime: `${startTime}-${endTime}`,
              occupiedTime: `${occupiedSlot.start}-${occupiedSlot.end}`,
              type: occupiedSlot.type,
              id: occupiedSlot.id || `${occupiedSlot.stage}-${occupiedSlot.matchNumber}`,
              status: occupiedSlot.status
            });
            return false;
          }
        }
        
        console.log(`[AUTO_SCHEDULE_AVAILABILITY] Sân ${courtId} khả dụng (không có overlap với ${occupiedSlots.length} slots đã sử dụng)`);
        return true;
      };

      // Helper: Lấy giờ hoạt động của facility cho ngày cụ thể
      const getOperatingHours = (date) => {
        const dayOfWeek = date.getDay();
        const dayName = dayNames[dayOfWeek];
        const hours = facility.operatingHours?.[dayName];
        
        if (!hours || !hours.isOpen) {
          return null; // Facility không mở vào ngày này
        }

        return {
          open: hours.open || "06:00",
          close: hours.close || "22:00"
        };
      };

      // Helper: Kiểm tra xem ngày đó còn khung giờ trống không (cho ít nhất một sân)
      // Kiểm tra toàn bộ khung giờ trong ngày với step = slotDuration để khớp với khung giờ cố định
      const hasAvailableSlotsForDay = async (date) => {
        const operatingHours = getOperatingHours(date);
        if (!operatingHours) {
          return false; // Facility không mở
        }

        const openMinutes = timeToMinutes(operatingHours.open);
        const closeMinutes = timeToMinutes(operatingHours.close);
        const preferredStartMinutes = timeToMinutes(preferredStartTime);
        const preferredEndMinutes = timeToMinutes(preferredEndTime);

        // Tính khoảng thời gian có thể sử dụng
        let availableStart = Math.max(openMinutes, preferredStartMinutes);
        let availableEnd = Math.min(closeMinutes, preferredEndMinutes);

        // Điều chỉnh availableStart để khớp với timeSlotDuration
        availableStart = Math.ceil(availableStart / slotDuration) * slotDuration;

        // Tính số khung giờ cần thiết cho trận đấu (dựa trên totalMatchTime)
        const requiredSlots = Math.ceil(totalTimePerMatch / slotDuration);
        const matchDurationInSlots = Math.ceil(matchDuration / slotDuration);
        const requiredDuration = requiredSlots * slotDuration;

        if (availableEnd - availableStart < requiredDuration) {
          return false; // Không đủ thời gian cho một trận đấu
        }

        // Kiểm tra toàn bộ khung giờ trong ngày với step = slotDuration
        // Đảm bảo chỉ kiểm tra các khung giờ khớp với timeSlotDuration
        let currentTime = availableStart;

        // Kiểm tra từng sân và từng khung giờ
        while (currentTime + requiredDuration <= availableEnd) {
          const startTime = minutesToTime(currentTime);
          // EndTime dựa trên matchDuration (không bao gồm breakTime trong endTime)
          const endTime = minutesToTime(currentTime + (matchDurationInSlots * slotDuration));

          // Thử tất cả các sân cho khung giờ này
          for (const court of courts) {
            const available = await isCourtAvailable(
              court._id,
              date,
              startTime,
              endTime
            );
            if (available) {
              // Tìm thấy ít nhất một slot trống, ngày này còn chỗ
              return true;
            }
          }

          // Chuyển sang khung giờ tiếp theo (tăng lên 1 slotDuration)
          currentTime += slotDuration;
        }

        // Đã kiểm tra toàn bộ khung giờ, không tìm thấy slot trống nào
        return false;
      };

      // Sắp xếp matches theo stage và matchNumber
      // Lọc bỏ matches có BYE (không cần sắp lịch cho trận BYE)
      const sortedMatches = matches
        .filter(m => {
          // Lọc bỏ matches có BYE
          const hasBye = m.team1Id === "BYE" || m.team2Id === "BYE";
          // Chỉ lấy matches chưa có lịch hoặc có thể override, và không có BYE
          return (!m.date || !m.time) && !hasBye;
        })
        .sort((a, b) => {
          const stageOrder = ['round1', 'round2', 'round3', 'round4', 'semi', 'final'];
          const stageA = stageOrder.indexOf(a.stage) !== -1 ? stageOrder.indexOf(a.stage) : 999;
          const stageB = stageOrder.indexOf(b.stage) !== -1 ? stageOrder.indexOf(b.stage) : 999;
          if (stageA !== stageB) return stageA - stageB;
          return (a.matchNumber || 0) - (b.matchNumber || 0);
        });

      // Nhóm matches theo stage để phân bổ theo vòng
      const matchesByStage = {};
      for (const match of sortedMatches) {
        if (!matchesByStage[match.stage]) {
          matchesByStage[match.stage] = [];
        }
        matchesByStage[match.stage].push(match);
      }

      // Tính số khung giờ cần thiết cho một trận đấu (dựa trên totalMatchTime)
      const requiredSlotsPerMatch = Math.ceil(totalTimePerMatch / slotDuration);
      const matchDurationInSlots = Math.ceil(matchDuration / slotDuration);

      // Tính số trận đấu tối đa mỗi ngày dựa trên khung giờ hoạt động
      const preferredStartMinutes = timeToMinutes(preferredStartTime);
      const preferredEndMinutes = timeToMinutes(preferredEndTime);
      const availableMinutesPerDay = preferredEndMinutes - preferredStartMinutes;
      const maxMatchesPerDayByTime = Math.floor(availableMinutesPerDay / (requiredSlotsPerMatch * slotDuration));

      // Xác định số trận đấu mỗi ngày
      let targetMatchesPerDay = matchesPerDay;
      if (!targetMatchesPerDay) {
        // Nếu không có matchesPerDay, tính dựa trên matchesPerRound hoặc mặc định
        if (matchesPerRound) {
          // Tính số ngày cần thiết cho mỗi vòng
          const maxMatchesInRound = Math.max(...Object.values(matchesByStage).map(m => m.length));
          const daysNeededPerRound = Math.ceil(maxMatchesInRound / matchesPerRound);
          // Phân bổ đều
          targetMatchesPerDay = Math.ceil(maxMatchesInRound / daysNeededPerRound);
        } else {
          // Mặc định: sử dụng giới hạn dựa trên thời gian
          targetMatchesPerDay = Math.max(1, Math.min(maxMatchesPerDayByTime, Math.ceil(sortedMatches.length / 7)));
        }
      }

      // Đảm bảo không vượt quá giới hạn thời gian
      targetMatchesPerDay = Math.min(targetMatchesPerDay, maxMatchesPerDayByTime);

      console.log(`[AUTO_SCHEDULE] Cấu hình:`, {
        totalMatches: sortedMatches.length,
        targetMatchesPerDay,
        maxMatchesPerDayByTime,
        totalTimePerMatch,
        matchDuration,
        breakTime,
        requiredSlotsPerMatch,
        slotDuration
      });

      const scheduledMatches = [];
      const failedMatches = [];

      // Phân bổ trận đấu vào các ngày
      let currentDate = new Date(scheduleStartDate);
      let matchesScheduledToday = 0;
      let currentCourtIndex = 0;
      let currentTimeMinutes = timeToMinutes(preferredStartTime);
      // Điều chỉnh currentTimeMinutes để khớp với timeSlotDuration
      currentTimeMinutes = Math.floor(currentTimeMinutes / slotDuration) * slotDuration;

      // Hàm helper: Chuyển sang ngày tiếp theo
      const moveToNextDay = () => {
        currentDate.setDate(currentDate.getDate() + 1);
        matchesScheduledToday = 0;
        currentTimeMinutes = timeToMinutes(preferredStartTime);
        currentTimeMinutes = Math.floor(currentTimeMinutes / slotDuration) * slotDuration;
        currentCourtIndex = 0;
      };

      // Hàm helper: Kiểm tra xem có thể sắp thêm trận trong ngày không
      const canScheduleMoreToday = () => {
        if (matchesScheduledToday >= targetMatchesPerDay) {
          return false;
        }
        const operatingHours = getOperatingHours(currentDate);
        if (!operatingHours) return false;
        const openMinutes = timeToMinutes(operatingHours.open);
        const closeMinutes = timeToMinutes(operatingHours.close);
        const preferredEndMinutes = timeToMinutes(preferredEndTime);
        const maxEndMinutes = Math.min(closeMinutes, preferredEndMinutes);
        
        // Kiểm tra xem còn đủ thời gian cho ít nhất 1 trận nữa không
        const nextMatchStart = currentTimeMinutes;
        const nextMatchEnd = nextMatchStart + (requiredSlotsPerMatch * slotDuration);
        return nextMatchEnd <= maxEndMinutes;
      };

      for (const match of sortedMatches) {
        let scheduled = false;
        let attempts = 0;
        const maxAttempts = courts.length * 30; // Tăng số lần thử để tìm slot phù hợp

        // Kiểm tra xem có thể sắp thêm trận trong ngày hiện tại không
        if (!canScheduleMoreToday()) {
          moveToNextDay();
        }

        while (!scheduled && attempts < maxAttempts) {
          // Kiểm tra xem đã vượt quá ngày kết thúc chưa
          if (currentDate > scheduleEndDate) {
            break; // Đã hết thời gian
          }

          // Kiểm tra xem đã đạt số trận tối đa trong ngày chưa
          if (matchesScheduledToday >= targetMatchesPerDay) {
            moveToNextDay();
            continue;
          }

          const operatingHours = getOperatingHours(currentDate);
          
          if (!operatingHours) {
            // Facility không mở, chuyển sang ngày tiếp theo
            moveToNextDay();
            attempts++;
            continue;
          }

          // Kiểm tra xem ngày đó còn khung giờ trống không
          const hasSlots = await hasAvailableSlotsForDay(currentDate);
          if (!hasSlots) {
            console.log(`[AUTO_SCHEDULE] Ngày ${currentDate.toISOString().split('T')[0]} đã kín, chuyển sang ngày tiếp theo`);
            moveToNextDay();
            attempts++;
            continue;
          }

          const openMinutes = timeToMinutes(operatingHours.open);
          const closeMinutes = timeToMinutes(operatingHours.close);
          const preferredStartMinutes = timeToMinutes(preferredStartTime);
          const preferredEndMinutes = timeToMinutes(preferredEndTime);

          // Đảm bảo currentTimeMinutes trong khoảng hoạt động và khớp với timeSlotDuration
          if (currentTimeMinutes < openMinutes) {
            currentTimeMinutes = Math.max(openMinutes, preferredStartMinutes);
          }
          
          // Điều chỉnh currentTimeMinutes để khớp với timeSlotDuration
          currentTimeMinutes = Math.floor(currentTimeMinutes / slotDuration) * slotDuration;
          
          // Đảm bảo currentTimeMinutes không nhỏ hơn openMinutes sau khi làm tròn
          if (currentTimeMinutes < openMinutes) {
            currentTimeMinutes = Math.ceil(openMinutes / slotDuration) * slotDuration;
          }
          
          // Tính thời gian kết thúc dựa trên totalMatchTime (matchDuration + breakTime)
          const endTimeMinutes = currentTimeMinutes + (requiredSlotsPerMatch * slotDuration);
          const maxEndMinutes = Math.min(closeMinutes, preferredEndMinutes);
          
          if (currentTimeMinutes > maxEndMinutes || endTimeMinutes > maxEndMinutes) {
            // Không đủ thời gian trong ngày, chuyển sang ngày tiếp theo
            moveToNextDay();
            attempts++;
            continue;
          }

          // Thử từng sân
          let foundAvailable = false;
          for (let i = 0; i < courts.length; i++) {
            const courtIndex = (currentCourtIndex + i) % courts.length;
            const court = courts[courtIndex];
            const startTime = minutesToTime(currentTimeMinutes);
            // EndTime dựa trên matchDuration (không bao gồm breakTime trong endTime)
            const endTime = minutesToTime(currentTimeMinutes + (matchDurationInSlots * slotDuration));

            const available = await isCourtAvailable(
              court._id,
              currentDate,
              startTime,
              endTime
            );

            if (available) {
              // Tìm match trong league.matches và cập nhật
              const matchIndex = league.matches.findIndex(m => 
                m.stage === match.stage && m.matchNumber === match.matchNumber
              );

              if (matchIndex !== -1) {
                league.matches[matchIndex].date = new Date(currentDate);
                league.matches[matchIndex].time = startTime;
                league.matches[matchIndex].endTime = endTime;
                league.matches[matchIndex].courtId = court._id;

                scheduledMatches.push({
                  stage: match.stage,
                  matchNumber: match.matchNumber,
                  date: new Date(currentDate),
                  time: startTime,
                  endTime: endTime,
                  courtId: court._id,
                  courtName: court.name
                });

                // Cập nhật thời gian cho trận tiếp theo (sử dụng totalMatchTime)
                currentTimeMinutes = endTimeMinutes + breakTime;
                // Điều chỉnh để khớp với timeSlotDuration (làm tròn lên)
                currentTimeMinutes = Math.ceil(currentTimeMinutes / slotDuration) * slotDuration;
                currentCourtIndex = (courtIndex + 1) % courts.length;
                matchesScheduledToday++;
                scheduled = true;
                foundAvailable = true;
                break;
              }
            }
          }

          if (!foundAvailable) {
            // Không tìm được sân, tăng thời gian lên 1 khung giờ (slotDuration)
            currentTimeMinutes += slotDuration;
            const maxEndMinutes = Math.min(
              timeToMinutes(operatingHours.close), 
              timeToMinutes(preferredEndTime)
            );
            
            if (currentTimeMinutes + (requiredSlotsPerMatch * slotDuration) > maxEndMinutes) {
              // Không còn đủ thời gian trong ngày, chuyển sang ngày tiếp theo
              moveToNextDay();
            }
            attempts++;
          }
        }

        if (!scheduled) {
          failedMatches.push({
            stage: match.stage,
            matchNumber: match.matchNumber
          });
        }
      }

      await league.save();

      await logAudit("AUTO_SCHEDULE", req.user._id, req, {
        leagueId: leagueId,
        leagueName: league.name,
        scheduledCount: scheduledMatches.length,
        failedCount: failedMatches.length,
      });

      // Tạo message phù hợp
      let message;
      if (failedMatches.length === 0) {
        message = `Đã tự động sắp xếp ${scheduledMatches.length}/${sortedMatches.length} trận đấu thành công`;
      } else if (scheduledMatches.length === 0) {
        message = `Không thể sắp xếp lịch đấu trong khoảng thời gian đã chọn. Vui lòng thử đổi ngày bắt đầu và ngày kết thúc khác.`;
      } else {
        message = `Đã tự động sắp xếp ${scheduledMatches.length}/${sortedMatches.length} trận đấu. ${failedMatches.length} trận không thể sắp xếp. Vui lòng thử đổi ngày bắt đầu và ngày kết thúc để sắp xếp các trận còn lại.`;
      }

      res.json({
        success: true,
        message: message,
        data: {
          scheduled: scheduledMatches,
          failed: failedMatches,
          league: league
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/leagues/:id/matches/result
 * Cập nhật kết quả trận đấu (score1, score2)
 * Tự động tính winner và cập nhật vào vòng tiếp theo (single-elimination)
 * Cập nhật thống kê teams (wins, draws, losses) cho round-robin
 * User (người tạo)
 */
router.put(
  "/:id/matches/result",
  checkOwnership,
  async (req, res, next) => {
    try {
      const leagueId = req.params.id;
      const { stage, matchNumber, score1, score2, penaltyScore1, penaltyScore2 } = req.body;

      if (stage === undefined || matchNumber === undefined) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin stage hoặc matchNumber",
        });
      }

      // Cho phép null để hủy kết quả, nhưng không cho phép undefined
      if (score1 === undefined || score2 === undefined) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin kết quả (score1, score2)",
        });
      }

      const league = await League.findById(leagueId);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }

      // Tìm match
      const matchIndex = league.matches.findIndex((m) => {
        const stageMatch = m.stage === stage;
        const numberMatch = m.matchNumber === matchNumber || 
                           m.matchNumber === parseInt(matchNumber) ||
                           parseInt(m.matchNumber) === matchNumber;
        return stageMatch && numberMatch;
      });

      if (matchIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy trận đấu",
        });
      }

      const match = league.matches[matchIndex];
      const oldScore1 = match.score1;
      const oldScore2 = match.score2;
      const oldPenaltyScore1 = match.penaltyScore1;
      const oldPenaltyScore2 = match.penaltyScore2;
      
      // Tính oldWinnerId (bao gồm cả penalty nếu hòa)
      let oldWinnerId = null;
      if (oldScore1 !== null && oldScore2 !== null) {
        if (oldScore1 > oldScore2) {
          oldWinnerId = match.team1Id;
        } else if (oldScore1 < oldScore2) {
          oldWinnerId = match.team2Id;
        } else if (oldPenaltyScore1 !== null && oldPenaltyScore2 !== null) {
          // Hòa, xét đá luân lưu
          oldWinnerId = oldPenaltyScore1 > oldPenaltyScore2 ? match.team1Id : 
                       oldPenaltyScore1 < oldPenaltyScore2 ? match.team2Id : null;
        }
      }

      // Cập nhật kết quả
      match.score1 = score1 !== null && score1 !== undefined ? parseInt(score1) : null;
      match.score2 = score2 !== null && score2 !== undefined ? parseInt(score2) : null;
      match.penaltyScore1 = penaltyScore1 !== undefined && penaltyScore1 !== null ? parseInt(penaltyScore1) : null;
      match.penaltyScore2 = penaltyScore2 !== undefined && penaltyScore2 !== null ? parseInt(penaltyScore2) : null;

      // Kiểm tra format giải đấu
      const isRoundRobin = league.format === 'Vòng tròn' || league.format === 'round-robin' || stage === 'round-robin';

      if (isRoundRobin) {
        // Round-robin: Cập nhật thống kê teams
        const team1Id = match.team1Id;
        const team2Id = match.team2Id;

        // Tìm teams
        const team1Index = league.teams.findIndex(t => 
          (t.id === team1Id) || (t._id && t._id.toString() === team1Id?.toString())
        );
        const team2Index = league.teams.findIndex(t => 
          (t.id === team2Id) || (t._id && t._id.toString() === team2Id?.toString())
        );

        // Nếu có kết quả cũ, trừ đi thống kê cũ
        if (oldScore1 !== null && oldScore2 !== null && team1Index !== -1 && team2Index !== -1) {
          const oldTeam1 = league.teams[team1Index];
          const oldTeam2 = league.teams[team2Index];

          if (oldScore1 > oldScore2) {
            oldTeam1.wins = Math.max(0, (oldTeam1.wins || 0) - 1);
            oldTeam2.losses = Math.max(0, (oldTeam2.losses || 0) - 1);
          } else if (oldScore1 < oldScore2) {
            oldTeam1.losses = Math.max(0, (oldTeam1.losses || 0) - 1);
            oldTeam2.wins = Math.max(0, (oldTeam2.wins || 0) - 1);
          } else {
            oldTeam1.draws = Math.max(0, (oldTeam1.draws || 0) - 1);
            oldTeam2.draws = Math.max(0, (oldTeam2.draws || 0) - 1);
          }
        }

        // Cập nhật thống kê mới
        if (match.score1 !== null && match.score2 !== null && team1Index !== -1 && team2Index !== -1) {
          const team1 = league.teams[team1Index];
          const team2 = league.teams[team2Index];

          if (!team1.wins) team1.wins = 0;
          if (!team1.draws) team1.draws = 0;
          if (!team1.losses) team1.losses = 0;
          if (!team2.wins) team2.wins = 0;
          if (!team2.draws) team2.draws = 0;
          if (!team2.losses) team2.losses = 0;

          if (match.score1 > match.score2) {
            team1.wins += 1;
            team2.losses += 1;
          } else if (match.score1 < match.score2) {
            team1.losses += 1;
            team2.wins += 1;
          } else {
            team1.draws += 1;
            team2.draws += 1;
          }

          league.teams[team1Index] = team1;
          league.teams[team2Index] = team2;
        }
      } else {
        // Single-elimination: Tự động tính winner và cập nhật vào vòng tiếp theo (PROPAGATION)
        
        // Bước 1: Xóa đội thắng cũ khỏi vòng tiếp theo (nếu có kết quả cũ)
        if (oldWinnerId && oldWinnerId !== "BYE" && match.nextMatchId) {
          const [oldNextStage, oldNextMatchNumber] = match.nextMatchId.split('_');
          const oldNextMatchIndex = league.matches.findIndex(m => 
            m.stage === oldNextStage && m.matchNumber === parseInt(oldNextMatchNumber)
          );
          
          if (oldNextMatchIndex !== -1) {
            const oldNextMatch = league.matches[oldNextMatchIndex];
            const isOddMatch = match.matchNumber % 2 === 1;
            
            // Xóa đội thắng cũ (chỉ xóa nếu đúng là đội thắng cũ)
            if (isOddMatch && oldNextMatch.team1Id === oldWinnerId) {
              oldNextMatch.team1Id = null;
            } else if (!isOddMatch && oldNextMatch.team2Id === oldWinnerId) {
              oldNextMatch.team2Id = null;
            }
            
            league.matches[oldNextMatchIndex] = oldNextMatch;
          }
        }
        
        // Bước 2: Điền đội thắng mới vào vòng tiếp theo
        if (match.score1 !== null && match.score2 !== null) {
          // Xử lý BYE: nếu một trong hai đội là BYE, đội còn lại tự động thắng
          let winnerId = null;
          
          if (match.team1Id === "BYE" || match.team2Id === "BYE") {
            // Có BYE trong trận đấu
            winnerId = match.team1Id !== "BYE" ? match.team1Id : match.team2Id;
          } else {
            // Trận đấu bình thường, tính winner dựa trên điểm số
            if (match.score1 > match.score2) {
              winnerId = match.team1Id;
            } else if (match.score1 < match.score2) {
              winnerId = match.team2Id;
            } else {
              // Hòa, xét đá luân lưu
              if (match.penaltyScore1 !== null && match.penaltyScore2 !== null) {
                if (match.penaltyScore1 > match.penaltyScore2) {
                  winnerId = match.team1Id;
                } else if (match.penaltyScore1 < match.penaltyScore2) {
                  winnerId = match.team2Id;
                } else {
                  winnerId = null; // Vẫn hòa sau đá luân lưu (trường hợp hiếm)
                }
              } else {
                winnerId = null; // Hòa nhưng chưa có kết quả đá luân lưu
              }
            }
          }

          if (winnerId && winnerId !== "BYE" && match.nextMatchId) {
            // Sử dụng nextMatchId đã được tính toán sẵn khi bốc thăm
            const [nextStage, nextMatchNumber] = match.nextMatchId.split('_');
            
            // Tìm match tiếp theo
            let nextMatchIndex = league.matches.findIndex(m => 
              m.stage === nextStage && m.matchNumber === parseInt(nextMatchNumber)
            );

            if (nextMatchIndex === -1) {
              // Tạo match mới ở vòng tiếp theo (trường hợp hiếm, không nên xảy ra)
              const nextMatch = {
                stage: nextStage,
                matchNumber: parseInt(nextMatchNumber),
                team1Id: null,
                team2Id: null,
                date: null,
                time: null,
                score1: null,
                score2: null,
                nextMatchId: null, // Sẽ được tính sau
                hasBye: false,
              };

              // Xác định vị trí team (team1 hoặc team2) dựa trên matchNumber hiện tại
              // Match 1, 2 -> Match 1 vòng tiếp theo (team1, team2)
              // Match 3, 4 -> Match 2 vòng tiếp theo (team1, team2)
              const isOddMatch = match.matchNumber % 2 === 1;
              if (isOddMatch) {
                // Match lẻ (1, 3, 5...) -> team1 ở vòng tiếp theo
                nextMatch.team1Id = winnerId;
              } else {
                // Match chẵn (2, 4, 6...) -> team2 ở vòng tiếp theo
                nextMatch.team2Id = winnerId;
              }

              league.matches.push(nextMatch);
            } else {
              // Cập nhật match hiện có - PROPAGATION: Đẩy đội thắng lên vòng tiếp theo
              const nextMatch = league.matches[nextMatchIndex];
              
              // Xác định vị trí team (team1 hoặc team2) dựa trên matchNumber hiện tại
              const isOddMatch = match.matchNumber % 2 === 1;
              if (isOddMatch) {
                // Match lẻ (1, 3, 5...) -> team1 ở vòng tiếp theo
                // Chỉ cập nhật nếu chưa có team1 hoặc đang ghi đè
                nextMatch.team1Id = winnerId;
              } else {
                // Match chẵn (2, 4, 6...) -> team2 ở vòng tiếp theo
                // Chỉ cập nhật nếu chưa có team2 hoặc đang ghi đè
                nextMatch.team2Id = winnerId;
              }

              // Đảm bảo cập nhật vào mảng
              league.matches[nextMatchIndex] = nextMatch;
            }
          }
        }
        
        // Bước 3: Xử lý hủy kết quả (khi score1 hoặc score2 = null)
        // Nếu cả hai đều null hoặc một trong hai null, xóa đội thắng khỏi vòng tiếp theo
        if ((match.score1 === null || match.score2 === null) && oldWinnerId && oldWinnerId !== "BYE" && match.nextMatchId) {
          // Logic xóa đội thắng cũ đã được xử lý ở Bước 1 (dòng 2456-2476)
          // Nhưng cần đảm bảo rằng khi hủy kết quả, đội thắng cũ vẫn bị xóa
          // Logic này đã có sẵn ở Bước 1, không cần thêm gì
        }

        // Bước 4: Kiểm tra trận chung kết (final) - Nếu có đội vô địch, chuyển status thành "completed"
        if (match.stage === 'final' && match.score1 !== null && match.score2 !== null) {
          // Xác định đội thắng
          let winnerId = null;
          
          if (match.team1Id === "BYE" || match.team2Id === "BYE") {
            // Có BYE trong trận đấu
            winnerId = match.team1Id !== "BYE" ? match.team1Id : match.team2Id;
          } else {
            // Trận đấu bình thường, tính winner dựa trên điểm số
            if (match.score1 > match.score2) {
              winnerId = match.team1Id;
            } else if (match.score1 < match.score2) {
              winnerId = match.team2Id;
            } else {
              // Hòa, xét đá luân lưu
              if (match.penaltyScore1 !== null && match.penaltyScore2 !== null) {
                if (match.penaltyScore1 > match.penaltyScore2) {
                  winnerId = match.team1Id;
                } else if (match.penaltyScore1 < match.penaltyScore2) {
                  winnerId = match.team2Id;
                } else {
                  winnerId = null; // Vẫn hòa sau đá luân lưu (trường hợp hiếm)
                }
              } else {
                winnerId = null; // Hòa nhưng chưa có kết quả đá luân lưu
              }
            }
          }

          // Nếu có đội thắng (không phải hòa), chuyển status thành "completed" và lưu đội vô địch
          if (winnerId && winnerId !== "BYE") {
            league.status = 'completed';
            league.champion = winnerId; // Lưu đội vô địch
          } else if (match.score1 === null || match.score2 === null) {
            // Nếu hủy kết quả trận final, chuyển lại status về "ongoing" và xóa đội vô địch
            if (league.status === 'completed') {
              league.status = 'ongoing';
              league.champion = null; // Xóa đội vô địch
            }
          } else if (winnerId === null) {
            // Trường hợp hòa (score1 === score2), không có đội vô địch
            league.champion = null;
          }
        }
      }

      await league.save();

      await logAudit("UPDATE_MATCH_RESULT", req.user._id, req, {
        leagueId: leagueId,
        leagueName: league.name,
        stage: stage,
        matchNumber: matchNumber,
        score1: match.score1,
        score2: match.score2,
        format: league.format,
      });

      res.json({
        success: true,
        message: "Cập nhật kết quả trận đấu thành công",
        data: league,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/leagues/:id/schedule/template
 * Tải file mẫu Excel để thêm lịch đấu
 * User (người tạo)
 */
router.get(
  "/:id/schedule/template",
  checkOwnership,
  async (req, res, next) => {
    try {
      const league = await League.findById(req.params.id);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Lịch đấu');

      worksheet.columns = [
        { header: 'Vòng đấu', key: 'stage', width: 20 },
        { header: 'Đội 1', key: 'team1', width: 30 },
        { header: 'Đội 2', key: 'team2', width: 30 },
        { header: 'Ngày thi đấu', key: 'date', width: 20 },
        { header: 'Giờ bắt đầu', key: 'time', width: 20 },
        { header: 'Giờ kết thúc', key: 'endTime', width: 20 }
      ];

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      const mapStageToStageName = (stage) => {
        switch (stage) {
          case 'final': return 'chung kết';
          case 'semi': return 'bán kết';
          case 'round3': return 'tứ kết';
          case 'round4': return 'vòng 4';
          case 'round2': return 'vòng 2';
          case 'round1': return 'vòng 1';
          case 'round-robin': return 'vòng tròn';
          default: return stage;
        }
      };

      const getTeamName = (teamId, teams) => {
        if (teamId === null || teamId === undefined) return null;
        
        // Xử lý BYE
        if (teamId === "BYE" || String(teamId) === "BYE") {
          return "BYE";
        }
        
        let teamIdStr = String(teamId);
        let teamIdNum = null;
        
        if (typeof teamId === 'number') {
          teamIdNum = teamId;
        } else if (teamId && typeof teamId === 'object' && teamId.toString) {
          teamIdStr = teamId.toString();
          const parsed = parseInt(teamIdStr);
          if (!isNaN(parsed)) {
            teamIdNum = parsed;
          }
        } else {
          const parsed = parseInt(teamId);
          if (!isNaN(parsed)) {
            teamIdNum = parsed;
          }
        }
        
        for (const team of teams) {
          if (team.id !== null && team.id !== undefined) {
            if (team.id === teamId) {
              return team.teamNumber || `Đội #${team.id}`;
            }
            
            if (teamIdNum !== null && typeof team.id === 'number' && team.id === teamIdNum) {
              return team.teamNumber || `Đội #${team.id}`;
            }
            
            if (String(team.id) === teamIdStr) {
              return team.teamNumber || `Đội #${team.id}`;
            }
          }
          
          if (team._id) {
            const tIdMongoStr = String(team._id);
            if (tIdMongoStr === teamIdStr) {
              return team.teamNumber || `Đội #${team.id || team._id}`;
            }
            
            if (teamIdNum !== null && team._id.toString && String(team._id) === String(teamIdNum)) {
              return team.teamNumber || `Đội #${team.id || team._id}`;
            }
          }
        }
        
        return null;
      };

      const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      };

      const formatTime = (time) => {
        if (!time) return '';
        return time.toString();
      };

      const isRoundRobin = league.format === 'Vòng tròn' || league.format === 'round-robin';
      
      if (league.matches && league.matches.length > 0) {
        const sortedMatches = [...league.matches].sort((a, b) => {
          const stageOrder = ['round1', 'round2', 'round3', 'round4', 'semi', 'final', 'round-robin'];
          const stageA = stageOrder.indexOf(a.stage) !== -1 ? stageOrder.indexOf(a.stage) : 999;
          const stageB = stageOrder.indexOf(b.stage) !== -1 ? stageOrder.indexOf(b.stage) : 999;
          if (stageA !== stageB) return stageA - stageB;
          return (a.matchNumber || 0) - (b.matchNumber || 0);
        });

        sortedMatches.forEach(match => {
          const stageName = mapStageToStageName(match.stage);
          let team1Name = '';
          let team2Name = '';

          const getPrevStage = (currentStage) => {
            switch (currentStage) {
              case 'final': return 'semi';
              case 'semi': return 'round3';
              case 'round3': return 'round4';
              case 'round4': return 'round4';
              default: return 'round1';
            }
          };

          if (match.team1Id !== null && match.team1Id !== undefined) {
            // Xử lý BYE
            if (match.team1Id === "BYE" || String(match.team1Id) === "BYE") {
              team1Name = "BYE";
            } else {
              const foundTeam1Name = getTeamName(match.team1Id, league.teams);
              team1Name = foundTeam1Name || `Đội #${match.team1Id}`;
            }
          } else {
            const prevStage = getPrevStage(match.stage);
            const prevStageName = mapStageToStageName(prevStage);
            const prevMatchNumber = (match.matchNumber - 1) * 2 + 1;
            team1Name = `W#${prevMatchNumber} ${prevStageName}`;
          }

          if (match.team2Id !== null && match.team2Id !== undefined) {
            // Xử lý BYE
            if (match.team2Id === "BYE" || String(match.team2Id) === "BYE") {
              team2Name = "BYE";
            } else {
              const foundTeam2Name = getTeamName(match.team2Id, league.teams);
              team2Name = foundTeam2Name || `Đội #${match.team2Id}`;
            }
          } else {
            const prevStage = getPrevStage(match.stage);
            const prevStageName = mapStageToStageName(prevStage);
            const prevMatchNumber = (match.matchNumber - 1) * 2 + 2;
            team2Name = `W#${prevMatchNumber} ${prevStageName}`;
          }

          const dateStr = formatDate(match.date);
          const timeStr = formatTime(match.time);
          const endTimeStr = formatTime(match.endTime);

          worksheet.addRow([stageName, team1Name, team2Name, dateStr, timeStr, endTimeStr]);
        });
      } else {
        const isRoundRobin = league.format === 'Vòng tròn' || league.format === 'round-robin';
        
        if (isRoundRobin) {
          worksheet.addRow(['vòng tròn', 'Đội 1', 'Đội 2', '', '', '']);
          worksheet.addRow(['vòng tròn', 'Đội 3', 'Đội 4', '', '', '']);
        } else {
          const numTeams = league.maxParticipants || 4;
          if (numTeams === 2) {
            worksheet.addRow(['chung kết', 'Đội 1', 'Đội 2', '', '', '']);
          } else if (numTeams === 4) {
            worksheet.addRow(['bán kết', 'Đội 1', 'Đội 2', '', '', '']);
            worksheet.addRow(['bán kết', 'Đội 3', 'Đội 4', '', '', '']);
            worksheet.addRow(['chung kết', 'W#1 bán kết', 'W#2 bán kết', '', '', '']);
          } else if (numTeams === 8) {
            worksheet.addRow(['tứ kết', 'Đội 1', 'Đội 2', '', '', '']);
            worksheet.addRow(['tứ kết', 'Đội 3', 'Đội 4', '', '', '']);
            worksheet.addRow(['tứ kết', 'Đội 5', 'Đội 6', '', '', '']);
            worksheet.addRow(['tứ kết', 'Đội 7', 'Đội 8', '', '', '']);
            worksheet.addRow(['bán kết', 'W#1 tứ kết', 'W#2 tứ kết', '', '', '']);
            worksheet.addRow(['bán kết', 'W#3 tứ kết', 'W#4 tứ kết', '', '', '']);
            worksheet.addRow(['chung kết', 'W#1 bán kết', 'W#2 bán kết', '', '', '']);
          } else {
            worksheet.addRow(['vòng 1', 'Đội 1', 'Đội 2', '', '', '']);
            worksheet.addRow(['vòng 1', 'Đội 3', 'Đội 4', '', '', '']);
          }
        }
      }

      const dateColumn = worksheet.getColumn('date');
      dateColumn.numFmt = '@';
      
      const timeColumn = worksheet.getColumn('time');
      timeColumn.numFmt = '@';
      
      const endTimeColumn = worksheet.getColumn('endTime');
      endTimeColumn.numFmt = '@';

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="mau-lich-dau.xlsx"');

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/leagues/:id/schedule/import
 * Import lịch đấu từ file Excel
 * User (người tạo)
 */
router.post(
  "/:id/schedule/import",
  checkOwnership,
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Không có file được upload",
        });
      }

      const league = await League.findById(req.params.id);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);

      const worksheet = workbook.getWorksheet(1) || workbook.worksheets[0];
      if (!worksheet) {
        return res.status(400).json({
          success: false,
          message: "File Excel không hợp lệ",
        });
      }

      const isRoundRobin = league.format === 'Vòng tròn' || league.format === 'round-robin';
      
      const mapStageNameToStage = (stageName) => {
        const normalized = stageName?.toLowerCase()?.trim() || '';
        if (normalized === 'chung kết' || normalized === 'chungket') return 'final';
        if (normalized === 'bán kết' || normalized === 'banket' || normalized === 'bán kết') return 'semi';
        if (normalized === 'tứ kết' || normalized === 'tuket') return 'round3';
        if (normalized === 'vòng tròn' || normalized === 'vongtron' || normalized === 'round-robin') return 'round-robin';
        if (normalized.startsWith('vòng ')) {
          const roundNum = parseInt(normalized.replace('vòng ', '').trim());
          if (!isNaN(roundNum) && roundNum >= 1 && roundNum <= 4) {
            return `round${roundNum}`;
          }
        }
        return null;
      };

      const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const str = dateStr.toString().trim();
        const parts = str.split('-');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            const date = new Date(year, month - 1, day);
            if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
              return date;
            }
          }
        }
        return null;
      };

      const parseTime = (timeStr) => {
        if (!timeStr) return null;
        const str = timeStr.toString().trim();
        const parts = str.split(':');
        if (parts.length === 2) {
          const hour = parseInt(parts[0]);
          const minute = parseInt(parts[1]);
          if (!isNaN(hour) && !isNaN(minute) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
            return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          }
        }
        return null;
      };

      const findTeamIdByName = (teamName) => {
        if (!teamName) return null;
        const normalizedName = teamName.toString().trim();
        
        if (normalizedName.startsWith('W#') || normalizedName.startsWith('w#')) {
          return null;
        }

        const team = league.teams.find(t => {
          const teamNumber = t.teamNumber?.toString().trim() || '';
          return teamNumber === normalizedName || 
                 teamNumber === `Đội ${normalizedName}` ||
                 teamNumber === `Đội #${normalizedName}` ||
                 normalizedName === `Đội ${t.id}` ||
                 normalizedName === `Đội #${t.id}`;
        });

        return team ? (team.id || team._id) : null;
      };

      const schedules = [];
      const errors = [];
      let rowNumber = 0;

      worksheet.eachRow((row, rowNum) => {
        rowNumber = rowNum;
        if (rowNum === 1) return;

        const stageName = row.getCell(1).value?.toString()?.trim() || '';
        const team1Name = row.getCell(2).value?.toString()?.trim() || '';
        const team2Name = row.getCell(3).value?.toString()?.trim() || '';
        const dateStr = row.getCell(4).value?.toString()?.trim() || '';
        const timeStr = row.getCell(5).value?.toString()?.trim() || '';
        const endTimeStr = row.getCell(6).value?.toString()?.trim() || '';

        if (!stageName) {
          errors.push(`Dòng ${rowNum}: Thiếu vòng đấu`);
          return;
        }

        const stage = mapStageNameToStage(stageName);
        if (!stage) {
          errors.push(`Dòng ${rowNum}: Vòng đấu "${stageName}" không hợp lệ`);
          return;
        }

        if (!team1Name && !team2Name) {
          errors.push(`Dòng ${rowNum}: Thiếu tên đội`);
          return;
        }

        const team1Id = findTeamIdByName(team1Name);
        const team2Id = findTeamIdByName(team2Name);

        if (team1Name && !team1Name.startsWith('W#') && !team1Name.startsWith('w#') && !team1Id) {
          errors.push(`Dòng ${rowNum}: Không tìm thấy đội "${team1Name}"`);
        }

        if (team2Name && !team2Name.startsWith('W#') && !team2Name.startsWith('w#') && !team2Id) {
          errors.push(`Dòng ${rowNum}: Không tìm thấy đội "${team2Name}"`);
        }

        const date = parseDate(dateStr);
        const time = parseTime(timeStr);
        const endTime = parseTime(endTimeStr);

        if (dateStr && !date) {
          errors.push(`Dòng ${rowNum}: Định dạng ngày không hợp lệ "${dateStr}". Yêu cầu: Ngày-tháng-năm (VD: 23-12-2000)`);
        }

        if (timeStr && !time) {
          errors.push(`Dòng ${rowNum}: Định dạng giờ bắt đầu không hợp lệ "${timeStr}". Yêu cầu: Giờ:phút (VD: 23:18)`);
        }

        if (endTimeStr && !endTime) {
          errors.push(`Dòng ${rowNum}: Định dạng giờ kết thúc không hợp lệ "${endTimeStr}". Yêu cầu: Giờ:phút (VD: 23:18)`);
        }

        const stageMatches = league.matches.filter(m => m.stage === stage);
        if (stageMatches.length === 0) {
          errors.push(`Dòng ${rowNum}: Không tìm thấy trận đấu cho vòng "${stageName}". Vui lòng bốc thăm trước.`);
          return;
        }

        let matchNumber = null;
        
        const isTeam1Winner = team1Name.startsWith('W#') || team1Name.startsWith('w#');
        const isTeam2Winner = team2Name.startsWith('W#') || team2Name.startsWith('w#');
        
        if (team1Id && team2Id) {
          const match = stageMatches.find(m => 
            (m.team1Id === team1Id && m.team2Id === team2Id) ||
            (m.team1Id === team2Id && m.team2Id === team1Id)
          );
          if (match) {
            matchNumber = match.matchNumber;
          }
        } else if (isTeam1Winner && isTeam2Winner) {
          const winner1MatchNum = parseInt(team1Name.replace(/^W#/i, '').split(' ')[0]);
          const winner2MatchNum = parseInt(team2Name.replace(/^W#/i, '').split(' ')[0]);
          
          if (!isNaN(winner1MatchNum) && !isNaN(winner2MatchNum)) {
            const minMatchNum = Math.min(winner1MatchNum, winner2MatchNum);
            const nextMatchNumber = Math.ceil(minMatchNum / 2);
            const foundMatch = stageMatches.find(m => m.matchNumber === nextMatchNumber);
            if (foundMatch) {
              matchNumber = foundMatch.matchNumber;
            } else if (stageMatches.length === 1) {
              matchNumber = stageMatches[0].matchNumber;
            } else {
              matchNumber = nextMatchNumber;
            }
          }
        } else if (team1Id || team2Id) {
          const match = stageMatches.find(m => 
            m.team1Id === team1Id || m.team2Id === team1Id ||
            m.team1Id === team2Id || m.team2Id === team2Id
          );
          if (match) {
            matchNumber = match.matchNumber;
          }
        }

        if (!matchNumber) {
          if (stageMatches.length === 1) {
            matchNumber = stageMatches[0].matchNumber;
          } else {
            errors.push(`Dòng ${rowNum}: Không xác định được số trận đấu. Vui lòng kiểm tra lại tên đội.`);
            return;
          }
        }

        schedules.push({
          stage,
          matchNumber,
          date,
          time,
          endTime
        });
      });

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Có lỗi trong file Excel",
          errors: errors
        });
      }

      if (schedules.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Không có dữ liệu hợp lệ để import",
        });
      }

      let updatedCount = 0;
      const notFoundMatches = [];

      schedules.forEach(({ stage, matchNumber, date, time, endTime }) => {
        const matchIndex = league.matches.findIndex((m) => {
          const stageMatch = m.stage === stage;
          const numberMatch = m.matchNumber === matchNumber || 
                             m.matchNumber === parseInt(matchNumber) ||
                             parseInt(m.matchNumber) === matchNumber;
          return stageMatch && numberMatch;
        });

        if (matchIndex !== -1) {
          if (date !== null && date !== undefined) {
            league.matches[matchIndex].date = date;
          }
          if (time !== null && time !== undefined) {
            league.matches[matchIndex].time = time;
          }
          if (endTime !== null && endTime !== undefined) {
            league.matches[matchIndex].endTime = endTime;
          }
          updatedCount++;
        } else {
          notFoundMatches.push({ stage, matchNumber });
        }
      });

      if (updatedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy matches để cập nhật. Vui lòng bốc thăm trước.",
          details: {
            requested: schedules,
            notFound: notFoundMatches,
            availableMatches: league.matches.map(m => ({
              stage: m.stage,
              matchNumber: m.matchNumber
            }))
          }
        });
      }

      await league.save();

      await logAudit(
        "IMPORT_SCHEDULE",
        req.user.id,
        req,
        {
          leagueId: req.params.id,
          leagueName: league.name,
          schedulesCount: schedules.length,
          updatedCount: updatedCount
        }
      );

      res.json({
        success: true,
        message: `Đã import ${updatedCount}/${schedules.length} lịch đấu thành công`,
        data: league,
        details: {
          total: schedules.length,
          updated: updatedCount,
          notFound: notFoundMatches
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/leagues/owner/pending
 * Lấy danh sách giải đấu chờ duyệt của owner
 * Owner (chủ sân)
 */
router.get(
  "/owner/pending",
  authenticateToken,
  authorize("owner", "admin"),
  async (req, res, next) => {
    try {
      const ownerId = req.user._id || req.user.id;
      
      const ownerFacilities = await Facility.find({ owner: ownerId }).select("_id name");
      const facilityIds = ownerFacilities.map(f => f._id);
      const facilityNames = ownerFacilities.map(f => f.name).filter(name => name);
      
      // Tìm các giải đấu có facility ID hoặc location (tên facility) trùng với facilities của owner
      const pendingLeagues = await League.find({
        $and: [
          {
            $or: [
              { facility: { $in: facilityIds } },
              ...(facilityNames.length > 0 ? [{ location: { $in: facilityNames } }] : [])
            ]
          },
          { approvalStatus: "pending" }
        ]
      })
        .populate("creator", "name email phone")
        .populate("facility", "name address")
        .populate("courtId", "name type")
        .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        data: pendingLeagues,
        count: pendingLeagues.length
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/leagues/owner/all
 * Lấy tất cả giải đấu của owner (đã duyệt, từ chối, chờ duyệt)
 * Owner (chủ sân)
 */
router.get(
  "/owner/all",
  authenticateToken,
  authorize("owner", "admin"),
  async (req, res, next) => {
    try {
      const ownerId = req.user._id || req.user.id;
      const { status, approvalStatus } = req.query;
      
      const ownerFacilities = await Facility.find({ owner: ownerId }).select("_id");
      const facilityIds = ownerFacilities.map(f => f._id);
      
      const query = {
        $or: [
          { facility: { $in: facilityIds } },
          { approvedBy: ownerId }
        ]
      };
      
      if (status) {
        query.status = status;
      }
      
      if (approvalStatus) {
        query.approvalStatus = approvalStatus;
      }
      
      const leagues = await League.find(query)
        .populate("creator", "name email phone")
        .populate("facility", "name address")
        .populate("courtId", "name type")
        .populate("approvedBy", "name email")
        .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        data: leagues,
        count: leagues.length
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/leagues/:id/approve
 * Duyệt giải đấu
 * Owner (chủ sân)
 */
router.put(
  "/:id/approve",
  authenticateToken,
  authorize("owner", "admin"),
  async (req, res, next) => {
    try {
      const leagueId = req.params.id;
      const ownerId = req.user._id || req.user.id;
      
      const league = await League.findById(leagueId).populate("facility");
      
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }
      
      // Nếu league chưa có facility nhưng có location, tìm facility theo tên
      if (!league.facility && league.location) {
        const facility = await Facility.findOne({
          owner: ownerId,
          name: league.location
        });
        
        if (facility) {
          league.facility = facility._id;
        }
      }
      
      // Kiểm tra quyền: nếu có facility, phải là owner của facility đó
      if (league.facility) {
        let facilityOwnerId;
        if (typeof league.facility === 'object' && league.facility.owner) {
          facilityOwnerId = league.facility.owner.toString();
        } else {
          // Nếu chưa populate, fetch lại
          const facility = await Facility.findById(league.facility);
          if (facility) {
            facilityOwnerId = facility.owner.toString();
          }
        }
        
        if (facilityOwnerId && facilityOwnerId !== ownerId.toString() && req.user.role !== "admin") {
          return res.status(403).json({
            success: false,
            message: "Không có quyền duyệt giải đấu này",
          });
        }
      }
      
      league.approvalStatus = "approved";
      league.approvedBy = ownerId;
      league.approvedAt = new Date();
      league.rejectionReason = null;
      
      await league.save();
      
      await logAudit(
        "APPROVE_LEAGUE",
        ownerId,
        req,
        {
          leagueId: leagueId,
          leagueName: league.name,
        }
      );
      
      res.json({
        success: true,
        message: "Đã duyệt giải đấu thành công",
        data: league,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/leagues/:id/reject
 * Từ chối giải đấu
 * Owner (chủ sân)
 */
router.put(
  "/:id/reject",
  authenticateToken,
  authorize("owner", "admin"),
  async (req, res, next) => {
    try {
      const leagueId = req.params.id;
      const ownerId = req.user._id || req.user.id;
      const { reason } = req.body;
      
      const league = await League.findById(leagueId).populate("facility");
      
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }
      
      if (league.facility && league.facility.owner.toString() !== ownerId.toString() && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Không có quyền từ chối giải đấu này",
        });
      }
      
      league.approvalStatus = "rejected";
      league.approvedBy = ownerId;
      league.approvedAt = new Date();
      league.rejectionReason = reason || null;
      
      await league.save();
      
      await logAudit(
        "REJECT_LEAGUE",
        ownerId,
        req,
        {
          leagueId: leagueId,
          leagueName: league.name,
          reason: reason,
        }
      );
      
      res.json({
        success: true,
        message: "Đã từ chối giải đấu",
        data: league,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/leagues/:id/teams/:teamId/approve
 * Chấp nhận đội đăng ký
 * Owner (chủ sân) hoặc người tạo giải
 */
router.put(
  "/:id/teams/:teamId/approve",
  async (req, res, next) => {
    try {
      const leagueId = req.params.id;
      const teamIdParam = req.params.teamId;
      const userId = req.user._id || req.user.id;
      
      const league = await League.findById(leagueId).populate("facility");
      
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }
      
      // Kiểm tra quyền: owner của facility hoặc người tạo giải
      const isCreator = league.creator.toString() === userId.toString();
      let isOwner = false;
      
      if (league.facility) {
        let facilityOwnerId;
        if (typeof league.facility === 'object' && league.facility.owner) {
          facilityOwnerId = league.facility.owner.toString();
        } else {
          const facility = await Facility.findById(league.facility);
          if (facility) {
            facilityOwnerId = facility.owner.toString();
          }
        }
        isOwner = facilityOwnerId && facilityOwnerId === userId.toString();
      }
      
      if (!isCreator && !isOwner && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Không có quyền chấp nhận đội này",
        });
      }
      
      const teamId = parseInt(teamIdParam);
      const isTeamIdNumber = !isNaN(teamId);
      
      const teamIndex = league.teams.findIndex((team) => {
        if (isTeamIdNumber) {
          const teamIdNum = typeof team.id === 'number' ? team.id : (team.id ? parseInt(team.id) : null);
          if (teamIdNum !== null && !isNaN(teamIdNum) && teamIdNum === teamId) {
            return true;
          }
        }
        const teamIdStr = team._id?.toString();
        if (teamIdStr && teamIdStr === teamIdParam) {
          return true;
        }
        return false;
      });
      
      if (teamIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đội",
        });
      }
      
      league.teams[teamIndex].registrationStatus = "accepted";
      await league.save();
      
      await logAudit(
        "APPROVE_TEAM_REGISTRATION",
        userId,
        req,
        {
          leagueId: leagueId,
          leagueName: league.name,
          teamId: teamIdParam,
          teamName: league.teams[teamIndex].teamNumber
        }
      );
      
      res.json({
        success: true,
        message: "Đã chấp nhận đội đăng ký",
        data: league,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/leagues/:id/teams/:teamId/reject
 * Từ chối đội đăng ký
 * Owner (chủ sân) hoặc người tạo giải
 */
router.put(
  "/:id/teams/:teamId/reject",
  async (req, res, next) => {
    try {
      const leagueId = req.params.id;
      const teamIdParam = req.params.teamId;
      const userId = req.user._id || req.user.id;
      const { reason } = req.body;
      
      const league = await League.findById(leagueId).populate("facility");
      
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }
      
      // Kiểm tra quyền: owner của facility hoặc người tạo giải
      const isCreator = league.creator.toString() === userId.toString();
      let isOwner = false;
      
      if (league.facility) {
        let facilityOwnerId;
        if (typeof league.facility === 'object' && league.facility.owner) {
          facilityOwnerId = league.facility.owner.toString();
        } else {
          const facility = await Facility.findById(league.facility);
          if (facility) {
            facilityOwnerId = facility.owner.toString();
          }
        }
        isOwner = facilityOwnerId && facilityOwnerId === userId.toString();
      }
      
      if (!isCreator && !isOwner && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Không có quyền từ chối đội này",
        });
      }
      
      const teamId = parseInt(teamIdParam);
      const isTeamIdNumber = !isNaN(teamId);
      
      const teamIndex = league.teams.findIndex((team) => {
        if (isTeamIdNumber) {
          const teamIdNum = typeof team.id === 'number' ? team.id : (team.id ? parseInt(team.id) : null);
          if (teamIdNum !== null && !isNaN(teamIdNum) && teamIdNum === teamId) {
            return true;
          }
        }
        const teamIdStr = team._id?.toString();
        if (teamIdStr && teamIdStr === teamIdParam) {
          return true;
        }
        return false;
      });
      
      if (teamIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đội",
        });
      }
      
      league.teams[teamIndex].registrationStatus = "rejected";
      if (reason) {
        league.teams[teamIndex].rejectionReason = reason;
      }
      await league.save();
      
      await logAudit(
        "REJECT_TEAM_REGISTRATION",
        userId,
        req,
        {
          leagueId: leagueId,
          leagueName: league.name,
          teamId: teamIdParam,
          teamName: league.teams[teamIndex].teamNumber,
          reason: reason
        }
      );
      
      res.json({
        success: true,
        message: "Đã từ chối đội đăng ký",
        data: league,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/leagues/:id/assign-court
 * Chốt sân cho giải đấu
 * Owner (chủ sân)
 */
router.put(
  "/:id/assign-court",
  authenticateToken,
  authorize("owner", "admin"),
  async (req, res, next) => {
    try {
      const leagueId = req.params.id;
      const ownerId = req.user._id || req.user.id;
      const { courtId } = req.body;
      
      if (!courtId) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp courtId",
        });
      }
      
      const league = await League.findById(leagueId).populate("facility");
      
      if (!league) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giải đấu",
        });
      }
      
      if (league.facility && league.facility.owner.toString() !== ownerId.toString() && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Không có quyền chốt sân cho giải đấu này",
        });
      }
      
      const court = await Court.findById(courtId).populate("facility");
      
      if (!court) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sân",
        });
      }
      
      if (court.facility.owner.toString() !== ownerId.toString() && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Không có quyền sử dụng sân này",
        });
      }
      
      league.courtId = courtId;
      await league.save();
      
      await logAudit(
        "ASSIGN_COURT_TO_LEAGUE",
        ownerId,
        req,
        {
          leagueId: leagueId,
          leagueName: league.name,
          courtId: courtId,
          courtName: court.name,
        }
      );
      
      res.json({
        success: true,
        message: "Đã chốt sân cho giải đấu thành công",
        data: league,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/leagues/:id/pay-fee
 * Thanh toán phí giải đấu bằng ví
 */
router.post(
  "/:id/pay-fee",
  authenticateToken,
  asyncHandler(async (req, res, next) => {
    const leagueId = req.params.id;
    const { amount, method } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số tiền không hợp lệ",
      });
    }

    if (method !== "wallet") {
      return res.status(400).json({
        success: false,
        message: "Chỉ hỗ trợ thanh toán bằng ví",
      });
    }

    // 1. Tìm giải đấu
    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giải đấu",
      });
    }

    // 2. Kiểm tra quyền sở hữu (chỉ creator mới có thể thanh toán)
    if (league.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thanh toán phí cho giải đấu này",
      });
    }

    // 3. Kiểm tra giải đấu đã được thanh toán chưa
    if (league.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Giải đấu này đã được thanh toán",
      });
    }

    // 4. Kiểm tra số dư ví
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: "Số dư ví không đủ",
      });
    }

    // 5. Trừ tiền từ ví
    await debit(user._id, amount, "payment", {
      leagueId: league._id,
      description: `Thanh toán phí tạo giải đấu: ${league.name}`,
      type: "tournament_fee",
    });

    // 6. Tạo bản ghi Payment
    const paymentId = `WALLET_LEAGUE_${league._id}_${new Date().getTime()}`;
    const payment = await Payment.create({
      user: user._id,
      league: league._id,
      amount: amount,
      method: "wallet",
      status: "success",
      paymentId: paymentId,
      transactionId: paymentId,
      orderInfo: `Thanh toán phí tạo giải đấu: ${league.name}`,
      paidAt: new Date(),
    });

    // 7. Cập nhật trạng thái giải đấu
    league.paymentStatus = "paid";
    league.paymentMethod = "wallet";
    league.paidAt = new Date();
    await league.save();

    // 8. Gửi thông báo
    await createNotification({
      userId: user._id.toString(),
      type: "payment",
      title: "Thanh toán phí giải đấu thành công",
      message: `Thanh toán phí tạo giải đấu "${league.name}" đã thành công. Số tiền: ${amount.toLocaleString("vi-VN")} VNĐ`,
      metadata: {
        leagueId: league._id.toString(),
        paymentId: payment._id.toString(),
        paymentMethod: "wallet",
      },
    });

    // 9. Emit socket event
    emitToUser(user._id.toString(), "league:payment:success", {
      league: league.toObject(),
      payment: payment.toObject(),
      message: "Thanh toán phí giải đấu thành công!",
    });

    // 10. Log audit
    await logAudit(
      "LEAGUE_FEE_PAYMENT",
      user._id,
      req,
      {
        leagueId: league._id.toString(),
        leagueName: league.name,
        amount: amount,
        paymentMethod: "wallet",
        paymentId: payment._id.toString(),
      }
    );

    res.json({
      success: true,
      message: "Thanh toán phí giải đấu thành công",
      data: {
        league: league.toObject(),
        payment: payment.toObject(),
        newBalance: user.walletBalance - amount,
      },
    });
  })
);

export default router;



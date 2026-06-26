// models/League.js
import mongoose, { Schema } from "mongoose";

const leagueSchema = new mongoose.Schema(
  {
    // Tên giải đấu
    name: {
      type: String,
      required: [true, "Tên giải đấu là bắt buộc"],
      trim: true,
    },
    // Người tạo giải đấu
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Hình thức giải đấu (ví dụ: "Loại Trực Tiếp", "Vòng tròn", "Hỗn hợp")
    format: {
      type: String,
      required: [true, "Hình thức giải đấu là bắt buộc"],
      trim: true,
    },
    // Môn thể thao (ví dụ: "Bóng Đá Sân 11", "Bóng đá", "Bóng chuyền")
    sport: {
      type: String,
      required: [true, "Môn thể thao là bắt buộc"],
      trim: true,
    },
    // Loại sân được chọn (tham chiếu đến CourtType)
    courtType: {
      type: Schema.Types.ObjectId,
      ref: "CourtType",
      default: null,
    },
    // Tên người tạo (có thể lưu để hiển thị nhanh)
    creatorName: {
      type: String,
      trim: true,
    },
    // Số điện thoại liên hệ
    phone: {
      type: String,
      trim: true,
    },
    // Loại giải đấu: team (đồng đội) hoặc individual (cá nhân)
    tournamentType: {
      type: String,
      enum: ["team", "individual"],
      default: "individual",
    },
    // Số lượng người mỗi đội
    membersPerTeam: {
      type: Number,
      min: 2,
      max: 20,
    },
    // Ảnh đại diện
    image: {
      type: String,
      default: null,
    },
    // Ảnh banner
    banner: {
      type: String,
      default: null,
    },
    // Ngày bắt đầu
    startDate: {
      type: Date,
      required: [true, "Ngày bắt đầu là bắt buộc"],
    },
    // Ngày kết thúc
    endDate: {
      type: Date,
      required: [true, "Ngày kết thúc là bắt buộc"],
    },
    // Địa điểm (tên địa điểm)
    location: {
      type: String,
      trim: true,
    },
    // Địa chỉ chi tiết
    address: {
      type: String,
      trim: true,
    },
    // Số đội tham gia hiện tại
    participants: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Số đội tối đa
    maxParticipants: {
      type: Number,
      required: [true, "Số đội tối đa là bắt buộc"],
      min: 1,
    },
    // Giải thưởng
    prize: {
      type: String,
      trim: true,
    },
    // Trạng thái: upcoming, ongoing, completed, cancelled
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
    // Mô tả ngắn
    description: {
      type: String,
      trim: true,
    },
    // Mô tả đầy đủ
    fullDescription: {
      type: String,
      trim: true,
    },
    // Hạn đăng ký
    registrationDeadline: {
      type: Date,
    },
    // Số lượt xem
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Danh sách đội tham gia
    teams: [
      {
        id: {
          type: Number,
        },
        teamNumber: {
          type: String,
          trim: true,
        },
        logo: {
          type: String,
          default: null,
        },
        logoPublicId: {
          type: String,
          default: null,
        },
        contactPhone: {
          type: String,
          trim: true,
        },
        contactName: {
          type: String,
          trim: true,
        },
        registrationStatus: {
          type: String,
          enum: ["pending", "accepted", "rejected", "invited", "invitation_rejected"],
          default: "pending",
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
        wins: {
          type: Number,
          default: 0,
        },
        draws: {
          type: Number,
          default: 0,
        },
        losses: {
          type: Number,
          default: 0,
        },
        members: [
          {
            jerseyNumber: {
              type: String,
              trim: true,
            },
            name: {
              type: String,
              trim: true,
            },
            phone: {
              type: String,
              trim: true,
            },
            position: {
              type: String,
              trim: true,
            },
            avatar: {
              type: String,
              default: null,
            },
          },
        ],
      },
    ],
    // Lịch đấu (matches)
    matches: [
      {
        stage: {
          type: String,
          enum: [
            "round1", "round2", "round3", "round4", 
            "round-robin", 
            "round-robin-round1", "round-robin-round2", "round-robin-round3", "round-robin-round4",
            "round-robin-v1", "round-robin-v2", "round-robin-v3", "round-robin-v4", "round-robin-v5", "round-robin-v6", "round-robin-v7", "round-robin-v8",
            "round-robin-round1-v1", "round-robin-round1-v2", "round-robin-round1-v3", "round-robin-round1-v4", "round-robin-round1-v5", "round-robin-round1-v6", "round-robin-round1-v7", "round-robin-round1-v8",
            "round-robin-round2-v1", "round-robin-round2-v2", "round-robin-round2-v3", "round-robin-round2-v4", "round-robin-round2-v5", "round-robin-round2-v6", "round-robin-round2-v7", "round-robin-round2-v8",
            "round-robin-round3-v1", "round-robin-round3-v2", "round-robin-round3-v3", "round-robin-round3-v4", "round-robin-round3-v5", "round-robin-round3-v6", "round-robin-round3-v7", "round-robin-round3-v8",
            "round-robin-round4-v1", "round-robin-round4-v2", "round-robin-round4-v3", "round-robin-round4-v4", "round-robin-round4-v5", "round-robin-round4-v6", "round-robin-round4-v7", "round-robin-round4-v8",
            "semi", "final"
          ],
        },
        matchNumber: {
          type: Number,
        },
        team1Id: {
          type: Schema.Types.Mixed, // Cho phép Number (team ID) hoặc String ("BYE") hoặc null
        },
        team2Id: {
          type: Schema.Types.Mixed, // Cho phép Number (team ID) hoặc String ("BYE") hoặc null
        },
        date: {
          type: Date,
        },
        time: {
          type: String,
        },
        endTime: {
          type: String,
        },
        score1: {
          type: Number,
          default: null,
        },
        score2: {
          type: Number,
          default: null,
        },
        // Kết quả đá luân lưu (khi trận đấu hòa)
        penaltyScore1: {
          type: Number,
          default: null,
        },
        penaltyScore2: {
          type: Number,
          default: null,
        },
        // Liên kết đến trận đấu tiếp theo (người thắng sẽ vào trận này)
        nextMatchId: {
          type: String, // Format: "stage_matchNumber" hoặc null nếu là final
          default: null,
        },
        // Đánh dấu trận đấu có BYE (đội ảo)
        hasBye: {
          type: Boolean,
          default: false,
        },
        // Sân được đặt cho trận đấu
        courtId: {
          type: Schema.Types.ObjectId,
          ref: "Court",
          default: null,
        },
      },
    ],
    // Loại giải đấu: PRIVATE (nội bộ)
    type: {
      type: String,
      enum: ["PRIVATE", "PUBLIC"],
      default: "PRIVATE",
    },
    // Cơ sở thể thao (nếu giải đấu được tổ chức tại cơ sở)
    facility: {
      type: Schema.Types.ObjectId,
      ref: "Facility",
      default: null,
    },
    // Trạng thái duyệt: pending (chờ duyệt), approved (đã duyệt), rejected (từ chối)
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // Sân được chốt cho giải đấu
    courtId: {
      type: Schema.Types.ObjectId,
      ref: "Court",
      default: null,
    },
    // Người duyệt (owner)
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Thời gian duyệt
    approvedAt: {
      type: Date,
      default: null,
    },
    // Lý do từ chối (nếu có)
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
    // Đội vô địch (team ID của đội thắng trận final)
    champion: {
      type: Schema.Types.Mixed, // Cho phép Number (team ID) hoặc null
      default: null,
    },
    // Trạng thái thanh toán phí giải đấu
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    // Phương thức thanh toán
    paymentMethod: {
      type: String,
      enum: ["wallet", "momo", "vnpay", "cash"],
      default: null,
    },
    // Thời gian thanh toán
    paidAt: {
      type: Date,
      default: null,
    },
    // Cấu hình cho vòng tròn
    numRounds: {
      type: Number,
      default: 1,
      min: 1,
      max: 4,
    },
    winPoints: {
      type: Number,
      default: 3,
      min: 0,
    },
    drawPoints: {
      type: Number,
      default: 1,
      min: 0,
    },
    lossPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// Index để tìm kiếm nhanh
leagueSchema.index({ creator: 1 });
leagueSchema.index({ status: 1 });
leagueSchema.index({ startDate: 1 });
leagueSchema.index({ createdAt: -1 });

// Middleware để tự động cập nhật số đội tham gia
leagueSchema.pre("save", function (next) {
  if (this.teams && Array.isArray(this.teams)) {
    // Đếm số đội có thông tin đầy đủ (có teamNumber hoặc contactPhone)
    const validTeams = this.teams.filter(
      (team) => team.teamNumber || team.contactPhone
    );
    this.participants = validTeams.length;
  }
  next();
});

// Method để kiểm tra quyền sở hữu
leagueSchema.methods.isOwner = function (userId) {
  return this.creator.toString() === userId.toString();
};

const League = mongoose.model("League", leagueSchema);

export default League;


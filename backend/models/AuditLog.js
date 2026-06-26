// models/AuditLog.js
import mongoose, { Schema } from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "LOGIN",
        "LOGIN_GOOGLE",
        "LOGOUT",
        "REFRESH_TOKEN",
        "REGISTER",
        "REGISTER_PENDING",
        "VERIFY_OTP",
        "FORGOT_PASSWORD",
        "RESET_PASSWORD",
        "CHANGE_PASSWORD",
        "UPDATE_PROFILE",
        "UPDATE_AVATAR",
        "DELETE_AVATAR",
        "CHANGE_ROLE",
        "LOCK_USER",
        "UNLOCK_USER",
        "DELETE_USER",
        "RESTORE_USER",
        "CREATE_SPORT_CATEGORY",
        "UPDATE_SPORT_CATEGORY",
        "DELETE_SPORT_CATEGORY",
        "CREATE_COURT_TYPE",
        "UPDATE_COURT_TYPE",
        "DELETE_COURT_TYPE",
        "CREATE_REVIEW",
        "UPDATE_REVIEW",
        "DELETE_REVIEW",
        "REPLY_REVIEW",
        "REPORT_REVIEW",
        "PROCESS_REVIEW_REPORT",
        "ADD_FAVORITE",
        "REMOVE_FAVORITE",
        "CREATE_LEAGUE",
        "UPDATE_LEAGUE",
        "DELETE_LEAGUE",
        "DELETE_TEAM",
        "UPLOAD_LEAGUE_IMAGE",
        "IMPORT_TEAMS",
        "IMPORT_TEAMS_FROM_SHEETS",
        "UPDATE_MEMBER",
        "DELETE_MEMBER",
        "IMPORT_MEMBERS",
        "IMPORT_MEMBERS_FROM_SHEETS",
        "UPLOAD_TEAM_LOGO",
        "DELETE_TEAM_LOGO",
        "DRAW_MATCHES",
        "UPDATE_MATCH_SCHEDULE",
        "AUTO_SCHEDULE",
        "CONFIRM_SCHEDULE",
        "UPDATE_MATCH_RESULT",
        "IMPORT_SCHEDULE",
        "APPROVE_LEAGUE",
        "REJECT_LEAGUE",
        "ASSIGN_COURT_TO_LEAGUE",
        "REGISTER_TO_LEAGUE",
        "APPROVE_TEAM_REGISTRATION",
        "REJECT_TEAM_REGISTRATION",
        "CREATE_PARTNER_APPLICATION",
        "APPROVE_PARTNER_APPLICATION",
        "REJECT_PARTNER_APPLICATION",
        "UPDATE_TOURNAMENT_FEE_CONFIG",
        "LEAGUE_FEE_PAYMENT"
      ],
    },
    ipAddress: {
      type: String,
    },
    details: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ user: 1 });
auditLogSchema.index({ action: 1 });

export default mongoose.model("AuditLog", auditLogSchema);

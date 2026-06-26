import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import { initializeSocket } from "./socket/index.js";
import mongoose from "mongoose";

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Import configurations
import { config, validateConfig } from "./config/config.js";
import { connectDB } from "./config/database.js";
import "./config/passport.js";

// Import middleware
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { generalLimiter } from "./middleware/rateLimiter.js";

// Import routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import auditRoutes from "./routes/audit.js";
import facilityRoutes from "./routes/facility.js";
import courtRoutes from "./routes/court.js";
import bookingRoutes from "./routes/booking.js";
import checkinRoutes from "./routes/checkin.js";
import paymentRoutes from "./routes/payment.js";
import sportCategoryRoutes from "./routes/sportCategory.js";
import courtTypeRoutes from "./routes/courtType.js";
import reviewRoutes from "./routes/review.js";
import notificationRoutes from "./routes/notification.js";
import provinceRoutes from "./routes/province.js";
import promotionRoutes from "./routes/promotion.js";
import analyticsRoutes from "./routes/analytics.js";
import walletRouters from "./routes/wallet.js";
import leagueRoutes from "./routes/league.js";
import aiRoutes from "./routes/ai.js";
import User from "./models/User.js";
import loyaltyRoutes from "./routes/loyalty.js";
import referralRoutes from "./routes/referral.js";
import partnerRoutes from "./routes/partner.js";
import feedbackRoutes from "./routes/feedback.js";
import chatRoutes from "./routes/chat.js";
import serviceRoutes from "./routes/service.js";
import withdrawalRoutes from "./routes/withdrawal.js";
import systemConfigRoutes from "./routes/systemConfig.js";
import { startReservationExpiryJob } from "./jobs/reservationExpiry.js";
import { startBookingAutoCancelJob } from "./jobs/bookingAutoCancel.js";

const app = express();

app.set("trust proxy", 1);
// Validate configuration
validateConfig();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Cho phép tất cả origin trong development
      if (config.nodeEnv === "development" || !origin) {
        callback(null, true);
      } else {
        // Trong production, chỉ cho phép frontendUrl
        const allowedOrigins = [config.frontendUrl];
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Session configuration
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.nodeEnv === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

app.get("/", (req, res) => {
  res.send("✅ Backend is live and healthy!");
});

// Favicon handler - prevent 404 errors for browser favicon requests
app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/courts", courtRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/checkin", checkinRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/sport-categories", sportCategoryRoutes);
app.use("/api/court-types", courtTypeRoutes);
app.use("/api/partner-applications", partnerRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/provinces", provinceRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/wallet", walletRouters);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/leagues", leagueRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/system-config", systemConfigRoutes);
// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server with Socket.IO
const PORT = config.port;
const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Frontend URL: ${config.frontendUrl}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Google OAuth: http://localhost:${PORT}/api/auth/google`);
  console.log(`🔌 Socket.IO server initialized with namespaces`);

  // Start reservation expiry job
  startReservationExpiryJob();

  // Start booking auto-cancel job (hủy đơn không xác nhận trước 15 phút vào sân)
  startBookingAutoCancelJob();
});

// Schedule cleanup job for unverified users every hour
setInterval(async () => {
  try {
    const result = await User.cleanupUnverifiedUsers();
    console.log(`🧹 Cleaned up ${result.deletedCount} unverified user(s)`);
  } catch (error) {
    console.error("Error cleaning up unverified users:", error);
  }
}, 60 * 60 * 1000); // Run every hour

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  process.exit(0);
});

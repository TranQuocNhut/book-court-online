import express from 'express';
import { chat, suggestFacilities, getBookingData, searchBookingFacilities, searchSuggestFacilities, checkAvailability } from '../controllers/aiController.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config/config.js';

const router = express.Router();

/**
 * Middleware to optionally authenticate user (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, config.jwt.secret);
          const user = await User.findById(decoded.userId).select('-password -refreshTokens');
          if (user && user.isActive) {
            req.user = user;
          }
        } catch (err) {
          // Invalid token, continue without user
        }
      }
    }
    next();
  } catch (err) {
    next();
  }
};

/**
 * POST /api/ai/chat
 * Chat with AI assistant (optional auth - better experience if logged in)
 */
router.post('/chat', optionalAuth, chat);

/**
 * GET /api/ai/suggest-facilities
 * Get facility suggestions (public)
 */
router.get('/suggest-facilities', optionalAuth, suggestFacilities);

/**
 * GET /api/ai/booking-data
 * Get sport categories and court types for booking flow
 */
router.get('/booking-data', optionalAuth, getBookingData);

/**
 * POST /api/ai/booking-search
 * Search facilities for booking with filters
 */
router.post('/booking-search', optionalAuth, searchBookingFacilities);

/**
 * POST /api/ai/suggest-search
 * Search facilities with suggestions (price, radius, time slots)
 */
router.post('/suggest-search', optionalAuth, searchSuggestFacilities);

/**
 * POST /api/ai/check-availability
 * Kiểm tra sân trống từ câu hỏi tự nhiên với gợi ý thông minh
 */
router.post('/check-availability', optionalAuth, checkAvailability);

export default router;


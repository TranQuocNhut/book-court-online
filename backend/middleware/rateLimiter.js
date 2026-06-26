import rateLimit from 'express-rate-limit';
import { config } from '../config/config.js';

// General rate limiter - more lenient in development
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.nodeEnv === 'development' 
    ? config.rateLimit.maxRequests * 10 // 10x limit in development (500 requests per 15 min)
    : config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for authenticated requests (they're already protected)
  skip: (req) => {
    // Skip if request has Authorization header (authenticated user)
    // This prevents rate limiting on authenticated endpoints
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && (authHeader.startsWith('Bearer ') || authHeader.startsWith('bearer '))) {
      return true; // Skip rate limiting for authenticated requests
    }
    return false;
  },
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Login rate limiter
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config/config.js';

// Middleware để xác thực JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Đảm bảo user có role hợp lệ (nếu không có thì set mặc định là 'user')
    if (!user.role || !['user', 'owner', 'admin'].includes(user.role)) {
      console.warn(`⚠️ User ${user._id} has invalid role: ${user.role}, setting to 'user'`);
      user.role = 'user';
      await user.save();
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Middleware để kiểm tra vai trò
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Middleware để kiểm tra quyền admin
export const requireAdmin = authorize('admin');

// Middleware để kiểm tra quyền owner hoặc admin
export const requireOwnerOrAdmin = authorize('owner', 'admin');

// Middleware để kiểm tra quyền user (bất kỳ user nào đã đăng nhập)
export const requireUser = authorize('user', 'owner', 'admin');

// Middleware để tạo JWT token
export const generateTokens = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: '15m' // Access token ngắn hạn
  });

  const refreshToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });

  return { accessToken, refreshToken };
};

// Middleware để refresh token
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const decoded = jwt.verify(refreshToken, config.jwt.secret);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Kiểm tra refresh token có trong database không
    const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Tạo token mới
    const tokens = generateTokens(user);
    
    // Xóa refresh token cũ và thêm token mới
    try {
      await user.removeRefreshToken(refreshToken);
      await user.addRefreshToken(tokens.refreshToken);
    } catch (error) {
      console.error('Error updating refresh tokens:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating tokens'
      });
    }

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role
        }
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    console.error('Refresh token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

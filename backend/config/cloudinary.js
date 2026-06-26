import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary Storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'booking-sport/avatars', // Folder in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto' }
    ],
    public_id: (req, file) => {
      // Generate unique filename with user ID and timestamp
      const userId = req.user?._id || 'anonymous';
      const timestamp = Date.now();
      return `avatar_${userId}_${timestamp}`;
    }
  }
});

// Configure multer with Cloudinary storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Configure Cloudinary Storage for Facility images
const facilityStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'booking-sport/facilities',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1200, height: 800, crop: 'fill' },
      { quality: 'auto' }
    ],
    public_id: (req, file) => {
      const facilityId = req.params.id || 'facility';
      const timestamp = Date.now();
      return `facility_${facilityId}_${timestamp}`;
    }
  }
});

// Configure multer for Facility images
export const uploadFacilityImage = multer({
  storage: facilityStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Configure Cloudinary Storage for Court images
const courtStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'booking-sport/courts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1000, height: 667, crop: 'fill' },
      { quality: 'auto' }
    ],
    public_id: (req, file) => {
      const courtId = req.params.id || 'court';
      const timestamp = Date.now();
      return `court_${courtId}_${timestamp}`;
    }
  }
});

// Configure multer for Court images
export const uploadCourtImage = multer({
  storage: courtStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Configure Cloudinary Storage for League images
const leagueStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'booking-sport/leagues',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1200, height: 600, crop: 'fill' },
      { quality: 'auto' }
    ],
    public_id: (req, file) => {
      const leagueId = req.params.id || 'league';
      const timestamp = Date.now();
      return `league_${leagueId}_${timestamp}`;
    }
  }
});

// Configure multer for League images
export const uploadLeagueImage = multer({
  storage: leagueStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Configure Cloudinary Storage for Team logos
const teamLogoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'booking-sport/teams',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill' },
      { quality: 'auto' }
    ],
    public_id: (req, file) => {
      const leagueId = req.params.id || 'league';
      const teamId = req.params.teamId || 'team';
      const timestamp = Date.now();
      return `team_${leagueId}_${teamId}_${timestamp}`;
    }
  }
});

// Configure multer for Team logos
export const uploadTeamLogo = multer({
  storage: teamLogoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Configure Cloudinary Storage for Reward images
const rewardStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'booking-sport/rewards',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'fill' },
      { quality: 'auto' }
    ],
    public_id: (req, file) => {
      const rewardId = req.params.id || req.body.rewardId || 'reward';
      const timestamp = Date.now();
      return `reward_${rewardId}_${timestamp}`;
    }
  }
});

// Configure multer for Reward images
export const uploadRewardImage = multer({
  storage: rewardStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Cloudinary utility functions
export const cloudinaryUtils = {
  // Upload image and return URL
  uploadImage: async (filePath, options = {}) => {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'booking-sport/avatars',
        ...options
      });
      return result;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  },

  // Delete image from Cloudinary
  deleteImage: async (publicId) => {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw error;
    }
  },

  // Get image URL with transformations
  getImageUrl: (publicId, transformations = {}) => {
    return cloudinary.url(publicId, {
      secure: true,
      ...transformations
    });
  }
};

export default upload;

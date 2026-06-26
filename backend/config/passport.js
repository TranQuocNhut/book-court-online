import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import { config } from './config.js';

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth2 Strategy
passport.use(new GoogleStrategy({
  clientID: config.google.clientId,
  clientSecret: config.google.clientSecret,
  callbackURL: config.google.callbackUrl
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔍 Google OAuth Profile:', {
      id: profile.id,
      email: profile.emails[0]?.value,
      name: profile.displayName
    });

    // Tìm user hiện tại bằng Google ID
    let user = await User.findByGoogleId(profile.id);
    
    if (user) {
      // User đã tồn tại, cập nhật thông tin đăng nhập
      console.log('✅ User found, updating login info');
      await user.updateLoginInfo();
      return done(null, user);
    }

    // Tìm user bằng email (trường hợp user đã đăng ký bằng email trước đó)
    const email = profile.emails[0]?.value;
    if (email) {
      user = await User.findByEmail(email);
      
      if (user) {
        // User tồn tại nhưng chưa có Google ID, liên kết tài khoản
        console.log('🔗 Linking existing user with Google account');
        user.googleId = profile.id;
        user.avatar = profile.photos[0]?.value || user.avatar;
        user.isEmailVerified = true;
        user.isActive = true; // Activate the account when linking with Google
        await user.updateLoginInfo();
        return done(null, user);
      }
    }

    // Tạo user mới
    console.log('🆕 Creating new user from Google profile');
    user = await User.createFromGoogleProfile(profile);
    await user.updateLoginInfo();
    
    console.log('✅ New user created successfully:', user.email);
    return done(null, user);

  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    return done(error, null);
  }
}));

export default passport;

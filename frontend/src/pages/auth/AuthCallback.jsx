import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../api/authService';

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('processing');
  const [hasProcessed, setHasProcessed] = useState(false); // Thêm flag để tránh chạy nhiều lần

  const handleCallback = useCallback(async () => {
    if (hasProcessed) return; // Tránh chạy nhiều lần
    
    setHasProcessed(true);
    
    try {
      console.log('🔄 Starting OAuth callback processing...');
      
      // Get parameters from URL
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const userParam = searchParams.get('user');
      const error = searchParams.get('error');

      if (error) {
        console.error('❌ OAuth error:', error);
        navigate(`/auth/error?error=${error}&error_description=Có lỗi xảy ra trong quá trình đăng nhập`);
        return;
      }

      if (!accessToken || !refreshToken || !userParam) {
        console.error('❌ Missing OAuth parameters');
        navigate('/auth/error?error=missing_info&error_description=Thông tin đăng nhập không đầy đủ');
        return;
      }

      // Parse user data
      const userData = JSON.parse(decodeURIComponent(userParam));
      console.log('👤 User data from Google:', userData);
      console.log('📧 Email:', userData.email);
      console.log('👤 Name:', userData.name);
      console.log('🔑 Role:', userData.role);

      // Store tokens first
      authService.setTokens({
        accessToken,
        refreshToken
      });

      // Login user with the userData
      const result = await login(userData);

      if (result.success) {
        console.log('✅ Login successful, redirecting...');
        // Redirect based on user role
        switch (userData.role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'owner':
            navigate('/owner');
            break;
          default:
            navigate('/');
        }
      } else {
        console.error('❌ Login failed:', result.error);
        navigate('/auth/error?error=login_failed&error_description=Đăng nhập thất bại');
      }

    } catch (error) {
      console.error('💥 Callback error:', error);
      navigate('/auth/error?error=internal_error&error_description=Lỗi nội bộ khi xử lý đăng nhập');
    }
  }, [searchParams, navigate, login, hasProcessed]);

  useEffect(() => {
    handleCallback();
  }, [handleCallback]);

  // Rest of component remains the same...
  if (status === 'processing') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ 
            fontSize: '16px', 
            color: '#6b7280', 
            margin: 0 
          }}>
            Đang xử lý đăng nhập...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return null;
}

export default AuthCallback;
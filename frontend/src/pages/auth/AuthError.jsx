import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function AuthError() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const error = searchParams.get('error') || 'unknown_error';
  const errorDescription = searchParams.get('error_description') || 'Có lỗi xảy ra trong quá trình đăng nhập';

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'access_denied':
        return {
          title: 'Truy cập bị từ chối',
          message: 'Bạn đã hủy quá trình đăng nhập. Vui lòng thử lại nếu muốn tiếp tục.',
          icon: '🚫'
        };
      case 'server_error':
        return {
          title: 'Lỗi máy chủ',
          message: 'Có lỗi xảy ra từ phía máy chủ. Vui lòng thử lại sau.',
          icon: '⚠️'
        };
      case 'temporarily_unavailable':
        return {
          title: 'Dịch vụ tạm thời không khả dụng',
          message: 'Dịch vụ đăng nhập Google tạm thời không khả dụng. Vui lòng thử lại sau.',
          icon: '⏰'
        };
      default:
        return {
          title: 'Lỗi đăng nhập',
          message: errorDescription,
          icon: '❌'
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem 2rem',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '90%'
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '1rem'
        }}>
          {errorInfo.icon}
        </div>
        
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '0.5rem'
        }}>
          {errorInfo.title}
        </h1>
        
        <p style={{
          color: '#6b7280',
          marginBottom: '2rem',
          fontSize: '1rem',
          lineHeight: '1.5'
        }}>
          {errorInfo.message}
        </p>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#2563eb'}
            onMouseOut={(e) => e.target.style.background = '#3b82f6'}
          >
            Thử lại đăng nhập
          </button>
          
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              color: '#6b7280',
              border: '2px solid #e5e7eb',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#f9fafb';
              e.target.style.borderColor = '#d1d5db';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.borderColor = '#e5e7eb';
            }}
          >
            Về trang chủ
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details style={{
            marginTop: '2rem',
            textAlign: 'left',
            background: '#f9fafb',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <summary style={{
              cursor: 'pointer',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Chi tiết lỗi (Development)
            </summary>
            <div style={{
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              background: '#1f2937',
              color: '#f9fafb',
              padding: '0.75rem',
              borderRadius: '4px',
              marginTop: '0.5rem',
              overflow: 'auto'
            }}>
              <div><strong>Error Code:</strong> {error}</div>
              <div><strong>Error Description:</strong> {errorDescription}</div>
              <div><strong>URL Parameters:</strong></div>
              <pre>{JSON.stringify(Object.fromEntries(searchParams.entries()), null, 2)}</pre>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

export default AuthError;

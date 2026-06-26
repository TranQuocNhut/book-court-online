import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { authService } from '../../api/authService'
import RotatingText from '../../components/RotatingText'

function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Check for success message from other pages
  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message)
      // Pre-fill email if provided
      if (location.state.email) {
        setFormData(prev => ({ ...prev, email: location.state.email }))
      }
    }
  }, [location.state])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleGoogleLogin = () => {
    setLoading(true)
    try {
      authService.loginWithGoogle()
    } catch (error) {
      console.error('Google login error:', error)
      setError('Có lỗi xảy ra khi đăng nhập Google')
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    setLoading(true)

    try {
      const result = await authService.login(formData.email, formData.password)
      
      if (result.success && result.data.user) {
        login(result.data.user)
        navigate('/')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-wrapper">
      <div className="container" style={{ paddingTop: '60px' }}>
        <div className="auth-card">
          <div className="auth-left">
            <h2>Sport Booking</h2>
            <p style={{ fontSize: '15px', color: '#475569', fontWeight: 500 }}>
              Đặt sân thể thao <RotatingText words={['dễ dàng', 'tiện lợi', 'nhanh chóng']} />
            </p>
            <div className="auth-illustration" />
          </div>
          <div className="auth-right">
            <div className="tabs">
              <Link to="/login" className="tab active">Đăng nhập</Link>
              <Link to="/register" className="tab">Đăng ký</Link>
            </div>

            <h3>Đăng nhập tài khoản</h3>
            
            {success && (
              <div className="success-message" style={{
                background: '#d4edda',
                color: '#155724',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {success}
              </div>
            )}
            
            {error && (
              <div className="error-message" style={{
                background: '#fee',
                color: '#c33',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <input 
                  className="input" 
                  name="email"
                  type="email"
                  placeholder="Nhập email" 
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
              <div className="form-group password-field">
                <input 
                  className="input" 
                  name="password"
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Nhập mật khẩu" 
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <button 
                  type="button" 
                  className="eye-btn" 
                  aria-label="toggle password" 
                  onClick={() => setShowPassword(v => !v)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button 
                className="btn btn-dark full" 
                type="submit"
                disabled={loading}
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>
            
            <div className="row-between">
              <span />
              <Link to="/forgot-password">Quên mật khẩu</Link>
            </div>
            <div className="divider">Hoặc đăng nhập với</div>
            <button 
              className="btn btn-light full" 
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{ 
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                'Đang chuyển hướng...'
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Đăng nhập với Google
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Login


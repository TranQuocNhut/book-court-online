import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { authService } from '../../api/authService'
import RotatingText from '../../components/RotatingText'

function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const navigate = useNavigate()
  const { token } = useParams()

  useEffect(() => {
    if (!token) {
      navigate('/forgot-password')
    }
  }, [token, navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.password || !formData.confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu không khớp')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      setLoading(false)
      return
    }

    try {
      const result = await authService.resetPassword(token, formData.password)
      
      if (result.success) {
        setSuccess(true)
      }
    } catch (error) {
      console.error('Reset password error:', error)
      setError(error.message || 'Token không hợp lệ hoặc đã hết hạn.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
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
              <h3>Đặt lại mật khẩu thành công</h3>
              
              <div className="success-message" style={{
                background: '#d4edda',
                color: '#155724',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                <p>Mật khẩu của bạn đã được đặt lại thành công!</p>
                <p>Bây giờ bạn có thể đăng nhập với mật khẩu mới.</p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <Link to="/login" className="btn btn-dark full">
                  Đăng nhập ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="auth-wrapper">
      <div className="container" style={{ paddingTop: '60px' }}>
        <div className="auth-card">
          <div className="auth-left">
            <h2>Sport Booking</h2>
            <p style={{ fontSize: '15px', color: '#475569', fontWeight: 500 }}>
              Đặt sân <RotatingText words={['dễ dàng', 'tiện lợi', 'nhanh chóng']} />
            </p>
            <div className="auth-illustration" />
          </div>
          <div className="auth-right">
            <h3>Đặt lại mật khẩu</h3>
            
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Nhập mật khẩu mới cho tài khoản của bạn
            </p>
            
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
              <div className="form-group password-field">
                <input 
                  className="input" 
                  name="password"
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Mật khẩu mới" 
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

              <div className="form-group password-field">
                <input 
                  className="input" 
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'} 
                  placeholder="Nhập lại mật khẩu mới" 
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <button 
                  type="button" 
                  className="eye-btn" 
                  aria-label="toggle confirm" 
                  onClick={() => setShowConfirm(v => !v)}
                  disabled={loading}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              <button 
                className="btn btn-dark full" 
                type="submit"
                disabled={loading || !formData.password || !formData.confirmPassword}
                style={{ opacity: (loading || !formData.password || !formData.confirmPassword) ? 0.7 : 1 }}
              >
                {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
              </button>
            </form>
            
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to="/login" style={{ color: '#666', fontSize: '14px' }}>
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default ResetPassword
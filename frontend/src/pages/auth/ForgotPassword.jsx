import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../../api/authService'
import RotatingText from '../../components/RotatingText'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const navigate = useNavigate()

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!email) {
      setError('Vui lòng nhập email')
      setLoading(false)
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email không hợp lệ')
      setLoading(false)
      return
    }

    try {
      const result = await authService.forgotPassword(email)
      
      if (result.success) {
        setSuccess(true)
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      setError(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
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
              <h3>Email đã được gửi</h3>
              
              <div className="success-message" style={{
                background: '#d4edda',
                color: '#155724',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                <p>Chúng tôi đã gửi link reset mật khẩu đến email <strong>{email}</strong></p>
                <p>Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.</p>
                <p><small>Link có hiệu lực trong 30 phút.</small></p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <Link to="/login" className="btn btn-dark full">
                  Quay lại đăng nhập
                </Link>
              </div>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button 
                  className="btn btn-light" 
                  onClick={() => {
                    setSuccess(false)
                    setEmail('')
                  }}
                  style={{ fontSize: '14px' }}
                >
                  Gửi lại email
                </button>
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
            <h3>Quên mật khẩu</h3>
            
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Nhập email của bạn để nhận link reset mật khẩu
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
              <div className="form-group">
                <input 
                  className="input" 
                  name="email"
                  type="email"
                  placeholder="Nhập email của bạn" 
                  value={email}
                  onChange={handleEmailChange}
                  disabled={loading}
                />
              </div>
              
              <button 
                className="btn btn-dark full" 
                type="submit"
                disabled={loading || !email}
                style={{ opacity: (loading || !email) ? 0.7 : 1 }}
              >
                {loading ? 'Đang gửi...' : 'Gửi link reset'}
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

export default ForgotPassword
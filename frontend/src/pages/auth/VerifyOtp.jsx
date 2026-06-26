import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authService } from '../../api/authService'
import { useAuth } from '../../contexts/AuthContext'
import useCountdown from '../../hook/use-countdown'
import RotatingText from '../../components/RotatingText'

function VerifyOtp() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const { count: countdown, start: startCountdown } = useCountdown(0)
  
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  
  const email = location.state?.email || ''
  const message = location.state?.message || ''

  // Handle input change for OTP fields
  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (error) setError('')
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = ['', '', '', '', '', '']
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i]
    }
    setOtp(newOtp)
    const nextInput = document.getElementById(`otp-${pastedData.length}`)
    if (nextInput) nextInput.focus()
  }

  // Get OTP as string
  const getOtpString = () => otp.join('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const otpString = getOtpString()
    if (!otpString || otpString.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 số OTP')
      setLoading(false)
      return
    }

    try {
      const result = await authService.verifyOtp(email, otpString)
      
      if (result.success) {
        // OTP verified successfully - redirect to login
        navigate('/login', { 
          state: { 
            message: 'Xác thực thành công! Vui lòng đăng nhập.',
            email: email
          }
        })
      }
    } catch (error) {
      console.error('Verify OTP error:', error)
      setError(error.message || 'Mã OTP không hợp lệ. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    
    setResendLoading(true)
    setError('')

    try {
      // Re-register to get new OTP
      const result = await authService.register({
        name: 'Temp User', // We don't have the name here, backend will handle
        email: email,
        password: 'temp123' // Temporary password, backend will ignore for existing users
      })
      
      if (result.success) {
        startCountdown(60) // 60 seconds countdown
        setError('')
      }
    } catch (error) {
      console.error('Resend OTP error:', error)
      setError(error.message || 'Không thể gửi lại OTP. Vui lòng thử lại.')
    } finally {
      setResendLoading(false)
    }
  }

  if (!email) {
    return (
      <main className="auth-wrapper">
        <div className="container" style={{ paddingTop: '60px' }}>
          <div className="auth-card">
            <div className="auth-right">
              <h3>Lỗi</h3>
              <p>Không tìm thấy email để xác thực.</p>
              <Link to="/register" className="btn btn-dark full">
                Quay lại đăng ký
              </Link>
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
              Đặt sân thể thao <RotatingText words={['dễ dàng', 'tiện lợi', 'nhanh chóng']} />
            </p>
            <div className="auth-illustration" />
          </div>
          <div className="auth-right">
            <h3>Xác thực tài khoản</h3>
            
            <p style={{ marginBottom: '24px', color: '#666', fontSize: '15px' }}>
              Chúng tôi đã gửi mã 6 chữ số đến email của bạn.
            </p>

            {message && (
              <div className="success-message" style={{
                background: '#d4edda',
                color: '#155724',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {message}
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
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  marginBottom: '12px',
                  color: '#333'
                }}>
                  Mã xác thực
                </label>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  justifyContent: 'center',
                  marginBottom: '8px'
                }}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      disabled={loading}
                      style={{
                        width: '48px',
                        height: '56px',
                        textAlign: 'center',
                        fontSize: '24px',
                        fontWeight: '600',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0',
                        background: '#fff',
                        color: '#333'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6'
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e0e0e0'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  ))}
                </div>
                
                <p style={{ 
                  fontSize: '14px', 
                  color: '#666', 
                  textAlign: 'center',
                  marginTop: '8px'
                }}>
                  Chúng tôi đã gửi mã 6 chữ số đến email của bạn
                </p>
              </div>
              
              <button 
                className="btn btn-dark full" 
                type="submit"
                disabled={loading || getOtpString().length !== 6}
                style={{ 
                  opacity: (loading || getOtpString().length !== 6) ? 0.7 : 1,
                  marginTop: '24px'
                }}
              >
                {loading ? 'Đang xác thực...' : 'Xác thực'}
              </button>
            </form>
            
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: 0 }}>
                Không nhận được mã OTP?{' '}
                <button 
                  onClick={handleResendOtp}
                  disabled={resendLoading || countdown > 0}
                  style={{ 
                    border: 'none',
                    background: 'none',
                    color: '#3b82f6',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '14px',
                    opacity: (resendLoading || countdown > 0) ? 0.7 : 1
                  }}
                >
                  {resendLoading ? 'Đang gửi...' : 
                   countdown > 0 ? `Gửi lại sau ${countdown}s` : 
                   'Gửi lại'}
                </button>
              </p>
            </div>

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

export default VerifyOtp

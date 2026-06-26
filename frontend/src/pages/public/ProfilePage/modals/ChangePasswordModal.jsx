import React, { useState } from 'react'
import { FiX, FiEye, FiEyeOff, FiLock, FiCheck } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { userApi } from '../../../../api/userApi'
import useClickOutside from '../../../../hook/use-click-outside'
import useBodyScrollLock from '../../../../hook/use-body-scroll-lock'
import useEscapeKey from '../../../../hook/use-escape-key'

export default function ChangePasswordModal({ isOpen, onClose }) {
  // Lock body scroll
  useBodyScrollLock(isOpen)
  
  // Handle escape key
  useEscapeKey(onClose, isOpen)
  
  // Handle click outside
  const modalRef = useClickOutside(onClose, isOpen)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại'
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới'
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})
    setSuccessMessage('')
    
    try {
      // Call real API
      const result = await userApi.changePassword(
        formData.currentPassword,
        formData.newPassword
      )
      
      if (result.success) {
        toast.success('Đổi mật khẩu thành công!')
        
        // Reset form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          onClose()
        }, 1500)
      }
      
    } catch (error) {
      console.error('Change password error:', error)
      
      // Handle specific error cases
      if (error.message.includes('mật khẩu hiện tại không đúng')) {
        setErrors({ currentPassword: 'Mật khẩu hiện tại không đúng' })
      } else if (error.message.includes('tài khoản này đăng ký qua Google')) {
        toast.error('Tài khoản này đăng ký qua Google, không thể đổi mật khẩu')
        setErrors({ currentPassword: 'Tài khoản này đăng ký qua Google, không thể đổi mật khẩu' })
      } else if (error.message.includes('mật khẩu mới không được trùng')) {
        setErrors({ newPassword: 'Mật khẩu mới không được trùng với mật khẩu hiện tại' })
      } else {
        toast.error(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
        setErrors({ general: error.message || 'Có lỗi xảy ra. Vui lòng thử lại.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div ref={modalRef} className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h3>Đổi mật khẩu</h3>
          <button className="close-btn" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* General Error Message */}
          {errors.general && (
            <div className="error-message" style={{
              background: '#f8d7da',
              color: '#721c24',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Current Password */}
            <div className="form-group">
              <label htmlFor="currentPassword">
                <FiLock size={16} />
                Mật khẩu hiện tại
              </label>
              <div className="password-input">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  placeholder="Nhập mật khẩu hiện tại"
                  className={errors.currentPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errors.currentPassword && (
                <span className="error-message">{errors.currentPassword}</span>
              )}
            </div>

            {/* New Password */}
            <div className="form-group">
              <label htmlFor="newPassword">
                <FiLock size={16} />
                Mật khẩu mới
              </label>
              <div className="password-input">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Nhập mật khẩu mới"
                  className={errors.newPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errors.newPassword && (
                <span className="error-message">{errors.newPassword}</span>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword">
                <FiLock size={16} />
                Xác nhận mật khẩu mới
              </label>
              <div className="password-input">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Nhập lại mật khẩu mới"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>

            {/* Password Requirements */}
            <div className="password-requirements">
              <h4>Yêu cầu mật khẩu:</h4>
              <ul>
                <li className={formData.newPassword.length >= 6 ? 'valid' : ''}>
                  <FiCheck size={14} />
                  Ít nhất 6 ký tự
                </li>
                <li className={formData.newPassword !== formData.currentPassword ? 'valid' : ''}>
                  <FiCheck size={14} />
                  Khác mật khẩu hiện tại
                </li>
                <li className={formData.newPassword === formData.confirmPassword && formData.confirmPassword ? 'valid' : ''}>
                  <FiCheck size={14} />
                  Mật khẩu xác nhận khớp
                </li>
              </ul>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="spinner"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <FiCheck size={16} />
                    Đổi mật khẩu
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { FiX, FiUser, FiPhone, FiCamera, FiUpload } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { userApi } from '../../../../api/userApi'
import useClickOutside from '../../../../hook/use-click-outside'
import useBodyScrollLock from '../../../../hook/use-body-scroll-lock'
import useEscapeKey from '../../../../hook/use-escape-key'

export default function EditProfileModal({ isOpen, onClose, userData, onSave }) {
  // Lock body scroll
  useBodyScrollLock(isOpen)
  
  // Handle escape key
  useEscapeKey(onClose, isOpen)
  
  // Handle click outside
  const modalRef = useClickOutside(onClose, isOpen)
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    phone: userData?.phone || '',
    avatar: userData?.avatar || null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [avatarPreview, setAvatarPreview] = useState(userData?.avatar || null)

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

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          avatar: 'Vui lòng chọn file ảnh hợp lệ'
        }))
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          avatar: 'Kích thước file không được vượt quá 5MB'
        }))
        return
      }

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target.result)
        setFormData(prev => ({
          ...prev,
          avatar: file
        }))
      }
      reader.readAsDataURL(file)

      // Clear error
      if (errors.avatar) {
        setErrors(prev => ({
          ...prev,
          avatar: ''
        }))
      }
    }
  }

  const removeAvatar = async () => {
    if (!userData?.avatar) {
      // If no avatar exists, just clear the preview
      setAvatarPreview(null)
      setFormData(prev => ({
        ...prev,
        avatar: null
      }))
      return
    }

    if (window.confirm('Bạn có chắc chắn muốn xóa ảnh đại diện?')) {
      try {
        await userApi.deleteAvatar()
        
        // Clear preview and form data
        setAvatarPreview(null)
        setFormData(prev => ({
          ...prev,
          avatar: null
        }))
        
        toast.success('Xóa ảnh đại diện thành công!')
      } catch (error) {
        console.error('Delete avatar error:', error)
        toast.error('Có lỗi xảy ra khi xóa ảnh đại diện. Vui lòng thử lại.')
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập họ tên'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại'
    } else if (!/^[0-9\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ'
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
    
    try {
      // Prepare data for API
      const updateData = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined
      }

      // Update profile data first
      const profileResult = await userApi.updateProfile(updateData)
      
      // Upload avatar to Cloudinary if changed
      let avatarUrl = formData.avatar
      if (formData.avatar instanceof File) {
        const avatarResult = await userApi.uploadAvatar(formData.avatar)
        avatarUrl = avatarResult.data.uploadInfo.url
        console.log('✅ Avatar uploaded to Cloudinary:', avatarResult.data.uploadInfo)
      } else if (formData.avatar === null && userData?.avatar) {
        // Avatar was removed (set to null)
        avatarUrl = null
        console.log('✅ Avatar removed')
      } else {
        // Keep existing avatar
        avatarUrl = userData?.avatar
      }
      
      // Call onSave with updated data
      if (onSave) {
        onSave({
          ...updateData,
          avatar: avatarUrl
        })
      }
      
      // Show success message
      toast.success(profileResult.message || 'Cập nhật thông tin thành công!')
      
      // Close modal after showing success message
      setTimeout(() => {
        onClose()
      }, 1500)
      
    } catch (error) {
      console.error('Save profile error:', error)
      
      // Handle specific error messages
      if (error.message) {
        toast.error(`Lỗi: ${error.message}`)
      } else {
        toast.error('Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.')
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
          <h3>Chỉnh sửa thông tin cá nhân</h3>
          <button className="close-btn" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Avatar Section */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '24px',
            padding: '20px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            {/* Current Avatar Display */}
            <div style={{ 
              position: 'relative',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: avatarPreview ? 
                  `url(${avatarPreview})` : 
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '36px',
                fontWeight: '600',
                border: '3px solid #fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                {!avatarPreview && formData.name.charAt(0)}
              </div>
              
              {/* Camera Icon Overlay */}
              <div style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                background: '#3b82f6',
                color: '#fff',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '3px solid #fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>
                <FiCamera size={16} />
              </div>
            </div>

            {/* Upload Controls */}
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              alignItems: 'center'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: '#3b82f6',
                color: '#fff',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background 0.2s ease'
              }}>
                <FiUpload size={16} />
                Chọn ảnh
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                  disabled={isLoading}
                />
              </label>
              
              {avatarPreview && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'background 0.2s ease'
                  }}
                  disabled={isLoading}
                >
                  <FiX size={16} />
                  Xóa ảnh
                </button>
              )}
            </div>

            {/* Avatar Error */}
            {errors.avatar && (
              <div style={{
                color: '#ef4444',
                fontSize: '12px',
                marginTop: '8px',
                textAlign: 'center'
              }}>
                {errors.avatar}
              </div>
            )}

            {/* Upload Info */}
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              marginTop: '8px',
              textAlign: 'center'
            }}>
              Hỗ trợ: JPG, PNG, GIF. Tối đa 5MB
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div className="form-group">
              <label htmlFor="name">
                <FiUser size={16} />
                Họ và tên *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nhập họ và tên"
                className={errors.name ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.name && (
                <span className="error-message">{errors.name}</span>
              )}
            </div>


            {/* Phone */}
            <div className="form-group">
              <label htmlFor="phone">
                <FiPhone size={16} />
                Số điện thoại *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Nhập số điện thoại"
                className={errors.phone ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.phone && (
                <span className="error-message">{errors.phone}</span>
              )}
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
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <FiUser size={16} />
                    Lưu thay đổi
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

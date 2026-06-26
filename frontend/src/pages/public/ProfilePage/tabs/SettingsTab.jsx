import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ToggleSwitch from '../components/ToggleSwitch'
import ChangePasswordModal from '../modals/ChangePasswordModal'
import Dialog from '@/components/ui/Dialog'
import { AlertTriangle } from 'lucide-react'
import { userApi } from '@/api/userApi'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'
import '../modals/ChangePasswordModal.css'

export default function SettingsTab({ notifications, setNotifications }) {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleDeleteAccount = async () => {
    if (confirmText !== 'XÓA') {
      setDeleteError('Vui lòng nhập "XÓA" để xác nhận')
      return
    }

    setIsDeleting(true)
    setDeleteError('')

    try {
      const result = await userApi.deleteAccount()
      
      if (result.success) {
        // Đăng xuất và xóa tokens
        await logout()
        
        // Redirect về trang chủ
        navigate('/', { replace: true })
        
        // Hiển thị thông báo thành công
        alert('Tài khoản đã được xóa thành công')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      setDeleteError(error.message || 'Không thể xóa tài khoản. Vui lòng thử lại sau.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div className="settings-section">
        <h3 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '600' }}>Cài đặt tài khoản</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Thông báo */}
        <div>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Thông báo</h4>
          <div style={{ 
            background: '#fff', 
            borderRadius: '12px', 
            border: '1px solid #e5e7eb',
            padding: '16px 20px'
          }}>
            <ToggleSwitch 
              checked={notifications.booking}
              onChange={(e) => setNotifications({...notifications, booking: e.target.checked})}
              label="Nhận thông báo về lịch đặt sân"
              description="Nhận thông báo khi có lịch đặt mới hoặc thay đổi"
            />
            
            <ToggleSwitch 
              checked={notifications.promotion}
              onChange={(e) => setNotifications({...notifications, promotion: e.target.checked})}
              label="Nhận thông báo khuyến mãi"
              description="Nhận thông tin về các chương trình ưu đãi"
            />
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-start', 
              alignItems: 'center',
              padding: '12px 0',
              gap: '16px'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '4px' }}>
                  Nhận thông báo qua email
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  Gửi thông báo đến email của bạn
                </div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer', flexShrink: 0 }}>
                <input 
                  type="checkbox" 
                  checked={notifications.email}
                  onChange={async (e) => {
                    const newValue = e.target.checked
                    // Optimistic update
                    setNotifications({...notifications, email: newValue})
                    
                    // Update backend
                    try {
                      await userApi.updateProfile({ emailNotifications: newValue })
                      toast.success(newValue ? 'Đã bật thông báo email' : 'Đã tắt thông báo email')
                    } catch (error) {
                      // Revert on error
                      setNotifications({...notifications, email: !newValue})
                      toast.error('Không thể cập nhật cài đặt. Vui lòng thử lại.')
                      console.error('Error updating email notifications:', error)
                    }
                  }}
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: notifications.email ? '#3b82f6' : '#d1d5db',
                  borderRadius: '24px',
                  transition: '0.4s'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '18px',
                    width: '18px',
                    left: notifications.email ? '23px' : '3px',
                    bottom: '3px',
                    background: 'white',
                    borderRadius: '50%',
                    transition: '0.4s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}></span>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Bảo mật */}
        <div>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Bảo mật</h4>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: '12px' 
          }}>
            <button 
              onClick={() => setShowChangePasswordModal(true)}
              style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 20px',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <span style={{ fontSize: '18px' }}>🔒</span>
              <span>Đổi mật khẩu</span>
            </button>
            <button 
              style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 20px',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <span style={{ fontSize: '18px' }}>🔐</span>
              <span>Xác thực 2 bước</span>
            </button>
          </div>
        </div>

        {/* Vùng nguy hiểm */}
        <div>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#dc2626' }}>
            Vùng nguy hiểm
          </h4>
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '15px', fontWeight: '500', color: '#dc2626', marginBottom: '4px' }}>
                Xóa tài khoản
              </div>
              <div style={{ fontSize: '13px', color: '#991b1b' }}>
                Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn.
              </div>
            </div>
            <button 
              className="btn btn-dark" 
              style={{ 
                background: '#dc2626',
                borderColor: '#dc2626'
              }}
              onClick={() => setShowDeleteDialog(true)}
            >
              Xóa tài khoản
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />

      {/* Delete Account Dialog */}
      <Dialog 
        open={showDeleteDialog} 
        onClose={() => {
          if (!isDeleting) {
            setShowDeleteDialog(false)
            setConfirmText('')
            setDeleteError('')
          }
        }}
        maxWidth="500px"
      >
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={24} style={{ color: '#dc2626' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
              Xác nhận xóa tài khoản
            </h2>
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
            <p style={{ marginBottom: '12px' }}>
              Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn bao gồm:
            </p>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Tất cả lịch đặt sân</li>
              <li>Thông tin cá nhân</li>
              <li>Lịch sử thanh toán</li>
              <li>Dữ liệu yêu thích</li>
            </ul>
            <p style={{ marginTop: '12px' }}>
              Để xác nhận, vui lòng nhập <strong>"XÓA"</strong> vào ô bên dưới:
            </p>
          </div>
        </div>

        {/* Input */}
        <div style={{ marginBottom: '24px' }}>
          <input
            type="text"
            placeholder='Nhập "XÓA" để xác nhận'
            value={confirmText}
            onChange={(e) => {
              setConfirmText(e.target.value)
              setDeleteError('')
            }}
            disabled={isDeleting}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: deleteError ? '1px solid #dc2626' : '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s',
              opacity: isDeleting ? 0.6 : 1,
              cursor: isDeleting ? 'not-allowed' : 'text'
            }}
            onFocus={(e) => {
              if (!isDeleting) {
                e.target.style.borderColor = '#dc2626'
                e.target.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.1)'
              }
            }}
            onBlur={(e) => {
              e.target.style.borderColor = deleteError ? '#dc2626' : '#e5e7eb'
              e.target.style.boxShadow = 'none'
            }}
          />
          {deleteError && (
            <div style={{
              marginTop: '8px',
              fontSize: '13px',
              color: '#dc2626'
            }}>
              {deleteError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px'
        }}>
          <button
            onClick={() => {
              setShowDeleteDialog(false)
              setConfirmText('')
              setDeleteError('')
            }}
            disabled={isDeleting}
            style={{
              padding: '10px 20px',
              background: 'white',
              color: '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: isDeleting ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.target.style.background = '#f9fafb'
                e.target.style.borderColor = '#d1d5db'
              }
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) {
                e.target.style.background = 'white'
                e.target.style.borderColor = '#e5e7eb'
              }
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={confirmText !== 'XÓA' || isDeleting}
            style={{
              padding: '10px 20px',
              background: (confirmText === 'XÓA' && !isDeleting) ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : '#fca5a5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (confirmText === 'XÓA' && !isDeleting) ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: (confirmText === 'XÓA' && !isDeleting) ? '0 4px 12px rgba(220, 38, 38, 0.4)' : 'none',
              opacity: isDeleting ? 0.7 : 1,
              position: 'relative',
              minWidth: '160px'
            }}
            onMouseEnter={(e) => {
              if (confirmText === 'XÓA' && !isDeleting) {
                e.target.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.5)'
                e.target.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              if (confirmText === 'XÓA' && !isDeleting) {
                e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.4)'
                e.target.style.transform = 'translateY(0)'
              }
            }}
          >
            {isDeleting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <span style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                  display: 'inline-block'
                }}></span>
                Đang xóa...
              </span>
            ) : (
              'Xác nhận xóa tài khoản'
            )}
          </button>
        </div>
      </Dialog>
      </div>
    </>
  )
}


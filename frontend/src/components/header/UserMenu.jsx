import React, { useState, useEffect } from 'react'
import { User, LogOut, Settings, ChevronDown, Calendar, Wallet, Trophy, MessageSquare } from 'lucide-react'
import useClickOutside from '../../hook/use-click-outside'
import { walletApi } from '../../api/walletApi'

import './UserMenu.css'

const UserMenu = ({
  user,
  isOpen,
  onToggle,
  onProfileClick,
  onLogout,
  onSettingsClick,
  onBookingHistoryClick,
  onTopUpClick,
  onTournamentManagementClick,
  onFeedbackClick
}) => {
  const menuRef = useClickOutside(() => onToggle(), isOpen)
  const [balance, setBalance] = useState(user?.walletBalance || user?.balance || 0)
  const [loadingBalance, setLoadingBalance] = useState(false)

  // Tính hạng thành viên dựa trên điểm tích lũy
  const calculateMemberTier = (points) => {
    const lifetimePoints = points || 0
    if (lifetimePoints >= 10000) {
      return { id: 'gold', name: 'Vàng', color: '#f59e0b', bgColor: '#fef3c7' }
    }
    if (lifetimePoints >= 5000) {
      return { id: 'silver', name: 'Bạc', color: '#6b7280', bgColor: '#f3f4f6' }
    }
    return { id: 'bronze', name: 'Đồng', color: '#d97706', bgColor: '#fef3c7' }
  }

  const memberTier = calculateMemberTier(user?.lifetimePoints || user?.loyaltyPoints || 0)

  // Fetch balance when component mounts or user changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) return

      try {
        setLoadingBalance(true)
        const result = await walletApi.getBalance()
        if (result.success && result.data?.balance !== undefined) {
          setBalance(result.data.balance)
        }
      } catch (error) {
        console.error('Error fetching balance:', error)
        // Fallback to user.walletBalance if API fails
        setBalance(user?.walletBalance || user?.balance || 0)
      } finally {
        setLoadingBalance(false)
      }
    }

    fetchBalance()
  }, [user])

  // Update balance when user object changes (e.g., after top-up)
  useEffect(() => {
    if (user?.walletBalance !== undefined) {
      setBalance(user.walletBalance)
    } else if (user?.balance !== undefined) {
      setBalance(user.balance)
    }
  }, [user?.walletBalance, user?.balance])

  return (
    <div ref={menuRef} className="user-menu-container">
      <button
        onClick={onToggle}
        className="user-menu-btn"
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="user-avatar-img"
          />
        ) : (
          <div className="user-avatar-placeholder">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        )}
        <div className="user-info-container">
          <span className="user-name">
            {user?.name || 'User'}
          </span>
          <div className="user-balance-row">
            <Wallet size={14} color="#10b981" />
            <span className="user-balance-text">
              {loadingBalance ? '...' : balance.toLocaleString('vi-VN')} ₫
            </span>
          </div>
        </div>
        <ChevronDown size={16} color="#6b7280" className="user-chevron" />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,.15)',
          minWidth: '200px',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {user?.email}
            </div>
            {/* Hạng thành viên */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '6px',
              padding: '4px 8px',
              background: memberTier.bgColor,
              borderRadius: '6px',
              width: 'fit-content'
            }}>
              <Trophy size={12} color={memberTier.color} />
              <span style={{
                fontSize: '11px',
                color: memberTier.color,
                fontWeight: '600'
              }}>
                Hạng {memberTier.name}
              </span>
            </div>
            {(user?.role || user?.userType) && (
              <div style={{
                fontSize: '12px',
                color: '#3b82f6',
                marginTop: '4px',
                fontWeight: '500'
              }}>
                {(user.role || user.userType) === 'admin' ? 'Quản trị viên' :
                  (user.role || user.userType) === 'owner' ? 'Chủ sân' : 'Người dùng'}
              </div>
            )}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '6px'
            }}>
              <Wallet size={14} color="#10b981" />
              <span style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#10b981',
                whiteSpace: 'nowrap'
              }}>
                {loadingBalance ? '...' : balance.toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>

          <div style={{ padding: '8px' }}>
            <button
              onClick={onProfileClick}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                border: 'none',
                background: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.background = 'none'}
            >
              <User size={16} />
              Thông tin cá nhân
            </button>

            <button
              onClick={onBookingHistoryClick}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                border: 'none',
                background: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.background = 'none'}
            >
              <Calendar size={16} />
              Đặt sân của tôi
            </button>

            <button
              onClick={onTopUpClick}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                border: 'none',
                background: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.background = 'none'}
            >
              <Wallet size={16} />
              Nạp tiền
            </button>

            {onTournamentManagementClick && (
              <button
                onClick={onTournamentManagementClick}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  border: 'none',
                  background: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#374151',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.background = 'none'}
              >
                <Trophy size={16} />
                Giải đấu của tôi
              </button>
            )}

            <button
              onClick={onSettingsClick}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                border: 'none',
                background: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.background = 'none'}
            >
              <Settings size={16} />
              Cài đặt
            </button>

            <button
              onClick={onFeedbackClick}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                border: 'none',
                background: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.background = 'none'}
            >
              <MessageSquare size={16} />
              Góp ý
            </button>

            <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

            <button
              onClick={onLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                border: 'none',
                background: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#ef4444',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
              onMouseLeave={(e) => e.target.style.background = 'none'}
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserMenu

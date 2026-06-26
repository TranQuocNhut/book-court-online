import React, { useState } from 'react'
import { Mail, Phone, Calendar, Trophy, Heart, Edit3 } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { authService } from '../../../api/authService'
import StatCard from './components/StatCard'
import EditProfileModal from './modals/EditProfileModal'
import './modals/EditProfileModal.css'

export default function ProfileHeader({ userData, favoriteVenuesCount = 0 }) {
  const { refreshUserData } = useAuth()
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentUserData, setCurrentUserData] = useState(userData)

  // Cập nhật currentUserData khi userData thay đổi
  React.useEffect(() => {
    setCurrentUserData(userData)
  }, [userData])

  const handleEditClick = () => {
    setShowEditModal(true)
  }

  const handleSaveProfile = async (updatedData) => {
    try {
      // Handle avatar separately if it's a File object
      let avatarUrl = updatedData.avatar

      if (updatedData.avatar instanceof File) {
        // Create object URL for preview (in real app, you'd upload to server)
        avatarUrl = URL.createObjectURL(updatedData.avatar)
        console.log('Avatar file selected:', updatedData.avatar.name)
      }

      // Update local state
      setCurrentUserData(prev => ({
        ...prev,
        ...updatedData,
        avatar: avatarUrl
      }))

      // Refresh user data from server to get latest info
      await refreshUserData()

    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  return (

    <>
      <section className="profile-card profile-header-card">
        <div className="profile-header-flex">
          {/* Avatar */}
          <div className="profile-avatar-container">
            <div
              className="profile-avatar"
              style={{
                backgroundImage: currentUserData.avatar ? `url(${currentUserData.avatar})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              {!currentUserData.avatar && currentUserData.name.charAt(0)}
            </div>
            {currentUserData.isVIP && (
              <div className="profile-vip-badge">
                ⭐ Thành viên VIP
              </div>
            )}
          </div>

          {/* Info */}
          <div className="profile-info">
            <div className="profile-name-row">
              <h1 className="profile-name">{currentUserData.name}</h1>
              <button
                onClick={handleEditClick}
                className="profile-edit-btn"
              >
                <Edit3 size={16} />
                Chỉnh sửa
              </button>
            </div>

            <p className="profile-join-date">
              Thành viên từ tháng {new Date(currentUserData.joinDate).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}
            </p>

            {/* Contact Info */}
            <div className="profile-contact-grid">
              <div className="profile-contact-item">
                <Mail size={16} color="#6b7280" />
                {currentUserData.email}
              </div>
              <div className="profile-contact-item">
                <Phone size={16} color="#6b7280" />
                {currentUserData.phone}
              </div>
            </div>

            {/* Stats */}
            <div className="profile-stats-grid">
              <StatCard
                icon={Calendar}
                label="Tổng số lần đặt"
                value={currentUserData.totalBookings}
                bgColor="#eff6ff"
                iconColor="#2563eb"
              />
              <StatCard
                icon={Trophy}
                label="Điểm tích lũy"
                value={currentUserData.points.toLocaleString()}
                bgColor="#fef3c7"
                iconColor="#d97706"
              />
              <StatCard
                icon={Heart}
                label="Sân yêu thích"
                value={favoriteVenuesCount}
                bgColor="#f0fdf4"
                iconColor="#16a34a"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        userData={currentUserData}
        onSave={handleSaveProfile}
      />
    </>
  )
}


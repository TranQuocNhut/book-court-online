import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, X, Upload, ArrowLeft, ArrowRight, Save, ChevronDown, FileUp } from 'lucide-react'
import { toast } from 'react-toastify'
import Cropper from 'react-easy-crop'
import { useTournament } from '../TournamentContext'
import { leagueApi } from '../../../../api/leagueApi'
import { useAuth } from '../../../../contexts/AuthContext'
import '../../../../styles/TournamentDetail.css'

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })

const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(null)
        return
      }
      const url = URL.createObjectURL(blob)
      resolve(url)
    }, 'image/jpeg')
  })
}

const RegistrationTab = ({ tournament }) => {
  const { id } = useParams()
  const { refreshTournament } = useTournament()
  const { user } = useAuth()
  const [step, setStep] = useState(0) // 0: countdown, 1: form đội, 2: form thành viên
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  const [isExpired, setIsExpired] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form data
  const [teamData, setTeamData] = useState({
    teamNumber: '',
    contactPhone: '',
    contactName: '',
    logo: null,
    logoFile: null
  })
  const [members, setMembers] = useState([])

  // Crop modal state for member avatar
  const [cropModalState, setCropModalState] = useState({
    show: false,
    memberIndex: null,
    image: null,
    crop: { x: 0, y: 0 },
    zoom: 1,
    croppedAreaPixels: null
  })

  const positions = [
    'Thủ môn',
    'Hậu vệ',
    'Tiền vệ',
    'Tiền đạo',
    'Khác'
  ]

  useEffect(() => {
    if (!tournament?.registrationDeadline) {
      setIsExpired(true)
      return
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const deadline = new Date(tournament.registrationDeadline)
      // Set về cuối ngày (23:59:59) để so sánh chính xác
      deadline.setHours(23, 59, 59, 999)
      const deadlineTime = deadline.getTime()
      const difference = deadlineTime - now

      if (difference <= 0) {
        setIsExpired(true)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
      setIsExpired(false)
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [tournament?.registrationDeadline])

  // Initialize members array - chỉ tạo khi chuyển sang step 2 và chưa có members nào
  useEffect(() => {
    if (step === 2 && members.length === 0 && tournament?.membersPerTeam) {
      // Chỉ tạo 1 member mặc định, người dùng có thể thêm thêm
      const initialMember = {
        name: '',
        phone: '',
        position: '',
        jerseyNumber: '',
        avatar: null
      }
      setMembers([initialMember])
    }
  }, [step, tournament?.membersPerTeam])

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleStartRegister = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để đăng ký tham gia')
      return
    }
    setStep(1)
  }

  const handleTeamInputChange = (field, value) => {
    setTeamData(prev => ({ ...prev, [field]: value }))
  }

  const handleLogoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB')
      return
    }

    try {
      const teamId = 'temp'
      const result = await leagueApi.uploadTeamLogo(id, teamId, file)
      
      if (result.success && result.data?.logo) {
        setTeamData(prev => ({
          ...prev,
          logo: result.data.logo,
          logoFile: file
        }))
        toast.success('Đã upload logo thành công')
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      // If upload fails, just store locally
      const reader = new FileReader()
      reader.onloadend = () => {
        setTeamData(prev => ({
          ...prev,
          logo: reader.result,
          logoFile: file
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDeleteLogo = () => {
    setTeamData(prev => ({
      ...prev,
      logo: null,
      logoFile: null
    }))
  }

  const handleNextStep = () => {
    // Validate step 1
    if (step === 1) {
      if (!teamData.teamNumber.trim()) {
        toast.error('Vui lòng nhập tên đội')
        return
      }
      if (!teamData.contactPhone.trim()) {
        toast.error('Vui lòng nhập số điện thoại liên hệ')
        return
      }
      if (!teamData.contactName.trim()) {
        toast.error('Vui lòng nhập tên người liên hệ')
        return
      }
      setStep(2)
    }
  }

  const handleBackStep = () => {
    if (step === 2) {
      setStep(1)
    } else if (step === 1) {
      setStep(0)
    }
  }

  const handleMemberChange = (index, field, value) => {
    setMembers(prev => prev.map((member, i) => 
      i === index ? { ...member, [field]: value } : member
    ))
  }

  const handleAddMember = () => {
    setMembers(prev => [...prev, {
      name: '',
      phone: '',
      position: '',
      jerseyNumber: '',
      avatar: null
    }])
  }

  const handleRemoveMember = (index) => {
    setMembers(prev => prev.filter((_, i) => i !== index))
  }

  const handleMemberAvatarChange = (memberIndex, e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setCropModalState({
          show: true,
          memberIndex,
          image: reader.result,
          crop: { x: 0, y: 0 },
          zoom: 1,
          croppedAreaPixels: null
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCropModalState(prev => ({
      ...prev,
      croppedAreaPixels
    }))
  }, [])

  const handleCropComplete = async () => {
    if (!cropModalState.image || !cropModalState.croppedAreaPixels) return

    try {
      const croppedImageUrl = await getCroppedImg(cropModalState.image, cropModalState.croppedAreaPixels)
      if (croppedImageUrl) {
        setMembers(prev => prev.map((member, i) => 
          i === cropModalState.memberIndex ? { ...member, avatar: croppedImageUrl } : member
        ))
        setCropModalState({
          show: false,
          memberIndex: null,
          image: null,
          crop: { x: 0, y: 0 },
          zoom: 1,
          croppedAreaPixels: null
        })
      }
    } catch (error) {
      console.error('Error cropping image:', error)
      toast.error('Không thể xử lý ảnh')
    }
  }

  const handleCropCancel = () => {
    setCropModalState({
      show: false,
      memberIndex: null,
      image: null,
      crop: { x: 0, y: 0 },
      zoom: 1,
      croppedAreaPixels: null
    })
  }

  const handleDownloadSample = async () => {
    try {
      await leagueApi.downloadRegistrationTemplate(id)
      toast.success('Đã tải file mẫu thành công')
    } catch (error) {
      console.error('Error downloading template:', error)
      toast.error(error.message || 'Không thể tải file mẫu')
    }
  }

  const handleImportFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls,.csv'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      try {
        const result = await leagueApi.parseMembersForRegistration(id, file)
        
        if (result.success && result.data) {
          // Update members state with parsed data
          setMembers(result.data)
          toast.success(result.message || 'Đã import thành viên thành công')
        }
      } catch (error) {
        console.error('Error importing members:', error)
        toast.error(error.message || 'Không thể import thành viên')
      }
    }
    input.click()
  }

  const handleSubmit = async () => {
    // Validate step 2
    if (step === 2) {
      const requiredMembers = tournament?.membersPerTeam || 0
      if (members.length < requiredMembers) {
        toast.error(`Vui lòng nhập đủ ${requiredMembers} thành viên`)
        return
      }

      const isFootball = tournament?.sport === 'Bóng đá'

      // Validate members
      for (let i = 0; i < requiredMembers; i++) {
        const member = members[i]
        if (!member.name.trim()) {
          toast.error(`Vui lòng nhập tên thành viên thứ ${i + 1}`)
          return
        }
        if (isFootball && !member.jerseyNumber) {
          toast.error(`Vui lòng nhập số áo cho thành viên thứ ${i + 1}`)
          return
        }
      }

      try {
        setSubmitting(true)

        // Prepare registration data
        const registrationData = {
          teamData: {
            teamNumber: teamData.teamNumber.trim(),
            contactPhone: teamData.contactPhone.trim(),
            contactName: teamData.contactName.trim()
          },
          members: members.map(member => ({
            name: member.name.trim(),
            phone: member.phone.trim() || '',
            position: member.position.trim() || '',
            jerseyNumber: isFootball ? (member.jerseyNumber || '') : undefined,
            avatar: member.avatar || null
          }))
        }

        // Register to league
        const result = await leagueApi.registerToLeague(id, registrationData)
        
        if (result.success) {
          toast.success('Đăng ký tham gia giải đấu thành công!')
          refreshTournament()
          // Reset form
          setStep(0)
          setTeamData({
            teamNumber: '',
            contactPhone: '',
            contactName: '',
            logo: null,
            logoFile: null
          })
          setMembers([])
        }
      } catch (error) {
        console.error('Error registering:', error)
        toast.error(error.message || 'Không thể đăng ký tham gia giải đấu')
      } finally {
        setSubmitting(false)
      }
    }
  }

  if (!tournament) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
        Đang tải thông tin giải đấu...
      </div>
    )
  }

  // So sánh đến cuối ngày hết hạn (23:59:59)
  const hasRegistration = tournament.registrationDeadline && (() => {
    const deadline = new Date(tournament.registrationDeadline);
    deadline.setHours(23, 59, 59, 999); // Set về cuối ngày
    return deadline > new Date();
  })()
  // Kiểm tra giải đấu đã đủ đội tham gia chưa
  const isFull = tournament.participants >= tournament.maxParticipants
  const minMembers = tournament.membersPerTeam || 0
  const maxMembers = tournament.membersPerTeam || 0
  const isFootball = tournament.sport === 'Bóng đá'
  
  // Kiểm tra user đã đăng ký chưa
  const isUserRegistered = user && tournament?.teams && tournament.teams.some(team => {
    // Kiểm tra contactPhone trùng với user.phone
    if (user.phone && team.contactPhone && team.contactPhone === user.phone) {
      return true
    }
    // Kiểm tra có member nào có phone trùng với user.phone
    if (user.phone && team.members && team.members.some(member => member.phone === user.phone)) {
      return true
    }
    return false
  })

  // Step 0: Countdown and start button
  if (step === 0) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: '48px 32px',
        textAlign: 'center',
        border: '1px solid #e5e7eb'
      }}>
        {/* Registration Deadline Info */}
        {tournament.registrationDeadline && (
          <div style={{ marginBottom: 32 }}>
            <p style={{ 
              fontSize: 16, 
              fontWeight: 400, 
              margin: 0,
              marginBottom: 8,
              color: '#6b7280'
            }}>
              Hạn đăng ký đến hết ngày{' '}
              <span style={{ 
                color: '#1f2937', 
                fontWeight: 600
              }}>
                {formatDate(tournament.registrationDeadline)}
              </span>
            </p>
          </div>
        )}

        {/* Team Requirements */}
        {tournament.tournamentType === 'team' && tournament.membersPerTeam && (
          <div style={{ marginBottom: 32 }}>
            <p style={{ 
              fontSize: 14, 
              fontWeight: 400, 
              margin: 0,
              color: '#6b7280'
            }}>
              Yêu cầu: Tối thiểu <strong style={{ color: '#1f2937' }}>{minMembers}</strong> thành viên
              {maxMembers > minMembers ? (
                <> / Tối đa <strong style={{ color: '#1f2937' }}>{maxMembers}</strong> thành viên</>
              ) : null}
            </p>
          </div>
        )}

        {/* Countdown Timer */}
        {hasRegistration && !isExpired && !isFull && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
            marginBottom: 40,
            flexWrap: 'wrap'
          }}>
            {/* Days */}
            <div style={{
              background: '#f9fafb',
              borderRadius: 8,
              padding: '20px 24px',
              minWidth: 80,
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: 36,
                fontWeight: 600,
                lineHeight: 1,
                marginBottom: 4,
                fontFamily: 'monospace',
                color: '#1f2937'
              }}>
                {String(timeLeft.days).padStart(2, '0')}
              </div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: '#6b7280'
              }}>
                Ngày
              </div>
            </div>

            {/* Hours */}
            <div style={{
              background: '#f9fafb',
              borderRadius: 8,
              padding: '20px 24px',
              minWidth: 80,
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: 36,
                fontWeight: 600,
                lineHeight: 1,
                marginBottom: 4,
                fontFamily: 'monospace',
                color: '#1f2937'
              }}>
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: '#6b7280'
              }}>
                Giờ
              </div>
            </div>

            {/* Minutes */}
            <div style={{
              background: '#f9fafb',
              borderRadius: 8,
              padding: '20px 24px',
              minWidth: 80,
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: 36,
                fontWeight: 600,
                lineHeight: 1,
                marginBottom: 4,
                fontFamily: 'monospace',
                color: '#1f2937'
              }}>
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: '#6b7280'
              }}>
                Phút
              </div>
            </div>

            {/* Seconds */}
            <div style={{
              background: '#f9fafb',
              borderRadius: 8,
              padding: '20px 24px',
              minWidth: 80,
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: 36,
                fontWeight: 600,
                lineHeight: 1,
                marginBottom: 4,
                fontFamily: 'monospace',
                color: '#1f2937'
              }}>
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: '#6b7280'
              }}>
                Giây
              </div>
            </div>
          </div>
        )}

        {/* Full Teams Message - Ưu tiên hiển thị nếu đã đủ đội */}
        {isFull && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            padding: 20,
            marginBottom: 32
          }}>
            <p style={{ 
              fontSize: 16, 
              fontWeight: 500, 
              margin: 0,
              color: '#991b1b'
            }}>
              Đã đủ đội tham gia
            </p>
          </div>
        )}

        {/* Expired Message - Chỉ hiển thị khi chưa đủ đội nhưng đã hết hạn */}
        {isExpired && !isFull && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            padding: 20,
            marginBottom: 32
          }}>
            <p style={{ 
              fontSize: 16, 
              fontWeight: 500, 
              margin: 0,
              color: '#991b1b'
            }}>
              Đã hết hạn đăng ký
            </p>
          </div>
        )}

        {/* Register Button */}
        {hasRegistration && !isExpired && !isFull && (
          <button
            onClick={handleStartRegister}
            disabled={isUserRegistered}
            style={{
              background: isUserRegistered ? '#9ca3af' : '#1f2937',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '14px 32px',
              fontSize: 16,
              fontWeight: 600,
              cursor: isUserRegistered ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              opacity: isUserRegistered ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!isUserRegistered) {
                e.target.style.background = '#374151'
              }
            }}
            onMouseLeave={(e) => {
              if (!isUserRegistered) {
                e.target.style.background = '#1f2937'
              }
            }}
          >
            {isUserRegistered ? 'Bạn đã đăng ký' : 'Bắt đầu đăng ký'}
          </button>
        )}

        {/* No Registration Message */}
        {!tournament.registrationDeadline && (
          <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 20,
            marginTop: 32
          }}>
            <p style={{ 
              fontSize: 14, 
              fontWeight: 400, 
              margin: 0,
              color: '#6b7280'
            }}>
              Giải đấu này không cho phép đăng ký trực tuyến
            </p>
          </div>
        )}
      </div>
    )
  }

  // Step 1: Team Info Form
  if (step === 1) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: '32px',
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{
          fontSize: 20,
          fontWeight: 600,
          color: '#1f2937',
          margin: '0 0 24px 0'
        }}>
          Thông tin đội
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '200px 1fr',
          gap: '32px',
          alignItems: 'start'
        }}>
          {/* Logo Upload */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
              marginBottom: 12
            }}>
              Logo đội
            </label>
            <div style={{
              position: 'relative',
              width: 160,
              height: 160,
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
              marginBottom: 12
            }}>
              <img 
                src={teamData.logo || '/team.png'} 
                alt="Team Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              {teamData.logo && (
                <button
                  onClick={handleDeleteLogo}
                  type="button"
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#fff'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.background = '#f9fafb'}
            >
              <Upload size={16} />
              {teamData.logo ? 'Thay đổi' : 'Tải lên'}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleLogoChange}
              />
            </label>
          </div>

          {/* Form Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 500,
                color: '#374151',
                marginBottom: 8
              }}>
                Số đội <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={teamData.teamNumber}
                onChange={(e) => handleTeamInputChange('teamNumber', e.target.value)}
                placeholder="#1"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14,
                  color: '#1f2937',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#9ca3af'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 500,
                color: '#374151',
                marginBottom: 8
              }}>
                Số điện thoại liên hệ <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="tel"
                value={teamData.contactPhone}
                onChange={(e) => handleTeamInputChange('contactPhone', e.target.value)}
                placeholder="0123456789"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14,
                  color: '#1f2937',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#9ca3af'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 500,
                color: '#374151',
                marginBottom: 8
              }}>
                Tên người liên hệ <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={teamData.contactName}
                onChange={(e) => handleTeamInputChange('contactName', e.target.value)}
                placeholder="Nguyễn Văn A"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14,
                  color: '#1f2937',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#9ca3af'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: 12,
              marginTop: 8
            }}>
              <button 
                onClick={handleBackStep}
                style={{
                  padding: '12px 24px',
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#374151',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
              >
                <ArrowLeft size={16} />
                Quay lại
              </button>
              <button 
                onClick={handleNextStep}
                style={{
                  padding: '12px 24px',
                  background: '#1f2937',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#374151'}
                onMouseLeave={(e) => e.target.style.background = '#1f2937'}
              >
                Tiếp theo
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Members Form
  if (step === 2) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: '32px',
        border: '1px solid #e5e7eb'
      }}>
        {/* Crop Modal */}
        {cropModalState.show && (
          <div className="crop-modal-overlay">
            <div className="crop-modal-container">
              <div className="crop-modal-header">
                <h3>Chỉnh sửa ảnh đại diện</h3>
                <button className="crop-modal-close" onClick={handleCropCancel}>
                  <X size={20} />
                </button>
              </div>
              <div className="crop-container">
                <Cropper
                  image={cropModalState.image}
                  crop={cropModalState.crop}
                  zoom={cropModalState.zoom}
                  aspect={1}
                  onCropChange={(crop) => setCropModalState(prev => ({ ...prev, crop }))}
                  onZoomChange={(zoom) => setCropModalState(prev => ({ ...prev, zoom }))}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="crop-controls">
                <div className="crop-zoom-control">
                  <label>Phóng to:</label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={cropModalState.zoom}
                    onChange={(e) => setCropModalState(prev => ({ ...prev, zoom: Number(e.target.value) }))}
                  />
                </div>
                <div className="crop-actions">
                  <button className="btn-crop-cancel" onClick={handleCropCancel}>
                    Hủy
                  </button>
                  <button className="btn-crop-save" onClick={handleCropComplete}>
                    <Save size={16} />
                    Lưu
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <div className="members-header">
            <div>
              <h3>Thông tin thành viên</h3>
              <p style={{ color: '#6b7280', marginTop: '4px' }}>
                {members.length}/{minMembers} thành viên
              </p>
            </div>
          </div>

          {/* Import Actions */}
          <div className="members-import-actions">
            <div className="members-import-actions-right">
              <button
                className="download-sample-link"
                onClick={handleDownloadSample}
              >
                Tải về tệp tin mẫu
              </button>
              <button
                className="btn-import-file"
                onClick={handleImportFile}
              >
                <FileUp size={16} />
                Nhập tệp tin
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {members.map((member, index) => (
              <div 
                key={index} 
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 20,
                  display: 'flex',
                  gap: 20,
                  alignItems: 'start'
                }}
              >
                {/* Avatar */}
                <div>
                  <label style={{
                    display: 'block',
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    position: 'relative'
                  }}>
                    <img 
                      src={member.avatar || '/player.png'} 
                      alt="Avatar"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleMemberAvatarChange(index, e)}
                    />
                  </label>
                </div>

                {/* Form Fields */}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isFootball ? '80px 1fr 1fr 1fr' : '1fr 1fr', gap: 16 }}>
                  {isFootball && (
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#374151',
                        marginBottom: 6
                      }}>
                        Số áo <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={member.jerseyNumber}
                        onChange={(e) => handleMemberChange(index, 'jerseyNumber', e.target.value)}
                        placeholder="Số áo"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          fontSize: 14,
                          color: '#1f2937'
                        }}
                      />
                    </div>
                  )}

                  {isFootball && (
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#374151',
                        marginBottom: 6
                      }}>
                        Vị trí
                      </label>
                      <select
                        value={member.position}
                        onChange={(e) => handleMemberChange(index, 'position', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          fontSize: 14,
                          color: '#1f2937',
                          background: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">Chọn vị trí</option>
                        {positions.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#374151',
                      marginBottom: 6
                    }}>
                      Họ tên <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                      placeholder="Họ tên đầy đủ"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: 14,
                        color: '#1f2937'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#374151',
                      marginBottom: 6
                    }}>
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={member.phone}
                      onChange={(e) => handleMemberChange(index, 'phone', e.target.value)}
                      placeholder="Số điện thoại"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: 14,
                        color: '#1f2937'
                      }}
                    />
                  </div>
                </div>

                {/* Remove Button */}
                {members.length > minMembers && (
                  <button 
                    onClick={() => handleRemoveMember(index)}
                    style={{
                      padding: '8px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: 6,
                      cursor: 'pointer',
                      color: '#991b1b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#fee2e2'}
                    onMouseLeave={(e) => e.target.style.background = '#fef2f2'}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {members.length < maxMembers && (
            <button
              onClick={handleAddMember}
              style={{
                marginTop: 16,
                padding: '12px 24px',
                background: '#f9fafb',
                border: '1px dashed #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                color: '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.background = '#f9fafb'}
            >
              <Plus size={16} />
              Thêm thành viên
            </button>
          )}

          <div style={{
            display: 'flex',
            gap: 12,
            marginTop: 32,
            paddingTop: 24,
            borderTop: '1px solid #e5e7eb'
          }}>
            <button 
              onClick={handleBackStep}
              disabled={submitting}
              style={{
                padding: '12px 24px',
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                color: '#374151',
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: submitting ? 0.6 : 1,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => !submitting && (e.target.style.background = '#e5e7eb')}
              onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
            >
              <ArrowLeft size={16} />
              Quay lại
            </button>
            <button 
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '12px 24px',
                background: '#1f2937',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                color: '#fff',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => !submitting && (e.target.style.background = '#374151')}
              onMouseLeave={(e) => e.target.style.background = '#1f2937'}
            >
              {submitting ? 'Đang xử lý...' : 'Hoàn tất đăng ký'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default RegistrationTab

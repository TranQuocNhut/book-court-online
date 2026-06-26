import React, { useState, useCallback } from 'react'
import { useParams, useNavigate, NavLink } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Pencil, Upload, Trash2, Users, FileUp, ChevronDown, X, Link as LinkIcon } from 'lucide-react'
import { toast } from 'react-toastify'
import Cropper from 'react-easy-crop'
import { useTournament } from '../TournamentContext'
import { leagueApi } from '../../../../api/leagueApi'

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

const TeamMembersTab = ({ team, tournament }) => {
  const { id } = useParams()
  const { refreshTournament } = useTournament()
  const [showAddMemberForm, setShowAddMemberForm] = useState(false)
  const [editingMemberIndex, setEditingMemberIndex] = useState(null)
  const [savingMember, setSavingMember] = useState(false)
  const [deletingMemberIndex, setDeletingMemberIndex] = useState(null)
  const [newMember, setNewMember] = useState({
    jerseyNumber: '',
    position: '',
    name: '',
    phone: '',
    avatar: null
  })
  const [showCropModal, setShowCropModal] = useState(false)
  const [cropImage, setCropImage] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [showSheetsModal, setShowSheetsModal] = useState(false)
  const [sheetsUrl, setSheetsUrl] = useState('')
  const [loadingSheets, setLoadingSheets] = useState(false)

  const positions = [
    'Thủ môn',
    'Hậu vệ',
    'Tiền vệ',
    'Tiền đạo',
    'Khác'
  ]

  const handleAddMember = () => {
    setShowAddMemberForm(true)
  }

  const handleCloseForm = () => {
    setShowAddMemberForm(false)
    setEditingMemberIndex(null)
    setNewMember({
      jerseyNumber: '',
      position: '',
      name: '',
      phone: '',
      avatar: null
    })
  }

  const handleMemberInputChange = (field, value) => {
    setNewMember(prev => ({ ...prev, [field]: value }))
  }

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setCropImage(reader.result)
        setShowCropModal(true)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = async () => {
    if (!cropImage || !croppedAreaPixels) return

    try {
      const croppedImageUrl = await getCroppedImg(cropImage, croppedAreaPixels)
      if (croppedImageUrl) {
        setNewMember(prev => ({ ...prev, avatar: croppedImageUrl }))
        setShowCropModal(false)
        setCropImage(null)
      }
    } catch (error) {
      console.error('Error cropping image:', error)
      toast.error('Không thể xử lý ảnh')
    }
  }

  const handleCropCancel = () => {
    setShowCropModal(false)
    setCropImage(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
  }

  const handleSaveMember = async () => {
    const isFootball = tournament?.sport === 'Bóng đá'
    
    if (isFootball && !newMember.jerseyNumber) {
      toast.error('Vui lòng điền số áo (bắt buộc cho môn Bóng đá)')
      return
    }
    
    if (!newMember.name) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    try {
      setSavingMember(true)
      
      const memberData = {
        name: newMember.name,
        phone: newMember.phone || '',
        position: newMember.position || '',
        avatar: newMember.avatar || null
      }
      
      if (isFootball) {
        memberData.jerseyNumber = newMember.jerseyNumber || ''
      }

      const teamId = team.id || team._id

      if (editingMemberIndex !== null) {
        await leagueApi.updateMember(id, teamId, editingMemberIndex, memberData)
        toast.success('Đã cập nhật thành viên thành công')
      } else {
        const updatedTeams = tournament.teams.map(t => {
          const tId = t.id || t._id
          const teamIdNum = team.id || team._id
          if (String(tId) === String(teamIdNum) || tId === teamIdNum) {
            return {
              ...t,
              members: [...(t.members || []), memberData]
            }
          }
          return t
        })

        await leagueApi.updateLeague(id, {
          teams: updatedTeams
        })
        toast.success('Đã thêm thành viên thành công')
      }
      
      handleCloseForm()
      refreshTournament()
    } catch (error) {
      console.error('Error saving member:', error)
      toast.error(error.message || 'Không thể lưu thành viên')
    } finally {
      setSavingMember(false)
    }
  }

  const handleEditMember = (memberIndex) => {
    const member = team.members[memberIndex]
    if (!member) return
    
    setNewMember({
      jerseyNumber: member.jerseyNumber || '',
      position: member.position || '',
      name: member.name || '',
      phone: member.phone || '',
      avatar: member.avatar || null
    })
    setEditingMemberIndex(memberIndex)
    setShowAddMemberForm(true)
  }

  const handleDeleteMember = async (memberIndex) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thành viên này?')) {
      return
    }

    try {
      setDeletingMemberIndex(memberIndex)
      const teamId = team.id || team._id
      await leagueApi.deleteMember(id, teamId, memberIndex)
      toast.success('Đã xóa thành viên thành công')
      refreshTournament()
    } catch (error) {
      console.error('Error deleting member:', error)
      toast.error(error.message || 'Không thể xóa thành viên')
    } finally {
      setDeletingMemberIndex(null)
    }
  }

  const handleDownloadSample = async () => {
    try {
      const teamId = team.id || team._id
      await leagueApi.downloadMemberTemplate(id, teamId)
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
        const teamId = team.id || team._id
        await leagueApi.importMembers(id, teamId, file)
        toast.success('Đã import thành viên thành công')
        refreshTournament()
      } catch (error) {
        console.error('Error importing members:', error)
        toast.error(error.message || 'Không thể import thành viên')
      }
    }
    input.click()
  }

  const handleImportFromSheets = async () => {
    if (!sheetsUrl.trim()) {
      toast.error('Vui lòng nhập Google Sheets URL')
      return
    }

    try {
      setLoadingSheets(true)
      const teamId = team.id || team._id
      await leagueApi.importMembersFromSheets(id, teamId, sheetsUrl.trim())
      toast.success('Đã import thành viên từ Google Sheets thành công')
      setShowSheetsModal(false)
      setSheetsUrl('')
      refreshTournament()
    } catch (error) {
      console.error('Error importing from sheets:', error)
      toast.error(error.message || 'Không thể import từ Google Sheets')
    } finally {
      setLoadingSheets(false)
    }
  }

  if (!team) return null

  return (
    <div className="team-members-edit">
      {showCropModal && (
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
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
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
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
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
      <div className="members-header">
        <div>
          <h3>Danh sách thành viên</h3>
          <p style={{ color: '#6b7280', marginTop: '4px' }}>
            Quản lý các thành viên trong đội
          </p>
        </div>
      </div>

      <div className="members-import-actions">
        <button 
          className="btn-add-member"
          onClick={handleAddMember}
        >
          <Plus size={16} />
          Thêm thành viên
        </button>
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
          <button
            className="btn-import-sheets"
            onClick={() => setShowSheetsModal(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <LinkIcon size={16} />
            Nhập từ Google Sheets
          </button>
        </div>
      </div>

      {/* Modal for Google Sheets */}
      {showSheetsModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowSheetsModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Nhập từ Google Sheets</h3>
              <button
                onClick={() => {
                  setShowSheetsModal(false)
                  setSheetsUrl('')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ marginBottom: '16px', color: '#6b7280', fontSize: '14px' }}>
              Dán link Google Sheets của bạn. Sheet phải được chia sẻ công khai hoặc có quyền truy cập.
            </p>
            <input
              type="text"
              value={sheetsUrl}
              onChange={(e) => setSheetsUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '14px'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowSheetsModal(false)
                  setSheetsUrl('')
                }}
                disabled={loadingSheets}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  cursor: loadingSheets ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleImportFromSheets}
                disabled={loadingSheets || !sheetsUrl.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: loadingSheets || !sheetsUrl.trim() ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loadingSheets || !sheetsUrl.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {loadingSheets ? 'Đang import...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="members-list">
        {team.members && team.members.length > 0 && (
          team.members.map((member, index) => (
            editingMemberIndex === index ? (
              <div key={index} className="add-member-form-inline">
                <div className="member-avatar-section">
                  <label className="member-avatar-upload-label">
                    {newMember.avatar ? (
                      <img src={newMember.avatar} alt="Avatar" className="member-avatar-preview" />
                    ) : (
                      <img src="/player.png" alt="Default Avatar" className="member-avatar-preview" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>

                <div className="add-member-form-content">
                  <div className="member-form-fields">
                    {tournament?.sport === 'Bóng đá' && (
                      <div className="member-form-group">
                        <label className="member-form-label">
                          Số áo <span className="required-asterisk">*</span>
                        </label>
                        <input
                          type="text"
                          className="member-form-input"
                          value={newMember.jerseyNumber}
                          onChange={(e) => handleMemberInputChange('jerseyNumber', e.target.value)}
                          placeholder="Số áo"
                        />
                      </div>
                    )}

                    <div className="member-form-group">
                      <label className="member-form-label">
                        Vị Trí Thi Đấu
                      </label>
                      <div className="member-form-select-wrapper">
                        <select
                          className="member-form-select"
                          value={newMember.position}
                          onChange={(e) => handleMemberInputChange('position', e.target.value)}
                        >
                          <option value="">Chọn vị trí</option>
                          {positions.map(pos => (
                            <option key={pos} value={pos}>{pos}</option>
                          ))}
                        </select>
                        <ChevronDown size={18} className="select-chevron" />
                      </div>
                    </div>

                    <div className="member-form-group">
                      <label className="member-form-label">
                        Họ tên đầy đủ
                      </label>
                      <input
                        type="text"
                        className="member-form-input"
                        value={newMember.name}
                        onChange={(e) => handleMemberInputChange('name', e.target.value)}
                        placeholder="Họ tên đầy đủ"
                      />
                    </div>

                    <div className="member-form-group">
                      <label className="member-form-label">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        className="member-form-input"
                        value={newMember.phone}
                        onChange={(e) => handleMemberInputChange('phone', e.target.value)}
                        placeholder="Số điện thoại"
                      />
                    </div>
                  </div>
                </div>

                <div className="member-form-actions-inline">
                  <button className="btn-cancel-member" onClick={handleCloseForm} disabled={savingMember}>
                    <X size={16} />
                  </button>
                  <button className="btn-save-member" onClick={handleSaveMember} disabled={savingMember}>
                    <Save size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div key={index} className="member-item-form">
                <div className="member-avatar-section">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="member-avatar-preview" />
                  ) : (
                    <img src="/player.png" alt="Default Avatar" className="member-avatar-preview" />
                  )}
                </div>

                <div className="add-member-form-content">
                  <div className="member-form-fields">
                    {tournament?.sport === 'Bóng đá' && member.jerseyNumber && (
                      <div className="member-form-group">
                        <label className="member-form-label">
                          Số áo
                        </label>
                        <div className="member-form-value">{member.jerseyNumber}</div>
                      </div>
                    )}

                    <div className="member-form-group">
                      <label className="member-form-label">
                        Vị Trí Thi Đấu
                      </label>
                      <div className="member-form-value">{member.position || '-'}</div>
                    </div>

                    <div className="member-form-group">
                      <label className="member-form-label">
                        Họ tên đầy đủ
                      </label>
                      <div className="member-form-value">{member.name || '-'}</div>
                    </div>

                    <div className="member-form-group">
                      <label className="member-form-label">
                        Số điện thoại
                      </label>
                      <div className="member-form-value">{member.phone || '-'}</div>
                    </div>
                  </div>
                </div>

                <div className="member-form-actions-inline">
                  <button 
                    className="member-action-btn"
                    onClick={() => handleEditMember(index)}
                    disabled={deletingMemberIndex === index || savingMember}
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    className="member-action-btn member-action-delete"
                    onClick={() => handleDeleteMember(index)}
                    disabled={deletingMemberIndex === index || savingMember || editingMemberIndex !== null}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          ))
        )}

        {showAddMemberForm && editingMemberIndex === null && (
          <div className="add-member-form-inline">
            <div className="member-avatar-section">
              <label className="member-avatar-upload-label">
                {newMember.avatar ? (
                  <img src={newMember.avatar} alt="Avatar" className="member-avatar-preview" />
                ) : (
                  <img src="/player.png" alt="Default Avatar" className="member-avatar-preview" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            <div className="add-member-form-content">
              <div className="member-form-fields">
                {tournament?.sport === 'Bóng đá' && (
                  <div className="member-form-group">
                    <label className="member-form-label">
                      Số áo <span className="required-asterisk">*</span>
                    </label>
                    <input
                      type="text"
                      className="member-form-input"
                      value={newMember.jerseyNumber}
                      onChange={(e) => handleMemberInputChange('jerseyNumber', e.target.value)}
                      placeholder="Số áo"
                    />
                  </div>
                )}

                <div className="member-form-group">
                  <label className="member-form-label">
                    Vị Trí Thi Đấu
                  </label>
                  <div className="member-form-select-wrapper">
                    <select
                      className="member-form-select"
                      value={newMember.position}
                      onChange={(e) => handleMemberInputChange('position', e.target.value)}
                    >
                      <option value="">Chọn vị trí</option>
                      {positions.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="select-chevron" />
                  </div>
                </div>

                <div className="member-form-group">
                  <label className="member-form-label">
                    Họ tên đầy đủ
                  </label>
                  <input
                    type="text"
                    className="member-form-input"
                    value={newMember.name}
                    onChange={(e) => handleMemberInputChange('name', e.target.value)}
                    placeholder="Họ tên đầy đủ"
                  />
                </div>

                <div className="member-form-group">
                  <label className="member-form-label">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    className="member-form-input"
                    value={newMember.phone}
                    onChange={(e) => handleMemberInputChange('phone', e.target.value)}
                    placeholder="Số điện thoại"
                  />
                </div>
              </div>
            </div>

            <div className="member-form-actions-inline">
              <button className="btn-cancel-member" onClick={handleCloseForm} disabled={savingMember}>
                <X size={16} />
              </button>
              <button className="btn-save-member" onClick={handleSaveMember} disabled={savingMember}>
                <Save size={16} />
              </button>
            </div>
          </div>
        )}

        {!showAddMemberForm && (!team.members || team.members.length === 0) && (
          <div className="members-empty-state">
            <Users size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
            <p>Chưa có thành viên nào</p>
          </div>
        )}
      </div>
    </div>
  )
}

const TeamMembersPage = () => {
  const { id, teamId } = useParams()
  const navigate = useNavigate()
  const { tournament, loading } = useTournament()

  let team = tournament?.teams?.find(t => {
    const tId = t.id || t._id
    const searchId = parseInt(teamId)
    return tId === searchId || tId === teamId || String(tId) === String(teamId) || String(tId) === String(searchId)
  })

  if (!team && teamId) {
    const teamIdNum = parseInt(teamId)
    team = {
      id: teamIdNum,
      teamNumber: `Đội #${teamIdNum}`,
      contactPhone: '',
      contactName: '',
      logo: null,
      wins: 0,
      draws: 0,
      losses: 0,
      members: []
    }
  }

  if (loading) {
    return (
      <>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e5e7eb',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <p>Đang tải thông tin giải đấu...</p>
          </div>
        </div>
      </>
    )
  }

  if (!tournament) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
        Không tìm thấy giải đấu
      </div>
    )
  }

  if (!team) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
        Không tìm thấy đội
      </div>
    )
  }

  const handleBack = () => {
    navigate(`/tournament/${id}/teams`)
  }

  return (
    <div className="team-edit-section">
      <div className="custom-layout">
        <div className="custom-sidebar">
          <button 
            className="sidebar-back-btn"
            onClick={handleBack}
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
          <div className="sidebar-menu">
            <NavLink
              to={`/tournament/${id}/teams/${teamId}/info`}
              className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
            >
              Thông tin đội
            </NavLink>
            <NavLink
              to={`/tournament/${id}/teams/${teamId}/members`}
              className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
            >
              Thành viên
            </NavLink>
          </div>
        </div>

        <div className="custom-content-wrapper">
          <div className="section-card">
            <div className="custom-tab-content">
              <div style={{ marginBottom: '24px' }}>
                <h2>Chỉnh sửa đội</h2>
                <p style={{ color: '#6b7280', marginTop: '4px' }}>
                  {team.teamNumber || `Đội #${team.id}`}
                </p>
              </div>

              <TeamMembersTab team={team} tournament={tournament} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamMembersPage


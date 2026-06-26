import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, NavLink } from 'react-router-dom'
import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { useTournament } from '../TournamentContext'
import { leagueApi } from '../../../../api/leagueApi'

const TeamInfoTab = ({ team, tournament }) => {
  const { id } = useParams()
  const { refreshTournament } = useTournament()
  const [teamData, setTeamData] = useState({
    teamNumber: team?.teamNumber ?? '',
    contactPhone: team?.contactPhone || '',
    contactName: team?.contactName || '',
    logo: team?.logo || null
  })
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Update state when team changes (only if not currently editing)
  useEffect(() => {
    if (team && !isEditing) {
      setTeamData({
        teamNumber: team.teamNumber ?? '',
        contactPhone: team.contactPhone || '',
        contactName: team.contactName || '',
        logo: team.logo || null
      })
    }
  }, [team?.logo, team?.teamNumber, team?.contactPhone, team?.contactName, isEditing])

  const handleInputChange = (field, value) => {
    setIsEditing(true)
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
      setIsEditing(true)
      const teamId = team.id || team._id
      const result = await leagueApi.uploadTeamLogo(id, teamId, file)
      
      if (result.success && result.data?.logo) {
        setTeamData(prev => ({ ...prev, logo: result.data.logo }))
        toast.success('Đã upload logo thành công')
        refreshTournament()
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error(error.message || 'Không thể upload logo')
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeleteLogo = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa logo?')) {
      return
    }

    try {
      setIsEditing(true)
      const teamId = team.id || team._id
      await leagueApi.deleteTeamLogo(id, teamId)
      setTeamData(prev => ({ ...prev, logo: null }))
      toast.success('Đã xóa logo thành công')
      refreshTournament()
    } catch (error) {
      console.error('Error deleting logo:', error)
      toast.error(error.message || 'Không thể xóa logo')
    } finally {
      setIsEditing(false)
    }
  }

  const handleSave = async () => {
    if (!team || !tournament) return

    try {
      setSaving(true)
      
      const teamId = team.id || team._id
      const updatedTeams = tournament.teams.map(t => {
        const tId = t.id || t._id
        if (String(tId) === String(teamId) || tId === teamId) {
          return {
            ...t,
            teamNumber: teamData.teamNumber.trim(),
            contactPhone: teamData.contactPhone.trim(),
            contactName: teamData.contactName.trim()
            // Logo đã được upload/xóa riêng qua API, không cần update ở đây
          }
        }
        return t
      })

      await leagueApi.updateLeague(id, {
        teams: updatedTeams
      })
      
      setIsEditing(false)
      toast.success('Đã lưu thông tin đội')
      refreshTournament()
    } catch (error) {
      console.error('Error saving team:', error)
      toast.error(error.message || 'Không thể lưu thông tin đội')
    } finally {
      setSaving(false)
    }
  }

  if (!team) return null

  return (
    <div className="team-info-edit">
      <div className="team-logo-upload-section">
        <label>Logo đội</label>
        <div className="team-logo-preview-large" style={{ position: 'relative' }}>
          <img 
            src={teamData.logo || '/team.png'} 
            alt="Team Logo" 
            className="team-logo-preview-img-large"
          />
          {teamData.logo && (
            <button
              className="btn-delete-logo"
              onClick={handleDeleteLogo}
              type="button"
              title="Xóa logo"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <label className="btn-upload-logo">
          <Upload size={16} />
          {teamData.logo ? 'Thay đổi logo' : 'Tải lên logo'}
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleLogoChange}
          />
        </label>
      </div>

      <div className="team-info-form">
        <div className="form-group">
          <label>
            Số đội <span className="required-asterisk">*</span>
          </label>
          <input
            type="text"
            className="form-input"
            value={teamData.teamNumber}
            onChange={(e) => handleInputChange('teamNumber', e.target.value)}
            placeholder="#1"
          />
        </div>

        <div className="form-group">
          <label>
            Số điện thoại liên hệ <span className="required-asterisk">*</span>
          </label>
          <input
            type="tel"
            className="form-input"
            value={teamData.contactPhone}
            onChange={(e) => handleInputChange('contactPhone', e.target.value)}
            placeholder="0123456789"
          />
        </div>

        <div className="form-group">
          <label>
            Tên người liên hệ <span className="required-asterisk">*</span>
          </label>
          <input
            type="text"
            className="form-input"
            value={teamData.contactName}
            onChange={(e) => handleInputChange('contactName', e.target.value)}
            placeholder="Nguyễn Văn A"
          />
        </div>

        <div className="form-actions">
          <button 
            className="btn-save" 
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </div>
      </div>
    </div>
  )
}

const TeamInfoPage = () => {
  const { id, teamId } = useParams()
  const navigate = useNavigate()
  const { tournament, loading } = useTournament()

  // Tìm team với nhiều cách so sánh để đảm bảo tìm được
  let team = tournament?.teams?.find(t => {
    const tId = t.id || t._id
    const searchId = parseInt(teamId)
    return tId === searchId || tId === teamId || String(tId) === String(teamId) || String(tId) === String(searchId)
  })

  // Nếu không tìm thấy team trong tournament.teams, tạo team mặc định từ teamId
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
        {/* Sidebar */}
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

        {/* Content */}
        <div className="custom-content-wrapper">
          <div className="section-card">
            <div className="custom-tab-content">
              {/* Header */}
              <div style={{ marginBottom: '24px' }}>
                <h2>Chỉnh sửa đội</h2>
                <p style={{ color: '#6b7280', marginTop: '4px' }}>
                  {team.teamNumber || `Đội #${team.id}`}
                </p>
              </div>

              {/* Tab Content */}
              <TeamInfoTab team={team} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamInfoPage



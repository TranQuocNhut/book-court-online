import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, Trash2, List, FileUp, Plus, Link as LinkIcon, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { leagueApi } from '../../../../../api/leagueApi'
import { useTournament } from '../../TournamentContext'

const TeamsManagementTab = ({ tournament }) => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { refreshTournament } = useTournament()
  const [teamsList, setTeamsList] = useState([])
  const [savingTeams, setSavingTeams] = useState(false)
  const [deletingTeamId, setDeletingTeamId] = useState(null)
  const [showSheetsModal, setShowSheetsModal] = useState(false)
  const [sheetsUrl, setSheetsUrl] = useState('')
  const [loadingSheets, setLoadingSheets] = useState(false)

  useEffect(() => {
    // Lấy số lượng đội từ maxParticipants (mặc định 4 nếu không có)
    const numTeams = tournament?.maxParticipants || 4
    
    // Tạo mảng đội mặc định với số lượng đúng
    const defaultTeams = Array.from({ length: numTeams }, (_, index) => ({
      id: index + 1,
      teamNumber: `#${index + 1}`,
      contactPhone: '',
      contactName: '',
      logo: null
    }))

    // Merge với dữ liệu từ API nếu có
    if (tournament?.teams && tournament.teams.length > 0) {
      tournament.teams.forEach((team, index) => {
        if (defaultTeams[index]) {
          defaultTeams[index] = {
            ...defaultTeams[index],
            ...team,
            id: team.id || team._id || index + 1,
            _id: team._id || team.id,
            teamNumber: team.teamNumber || `#${index + 1}`
          }
        }
      })
    }
    
    setTeamsList(defaultTeams)
  }, [tournament])

  const handleTeamInputChange = (teamId, field, value) => {
    setTeamsList(prev => prev.map(team => 
      team.id === teamId ? { ...team, [field]: value } : team
    ))
  }

  const handleLogoChange = (teamId, e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setTeamsList(prev => prev.map(team => 
          team.id === teamId ? { ...team, logo: reader.result } : team
        ))
        toast.success('Đã thay đổi logo đội')
      }
      reader.onerror = () => {
        toast.error('Không thể đọc file ảnh')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleReorderTeam = (teamId, e) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (id && teamId) {
      navigate(`/tournament/${id}/teams/${teamId}/info`)
    }
  }

  const handleDeleteTeam = async (teamId) => {
    const minTeams = 4
    
    if (teamsList.length <= minTeams) {
      toast.error(`Phải có ít nhất ${minTeams} đội`)
      return
    }

    try {
      setDeletingTeamId(teamId)
      await leagueApi.deleteTeam(id, teamId)
      toast.success('Xóa đội thành công')
      refreshTournament()
    } catch (error) {
      console.error('Error deleting team:', error)
      toast.error(error.message || 'Không thể xóa đội')
    } finally {
      setDeletingTeamId(null)
    }
  }

  const handleDownloadSample = async () => {
    try {
      await leagueApi.downloadTeamTemplate(id)
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
        setSavingTeams(true)
        await leagueApi.importTeams(id, file)
        toast.success('Đã import danh sách đội thành công')
        refreshTournament()
      } catch (error) {
        console.error('Error importing teams:', error)
        toast.error(error.message || 'Không thể import danh sách đội')
      } finally {
        setSavingTeams(false)
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
      await leagueApi.importTeamsFromSheets(id, sheetsUrl.trim())
      toast.success('Đã import danh sách đội từ Google Sheets thành công')
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

  const handleAddTeam = async () => {
    try {
      const newTeamId = teamsList.length > 0 
        ? Math.max(...teamsList.map(t => t.id || 0)) + 1 
        : 1
      
      const newTeam = {
        id: newTeamId,
        teamNumber: `#${newTeamId}`,
        contactPhone: '',
        contactName: '',
        logo: null
      }
      
      const newMaxParticipants = teamsList.length + 1
      
      setTeamsList(prev => [...prev, newTeam])
      
      await leagueApi.updateLeague(id, {
        maxParticipants: newMaxParticipants
      })
      
      toast.success('Đã thêm đội mới')
      refreshTournament()
    } catch (error) {
      console.error('Error adding team:', error)
      toast.error(error.message || 'Không thể thêm đội')
      setTeamsList(prev => prev.slice(0, -1))
    }
  }

  const handleSaveTeams = async () => {
    try {
      setSavingTeams(true)
      
      const teamsToSave = teamsList.map((team, index) => ({
        id: team.id || index + 1,
        teamNumber: team.teamNumber || `#${index + 1}`,
        contactPhone: team.contactPhone || '',
        contactName: team.contactName || '',
        logo: team.logo || null,
        wins: team.wins || 0,
        draws: team.draws || 0,
        losses: team.losses || 0,
        members: team.members || []
      }))
      
      await leagueApi.updateLeague(id, {
        maxParticipants: teamsList.length,
        teams: teamsToSave
      })
      
      toast.success('Đã lưu thông tin đội thành công')
      refreshTournament()
    } catch (error) {
      console.error('Error saving teams:', error)
      toast.error(error.message || 'Không thể lưu thông tin đội')
    } finally {
      setSavingTeams(false)
    }
  }

  if (!tournament) return null

  return (
    <div className="custom-tab-content">
      <h2>Quản lý đội</h2>
      
      <div className="teams-management-header">
        <div className="teams-import-actions">
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

      <div className="teams-management-list">
        {teamsList.map((team, index) => (
          <div key={team.id} className="team-management-item">
            <div className="team-logo-container">
              <label className="team-logo-upload-label" title="Click để thay đổi logo">
                <img 
                  src={team.logo || '/team.png'} 
                  alt="Team" 
                  className="team-logo-shield"
                />
                <div className="team-index-badge">
                  {index + 1}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleLogoChange(team.id, e)}
                />
              </label>
            </div>
            
            <div className="team-actions">
              <button
                className="team-action-btn team-action-reorder"
                title="Sắp xếp"
                onClick={(e) => handleReorderTeam(team.id, e)}
                type="button"
              >
                <List size={18} />
              </button>
              <button
                className="team-action-btn team-action-delete"
                onClick={() => {
                  const teamIdToDelete = team._id || team.id
                  handleDeleteTeam(teamIdToDelete)
                }}
                title="Xóa"
                disabled={deletingTeamId === (team._id || team.id)}
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="team-input-fields">
              <input
                type="text"
                className="team-input team-number-input"
                value={team.teamNumber}
                onChange={(e) => handleTeamInputChange(team.id, 'teamNumber', e.target.value)}
                placeholder="#1"
              />
              <input
                type="tel"
                className="team-input team-phone-input"
                value={team.contactPhone}
                onChange={(e) => handleTeamInputChange(team.id, 'contactPhone', e.target.value)}
                placeholder="SĐT liên hệ"
              />
              <input
                type="text"
                className="team-input team-name-input"
                value={team.contactName}
                onChange={(e) => handleTeamInputChange(team.id, 'contactName', e.target.value)}
                placeholder="Tên người liên hệ"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="teams-management-footer">
        <button
          className="btn-add-team"
          onClick={handleAddTeam}
          type="button"
        >
          <Plus size={16} />
          Thêm đội
        </button>
      </div>

      <div className="teams-save-section">
        <button
          className="btn-save-teams"
          onClick={handleSaveTeams}
          disabled={savingTeams}
        >
          <Save size={16} />
          {savingTeams ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </div>
  )
}

export default TeamsManagementTab


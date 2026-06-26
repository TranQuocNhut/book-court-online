import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Pencil, Download } from 'lucide-react'

const TeamsTab = ({ tournament }) => {
  const navigate = useNavigate()
  const { id } = useParams()

  if (!tournament) return null

  const handleEditTeam = (teamId, e) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (id && teamId) {
      navigate(`/tournament/${id}/teams/${teamId}/info`)
    } else {
      console.error('Missing id or teamId:', { id, teamId })
    }
  }

  // Tạo mảng đội mặc định dựa trên maxParticipants, merge với dữ liệu từ API
  const getDisplayTeams = () => {
    // Lấy số lượng đội từ maxParticipants (mặc định 4 nếu không có)
    const numTeams = tournament?.maxParticipants || 4
    
    // Tạo mảng đội mặc định với số lượng đúng
    const defaultTeams = Array.from({ length: numTeams }, (_, index) => ({
      id: index + 1,
      teamNumber: `Đội #${index + 1}`,
      logo: null,
      wins: 0,
      draws: 0,
      losses: 0,
      members: []
    }))

    // Merge với dữ liệu từ API nếu có
    if (tournament.teams && tournament.teams.length > 0) {
      tournament.teams.forEach((team, index) => {
        if (defaultTeams[index]) {
          defaultTeams[index] = {
            ...defaultTeams[index],
            ...team,
            id: team.id || index + 1,
            teamNumber: team.teamNumber || `Đội #${index + 1}`,
            logo: team.logo || null,
            wins: team.wins || 0,
            draws: team.draws || 0,
            losses: team.losses || 0,
            members: team.members || []
          }
        }
      })
    }

    return defaultTeams
  }

  const displayTeams = getDisplayTeams()
  const actualTeamsCount = tournament.teams?.filter(team => team.teamNumber || team.contactPhone || team.contactName).length || 0

  return (
    <div className="teams-section">
      <div className="section-card">
        {/* Header */}
        <div className="teams-tab-header">
          <p className="teams-summary">
            Có {actualTeamsCount} đội và 0 người chơi tham gia giải
          </p>
          <button className="btn-download-list">
            <Download size={16} />
            Danh sách
          </button>
        </div>

        {/* Teams Grid */}
        <div className="teams-grid-new">
          {displayTeams.map((team) => {
            const matchesPlayed = (team.wins || 0) + (team.draws || 0) + (team.losses || 0)
            return (
              <div key={team.id} className="team-card-new">
                {/* Edit Icon */}
                <button 
                  className="team-edit-btn"
                  onClick={(e) => handleEditTeam(team.id, e)}
                  type="button"
                >
                  <Pencil size={14} />
                </button>
                
                {/* Team Badge */}
                <div className="team-badge-container">
                  <img 
                    src={team.logo || '/team.png'} 
                    alt="Team" 
                    className="team-badge-shield"
                  />
                </div>
                
                {/* Team Name */}
                <div className="team-name-new">
                  {team.teamNumber || `Đội #${team.id}`}
                </div>
                
                {/* Divider */}
                <div className="team-divider"></div>
                
                {/* Match Statistics */}
                <div className="team-match-stats">
                  <p className="matches-played">{matchesPlayed} Trận đã chơi</p>
                  <div className="match-outcomes">
                    <span className="outcome-badge outcome-win">
                      {team.wins || 0} thắng
                    </span>
                    <span className="outcome-badge outcome-draw">
                      {team.draws || 0} hòa
                    </span>
                    <span className="outcome-badge outcome-loss">
                      {team.losses || 0} thua
                    </span>
                  </div>
                </div>
                
                {/* Divider */}
                <div className="team-divider"></div>
                
                {/* Members Section */}
                <div className="team-members">
                  <h4 className="members-heading">Thành viên</h4>
                  <p className="members-empty">Chưa có thành viên</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default TeamsTab


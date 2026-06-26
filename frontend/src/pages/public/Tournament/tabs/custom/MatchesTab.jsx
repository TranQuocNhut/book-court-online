import React, { useState, useEffect, useMemo } from 'react'
import { Save } from 'lucide-react'
import { toast } from 'react-toastify'
import { useParams } from 'react-router-dom'
import { leagueApi } from '../../../../../api/leagueApi'
import { useTournament } from '../../TournamentContext'

const MatchesTab = ({ tournament }) => {
  const { id } = useParams()
  const { refreshTournament } = useTournament()
  const [matches, setMatches] = useState([])
  const [savingMatches, setSavingMatches] = useState(false)
  const [drawingMatches, setDrawingMatches] = useState(false)
  const [selectedStage, setSelectedStage] = useState(null) // Stage đang được chỉnh sửa
  
  // Kiểm tra format giải đấu
  const isRoundRobin = tournament?.format === 'Vòng tròn' || tournament?.format === 'round-robin'

  // Helper: Lấy tên stage để hiển thị
  const getStageTitle = (stage) => {
    const stageMap = {
      'final': 'Chung Kết',
      'semi': 'Bán Kết',
      'round3': 'Tứ Kết',
      'round4': 'Vòng 4',
      'round2': 'Vòng 2',
      'round1': 'Vòng 1',
      'round-robin': 'Vòng tròn'
    }
    // Xử lý round-robin-round1, round-robin-round2, ...
    if (stage && stage.startsWith('round-robin-round')) {
      const roundMatch = stage.match(/round-robin-round(\d+)/)
      if (roundMatch) {
        return `Lượt ${roundMatch[1]}`
      }
    }
    return stageMap[stage] || stage
  }

  // Helper: Tìm team từ tournament.teams dựa trên teamId
  const findTeamById = (teamId) => {
    if (!teamId || teamId === "BYE") return null
    return tournament.teams?.find(t => 
      (t.id === teamId) || 
      (t._id?.toString() === teamId?.toString())
    ) || null
  }

  // Lấy danh sách teams từ API (không tạo defaultTeams)
  const teamsList = useMemo(() => {
    return tournament?.teams || []
  }, [tournament?.teams])

  // Lấy danh sách các stage có matches từ API
  const availableStages = useMemo(() => {
    if (!tournament?.matches || tournament.matches.length === 0) {
      return []
    }

    const stages = [...new Set(tournament.matches.map(m => m.stage).filter(Boolean))]
    
    // Sắp xếp theo thứ tự: round1, round2, round3, round4, semi, final, round-robin, round-robin-round1, ...
    const stageOrder = ['round1', 'round2', 'round3', 'round4', 'semi', 'final', 'round-robin', 'round-robin-round1', 'round-robin-round2', 'round-robin-round3', 'round-robin-round4']
    return stages.sort((a, b) => {
      const indexA = stageOrder.indexOf(a)
      const indexB = stageOrder.indexOf(b)
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
    })
  }, [tournament?.matches])

  // Tự động chọn stage đầu tiên khi có matches
  useEffect(() => {
    if (availableStages.length > 0 && !selectedStage) {
      setSelectedStage(availableStages[0])
    }
  }, [availableStages, selectedStage])

  // Load matches từ API dựa trên selectedStage
  useEffect(() => {
    if (!selectedStage || !tournament?.matches) {
      setMatches([])
      return
    }

    const stageMatches = tournament.matches
      .filter(match => match.stage === selectedStage)
      .sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0))

    const loadedMatches = stageMatches
      // Lọc bỏ các match có BYE (ẩn trận bye)
      .filter(match => {
        const hasBye = match.team1Id === "BYE" || match.team2Id === "BYE"
        return !hasBye
      })
      .map(match => ({
        id: match.matchNumber || match.id,
        team1: match.team1Id || null,
        team2: match.team2Id || null,
        stage: match.stage,
        date: match.date,
        time: match.time,
        score1: match.score1,
        score2: match.score2,
        hasBye: match.hasBye || false,
        _match: match // Lưu match gốc để dùng khi cần
      }))

    setMatches(loadedMatches)
  }, [selectedStage, tournament?.matches])

  // Bốc thăm ngẫu nhiên
  const handleRandomDraw = async () => {
    const numTeams = teamsList.length
    if (numTeams < 2) {
      toast.error('Cần ít nhất 2 đội để bốc thăm')
      return
    }

    try {
      setDrawingMatches(true)
      
      // Xác định stage để bốc thăm
      // Nếu đã có matches, dùng stage đầu tiên
      // Nếu chưa có, dùng 'round-robin' cho round-robin, 'round1' cho single-elimination
      let targetStage = selectedStage
      if (!targetStage) {
        targetStage = isRoundRobin ? 'round-robin' : 'round1'
      }
      
      // Gọi API để bốc thăm
      const result = await leagueApi.drawMatches(id, {
        stage: targetStage,
        clearExisting: true
      })
      
      if (result.success) {
        toast.success(result.message || 'Đã bốc thăm ngẫu nhiên thành công')
        refreshTournament()
        // Tự động chọn stage vừa bốc thăm
        if (targetStage) {
          setSelectedStage(targetStage)
        }
      }
    } catch (error) {
      console.error('Error drawing matches:', error)
      toast.error(error.message || 'Không thể bốc thăm ngẫu nhiên')
    } finally {
      setDrawingMatches(false)
    }
  }

  // Thay đổi đội trong match
  const handleMatchChange = (matchId, field, teamId) => {
    setMatches(prev => prev.map(match => 
      match.id === matchId ? { ...match, [field]: teamId || null } : match
    ))
  }

  // Lưu matches
  const handleSaveMatches = async () => {
    if (!selectedStage) {
      toast.error('Vui lòng chọn vòng đấu')
      return
    }

    try {
      setSavingMatches(true)
      
      // Lấy matches hiện có từ tournament (để giữ lại các stage khác)
      const existingMatches = tournament?.matches || []
      const otherStageMatches = existingMatches.filter(m => m.stage !== selectedStage)
      
      // Chuyển đổi matches hiện tại sang format backend
      const matchesToSave = matches.map(match => {
        // Giữ lại các trường khác từ match gốc nếu có
        const originalMatch = match._match || {}
        
        return {
          stage: selectedStage,
          matchNumber: match.id,
          team1Id: match.team1 || null,
          team2Id: match.team2 || null,
          date: match.date || originalMatch.date || null,
          time: match.time || originalMatch.time || null,
          score1: match.score1 !== undefined ? match.score1 : (originalMatch.score1 || null),
          score2: match.score2 !== undefined ? match.score2 : (originalMatch.score2 || null),
          nextMatchId: originalMatch.nextMatchId || null,
          hasBye: originalMatch.hasBye || false
        }
      })
      
      // Merge với các matches của stage khác
      const allMatches = [...otherStageMatches, ...matchesToSave]
      
      // Gọi API để lưu matches
      await leagueApi.updateLeague(id, {
        matches: allMatches
      })
      
      toast.success('Đã lưu cặp đấu thành công')
      refreshTournament()
    } catch (error) {
      console.error('Error saving matches:', error)
      toast.error(error.message || 'Không thể lưu cặp đấu')
    } finally {
      setSavingMatches(false)
    }
  }

  if (!tournament) return null

  // Nếu chưa có matches, hiển thị thông báo
  if (availableStages.length === 0) {
    return (
      <div className="custom-tab-content">
        <h2>Sắp xếp cặp đấu</h2>
        
        <p className="matches-description">
          Chưa có lịch đấu. Vui lòng bốc thăm để tạo lịch đấu.
        </p>

        <div className="matches-actions">
          <button
            className="btn-random-draw"
            onClick={handleRandomDraw}
            disabled={drawingMatches}
          >
            {drawingMatches ? 'Đang bốc thăm...' : 'Bốc thăm ngẫu nhiên'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="custom-tab-content">
      <h2>Sắp xếp cặp đấu</h2>
      
      <p className="matches-description">
        Bạn có thể thay đổi cấu hình cho từng trận đấu.
      </p>

      <div className="matches-actions">
        <button
          className="btn-random-draw"
          onClick={handleRandomDraw}
          disabled={drawingMatches}
        >
          {drawingMatches ? 'Đang bốc thăm...' : 'Bốc thăm ngẫu nhiên'}
        </button>
      </div>

      {/* Stage Selector (nếu có nhiều stage) */}
      {availableStages.length > 1 && (
        <div className="matches-stage-selector" style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          {availableStages.map(stage => (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '2px solid',
                borderColor: selectedStage === stage ? '#10b981' : '#e5e7eb',
                backgroundColor: selectedStage === stage ? '#10b981' : 'white',
                color: selectedStage === stage ? 'white' : '#374151',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {getStageTitle(stage)}
            </button>
          ))}
        </div>
      )}

      <div className="matches-section">
        <div className="matches-stage-box" style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '2px solid #e5e7eb'
          }}>
            {selectedStage ? getStageTitle(selectedStage) : 'Chọn vòng đấu'} ({matches.length} trận)
          </h3>
          
          {matches.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              Chưa có trận đấu nào cho vòng này. Vui lòng bốc thăm.
            </div>
          ) : (
            <div className="matches-list">
              {matches.map((match) => {
                return (
                  <div 
                    key={match.id} 
                    className="match-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      backgroundColor: match.hasBye ? '#fef3c7' : 'white',
                      border: match.hasBye ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      marginBottom: '8px'
                    }}
                  >
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      minWidth: '32px'
                    }}>
                      #{match.id}
                    </span>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flex: 1
                    }}>
                      <select
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          backgroundColor: 'white',
                          cursor: 'pointer'
                        }}
                        value={match.team1 === "BYE" ? "BYE" : (match.team1 || '')}
                        onChange={(e) => {
                          const value = e.target.value
                          handleMatchChange(match.id, 'team1', value === "BYE" ? "BYE" : (value ? parseInt(value) : null))
                        }}
                      >
                        <option value="">Chọn đội</option>
                        <option value="BYE">BYE</option>
                        {teamsList.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.teamNumber || `Đội #${team.id}`}
                          </option>
                        ))}
                      </select>
                      
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#6b7280',
                        minWidth: '20px',
                        textAlign: 'center'
                      }}>
                        -
                      </span>
                      
                      <select
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          backgroundColor: 'white',
                          cursor: 'pointer'
                        }}
                        value={match.team2 === "BYE" ? "BYE" : (match.team2 || '')}
                        onChange={(e) => {
                          const value = e.target.value
                          handleMatchChange(match.id, 'team2', value === "BYE" ? "BYE" : (value ? parseInt(value) : null))
                        }}
                      >
                        <option value="">Chọn đội</option>
                        <option value="BYE">BYE</option>
                        {teamsList.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.teamNumber || `Đội #${team.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="matches-save-section">
        <button
          className="btn-save-matches"
          onClick={handleSaveMatches}
          disabled={savingMatches || !selectedStage}
        >
          <Save size={16} />
          {savingMatches ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </div>
  )
}

export default MatchesTab

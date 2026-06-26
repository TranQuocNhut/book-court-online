import React, { useState, useEffect, useMemo } from 'react'
import { Save, X, Trophy, AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import { useParams } from 'react-router-dom'
import { leagueApi } from '../../../../api/leagueApi'
import { useTournament } from '../TournamentContext'

const MatchResultsTab = ({ tournament }) => {
  const { id } = useParams()
  const { refreshTournament } = useTournament()
  const [selectedStage, setSelectedStage] = useState(null)
  const [matches, setMatches] = useState([])
  const [savingResults, setSavingResults] = useState(false)

  // Helper: Get stage title
  const getStageTitle = (stage) => {
    const stageMap = {
      'final': 'Chung Kết',
      'semi': 'Bán Kết',
      'round3': 'Tứ Kết',
      'round4': 'Vòng 4',
      'round2': 'Vòng 2',
      'round1': 'Vòng 1',
      'round-robin': 'Vòng bảng'
    }
    return stageMap[stage] || stage
  }

  // Helper: Find team
  const findTeamById = (teamId) => {
    if (!teamId || teamId === "BYE") return null
    return tournament.teams?.find(t =>
      (t.id === teamId) ||
      (t._id?.toString() === teamId?.toString())
    ) || null
  }

  // Get available stages
  const availableStages = useMemo(() => {
    if (!tournament?.matches || tournament.matches.length === 0) {
      return []
    }

    const stages = [...new Set(tournament.matches.map(m => m.stage).filter(Boolean))]

    // Sort logic
    const stageOrder = ['round1', 'round2', 'round3', 'round4', 'semi', 'final', 'round-robin']
    return stages.sort((a, b) => {
      const indexA = stageOrder.indexOf(a)
      const indexB = stageOrder.indexOf(b)
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
    })
  }, [tournament?.matches])

  // Auto-select first stage
  useEffect(() => {
    if (availableStages.length > 0 && !selectedStage) {
      setSelectedStage(availableStages[0])
    }
  }, [availableStages, selectedStage])

  // Load matches
  useEffect(() => {
    if (!selectedStage || !tournament?.matches) {
      setMatches([])
      return
    }

    const stageMatches = tournament.matches
      .filter(match => match.stage === selectedStage)
      .filter(match => {
        const hasBye = match.team1Id === "BYE" || match.team2Id === "BYE"
        return !hasBye
      })
      .sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0))

    const loadedMatches = stageMatches.map(match => ({
      id: match.matchNumber || match.id,
      team1Id: match.team1Id || null,
      team2Id: match.team2Id || null,
      score1: match.score1 ?? null,
      score2: match.score2 ?? null,
      penaltyScore1: match.penaltyScore1 ?? null,
      penaltyScore2: match.penaltyScore2 ?? null,
      stage: match.stage,
      date: match.date,
      time: match.time,
      _match: match
    }))

    setMatches(loadedMatches)
  }, [selectedStage, tournament?.matches])

  // Score change handler
  const handleScoreChange = (matchId, field, value) => {
    const numValue = value === '' ? null : parseInt(value)
    if (numValue !== null && (isNaN(numValue) || numValue < 0)) {
      return
    }

    setMatches(prev => prev.map(match =>
      match.id === matchId ? { ...match, [field]: numValue } : match
    ))
  }

  // Save result
  const handleSaveMatchResult = async (match) => {
    if (match.score1 === null || match.score2 === null) {
      toast.error('Vui lòng nhập đầy đủ điểm số cho cả hai đội')
      return
    }

    // Kiểm tra nếu hòa và là single-elimination thì yêu cầu nhập đá luân lưu
    const isRoundRobin = tournament.format === 'Vòng tròn' || tournament.format === 'round-robin'
    const isDraw = match.score1 === match.score2
    
    if (!isRoundRobin && isDraw) {
      if (match.penaltyScore1 === null || match.penaltyScore2 === null) {
        toast.error('Trận đấu hòa! Vui lòng nhập kết quả đá luân lưu để xác định đội thắng')
        return
      }
      if (match.penaltyScore1 === match.penaltyScore2) {
        toast.error('Kết quả đá luân lưu không được hòa. Vui lòng nhập lại')
        return
      }
    }

    try {
      setSavingResults(true)

      const result = await leagueApi.updateMatchResult(
        id,
        match.stage,
        match.id,
        match.score1,
        match.score2,
        match.penaltyScore1,
        match.penaltyScore2
      )

      if (result.success) {
        toast.success('Đã cập nhật kết quả trận đấu thành công')
        refreshTournament()
      }
    } catch (error) {
      console.error('Error saving match result:', error)
      toast.error(error.message || 'Không thể cập nhật kết quả trận đấu')
    } finally {
      setSavingResults(false)
    }
  }

  // Clear result
  const handleClearMatchResult = async (match) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy kết quả trận đấu này? Đội thắng sẽ bị xóa khỏi vòng tiếp theo.')) {
      return
    }

    try {
      setSavingResults(true)

      const result = await leagueApi.updateMatchResult(
        id,
        match.stage,
        match.id,
        null,
        null
      )

      if (result.success) {
        toast.success('Đã hủy kết quả trận đấu')
        refreshTournament()
      }
    } catch (error) {
      console.error('Error clearing match result:', error)
      toast.error(error.message || 'Không thể hủy kết quả trận đấu')
    } finally {
      setSavingResults(false)
    }
  }

  if (!tournament) return null

  // Empty state if no matches
  if (availableStages.length === 0) {
    return (
      <div className="custom-tab-content">
        <h2>Thi đấu</h2>
        <div className="match-results-empty">
          <Trophy className="empty-icon" />
          <p>Chưa có lịch đấu. Vui lòng bốc thăm để tạo lịch đấu.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="custom-tab-content">
      <h2>Thi đấu</h2>

      <div className="match-results-container">
        {/* Stage Selector */}
        {availableStages.length > 1 && (
          <div className="stage-selector">
            {availableStages.map(stage => (
              <button
                key={stage}
                onClick={() => setSelectedStage(stage)}
                className={`stage-btn ${selectedStage === stage ? 'active' : ''}`}
              >
                {getStageTitle(stage)}
              </button>
            ))}
          </div>
        )}

        {/* Results Box */}
        <div className="match-results-box">
          <div className="match-results-header">
            <h3 className="match-results-title">
              {selectedStage ? getStageTitle(selectedStage) : 'Chọn vòng đấu'}
              <span style={{ fontWeight: 400, color: '#64748b', fontSize: '14px', marginLeft: '8px' }}>
                ({matches.length} trận)
              </span>
            </h3>
          </div>

          {matches.length === 0 ? (
            <div className="match-results-empty">
              <AlertCircle className="empty-icon" />
              <p>Chưa có trận đấu nào cho vòng này.</p>
            </div>
          ) : (
            <div className="match-list">
              {matches.map((match) => {
                const team1 = findTeamById(match.team1Id)
                const team2 = findTeamById(match.team2Id)
                const team1Name = team1?.teamNumber || `Đội #${match.team1Id}`
                const team2Name = team2?.teamNumber || `Đội #${match.team2Id}`
                const isCompleted = match.score1 !== null && match.score2 !== null
                const isRoundRobin = tournament.format === 'Vòng tròn' || tournament.format === 'round-robin'
                const isDraw = match.score1 !== null && match.score2 !== null && match.score1 === match.score2
                const showPenaltyInputs = !isRoundRobin && isDraw

                return (
                  <div key={match.id} className={`match-result-card ${isCompleted ? 'completed' : ''}`}>
                    {/* ID & Info */}
                    <div className="match-info-col">
                      <span className="match-number-badge">#{match.id}</span>
                      {(match.time || match.date) && (
                        <span className="match-time-badge">
                          {match.time ? match.time.substring(0, 5) : ''}
                        </span>
                      )}
                    </div>

                    {/* Teams & Scores */}
                    <div className="match-teams-col">
                      {/* Team 1 */}
                      <div className="match-team">
                        <img 
                          src={team1?.logo || '/team.png'} 
                          alt={team1Name} 
                          className="match-team-logo"
                          onError={(e) => {
                            // Fallback nếu logo không load được
                            e.target.src = '/team.png'
                          }}
                        />
                        <span className="match-team-name" title={team1Name}>{team1Name}</span>
                      </div>

                      {/* Inputs */}
                      <div className="match-score-inputs">
                        <input
                          type="number"
                          min="0"
                          value={match.score1 ?? ''}
                          onChange={(e) => handleScoreChange(match.id, 'score1', e.target.value)}
                          placeholder="-"
                          className="score-input"
                        />
                        <span className="score-separator">-</span>
                        <input
                          type="number"
                          min="0"
                          value={match.score2 ?? ''}
                          onChange={(e) => handleScoreChange(match.id, 'score2', e.target.value)}
                          placeholder="-"
                          className="score-input"
                        />
                      </div>
                      
                      {/* Penalty inputs (chỉ hiển thị khi hòa và single-elimination) */}
                      {showPenaltyInputs && (
                        <div className="match-penalty-inputs" style={{
                          marginTop: '8px',
                          padding: '8px',
                          backgroundColor: '#fef3c7',
                          borderRadius: '6px',
                          border: '1px solid #fbbf24'
                        }}>
                          <div style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#92400e',
                            marginBottom: '4px',
                            textAlign: 'center'
                          }}>
                            Đá luân lưu (khi hòa)
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}>
                            <input
                              type="number"
                              min="0"
                              value={match.penaltyScore1 ?? ''}
                              onChange={(e) => handleScoreChange(match.id, 'penaltyScore1', e.target.value)}
                              placeholder="0"
                              className="score-input"
                              style={{
                                width: '50px',
                                fontSize: '12px',
                                padding: '4px 8px'
                              }}
                            />
                            <span className="score-separator" style={{ fontSize: '12px' }}>-</span>
                            <input
                              type="number"
                              min="0"
                              value={match.penaltyScore2 ?? ''}
                              onChange={(e) => handleScoreChange(match.id, 'penaltyScore2', e.target.value)}
                              placeholder="0"
                              className="score-input"
                              style={{
                                width: '50px',
                                fontSize: '12px',
                                padding: '4px 8px'
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Team 2 */}
                      <div className="match-team team-right">
                        <img 
                          src={team2?.logo || '/team.png'} 
                          alt={team2Name} 
                          className="match-team-logo"
                          onError={(e) => {
                            // Fallback nếu logo không load được
                            e.target.src = '/team.png'
                          }}
                        />
                        <span className="match-team-name" title={team2Name}>{team2Name}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="match-actions-col">
                      <button
                        onClick={() => handleSaveMatchResult(match)}
                        disabled={savingResults || match.score1 === null || match.score2 === null || 
                                 (showPenaltyInputs && (match.penaltyScore1 === null || match.penaltyScore2 === null))}
                        className="btn-match-action btn-save-result"
                      >
                        <Save size={16} />
                        Lưu
                      </button>

                      {isCompleted && (
                        <button
                          onClick={() => handleClearMatchResult(match)}
                          disabled={savingResults}
                          className="btn-match-action btn-clear-result"
                        >
                          <X size={16} />
                          Hủy
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MatchResultsTab

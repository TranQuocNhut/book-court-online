import React, { useMemo } from 'react'

const StandingsTab = ({ tournament }) => {
  if (!tournament) return null

  // Kiểm tra format giải đấu
  const isRoundRobin = tournament.format === 'Vòng tròn' || tournament.format === 'round-robin'

  // Tính toán bảng xếp hạng cho round-robin
  const standings = useMemo(() => {
    if (!isRoundRobin) return []
    
    const numTeams = tournament?.maxParticipants || 4
    const defaultTeams = Array.from({ length: numTeams }, (_, index) => ({
      id: index + 1,
      teamNumber: `Đội #${index + 1}`,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0
    }))

    const teams = tournament.teams && tournament.teams.length > 0
      ? defaultTeams.map((defaultTeam, index) => {
          const apiTeam = tournament.teams[index]
          return apiTeam ? {
            ...defaultTeam,
            ...apiTeam,
            id: apiTeam.id || index + 1,
            teamNumber: apiTeam.teamNumber || `Đội #${index + 1}`,
            wins: apiTeam.wins || 0,
            draws: apiTeam.draws || 0,
            losses: apiTeam.losses || 0
          } : defaultTeam
        })
      : defaultTeams

    // Tính điểm: thắng = 3, hòa = 1, thua = 0
    return teams.map(team => ({
      ...team,
      points: (team.wins || 0) * 3 + (team.draws || 0) * 1,
      goalDifference: (team.goalsFor || 0) - (team.goalsAgainst || 0),
      matchesPlayed: (team.wins || 0) + (team.draws || 0) + (team.losses || 0)
    })).sort((a, b) => {
      // Sắp xếp theo điểm, hiệu số bàn thắng, số bàn thắng
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
      return (b.goalsFor || 0) - (a.goalsFor || 0)
    })
  }, [tournament, isRoundRobin])

  // Nếu không phải round-robin, hiển thị thông báo
  if (!isRoundRobin) {
    return (
      <div className="schedule-section">
        <div className="section-card">
          <h2>Bảng xếp hạng</h2>
          <p style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            Bảng xếp hạng chỉ áp dụng cho giải đấu vòng tròn
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="schedule-section">
      <div className="section-card">
        <h2>Bảng xếp hạng</h2>
        
        <div style={{ marginTop: '24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Hạng</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Đội</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Trận</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Thắng</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Hòa</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Thua</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Điểm</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team, index) => (
                  <tr key={team.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontWeight: '600' }}>{index + 1}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img 
                          src={team.logo || '/team.png'} 
                          alt="Team" 
                          style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                        <span>{team.teamNumber || `Đội #${team.id}`}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{team.matchesPlayed}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#10b981' }}>{team.wins}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#f59e0b' }}>{team.draws}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#ef4444' }}>{team.losses}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StandingsTab


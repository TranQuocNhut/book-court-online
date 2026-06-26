import React, { useMemo, useState, useEffect } from 'react'
import { Bracket } from 'react-tournament-bracket'
import { Maximize2, Minimize2 } from 'lucide-react'

const ScheduleTab = ({ tournament }) => {
  if (!tournament) return null

  // Kiểm tra format giải đấu
  const isRoundRobin = tournament.format === 'Vòng tròn' || tournament.format === 'round-robin'
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(null) // null = hiển thị tất cả
  const [hoveredTeamId, setHoveredTeamId] = useState(null) // Track team đang được hover
  const [isFullscreen, setIsFullscreen] = useState(false) // Track fullscreen mode

  // Xử lý phím ESC để đóng fullscreen
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    if (isFullscreen) {
      document.addEventListener('keydown', handleEsc)
      // Ngăn scroll body khi fullscreen
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isFullscreen])

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
    // Xử lý round-robin-v1, round-robin-v2, ... hoặc round-robin-round1-v1, ...
    if (stage && stage.includes('-v')) {
      const vMatch = stage.match(/-v(\d+)$/)
      if (vMatch) {
        const roundMatch = stage.match(/round-robin(?:-round(\d+))?-v/)
        if (roundMatch && roundMatch[1]) {
          return `Lượt ${roundMatch[1]} - Vòng ${vMatch[1]}`
        }
        return `Vòng ${vMatch[1]}`
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

  // Helper: Lấy tên team để hiển thị
  const getTeamDisplayName = (teamId, match, isTeam1 = true) => {
    // Xử lý BYE
    if (teamId === "BYE") {
      return "BYE"
    }

    // Nếu teamId là null/undefined, hiển thị W#matchNumber tên_vòng
    if (!teamId && match) {
      // Logic tìm prev match ở đây khá phức tạp nếu không có context, 
      // nhưng với Bracket mới, ta build tree nên có thể không cần hiển thị text TBD chi tiết nếu cây nối đúng
      return "TBD"
    }

    // Tìm team từ tournament.teams
    const team = findTeamById(teamId)
    if (team) {
      return team.teamNumber || `Đội #${team.id}`
    }

    // Fallback: hiển thị ID
    return `Đội #${teamId}`
  }

  // Helper: Lấy logo team
  const getTeamLogo = (teamId) => {
    if (teamId === 'BYE') return null;
    const team = findTeamById(teamId);
    return team?.logo || '/team.png';
  }

  // Helper: Lấy tên sân từ match
  const getCourtName = (match) => {
    if (!match?.courtId) return null
    // courtId có thể là object (đã populate) hoặc string (chưa populate)
    if (typeof match.courtId === 'object') {
      return match.courtId.name || null
    }
    return null
  }

  // --- LOGIC XÂY DỰNG CÂY TRẬN ĐẤU CHO REACT-TOURNAMENT-BRACKET ---
  const bracketGame = useMemo(() => {
    if (isRoundRobin || !tournament?.matches || tournament.matches.length === 0) {
      return null
    }

    // Lọc matches single-elimination
    const matches = tournament.matches.filter(
      m => m.stage && !m.stage.startsWith('round-robin')
    )

    if (matches.length === 0) {
      return null
    }

    // Tìm trận chung kết (trận cuối cùng)
    // Sắp xếp các stage theo thứ tự: round1 -> final
    const stageOrder = ['round1', 'round2', 'round3', 'round4', 'semi', 'final']

    // Tìm match thuộc stage cao nhất có trong danh sách
    let finalMatch = null;
    for (let i = stageOrder.length - 1; i >= 0; i--) {
      const stage = stageOrder[i];
      const matchesInStage = matches.filter(m => m.stage === stage);
      if (matchesInStage.length > 0) {
        // Lấy match đầu tiên của stage cao nhất (thường final chỉ có 1)
        finalMatch = matchesInStage[0];
        break;
      }
    }

    if (!finalMatch) {
      return null;
    }

    // Tạo map để tìm matches theo nextMatchId và theo stage_matchNumber
    const matchMap = new Map();
    matches.forEach(m => {
      const matchKey = m.id || `${m.stage}_${m.matchNumber}`;
      const stageMatchKey = `${m.stage}_${m.matchNumber}`;
      matchMap.set(matchKey, m);
      matchMap.set(stageMatchKey, m);
      if (m.id) {
        matchMap.set(m.id.toString(), m);
      }
      // Thêm key với format "stage_matchNumber" để dễ tìm
      matchMap.set(`${m.stage}_${m.matchNumber}`, m);
    });

    // Hàm đệ quy xây dựng node theo format của react-tournament-bracket
    const buildGame = (match) => {
      if (!match) return null;

      const team1 = findTeamById(match.team1Id);
      const team2 = findTeamById(match.team2Id);
      const team1Name = getTeamDisplayName(match.team1Id, match, true);
      const team2Name = getTeamDisplayName(match.team2Id, match, false);

      // Xác định trạng thái match
      const hasScore = match.score1 !== undefined && match.score2 !== undefined && 
                       match.score1 !== null && match.score2 !== null;
      const state = hasScore ? 'DONE' : 'NO_SHOW';
      
      // Xác định winner (bao gồm cả penalty nếu hòa)
      let winner1 = false;
      let winner2 = false;
      if (hasScore) {
        if (match.score1 > match.score2) {
          winner1 = true;
        } else if (match.score2 > match.score1) {
          winner2 = true;
        } else if (match.score1 === match.score2) {
          // Hòa, xét đá luân lưu
          if (match.penaltyScore1 !== null && match.penaltyScore2 !== null) {
            if (match.penaltyScore1 > match.penaltyScore2) {
              winner1 = true;
            } else if (match.penaltyScore2 > match.penaltyScore1) {
              winner2 = true;
            }
          }
        }
      }

      // Tìm previous matches (children) - tìm matches có nextMatchId trỏ tới match này
      const currentMatchKey = match.id || `${match.stage}_${match.matchNumber}`;
      const currentMatchKeyAlt = `${match.stage}_${match.matchNumber}`;
      
      // Tìm matches có nextMatchId trỏ tới match hiện tại
      let childMatches = matches.filter(m => {
        if (!m.nextMatchId) return false;
        // nextMatchId có thể là string format "stage_matchNumber" hoặc ID
        const nextMatchIdStr = m.nextMatchId.toString();
        // So sánh với nhiều format có thể
        return nextMatchIdStr === currentMatchKey || 
               nextMatchIdStr === currentMatchKeyAlt ||
               nextMatchIdStr === match.id?.toString() ||
               nextMatchIdStr === `${match.stage}_${match.matchNumber}`;
      });

      // Nếu không tìm thấy đủ 2 child matches qua nextMatchId, dùng logic matchNumber (fallback)
      // Mỗi match ở vòng sau cần 2 matches từ vòng trước
      if (childMatches.length < 2) {
        const currentStage = match.stage;
        const currentMatchNumber = match.matchNumber || 1;

        const getPreviousStage = (curr) => {
          const idx = stageOrder.indexOf(curr);
          if (idx > 0) return stageOrder[idx - 1];
          return null;
        };
        const prevStage = getPreviousStage(currentStage);

        if (prevStage) {
          // Logic: Match 1 ở vòng sau nhận winner từ Match 1 và Match 2 ở vòng trước
          // Match 2 ở vòng sau nhận winner từ Match 3 và Match 4 ở vòng trước
          const prevMatchNum1 = (currentMatchNumber - 1) * 2 + 1;
          const prevMatchNum2 = (currentMatchNumber - 1) * 2 + 2;

          // Tìm các matches từ vòng trước mà chưa có trong childMatches
          const childMatch1 = matches.find(m => 
            m.stage === prevStage && 
            m.matchNumber === prevMatchNum1 &&
            !childMatches.some(cm => cm.stage === m.stage && cm.matchNumber === m.matchNumber)
          );
          const childMatch2 = matches.find(m => 
            m.stage === prevStage && 
            m.matchNumber === prevMatchNum2 &&
            !childMatches.some(cm => cm.stage === m.stage && cm.matchNumber === m.matchNumber)
          );

          if (childMatch1) {
            childMatches.push(childMatch1);
          }
          if (childMatch2) {
            childMatches.push(childMatch2);
          }
        }
      }

      // Xây dựng children nodes trước (cần để tạo seed.sourceGame)
      const children = childMatches
        .map(childMatch => buildGame(childMatch))
        .filter(Boolean);

      // Format theo react-tournament-bracket - sử dụng sides.home và sides.visitor với seed.sourceGame
      const matchId = match.id || `${match.stage}_${match.matchNumber}`;
      const nextMatchId = match.nextMatchId ? 
        (matchMap.has(match.nextMatchId.toString()) ? match.nextMatchId : null) : null;

      // Format date để hiển thị ở vị trí "Invalid Date" - cần là Date object với cả time nếu có
      let scheduledDate = null;
      if (match.date) {
        try {
          const date = new Date(match.date);
          if (!isNaN(date.getTime())) {
            // Nếu có time, thêm vào date
            if (match.time) {
              const [hours, minutes] = match.time.split(':').map(Number);
              if (!isNaN(hours) && !isNaN(minutes)) {
                date.setHours(hours, minutes, 0, 0);
              }
            }
            scheduledDate = date; // Giữ nguyên Date object để Bracket component hiển thị
          }
        } catch (e) {
          // Ignore date parsing errors
        }
      }

      // Xác định sourceGame cho mỗi side (team1 từ childMatch đầu tiên, team2 từ childMatch thứ hai)
      const homeSourceGame = children.length > 0 ? children[0] : null;
      const visitorSourceGame = children.length > 1 ? children[1] : null;

      // Tìm child match tương ứng để lấy matchNumber cho hiển thị W#matchNumber
      const homeChildMatch = childMatches.length > 0 ? childMatches[0] : null;
      const visitorChildMatch = childMatches.length > 1 ? childMatches[1] : null;

      // Xác định tên hiển thị cho team1 (nếu chưa có team thì hiển thị W#matchNumber (vòng đấu trước))
      let homeTeamName = team1Name;
      if (!match.team1Id && homeChildMatch) {
        const prevStageTitle = getStageTitle(homeChildMatch.stage);
        homeTeamName = `W#${homeChildMatch.matchNumber} (${prevStageTitle})`;
      } else if (!match.team1Id && !homeChildMatch) {
        homeTeamName = 'TBD';
      }

      // Xác định tên hiển thị cho team2 (nếu chưa có team thì hiển thị W#matchNumber (vòng đấu trước))
      let visitorTeamName = team2Name;
      if (!match.team2Id && visitorChildMatch) {
        const prevStageTitle = getStageTitle(visitorChildMatch.stage);
        visitorTeamName = `W#${visitorChildMatch.matchNumber} (${prevStageTitle})`;
      } else if (!match.team2Id && !visitorChildMatch) {
        visitorTeamName = 'TBD';
      }

      // Lấy tên sân đấu
      const courtName = getCourtName(match);

      // Xây dựng sides object với home và visitor, thêm seed.sourceGame nếu có
      const gameNode = {
        id: matchId,
        name: getStageTitle(match.stage),
        scheduled: scheduledDate,
        courtName: courtName, // Thêm tên sân vào gameNode
        sides: {
          home: {
            team: {
              id: match.team1Id && match.team1Id !== 'BYE' ? match.team1Id.toString() : (match.team1Id === 'BYE' ? 'BYE_1' : 'TBD_1'),
              name: match.team1Id === 'BYE' ? 'BYE' : homeTeamName,
              logo: getTeamLogo(match.team1Id)
            },
            score: {
              score: match.score1 !== undefined && match.score1 !== null ? match.score1 : null,
              // Hiển thị penalty score nếu có và hòa
              ...(match.score1 !== null && match.score2 !== null && 
                  match.score1 === match.score2 && 
                  match.penaltyScore1 !== null && match.penaltyScore2 !== null ? {
                penaltyScore: match.penaltyScore1
              } : {})
            },
            // Thêm seed với sourceGame nếu có child match
            ...(homeSourceGame ? {
              seed: {
                sourceGame: homeSourceGame,
                rank: 1, // Winner
                displayName: homeTeamName
              }
            } : {})
          },
          visitor: {
            team: {
              id: match.team2Id && match.team2Id !== 'BYE' ? match.team2Id.toString() : (match.team2Id === 'BYE' ? 'BYE_2' : 'TBD_2'),
              name: match.team2Id === 'BYE' ? 'BYE' : visitorTeamName,
              logo: getTeamLogo(match.team2Id)
            },
            score: {
              score: match.score2 !== undefined && match.score2 !== null ? match.score2 : null,
              // Hiển thị penalty score nếu có và hòa
              ...(match.score1 !== null && match.score2 !== null && 
                  match.score1 === match.score2 && 
                  match.penaltyScore1 !== null && match.penaltyScore2 !== null ? {
                penaltyScore: match.penaltyScore2
              } : {})
            },
            // Thêm seed với sourceGame nếu có child match
            ...(visitorSourceGame ? {
              seed: {
                sourceGame: visitorSourceGame,
                rank: 1, // Winner
                displayName: visitorTeamName
              }
            } : {})
          }
        }
      };

      return gameNode;
    };

    return buildGame(finalMatch);

  }, [tournament, isRoundRobin]);


  // Tính toán rounds cho Round-Robin: CHỈ nhóm matches từ API
  const roundRobinRounds = useMemo(() => {
    if (!isRoundRobin) return []

    // Nếu không có matches, trả về mảng rỗng
    if (!tournament?.matches || tournament.matches.length === 0) {
      return []
    }

    // Lọc tất cả matches round-robin (bao gồm round-robin, round-robin-round1, round-robin-round2, ...)
    const roundRobinMatches = tournament.matches.filter(m =>
      m.stage === 'round-robin' || (m.stage && m.stage.startsWith('round-robin'))
    )

    if (roundRobinMatches.length === 0) {
      return []
    }

    // Nhóm matches theo stage và lượt
    // Format stage: round-robin-v1, round-robin-v2, ... (1 lượt)
    // hoặc: round-robin-round1-v1, round-robin-round1-v2, ... (nhiều lượt)
    const matchesByStage = {}
    roundRobinMatches.forEach(match => {
      const stage = match.stage || 'round-robin'
      if (!matchesByStage[stage]) {
        matchesByStage[stage] = []
      }
      matchesByStage[stage].push(match)
    })

    // Sắp xếp các stage theo thứ tự: lượt -> vòng
    const sortedStages = Object.keys(matchesByStage).sort((a, b) => {
      // Extract lượt và vòng từ stage name
      const parseStage = (stageName) => {
        // round-robin-round1-v2 -> round=1, v=2
        // round-robin-v2 -> round=1, v=2
        const roundMatch = stageName.match(/round-robin(?:-round(\d+))?-v(\d+)/)
        if (roundMatch) {
          return {
            round: roundMatch[1] ? parseInt(roundMatch[1]) : 1,
            v: parseInt(roundMatch[2])
          }
        }
        // round-robin-round1 -> round=1, v=0
        const roundOnlyMatch = stageName.match(/round-robin(?:-round(\d+))?$/)
        if (roundOnlyMatch) {
          return {
            round: roundOnlyMatch[1] ? parseInt(roundOnlyMatch[1]) : 1,
            v: 0
          }
        }
        return { round: 1, v: 0 }
      }

      const aParsed = parseStage(a)
      const bParsed = parseStage(b)

      if (aParsed.round !== bParsed.round) {
        return aParsed.round - bParsed.round
      }
      return aParsed.v - bParsed.v
    })

    // Tạo danh sách rounds đơn giản, đánh số liên tục từ 1
    const rounds = []
    let roundCounter = 1

    sortedStages.forEach(stage => {
      const stageMatches = matchesByStage[stage]
        .sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0))
        .map(match => {
          const team1 = findTeamById(match.team1Id)
          const team2 = findTeamById(match.team2Id)

          return {
            id: match.matchNumber || match.id,
            team1: team1 || { id: match.team1Id, teamNumber: getTeamDisplayName(match.team1Id, match, true) },
            team2: team2 || { id: match.team2Id, teamNumber: getTeamDisplayName(match.team2Id, match, false) },
            score1: match.score1 ?? 0,
            score2: match.score2 ?? 0,
            matchNumber: match.matchNumber || match.id,
            date: match.date,
            time: match.time,
            courtName: getCourtName(match)
          }
        })

      rounds.push({
        id: roundCounter,
        title: `VÒNG ${roundCounter}`,
        matches: stageMatches
      })

      roundCounter++
    })

    return rounds
  }, [tournament, isRoundRobin])


  // Hiển thị round-robin: Theo từng vòng với selector
  if (isRoundRobin) {
    const displayRounds = selectedRoundIndex === null
      ? roundRobinRounds
      : [roundRobinRounds[selectedRoundIndex]].filter(Boolean)

    return (
      <div className="schedule-section">
        <div className="section-card">
          <h2>Lịch thi đấu - Vòng tròn</h2>

          {/* Round Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '24px',
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>VÒNG</span>
            <button
              onClick={() => setSelectedRoundIndex(null)}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '2px solid',
                borderColor: selectedRoundIndex === null ? '#10b981' : '#10b981',
                backgroundColor: selectedRoundIndex === null ? '#10b981' : 'transparent',
                color: selectedRoundIndex === null ? '#fff' : '#10b981',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              TẤT
            </button>
            {roundRobinRounds.map((round, index) => (
              <button
                key={round.id}
                onClick={() => setSelectedRoundIndex(index)}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  border: '2px solid',
                  borderColor: selectedRoundIndex === index ? '#10b981' : '#10b981',
                  backgroundColor: selectedRoundIndex === index ? '#10b981' : 'transparent',
                  color: selectedRoundIndex === index ? '#fff' : '#10b981',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {round.id}
              </button>
            ))}
          </div>

          {/* Hiển thị các vòng */}
          {displayRounds.map((round) => {
            return (
              <div key={round.id} style={{ marginBottom: '32px' }}>
                {/* Banner vòng đấu */}
                <div style={{
                  backgroundColor: '#7c3aed',
                  color: '#fff',
                  padding: '12px 20px',
                  borderRadius: '8px 8px 0 0',
                  fontWeight: '600',
                  fontSize: '16px',
                  marginBottom: '0',
                  textAlign: 'center'
                }}>
                  {round.title}
                </div>

                {/* Danh sách trận đấu */}
                <div style={{
                  border: '1px solid #e5e7eb',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  backgroundColor: '#fff'
                }}>
                  {round.matches.map((match, matchIndex) => {
                    const team1 = match.team1
                    const team2 = match.team2
                    const hasScore = match.score1 !== undefined && match.score2 !== undefined
                    let scoreText = hasScore ? `${match.score1 || 0}-${match.score2 || 0}` : 'Chưa có lịch thi đấu'
                    // Thêm penalty score nếu có và hòa (chỉ cho single-elimination, round-robin không cần)
                    if (!isRoundRobin && hasScore && match.score1 === match.score2 && 
                        match.penaltyScore1 !== null && match.penaltyScore2 !== null) {
                      scoreText += ` (${match.penaltyScore1 || 0}-${match.penaltyScore2 || 0} P)`
                    }

                    return (
                      <div
                        key={match.id || matchIndex}
                        className="match-row-hover"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '16px 20px',
                          borderBottom: matchIndex < round.matches.length - 1 ? '1px solid #e5e7eb' : 'none',
                          gap: '12px',
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {/* Số thứ tự trận - cố định bên trái */}
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#6b7280',
                          flexShrink: 0,
                          position: 'absolute',
                          left: '20px'
                        }}>
                          {match.matchNumber || matchIndex + 1}
                        </div>

                        {/* Phần giữa - căn giữa */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '12px',
                          flexShrink: 0
                        }}>
                          {/* Đội 1 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                            <img
                              src={team1.logo || '/team.png'}
                              alt="Team"
                              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>
                              {team1.teamNumber || `Đội #${team1.id}`}
                            </span>
                          </div>

                          {/* Tỷ số */}
                          <div style={{
                            padding: '8px 16px',
                            backgroundColor: '#10b981',
                            color: '#fff',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            minWidth: '120px',
                            textAlign: 'center',
                            flexShrink: 0
                          }}>
                            {scoreText}
                          </div>

                          {/* Đội 2 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>
                              {team2.teamNumber || `Đội #${team2.id}`}
                            </span>
                            <img
                              src={team2.logo || '/team.png'}
                              alt="Team"
                              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                          </div>
                        </div>

                        {/* Trạng thái và sân - cố định bên phải */}
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          textAlign: 'right',
                          flexShrink: 0,
                          minWidth: '150px',
                          position: 'absolute',
                          right: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          alignItems: 'flex-end'
                        }}>
                          {match.courtName ? (
                            <div style={{
                              fontSize: '11px',
                              color: '#10b981',
                              fontWeight: '500'
                            }}>
                              {match.courtName}
                            </div>
                          ) : (
                            <div>Chưa có lịch thi đấu</div>
                          )}
                          {match.date && match.time && (
                            <div style={{ fontSize: '11px' }}>
                              {new Date(match.date).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit'
                              })} {match.time}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Hiển thị single-elimination: Bracket tree
  return (
    <>
      <div className="schedule-section">
        <div className="section-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>Lịch thi đấu</h2>
            {bracketGame && (
              <button
                onClick={() => setIsFullscreen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
              >
                <Maximize2 size={16} />
                Mở rộng
              </button>
            )}
          </div>
          {!bracketGame ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              Chưa có lịch đấu. Vui lòng bốc thăm để tạo lịch đấu.
            </div>
          ) : (
            <div className="bracket-container" style={{ overflowX: 'auto', padding: '20px' }}>
              {/* Component Bracket của react-tournament-bracket */}
              <Bracket 
                game={bracketGame}
                hoveredTeamId={hoveredTeamId}
                onHoveredTeamIdChange={setHoveredTeamId}
                bottomText={(game) => {
                  // Hiển thị tên vòng và tên sân (ngày đã hiển thị ở vị trí scheduled)
                  const parts = [game.name];
                  if (game.courtName) {
                    parts.push(`Sân: ${game.courtName}`);
                  }
                  return parts.join(' - ');
                }}
                styles={{
                  backgroundColor: '#58595e',
                  hoverBackgroundColor: '#3b82f6', // Màu xanh khi hover
                  scoreBackground: '#787a80',
                  winningScoreBackground: '#10b981',
                  teamNameStyle: { 
                    fill: '#fff', 
                    fontSize: 12, 
                    textShadow: '1px 1px 1px #222',
                    transition: 'all 0.2s ease'
                  },
                  teamScoreStyle: { fill: '#23252d', fontSize: 12 },
                  gameNameStyle: { fill: '#999', fontSize: 10 },
                  gameTimeStyle: { fill: '#999', fontSize: 10 },
                  teamSeparatorStyle: { stroke: '#444549', strokeWidth: 1 }
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && bracketGame && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            overflow: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsFullscreen(false)
            }
          }}
        >
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => setIsFullscreen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                backgroundColor: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                zIndex: 10000,
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
            >
              <Minimize2 size={18} />
              Thu gọn
            </button>
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'auto',
              padding: '40px'
            }}>
              <Bracket 
                game={bracketGame}
                hoveredTeamId={hoveredTeamId}
                onHoveredTeamIdChange={setHoveredTeamId}
                bottomText={(game) => {
                  // Hiển thị tên vòng và tên sân (ngày đã hiển thị ở vị trí scheduled)
                  const parts = [game.name];
                  if (game.courtName) {
                    parts.push(`Sân: ${game.courtName}`);
                  }
                  return parts.join(' - ');
                }}
                styles={{
                  backgroundColor: '#58595e',
                  hoverBackgroundColor: '#3b82f6',
                  scoreBackground: '#787a80',
                  winningScoreBackground: '#10b981',
                  teamNameStyle: { 
                    fill: '#fff', 
                    fontSize: 14, 
                    textShadow: '1px 1px 1px #222',
                    transition: 'all 0.2s ease'
                  },
                  teamScoreStyle: { fill: '#23252d', fontSize: 14 },
                  gameNameStyle: { fill: '#999', fontSize: 12 },
                  gameTimeStyle: { fill: '#999', fontSize: 12 },
                  teamSeparatorStyle: { stroke: '#444549', strokeWidth: 1 }
                }}
                gameDimensions={{
                  width: 250,
                  height: 100
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ScheduleTab

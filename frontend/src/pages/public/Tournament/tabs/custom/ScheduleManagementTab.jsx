import React, { useState, useEffect, useMemo } from 'react'
import { Save, FileUp, X, Zap, AlertTriangle, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { useParams } from 'react-router-dom'
import { leagueApi } from '../../../../../api/leagueApi'
import { courtApi } from '../../../../../api/courtApi'
import { useTournament } from '../../TournamentContext'

const ScheduleManagementTab = ({ tournament }) => {
  const { id } = useParams()
  const { refreshTournament } = useTournament()
  const [activeRoundIndex, setActiveRoundIndex] = useState(0)
  const [scheduleData, setScheduleData] = useState([])
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [courts, setCourts] = useState([])
  const [loadingCourts, setLoadingCourts] = useState(false)
  const [autoScheduling, setAutoScheduling] = useState(false)
  const [showAutoScheduleModal, setShowAutoScheduleModal] = useState(false)
  const [autoScheduleOptions, setAutoScheduleOptions] = useState({
    startDate: '',
    endDate: '',
    matchDuration: 90, // Thời gian thi đấu chính thức (phút)
    breakTime: 30, // Thời gian nghỉ giữa hiệp/giữa các trận (phút)
    totalMatchTime: null, // Tổng thời gian trận đấu (matchDuration + breakTime), null = tự động tính
    matchesPerDay: null, // Số lượng trận đấu mỗi ngày (null = tự động)
    matchesPerRound: null, // Số lượng trận đấu mỗi vòng (null = tự động)
    preferredStartTime: '08:00', // Khung giờ hoạt động - Giờ bắt đầu
    preferredEndTime: '22:00' // Khung giờ hoạt động - Giờ kết thúc
  })
  const [conflicts, setConflicts] = useState([])
  const [warnings, setWarnings] = useState([])
  const [confirmingSchedule, setConfirmingSchedule] = useState(false)
  const [cancellingMatch, setCancellingMatch] = useState(null) // Track which match is being cancelled
  const [cancellingAll, setCancellingAll] = useState(false)
  
  const isRoundRobin = tournament?.format === 'Vòng tròn' || tournament?.format === 'round-robin'

  // Helper: Lấy tên stage để hiển thị
  const getStageTitle = (stage) => {
    const stageMap = {
      'final': 'CHUNG KẾT',
      'semi': 'BÁN KẾT',
      'round3': 'TỨ KẾT',
      'round4': 'VÒNG 4',
      'round2': 'VÒNG 2',
      'round1': 'VÒNG 1',
      'round-robin': 'VÒNG TRÒN'
    }
    return stageMap[stage] || stage
  }

  // Helper: Lấy label ngắn cho stage
  const getStageLabel = (stage, index) => {
    if (isRoundRobin) {
      return index === 0 ? 'Tất cả' : `V${index + 1}`
    }
    const labelMap = {
      'final': 'CK',
      'semi': 'BK',
      'round3': 'TK',
      'round4': 'V4',
      'round2': 'V2',
      'round1': 'V1'
    }
    return labelMap[stage] || `V${index + 1}`
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
  const getTeamDisplayName = (teamId) => {
    if (teamId === "BYE") {
      return "BYE"
    }
    if (!teamId) {
      return "TBD"
    }
    const team = findTeamById(teamId)
    if (team) {
      return team.teamNumber || `Đội #${team.id}`
    }
    return `Đội #${teamId}`
  }

  // Lấy danh sách teams từ API (không tạo defaultTeams)
  const teamsList = useMemo(() => {
    return tournament?.teams || []
  }, [tournament?.teams])

  // Fetch courts từ facility của tournament
  useEffect(() => {
    const fetchCourts = async () => {
      if (!tournament?.facility) {
        setCourts([])
        return
      }

      try {
        setLoadingCourts(true)
        const facilityId = typeof tournament.facility === 'object' 
          ? (tournament.facility._id || tournament.facility.id)
          : tournament.facility

        if (!facilityId) {
          setCourts([])
          return
        }

        // Lấy danh sách sân, filter theo courtType nếu tournament có
        const params = {
          facility: facilityId,
          status: 'active',
          limit: 100
        }

        // Nếu tournament có courtType, filter theo courtType
        // Kiểm tra cả trong tournament trực tiếp và trong tournament.data (nếu có)
        const tournamentData = tournament?.data || tournament
        const courtTypeValue = tournamentData?.courtType || tournament?.courtType
        
        if (courtTypeValue) {
          let courtTypeId = null
          
          // Xử lý nhiều trường hợp: object có _id, object có id, hoặc string
          if (typeof courtTypeValue === 'object' && courtTypeValue !== null) {
            courtTypeId = courtTypeValue._id || courtTypeValue.id
            // Nếu vẫn không có, thử toString()
            if (!courtTypeId) {
              // Kiểm tra xem có phải là ObjectId trực tiếp không
              if (courtTypeValue.toString && typeof courtTypeValue.toString === 'function') {
                const str = courtTypeValue.toString()
                // Kiểm tra xem có phải ObjectId string không
                if (str.length === 24 && /^[0-9a-fA-F]{24}$/.test(str)) {
                  courtTypeId = str
                }
              }
            }
          } else if (courtTypeValue) {
            courtTypeId = courtTypeValue
          }
          
          if (courtTypeId) {
            // Đảm bảo là string
            params.typeId = courtTypeId.toString()
          }
        }

        const result = await courtApi.getCourts(params)

        if (result.success && result.data?.courts) {
          setCourts(result.data.courts)
        } else {
          setCourts([])
        }
      } catch (error) {
        console.error('Error fetching courts:', error)
        setCourts([])
      } finally {
        setLoadingCourts(false)
      }
    }

    fetchCourts()
  }, [tournament?.facility, tournament?.courtType])

  // Tính toán rounds CHỈ từ matches trong API (không tính toán lại)
  const rounds = useMemo(() => {
    if (!tournament?.matches || tournament.matches.length === 0) {
      return []
    }

    if (isRoundRobin) {
      // Round-robin: Nhóm matches theo stage (có thể là round-robin, round-robin-v1, round-robin-round1-v1, etc.)
      const roundRobinMatches = tournament.matches
        .filter(m => {
          // Lọc bỏ matches có BYE
          const hasBye = m.team1Id === "BYE" || m.team2Id === "BYE";
          // Kiểm tra stage bắt đầu bằng 'round-robin'
          const isRoundRobinStage = m.stage && (m.stage === 'round-robin' || m.stage.startsWith('round-robin'));
          return isRoundRobinStage && !hasBye;
        })
        .sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0))
      
      if (roundRobinMatches.length === 0) {
        return []
      }

      // Nhóm matches theo stage để tạo các vòng
      // Các stage có thể là: round-robin-v1, round-robin-v2, round-robin-round1-v1, round-robin-round1-v2, etc.
      const matchesByStage = {}
      roundRobinMatches.forEach(match => {
        const stage = match.stage || 'round-robin'
        if (!matchesByStage[stage]) {
          matchesByStage[stage] = []
        }
        matchesByStage[stage].push(match)
      })

      // Sắp xếp các stage theo thứ tự: round-robin, round-robin-v1, round-robin-v2, ..., round-robin-round1-v1, ...
      const sortedStages = Object.keys(matchesByStage).sort((a, b) => {
        // Extract round và sub-round numbers để sắp xếp
        const parseStage = (stage) => {
          // round-robin -> round=0, subRound=0
          if (stage === 'round-robin') return { round: 0, subRound: 0 }
          
          // round-robin-v2 -> round=1, subRound=2
          const vMatch = stage.match(/round-robin-v(\d+)/)
          if (vMatch) return { round: 1, subRound: parseInt(vMatch[1]) }
          
          // round-robin-round2-v3 -> round=2, subRound=3
          const roundVMatch = stage.match(/round-robin-round(\d+)-v(\d+)/)
          if (roundVMatch) return { round: parseInt(roundVMatch[1]), subRound: parseInt(roundVMatch[2]) }
          
          return { round: 0, subRound: 0 }
        }
        
        const aParsed = parseStage(a)
        const bParsed = parseStage(b)
        
        if (aParsed.round !== bParsed.round) return aParsed.round - bParsed.round
        return aParsed.subRound - bParsed.subRound
      })

      // Tạo rounds từ các stage đã sắp xếp
      const rounds = sortedStages.map((stage, index) => {
        const stageMatches = matchesByStage[stage]
          .sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0))
        
        // Tạo label và fullName từ stage
        let label = `V${index + 1}`
        let fullName = `VÒNG ${index + 1}`
        
        if (stage === 'round-robin' && index === 0) {
          label = 'Tất cả'
          fullName = 'TẤT CẢ CÁC TRẬN ĐẤU'
        } else {
          // Parse stage để tạo label có ý nghĩa hơn
          const roundVMatch = stage.match(/round-robin(?:-round(\d+))?-v(\d+)/)
          if (roundVMatch) {
            const roundNum = roundVMatch[1] ? parseInt(roundVMatch[1]) : 1
            const subRoundNum = parseInt(roundVMatch[2])
            label = roundNum > 1 ? `Lượt ${roundNum} - V${subRoundNum}` : `V${subRoundNum}`
            fullName = roundNum > 1 ? `LƯỢT ${roundNum} - VÒNG ${subRoundNum}` : `VÒNG ${subRoundNum}`
          }
        }
        
        return {
          id: index + 1,
          name: stage,
          label: label,
          fullName: fullName,
          matches: stageMatches.map(match => ({
            id: match.matchNumber || match.id,
            team1: match.team1Id || null,
            team2: match.team2Id || null,
            _match: match
          }))
        }
      })
      
      return rounds
    } else {
      // Single-elimination: CHỈ nhóm matches theo stage từ API (loại bỏ tất cả round-robin stages)
      const singleEliminationMatches = tournament.matches.filter(
        m => m.stage && m.stage !== 'round-robin' && !m.stage.startsWith('round-robin')
      )

      if (singleEliminationMatches.length === 0) {
        return []
      }

      // Nhóm matches theo stage
      const matchesByStage = {}
      singleEliminationMatches.forEach(match => {
        if (!matchesByStage[match.stage]) {
          matchesByStage[match.stage] = []
        }
        matchesByStage[match.stage].push(match)
      })

      // Sắp xếp các stage theo thứ tự: round1, round2, round3, round4, semi, final
      const stageOrder = ['round1', 'round2', 'round3', 'round4', 'semi', 'final']
      const sortedStages = Object.keys(matchesByStage).sort((a, b) => {
        const indexA = stageOrder.indexOf(a)
        const indexB = stageOrder.indexOf(b)
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
      })

      // Tạo rounds từ matches đã nhóm
      const calculatedRounds = sortedStages.map((stage, index) => {
        const stageMatches = matchesByStage[stage]
          .filter(match => {
            // Lọc bỏ matches có BYE (cả 2 đội đều BYE hoặc 1 trong 2 là BYE)
            const hasBye = match.team1Id === "BYE" || match.team2Id === "BYE";
            return !hasBye;
          })
          .sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0))

        return {
          id: index + 1,
          name: stage,
          label: getStageLabel(stage, index),
          fullName: getStageTitle(stage),
          matches: stageMatches.map(match => ({
            id: match.matchNumber || match.id,
            team1: match.team1Id || null,
            team2: match.team2Id || null,
            _match: match
          }))
        }
      })

      return calculatedRounds
    }
  }, [tournament?.matches, isRoundRobin, tournament?.maxParticipants])

  // Cập nhật scheduleData khi chuyển vòng hoặc tournament thay đổi
  useEffect(() => {
    if (rounds.length > 0 && rounds[activeRoundIndex]) {
      const currentRound = rounds[activeRoundIndex]
      // Sử dụng stage thực tế từ currentRound.name (có thể là round-robin, round-robin-v1, round-robin-round1-v1, etc.)
      const stage = currentRound.name
      
      // Lấy matches từ database với stage cụ thể
      const dbMatches = tournament?.matches?.filter(m => m.stage === stage) || []
      
      const initialSchedule = currentRound.matches.map(match => {
        // Tìm match tương ứng trong database
        const dbMatch = dbMatches.find(m => 
          (m.matchNumber === match.id) || 
          (m.matchNumber === parseInt(match.id)) ||
          (parseInt(m.matchNumber) === match.id)
        )
        
        return {
          matchId: match.id,
          roundId: currentRound.id,
          stage: stage, // Sử dụng stage thực tế
          team1: match.team1,
          team2: match.team2,
          date: dbMatch?.date ? new Date(dbMatch.date).toISOString().split('T')[0] : '',
          time: dbMatch?.time || '',
          endTime: dbMatch?.endTime || '',
          courtId: dbMatch?.courtId ? (dbMatch.courtId._id || dbMatch.courtId || dbMatch.courtId.toString()) : ''
        }
      })
      setScheduleData(initialSchedule)
    } else {
      setScheduleData([])
    }
  }, [rounds, activeRoundIndex, tournament?.matches, isRoundRobin])

  const handleDownloadScheduleSample = async () => {
    try {
      await leagueApi.downloadScheduleTemplate(id)
      toast.success('Đã tải file mẫu thành công')
    } catch (error) {
      console.error('Error downloading template:', error)
      toast.error(error.message || 'Không thể tải file mẫu')
    }
  }

  const handleImportScheduleFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls,.csv'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      try {
        setSavingSchedule(true)
        const result = await leagueApi.importSchedule(id, file)
        
        if (result.success) {
          const message = result.details?.notFound?.length > 0
            ? `Đã import ${result.details.updated}/${result.details.total} lịch đấu. ${result.details.notFound.length} trận không tìm thấy.`
            : result.message || 'Import thành công'
          toast.success(message)
          refreshTournament()
        }
      } catch (error) {
        console.error('Error importing schedule:', error)
        if (error.errors && Array.isArray(error.errors)) {
          error.errors.forEach(err => toast.error(err))
        } else {
          toast.error(error.message || 'Không thể import lịch đấu')
        }
      } finally {
        setSavingSchedule(false)
      }
    }
    input.click()
  }

  const handleScheduleChange = (matchId, field, value) => {
    setScheduleData(prev => prev.map(item => 
      item.matchId === matchId ? { ...item, [field]: value } : item
    ))
  }

  const handleSaveSchedule = async () => {
    if (scheduleData.length === 0) {
      toast.error('Không có lịch đấu để lưu')
      return
    }

    try {
      setSavingSchedule(true)
      setConflicts([])
      setWarnings([])
      
      // Chuyển đổi scheduleData sang format API
      const schedules = scheduleData.map(item => ({
        stage: item.stage,
        matchNumber: parseInt(item.matchId) || item.matchId,
        date: item.date || null,
        time: item.time || null,
        endTime: item.endTime || null,
        courtId: item.courtId || null
      }))
      
      // Gọi API để lưu lịch đấu
      const result = await leagueApi.updateMatchSchedule(id, schedules)
      
      if (result.success) {
        // Xử lý warnings nếu có
        if (result.warnings && result.warnings.length > 0) {
          setWarnings(result.warnings)
          toast.warning(`Đã lưu lịch đấu thành công. Có ${result.warnings.length} cảnh báo.`)
        } else {
          toast.success('Đã lưu lịch đấu thành công')
        }
        refreshTournament()
      }
    } catch (error) {
      console.error('Error saving schedule:', error)
      
      // Xử lý conflicts từ error response
      const errorData = error.response?.data || error
      if (errorData.conflicts && Array.isArray(errorData.conflicts)) {
        setConflicts(errorData.conflicts)
        setWarnings(errorData.warnings || [])
        toast.error(`Phát hiện ${errorData.conflicts.length} xung đột lịch đấu. Vui lòng kiểm tra và sửa lại.`)
      } else {
        toast.error(errorData.message || error.message || 'Không thể lưu lịch đấu')
      }
    } finally {
      setSavingSchedule(false)
    }
  }


  const handleConfirmSchedule = async () => {
    try {
      setConfirmingSchedule(true)
      
      const result = await leagueApi.confirmSchedule(id)
      
      if (result.success) {
        const { confirmed, failed } = result.data
        if (failed && failed.length > 0) {
          toast.warning(`Đã chốt ${confirmed.length} lịch đấu. ${failed.length} lịch đấu không thể chốt.`)
        } else {
          toast.success(`Đã chốt ${confirmed.length} lịch đấu thành công. Các khung giờ đã được block.`)
        }
        refreshTournament()
      }
    } catch (error) {
      console.error('Error confirming schedule:', error)
      toast.error(error.message || 'Không thể chốt lịch thi đấu')
    } finally {
      setConfirmingSchedule(false)
    }
  }

  const handleCancelMatchSchedule = async (scheduleItem) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy lịch đấu cho trận #${scheduleItem.matchId}?`)) {
      return
    }

    try {
      setCancellingMatch(scheduleItem.matchId)
      
      const result = await leagueApi.cancelMatchSchedule(id, scheduleItem.stage, scheduleItem.matchId)
      
      if (result.success) {
        toast.success('Đã hủy lịch đấu cho trận này')
        refreshTournament()
      }
    } catch (error) {
      console.error('Error cancelling match schedule:', error)
      toast.error(error.message || 'Không thể hủy lịch đấu')
    } finally {
      setCancellingMatch(null)
    }
  }

  const handleCancelAllSchedule = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy toàn bộ lịch đấu đã chốt? Hành động này không thể hoàn tác.')) {
      return
    }

    try {
      setCancellingAll(true)
      
      const result = await leagueApi.cancelAllSchedule(id)
      
      if (result.success) {
        toast.success(result.message || 'Đã hủy toàn bộ lịch đấu')
        refreshTournament()
      }
    } catch (error) {
      console.error('Error cancelling all schedule:', error)
      toast.error(error.message || 'Không thể hủy lịch đấu')
    } finally {
      setCancellingAll(false)
    }
  }

  // Khởi tạo auto schedule options từ tournament
  useEffect(() => {
    if (tournament) {
      setAutoScheduleOptions(prev => ({
        ...prev,
        startDate: tournament.startDate ? new Date(tournament.startDate).toISOString().split('T')[0] : '',
        endDate: tournament.endDate ? new Date(tournament.endDate).toISOString().split('T')[0] : '',
        totalMatchTime: prev.totalMatchTime || (prev.matchDuration + prev.breakTime)
      }))
    }
  }, [tournament])

  const handleAutoSchedule = async () => {
    if (!tournament?.facility) {
      toast.error('Giải đấu chưa có cơ sở thể thao. Vui lòng chọn cơ sở trước.')
      return
    }

    if (!autoScheduleOptions.startDate || !autoScheduleOptions.endDate) {
      toast.error('Vui lòng chọn ngày bắt đầu và ngày kết thúc')
      return
    }

    if (new Date(autoScheduleOptions.startDate) > new Date(autoScheduleOptions.endDate)) {
      toast.error('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc')
      return
    }

    if (autoScheduleOptions.preferredStartTime >= autoScheduleOptions.preferredEndTime) {
      toast.error('Giờ bắt đầu phải nhỏ hơn giờ kết thúc')
      return
    }

    try {
      setAutoScheduling(true)
      
      // Chuẩn bị dữ liệu gửi lên, tính totalMatchTime nếu chưa có
      const requestData = {
        ...autoScheduleOptions,
        totalMatchTime: autoScheduleOptions.totalMatchTime || 
          (autoScheduleOptions.matchDuration + autoScheduleOptions.breakTime),
        // Chỉ gửi matchesPerDay hoặc matchesPerRound nếu có giá trị
        ...(autoScheduleOptions.matchesPerDay ? { matchesPerDay: autoScheduleOptions.matchesPerDay } : {}),
        ...(autoScheduleOptions.matchesPerRound ? { matchesPerRound: autoScheduleOptions.matchesPerRound } : {})
      }
      
      const result = await leagueApi.autoSchedule(id, requestData)
      
      if (result.success) {
        const { scheduled, failed } = result.data
        if (failed.length > 0) {
          // Có trận đấu không thể sắp xếp
          if (scheduled.length === 0) {
            // Không sắp xếp được trận nào
            toast.error(
              `Không thể sắp xếp lịch đấu trong khoảng thời gian đã chọn. Vui lòng thử đổi ngày bắt đầu và ngày kết thúc khác.`,
              { duration: 5000 }
            )
          } else {
            // Sắp xếp được một phần
            toast.warning(
              `Đã tự động sắp xếp ${scheduled.length} trận đấu. ${failed.length} trận không thể sắp xếp. Vui lòng thử đổi ngày bắt đầu và ngày kết thúc để sắp xếp các trận còn lại.`,
              { duration: 6000 }
            )
          }
        } else {
          // Sắp xếp thành công tất cả
          toast.success(`Đã tự động sắp xếp ${scheduled.length} trận đấu thành công`)
          setShowAutoScheduleModal(false)
        }
        refreshTournament()
      }
    } catch (error) {
      console.error('Error auto scheduling:', error)
      const errorMessage = error.message || 'Không thể tự động sắp xếp lịch đấu'
      // Nếu có thông báo từ backend về việc không sắp xếp được, thêm gợi ý đổi ngày
      if (errorMessage.includes('Không thể sắp xếp') || errorMessage.includes('không thể sắp xếp')) {
        toast.error(`${errorMessage} Vui lòng thử đổi ngày bắt đầu và ngày kết thúc khác.`, { duration: 6000 })
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setAutoScheduling(false)
    }
  }

  if (!tournament) return null

  // Nếu chưa có matches, hiển thị thông báo
  if (rounds.length === 0) {
    return (
      <div className="custom-tab-content">
        <h2>Quản lý lịch đấu</h2>
        
        <p className="schedule-description">
          Chưa có lịch đấu. Vui lòng bốc thăm để tạo lịch đấu.
        </p>
      </div>
    )
  }

  return (
    <div className="custom-tab-content">
      <h2>Quản lý lịch đấu</h2>
      
      <div className="schedule-management-header">
        <p className="schedule-description">
          Bạn có thể quản lý lịch thi đấu (ngày, giờ, sân) của toàn giải đấu.
        </p>
        <div className="schedule-import-actions">
          <button
            className="btn-auto-schedule"
            onClick={() => setShowAutoScheduleModal(true)}
            disabled={!tournament?.facility}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: tournament?.facility ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              opacity: tournament?.facility ? 1 : 0.6
            }}
          >
            <Zap size={16} />
            Tự động sắp xếp lịch
          </button>
          <button
            className="download-schedule-link"
            onClick={handleDownloadScheduleSample}
          >
            Tải về tệp tin mẫu
          </button>
          <button
            className="btn-import-schedule-file"
            onClick={handleImportScheduleFile}
          >
            <FileUp size={16} />
            Nhập tệp tin
          </button>
        </div>
      </div>

      {/* Auto Schedule Modal */}
      {showAutoScheduleModal && (
        <div style={{
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
        }} onClick={() => setShowAutoScheduleModal(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
              Tự động sắp xếp lịch đấu
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Ngày bắt đầu *
                </label>
                <input
                  type="date"
                  value={autoScheduleOptions.startDate}
                  onChange={(e) => setAutoScheduleOptions(prev => ({ ...prev, startDate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Ngày kết thúc *
                </label>
                <input
                  type="date"
                  value={autoScheduleOptions.endDate}
                  onChange={(e) => setAutoScheduleOptions(prev => ({ ...prev, endDate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Thời gian thi đấu chính thức (phút) *
                </label>
                <input
                  type="number"
                  value={autoScheduleOptions.matchDuration}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 90
                    setAutoScheduleOptions(prev => ({ 
                      ...prev, 
                      matchDuration: value,
                      totalMatchTime: value + prev.breakTime
                    }))
                  }}
                  min="30"
                  max="180"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                  Thời gian thi đấu chính thức của mỗi trận
                </p>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Thời gian nghỉ giữa hiệp/giữa các trận (phút) *
                </label>
                <input
                  type="number"
                  value={autoScheduleOptions.breakTime}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 30
                    setAutoScheduleOptions(prev => ({ 
                      ...prev, 
                      breakTime: value,
                      totalMatchTime: prev.matchDuration + value
                    }))
                  }}
                  min="0"
                  max="120"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                  Thời gian nghỉ giữa hiệp và khoảng cách giữa các trận
                </p>
              </div>

              <div style={{
                padding: '12px',
                backgroundColor: '#f0f9ff',
                borderRadius: '6px',
                border: '1px solid #bae6fd'
              }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '500', color: '#0369a1', marginBottom: '4px' }}>
                  Tổng thời gian mỗi trận đấu
                </p>
                <p style={{ margin: 0, fontSize: '14px', color: '#0c4a6e' }}>
                  {autoScheduleOptions.matchDuration + autoScheduleOptions.breakTime} phút
                  <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                    ({autoScheduleOptions.matchDuration} phút thi đấu + {autoScheduleOptions.breakTime} phút nghỉ)
                  </span>
                </p>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Số lượng trận đấu mỗi ngày
                </label>
                <input
                  type="number"
                  value={autoScheduleOptions.matchesPerDay || ''}
                  onChange={(e) => setAutoScheduleOptions(prev => ({ 
                    ...prev, 
                    matchesPerDay: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  min="1"
                  placeholder="Tự động"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                  Để trống để hệ thống tự động tính toán
                </p>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Số lượng trận đấu mỗi vòng
                </label>
                <input
                  type="number"
                  value={autoScheduleOptions.matchesPerRound || ''}
                  onChange={(e) => setAutoScheduleOptions(prev => ({ 
                    ...prev, 
                    matchesPerRound: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  min="1"
                  placeholder="Tự động"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                  Để trống để hệ thống tự động tính toán
                </p>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Khung giờ hoạt động - Giờ bắt đầu *
                </label>
                <input
                  type="time"
                  value={autoScheduleOptions.preferredStartTime}
                  onChange={(e) => setAutoScheduleOptions(prev => ({ ...prev, preferredStartTime: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                  Khoảng thời gian trong ngày được phép tổ chức thi đấu
                </p>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Khung giờ hoạt động - Giờ kết thúc *
                </label>
                <input
                  type="time"
                  value={autoScheduleOptions.preferredEndTime}
                  onChange={(e) => setAutoScheduleOptions(prev => ({ ...prev, preferredEndTime: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                  Khoảng thời gian trong ngày được phép tổ chức thi đấu
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAutoScheduleModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleAutoSchedule}
                disabled={autoScheduling}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: autoScheduling ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: autoScheduling ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {autoScheduling ? 'Đang sắp xếp...' : 'Sắp xếp'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conflicts và Warnings */}
      {conflicts.length > 0 && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          borderLeft: '4px solid #ef4444'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertTriangle size={18} color="#dc2626" />
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#991b1b' }}>
              Xung đột lịch đấu ({conflicts.length})
            </h4>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#991b1b' }}>
            {conflicts.map((conflict, idx) => (
              <li key={idx} style={{ marginBottom: '4px', fontSize: '14px' }}>
                {conflict.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          backgroundColor: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '8px',
          borderLeft: '4px solid #f59e0b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertTriangle size={18} color="#d97706" />
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#92400e' }}>
              Cảnh báo ({warnings.length})
            </h4>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#92400e' }}>
            {warnings.map((warning, idx) => (
              <li key={idx} style={{ marginBottom: '4px', fontSize: '14px' }}>
                {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stage Selector */}
      {rounds.length > 1 && (
        <div className="schedule-stage-selector">
          {rounds.map((round, index) => (
            <button
              key={round.id || index}
              className={`stage-circle ${activeRoundIndex === index ? 'active' : ''}`}
              onClick={() => setActiveRoundIndex(index)}
              title={round.fullName}
            >
              {round.label}
            </button>
          ))}
        </div>
      )}

      <div className="schedule-section">
        {rounds[activeRoundIndex] && (
          <>
            <h3 className="schedule-stage-title">
              {rounds[activeRoundIndex].fullName}
            </h3>
            
            {scheduleData.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                Chưa có trận đấu nào cho vòng này.
              </div>
            ) : (
              <div className="schedule-matches-list">
                {scheduleData.map((scheduleItem) => {
                  const currentRound = rounds[activeRoundIndex]
                  const match = currentRound.matches.find(m => m.id === scheduleItem.matchId)
                  
                  // Lấy teamId từ match
                  const team1Id = match?.team1 || null
                  const team2Id = match?.team2 || null
                  
                  // Kiểm tra BYE
                  const isTeam1Bye = team1Id === "BYE"
                  const isTeam2Bye = team2Id === "BYE"
                  
                  // Lấy tên team để hiển thị
                  const team1Name = getTeamDisplayName(team1Id)
                  const team2Name = getTeamDisplayName(team2Id)
                  
                  // Kiểm tra conflicts cho match này
                  const matchConflicts = conflicts.filter(c => 
                    c.match.stage === scheduleItem.stage && 
                    c.match.matchNumber === parseInt(scheduleItem.matchId)
                  )
                  const hasConflict = matchConflicts.length > 0
                  
                  // Kiểm tra warnings cho match này
                  const matchWarnings = warnings.filter(w => 
                    w.match.stage === scheduleItem.stage && 
                    w.match.matchNumber === parseInt(scheduleItem.matchId)
                  )
                  const hasWarning = matchWarnings.length > 0

                  return (
                    <div key={scheduleItem.matchId}>
                      <div 
                        className="schedule-match-item"
                        style={{
                          backgroundColor: (isTeam1Bye || isTeam2Bye) ? '#fef3c7' : (hasConflict ? '#fee2e2' : 'white'),
                          border: (isTeam1Bye || isTeam2Bye) ? '2px solid #f59e0b' : (hasConflict ? '2px solid #ef4444' : (hasWarning ? '2px solid #f59e0b' : '1px solid #e5e7eb'))
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                          <span className="schedule-match-number">
                            #{scheduleItem.matchId}.
                            {(isTeam1Bye || isTeam2Bye) && (
                              <span style={{
                                fontSize: '10px',
                                color: '#92400e',
                                fontWeight: '600',
                                marginLeft: '4px'
                              }}>
                                (BYE)
                              </span>
                            )}
                          </span>
                          
                          <div className="schedule-match-teams" style={{ flex: 1 }}>
                            <span className="schedule-team-name" style={{
                              color: isTeam1Bye ? '#92400e' : '#1f2937',
                              fontWeight: isTeam1Bye ? '600' : '500'
                            }}>
                              {team1Name}
                            </span>
                            <X size={16} className="schedule-team-vs" />
                            <span className="schedule-team-name" style={{
                              color: isTeam2Bye ? '#92400e' : '#1f2937',
                              fontWeight: isTeam2Bye ? '600' : '500'
                            }}>
                              {team2Name}
                            </span>
                          </div>
                        </div>
                        
                        <div className="schedule-match-inputs">
                          <input
                            type="date"
                            className="schedule-input schedule-date"
                            value={scheduleItem.date}
                            onChange={(e) => handleScheduleChange(scheduleItem.matchId, 'date', e.target.value)}
                            onClick={(e) => e.target.showPicker?.()}
                            style={{
                              borderColor: hasConflict ? '#ef4444' : (hasWarning ? '#f59e0b' : undefined)
                            }}
                          />
                          <input
                            type="time"
                            className="schedule-input schedule-time"
                            value={scheduleItem.time || ''}
                            onChange={(e) => handleScheduleChange(scheduleItem.matchId, 'time', e.target.value)}
                            placeholder="Bắt đầu"
                            onClick={(e) => e.target.showPicker?.()}
                            style={{
                              borderColor: hasConflict ? '#ef4444' : (hasWarning ? '#f59e0b' : undefined)
                            }}
                            title="Thời gian bắt đầu"
                          />
                          <input
                            type="time"
                            className="schedule-input schedule-time"
                            value={scheduleItem.endTime || ''}
                            onChange={(e) => handleScheduleChange(scheduleItem.matchId, 'endTime', e.target.value)}
                            placeholder="Kết thúc"
                            onClick={(e) => e.target.showPicker?.()}
                            style={{
                              borderColor: hasConflict ? '#ef4444' : (hasWarning ? '#f59e0b' : undefined)
                            }}
                            title="Thời gian kết thúc"
                          />
                          {tournament?.facility && (
                            <select
                              className="schedule-input schedule-court"
                              value={scheduleItem.courtId || ''}
                              onChange={(e) => handleScheduleChange(scheduleItem.matchId, 'courtId', e.target.value || null)}
                              style={{
                                padding: '8px 12px',
                                border: `1px solid ${hasConflict ? '#ef4444' : (hasWarning ? '#f59e0b' : '#d1d5db')}`,
                                borderRadius: '6px',
                                fontSize: '14px',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                                minWidth: '150px'
                              }}
                            >
                              <option value="">Chọn sân</option>
                              {loadingCourts ? (
                                <option disabled>Đang tải...</option>
                              ) : courts.length === 0 ? (
                                <option disabled>Không có sân</option>
                              ) : (
                                courts.map((court) => (
                                  <option key={court._id || court.id} value={court._id || court.id}>
                                    {court.name || `Sân ${court._id || court.id}`}
                                  </option>
                                ))
                              )}
                            </select>
                          )}
                          
                          {/* Nút hủy lịch đấu cho trận này */}
                          {(scheduleItem.date || scheduleItem.time || scheduleItem.courtId) && (
                            <button
                              onClick={() => handleCancelMatchSchedule(scheduleItem)}
                              disabled={cancellingMatch === scheduleItem.matchId}
                              style={{
                                padding: '8px 12px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: cancellingMatch === scheduleItem.matchId ? 'not-allowed' : 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                opacity: cancellingMatch === scheduleItem.matchId ? 0.6 : 1,
                                flexShrink: 0
                              }}
                              title="Hủy lịch đấu cho trận này"
                            >
                              <Trash2 size={14} />
                              {cancellingMatch === scheduleItem.matchId ? 'Đang hủy...' : 'Hủy'}
                            </button>
                          )}
                        </div>

                        {/* Hiển thị conflicts/warnings cho match này */}
                        {hasConflict && (
                          <div style={{
                            marginTop: '8px',
                            padding: '8px',
                            backgroundColor: '#fee2e2',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#991b1b'
                          }}>
                            {matchConflicts.map((c, idx) => (
                              <div key={idx}>⚠️ {c.message}</div>
                            ))}
                          </div>
                        )}
                        {hasWarning && !hasConflict && (
                          <div style={{
                            marginTop: '8px',
                            padding: '8px',
                            backgroundColor: '#fef3c7',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#92400e'
                          }}>
                            {matchWarnings.map((w, idx) => (
                              <div key={idx}>⚠️ {w.message}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      <div className="schedule-save-section" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          className="btn-save-schedule"
          onClick={handleSaveSchedule}
          disabled={savingSchedule || scheduleData.length === 0}
        >
          <Save size={16} />
          {savingSchedule ? 'Đang lưu...' : 'Lưu'}
        </button>

        {/* Nút chốt lịch thi đấu */}
        {scheduleData.some(item => item.date && item.time && item.courtId) && (
          <button
            onClick={handleConfirmSchedule}
            disabled={confirmingSchedule}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: confirmingSchedule ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: confirmingSchedule ? 0.6 : 1
            }}
            title="Chốt lịch thi đấu để block các khung giờ realtime"
          >
            <Zap size={16} />
            {confirmingSchedule ? 'Đang chốt lịch...' : 'Chốt lịch thi đấu'}
          </button>
        )}

        {/* Nút hủy toàn bộ lịch đấu đã chốt */}
        {scheduleData.some(item => item.date && item.time && item.courtId) && (
          <button
            onClick={handleCancelAllSchedule}
            disabled={cancellingAll}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: cancellingAll ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: cancellingAll ? 0.6 : 1
            }}
            title="Hủy toàn bộ lịch đấu đã chốt"
          >
            <Trash2 size={16} />
            {cancellingAll ? 'Đang hủy...' : 'Hủy toàn bộ lịch đấu'}
          </button>
        )}
      </div>
    </div>
  )
}

export default ScheduleManagementTab

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { leagueApi } from '../../api/leagueApi'
import TournamentFilterBar from './Tournament/components/TournamentFilterBar'
import TournamentViewControls from './Tournament/components/TournamentViewControls'
import TournamentGrid from './Tournament/components/TournamentGrid'
import TournamentList from './Tournament/components/TournamentList'
import '../../styles/Tournament.css'

const Tournament = () => {
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [filters, setFilters] = useState({
    status: 'all', // all, upcoming, starting, ongoing, completed
    sport: 'all', // all, football, basketball, volleyball, etc.
    format: 'all', // all, knockout, round-robin, group-stage
    sort: 'default' // default, updated, views
  })

  // Helper: Tính computedStatus cho tournament (giống logic trong TournamentCard)
  const getComputedStatus = (tournament) => {
    if (!tournament?.endDate) return tournament?.status || 'upcoming'
    
    const now = new Date();
    // Normalize dates để chỉ so sánh ngày (set time về 0:00:00)
    const normalizeDate = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };
    
    const endDate = normalizeDate(tournament.endDate);
    const startDate = tournament.startDate ? normalizeDate(tournament.startDate) : null;
    const nowNormalized = normalizeDate(now);
    
    // Nếu đã bị hủy, giữ nguyên
    if (tournament.status === 'cancelled') {
      return 'cancelled';
    }
    
    // Nếu endDate đã qua, tự động là completed
    if (endDate < nowNormalized) {
      return 'completed';
    }
    
    // Tìm thời gian trận đấu đầu tiên (nếu có matches)
    // Lưu ý: API không trả về matches trong list, nên firstMatchDateTime sẽ luôn null
    let firstMatchDateTime = null;
    if (tournament.matches && Array.isArray(tournament.matches) && tournament.matches.length > 0) {
      const matchesWithSchedule = tournament.matches.filter(
        m => m && m.date && m.time && m.time.trim() !== ''
      );
      
      if (matchesWithSchedule.length > 0) {
        matchesWithSchedule.forEach(match => {
          try {
            const matchDate = new Date(match.date);
            const [hours, minutes] = match.time.split(':').map(Number);
            
            if (!isNaN(hours) && !isNaN(minutes)) {
              const matchDateTime = new Date(matchDate);
              matchDateTime.setHours(hours, minutes, 0, 0);
              
              if (!firstMatchDateTime || matchDateTime < firstMatchDateTime) {
                firstMatchDateTime = matchDateTime;
              }
            }
          } catch (error) {
            // Ignore parsing errors
          }
        });
      }
    }
    
    // Nếu có trận đấu đầu tiên và đã tới thời gian thi đấu, là ongoing
    if (firstMatchDateTime && firstMatchDateTime <= now && endDate >= nowNormalized) {
      return 'ongoing';
    }
    
    // Nếu đã tới startDate nhưng chưa tới thời gian trận đầu tiên, là starting (sắp diễn ra)
    // Vì API không trả về matches trong list, nên firstMatchDateTime sẽ luôn null
    // Nên nếu startDate <= nowNormalized, sẽ trả về 'starting'
    if (startDate && startDate <= nowNormalized && (!firstMatchDateTime || firstMatchDateTime > now)) {
      return 'starting';
    }
    
    // Còn lại là upcoming (chưa tới startDate)
    return tournament.status || 'upcoming';
  }

  // Fetch public tournaments from API
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true)
        
        // Map frontend filters to API params
        // KHÔNG gửi status filter lên API vì cần tính computedStatus ở frontend
        const apiParams = {
          page: 1,
          limit: 100, // Lấy nhiều để filter ở frontend
          // Không gửi status filter vì cần tính computedStatus
          ...(filters.sport !== 'all' && { sport: filters.sport }),
          ...(filters.format !== 'all' && { format: filters.format }),
          ...(searchQuery.trim() && { search: searchQuery.trim() }),
          ...(filters.sort !== 'default' && { sort: filters.sort === 'updated' ? 'updated' : filters.sort === 'views' ? 'views' : 'createdAt' })
        }
        
        const result = await leagueApi.getPublicLeagues(apiParams)
        
        if (result.success) {
          // Map API data to frontend format
          const mappedTournaments = (result.data || []).map(league => ({
            id: league._id || league.id,
            name: league.name,
            sport: league.sport,
            format: league.format === 'Loại Trực Tiếp' ? 'single-elimination' : 
                    league.format === 'Vòng tròn' ? 'round-robin' : league.format,
            image: league.image || league.banner || '/sports-meeting.webp',
            startDate: league.startDate,
            endDate: league.endDate,
            location: league.location || league.facility?.name || '',
            address: league.address || league.facility?.address || '',
            participants: league.participants || 0,
            maxParticipants: league.maxParticipants || 0,
            prize: league.prize || '',
            status: league.status || 'upcoming',
            description: league.description || league.fullDescription || '',
            registrationDeadline: league.registrationDeadline,
            views: league.views || 0,
            createdAt: league.createdAt,
            updatedAt: league.updatedAt,
            creatorName: league.creatorName || league.creator?.name || league.creator?.email || '',
            matches: league.matches || [] // Include matches for computedStatus calculation
          }))
          
          setTournaments(mappedTournaments)
        } else {
          throw new Error(result.message || 'Không thể tải danh sách giải đấu')
        }
      } catch (error) {
        console.error('Error fetching tournaments:', error)
        toast.error(error.message || 'Có lỗi xảy ra khi tải danh sách giải đấu')
        setTournaments([])
      } finally {
        setLoading(false)
      }
    }

    fetchTournaments()
  }, [filters.sport, filters.format, filters.sort, searchQuery])

  // Filter and sort tournaments
  const filteredTournaments = useMemo(() => {
    let filtered = tournaments.filter(tournament => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const nameMatch = tournament.name.toLowerCase().includes(query)
        // Add manager name matching when available
        if (!nameMatch) return false
      }

      // Status filter - sử dụng computedStatus
      if (filters.status !== 'all') {
        const computedStatus = getComputedStatus(tournament)
        if (computedStatus !== filters.status) {
          return false
        }
      }

      // Sport filter
      if (filters.sport !== 'all' && tournament.sport !== filters.sport) {
        return false
      }

      // Format filter (if tournament has format property)
      if (filters.format !== 'all' && tournament.format && tournament.format !== filters.format) {
        return false
      }

      return true
    })

    // Sort tournaments
    if (filters.sort && filters.sort !== 'default') {
      filtered = [...filtered].sort((a, b) => {
        switch (filters.sort) {
          case 'updated':
            // Sort by updatedAt or createdAt (newest updated first)
            const updatedA = new Date(a.updatedAt || a.createdAt || 0)
            const updatedB = new Date(b.updatedAt || b.createdAt || 0)
            return updatedB - updatedA
          case 'views':
            // Sort by views count (most views first)
            return (b.views || 0) - (a.views || 0)
          default:
            return 0
        }
      })
    }

    return filtered
  }, [tournaments, searchQuery, filters])

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const handleSearch = () => {
    // Search is handled by filteredTournaments useMemo
    // This function can be used for additional search logic if needed
  }

  const handleRegister = (tournamentId) => {
    // TODO: Navigate to registration page or show modal
    navigate(`/tournament/${tournamentId}/register`)
  }

  const handleViewDetails = (tournamentId) => {
    navigate(`/tournament/${tournamentId}`)
  }

  return (
    <div className="tournament-page">
      <div className="tournament-container">
        {/* Filter Bar - Gộp search và filters */}
        <TournamentFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          tournaments={tournaments}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearch={handleSearch}
        />

        {/* View Controls */}
        <TournamentViewControls
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sort={filters.sort}
          onSortChange={(value) => handleFilterChange('sort', value)}
        />

        {/* Results Count */}
        {!loading && (
          <div className="results-count">
            Tìm thấy {filteredTournaments.length} giải đấu
          </div>
        )}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
            Đang tải danh sách giải đấu...
          </div>
        ) : (
          <>
            {filteredTournaments.length > 0 ? (
              viewMode === 'grid' ? (
                <TournamentGrid
                  tournaments={filteredTournaments}
                  onRegister={handleRegister}
                  onViewDetails={handleViewDetails}
                />
              ) : (
                <TournamentList
                  tournaments={filteredTournaments}
                  onRegister={handleRegister}
                  onViewDetails={handleViewDetails}
                />
              )
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                Không tìm thấy giải đấu nào phù hợp với bộ lọc đã chọn
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Tournament


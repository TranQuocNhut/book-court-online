import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Calendar, MapPin, Users, 
  Eye, Edit, Trash2, Plus, Search,
  Loader
} from 'lucide-react'
import { toast } from 'react-toastify'
import Dialog from '../../../../components/ui/Dialog'
import { leagueApi } from '../../../../api/leagueApi'
import { facilityApi } from '../../../../api/facilityApi'
import { useAuth } from '../../../../contexts/AuthContext'

export default function MyTournamentsTab() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [loadingFacilities, setLoadingFacilities] = useState(false)

  // Fetch tournaments from API
  useEffect(() => {
    const fetchMyTournaments = async () => {
      try {
        setLoading(true)
        const result = await leagueApi.getLeagues()
        
        if (result.success && result.data) {
          // Map API data to component format
          const mappedTournaments = result.data.map(league => ({
            id: league._id || league.id,
            name: league.name,
            sport: league.sport,
            format: league.format,
            image: league.image || league.banner || '/sports-meeting.webp',
            startDate: league.startDate,
            endDate: league.endDate,
            location: league.location || '',
            address: league.address || '',
            participants: league.participants || 0,
            maxParticipants: league.maxParticipants || 0,
            prize: league.prize || '',
            status: league.status || 'upcoming',
            description: league.description || '',
            registrationDeadline: league.registrationDeadline,
            views: league.views || 0,
            createdAt: league.createdAt,
            updatedAt: league.updatedAt
          }))
          
          setTournaments(mappedTournaments)
        } else {
          setTournaments([])
        }
      } catch (error) {
        console.error('Error fetching tournaments:', error)
        toast.error(error.message || 'Có lỗi xảy ra khi tải danh sách giải đấu')
        setTournaments([])
      } finally {
        setLoading(false)
      }
    }

    fetchMyTournaments()
  }, [])

  // Filter tournaments
  const filteredTournaments = useMemo(() => {
    let filtered = tournaments.filter(tournament => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        if (!tournament.name.toLowerCase().includes(query)) {
          return false
        }
      }

      // Status filter - sử dụng computedStatus
      if (statusFilter !== 'all') {
        const computedStatus = getComputedStatus(tournament)
        if (computedStatus !== statusFilter) {
          return false
        }
      }

      return true
    })

    return filtered
  }, [tournaments, searchQuery, statusFilter])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { 
        text: 'Đang đăng ký', 
        className: 'status-badge status-upcoming'
      },
      starting: { 
        text: 'Sắp diễn ra', 
        className: 'status-badge status-starting'
      },
      ongoing: { 
        text: 'Đang diễn ra', 
        className: 'status-badge status-ongoing'
      },
      completed: { 
        text: 'Đã kết thúc', 
        className: 'status-badge status-completed'
      },
      cancelled: { 
        text: 'Đã hủy', 
        className: 'status-badge status-completed'
      }
    }
    return badges[status] || badges.upcoming
  }

  // Helper: Tìm trận đấu đầu tiên (có date và time sớm nhất)
  const getFirstMatchDateTime = (tournament) => {
    if (!tournament?.matches || tournament.matches.length === 0) {
      return null;
    }

    // Lọc các matches có date và time
    const matchesWithSchedule = tournament.matches.filter(
      m => m.date && m.time && m.time.trim() !== ''
    );

    if (matchesWithSchedule.length === 0) {
      return null;
    }

    // Tìm match có date và time sớm nhất
    let earliestMatch = null;
    let earliestDateTime = null;

    matchesWithSchedule.forEach(match => {
      try {
        const matchDate = new Date(match.date);
        const [hours, minutes] = match.time.split(':').map(Number);
        
        if (!isNaN(hours) && !isNaN(minutes)) {
          const matchDateTime = new Date(matchDate);
          matchDateTime.setHours(hours, minutes, 0, 0);

          if (!earliestDateTime || matchDateTime < earliestDateTime) {
            earliestDateTime = matchDateTime;
            earliestMatch = match;
          }
        }
      } catch (error) {
        console.error('Error parsing match date/time:', error);
      }
    });

    return earliestDateTime;
  };

  // Tính toán status dựa trên thời gian trận đấu đầu tiên
  const getComputedStatus = (tournament) => {
    if (!tournament.endDate) return tournament.status || 'upcoming'
    
    const now = new Date();
    const endDate = new Date(tournament.endDate);
    const startDate = tournament.startDate ? new Date(tournament.startDate) : null;
    
    // Nếu đã bị hủy, giữ nguyên
    if (tournament.status === 'cancelled') {
      return 'cancelled';
    }
    
    // Nếu endDate đã qua, tự động là completed
    if (endDate < now) {
      return 'completed';
    }
    
    // Tìm thời gian trận đấu đầu tiên
    const firstMatchDateTime = getFirstMatchDateTime(tournament);
    
    // Nếu có trận đấu đầu tiên và đã tới thời gian thi đấu, là ongoing
    if (firstMatchDateTime && firstMatchDateTime <= now && endDate >= now) {
      return 'ongoing';
    }
    
    // Nếu đã tới startDate nhưng chưa tới thời gian trận đầu tiên, là starting (sắp diễn ra)
    if (startDate && startDate <= now && (!firstMatchDateTime || firstMatchDateTime > now)) {
      return 'starting';
    }
    
    // Còn lại là upcoming (chưa tới startDate)
    return tournament.status || 'upcoming';
  };

  const handleViewDetails = (tournamentId) => {
    navigate(`/tournament/${tournamentId}`)
  }

  const handleEdit = (tournamentId) => {
    navigate(`/tournament/${tournamentId}?tab=custom`)
  }

  const handleDelete = (tournament) => {
    setSelectedTournament(tournament)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!selectedTournament) return

    try {
      const result = await leagueApi.deleteLeague(selectedTournament.id)
      
      if (result.success) {
        setTournaments(prev => prev.filter(t => t.id !== selectedTournament.id))
        toast.success('Xóa giải đấu thành công')
        setShowDeleteModal(false)
        setSelectedTournament(null)
      } else {
        throw new Error(result.message || 'Không thể xóa giải đấu')
      }
    } catch (error) {
      console.error('Error deleting tournament:', error)
      toast.error(error.message || 'Không thể xóa giải đấu')
    }
  }

  const handleCreateTournament = async () => {
    // Kiểm tra nếu user có role owner hoặc admin
    const isOwner = user && user.role === 'owner'
    const isAdmin = user && user.role === 'admin'
    
    // Nếu là owner hoặc admin, fetch facilities và navigate với facility ID
    if (isOwner || isAdmin) {
      try {
        setLoadingFacilities(true)
        const ownerId = user._id || user.id
        const result = await facilityApi.getFacilities({ ownerId, status: 'opening' })
        
        if (result.success) {
          const facilities = result.data?.facilities || result.data || []
          
          if (facilities.length === 0) {
            toast.error('Bạn chưa có cơ sở nào. Vui lòng tạo cơ sở trước.')
            navigate('/tournament/create')
            return
          }
          
          // Navigate với facility ID đầu tiên
          const facilityId = facilities[0]._id || facilities[0].id
          navigate(`/tournament/create?facility=${facilityId}`)
        } else {
          navigate('/tournament/create')
        }
      } catch (error) {
        console.error('Error fetching owner facilities:', error)
        navigate('/tournament/create')
      } finally {
        setLoadingFacilities(false)
      }
    } else {
      // User thường, navigate đến form tạo giải nội bộ
      navigate('/tournament/create/internal')
    }
  }

  return (
    <div className="my-tournaments-section">
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .my-tournaments-section {
          width: 100%;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .section-header h3 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: #111827;
        }
        .section-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        .search-filter-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .search-input-wrapper {
          flex: 1;
          min-width: 250px;
          position: relative;
        }
        .search-input {
          width: 100%;
          padding: 10px 16px 10px 40px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
        }
        .filter-select {
          min-width: 180px;
          padding: 10px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }
        .view-toggle-group {
          display: flex;
          background: #e5e7eb;
          border-radius: 10px;
          padding: 4px;
          gap: 4px;
        }
        .view-toggle-btn {
          background: transparent;
          border: none;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #6b7280;
        }
        .view-toggle-btn.active {
          background: #111827;
          color: white;
        }
        .results-count {
          margin-bottom: 16px;
          color: #6b7280;
          font-size: 14px;
        }
        .tournaments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }
        .tournaments-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .tournament-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          background: white;
          transition: all 0.3s ease;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .tournament-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
        }
        .tournament-card-list {
          flex-direction: row;
          max-height: 220px;
        }
        .tournament-card-list:hover {
          transform: translateX(4px);
        }
        .tournament-card-image {
          position: relative;
          height: 200px;
          background-size: cover;
          background-position: center;
        }
        .tournament-card-list .tournament-card-image {
          width: 300px;
          min-width: 300px;
          height: 220px;
          flex-shrink: 0;
        }
        .image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.4));
        }
        .tournament-card-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
        }
        .tournament-card-list .tournament-card-content {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
        }
        .tournament-card-main {
          flex: 1;
          min-width: 0;
        }
        .tournament-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .status-upcoming {
          background: #dbeafe;
          color: #1e40af;
        }
        .status-ongoing {
          background: #d1fae5;
          color: #065f46;
        }
        .status-completed {
          background: #f3f4f6;
          color: #374151;
        }
        .tournament-title {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px 0;
          line-height: 1.3;
        }
        .tournament-description {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
          margin: 0 0 12px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .tournament-info {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }
        .tournament-card-list .tournament-info {
          flex-direction: row;
          flex-wrap: wrap;
          border-top: none;
          padding-top: 0;
          gap: 16px;
        }
        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #374151;
        }
        .info-item svg {
          color: #6b7280;
          flex-shrink: 0;
        }
        .tournament-actions {
          display: flex;
          gap: 8px;
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }
        .tournament-card-list .tournament-actions {
          flex-direction: column;
          border-top: none;
          padding-top: 0;
          min-width: 140px;
          flex-shrink: 0;
        }
        .btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .btn-primary {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        .btn-outline {
          background: white;
          color: #374151;
          border: 1px solid #e5e7eb;
        }
        .btn-outline:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }
        .btn-danger {
          background: #fee2e2;
          color: #dc2626;
        }
        .btn-danger:hover {
          background: #fecaca;
        }
        .btn-icon {
          padding: 8px;
          min-width: 36px;
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }
        .empty-state h4 {
          font-size: 18px;
          margin: 0 0 8px 0;
          color: #374151;
        }
        .empty-state p {
          font-size: 14px;
          margin: 0 0 24px 0;
        }
        @media (max-width: 768px) {
          .tournaments-grid {
            grid-template-columns: 1fr;
          }
          .tournament-card-list {
            flex-direction: column;
            max-height: none;
          }
          .tournament-card-list .tournament-card-image {
            width: 100%;
            height: 200px;
          }
          .tournament-card-list .tournament-card-content {
            flex-direction: column;
            align-items: stretch;
          }
          .tournament-card-list .tournament-actions {
            flex-direction: row;
            width: 100%;
          }
        }
      `}</style>

      <div className="section-header">
        <h3>Giải đấu của tôi</h3>
        <div className="section-actions">
          <button 
            className="btn btn-primary" 
            onClick={handleCreateTournament}
            disabled={loadingFacilities}
            style={{ 
              cursor: loadingFacilities ? 'wait' : 'pointer',
              opacity: loadingFacilities ? 0.6 : 1 
            }}
          >
            <Plus size={18} />
            {loadingFacilities ? 'Đang tải...' : 'Tạo giải đấu mới'}
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm giải đấu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="upcoming">Đang đăng ký</option>
          <option value="starting">Sắp diễn ra</option>
          <option value="ongoing">Đang diễn ra</option>
          <option value="completed">Đã kết thúc</option>
        </select>
      </div>

      {/* Results Count */}
      {!loading && (
        <div className="results-count">
          Tìm thấy {filteredTournaments.length} giải đấu
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '60px 20px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <Loader 
            size={32} 
            style={{ 
              color: '#3b82f6',
              animation: 'spin 1s linear infinite'
            }} 
          />
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Đang tải danh sách giải đấu...</p>
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="empty-state">
          <h4>Chưa có giải đấu nào</h4>
          <p>Tạo giải đấu mới để bắt đầu quản lý giải đấu của bạn</p>
        </div>
      ) : (
        <div className="tournaments-list">
          {filteredTournaments.map(tournament => {
            const computedStatus = getComputedStatus(tournament)
            const statusBadge = getStatusBadge(computedStatus)
            return (
              <div 
                key={tournament.id} 
                className="tournament-card tournament-card-list"
              >
                <div 
                  className="tournament-card-image"
                  style={{ backgroundImage: `url(${tournament.image || '/sports-meeting.webp'})` }}
                >
                  <div className="image-overlay" />
                </div>

                <div className="tournament-card-content">
                  <div className="tournament-card-main">
                    <div className="tournament-badges">
                      <span className={statusBadge.className}>
                        {statusBadge.text}
                      </span>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: '#fef3c7',
                        color: '#92400e'
                      }}>
                        {tournament.sport}
                      </span>
                    </div>
                    <h3 className="tournament-title">{tournament.name}</h3>
                    <p className="tournament-description">{tournament.description}</p>

                    <div className="tournament-info">
                      <div className="info-item">
                        <Calendar size={16} />
                        <span>
                          {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                        </span>
                      </div>
                      {(tournament.location || tournament.address) && (
                        <div className="info-item">
                          <MapPin size={16} />
                          <span>{tournament.location || tournament.address}</span>
                        </div>
                      )}
                      <div className="info-item">
                        <Users size={16} />
                        <span>
                          {tournament.participants}/{tournament.maxParticipants} đội
                        </span>
                      </div>
                      {tournament.views !== undefined && (
                        <div className="info-item">
                          <Eye size={16} />
                          <span>{tournament.views.toLocaleString('vi-VN')} lượt xem</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="tournament-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-outline btn-icon"
                      onClick={() => handleViewDetails(tournament.id)}
                      title="Xem chi tiết"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="btn btn-outline btn-icon"
                      onClick={() => handleEdit(tournament.id)}
                      title="Chỉnh sửa"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn btn-danger btn-icon"
                      onClick={() => handleDelete(tournament)}
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedTournament(null)
        }}
        title="Xác nhận xóa giải đấu"
        description={selectedTournament ? `Bạn có chắc chắn muốn xóa giải đấu "${selectedTournament.name}"?` : ''}
        maxWidth="520px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan đến giải đấu sẽ bị xóa vĩnh viễn.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button 
              className="btn btn-outline" 
              onClick={() => {
                setShowDeleteModal(false)
                setSelectedTournament(null)
              }}
            >
              Hủy
            </button>
            <button
              className="btn btn-danger"
              onClick={confirmDelete}
              style={{ background: '#dc2626', color: 'white' }}
            >
              Xác nhận xóa
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}


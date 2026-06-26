import React from 'react'
import { Calendar, MapPin, Users, Clock, Eye } from 'lucide-react'
import { getStatusBadge } from '../../../../utils/tournamentHelpers'

const TournamentCard = ({ tournament, onRegister, onViewDetails, listView = false }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getFormatLabel = (format) => {
    const formats = {
      'single-elimination': 'Loại trực tiếp',
      'round-robin': 'Vòng tròn',
      'knockout': 'Loại trực tiếp',
      'group-stage': 'Chia bảng đấu'
    }
    return formats[format] || format
  }

  // Helper: Tìm trận đấu đầu tiên (có date và time sớm nhất)
  const getFirstMatchDateTime = () => {
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
  const getComputedStatus = () => {
    if (!tournament?.endDate) return tournament?.status || 'upcoming'
    
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
    const firstMatchDateTime = getFirstMatchDateTime();
    
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

  const computedStatus = getComputedStatus();
  const statusBadge = getStatusBadge(computedStatus);
  const isRegistrationOpen = computedStatus === 'upcoming' && 
    tournament.registrationDeadline &&
    new Date(tournament.registrationDeadline) > new Date()
  const isFull = tournament.participants >= tournament.maxParticipants

  const handleCardClick = () => {
    onViewDetails(tournament.id)
  }

  const handleRegisterClick = (e) => {
    e.stopPropagation()
    onRegister(tournament.id)
  }

  return (
    <div 
      className={`tournament-card ${listView ? 'tournament-card-list' : ''}`}
      onClick={handleCardClick}
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
              {computedStatus === 'ongoing' && (
                <span className="relative flex h-2 w-2 mr-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-600 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
                </span>
              )}
              {computedStatus === 'starting' && (
                <span className="relative flex h-2 w-2 mr-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
              )}
              {statusBadge.text}
            </span>
            {tournament.sport && (
              <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 inset-ring inset-ring-yellow-600/20">
                {tournament.sport}
              </span>
            )}
            {tournament.format && (
              <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 inset-ring inset-ring-purple-600/20">
                {getFormatLabel(tournament.format)}
              </span>
            )}
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
            <div className="info-item">
              <MapPin size={16} />
              <span>{tournament.location}</span>
            </div>
            <div className="info-item">
              <Users size={16} />
              <span>
                {tournament.participants}/{tournament.maxParticipants} đội
              </span>
            </div>
            {tournament.registrationDeadline && (
              <div className="info-item">
                <Clock size={16} />
                <span>Đăng ký đến: {formatDate(tournament.registrationDeadline)}</span>
              </div>
            )}
            {tournament.views !== undefined && (
              <div className="info-item">
                <Eye size={16} />
                <span>{tournament.views.toLocaleString('vi-VN')} lượt xem</span>
              </div>
            )}
          </div>
        </div>

        <div className="tournament-actions" onClick={(e) => e.stopPropagation()}>
          {isRegistrationOpen && !isFull ? (
            <button
              className="btn-register"
              onClick={handleRegisterClick}
            >
              Đăng ký ngay
            </button>
          ) : (
            (!isRegistrationOpen || isFull) && (
              <button className="btn-register btn-disabled" disabled>
                Đã hết thời gian đăng ký
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default TournamentCard


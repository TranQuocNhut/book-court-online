import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../../contexts/AuthContext'
import { useTournament } from '../TournamentContext'

const ProtectedScheduleRoute = ({ children }) => {
  const { user } = useAuth()
  const { tournament } = useTournament()

  // Kiểm tra quyền: CHỈ owner của sân mới có quyền quản lý lịch đấu
  const canManageSchedule = React.useMemo(() => {
    if (!user || !tournament) return false
    
    const userId = user._id || user.id
    const facilityOwnerId = tournament.facility?.owner?._id || tournament.facility?.owner?.id || tournament.facility?.owner
    
    // CHỈ kiểm tra nếu là owner của facility (không cho phép creator)
    if (facilityOwnerId && String(facilityOwnerId) === String(userId)) {
      return true
    }
    
    // Nếu user là admin, cũng cho phép
    if (user.role === 'admin') {
      return true
    }
    
    return false
  }, [user, tournament])

  if (!user) {
    return <Navigate to={`/tournament/${tournament?.id || ''}/overview`} replace />
  }

  if (!canManageSchedule) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: 16, marginBottom: 8 }}>
          Bạn không có quyền truy cập quản lý lịch đấu
        </p>
        <p style={{ color: '#9ca3af', fontSize: 14 }}>
          Chỉ chủ sân mới có quyền quản lý lịch đấu
        </p>
      </div>
    )
  }

  return children
}

export default ProtectedScheduleRoute


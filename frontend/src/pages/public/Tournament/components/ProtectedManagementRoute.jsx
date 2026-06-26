import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../../contexts/AuthContext'
import { useTournament } from '../TournamentContext'

const ProtectedManagementRoute = ({ children }) => {
  const { user } = useAuth()
  const { tournament } = useTournament()

  // Kiểm tra quyền: chỉ owner của sân hoặc người tạo giải
  const canManageTournament = React.useMemo(() => {
    if (!user || !tournament) return false
    
    const userId = user._id || user.id
    const creatorId = tournament.creator?._id || tournament.creator?.id || tournament.creator
    const facilityOwnerId = tournament.facility?.owner?._id || tournament.facility?.owner?.id || tournament.facility?.owner
    
    // Kiểm tra nếu là người tạo giải
    if (creatorId && String(creatorId) === String(userId)) {
      return true
    }
    
    // Kiểm tra nếu là owner của facility
    if (facilityOwnerId && String(facilityOwnerId) === String(userId)) {
      return true
    }
    
    return false
  }, [user, tournament])

  if (!user) {
    return <Navigate to={`/tournament/${tournament?.id || ''}/overview`} replace />
  }

  if (!canManageTournament) {
    return <Navigate to={`/tournament/${tournament?.id || ''}/overview`} replace />
  }

  return children
}

export default ProtectedManagementRoute


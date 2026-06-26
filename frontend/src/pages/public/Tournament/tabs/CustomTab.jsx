import React, { Suspense, lazy, useMemo } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../../../contexts/AuthContext'
import ProtectedScheduleRoute from '../components/ProtectedScheduleRoute'

// Lazy load sub-components
const ConfigTab = lazy(() => import('./custom/ConfigTab'))
const TeamsManagementTab = lazy(() => import('./custom/TeamsManagementTab'))
const MatchesTab = lazy(() => import('./custom/MatchesTab'))
const ScheduleManagementTab = lazy(() => import('./custom/ScheduleManagementTab'))

const CustomTab = ({ tournament }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  
  // Get current sub-route
  const currentPath = location.pathname.split('/').pop() || 'config'
  
  // Kiểm tra quyền: CHỈ owner của sân mới có quyền quản lý lịch đấu
  const canManageSchedule = useMemo(() => {
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
  
  const handleSubTabClick = (tab) => {
    navigate(`/tournament/${id}/custom/${tab}`)
  }

  if (!tournament) return null

  return (
    <div className="custom-section">
      <div className="custom-layout">
        {/* Sidebar */}
        <div className="custom-sidebar">
          <div className="sidebar-menu">
            <button
              className={`sidebar-menu-item ${currentPath === 'config' ? 'active' : ''}`}
              onClick={() => handleSubTabClick('config')}
            >
              Cấu hình giải đấu
            </button>
            <button
              className={`sidebar-menu-item ${currentPath === 'teams' ? 'active' : ''}`}
              onClick={() => handleSubTabClick('teams')}
            >
              Quản lý đội
            </button>
            <button
              className={`sidebar-menu-item ${currentPath === 'matches' ? 'active' : ''}`}
              onClick={() => handleSubTabClick('matches')}
            >
              Sắp xếp cặp đấu
            </button>
            {canManageSchedule && (
              <button
                className={`sidebar-menu-item ${currentPath === 'schedule' ? 'active' : ''}`}
                onClick={() => handleSubTabClick('schedule')}
              >
                Quản lý lịch đấu
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="custom-content-wrapper">
          <Suspense fallback={<div>Đang tải...</div>}>
            <Routes>
              <Route index element={<Navigate to="config" replace />} />
              <Route path="config" element={<ConfigTab tournament={tournament} />} />
              <Route path="teams" element={<TeamsManagementTab tournament={tournament} />} />
              <Route path="matches" element={<MatchesTab tournament={tournament} />} />
              <Route path="schedule" element={
                <ProtectedScheduleRoute>
                  <ScheduleManagementTab tournament={tournament} />
                </ProtectedScheduleRoute>
              } />
              <Route path="*" element={<Navigate to="config" replace />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default CustomTab


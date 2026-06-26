import React, { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Users, Phone, User, CheckCircle2, XCircle, Clock, HelpCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import { useTournament } from '../TournamentContext'
import { useAuth } from '../../../../contexts/AuthContext'
import { leagueApi } from '../../../../api/leagueApi'

const RegistrationListTab = ({ tournament }) => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { refreshTournament } = useTournament()
  const { user } = useAuth()
  const [activeStatus, setActiveStatus] = useState('pending')
  const [processingTeamId, setProcessingTeamId] = useState(null)

  if (!tournament) return null

  // Kiểm tra quyền: chỉ owner của sân hoặc người tạo giải mới có thể approve/reject
  const canManageRegistrations = useMemo(() => {
    if (!user || !tournament) return false
    
    const userId = user._id || user.id
    const creatorId = tournament.creator?._id || tournament.creator?.id || tournament.creator
    const facilityOwnerId = tournament.facility?.owner?._id || tournament.facility?.owner?.id || tournament.facility?.owner
    
    if (creatorId && String(creatorId) === String(userId)) {
      return true
    }
    
    if (facilityOwnerId && String(facilityOwnerId) === String(userId)) {
      return true
    }
    
    return false
  }, [user, tournament])

  // Lọc các đội đã đăng ký (có thông tin)
  const registeredTeams = tournament.teams?.filter(team => 
    team.teamNumber || team.contactPhone || team.contactName || (team.members && team.members.length > 0)
  ) || []

  // Đếm số lượng theo từng trạng thái
  const statusCounts = useMemo(() => {
    const counts = {
      pending: 0,
      accepted: 0,
      rejected: 0
    }
    
    registeredTeams.forEach(team => {
      const status = team.registrationStatus || 'pending'
      // Chỉ đếm các status hợp lệ (bỏ qua invited và invitation_rejected)
      if (status === 'pending' || status === 'accepted' || status === 'rejected') {
        if (counts.hasOwnProperty(status)) {
          counts[status]++
        }
      }
    })
    
    return counts
  }, [registeredTeams])

  // Lọc teams theo status (bỏ qua invited và invitation_rejected)
  const filteredTeams = useMemo(() => {
    if (activeStatus === 'all') {
      return registeredTeams.filter(team => {
        const status = team.registrationStatus || 'pending'
        return status === 'pending' || status === 'accepted' || status === 'rejected'
      })
    }
    return registeredTeams.filter(team => {
      const status = team.registrationStatus || 'pending'
      return status === activeStatus && (status === 'pending' || status === 'accepted' || status === 'rejected')
    })
  }, [registeredTeams, activeStatus])

  const formatDateTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes}:${seconds}`
    }
  }

  const maskPhone = (phone) => {
    if (!phone) return ''
    if (phone.length <= 4) return phone
    return '*'.repeat(phone.length - 4) + phone.slice(-4)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        label: 'Đang xét', 
        color: '#8b5cf6', 
        bgColor: '#f3f4f6',
        icon: Clock 
      },
      accepted: { 
        label: 'Chấp nhận', 
        color: '#10b981', 
        bgColor: '#d1fae5',
        icon: CheckCircle2 
      },
      rejected: { 
        label: 'Từ chối', 
        color: '#ef4444', 
        bgColor: '#fee2e2',
        icon: XCircle 
      }
    }
    
    return statusConfig[status] || statusConfig.pending
  }

  const handleApprove = async (teamId) => {
    if (!canManageRegistrations) {
      toast.error('Bạn không có quyền chấp nhận đội đăng ký')
      return
    }

    try {
      setProcessingTeamId(teamId)
      await leagueApi.approveTeamRegistration(id, teamId)
      toast.success('Đã chấp nhận đội đăng ký')
      refreshTournament()
    } catch (error) {
      console.error('Error approving team:', error)
      toast.error(error.message || 'Không thể chấp nhận đội đăng ký')
    } finally {
      setProcessingTeamId(null)
    }
  }

  const handleReject = async (teamId) => {
    if (!canManageRegistrations) {
      toast.error('Bạn không có quyền từ chối đội đăng ký')
      return
    }

    const reason = window.prompt('Nhập lý do từ chối (tùy chọn):')
    if (reason === null) return // User cancelled

    try {
      setProcessingTeamId(teamId)
      await leagueApi.rejectTeamRegistration(id, teamId, reason || '')
      toast.success('Đã từ chối đội đăng ký')
      refreshTournament()
    } catch (error) {
      console.error('Error rejecting team:', error)
      toast.error(error.message || 'Không thể từ chối đội đăng ký')
    } finally {
      setProcessingTeamId(null)
    }
  }

  const handleViewTeam = (teamId) => {
    if (id && teamId) {
      navigate(`/tournament/${id}/teams/${teamId}/info`)
    }
  }

  if (registeredTeams.length === 0) {
    return (
      <div className="section-card">
        <div style={{
          padding: '60px 40px',
          textAlign: 'center',
          color: '#6b7280',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Users size={48} style={{ 
            marginBottom: 16, 
            opacity: 0.5,
            display: 'block',
            margin: '0 auto 16px auto'
          }} />
          <h3 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            color: '#374151',
            marginBottom: 8,
            margin: '0 0 8px 0'
          }}>
            Chưa có đội nào đăng ký
          </h3>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            Hãy đăng ký tham gia giải đấu để trở thành đội đầu tiên!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="section-card">
      {/* Header với nút Hướng dẫn */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
      }}>
        <h2 style={{ 
          fontSize: 24, 
          fontWeight: 700, 
          color: '#1f2937',
          margin: 0
        }}>
          Danh sách đăng ký
        </h2>
        <button
          style={{
            padding: '8px 16px',
            background: '#fbbf24',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
          onClick={() => toast.info('Hướng dẫn sử dụng danh sách đăng ký')}
        >
          <HelpCircle size={16} />
          Hướng dẫn
        </button>
      </div>

      {/* Status Filters */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 24,
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveStatus('pending')}
          style={{
            padding: '10px 20px',
            background: activeStatus === 'pending' ? '#8b5cf6' : '#f3f4f6',
            color: activeStatus === 'pending' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          Đang xét: {statusCounts.pending}
        </button>
        <button
          onClick={() => setActiveStatus('accepted')}
          style={{
            padding: '10px 20px',
            background: activeStatus === 'accepted' ? '#10b981' : '#f3f4f6',
            color: activeStatus === 'accepted' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          Chấp nhận: {statusCounts.accepted}
        </button>
        <button
          onClick={() => setActiveStatus('rejected')}
          style={{
            padding: '10px 20px',
            background: activeStatus === 'rejected' ? '#ef4444' : '#f3f4f6',
            color: activeStatus === 'rejected' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          Từ chối: {statusCounts.rejected}
        </button>
      </div>

      {/* Table */}
      <div style={{
        background: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #e5e7eb'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{
              background: '#f9fafb',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                borderRight: '1px solid #e5e7eb'
              }}>#</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                borderRight: '1px solid #e5e7eb'
              }}>Tên Đội</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                borderRight: '1px solid #e5e7eb'
              }}>Thành Viên</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                borderRight: '1px solid #e5e7eb'
              }}>Người Liên Hệ</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                borderRight: '1px solid #e5e7eb'
              }}>SĐT Liên Hệ</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                borderRight: '1px solid #e5e7eb'
              }}>T/G Đăng Ký</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: 14,
                fontWeight: 600,
                color: '#374151'
              }}>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.length === 0 ? (
              <tr>
                <td colSpan="7" style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  Không có đội nào với trạng thái này
                </td>
              </tr>
            ) : (
              filteredTeams.map((team, index) => {
                const statusConfig = getStatusBadge(team.registrationStatus || 'pending')
                const StatusIcon = statusConfig.icon
                const dateTime = formatDateTime(team.registeredAt || team.createdAt)
                const membersCount = team.members?.length || 0
                
                return (
                  <tr 
                    key={team.id || team._id}
                    style={{
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                  >
                    <td style={{
                      padding: '16px',
                      borderRight: '1px solid #e5e7eb',
                      fontSize: 14,
                      color: '#374151'
                    }}>
                      {index + 1}
                    </td>
                    <td style={{
                      padding: '16px',
                      borderRight: '1px solid #e5e7eb'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                      }}>
                        <img 
                          src={team.logo || '/team.png'} 
                          alt={team.teamNumber || 'Team'}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            objectFit: 'cover',
                            border: '1px solid #e5e7eb'
                          }}
                        />
                        <span style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: '#1f2937',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleViewTeam(team.id || team._id)}
                        >
                          {team.teamNumber || `Đội #${team.id || team._id}`}
                        </span>
                      </div>
                    </td>
                    <td style={{
                      padding: '16px',
                      borderRight: '1px solid #e5e7eb',
                      fontSize: 14,
                      color: '#374151'
                    }}>
                      {membersCount}
                    </td>
                    <td style={{
                      padding: '16px',
                      borderRight: '1px solid #e5e7eb',
                      fontSize: 14,
                      color: '#374151'
                    }}>
                      {team.contactName || '-'}
                    </td>
                    <td style={{
                      padding: '16px',
                      borderRight: '1px solid #e5e7eb',
                      fontSize: 14,
                      color: '#374151',
                      fontFamily: 'monospace'
                    }}>
                      {maskPhone(team.contactPhone || '')}
                    </td>
                    <td style={{
                      padding: '16px',
                      borderRight: '1px solid #e5e7eb',
                      fontSize: 14,
                      color: '#374151'
                    }}>
                      {dateTime.date ? (
                        <div>
                          <div>{dateTime.date}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{dateTime.time}</div>
                        </div>
                      ) : '-'}
                    </td>
                    <td style={{
                      padding: '16px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        <button
                          style={{
                            padding: '6px 12px',
                            background: statusConfig.bgColor,
                            color: statusConfig.color,
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: 'default'
                          }}
                        >
                          <StatusIcon size={14} />
                          {statusConfig.label}
                        </button>
                        {canManageRegistrations && (team.registrationStatus || 'pending') === 'pending' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => handleApprove(team.id || team._id)}
                              disabled={processingTeamId === (team.id || team._id)}
                              style={{
                                padding: '4px 8px',
                                background: '#10b981',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                fontSize: 12,
                                cursor: processingTeamId === (team.id || team._id) ? 'not-allowed' : 'pointer',
                                opacity: processingTeamId === (team.id || team._id) ? 0.6 : 1
                              }}
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleReject(team.id || team._id)}
                              disabled={processingTeamId === (team.id || team._id)}
                              style={{
                                padding: '4px 8px',
                                background: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                fontSize: 12,
                                cursor: processingTeamId === (team.id || team._id) ? 'not-allowed' : 'pointer',
                                opacity: processingTeamId === (team.id || team._id) ? 0.6 : 1
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RegistrationListTab

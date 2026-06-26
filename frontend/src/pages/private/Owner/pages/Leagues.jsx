import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, MapPin, Calendar, Users, Trophy, Building2, Award, Eye, User, Phone, Clock, Settings, Plus } from 'lucide-react'
import { toast } from 'react-toastify'
import { leagueApi } from '../../../../api/leagueApi'
import { facilityApi } from '../../../../api/facilityApi'
import { categoryApi } from '../../../../api/categoryApi'
import { userApi } from '../../../../api/userApi'
import { useAuth } from '../../../../contexts/AuthContext'
import LeagueDetailModal from '../modals/LeagueDetailModal'
import RejectLeagueModal from '../modals/RejectLeagueModal'
import AssignCourtModal from '../modals/AssignCourtModal'

const Leagues = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)
  const [mainTab, setMainTab] = useState('list') // 'list' or 'config'
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedLeague, setSelectedLeague] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [isAssignCourtModalOpen, setIsAssignCourtModalOpen] = useState(false)
  const [resolvedFacilityId, setResolvedFacilityId] = useState(null)
  const [ownerFacilities, setOwnerFacilities] = useState([])
  const [loadingFacilities, setLoadingFacilities] = useState(false)
  const [courtTypes, setCourtTypes] = useState([])
  const [loadingCourtTypes, setLoadingCourtTypes] = useState(false)
  const [courtTypeFees, setCourtTypeFees] = useState({}) // { courtTypeId: fee }
  const [serviceFee, setServiceFee] = useState('') // Phí tạo giải
  const [refereeFee, setRefereeFee] = useState('') // Phí trọng tài
  const [registrationFee, setRegistrationFee] = useState('') // Phí đăng ký
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)

  useEffect(() => {
    fetchLeagues()
    if (user) {
      fetchOwnerFacilities()
    }
  }, [activeTab, mainTab, user])

  useEffect(() => {
    if (mainTab === 'config' && ownerFacilities.length > 0) {
      fetchCourtTypes()
    }
  }, [mainTab, ownerFacilities])

  useEffect(() => {
    // Chỉ fetch config khi user đã load và là owner, và đang ở tab config
    // Đợi courtTypes được fetch xong (loadingCourtTypes = false) trước khi load config
    if (mainTab === 'config' && user && user.role === 'owner' && ownerFacilities.length > 0 && !loadingCourtTypes) {
      fetchTournamentFeeConfig()
    }
  }, [mainTab, user, ownerFacilities, loadingCourtTypes])

  const fetchOwnerFacilities = async () => {
    try {
      if (!user?._id) return
      setLoadingFacilities(true)
      const ownerId = user._id || user.id
      const result = await facilityApi.getFacilities({ ownerId, status: 'opening' })
      if (result.success) {
        const facilities = result.data?.facilities || result.data || []
        setOwnerFacilities(facilities)
      }
    } catch (error) {
      console.error('Error fetching owner facilities:', error)
    } finally {
      setLoadingFacilities(false)
    }
  }

  const fetchCourtTypes = async () => {
    try {
      setLoadingCourtTypes(true)
      
      // Lấy danh sách các môn thể thao từ các cơ sở của owner
      const facilitySportTypes = new Set()
      ownerFacilities.forEach(facility => {
        if (facility.types && Array.isArray(facility.types)) {
          facility.types.forEach(type => {
            if (type && typeof type === 'string') {
              facilitySportTypes.add(type.trim())
            }
          })
        }
      })

      if (facilitySportTypes.size === 0) {
        setCourtTypes([])
        return
      }

      // Fetch tất cả sport categories để tạo map ID -> name
      const categoriesResult = await categoryApi.getSportCategories({ status: 'active' })
      const sportCategoryMap = new Map() // Map: categoryName -> categoryIds
      
      if (categoriesResult.success) {
        const categories = Array.isArray(categoriesResult.data) 
          ? categoriesResult.data 
          : []
        
        categories.forEach(cat => {
          const catName = cat.name
          const catId = cat._id || cat.id
          if (facilitySportTypes.has(catName)) {
            // Lưu cả ID và name để so sánh
            sportCategoryMap.set(catName, catId)
            sportCategoryMap.set(catId.toString(), catName)
          }
        })
      }

      if (sportCategoryMap.size === 0) {
        setCourtTypes([])
        return
      }

      // Fetch tất cả court types
      const result = await categoryApi.getCourtTypes({ status: 'active' })
      if (result.success) {
        const allTypes = Array.isArray(result.data) 
          ? result.data 
          : result.data?.courtTypes || []
        
        // Lọc các court types có sportCategory thuộc các môn thể thao trong cơ sở
        const filteredTypes = allTypes.filter(courtType => {
          if (!courtType.sportCategory) return false
          
          // Nếu sportCategory đã được populate (là object với name)
          if (typeof courtType.sportCategory === 'object' && courtType.sportCategory.name) {
            return facilitySportTypes.has(courtType.sportCategory.name)
          }
          
          // Nếu sportCategory là ID hoặc object có _id
          const categoryId = typeof courtType.sportCategory === 'object'
            ? (courtType.sportCategory._id || courtType.sportCategory.id)
            : courtType.sportCategory
          
          if (categoryId) {
            const categoryName = sportCategoryMap.get(categoryId.toString())
            return categoryName && facilitySportTypes.has(categoryName)
          }
          
          return false
        })
        
        setCourtTypes(filteredTypes)
        // Initialize fees object, preserve existing values
        // Chỉ thêm các courtType mới, không reset các giá trị đã có
        setCourtTypeFees(prevFees => {
          const newFees = { ...prevFees }
          filteredTypes.forEach(type => {
            const typeId = type._id || type.id
            // Chỉ set rỗng nếu chưa có giá trị (không overwrite giá trị đã có)
            if (!(typeId in newFees) || !newFees[typeId]) {
              newFees[typeId] = prevFees[typeId] || ''
            }
          })
          // Xóa các courtType không còn trong danh sách
          Object.keys(newFees).forEach(typeId => {
            if (!filteredTypes.some(type => (type._id || type.id) === typeId)) {
              delete newFees[typeId]
            }
          })
          return newFees
        })
      }
    } catch (error) {
      console.error('Error fetching court types:', error)
      toast.error('Không thể tải danh sách loại sân')
    } finally {
      setLoadingCourtTypes(false)
    }
  }

  const handleCourtTypeFeeChange = (courtTypeId, value) => {
    const parsed = parseCurrency(value)
    setCourtTypeFees(prev => ({
      ...prev,
      [courtTypeId]: parsed
    }))
  }

  // Helper functions để format số tiền
  const formatCurrency = (value) => {
    if (!value && value !== 0) return ''
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/\./g, '')) : value
    if (isNaN(numValue) || numValue === 0) return ''
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue)
  }

  const parseCurrency = (value) => {
    if (!value) return ''
    // Loại bỏ tất cả dấu chấm và khoảng trắng, chỉ giữ lại số
    const cleaned = value.toString().replace(/\./g, '').replace(/\s/g, '').replace(/[^\d]/g, '')
    return cleaned
  }

  const handleCurrencyInputChange = (value, setter) => {
    // Cho phép nhập tự do khi đang gõ, chỉ lưu số
    const parsed = parseCurrency(value)
    setter(parsed)
  }

  const handleCurrencyInputBlur = (value, setter) => {
    // Format khi blur
    const parsed = parseCurrency(value)
    setter(parsed)
  }

  const fetchTournamentFeeConfig = async () => {
    // Kiểm tra user có phải owner không trước khi gọi API
    if (!user || user.role !== 'owner') {
      return
    }

    try {
      setLoadingConfig(true)
      const result = await userApi.getTournamentFeeConfig()
      
      if (result.success && result.data) {
        const config = result.data
        // Set registration fee
        if (config.registrationFee) {
          setRegistrationFee(config.registrationFee.toString())
        }
        // Set internal tournament fees
        if (config.internalTournamentFees) {
          if (config.internalTournamentFees.serviceFee) {
            setServiceFee(config.internalTournamentFees.serviceFee.toString())
          }
          if (config.internalTournamentFees.refereeFee) {
            setRefereeFee(config.internalTournamentFees.refereeFee.toString())
          }
          // Set court type fees
          if (config.internalTournamentFees.courtTypeFees) {
            const fees = {}
            Object.entries(config.internalTournamentFees.courtTypeFees).forEach(([courtTypeId, fee]) => {
              // Lưu dưới dạng string để formatCurrency có thể format
              fees[courtTypeId] = fee ? fee.toString() : ''
            })
            setCourtTypeFees(fees)
          }
        }
      }
    } catch (error) {
      // Không hiển thị toast vì đây là lần đầu load, có thể chưa có config
      if (error.status !== 403) {
        console.error('Error fetching tournament fee config:', error)
      }
    } finally {
      setLoadingConfig(false)
    }
  }

  const saveTournamentFeeConfig = async () => {
    try {
      setSavingConfig(true)
      
      // Kiểm tra user có phải owner không
      if (!user || user.role !== 'owner') {
        toast.error('Chỉ owner mới có thể lưu cấu hình phí giải đấu')
        return
      }
      
      // Prepare config data
      const config = {
        registrationFee: registrationFee ? parseInt(registrationFee) : 0,
        internalTournamentFees: {
          serviceFee: serviceFee ? parseInt(serviceFee) : 0,
          refereeFee: refereeFee ? parseInt(refereeFee) : 0,
          courtTypeFees: {}
        }
      }

      // Convert courtTypeFees to numbers
      Object.entries(courtTypeFees).forEach(([courtTypeId, fee]) => {
        // fee có thể là string (từ parseCurrency) hoặc number (từ load)
        const feeValue = typeof fee === 'string' ? parseInt(fee) || 0 : fee || 0
        if (feeValue > 0) {
          config.internalTournamentFees.courtTypeFees[courtTypeId] = feeValue
        }
      })

      const result = await userApi.updateTournamentFeeConfig(config)
      
      if (result.success) {
        toast.success('Lưu cấu hình phí giải đấu thành công!')
      } else {
        throw new Error(result.message || 'Lưu cấu hình thất bại')
      }
    } catch (error) {
      console.error('Error saving tournament fee config:', error)
      if (error.status === 403) {
        toast.error('Bạn không có quyền lưu cấu hình phí giải đấu')
      } else {
        toast.error(error.message || 'Không thể lưu cấu hình phí giải đấu')
      }
    } finally {
      setSavingConfig(false)
    }
  }

  const handleCreateTournament = () => {
    if (ownerFacilities.length === 0) {
      toast.error('Bạn chưa có cơ sở nào. Vui lòng tạo cơ sở trước.')
      return
    }
    
    if (ownerFacilities.length === 1) {
      // Nếu chỉ có 1 facility, navigate với facility ID
      navigate(`/tournament/create?facility=${ownerFacilities[0]._id || ownerFacilities[0].id}`)
    } else {
      // Nếu có nhiều facility, navigate với facility đầu tiên (có thể cải thiện sau)
      navigate(`/tournament/create?facility=${ownerFacilities[0]._id || ownerFacilities[0].id}`)
    }
  }

  const fetchLeagues = async () => {
    try {
      setLoading(true)
      let result
      // Nếu đang ở tab config, fetch tất cả leagues để hiển thị thống kê
      if (mainTab === 'config') {
        result = await leagueApi.getOwnerLeagues()
      } else if (activeTab === 'pending') {
        result = await leagueApi.getPendingLeagues()
      } else {
        result = await leagueApi.getOwnerLeagues({ approvalStatus: activeTab === 'all' ? undefined : activeTab })
      }
      
      if (result.success) {
        setLeagues(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching leagues:', error)
      toast.error(error.message || 'Không thể tải danh sách giải đấu')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (leagueId) => {
    try {
      const result = await leagueApi.approveLeague(leagueId)
      if (result.success) {
        toast.success('Đã duyệt giải đấu thành công')
        fetchLeagues()
      }
    } catch (error) {
      console.error('Error approving league:', error)
      toast.error(error.message || 'Không thể duyệt giải đấu')
    }
  }

  const handleReject = async (reason) => {
    if (!selectedLeague) return
    
    try {
      const result = await leagueApi.rejectLeague(selectedLeague._id || selectedLeague.id, reason)
      if (result.success) {
        toast.success('Đã từ chối giải đấu')
        setIsRejectModalOpen(false)
        setSelectedLeague(null)
        fetchLeagues()
      }
    } catch (error) {
      console.error('Error rejecting league:', error)
      toast.error(error.message || 'Không thể từ chối giải đấu')
    }
  }

  const handleAssignCourt = async (courtId) => {
    if (!selectedLeague) return

    try {
      const result = await leagueApi.assignCourtToLeague(selectedLeague._id || selectedLeague.id, courtId)
      if (result.success) {
        toast.success('Đã chốt sân cho giải đấu thành công')
        setIsAssignCourtModalOpen(false)
        setSelectedLeague(null)
        fetchLeagues()
      }
    } catch (error) {
      console.error('Error assigning court:', error)
      toast.error(error.message || 'Không thể chốt sân')
    }
  }

  const openRejectModal = (league) => {
    setSelectedLeague(league)
    setIsRejectModalOpen(true)
  }

  const openAssignCourtModal = async (league) => {
    setSelectedLeague(league)
    
    // Nếu chưa có facilityId nhưng có location, tìm facility theo tên
    let facilityId = league?.facility?._id || league?.facility || null
    
    if (!facilityId && league?.location) {
      try {
        const result = await facilityApi.getFacilities({ 
          search: league.location,
          limit: 1 
        })
        
        if (result.success && result.data?.facilities?.length > 0) {
          const facility = result.data.facilities.find(f => 
            f.name === league.location || f.name.includes(league.location)
          )
          if (facility) {
            facilityId = facility._id || facility.id
          }
        }
      } catch (error) {
        console.error('Error finding facility by location:', error)
      }
    }
    
    setResolvedFacilityId(facilityId)
    setIsAssignCourtModalOpen(true)
  }

  const openDetailModal = (league) => {
    setSelectedLeague(league)
    setIsDetailModalOpen(true)
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Chờ duyệt', bg: '#fef3c7', color: '#92400e' },
      approved: { label: 'Đã duyệt', bg: '#d1fae5', color: '#065f46' },
      rejected: { label: 'Đã từ chối', bg: '#fee2e2', color: '#991b1b' }
    }
    const badge = badges[status] || badges.pending
    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          background: badge.bg,
          color: badge.color
        }}
      >
        {badge.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: '4px solid #e5e7eb',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}
          />
          <p style={{ color: '#6b7280', fontSize: 14 }}>Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>Quản lý giải đấu</h1>
        {mainTab === 'list' && (
          <button
            onClick={handleCreateTournament}
            disabled={loadingFacilities}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              background: '#3b82f6',
              border: 'none',
              cursor: loadingFacilities ? 'not-allowed' : 'pointer',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s',
              opacity: loadingFacilities ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loadingFacilities) {
                e.target.style.background = '#2563eb'
              }
            }}
            onMouseLeave={(e) => {
              if (!loadingFacilities) {
                e.target.style.background = '#3b82f6'
              }
            }}
          >
            <Plus size={18} />
            Tạo giải đấu
          </button>
        )}
      </div>

      {/* Main Tabs */}
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 6px 20px rgba(0,0,0,.06)',
          marginBottom: 16,
        }}
      >
        <div style={{ borderBottom: '1px solid #e5e7eb' }}>
          <nav style={{ display: 'flex', marginBottom: -1 }}>
            <button
              onClick={() => setMainTab('list')}
              style={{
                padding: '16px 24px',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                borderBottom: mainTab === 'list' ? '2px solid #3b82f6' : '2px solid transparent',
                color: mainTab === 'list' ? '#3b82f6' : '#6b7280',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (mainTab !== 'list') {
                  e.target.style.color = '#374151'
                }
              }}
              onMouseLeave={(e) => {
                if (mainTab !== 'list') {
                  e.target.style.color = '#6b7280'
                }
              }}
            >
              Danh sách giải
            </button>
            <button
              onClick={() => setMainTab('config')}
              style={{
                padding: '16px 24px',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                borderBottom: mainTab === 'config' ? '2px solid #3b82f6' : '2px solid transparent',
                color: mainTab === 'config' ? '#3b82f6' : '#6b7280',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (mainTab !== 'config') {
                  e.target.style.color = '#374151'
                }
              }}
              onMouseLeave={(e) => {
                if (mainTab !== 'config') {
                  e.target.style.color = '#6b7280'
                }
              }}
            >
              Cấu hình giải đấu
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {mainTab === 'list' ? (
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 6px 20px rgba(0,0,0,.06)',
          }}
        >
          {/* Sub Tabs */}
          <div style={{ borderBottom: '1px solid #e5e7eb' }}>
            <nav style={{ display: 'flex', marginBottom: -1 }}>
              <button
                onClick={() => setActiveTab('pending')}
                style={{
                  padding: '16px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  border: 'none',
                  borderBottom: activeTab === 'pending' ? '2px solid #3b82f6' : '2px solid transparent',
                  color: activeTab === 'pending' ? '#3b82f6' : '#6b7280',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'pending') {
                    e.target.style.color = '#374151'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'pending') {
                    e.target.style.color = '#6b7280'
                  }
                }}
              >
                Chờ duyệt {activeTab === 'pending' && `(${leagues.length})`}
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                style={{
                  padding: '16px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  border: 'none',
                  borderBottom: activeTab === 'approved' ? '2px solid #3b82f6' : '2px solid transparent',
                  color: activeTab === 'approved' ? '#3b82f6' : '#6b7280',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'approved') {
                    e.target.style.color = '#374151'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'approved') {
                    e.target.style.color = '#6b7280'
                  }
                }}
              >
                Đã duyệt {activeTab === 'approved' && `(${leagues.length})`}
              </button>
              <button
                onClick={() => setActiveTab('rejected')}
                style={{
                  padding: '16px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  border: 'none',
                  borderBottom: activeTab === 'rejected' ? '2px solid #3b82f6' : '2px solid transparent',
                  color: activeTab === 'rejected' ? '#3b82f6' : '#6b7280',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'rejected') {
                    e.target.style.color = '#374151'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'rejected') {
                    e.target.style.color = '#6b7280'
                  }
                }}
              >
                Đã từ chối {activeTab === 'rejected' && `(${leagues.length})`}
              </button>
            </nav>
          </div>

        {/* Content */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                <th
                  style={{
                    padding: 12,
                    fontSize: 13,
                    color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: 600,
                  }}
                >
                  Tên giải đấu
                </th>
                <th
                  style={{
                    padding: 12,
                    fontSize: 13,
                    color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: 600,
                  }}
                >
                  Môn thể thao
                </th>
                <th
                  style={{
                    padding: 12,
                    fontSize: 13,
                    color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: 600,
                  }}
                >
                  Ngày bắt đầu
                </th>
                <th
                  style={{
                    padding: 12,
                    fontSize: 13,
                    color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: 600,
                  }}
                >
                  Ngày kết thúc
                </th>
                <th
                  style={{
                    padding: 12,
                    fontSize: 13,
                    color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: 600,
                  }}
                >
                  Số đội
                </th>
                <th
                  style={{
                    padding: 12,
                    fontSize: 13,
                    color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: 600,
                  }}
                >
                  SĐT
                </th>
                <th
                  style={{
                    padding: 12,
                    fontSize: 13,
                    color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: 600,
                  }}
                >
                  Người tạo
                </th>
                <th
                  style={{
                    padding: 12,
                    fontSize: 13,
                    color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: 600,
                  }}
                >
                  Trạng thái
                </th>
                <th
                  style={{
                    padding: 12,
                    fontSize: 13,
                    color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {leagues.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>
                    <Trophy size={48} color="#9ca3af" style={{ margin: '0 auto 16px', display: 'block' }} />
                    <p style={{ margin: 0, fontSize: 14 }}>Không có giải đấu nào</p>
                  </td>
                </tr>
              ) : (
                leagues.map((league) => (
                  <tr
                    key={league._id || league.id}
                    style={{
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f9fafb'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <td style={{ padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                          {league.name}
                        </span>
                      </div>
                      {league.rejectionReason && (
                        <div
                          style={{
                            marginTop: 8,
                            padding: 8,
                            background: '#fee2e2',
                            border: '1px solid #fecaca',
                            borderRadius: 6,
                            fontSize: 12,
                            color: '#991b1b',
                          }}
                        >
                          <strong>Lý do:</strong> {league.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Users size={14} color="#6b7280" />
                        <span style={{ fontSize: 14, color: '#374151' }}>{league.sport || 'N/A'}</span>
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      {league.startDate ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={14} color="#6b7280" />
                          <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
                            {new Date(league.startDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 14, color: '#9ca3af' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: 12 }}>
                      {league.endDate ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={14} color="#6b7280" />
                          <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
                            {new Date(league.endDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 14, color: '#9ca3af' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Trophy size={14} color="#6b7280" />
                        <span style={{ fontSize: 14, color: '#374151' }}>
                          {league.maxParticipants ? `${league.maxParticipants}` : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      {league.phone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Phone size={14} color="#6b7280" />
                          <span style={{ fontSize: 14, color: '#374151' }}>{league.phone}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 14, color: '#9ca3af' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: 12 }}>
                      {league.creator ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={14} color="#6b7280" />
                          <span style={{ fontSize: 14, color: '#374151' }}>
                            {league.creator.name || league.creator.email || 'N/A'}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 14, color: '#9ca3af' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: 12 }}>
                      {getStatusBadge(league.approvalStatus)}
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => openDetailModal(league)}
                          style={{
                            padding: '6px 12px',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#3b82f6',
                            background: 'transparent',
                            border: '1px solid #3b82f6',
                            cursor: 'pointer',
                            borderRadius: 6,
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#eff6ff'
                            e.target.style.borderColor = '#2563eb'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'transparent'
                            e.target.style.borderColor = '#3b82f6'
                          }}
                        >
                          Chi tiết
                        </button>
                        
                        {league.approvalStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(league._id || league.id)}
                              style={{
                                padding: '6px 12px',
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#fff',
                                background: '#10b981',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#059669'
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = '#10b981'
                              }}
                            >
                              <CheckCircle2 size={14} />
                              Duyệt
                            </button>
                            <button
                              onClick={() => openRejectModal(league)}
                              style={{
                                padding: '6px 12px',
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#fff',
                                background: '#ef4444',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#dc2626'
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = '#ef4444'
                              }}
                            >
                              <XCircle size={14} />
                              Từ chối
                            </button>
                          </>
                        )}

                        {league.approvalStatus === 'approved' && !league.courtId && (
                          <button
                            onClick={() => openAssignCourtModal(league)}
                            style={{
                              padding: '6px 12px',
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#fff',
                              background: '#3b82f6',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#2563eb'
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = '#3b82f6'
                            }}
                          >
                            <MapPin size={14} />
                            Chốt sân
                          </button>
                        )}

                        {league.approvalStatus === 'approved' && (
                          <button
                            onClick={() => navigate(`/tournament/${league._id || league.id}/custom/matches`)}
                            style={{
                              padding: '6px 12px',
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#fff',
                              background: '#8b5cf6',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#7c3aed'
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = '#8b5cf6'
                            }}
                          >
                            <Settings size={14} />
                            Quản lý
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 6px 20px rgba(0,0,0,.06)',
            padding: 24,
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              Cấu hình phí giải đấu
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280' }}>
              Quản lý và cấu hình các loại phí cho giải đấu
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                padding: 20,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                background: '#f9fafb',
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
                Phí đăng ký tham gia giải đấu
              </h3>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
                Cấu hình phí đăng ký tham gia cho các giải đấu mới
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                    Phí đăng ký mặc định (VNĐ)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type="text"
                      placeholder="Nhập số tiền"
                      value={registrationFee ? formatCurrency(registrationFee) : ''}
                      onChange={(e) => handleCurrencyInputChange(e.target.value, setRegistrationFee)}
                      onBlur={(e) => handleCurrencyInputBlur(e.target.value, setRegistrationFee)}
                      style={{
                        width: 200,
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        fontSize: 14,
                      }}
                    />
                    <span style={{ fontSize: 14, color: '#6b7280' }}>VNĐ</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                    Phí này sẽ được áp dụng mặc định cho các giải đấu mới
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: 20,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                background: '#f9fafb',
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
                Phí tổ chức giải đấu nội bộ
              </h3>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
                Cấu hình các loại phí liên quan đến tổ chức giải đấu
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                    1. Phí tạo giải (Service Fee)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type="text"
                      placeholder="Nhập số tiền"
                      value={serviceFee ? formatCurrency(serviceFee) : ''}
                      onChange={(e) => handleCurrencyInputChange(e.target.value, setServiceFee)}
                      onBlur={(e) => handleCurrencyInputBlur(e.target.value, setServiceFee)}
                      style={{
                        width: 200,
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        fontSize: 14,
                      }}
                    />
                    <span style={{ fontSize: 14, color: '#6b7280' }}>VNĐ/giải</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                    Phí cơ bản để mở giải. Mang tính phí nền tảng hoặc phí chủ sân. Ví dụ: 20.000đ – 50.000đ/giải
                  </p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                    2. Phí sử dụng sân cho từng trận
                  </label>
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                    Trận nào cũng cần thuê giờ sân. Tính theo giờ sân + loại sân. Cấu hình phí cho từng loại sân:
                  </p>
                  {loadingCourtTypes ? (
                    <p style={{ fontSize: 13, color: '#6b7280' }}>Đang tải danh sách loại sân...</p>
                  ) : courtTypes.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#9ca3af' }}>Chưa có loại sân nào</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {courtTypes.map((courtType) => {
                        const courtTypeId = courtType._id || courtType.id
                        return (
                          <div
                            key={courtTypeId}
                            style={{
                              padding: 12,
                              border: '1px solid #e5e7eb',
                              borderRadius: 8,
                              background: '#fff',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                              <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                                  {courtType.name}
                                </label>
                                {courtType.description && (
                                  <p style={{ fontSize: 12, color: '#6b7280' }}>{courtType.description}</p>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <input
                                  type="text"
                                  placeholder="Nhập số tiền"
                                  value={courtTypeFees[courtTypeId] ? formatCurrency(courtTypeFees[courtTypeId]) : ''}
                                  onChange={(e) => handleCourtTypeFeeChange(courtTypeId, e.target.value)}
                                  onBlur={(e) => {
                                    const parsed = parseCurrency(e.target.value)
                                    // Luôn update state, kể cả khi parsed là empty string
                                    handleCourtTypeFeeChange(courtTypeId, parsed)
                                  }}
                                  style={{
                                    width: 180,
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    fontSize: 14,
                                  }}
                                />
                                <span style={{ fontSize: 14, color: '#6b7280', whiteSpace: 'nowrap' }}>VNĐ/giờ</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                    3. Phí trọng tài (VNĐ/trận)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type="text"
                      placeholder="Nhập số tiền"
                      value={refereeFee ? formatCurrency(refereeFee) : ''}
                      onChange={(e) => handleCurrencyInputChange(e.target.value, setRefereeFee)}
                      onBlur={(e) => handleCurrencyInputBlur(e.target.value, setRefereeFee)}
                      style={{
                        width: 200,
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        fontSize: 14,
                      }}
                    />
                    <span style={{ fontSize: 14, color: '#6b7280' }}>VNĐ/trận</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <button
                style={{
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#e5e7eb'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f3f4f6'
                }}
              >
                Hủy
              </button>
              <button
                onClick={saveTournamentFeeConfig}
                disabled={savingConfig || loadingConfig}
                style={{
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                  background: savingConfig || loadingConfig ? '#9ca3af' : '#3b82f6',
                  border: 'none',
                  borderRadius: 8,
                  cursor: savingConfig || loadingConfig ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!savingConfig && !loadingConfig) {
                    e.target.style.background = '#2563eb'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!savingConfig && !loadingConfig) {
                    e.target.style.background = '#3b82f6'
                  }
                }}
              >
                {savingConfig ? 'Đang lưu...' : 'Lưu cấu hình'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <LeagueDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedLeague(null)
        }}
        league={selectedLeague}
      />

      <RejectLeagueModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false)
          setSelectedLeague(null)
        }}
        onConfirm={handleReject}
        leagueName={selectedLeague?.name || ''}
      />

      <AssignCourtModal
        isOpen={isAssignCourtModalOpen}
        onClose={() => {
          setIsAssignCourtModalOpen(false)
          setSelectedLeague(null)
          setResolvedFacilityId(null)
        }}
        onConfirm={handleAssignCourt}
        league={selectedLeague}
        facilityId={
          resolvedFacilityId 
            ? String(resolvedFacilityId)
            : selectedLeague?.facility?._id 
              ? String(selectedLeague.facility._id)
              : selectedLeague?.facility 
                ? String(selectedLeague.facility)
                : null
        }
      />
    </div>
  )
}

export default Leagues

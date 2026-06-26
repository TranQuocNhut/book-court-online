import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loyaltyApi } from '../../../api/loyaltyApi'
import { useAuth } from '../../../contexts/AuthContext'
import { toast } from 'react-toastify'
import ImageWithFallback from '../../../components/ui/ImageWithFallback'
import {
  Gift,
  Star,
  CheckCircle,
  XCircle,
  Loader,
  Search,
  Filter,
  TrendingUp,
  Award,
  ArrowRight,
  Coins,
  Ticket,
  Zap,
  Package,
  Settings,
  Check,
  X,
  History,
  Copy
} from 'lucide-react'
import './RedeemPoints.css'

const RedeemPoints = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState(null)
  // Khởi tạo điểm từ user context, giống như ProfilePage
  const [userPoints, setUserPoints] = useState(() => {
    return user?.loyaltyPoints || user?.points || 0
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedReward, setSelectedReward] = useState(null)
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false)
  const [redeemHistory, setRedeemHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [voucherCode, setVoucherCode] = useState(null)
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false)
  const [myVouchers, setMyVouchers] = useState([])
  const [loadingVouchers, setLoadingVouchers] = useState(false)

  // Get active tab from URL query params, default to 'rewards'
  const activeTab = searchParams.get('tab') || 'rewards'

  // Update URL when tab changes
  const handleTabChange = (tab) => {
    setSearchParams({ tab })
  }

  useEffect(() => {
    fetchRewards()
    fetchUserPoints()
    if (activeTab === 'history') {
      fetchRedeemHistory()
    }
    if (activeTab === 'vouchers') {
      fetchMyVouchers()
    }
  }, [activeTab])

  const fetchRewards = async () => {
    try {
      setLoading(true)
      // Thêm độ trễ tối thiểu 800ms để hiển thị skeleton loading
      const [response] = await Promise.all([
        loyaltyApi.getRewards(),
        new Promise(resolve => setTimeout(resolve, 800))
      ])
      if (response.success) {
        setRewards(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching rewards:', error)
      toast.error('Không thể tải danh sách quà')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPoints = async () => {
    try {
      const response = await loyaltyApi.getSummary()
      if (response.success && response.data) {
        // API trả về current_points (snake_case) hoặc có thể đã được convert thành currentPoints
        // Ưu tiên: current_points > currentPoints > loyaltyPoints từ user context
        setUserPoints(
          response.data.current_points ||
          response.data.currentPoints ||
          user?.loyaltyPoints ||
          user?.points ||
          0
        )
      }
    } catch (error) {
      console.error('Error fetching user points:', error)
      // Fallback về user context nếu API lỗi
      setUserPoints(user?.loyaltyPoints || user?.points || 0)
    }
  }

  const fetchRedeemHistory = async () => {
    try {
      setLoadingHistory(true)
      const response = await loyaltyApi.getHistory({ type: 'REDEEM', limit: 50 })
      if (response.success) {
        // Transform transaction data to history format
        const history = (response.data?.transactions || []).map(transaction => ({
          id: transaction._id,
          rewardName: transaction.reward?.name || transaction.description?.replace('Đổi quà: ', '') || 'Quà tặng',
          points: Math.abs(transaction.amount),
          date: new Date(transaction.createdAt).toLocaleDateString('vi-VN'),
          status: 'completed',
          image: transaction.reward?.image || null
        }))
        setRedeemHistory(history)
      }
    } catch (error) {
      console.error('Error fetching redeem history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }


  const handleRedeemClick = (reward) => {
    setSelectedReward(reward)
    setIsRedeemDialogOpen(true)
  }

  const handleConfirmRedeem = async () => {
    if (!selectedReward) return

    if (userPoints < selectedReward.pointCost) {
      toast.error(`Không đủ điểm! Bạn cần thêm ${selectedReward.pointCost - userPoints} điểm để đổi quà này`)
      return
    }

    try {
      setRedeeming(selectedReward._id)
      const response = await loyaltyApi.redeemReward(selectedReward._id)

      if (response.success) {
        // Update points - ưu tiên remaining_points, sau đó fetch lại từ API
        if (response.data?.remaining_points !== undefined) {
          setUserPoints(response.data.remaining_points)
        } else {
          // Nếu không có remaining_points, fetch lại từ summary
          await fetchUserPoints()
        }

        // Nếu là voucher, hiển thị modal với mã voucher
        if (selectedReward.type === 'VOUCHER' && response.data?.reward_detail?.code) {
          setVoucherCode(response.data.reward_detail.code)
          setIsRedeemDialogOpen(false)
          setIsVoucherModalOpen(true)
        } else {
          toast.success('Đổi quà thành công!', {
            description: `Bạn đã đổi ${selectedReward.name} với ${selectedReward.pointCost} điểm`
          })
          setIsRedeemDialogOpen(false)
        }

        // Refresh data
        await fetchRewards()
        if (activeTab === 'history') {
          await fetchRedeemHistory()
        }
        if (activeTab === 'vouchers') {
          await fetchMyVouchers()
        }

        setSelectedReward(null)
      }
    } catch (error) {
      console.error('Error redeeming reward:', error)
      toast.error(error.response?.data?.message || 'Không thể đổi quà. Vui lòng thử lại.')
    } finally {
      setRedeeming(null)
    }
  }

  const fetchMyVouchers = async () => {
    try {
      setLoadingVouchers(true)
      const response = await loyaltyApi.getMyVouchers({ limit: 50 })
      if (response.success) {
        setMyVouchers(response.data?.vouchers || [])
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error)
    } finally {
      setLoadingVouchers(false)
    }
  }

  const handleCopyVoucherCode = (code) => {
    navigator.clipboard.writeText(code)
    toast.success('Đã sao chép mã voucher!')
  }

  const calculateMemberTier = (points) => {
    if (points >= 10000) {
      return {
        name: 'Vàng',
        color: '#f59e0b',
        nextTier: null,
        progress: 100
      }
    }
    if (points >= 5000) {
      return {
        name: 'Bạc',
        color: '#6b7280',
        nextTier: 10000,
        progress: ((points - 5000) / 5000) * 100
      }
    }
    return {
      name: 'Đồng',
      color: '#d97706',
      nextTier: 5000,
      progress: (points / 5000) * 100
    }
  }

  const memberTier = calculateMemberTier(userPoints)
  const nextTierPoints = memberTier.nextTier || 10000
  const pointsProgress = memberTier.nextTier
    ? ((userPoints / memberTier.nextTier) * 100)
    : 100

  // Gradient màu theo hạng thành viên
  const getTierGradient = (tierName) => {
    switch (tierName) {
      case 'Vàng':
        return 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #fcd34d 100%)' // Gold
      case 'Bạc':
        return 'linear-gradient(135deg, #6b7280 0%, #9ca3af 50%, #d1d5db 100%)' // Silver
      case 'Đồng':
      default:
        return 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)' // Bronze
    }
  }

  const categories = [
    { value: 'all', label: 'Tất cả', icon: Gift },
    { value: 'VOUCHER', label: 'Voucher', icon: Ticket },
    { value: 'ITEM', label: 'Vật phẩm', icon: Package },
    { value: 'SERVICE', label: 'Dịch vụ', icon: Settings }
  ]

  const filteredRewards = useMemo(() => {
    let filtered = rewards.filter(reward => {
      const matchesSearch = !searchQuery ||
        reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (reward.description && reward.description.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = selectedCategory === 'all' || reward.type === selectedCategory

      return matchesSearch && matchesCategory && reward.isActive
    })

    // Sort: affordable first, then by point cost
    return filtered.sort((a, b) => {
      const aAffordable = userPoints >= a.pointCost
      const bAffordable = userPoints >= b.pointCost
      if (aAffordable !== bAffordable) {
        return aAffordable ? -1 : 1
      }
      return a.pointCost - b.pointCost
    })
  }, [rewards, searchQuery, selectedCategory, userPoints])

  const featuredRewards = filteredRewards.filter(r => userPoints >= r.pointCost).slice(0, 3)

  // Skeleton Loading Component
  const SkeletonCard = () => (
    <div className="bg-white rounded-lg overflow-hidden shadow-md">
      <div className="h-40 bg-gray-200"></div>
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  )

  const SkeletonHeader = () => (
    <header className="bg-gradient-to-r from-gray-300 to-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 w-full space-y-4">
            <div className="h-6 bg-white/30 rounded w-32"></div>
            <div className="h-12 bg-white/30 rounded w-48"></div>
            <div className="h-20 bg-white/30 rounded w-full max-w-md"></div>
          </div>
          <div className="h-24 bg-white/30 rounded w-32"></div>
        </div>
      </div>
    </header>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SkeletonHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs Skeleton */}
          <div className="mb-6">
            <div className="flex gap-2 border-b border-gray-200">
              <div className="h-10 bg-gray-200 rounded-t w-32"></div>
              <div className="h-10 bg-gray-200 rounded-t w-32"></div>
            </div>
          </div>

          {/* Search and Filter Skeleton */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="h-12 bg-gray-200 rounded-lg flex-1"></div>
              <div className="h-12 bg-gray-200 rounded-lg w-48"></div>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 bg-gray-200 rounded-lg w-24"></div>
              ))}
            </div>
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Gradient */}
      <header
        className="redeem-header"
        style={{
          background: getTierGradient(memberTier.name),
          color: '#fff'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* User Points */}
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-2">
                <Coins size={24} />
                <h1 className="text-white text-xl font-semibold">Điểm của bạn</h1>
              </div>
              <div className="flex items-baseline gap-2 mb-4 redeem-points-display">
                <span className="text-4xl md:text-5xl font-bold redeem-points-value">{userPoints.toLocaleString('vi-VN')}</span>
                <span className="text-xl text-blue-100">điểm</span>
              </div>

              {/* Hạng thành viên */}
              <div className="redeem-member-badge">
                <div className="text-lg font-bold whitespace-nowrap">
                  Hạng thành viên: {memberTier.name}
                </div>
              </div>

              {/* Thanh tiến độ */}
              {memberTier.nextTier && (
                <div className="redeem-progress-container">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-100">Tiến độ tới hạng tiếp theo</span>
                    <span className="text-sm font-semibold">{nextTierPoints - userPoints} điểm nữa</span>
                  </div>
                  <div className="redeem-progress-bar-bg">
                    <div style={{
                      height: '100%',
                      background: '#fff',
                      width: `${Math.min(pointsProgress, 100)}%`,
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6 redeem-tabs-container">
          <div className="flex gap-2 border-b border-gray-200 min-w-max">
            <button
              onClick={() => handleTabChange('rewards')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'rewards'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Gift size={18} />
              Quà tặng
            </button>
            <button
              onClick={() => {
                handleTabChange('history')
                if (redeemHistory.length === 0) {
                  fetchRedeemHistory()
                }
              }}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'history'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <History size={18} />
              Lịch sử
            </button>
            <button
              onClick={() => {
                handleTabChange('vouchers')
                if (myVouchers.length === 0) {
                  fetchMyVouchers()
                }
              }}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'vouchers'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Ticket size={18} />
              Voucher của tôi
            </button>
          </div>
        </div>

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm quà tặng..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 pr-8 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => {
                const Icon = cat.icon
                const isActive = selectedCategory === cat.value
                return (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <Icon size={18} />
                    {cat.label}
                  </button>
                )
              })}
            </div>

            {/* Featured Rewards */}
            {selectedCategory === 'all' && featuredRewards.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <h2 className="text-xl font-bold text-gray-900">Nổi bật</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {featuredRewards.map((reward) => (
                    <div
                      key={reward._id}
                      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow group"
                    >
                      <div className="relative h-48 overflow-hidden bg-gray-100">
                        {reward.image ? (
                          <ImageWithFallback
                            src={reward.image}
                            alt={reward.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                            {reward.type === 'VOUCHER' ? (
                              <Ticket size={48} className="text-blue-400" />
                            ) : (
                              <Gift size={48} className="text-blue-400" />
                            )}
                          </div>
                        )}
                        <div className="absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          Nổi bật
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="mb-2 font-semibold text-gray-900">{reward.name}</h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {reward.description || 'Phần quà hấp dẫn dành cho bạn'}
                        </p>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-1">
                            <Coins size={20} className="text-blue-600" />
                            <span className="text-blue-600 font-semibold">
                              {reward.pointCost.toLocaleString('vi-VN')} điểm
                            </span>
                          </div>
                          {reward.stock !== null && (
                            <span className="text-sm text-gray-500">Còn {reward.stock} SP</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRedeemClick(reward)}
                          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Đổi ngay
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Rewards */}
            <div>
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                {selectedCategory === 'all'
                  ? 'Tất cả quà tặng'
                  : categories.find(c => c.value === selectedCategory)?.label}
              </h2>
              {filteredRewards.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                  <Gift size={64} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">
                    {searchQuery || selectedCategory !== 'all'
                      ? 'Không tìm thấy quà tặng'
                      : 'Chưa có quà nào'}
                  </h3>
                  <p className="text-gray-600">
                    {searchQuery || selectedCategory !== 'all'
                      ? 'Vui lòng thử lại với từ khóa khác'
                      : 'Vui lòng quay lại sau để xem các phần quà mới'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredRewards.map((reward) => {
                    const canRedeem = userPoints >= reward.pointCost
                    return (
                      <div
                        key={reward._id}
                        className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow group"
                      >
                        <div className="relative h-40 overflow-hidden bg-gray-100">
                          {reward.image ? (
                            <ImageWithFallback
                              src={reward.image}
                              alt={reward.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              {reward.type === 'VOUCHER' ? (
                                <Ticket size={40} className="text-gray-400" />
                              ) : (
                                <Gift size={40} className="text-gray-400" />
                              )}
                            </div>
                          )}
                          {reward.stock !== null && reward.stock < 20 && (
                            <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                              Sắp hết
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h4 className="mb-2 font-semibold text-gray-900">{reward.name}</h4>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {reward.description || 'Phần quà hấp dẫn dành cho bạn'}
                          </p>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1">
                              <Coins size={16} className="text-blue-600" />
                              <span className="text-sm text-blue-600 font-semibold">
                                {reward.pointCost.toLocaleString('vi-VN')} điểm
                              </span>
                            </div>
                            {reward.stock !== null && (
                              <span className="text-xs text-gray-500">SL: {reward.stock}</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleRedeemClick(reward)}
                            disabled={!canRedeem}
                            className={`w-full py-2 rounded-lg font-medium transition-colors ${canRedeem
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              }`}
                          >
                            {canRedeem ? 'Đổi quà' : 'Không đủ điểm'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-16">
                  <Loader className="animate-spin" size={32} color="#3b82f6" />
                </div>
              ) : redeemHistory.length > 0 ? (
                <div className="space-y-4">
                  {redeemHistory.map((item) => {
                    const statusConfig = {
                      pending: { label: 'Đang xử lý', color: '#6b7280', bg: '#f3f4f6' },
                      completed: { label: 'Hoàn thành', color: '#10b981', bg: '#d1fae5' },
                      cancelled: { label: 'Đã hủy', color: '#ef4444', bg: '#fee2e2' }
                    }
                    const status = statusConfig[item.status] || statusConfig.completed
                    return (
                      <div
                        key={item.id}
                        className="redeem-history-item p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 redeem-history-image">
                          {item.image ? (
                            <ImageWithFallback
                              src={item.image}
                              alt={item.rewardName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Gift size={32} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 redeem-history-content">
                          <h4 className="mb-1 font-semibold text-gray-900 truncate">
                            {item.rewardName}
                          </h4>
                          <div className="flex items-center gap-2 mb-1">
                            <Coins size={16} className="text-blue-600" />
                            <span className="text-sm text-blue-600 font-semibold">
                              {item.points.toLocaleString('vi-VN')} điểm
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{item.date}</p>
                        </div>
                        <div
                          className="redeem-history-status"
                          style={{
                            background: status.bg,
                            color: status.color,
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          {status.label}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <History size={64} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">
                    Chưa có lịch sử đổi quà
                  </h3>
                  <p className="text-gray-600">
                    Bắt đầu đổi điểm lấy quà tặng ngay hôm nay!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vouchers Tab */}
        {activeTab === 'vouchers' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6">
              {loadingVouchers ? (
                <div className="flex items-center justify-center py-16">
                  <Loader className="animate-spin" size={32} color="#3b82f6" />
                </div>
              ) : myVouchers.length > 0 ? (
                <div className="space-y-4">
                  {myVouchers.map((voucher) => {
                    const isExpired = new Date(voucher.endDate) < new Date()
                    const isUsed = voucher.usageCount >= voucher.maxUsage
                    const isValid = !isExpired && !isUsed

                    return (
                      <div
                        key={voucher._id}
                        className={`p-4 border-2 rounded-lg transition-colors ${isValid
                            ? 'border-green-200 bg-green-50 hover:bg-green-100'
                            : 'border-gray-200 bg-gray-50 opacity-60'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Ticket size={20} className={isValid ? 'text-green-600' : 'text-gray-400'} />
                              <h4 className="font-semibold text-gray-900">{voucher.name}</h4>
                            </div>
                            {voucher.description && (
                              <p className="text-sm text-gray-600 mb-3">{voucher.description}</p>
                            )}
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Mã:</span>
                                <span className="font-mono font-bold text-lg text-blue-600">
                                  {voucher.code}
                                </span>
                                <button
                                  onClick={() => handleCopyVoucherCode(voucher.code)}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                  title="Sao chép mã"
                                >
                                  <Copy size={16} className="text-gray-500" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Giảm giá: </span>
                                <span className="font-semibold text-green-600">
                                  {voucher.discountType === 'percentage'
                                    ? `${voucher.discountValue}%`
                                    : `${voucher.discountValue.toLocaleString('vi-VN')} ₫`}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Hết hạn: </span>
                                <span className="font-semibold">
                                  {new Date(voucher.endDate).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {isValid ? (
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                Có thể sử dụng
                              </span>
                            ) : isUsed ? (
                              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                                Đã sử dụng
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                Hết hạn
                              </span>
                            )}
                            <button
                              onClick={() => {
                                handleCopyVoucherCode(voucher.code)
                                // Nếu voucher có applicableFacilities, dẫn đến facility đầu tiên
                                if (voucher.applicableFacilities && voucher.applicableFacilities.length > 0) {
                                  const firstFacility = voucher.applicableFacilities[0]
                                  const facilityId = firstFacility._id || firstFacility
                                  navigate(`/booking?venue=${facilityId}&promo=${voucher.code}`)
                                } else if (voucher.isAllFacilities) {
                                  // Nếu áp dụng cho tất cả facility, dẫn đến trang facilities
                                  navigate('/facilities')
                                } else {
                                  // Fallback: dẫn đến trang facilities
                                  navigate('/facilities')
                                }
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              Sử dụng ngay
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Ticket size={64} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">
                    Chưa có voucher nào
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Đổi điểm lấy voucher để nhận ưu đãi khi đặt sân!
                  </p>
                  <button
                    onClick={() => handleTabChange('rewards')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Xem quà tặng
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Redeem Confirmation Dialog */}
      {isRedeemDialogOpen && selectedReward && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Xác nhận đổi quà</h3>
                <button
                  onClick={() => {
                    setIsRedeemDialogOpen(false)
                    setSelectedReward(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Bạn có chắc chắn muốn đổi quà tặng này không?
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Reward Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {selectedReward.image ? (
                    <ImageWithFallback
                      src={selectedReward.image}
                      alt={selectedReward.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {selectedReward.type === 'VOUCHER' ? (
                        <Ticket size={32} className="text-gray-400" />
                      ) : (
                        <Gift size={32} className="text-gray-400" />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 font-semibold text-gray-900">{selectedReward.name}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {selectedReward.description || 'Phần quà hấp dẫn dành cho bạn'}
                  </p>
                </div>
              </div>

              {/* Points Calculation */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Điểm hiện tại</span>
                  <span className="font-semibold text-gray-900">
                    {userPoints.toLocaleString('vi-VN')} điểm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Điểm cần đổi</span>
                  <span className="text-blue-600 font-semibold">
                    -{selectedReward.pointCost.toLocaleString('vi-VN')} điểm
                  </span>
                </div>
                <div className="h-px bg-gray-200 my-2"></div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Điểm còn lại</span>
                  <span className="font-bold text-gray-900">
                    {(userPoints - selectedReward.pointCost).toLocaleString('vi-VN')} điểm
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {userPoints < selectedReward.pointCost && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-800">
                      Bạn không đủ điểm để đổi quà này. Cần thêm{' '}
                      {selectedReward.pointCost - userPoints} điểm.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setIsRedeemDialogOpen(false)
                  setSelectedReward(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmRedeem}
                disabled={!selectedReward || userPoints < selectedReward.pointCost || redeeming}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {redeeming ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Xác nhận
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Code Modal */}
      {isVoucherModalOpen && voucherCode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Đổi quà thành công!</h3>
                    <p className="text-sm text-gray-600">Mã voucher của bạn</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsVoucherModalOpen(false)
                    setVoucherCode(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Mã voucher của bạn</p>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <span className="font-mono font-bold text-2xl text-blue-600">
                      {voucherCode}
                    </span>
                    <button
                      onClick={() => handleCopyVoucherCode(voucherCode)}
                      className="p-2 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-sm"
                      title="Sao chép mã"
                    >
                      <Copy size={20} className="text-gray-600" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Vui lòng lưu lại mã này để sử dụng khi đặt sân
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Ticket size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Cách sử dụng:</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-700">
                      <li>Vào trang đặt sân</li>
                      <li>Nhập mã voucher vào ô "Mã khuyến mãi"</li>
                      <li>Mã sẽ được áp dụng tự động</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setIsVoucherModalOpen(false)
                  setVoucherCode(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setIsVoucherModalOpen(false)
                  const code = voucherCode
                  setVoucherCode(null)
                  // Dẫn đến trang facilities với mã voucher trong URL
                  navigate(`/facilities?promo=${code}`)
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Chọn cơ sở
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RedeemPoints

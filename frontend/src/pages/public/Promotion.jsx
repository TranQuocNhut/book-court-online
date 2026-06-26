import React, { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import InfoSection from './Promotion/components/InfoSection'
import PromotionGrid from './Promotion/components/PromotionGrid'
import PromotionHero from './Promotion/components/PromotionHero'
import { copyToClipboard } from './Promotion/utils/helpers'
import { promotionApi } from '../../api/promotionApi'
import '../../styles/Promotion.css'

const Promotion = () => {
  const [allPromotions, setAllPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')

  const filterOptions = [
    { id: 'all', label: 'Tất cả' },
    { id: 'voucher', label: 'Voucher giảm giá' },
    { id: 'limitedTime', label: 'Sắp hết hạn' },
    { id: 'specialCampaign', label: 'HOT & Mới nhất' },
  ]

  // Transform promotion from API format to component format
  const transformPromotion = (promo) => {
    const now = new Date()
    const endDate = new Date(promo.endDate)
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
    const hoursRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60)) % 24

    let validUntil = 'Đã hết hạn'
    if (daysRemaining > 0) {
      validUntil = `${daysRemaining} ngày ${hoursRemaining} giờ`
    } else if (promo.maxUsage === null) {
      validUntil = 'Mãi mãi'
    }

    const discount = promo.discountType === 'percentage'
      ? `${promo.discountValue}%`
      : `${new Intl.NumberFormat('vi-VN').format(promo.discountValue)}₫`

    // Generate badges based on status and usage
    const badges = []
    if (promo.computedStatus === 'active' && promo.usageCount > 0) {
      badges.push('HOT')
    }
    const daysSinceCreated = Math.floor((now - new Date(promo.createdAt)) / (1000 * 60 * 60 * 24))
    if (daysSinceCreated <= 7) {
      badges.push('MỚI')
    }

    // Generate features from applicableFacilities and applicableAreas
    const features = []
    if (promo.isAllFacilities) {
      features.push('Áp dụng cho tất cả sân')
    } else if (promo.applicableFacilities && promo.applicableFacilities.length > 0) {
      const facilityNames = promo.applicableFacilities
        .map(f => typeof f === 'object' ? f.name : f)
        .slice(0, 2)
      features.push(`Áp dụng cho: ${facilityNames.join(', ')}`)
    }
    if (promo.applicableAreas && promo.applicableAreas.length > 0) {
      features.push(`Khu vực: ${promo.applicableAreas.join(', ')}`)
    }
    if (promo.maxUsage) {
      features.push(`Giới hạn ${promo.maxUsage} lượt sử dụng`)
    }

    // Determine promotion categories
    const isLimitedTime = daysRemaining > 0 && daysRemaining <= 7
    const isSpecialCampaign = badges.includes('HOT') || badges.includes('MỚI')
    const isVoucher = true // All promotions with code are vouchers

    return {
      id: promo._id,
      title: promo.name,
      description: promo.description || promo.name,
      discount,
      icon: null,
      color: '#3b82f6',
      image: promo.image?.url || '/pngtree-sports-poster-background.jpg',
      validUntil,
      code: promo.code,
      usage: {
        current: promo.usageCount || 0,
        total: promo.maxUsage || 1000,
      },
      features: features.length > 0 ? features : ['Áp dụng cho tất cả đơn hàng'],
      badges,
      // Category flags
      isVoucher,
      isLimitedTime,
      isSpecialCampaign,
    }
  }

  // Fetch promotions
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true)
        const result = await promotionApi.getPromotions({
          isActive: true,
          limit: 50,
        })

        if (result.success) {
          const transformed = result.data.promotions
            .filter(p => p.computedStatus === 'active' || p.status === 'active')
            .map(transformPromotion)
          setAllPromotions(transformed)
        }
      } catch (error) {
        console.error('Error fetching promotions:', error)
        toast.error('Có lỗi xảy ra khi tải khuyến mãi')
      } finally {
        setLoading(false)
      }
    }

    fetchPromotions()
  }, [])

  // Filter promotions based on active filter
  const filteredPromotions = useMemo(() => {
    if (activeFilter === 'all') return allPromotions

    return allPromotions.filter(promo => {
      if (activeFilter === 'voucher' && promo.isVoucher) return true
      if (activeFilter === 'limitedTime' && promo.isLimitedTime) return true
      if (activeFilter === 'specialCampaign' && promo.isSpecialCampaign) return true
      return false
    })
  }, [allPromotions, activeFilter])

  const handleCopy = (code) => {
    copyToClipboard(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
    toast.success('Đã copy mã khuyến mãi!')
  }

  const handleApply = (code) => {
    // Navigate to booking page with promotion code
    window.location.href = `/booking?promo=${code}`
  }

  return (
    <div className="promotion-page">
      <div className="container">
        <PromotionHero />

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
            Đang tải khuyến mãi...
          </div>
        ) : (
          <>
            {/* Top Filter Bar */}
            <div className="promotion-filter-bar">
              {filterOptions.map(option => (
                <button
                  key={option.id}
                  className={`filter-pill ${activeFilter === option.id ? 'active' : ''}`}
                  onClick={() => setActiveFilter(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Main Grid */}
            <div className="promotion-content">
              {filteredPromotions.length > 0 ? (
                <PromotionGrid
                  promotions={filteredPromotions}
                  copiedCode={copiedCode}
                  onCopy={handleCopy}
                  onApply={handleApply}
                />
              ) : (
                <div style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>
                  <div style={{ marginBottom: 16, fontSize: 48 }}>🔍</div>
                  Không tìm thấy khuyến mãi nào cho danh mục này
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Info Section - Full width, outside container */}
      {!loading && <InfoSection />}
    </div>
  )
}

export default Promotion

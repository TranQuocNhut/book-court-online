import React, { useState, useMemo, useEffect } from 'react'
import { MessageSquare, Star, ChevronLeft, ChevronRight, Filter, ArrowUpDown, RotateCcw } from 'lucide-react'
import { reviewApi } from '../../../../api/reviewApi'
import ReviewCard from './ReviewCard'

export default function ReviewsSection({
  reviews: initialReviews = [],
  venueRating = 0,
  totalReviews = 0,
  loading: initialLoading = false,
  facilityId,
  onPageChange,
  onRatingFilterChange
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('newest')
  const [filterRating, setFilterRating] = useState('all')
  const [reviews, setReviews] = useState(initialReviews)
  const [loading, setLoading] = useState(initialLoading)
  const [total, setTotal] = useState(totalReviews)
  const [averageRating, setAverageRating] = useState(venueRating)

  const itemsPerPage = 5

  // Sync averageRating with venueRating prop when it changes
  useEffect(() => {
    setAverageRating(venueRating)
  }, [venueRating])

  // Fetch reviews from API when page, filter, or facilityId changes
  useEffect(() => {
    if (!facilityId) {
      setReviews(initialReviews)
      setTotal(totalReviews)
      return
    }

    const fetchReviews = async () => {
      try {
        setLoading(true)
        const params = {
          page: currentPage,
          limit: itemsPerPage,
        }

        // Add rating filter if not 'all'
        if (filterRating !== 'all') {
          params.rating = parseInt(filterRating)
        }

        const result = await reviewApi.getFacilityReviews(facilityId, params)

        if (result.reviews) {
          // Transform API reviews to component format
          const transformedReviews = result.reviews.map(review => ({
            id: review._id || review.id,
            user: review.user?.name || 'Người dùng',
            rating: review.rating,
            date: review.createdAt || review.date,
            comment: review.comment || '',
            avatar: review.user?.avatar
              ? review.user.avatar
              : (review.user?.name?.charAt(0) || 'U').toUpperCase(),
            ownerReply: review.ownerReply
          }))

          // Sort reviews (client-side for now, as API doesn't support sort)
          let sortedReviews = [...transformedReviews]
          switch (sortBy) {
            case 'newest':
              sortedReviews.sort((a, b) => new Date(b.date) - new Date(a.date))
              break
            case 'oldest':
              sortedReviews.sort((a, b) => new Date(a.date) - new Date(b.date))
              break
            case 'highest':
              sortedReviews.sort((a, b) => b.rating - a.rating)
              break
            case 'lowest':
              sortedReviews.sort((a, b) => a.rating - b.rating)
              break
            default:
              break
          }

          setReviews(sortedReviews)
          setTotal(result.pagination?.total || result.reviews.length)

          // Update averageRating from stats
          // Always use overall stats.averageRating (not filtered average)
          // because we want to show the overall facility rating, not just filtered reviews
          if (result.stats && (result.stats.averageRating !== undefined && result.stats.averageRating !== null)) {
            const rating = Number(result.stats.averageRating) || 0
            setAverageRating(rating)
          } else if (result.pagination?.total > 0) {
            // If stats is missing but we have reviews, we need to fetch stats separately
            // For now, calculate from all reviews (but this is only current page)
            // Better: fetch stats separately or ensure API always returns stats
            // Keep current averageRating or calculate from visible reviews
            if (sortedReviews.length > 0 && filterRating === 'all') {
              const calculatedAvg = sortedReviews.reduce((sum, r) => sum + r.rating, 0) / sortedReviews.length
              setAverageRating(calculatedAvg)
            }
          }

          if (onPageChange) {
            onPageChange(currentPage)
          }
        }
      } catch (error) {
        console.error('Error fetching reviews:', error)
        // Fallback to initial reviews on error
        setReviews(initialReviews)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId, currentPage, filterRating, sortBy])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterRating, sortBy])

  // Update reviews when initialReviews change (from parent)
  useEffect(() => {
    if (!facilityId && initialReviews.length > 0) {
      setReviews(initialReviews)
      setTotal(totalReviews)
      // Keep averageRating from props when using initial reviews
      setAverageRating(venueRating)
    }
  }, [initialReviews, totalReviews, facilityId, venueRating])

  const totalPages = Math.ceil(total / itemsPerPage)
  const currentReviews = reviews

  const handlePageChange = (page) => {
    setCurrentPage(page)
    // Scroll to top of reviews section
    const element = document.getElementById('reviews-section')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div id="reviews-section">
      {/* Header */}
      <div style={{
        display: 'flex',
        flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: window.innerWidth <= 768 ? 'flex-start' : 'center',
        marginBottom: '24px',
        gap: window.innerWidth <= 768 ? '12px' : '0'
      }}>
        <div>
          <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: '0 0 8px 0' }}>
            Đánh giá từ khách hàng
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Tổng hợp ý kiến từ {total || reviews.length} khách hàng
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map((star) => {
              const fillPercentage = averageRating >= star
                ? 100
                : averageRating > star - 1
                  ? (averageRating - (star - 1)) * 100
                  : 0

              return (
                <div key={star} style={{ position: 'relative', display: 'inline-block' }}>
                  {/* Background star (empty) */}
                  <Star
                    size={18}
                    fill="none"
                    color="#fbbf24"
                    strokeWidth={2}
                  />
                  {/* Filled star (overlay) */}
                  {fillPercentage > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: `${fillPercentage}%`,
                      overflow: 'hidden'
                    }}>
                      <Star
                        size={18}
                        fill="#fbbf24"
                        color="#fbbf24"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <span style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
            {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
          </span>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>({total || reviews.length} đánh giá)</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: '#f8fafc',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '24px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
          gap: '16px',
          alignItems: window.innerWidth <= 768 ? 'stretch' : 'center',
          marginBottom: '16px'
        }}>
          {/* Rating Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={16} color="#6b7280" />
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', whiteSpace: 'nowrap' }}>
                Lọc:
              </label>
            </div>
            <select
              value={filterRating}
              onChange={(e) => {
                setFilterRating(e.target.value)
                if (onRatingFilterChange) {
                  onRatingFilterChange(e.target.value)
                }
              }}
              style={{
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '14px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                minWidth: '120px'
              }}
            >
              <option value="all">Tất cả sao</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpDown size={16} color="#6b7280" />
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', whiteSpace: 'nowrap' }}>
                Sắp xếp:
              </label>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '14px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                minWidth: '140px'
              }}
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="highest">Cao nhất</option>
              <option value="lowest">Thấp nhất</option>
            </select>
          </div>
        </div>

        {/* Results Info */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={16} color="#6b7280" />
            <span>
              {loading ? 'Đang tải...' : `Hiển thị ${currentReviews.length} trong ${total || reviews.length} đánh giá`}
            </span>
          </div>
          {filterRating !== 'all' && (
            <button
              onClick={() => setFilterRating('all')}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
              }}
            >
              <RotateCcw size={14} />
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#6b7280'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ fontSize: '14px', margin: 0 }}>Đang tải đánh giá...</p>
        </div>
      ) : currentReviews.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {currentReviews.map((review, index) => (
            <div
              key={review.id}
              style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                borderLeft: '4px solid #667eea'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                e.currentTarget.style.borderLeftColor = '#764ba2'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)'
                e.currentTarget.style.borderLeftColor = '#667eea'
              }}
            >
              <ReviewCard review={review} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#6b7280',
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          border: '2px dashed #e5e7eb'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h3 style={{ fontSize: '18px', margin: '0 0 8px 0', fontWeight: '500' }}>
            Không tìm thấy đánh giá nào
          </h3>
          <p style={{ fontSize: '14px', margin: 0 }}>
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '24px'
        }}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              background: currentPage === 1 ? '#f3f4f6' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              color: currentPage === 1 ? '#9ca3af' : '#fff',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.3s ease',
              opacity: currentPage === 1 ? 0.5 : 1
            }}
          >
            <ChevronLeft size={16} />
            Trước
          </button>

          {/* Page Numbers */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    style={{
                      background: page === currentPage ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#fff',
                      border: page === currentPage ? 'none' : '2px solid #e5e7eb',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: page === currentPage ? '#fff' : '#374151',
                      cursor: 'pointer',
                      fontWeight: page === currentPage ? '600' : '500',
                      transition: 'all 0.3s ease',
                      minWidth: '40px'
                    }}
                    onMouseEnter={(e) => {
                      if (page !== currentPage) {
                        e.target.style.borderColor = '#3b82f6'
                        e.target.style.backgroundColor = '#f8fafc'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (page !== currentPage) {
                        e.target.style.borderColor = '#e5e7eb'
                        e.target.style.backgroundColor = '#fff'
                      }
                    }}
                  >
                    {page}
                  </button>
                )
              } else if (
                page === currentPage - 2 ||
                page === currentPage + 2
              ) {
                return (
                  <span key={page} style={{ padding: '10px 4px', color: '#9ca3af' }}>
                    ...
                  </span>
                )
              }
              return null
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              background: currentPage === totalPages ? '#f3f4f6' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              color: currentPage === totalPages ? '#9ca3af' : '#fff',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.3s ease',
              opacity: currentPage === totalPages ? 0.5 : 1
            }}
          >
            Sau
            <ChevronRight size={16} />
          </button>
        </div>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}


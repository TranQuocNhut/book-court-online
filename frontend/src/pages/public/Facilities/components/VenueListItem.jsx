import React from 'react'
import { useNavigate } from 'react-router-dom'
import { SkeletonVenueCardList } from '../../../../components/ui/Skeleton'
import { calculateDistance, formatDistance } from '../../../../utils/distance'
import { FiMapPin, FiClock, FiNavigation } from 'react-icons/fi'
import { AiFillStar, AiFillHeart, AiOutlineHeart } from 'react-icons/ai'
import { useAuth } from '../../../../contexts/AuthContext'
import { userApi } from '../../../../api/userApi'
import { toast } from 'react-toastify'
import '../../../../styles/Facilities.css'

export default function VenueListItem({ facilities, loading, onBookVenue, userLocation }) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="venue-list-container">
        {[...Array(6)].map((_, i) => (
          <SkeletonVenueCardList key={i} />
        ))}
      </div>
    )
  }

  // Component cho từng venue item với favorite functionality
  const VenueItem = ({ f }) => {
    const [isFavorite, setIsFavorite] = React.useState(false)
    const [isLoadingFavorite, setIsLoadingFavorite] = React.useState(false)

    // Kiểm tra trạng thái yêu thích
    React.useEffect(() => {
      const checkFavoriteStatus = async () => {
        if (!isAuthenticated || !f.id) {
          setIsFavorite(false)
          return
        }

        try {
          const result = await userApi.getFavorites()
          if (result.success && result.data?.favorites) {
            const favoriteIds = result.data.favorites.map(fav => fav._id || fav.id)
            setIsFavorite(favoriteIds.includes(f.id))
          }
        } catch (error) {
          setIsFavorite(false)
        }
      }

      checkFavoriteStatus()
    }, [isAuthenticated, f.id])

    // Xử lý thêm/xóa yêu thích
    const handleToggleFavorite = async (e) => {
      e.stopPropagation()
      
      if (!isAuthenticated) {
        toast.info('Vui lòng đăng nhập để thêm vào danh sách yêu thích')
        return
      }

      if (!f.id || isLoadingFavorite) return

      try {
        setIsLoadingFavorite(true)
        
        if (isFavorite) {
          await userApi.removeFavorite(f.id)
          setIsFavorite(false)
          toast.success('Đã xóa khỏi danh sách yêu thích')
        } else {
          await userApi.addFavorite(f.id)
          setIsFavorite(true)
          toast.success('Đã thêm vào danh sách yêu thích')
        }
        
        window.dispatchEvent(new Event('favoritesUpdated'))
      } catch (error) {
        console.error('Error toggling favorite:', error)
        const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra'
        toast.error(errorMessage)
      } finally {
        setIsLoadingFavorite(false)
      }
    }

    // Tính khoảng cách
    const distance = React.useMemo(() => {
      if (!userLocation || !f.location) return null
      
      let lat2, lon2
      if (f.location.coordinates && Array.isArray(f.location.coordinates)) {
        [lon2, lat2] = f.location.coordinates
      } else if (f.location.latitude && f.location.longitude) {
        lat2 = f.location.latitude
        lon2 = f.location.longitude
      } else {
        return null
      }
      
      const dist = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        lat2,
        lon2
      )
      
      return formatDistance(dist)
    }, [userLocation, f.location])

    const address = f.district && f.city ? `${f.district}, ${f.city}` : f.address || ''

    return (
      <div 
        key={f.id} 
        className="venue-list-item"
        onClick={() => navigate(`/booking?venue=${f.id}`)}
      >
        <div className="venue-list-image">
          <img src={f.image} alt={f.name} />
          {/* Favorite button */}
          {isAuthenticated && (
            <button
              className="favorite-button"
              onClick={handleToggleFavorite}
              disabled={isLoadingFavorite}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isLoadingFavorite ? 'wait' : 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.3s ease',
                zIndex: 10,
                opacity: isLoadingFavorite ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isLoadingFavorite) {
                  e.currentTarget.style.background = '#fff'
                  e.currentTarget.style.transform = 'scale(1.1)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
              }}
            >
              {isLoadingFavorite ? (
                <div style={{
                  width: 16,
                  height: 16,
                  border: '2px solid #6b7280',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite'
                }} />
              ) : isFavorite ? (
                <AiFillHeart style={{ color: '#ef4444', fontSize: 22 }} />
              ) : (
                <AiOutlineHeart style={{ color: '#6b7280', fontSize: 22 }} />
              )}
            </button>
          )}
        </div>
        
        <div className="venue-list-content">
          <div className="venue-list-main">
            <div className="venue-tags" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'nowrap', overflow: 'hidden' }}>
              {/* Display multiple sports badges - optimized for max 2 + overflow */}
              {(() => {
                const sportsToDisplay = f.sports && Array.isArray(f.sports) && f.sports.length > 0
                  ? f.sports
                  : f.sport
                    ? [f.sport]
                    : [];
                
                const maxDisplay = 2;
                const visibleSports = sportsToDisplay.slice(0, maxDisplay);
                const remainingCount = sportsToDisplay.length - maxDisplay;
                
                return sportsToDisplay.length > 0 ? (
                  <div style={{ display: 'flex', gap: 6, flex: 1, minWidth: 0, alignItems: 'center' }}>
                    {visibleSports.map((sportItem, index) => (
                      <span
                        key={index}
                        style={{ 
                          fontSize: 11, 
                          color: '#16a34a', 
                          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', 
                          padding: '3px 8px', 
                          borderRadius: 999,
                          fontWeight: 600,
                          boxShadow: '0 2px 4px rgba(22, 163, 74, 0.1)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}
                      >
                        {sportItem}
                      </span>
                    ))}
                    {remainingCount > 0 && (
                      <span
                        title={sportsToDisplay.slice(maxDisplay).join(', ')}
                        style={{ 
                          fontSize: 11, 
                          color: '#16a34a', 
                          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', 
                          padding: '3px 8px', 
                          borderRadius: 999,
                          fontWeight: 600,
                          boxShadow: '0 2px 4px rgba(22, 163, 74, 0.1)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          cursor: 'help'
                        }}
                      >
                        +{remainingCount}
                      </span>
                    )}
                  </div>
                ) : null;
              })()}
              <span style={{ 
                fontSize: 11, 
                color: '#10b981', 
                background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', 
                padding: '3px 8px', 
                borderRadius: 999,
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.1)',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}>
                {f.status || 'Còn trống'}
              </span>
            </div>
            
            <h3 
              className="venue-list-title" 
              title={f.name}
              style={{ 
                fontSize: 16, 
                fontWeight: 800, 
                color: '#0f172a',
                textShadow: '0 1px 2px rgba(0,0,0,0.05)',
                marginBottom: 8,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%'
              }}
            >
              {f.name}
            </h3>
            
            {address && (
              <div className="venue-list-info" style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <FiMapPin /> <span>{address}</span>
              </div>
            )}
            
            {f.rating > 0 && (
              <div className="venue-list-info" style={{ 
                fontSize: 13, 
                color: '#6b7280', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6,
                marginBottom: 6
              }}>
                <AiFillStar style={{ color: '#fbbf24', fontSize: 16 }} />
                <span style={{ fontWeight: 600, color: '#1f2937' }}>
                  {typeof f.rating === 'number' ? f.rating.toFixed(1) : f.rating}
                </span>
                {f.totalReviews > 0 && (
                  <span style={{ fontSize: 12, color: '#6b7280' }}>
                    ({f.totalReviews} đánh giá)
                  </span>
                )}
              </div>
            )}
            
            {distance && (
              <div className="venue-list-info" style={{ fontSize: 13, color: '#667eea', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 6 }}>
                <FiNavigation size={14} />
                <span>Khoảng cách: {distance}</span>
              </div>
            )}
            
            {f.open && (
              <div className="venue-list-info" style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <FiClock /> {f.open}
              </div>
            )}
            
            {f.services && f.services.length > 0 && (
              <div style={{ 
                fontSize: 12, 
                color: '#6b7280', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6,
                flexWrap: 'wrap',
                marginBottom: 6
              }}>
                <span style={{ color: '#667eea', fontWeight: 600 }}>Dịch vụ:</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  {f.services.slice(0, 2).map((service, index) => (
                    <span 
                      key={index}
                      style={{
                        fontSize: 11,
                        color: '#475569',
                        background: '#f1f5f9',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontWeight: 500
                      }}
                    >
                      {service}
                    </span>
                  ))}
                  {f.services.length > 2 && (
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      +{f.services.length - 2}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
          
          <div className="venue-list-bottom">
            <div className="venue-list-price" style={{ color: '#16a34a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
              {f.price || ''}
            </div>
            <button 
              className="venue-list-book-btn"
              onClick={(e) => {
                e.stopPropagation()
                if (onBookVenue) {
                  onBookVenue(f.id)
                } else {
                  navigate(`/booking?venue=${f.id}`)
                }
              }}
            >
              Đặt sân ngay
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="venue-list-container">
      {facilities.map(f => (
        <VenueItem key={f.id} f={f} />
      ))}
    </div>
  )
}


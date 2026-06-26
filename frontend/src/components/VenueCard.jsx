import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMapPin, FiClock, FiNavigation } from 'react-icons/fi'
import { AiFillStar, AiFillHeart, AiOutlineHeart } from 'react-icons/ai'
import { calculateDistance, formatDistance } from '../utils/distance'
import { useAuth } from '../contexts/AuthContext'
import { userApi } from '../api/userApi'
import { toast } from 'react-toastify'

export default function VenueCard({
  image,
  name,
  address,
  rating,
  totalReviews = 0,
  open,
  price,
  sport,
  sports, // Array of sports
  status = 'Còn trống',
  services = [],
  onBook,
  chip,
  venueId,
  userLocation = null, // { latitude, longitude }
  facilityLocation = null, // { coordinates: [longitude, latitude] } hoặc { latitude, longitude }
}) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 })
  const cardRef = React.useRef(null)
  const [isFavorite, setIsFavorite] = React.useState(false)
  const [isLoadingFavorite, setIsLoadingFavorite] = React.useState(false)

  // Kiểm tra trạng thái yêu thích khi component mount hoặc venueId thay đổi
  React.useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!isAuthenticated || !venueId) {
        setIsFavorite(false)
        return
      }

      try {
        const result = await userApi.getFavorites()
        if (result.success && result.data?.favorites) {
          const favoriteIds = result.data.favorites.map(f => f._id || f.id)
          setIsFavorite(favoriteIds.includes(venueId))
        }
      } catch (error) {
        // Nếu lỗi, giả sử không phải favorite
        setIsFavorite(false)
      }
    }

    checkFavoriteStatus()
  }, [isAuthenticated, venueId])

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const card = cardRef.current
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateX = ((y - centerY) / centerY) * 10
    const rotateY = ((centerX - x) / centerX) * 10

    setMousePosition({ x: rotateY, y: rotateX })
  }

  const handleMouseLeave = (e) => {
    setMousePosition({ x: 0, y: 0 })
    // Reset border and shadow
    if (e.currentTarget) {
      e.currentTarget.style.borderColor = '#cbd5e1'
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,24,40,0.08), 0 0 0 1px rgba(0,0,0,0.05)'
    }
  }

  const handleMouseEnter = (e) => {
    e.currentTarget.style.borderColor = '#667eea'
    e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.15), 0 0 0 2px rgba(102, 126, 234, 0.1)'
  }

  const handleCardClick = (e) => {
    // Don't navigate if clicking the button or heart icon
    if (e.target.closest('.venue-card-button') || e.target.closest('.favorite-button')) {
      return
    }

    if (venueId) {
      navigate(`/booking?venue=${venueId}`)
    } else if (onBook) {
      onBook()
    }
  }

  // Xử lý thêm/xóa yêu thích
  const handleToggleFavorite = async (e) => {
    e.stopPropagation()

    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để thêm vào danh sách yêu thích')
      return
    }

    if (!venueId || isLoadingFavorite) return

    try {
      setIsLoadingFavorite(true)

      if (isFavorite) {
        // Xóa khỏi yêu thích
        await userApi.removeFavorite(venueId)
        setIsFavorite(false)
        toast.success('Đã xóa khỏi danh sách yêu thích')
      } else {
        // Thêm vào yêu thích
        await userApi.addFavorite(venueId)
        setIsFavorite(true)
        toast.success('Đã thêm vào danh sách yêu thích')
      }

      // Dispatch event để cập nhật favorites page
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
    if (!userLocation || !facilityLocation) return null

    let lat2, lon2

    // Xử lý format tọa độ từ backend (GeoJSON: [longitude, latitude])
    if (facilityLocation.coordinates && Array.isArray(facilityLocation.coordinates)) {
      [lon2, lat2] = facilityLocation.coordinates
    } else if (facilityLocation.latitude && facilityLocation.longitude) {
      lat2 = facilityLocation.latitude
      lon2 = facilityLocation.longitude
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
  }, [userLocation, facilityLocation])

  return (
    <div
      ref={cardRef}
      className="venue-card"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      style={{
        background: '#fff',
        border: '2px solid #cbd5e1',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(16,24,40,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.05s ease-out, border-color 0.3s ease',
        transform: `perspective(1000px) rotateX(${mousePosition.y}deg) rotateY(${mousePosition.x}deg)`,
        cursor: 'pointer',
        transformStyle: 'preserve-3d',
        willChange: 'transform'
      }}
    >
      <div className="venue-card-image" style={{
        position: 'relative',
        width: '100%',
        height: 200,
        background: '#f3f4f6',
        transform: 'translateZ(20px)',
        transition: 'all 0.3s ease'
      }}>
        {image ? (
          <img
            src={image}
            alt={name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease'
            }}
          />
        ) : null}
        {/* Biểu tượng trái tim yêu thích */}
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
              transform: 'translateZ(30px)',
              opacity: isLoadingFavorite ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isLoadingFavorite) {
                e.currentTarget.style.background = '#fff'
                e.currentTarget.style.transform = 'translateZ(30px) scale(1.1)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
              e.currentTarget.style.transform = 'translateZ(30px) scale(1)'
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
              <AiFillHeart
                style={{
                  color: '#ef4444',
                  fontSize: 22,
                  transition: 'transform 0.2s ease'
                }}
              />
            ) : (
              <AiOutlineHeart
                style={{
                  color: '#6b7280',
                  fontSize: 22,
                  transition: 'transform 0.2s ease'
                }}
              />
            )}
          </button>
        )}
      </div>
      <div style={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transform: 'translateZ(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap', overflow: 'hidden' }}>
          {/* Display multiple sports badges - optimized for max 2 + overflow */}
          {(() => {
            const sportsToDisplay = sports && Array.isArray(sports) && sports.length > 0 
              ? sports 
              : (chip || sport) 
                ? [chip || sport] 
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
            {status}
          </span>
        </div>
        <div 
          title={name}
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: '#0f172a',
            textShadow: '0 1px 2px rgba(0,0,0,0.05)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%'
          }}
        >
          {name}
        </div>
        {address && (
          <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiMapPin /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{address}</span>
          </div>
        )}
        {(rating !== undefined && rating !== null) && (
          <div style={{
            fontSize: 13,
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <AiFillStar style={{ color: '#fbbf24', fontSize: 16 }} />
            <span style={{ fontWeight: 600, color: '#1f2937' }}>
              {typeof rating === 'number' ? rating.toFixed(1) : rating}
            </span>
            {totalReviews >= 0 && (
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                ({totalReviews} đánh giá)
              </span>
            )}
          </div>
        )}
        {distance && (
          <div style={{ fontSize: 13, color: '#667eea', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <FiNavigation size={14} />
            <span>Khoảng cách: {distance}</span>
          </div>
        )}
        {open && (
          <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiClock /> {open}
          </div>
        )}
        {services && services.length > 0 && (
          <div style={{
            fontSize: 12,
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap'
          }}>
            <span style={{ color: '#667eea', fontWeight: 600 }}>Dịch vụ:</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              {services.slice(0, 2).map((service, index) => (
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
              {services.length > 2 && (
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  +{services.length - 2}
                </span>
              )}
            </span>
          </div>
        )}
        {price && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span style={{ color: '#16a34a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
              {price}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

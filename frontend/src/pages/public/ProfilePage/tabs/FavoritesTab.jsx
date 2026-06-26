import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import VenueCard from '../../../../components/VenueCard'
import { SkeletonVenueCard } from '../../../../components/ui/Skeleton'

export default function FavoritesTab({ venues, loading, userLocation }) {
  const navigate = useNavigate()

  const handleBookVenue = (venueId) => {
    navigate(`/booking?venue=${venueId}`)
  }

  if (loading) {
    return (
      <div className="favorites-section">
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
            Sân yêu thích
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
            Những sân bạn đã thêm vào danh sách yêu thích
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px',
          marginTop: '24px'
        }}>
          {[...Array(6)].map((_, i) => (
            <SkeletonVenueCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="favorites-section">
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
          Sân yêu thích
        </h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
          {venues.length > 0
            ? `Bạn có ${venues.length} sân trong danh sách yêu thích`
            : 'Những sân bạn đã thêm vào danh sách yêu thích'
          }
        </p>
      </div>

      {venues.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px',
          marginTop: '24px'
        }}>
          {venues.map(venue => (
            <VenueCard
              key={venue.id}
              venueId={venue.id}
              image={venue.image}
              name={venue.name}
              address={venue.address}
              rating={venue.rating ?? venue.averageRating ?? 0}
              totalReviews={venue.totalReviews || 0}
              open={venue.operatingHours}
              price={venue.price}
              sports={venue.facilities || (venue.sport || venue.sportCategory ? [venue.sport || venue.sportCategory] : [])}
              status={venue.status}
              services={venue.services || []}
              onBook={() => handleBookVenue(venue.id)}
              userLocation={userLocation}
              facilityLocation={venue.location}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{
          textAlign: 'center',
          padding: '64px 24px',
          color: '#6b7280'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Heart size={40} strokeWidth={1.5} color="#ef4444" />
            </div>
          </div>
          <h4 style={{
            marginBottom: '12px',
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Chưa có sân yêu thích
          </h4>
          <p style={{
            marginBottom: '24px',
            fontSize: '15px',
            color: '#6b7280',
            maxWidth: '400px',
            margin: '0 auto 24px'
          }}>
            Thêm các sân bạn thích vào danh sách yêu thích bằng cách nhấn vào biểu tượng trái tim trên card sân
          </p>
          <Link
            to="/facilities"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '15px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
          >
            Khám phá các sân
          </Link>
        </div>
      )}
    </div>
  )
}


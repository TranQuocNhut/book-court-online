import React, { useState, useMemo } from 'react'
import { Filter } from 'lucide-react'
import VenueCard from '../../../../components/VenueCard'
import { SkeletonVenueCard } from '../../../../components/ui/Skeleton'
import '../../../../styles/HomePage.css'

const sports = [
  { id: 'all', name: 'Tất cả', value: '' },
  { id: 'football', name: 'Bóng đá', value: 'Bóng đá' },
  { id: 'badminton', name: 'Cầu lông', value: 'Cầu lông' },
  { id: 'tennis', name: 'Tennis', value: 'Tennis' },
  { id: 'pickleball', name: 'Pickleball', value: 'Pickleball' }
]

import Slider from '../../../../components/ui/Slider'

export default function VenuesSection({
  id,
  title,
  venues,
  loading,
  onBookVenue,
  userLocation
}) {
  const [selectedSport, setSelectedSport] = useState('all')

  const filteredVenues = useMemo(() => {
    if (selectedSport === 'all' || !selectedSport) {
      return venues
    }
    const sportFilter = sports.find(s => s.id === selectedSport)
    if (!sportFilter) return venues

    return venues.filter(venue => {
      // Check if venue facilities include the selected sport
      const facilities = venue.facilities || []
      return facilities.some(facility =>
        facility.toLowerCase().includes(sportFilter.value.toLowerCase()) ||
        sportFilter.value.toLowerCase().includes(facility.toLowerCase())
      )
    })
  }, [venues, selectedSport])

  return (
    <section id={id} className="venues-section">
      <div className="container">
        <div className="section-head">
          <div>
            <h3>{title}</h3>
            {id === 'featured' && (
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: '400',
                margin: '4px 0 0 0'
              }}>
                Sân tập tốt nhất được lựa chọn
              </p>
            )}
            {id === 'recent' && (
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: '400',
                margin: '4px 0 0 0'
              }}>
                Khu vực được đề xuất gần vị trí của bạn
              </p>
            )}
          </div>
        </div>

        <div className="sport-filters">
          <div className="sport-filters-header">
            <Filter size={18} />
            <span>Lọc theo môn thể thao</span>
          </div>
          <div className="sport-filters-list">
            {sports.map((sport) => (
              <button
                key={sport.id}
                className={`sport-filter-btn ${selectedSport === sport.id ? 'active' : ''}`}
                onClick={() => setSelectedSport(sport.id)}
              >
                {sport.name}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <Slider itemWidth={300} gap={16} loop={true}>
            {[...Array(id === 'featured' ? 4 : 8)].map((_, i) => (
              <div key={i}>
                <SkeletonVenueCard />
              </div>
            ))}
          </Slider>
        ) : filteredVenues.length > 0 ? (
          <Slider itemWidth={300} gap={16} loop={true}>
            {filteredVenues.map((venue) => (
              <div key={venue.id}>
                <VenueCard
                  venueId={venue.id}
                  image={venue.image || venue.images?.[0] || venue.imageUrl}
                  name={venue.name}
                  address={venue.address}
                  rating={venue.rating ?? venue.averageRating ?? 0}
                  totalReviews={venue.totalReviews || 0}
                  open={venue.operatingHours || venue.hours}
                  price={venue.price || venue.pricePerHour}
                  sports={venue.facilities || (venue.sportCategory ? [venue.sportCategory] : [])}
                  services={venue.services || []}
                  onBook={() => onBookVenue(venue.id)}
                  userLocation={userLocation}
                  facilityLocation={venue.location}
                />
              </div>
            ))}
          </Slider>
        ) : (
          <div className="no-venues-message">
            <p>Không tìm thấy sân thể thao nào cho môn này.</p>
          </div>
        )}
      </div>
    </section>
  )
}


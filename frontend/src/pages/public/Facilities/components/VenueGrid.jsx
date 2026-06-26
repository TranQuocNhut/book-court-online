import React from 'react'
import VenueCard from '../../../../components/VenueCard'
import { SkeletonVenueCard } from '../../../../components/ui/Skeleton'
import '../../../../styles/Facilities.css'

export default function VenueGrid({ facilities, loading, onBookVenue, userLocation }) {
  if (loading) {
    return (
      <div className="venues-grid">
        {[...Array(6)].map((_, i) => (
          <SkeletonVenueCard key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="venues-grid">
      {facilities.map(f => (
        <VenueCard
          key={f.id}
          venueId={f.id}
          image={f.image}
          name={f.name}
          address={`${f.district}, ${f.city}`}
          rating={f.rating ?? f.averageRating ?? 0}
          totalReviews={f.totalReviews || 0}
          open={f.open}
          price={f.price || null}
          sports={f.sports || (f.sport ? [f.sport] : [])}
          status={f.status}
          services={f.services || []}
          onBook={() => onBookVenue?.(f.id)}
          userLocation={userLocation}
          facilityLocation={f.location}
        />
      ))}
    </div>
  )
}


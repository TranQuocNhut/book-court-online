import React, { useState, useEffect } from 'react'
import FavoritesTab from '../tabs/FavoritesTab'
import { userApi } from '../../../../api/userApi'
import { toast } from 'react-toastify'
import useUserLocation from '../../../../hook/use-user-location'

export default function Favorites() {
  const [favoriteVenues, setFavoriteVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const { userLocation } = useUserLocation()

  // Transform facility data to venue format
  const transformFacilityToVenue = (facility) => {
    // Format operating hours
    const formatOperatingHours = (hours) => {
      if (!hours) return null
      
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const today = days[new Date().getDay()]
      const todayHours = hours[today]
      
      if (todayHours && todayHours.isOpen) {
        return `${todayHours.open} - ${todayHours.close}`
      }
      
      for (const day of days) {
        if (hours[day] && hours[day].isOpen) {
          return `${hours[day].open} - ${hours[day].close}`
        }
      }
      
      return '06:00 - 22:00'
    }

    // Format price
    const formatPrice = (pricePerHour) => {
      if (!pricePerHour) return null
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
      }).format(pricePerHour)
    }

    return {
      id: facility._id || facility.id,
      name: facility.name,
      address: facility.address,
      rating: facility.averageRating || facility.rating || 0,
      totalReviews: facility.totalReviews || 0,
      price: formatPrice(facility.pricePerHour),
      operatingHours: formatOperatingHours(facility.operatingHours),
      image: facility.images && facility.images.length > 0 
        ? facility.images[0].url 
        : null,
      images: facility.images?.map(img => img.url) || [],
      facilities: facility.types || [],
      sportCategory: facility.types?.[0] || null,
      sport: facility.types?.[0] || null,
      status: facility.status === 'opening' ? 'Còn trống' : 'Đóng cửa',
      location: facility.location || null,
      services: facility.services || []
    }
  }

  // Fetch favorite facilities
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true)
        
        // Lấy danh sách favorites từ API
        const result = await userApi.getFavorites()
        
        if (result.success && result.data?.favorites) {
          // Transform facilities từ API response
          const transformedFacilities = result.data.favorites.map(facility => 
            transformFacilityToVenue(facility)
          )
          
          setFavoriteVenues(transformedFacilities)
        } else {
          setFavoriteVenues([])
        }
      } catch (error) {
        console.error('Error fetching favorites:', error)
        toast.error('Không thể tải danh sách sân yêu thích')
        setFavoriteVenues([])
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
    
    // Custom event để cập nhật khi thêm/xóa favorite từ VenueCard
    const handleFavoritesUpdated = () => {
      fetchFavorites()
    }

    window.addEventListener('favoritesUpdated', handleFavoritesUpdated)

    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdated)
    }
  }, [])

  return <FavoritesTab venues={favoriteVenues} loading={loading} userLocation={userLocation} />
}


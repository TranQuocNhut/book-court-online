import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import HeroSection from './HomePage/components/HeroSection'
import SearchBar from './HomePage/components/SearchBar'
import FeaturesSection from './HomePage/components/FeaturesSection'
import PopularLocationsSection from './HomePage/components/PopularLocationsSection'
import VenuesSection from './HomePage/components/VenuesSection'
import { scrollToElement, buildSearchParams } from './HomePage/utils/helpers'
import { getProvinces } from '../../api/provinceApi'
import { facilityApi } from '../../api/facilityApi'
import { toast } from 'react-toastify'
import useUserLocation from '../../hook/use-user-location'
import '../../styles/HomePage.css'

function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { userLocation } = useUserLocation()
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [selectedProvince, setSelectedProvince] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedSport, setSelectedSport] = useState('')
  const [loading, setLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [facilitiesLoading, setFacilitiesLoading] = useState(true)
  const [facilities, setFacilities] = useState([])
  const [featuredFacilities, setFeaturedFacilities] = useState([])

  const handleBookVenue = (venueId) => {
    navigate(`/booking?venue=${venueId}`)
  }

  const scrollToFeatured = () => {
    scrollToElement('featured')
  }

  const scrollToRecent = () => {
    scrollToElement('recent')
  }

  // Transform facility data to venue format
  const transformFacilityToVenue = (facility) => {
    // Format operating hours
    const formatOperatingHours = (hours) => {
      if (!hours) return null
      
      // Get current day
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const today = days[new Date().getDay()]
      const todayHours = hours[today]
      
      if (todayHours && todayHours.isOpen) {
        return `${todayHours.open} - ${todayHours.close}`
      }
      
      // Fallback: return first available day
      for (const day of days) {
        if (hours[day] && hours[day].isOpen) {
          return `${hours[day].open} - ${hours[day].close}`
        }
      }
      
      return '06:00 - 22:00'
    }

    // Format price range
    const formatPrice = (priceRange, pricePerHour) => {
      // Ưu tiên sử dụng priceRange nếu có
      if (priceRange && priceRange.min !== undefined && priceRange.max !== undefined) {
        const minFormatted = new Intl.NumberFormat('vi-VN', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(priceRange.min);
        const maxFormatted = new Intl.NumberFormat('vi-VN', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(priceRange.max);
        return `${minFormatted} - ${maxFormatted} VND`;
      }
      // Fallback về pricePerHour nếu không có priceRange
      if (pricePerHour) {
        const formatted = new Intl.NumberFormat('vi-VN', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(pricePerHour);
        return `${formatted} VND`;
      }
      return null;
    }

    return {
      id: facility._id || facility.id,
      name: facility.name,
      address: facility.address,
      rating: facility.averageRating || facility.rating || 0,
      totalReviews: facility.totalReviews || 0,
      price: formatPrice(facility.priceRange, facility.pricePerHour),
      operatingHours: formatOperatingHours(facility.operatingHours),
      image: facility.images && facility.images.length > 0 
        ? facility.images[0].url 
        : null,
      images: facility.images?.map(img => img.url) || [],
      facilities: facility.types || [],
      sportCategory: facility.types?.[0] || null,
      status: facility.status === 'opening' ? 'Còn trống' : 'Đóng cửa',
      location: facility.location || null,
      services: facility.services || []
    }
  }

  // Fetch facilities data from API
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setFacilitiesLoading(true)
        
        // Fetch featured and recent facilities in parallel
        const [featuredResult, recentResult] = await Promise.all([
          facilityApi.getFeaturedFacilities({ limit: 4 }),
          facilityApi.getRecentFacilities({ limit: 8 })
        ])
        
        // Process featured facilities
        if (featuredResult.success && featuredResult.data && featuredResult.data.facilities) {
          const transformedFeatured = featuredResult.data.facilities.map(transformFacilityToVenue)
          setFeaturedFacilities(transformedFeatured)
        } else {
          console.warn('No featured facilities data received')
          setFeaturedFacilities([])
        }
        
        // Process recent facilities
        if (recentResult.success && recentResult.data && recentResult.data.facilities) {
          const transformedRecent = recentResult.data.facilities.map(transformFacilityToVenue)
          setFacilities(transformedRecent)
        } else {
          console.warn('No recent facilities data received')
          setFacilities([])
        }
      } catch (error) {
        console.error('Error fetching facilities:', error)
        setFacilities([])
        setFeaturedFacilities([])
        toast.error('Không thể tải danh sách sân thể thao. Vui lòng thử lại sau.')
      } finally {
        setFacilitiesLoading(false)
      }
    }
    
    fetchFacilities()
  }, [])

  // Fetch provinces data from API
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const result = await getProvinces()
        
        if (result.success && result.data && result.data.length > 0) {
          setProvinces(result.data)
        } else {
          console.warn('No provinces data received')
          setProvinces([])
          if (result.error) {
            toast.error(result.error)
          }
        }
      } catch (error) {
        console.error('Error fetching provinces:', error)
        setProvinces([])
        toast.error('Không thể tải danh sách tỉnh thành. Vui lòng thử lại sau.')
      }
    }
    fetchProvinces()
  }, [])

  // Update page loading state when both facilities and provinces are loaded
  useEffect(() => {
    if (!facilitiesLoading) {
      setIsPageLoading(false)
    }
  }, [facilitiesLoading])

  // Fetch districts when province changes
  useEffect(() => {
    if (selectedProvince) {
      const province = provinces.find(p => p.name === selectedProvince)
      if (province && province.districts) {
        setDistricts(province.districts)
        setSelectedDistrict('')
      }
    } else {
      setDistricts([])
      setSelectedDistrict('')
    }
  }, [selectedProvince, provinces])

  const handleSearch = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      const params = buildSearchParams(selectedSport, selectedProvince, selectedDistrict)
      navigate(`/facilities?${params}`)
    }, 1000)
  }

  return (
    <main>
      <HeroSection 
        onScrollToFeatured={scrollToFeatured}
        onScrollToRecent={scrollToRecent}
        searchBarProps={{
          selectedSport,
          selectedProvince,
          selectedDistrict,
          provinces,
          districts,
          loading,
          onSportChange: setSelectedSport,
          onProvinceChange: setSelectedProvince,
          onDistrictChange: setSelectedDistrict,
          onSearch: handleSearch
        }}
      />

      <VenuesSection
        id="featured"
        title="Sân thể thao nổi bật"
        venues={featuredFacilities}
        loading={facilitiesLoading}
        onBookVenue={handleBookVenue}
        userLocation={userLocation}
      />

      <VenuesSection
        id="recent"
        title="Sân thể thao gần đây"
        venues={facilities}
        loading={facilitiesLoading}
        onBookVenue={handleBookVenue}
        userLocation={userLocation}
      />

      <PopularLocationsSection />

      <FeaturesSection />
    </main>
  )
}

export default HomePage

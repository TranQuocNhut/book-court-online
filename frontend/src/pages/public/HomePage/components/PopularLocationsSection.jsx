import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, ArrowRight } from 'lucide-react'
import { facilityApi } from '../../../../api/facilityApi'
import { toast } from 'react-toastify'
import { cityAssets, defaultAssets } from '../cityAssets'
import '../../../../styles/HomePage.css'

export default function PopularLocationsSection() {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const sectionRef = useRef(null)

  // Fetch popular cities from API và merge với cityAssets
  useEffect(() => {
    const fetchPopularCities = async () => {
      try {
        setLoading(true)
        
        // Tạo locations từ cityAssets trước (luôn hiển thị)
        const initialLocations = Object.keys(cityAssets).map((cityName, index) => {
          const assets = cityAssets[cityName]
          return {
            id: index + 1,
            name: cityName,
            fullName: cityName,
            district: assets.district || '',
            venuesCount: 0, // Mặc định 0, sẽ được cập nhật từ API
            image: assets.image,
            gradient: assets.gradient
          }
        })
        
        // Set locations ban đầu để hiển thị ngay
        setLocations(initialLocations)
        
        // Fetch dữ liệu từ API để cập nhật count
        try {
          const result = await facilityApi.getPopularCities()
          
          if (result.success && result.data && Array.isArray(result.data)) {
            // Tạo map từ API data để dễ lookup
            const apiDataMap = new Map()
            result.data.forEach(city => {
              apiDataMap.set(city.name, city.count)
            })
            
            // Cập nhật venuesCount từ API data
            const updatedLocations = initialLocations.map(location => {
              const count = apiDataMap.get(location.name) || 0
              return {
                ...location,
                venuesCount: count
              }
            })
            
            setLocations(updatedLocations)
          }
        } catch (apiError) {
          // Nếu API fail, vẫn giữ locations từ cityAssets với count = 0
          console.warn('Could not fetch city counts from API, using default data:', apiError)
        }
      } catch (error) {
        console.error('Error initializing popular cities:', error)
        // Fallback: vẫn hiển thị locations từ cityAssets
        const fallbackLocations = Object.keys(cityAssets).map((cityName, index) => {
          const assets = cityAssets[cityName]
          return {
            id: index + 1,
            name: cityName,
            fullName: cityName,
            district: assets.district || '',
            venuesCount: 0,
            image: assets.image,
            gradient: assets.gradient
          }
        })
        setLocations(fallbackLocations)
      } finally {
        setLoading(false)
      }
    }

    fetchPopularCities()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  const handleLocationClick = (location) => {
    // Navigate với province filter sử dụng fullName hoặc name
    const provinceName = location.fullName || location.name
    navigate(`/facilities?province=${encodeURIComponent(provinceName)}`)
  }

  return (
    <section ref={sectionRef} className="popular-locations-section">
      <div className="locations-container">
        <div className="locations-header">
          <div className="locations-badge">
            <MapPin size={16} />
            Địa điểm phổ biến
          </div>
          <h2 className="locations-title">
            Khám phá sân thể thao tại các thành phố
          </h2>
          <p className="locations-subtitle">
            Tìm kiếm và đặt sân tại những địa điểm được yêu thích nhất
          </p>
        </div>

        {loading ? (
          <div className="locations-loading">
            <p>Đang tải danh sách thành phố...</p>
          </div>
        ) : (
          <div className={`locations-grid ${isVisible ? 'visible' : ''}`}>
            {locations.map((location, index) => (
              <div
                key={location.id}
                className="location-card"
                onClick={() => handleLocationClick(location)}
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="location-image-wrapper">
                  <img 
                    src={location.image} 
                    alt={location.name}
                    className="location-image"
                  />
                  <div 
                    className="location-overlay"
                    style={{
                      background: location.gradient
                    }}
                  />
                </div>
                
                <div className="location-content">
                  <div className="location-info">
                    <h3 className="location-name">{location.name}</h3>
                    {location.district && (
                      <p className="location-district">{location.district}</p>
                    )}
                  </div>
                  <div className="location-stats">
                    <span className="location-venues-count">
                      {location.venuesCount > 0 ? `${location.venuesCount}+ sân` : 'Chưa có sân'}
                    </span>
                    <ArrowRight size={18} className="location-arrow" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}


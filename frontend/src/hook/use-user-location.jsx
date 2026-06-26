import { useState, useEffect } from 'react'

export default function useUserLocation() {
  const [userLocation, setUserLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Lấy vị trí từ localStorage nếu có (cache 5 phút)
    const cachedLocation = localStorage.getItem('userLocation')
    const cachedTime = localStorage.getItem('userLocationTime')
    
    if (cachedLocation && cachedTime) {
      const timeDiff = Date.now() - parseInt(cachedTime)
      if (timeDiff < 5 * 60 * 1000) { // 5 phút
        try {
          const location = JSON.parse(cachedLocation)
          setUserLocation(location)
          setLoading(false)
          return
        } catch (e) {
          // Invalid cache, continue to fetch
        }
      }
    }

    // Lấy vị trí mới
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
        setUserLocation(location)
        setLoading(false)
        // Cache vị trí
        localStorage.setItem('userLocation', JSON.stringify(location))
        localStorage.setItem('userLocationTime', Date.now().toString())
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000 // 5 phút
      }
    )
  }, [])

  return { userLocation, loading, error }
}


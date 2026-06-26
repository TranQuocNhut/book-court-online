import { useState, useEffect, useRef } from 'react'

/**
 * Hook để detect loại thiết bị dựa trên kích thước màn hình với debounce
 * @param {number} delay - Thời gian debounce delay (mặc định: 150ms)
 * @returns {Object} - Object chứa các boolean flags cho từng loại thiết bị
 * 
 * @example
 * const { isMobile, isTablet, isDesktop } = useDeviceType()
 */
export function useDeviceType(delay = 150) {
  const [deviceType, setDeviceType] = useState(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth
      return {
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024
      }
    }
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true
    }
  })

  const timeoutRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const updateDeviceType = () => {
      const width = window.innerWidth
      setDeviceType({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024
      })
    }

    const handleResize = () => {
      // Clear timeout trước đó nếu có
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set timeout mới với debounce delay
      timeoutRef.current = setTimeout(() => {
        updateDeviceType()
      }, delay)
    }

    // Set initial value ngay lập tức (không debounce lần đầu)
    updateDeviceType()
    
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      // Clear timeout khi cleanup
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [delay])

  return deviceType
}

export default useDeviceType

